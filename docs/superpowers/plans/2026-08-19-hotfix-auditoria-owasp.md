# Hotfix y cierre de auditoría OWASP — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir un bug de renovación ya en producción (violación del índice único
`uq_membresia_activa`), cerrar el acceso público a la función `registrar_venta` sin
validación de promociones, escapar el HTML de los correos transaccionales, y
reemplazar el envío de contraseñas en claro por un flujo de invitación de un solo
uso (`generateLink`) para altas de miembros y de personal.

**Architecture:** Cambios puntuales sobre `src/app/admin/miembros/actions.ts`,
`src/app/admin/usuarios/actions.ts` y `src/lib/correo/correo.ts`, más una nueva
pantalla de activación (`/activar-cuenta`) que reutiliza `PantallaAuth`. Dos
migraciones SQL nuevas en `supabase/migrations/` (carpeta que hoy no existe en el
repo) aplicadas vía Supabase MCP.

**Tech Stack:** Next.js (Server Actions), Supabase (Postgres + Auth Admin API),
MailerSend, Vitest.

**Spec:** [`docs/SEGURIDAD-OWASP-VERIFICACION.md`](../../SEGURIDAD-OWASP-VERIFICACION.md)
(actualizado en la Tarea 9 de este plan con los hallazgos reales, verificados vía
Supabase MCP el 2026-08-19).

## Global Constraints

- Sin `className="orum-*"`, sin literales de color/espaciado, sin `style={{...}}` para maquetar (CLAUDE.md).
- Páginas nuevas = Server Components; `'use client'` solo en hojas interactivas.
- Pruebas automatizadas solo de funciones puras (Vitest). Server actions y UI se verifican a mano.
- `crearComercio` (`src/app/admin/comercios/actions.ts`) queda **fuera de alcance**: no envía correo con contraseña (solo la muestra una vez en pantalla), así que el punto 5 de la auditoría no le aplica. No tocar ese archivo en este plan.
- Toda pantalla de acceso usa `PantallaAuth` / `estilosAuth` — nunca una tarjeta propia.
- Antes de dar una tarea por terminada: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `supabase/migrations/20260819120000_revoke_registrar_venta_execute.sql` | Crear | Revoca `EXECUTE` de `registrar_venta` a `anon`/`authenticated` |
| `src/app/admin/miembros/actions.ts` | Modificar | Hotfix de orden en `renovarMembresia`; `registrarMiembro` pasa a invitación |
| `src/lib/shared/html.ts` | Crear | `escaparHtml`, función pura |
| `src/lib/shared/html.test.ts` | Crear | Tests de `escaparHtml` |
| `src/lib/correo/correo.ts` | Modificar | Reemplaza el correo de contraseña por el de invitación, con escape |
| `src/lib/correo/correo.test.ts` | Modificar | Tests del nuevo `construirCorreoInvitacion` |
| `src/app/activar-cuenta/page.tsx` | Crear | Pantalla de activación (Server Component + `PantallaAuth`) |
| `src/app/activar-cuenta/_components/activar-form.tsx` | Crear | Formulario cliente: confirma sesión de invitación y fija contraseña |
| `src/app/admin/usuarios/actions.ts` | Modificar | `crearUsuario` pasa a invitación |
| `src/app/admin/miembros/_components/miembro-form.tsx` | Modificar | Pantalla de credenciales ya no muestra contraseña |
| `src/app/admin/usuarios/nuevo/_components/usuario-form.tsx` | Modificar | Ídem para alta de personal |
| `docs/SEGURIDAD-OWASP-VERIFICACION.md` | Modificar | Corrige puntos 1/2, documenta hallazgos nuevos y cierre |

---

### Task 1: Hotfix — orden de escritura en `renovarMembresia`

**Files:**
- Modify: `src/app/admin/miembros/actions.ts:223-310` (función `renovarMembresia`)

**Interfaces:**
- Consumes: nada nuevo — misma firma `renovarMembresia(_prev: RenovarState, formData: FormData)`.
- Produces: sin cambios en `RenovarState`.

**Contexto:** `uq_membresia_activa` (índice único sobre `membresias(miembro_id) WHERE estado = 'activa'`, ya existe en producción) rechaza el `INSERT` de la nueva membresía mientras la anterior siga `'activa'`. Hoy el código inserta la nueva **antes** de vencer la anterior, así que toda renovación de un miembro con membresía activa falla con un error de llave duplicada.

- [ ] **Step 1: Confirmar el bug con una simulación SQL de solo lectura (rollback)**

Vía el MCP de Supabase (`execute_sql`), sustituyendo `<ID_MIEMBRO_REAL>` por el `id` de un miembro que **ya tenga** una membresía `'activa'` (verificar antes con `select id from miembros where deleted_at is null limit 1` y cruzar con `membresias`):

```sql
begin;
insert into membresias (miembro_id, plan_id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado)
select miembro_id, plan_id, 'renovada', 'activa', current_date, current_date + 30, 0
from membresias where miembro_id = <ID_MIEMBRO_REAL> and estado = 'activa' limit 1;
rollback;
```

Expected: error `duplicate key value violates unique constraint "uq_membresia_activa"`. Esto confirma el bug antes de tocar código (no deja rastro: todo dentro de la transacción se revierte).

- [ ] **Step 2: Reordenar la escritura — vencer primero, insertar después**

Reemplazar el cuerpo de `renovarMembresia` (líneas 223-310) por:

```ts
export async function renovarMembresia(
  _prev: RenovarState,
  formData: FormData,
): Promise<RenovarState> {
  const actor = await exigirEmpleadoOAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const miembro_id = Number(formData.get('miembro_id'))
  const plan_id = Number(formData.get('plan_id'))
  const precio_pagado = Number(formData.get('precio_pagado'))
  if (!Number.isInteger(miembro_id) || miembro_id < 1) return { error: 'Falta el identificador del miembro.' }
  if (!Number.isInteger(plan_id) || plan_id < 1) return { error: 'Selecciona un plan de membresía.' }
  if (!Number.isFinite(precio_pagado) || precio_pagado < 0) {
    return { error: 'El precio pagado debe ser un número mayor o igual a 0.' }
  }

  const admin = createAdminClient()

  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, nombre, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }

  // Membresía vigente (activa), si existe.
  const { data: vigente } = await admin
    .from('membresias')
    .select('id, fecha_fin')
    .eq('miembro_id', miembro_id)
    .eq('estado', 'activa')
    .order('fecha_fin', { ascending: false })
    .limit(1)
    .maybeSingle()

  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const fecha_inicio = calcularFechaInicioRenovacion(hoyISO(), vigente?.fecha_fin ?? null)
  const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_meses)

  // La anterior pasa a 'vencida' ANTES de insertar la nueva: uq_membresia_activa
  // (índice único sobre membresias(miembro_id) WHERE estado='activa') rechaza el
  // INSERT si sigue habiendo una fila 'activa' para este miembro. Si el INSERT de
  // abajo falla, se revierte este UPDATE para no dejar al miembro sin membresía.
  if (vigente) {
    const { error: errVencer } = await admin
      .from('membresias')
      .update({ estado: 'vencida' })
      .eq('id', vigente.id)
    if (errVencer) {
      return { error: `No se pudo completar la renovación: ${errVencer.message}` }
    }
  }

  const { data: nueva, error: errNueva } = await admin
    .from('membresias')
    .insert({
      miembro_id,
      plan_id,
      tipo: 'renovada',
      estado: 'activa',
      fecha_inicio,
      fecha_fin,
      precio_pagado,
      vendido_por: empleadoId,
      membresia_anterior_id: vigente?.id ?? null,
    })
    .select('id')
    .single()
  if (errNueva || !nueva) {
    if (vigente) {
      await admin.from('membresias').update({ estado: 'activa' }).eq('id', vigente.id)
    }
    return { error: `No se pudo registrar la renovación: ${errNueva?.message ?? 'error desconocido'}` }
  }

  await registrarActividad(admin, {
    actorId: actor.userId,
    accion: 'renovacion',
    entidadId: miembro_id,
    datosNuevos: {
      plan_nombre: plan.nombre,
      fecha_inicio,
      fecha_fin,
      precio_pagado,
    },
  })

  revalidatePath('/admin/miembros')
  revalidatePath(`/admin/miembros/${miembro_id}`)
  return {}
}
```

- [ ] **Step 3: Repetir la simulación del Step 1 con el nuevo orden**

```sql
begin;
update membresias set estado = 'vencida'
where miembro_id = <ID_MIEMBRO_REAL> and estado = 'activa';
insert into membresias (miembro_id, plan_id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado)
values (<ID_MIEMBRO_REAL>, (select plan_id from membresias where miembro_id = <ID_MIEMBRO_REAL> order by fecha_fin desc limit 1), 'renovada', 'activa', current_date, current_date + 30, 0);
rollback;
```

Expected: ambas sentencias corren sin error (sin `duplicate key`). `rollback` deja la base intacta.

- [ ] **Step 4: Verificar en la app** — desde `/admin/miembros/[id]`, renovar un miembro que ya tenga membresía activa. Confirmar que no aparece el error y que en la base solo queda una fila `'activa'` para ese miembro:

```sql
select id, estado, fecha_fin from membresias where miembro_id = <ID_MIEMBRO_REAL> order by fecha_fin desc;
```

Expected: exactamente una fila con `estado = 'activa'`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/miembros/actions.ts"
git commit -m "fix: renovarMembresia vencia la membresia anterior antes de insertar la nueva"
```

---

### Task 2: Cerrar el acceso público a `registrar_venta`

**Files:**
- Create: `supabase/migrations/20260819120000_revoke_registrar_venta_execute.sql`

**Interfaces:**
- Consumes: nada.
- Produces: nada que otras tareas consuman — es un cambio de permisos aislado.

**Contexto:** `registrar_venta` (función `SECURITY DEFINER` en la base, no llamada por
el código de la app — el código usa un `insert` directo con validaciones propias en
`src/app/comercios/(portal)/actions.ts`) no valida que la promoción sea del comercio
ni revalida su vigencia, y confía en el `p_valor_descuento` recibido. Está expuesta
por REST a `authenticated`. Como no la usa nadie, se revoca el acceso en vez de
arreglarla — menos superficie que mantener.

- [ ] **Step 1: Escribir la migración**

```sql
-- supabase/migrations/20260819120000_revoke_registrar_venta_execute.sql
revoke execute on function public.registrar_venta(
  bigint, numeric, public.metodo_registro_venta, text, uuid, bigint, numeric
) from anon, authenticated;
```

- [ ] **Step 2: Aplicarla vía el MCP de Supabase**

Usar `mcp__supabase__apply_migration` con `name: "revoke_registrar_venta_execute"` y el contenido de arriba como `query`.

- [ ] **Step 3: Verificar**

```sql
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'registrar_venta'
order by grantee;
```

Expected: solo `postgres` y `service_role` (ya no `anon` ni `authenticated`).

- [ ] **Step 4: Commit**

```bash
git add "supabase/migrations/20260819120000_revoke_registrar_venta_execute.sql"
git commit -m "security: revocar EXECUTE de registrar_venta a anon/authenticated"
```

---

### Task 3: `escaparHtml` — función pura + tests

**Files:**
- Create: `src/lib/shared/html.ts`
- Test: `src/lib/shared/html.test.ts`

**Interfaces:**
- Produces: `escaparHtml(valor: string): string` — usada por la Tarea 4.

- [ ] **Step 1: Escribir la prueba que falla**

```ts
// src/lib/shared/html.test.ts
import { describe, it, expect } from 'vitest'
import { escaparHtml } from './html'

describe('escaparHtml', () => {
  it('escapa las cinco entidades HTML', () => {
    expect(escaparHtml(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    )
  })

  it('neutraliza una inyección de imagen con onerror', () => {
    const entrada = 'Juan <img src=x onerror=alert(1)>'
    const salida = escaparHtml(entrada)
    expect(salida).not.toContain('<img')
    expect(salida).toBe('Juan &lt;img src=x onerror=alert(1)&gt;')
  })

  it('deja intacto un texto sin caracteres especiales', () => {
    expect(escaparHtml('Ana Ruiz')).toBe('Ana Ruiz')
  })
})
```

- [ ] **Step 2: Confirmar que falla**

Run: `pnpm exec vitest run src/lib/shared/html.test.ts`
Expected: FAIL — `Cannot find module './html'`.

- [ ] **Step 3: Implementar**

```ts
// src/lib/shared/html.ts
const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Escapa los caracteres que rompen HTML, para interpolar texto de usuario en correos. */
export function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (c) => ENTIDADES[c])
}
```

- [ ] **Step 4: Confirmar que pasa**

Run: `pnpm exec vitest run src/lib/shared/html.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add "src/lib/shared/html.ts" "src/lib/shared/html.test.ts"
git commit -m "feat: agregar escaparHtml para interpolar texto de usuario en correos"
```

---

### Task 4: Reemplazar el correo de contraseña por el de invitación

**Files:**
- Modify: `src/lib/correo/correo.ts`
- Modify: `src/lib/correo/correo.test.ts`

**Interfaces:**
- Consumes: `escaparHtml` de la Tarea 3.
- Produces: `construirCorreoInvitacion(input: InputCorreoInvitacion)`, `enviarCorreoInvitacion(input: InputCorreoInvitacion)` — consumidos por las Tareas 6 y 7.
  - `InputCorreoInvitacion = { nombre: string; correo: string; urlInvitacion: string }`

- [ ] **Step 1: Reescribir el test primero**

```ts
// src/lib/correo/correo.test.ts
import { describe, it, expect } from 'vitest'
import { construirCorreoInvitacion } from './correo'

describe('construirCorreoInvitacion', () => {
  const base = {
    nombre: 'Ana Ruiz',
    correo: 'ana@example.com',
    urlInvitacion: 'https://orum.example.com/activar-cuenta?token=abc123',
  }

  it('arma el asunto fijo', () => {
    const correo = construirCorreoInvitacion(base)
    expect(correo.asunto).toBe('Bienvenido a ORUM — activa tu cuenta')
  })

  it('incluye el enlace de invitación y ninguna contraseña', () => {
    const correo = construirCorreoInvitacion(base)
    expect(correo.html).toContain(base.urlInvitacion)
    expect(correo.texto).toContain(base.urlInvitacion)
    expect(correo.html).not.toMatch(/contraseña\s*:?\s*\S/i)
  })

  it('saluda por nombre', () => {
    const correo = construirCorreoInvitacion(base)
    expect(correo.html).toContain('Hola Ana Ruiz')
    expect(correo.texto).toContain('Hola Ana Ruiz')
  })

  it('escapa nombre y correo en el html pero no en el texto plano', () => {
    const correo = construirCorreoInvitacion({
      ...base,
      nombre: 'Juan <img src=x onerror=alert(1)>',
    })
    expect(correo.html).not.toContain('<img')
    expect(correo.html).toContain('&lt;img')
    expect(correo.texto).toContain('Juan <img src=x onerror=alert(1)>')
  })
})
```

- [ ] **Step 2: Confirmar que falla**

Run: `pnpm exec vitest run src/lib/correo/correo.test.ts`
Expected: FAIL — `construirCorreoInvitacion` no existe todavía.

- [ ] **Step 3: Reescribir `correo.ts`**

```ts
// src/lib/correo/correo.ts
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { escaparHtml } from '@/lib/shared/html'

export type InputCorreoInvitacion = {
  nombre: string
  correo: string
  urlInvitacion: string
}

type CuerpoCorreo = {
  asunto: string
  html: string
  texto: string
}

export function construirCorreoInvitacion(input: InputCorreoInvitacion): CuerpoCorreo {
  const nombre = escaparHtml(input.nombre)
  const correo = escaparHtml(input.correo)
  const asunto = 'Bienvenido a ORUM — activa tu cuenta'

  const html = `
    <p>Hola ${nombre},</p>
    <p>Se creó tu cuenta en ORUM (${correo}). Activa el acceso y elige tu propia
    contraseña con este enlace de un solo uso:</p>
    <p><a href="${input.urlInvitacion}">Activar mi cuenta</a></p>
    <p>Si no esperabas este correo, puedes ignorarlo.</p>
  `.trim()

  const texto = [
    `Hola ${input.nombre},`,
    '',
    `Se creó tu cuenta en ORUM (${input.correo}). Activa el acceso y elige tu propia`,
    'contraseña con este enlace de un solo uso:',
    '',
    input.urlInvitacion,
    '',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n')

  return { asunto, html, texto }
}

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY ?? '' })

export async function enviarCorreoInvitacion(input: InputCorreoInvitacion): Promise<void> {
  const { asunto, html, texto } = construirCorreoInvitacion(input)

  try {
    const remitente = new Sender(process.env.MAILERSEND_FROM_EMAIL ?? '', 'ORUM')
    const destinatarios = [new Recipient(input.correo, input.nombre)]

    const emailParams = new EmailParams()
      .setFrom(remitente)
      .setTo(destinatarios)
      .setSubject(asunto)
      .setHtml(html)
      .setText(texto)

    await mailerSend.email.send(emailParams)
  } catch (err) {
    console.error('No se pudo enviar el correo de invitación:', err)
  }
}
```

- [ ] **Step 4: Confirmar que pasa**

Run: `pnpm exec vitest run src/lib/correo/correo.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add "src/lib/correo/correo.ts" "src/lib/correo/correo.test.ts"
git commit -m "security: reemplazar el correo de contraseña por uno de invitacion con html escapado"
```

---

### Task 5: Pantalla de activación `/activar-cuenta`

**Files:**
- Create: `src/app/activar-cuenta/page.tsx`
- Create: `src/app/activar-cuenta/_components/activar-form.tsx`

**Interfaces:**
- Consumes: `PantallaAuth`, `estilosAuth` (`src/components/ui/pantalla-auth.tsx`), `createClient` de `src/lib/supabase/client.ts`.
- Produces: la ruta `/activar-cuenta?rol=miembro|staff` que consumen las Tareas 6 y 7 como `redirectTo`.

**Contexto:** El enlace de `generateLink` redirige aquí con la sesión codificada en el
fragmento de la URL (`#access_token=...`). `createBrowserClient` de `@supabase/ssr`
la detecta sola al montar y la guarda en cookies (por eso el resto del sitio, que lee
la sesión en el servidor, la ve también). Esta pantalla solo confirma que hay sesión
y deja fijar la contraseña con `supabase.auth.updateUser`.

- [ ] **Step 1: Crear la página (Server Component)**

```tsx
// src/app/activar-cuenta/page.tsx
import { Suspense } from 'react'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { ActivarForm } from './_components/activar-form'

export default function ActivarCuentaPage() {
  return (
    <PantallaAuth subtitulo="Activa tu cuenta">
      <Suspense>
        <ActivarForm />
      </Suspense>
    </PantallaAuth>
  )
}
```

- [ ] **Step 2: Crear el formulario cliente**

```tsx
// src/app/activar-cuenta/_components/activar-form.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, InputButton } from '@/components/ui/input'
import { estilosAuth } from '@/components/ui/pantalla-auth'
import { createClient } from '@/lib/supabase/client'

type Estado = 'verificando' | 'listo' | 'invalido' | 'guardando'

export function ActivarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destino = searchParams.get('rol') === 'staff' ? '/admin' : '/miembros'

  const [estado, setEstado] = useState<Estado>('verificando')
  const [error, setError] = useState('')
  const [verPassword, setVerPassword] = useState(false)

  // Chequeo único al montar (no una suscripción a store externo): confirma que
  // el enlace de invitación dejó una sesión válida antes de mostrar el formulario.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setEstado(data.session ? 'listo' : 'invalido')
    })
  }, [])

  async function activar(formData: FormData) {
    const nueva = String(formData.get('password') ?? '')
    const repetida = String(formData.get('confirmar') ?? '')

    if (nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== repetida) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setEstado('guardando')
    setError('')

    const supabase = createClient()
    const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva })
    if (errUpdate) {
      setEstado('listo')
      setError('No se pudo activar la cuenta. Intenta de nuevo.')
      return
    }

    router.push(destino)
  }

  if (estado === 'verificando') {
    return <p className={estilosAuth.formulario}>Verificando el enlace…</p>
  }

  if (estado === 'invalido') {
    return (
      <Alert tone="danger" className={estilosAuth.alerta}>
        Este enlace no es válido o ya expiró. Pide que te envíen uno nuevo.
      </Alert>
    )
  }

  return (
    <form action={activar} className={estilosAuth.formulario} noValidate>
      {error && (
        <Alert key={error} tone="danger" className={estilosAuth.alerta}>
          {error}
        </Alert>
      )}

      <Field label="Elige tu contraseña" help="Mínimo 8 caracteres.">
        <Input
          name="password"
          type={verPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          autoFocus
          endAdornment={
            <InputButton
              label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVerPassword((v) => !v)}
            >
              {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </InputButton>
          }
        />
      </Field>

      <Field label="Confirma tu contraseña">
        <Input
          name="confirmar"
          type={verPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={estado === 'guardando'}
        icon={<ShieldCheck size={17} />}
      >
        Activar cuenta
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Verificar a mano**

`pnpm dev`, generar un enlace de prueba con `mcp__supabase__execute_sql` no aplica aquí
(es Admin API, no SQL) — en su lugar, tras completar la Tarea 6, registrar un miembro
de prueba y abrir el enlace del correo real. Confirmar: (a) sin sesión válida se ve
"Este enlace no es válido o ya expiró"; (b) con sesión válida, fijar contraseña
redirige a `/miembros`; (c) `pnpm exec tsc --noEmit` sin errores en estos dos archivos.

- [ ] **Step 4: Commit**

```bash
git add "src/app/activar-cuenta"
git commit -m "feat: pantalla de activacion para el flujo de invitacion por enlace"
```

---

### Task 6: `registrarMiembro` — invitación en vez de contraseña emailada

**Files:**
- Modify: `src/app/admin/miembros/actions.ts`

**Interfaces:**
- Consumes: `enviarCorreoInvitacion` (Tarea 4), ruta `/activar-cuenta?rol=miembro` (Tarea 5).
- Produces: `RegistrarMiembroState = { error?: string; ok?: boolean; numero?: string; correo?: string; nombre?: string }` (sin `password`) — consumido por la Tarea 8.

- [ ] **Step 1: Quitar `generarPassword`, actualizar el tipo de estado**

En el bloque de imports, quitar `import { generarPassword } from '@/lib/shared/password'` y cambiar:

```ts
import { enviarCorreoInvitacion } from '@/lib/correo/correo'
```

Cambiar el tipo:

```ts
export type RegistrarMiembroState = {
  error?: string
  ok?: boolean
  numero?: string
  correo?: string
  nombre?: string
}
```

- [ ] **Step 2: Reemplazar la creación del usuario (paso 5) por invitación**

Reemplazar:

```ts
  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const password = generarPassword()

  // 5) Crear usuario en Auth con el correo real.
  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  })
  if (errAuth || !creado?.user) {
```

por:

```ts
  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // 5) Crear usuario en Auth vía invitación: no se genera ni se envía
  // contraseña, el miembro elige la suya al abrir el enlace de un solo uso.
  const { data: creado, error: errAuth } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: correo,
    options: { redirectTo: `${urlBase}/activar-cuenta?rol=miembro` },
  })
  if (errAuth || !creado?.user) {
```

(La línea `const userId = creado.user.id` que sigue no cambia — `generateLink` también
devuelve `user`.)

- [ ] **Step 3: Reemplazar el envío del correo y el `return` final**

Reemplazar:

```ts
  await enviarCorreoBienvenida({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo,
    password,
    rol: 'miembro',
  })

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
```

por:

```ts
  await enviarCorreoInvitacion({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo,
    urlInvitacion: creado.properties.action_link,
  })

  revalidatePath('/admin/miembros')
  return { ok: true, numero, correo, nombre: `${nombres} ${apellidos}`.trim() }
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc --noEmit` — sin errores en este archivo (confirma que
`RegistrarMiembroState` ya no espera `password` en ningún otro punto hasta ajustar
la Tarea 8, que es la siguiente).

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/miembros/actions.ts"
git commit -m "security: registrarMiembro invita por enlace en vez de emailar una contrasena"
```

---

### Task 7: `crearUsuario` — invitación en vez de contraseña emailada

**Files:**
- Modify: `src/app/admin/usuarios/actions.ts`

**Interfaces:**
- Consumes: `enviarCorreoInvitacion` (Tarea 4), ruta `/activar-cuenta?rol=staff` (Tarea 5).
- Produces: `CrearUsuarioState = { error?: string; ok?: boolean; email?: string }` (sin `password`) — consumido por la Tarea 8.

- [ ] **Step 1: Quitar `generarPassword`, actualizar el tipo de estado**

Quitar `import { generarPassword } from '@/lib/shared/password'`, agregar
`import { enviarCorreoInvitacion } from '@/lib/correo/correo'`, y cambiar:

```ts
export type CrearUsuarioState = {
  error?: string
  ok?: boolean
  email?: string
}
```

- [ ] **Step 2: Reemplazar la creación del usuario por invitación**

Reemplazar:

```ts
  const password = generarPassword()

  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (errAuth || !creado?.user) {
```

por:

```ts
  const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data: creado, error: errAuth } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${urlBase}/activar-cuenta?rol=staff` },
  })
  if (errAuth || !creado?.user) {
```

- [ ] **Step 3: Reemplazar el envío del correo y el `return` final**

Reemplazar:

```ts
  await enviarCorreoBienvenida({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo: email,
    password,
    rol: 'staff',
  })

  revalidatePath('/admin/usuarios')
  return { ok: true, email, password }
```

por:

```ts
  await enviarCorreoInvitacion({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo: email,
    urlInvitacion: creado.properties.action_link,
  })

  revalidatePath('/admin/usuarios')
  return { ok: true, email }
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc --noEmit` (los errores en `usuario-form.tsx` por el `password`
que ya no existe se resuelven en la Tarea 8).

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/usuarios/actions.ts"
git commit -m "security: crearUsuario invita por enlace en vez de emailar una contrasena"
```

---

### Task 8: Actualizar las pantallas de credenciales

**Files:**
- Modify: `src/app/admin/miembros/_components/miembro-form.tsx`
- Modify: `src/app/admin/usuarios/nuevo/_components/usuario-form.tsx`

**Interfaces:**
- Consumes: `RegistrarMiembroState` (Tarea 6), `CrearUsuarioState` (Tarea 7).

- [ ] **Step 1: `miembro-form.tsx` — condición y pantalla de éxito**

Cambiar:

```tsx
  if (state.ok && state.numero && state.password) {
    return <Credenciales estado={state} />
  }
```

por:

```tsx
  if (state.ok && state.numero) {
    return <Credenciales estado={state} />
  }
```

Cambiar la nota bajo el precio pagado:

```tsx
            <p className={styles.nota}>
              Al guardar se generan el número de membresía y una contraseña segura. Se
              mostrarán una sola vez en la siguiente pantalla.
            </p>
```

por:

```tsx
            <p className={styles.nota}>
              Al guardar se genera el número de membresía y se envía un correo para
              que el cliente active su acceso.
            </p>
```

Reemplazar el cuerpo de `Credenciales`:

```tsx
function Credenciales({ estado }: { estado: RegistrarMiembroState }) {
  return (
    <>
      <div className={styles.credenciales}>
        <Alert tone="success" title={`${estado.nombre} quedó registrado`} />

        <Alert tone="success" title="Correo de activación enviado">
          Se envió un enlace de un solo uso a {estado.correo} para que el cliente elija
          su propia contraseña.
        </Alert>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Número de membresía</span>
          <Copiar valor={estado.numero!} label="Copiar número de membresía">
            <span className={styles.credencialValor}>{estado.numero}</span>
          </Copiar>
        </div>

        <div className={styles.acciones}>
          <Button href="/admin/miembros">Ir a la lista</Button>
          <Button href="/admin/miembros/nuevo" variant="secondary">
            Registrar otro
          </Button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: `usuario-form.tsx` — condición y pantalla de éxito**

Cambiar:

```tsx
  if (state.ok && state.password) {
    return <Credenciales estado={state} />
  }
```

por:

```tsx
  if (state.ok && state.email) {
    return <Credenciales estado={state} />
  }
```

Cambiar la nota antes de los botones:

```tsx
          <p className={styles.nota}>
            Al guardar se genera una contraseña segura. Se mostrará una sola vez en la
            siguiente pantalla.
          </p>
```

por:

```tsx
          <p className={styles.nota}>
            Al guardar se envía un correo con un enlace de un solo uso para activar
            el acceso.
          </p>
```

Reemplazar el cuerpo de `Credenciales`:

```tsx
function Credenciales({ estado }: { estado: CrearUsuarioState }) {
  return (
    <>
      <div className={styles.credenciales}>
        <Alert tone="success" title="Usuario creado" />

        <Alert tone="success" title="Correo de activación enviado">
          Se envió un enlace de un solo uso para que el usuario elija su propia
          contraseña.
        </Alert>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Correo de acceso</span>
          <Copiar valor={estado.email ?? ''} label="Copiar correo">
            <span className={styles.credencialValor}>{estado.email}</span>
          </Copiar>
        </div>

        <div className={styles.acciones}>
          <Button href="/admin/usuarios">Ir a la lista</Button>
          <Button href="/admin/usuarios/nuevo" variant="secondary">
            Crear otro
          </Button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc --noEmit && pnpm lint` — sin errores ni imports huérfanos
(`Copiar` sigue en uso en ambos archivos).

Renderizado: `pnpm dev`, registrar un miembro de prueba y un usuario de prueba desde
el panel; confirmar que la pantalla de credenciales ya no muestra ninguna
contraseña y que llega el correo de activación.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/miembros/_components/miembro-form.tsx" "src/app/admin/usuarios/nuevo/_components/usuario-form.tsx"
git commit -m "ui: la pantalla de credenciales ya no muestra contrasenas, confirma el correo de activacion"
```

---

### Task 9: Cerrar el documento de auditoría

**Files:**
- Modify: `docs/SEGURIDAD-OWASP-VERIFICACION.md`

- [ ] **Step 1: Corregir los puntos que el MCP de Supabase ya desmintió**

Punto 2 (RLS): cambiar de "⏳ Pendiente de confirmar" a confirmado activo en las 7
tablas, con políticas por rol (verificado el 2026-08-19 vía
`mcp__supabase__execute_sql` sobre `pg_class`/`pg_policy`).

Punto 1 (dos membresías activas): el índice `uq_membresia_activa` ya existe en
producción. Añadir que su existencia sin el reorden de escritura rompía las
renovaciones — resuelto en la Tarea 1 de este plan.

- [ ] **Step 2: Documentar los hallazgos nuevos**

Agregar una sección "13. `registrar_venta` sin validar promoción, expuesta a
`authenticated`" (A04 Insecure Design) — resuelto en la Tarea 2.

Agregar una sección "14. Protección de contraseñas filtradas desactivada" (A07) —
`auth_leaked_password_protection` en `mcp__supabase__get_advisors(type: "security")`.
**No accionable desde el repo**: se activa en Dashboard → Authentication → Policies
→ Password Security → "Leaked password protection". Queda como pendiente de
Dashboard, igual que los límites de intentos de login (punto 3 original).

- [ ] **Step 3: Actualizar el resumen y la fecha**

Marcar los puntos 1, 2, 4, 5, 6 como 🟢 Resueltos (con referencia a este plan).
Actualizar "Última actualización" a la fecha en que se aplique este plan.

- [ ] **Step 4: Commit**

```bash
git add "docs/SEGURIDAD-OWASP-VERIFICACION.md"
git commit -m "docs: cerrar la auditoria OWASP con los hallazgos verificados via Supabase MCP"
```
