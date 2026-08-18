# Correo de Bienvenida con Credenciales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Al registrar un miembro o un usuario interno (empleado/admin), enviarle un correo con sus
credenciales de acceso y un botón al login que le corresponde.

**Architecture:** Un módulo nuevo `src/lib/correo/correo.ts` con dos funciones: una pura que arma
el asunto/cuerpo del correo, y otra que lo envía vía el SDK de MailerSend, envuelta en
`try/catch` para que nunca bloquee el flujo que la llama. Se invoca desde los dos server actions
de registro existentes, justo después de que cada registro queda confirmado en base de datos.

**Tech Stack:** Next.js server actions, TypeScript, SDK oficial `mailersend`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-16-correo-bienvenida-design.md`

## Global Constraints

- Envío **best-effort**: cualquier fallo se loguea con `console.error` y nunca se propaga ni
  bloquea/revierte el registro que lo dispara.
- Alcance: solo **miembros** (`registrarMiembro`) y **usuarios internos** (`crearUsuario`).
  Comercios queda excluido de este pase.
- Contenido del correo: saludo con el nombre, correo de acceso, contraseña, y un enlace de login.
  Sin logo ni branding adicional.
- Proveedor: **MailerSend**, vía su SDK oficial `mailersend` (no `@react-email/*`, no llamadas
  REST manuales).
- Variables de entorno: `MAILERSEND_API_KEY`, `MAILERSEND_FROM_EMAIL`,
  `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000` si no está definida).
- Gestor de paquetes: **pnpm**, nunca `npm`.

---

### Task 1: Función pura `construirCorreoBienvenida`

**Files:**
- Create: `src/lib/correo/correo.ts`
- Test: `src/lib/correo/correo.test.ts`

**Interfaces:**
- Produces: `export type RolCorreo = 'miembro' | 'staff'`; `export type InputCorreoBienvenida = { nombre: string; correo: string; password: string; rol: RolCorreo; urlBase: string }`; `export function construirCorreoBienvenida(input: InputCorreoBienvenida): { asunto: string; html: string; texto: string }`.

- [ ] **Step 1: Escribir el test que falla**

Crea `src/lib/correo/correo.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { construirCorreoBienvenida } from './correo'

describe('construirCorreoBienvenida', () => {
  const base = {
    nombre: 'Ana Ruiz',
    correo: 'ana@example.com',
    password: 'Tr0p!c4lFruta',
    urlBase: 'https://orum.example.com',
  }

  it('arma el asunto fijo', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.asunto).toBe('Bienvenido a ORUM — tus datos de acceso')
  })

  it('incluye el correo y la contraseña en el html y el texto', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.html).toContain('ana@example.com')
    expect(correo.html).toContain('Tr0p!c4lFruta')
    expect(correo.texto).toContain('ana@example.com')
    expect(correo.texto).toContain('Tr0p!c4lFruta')
  })

  it('saluda por nombre', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.html).toContain('Hola Ana Ruiz')
    expect(correo.texto).toContain('Hola Ana Ruiz')
  })

  it('enlaza a /miembros/login cuando rol es miembro', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.html).toContain('https://orum.example.com/miembros/login')
    expect(correo.texto).toContain('https://orum.example.com/miembros/login')
  })

  it('enlaza a /login cuando rol es staff', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'staff' })
    expect(correo.html).toContain('https://orum.example.com/login')
    expect(correo.texto).toContain('https://orum.example.com/login')
  })
})
```

- [ ] **Step 2: Verificar que el test falla**

Run: `pnpm test correo.test.ts`
Expected: FAIL — `src/lib/correo/correo.ts` no existe todavía (`Cannot find module './correo'`).

- [ ] **Step 3: Implementación mínima**

Crea `src/lib/correo/correo.ts`:

```typescript
export type RolCorreo = 'miembro' | 'staff'

export type InputCorreoBienvenida = {
  nombre: string
  correo: string
  password: string
  rol: RolCorreo
  urlBase: string
}

type CuerpoCorreo = { asunto: string; html: string; texto: string }

/**
 * Arma el asunto y el cuerpo (HTML + texto plano) del correo de bienvenida
 * con credenciales. Función pura, sin llamadas de red — el enlace de login
 * usa `urlBase` + la ruta correspondiente al rol.
 */
export function construirCorreoBienvenida(input: InputCorreoBienvenida): CuerpoCorreo {
  const rutaLogin = input.rol === 'miembro' ? '/miembros/login' : '/login'
  const urlLogin = `${input.urlBase}${rutaLogin}`
  const asunto = 'Bienvenido a ORUM — tus datos de acceso'

  const html = `
    <p>Hola ${input.nombre},</p>
    <p>Se creó tu cuenta en ORUM. Estos son tus datos de acceso:</p>
    <ul>
      <li><strong>Correo:</strong> ${input.correo}</li>
      <li><strong>Contraseña:</strong> ${input.password}</li>
    </ul>
    <p><a href="${urlLogin}">Iniciar sesión</a></p>
  `.trim()

  const texto = [
    `Hola ${input.nombre},`,
    '',
    'Se creó tu cuenta en ORUM. Estos son tus datos de acceso:',
    '',
    `Correo: ${input.correo}`,
    `Contraseña: ${input.password}`,
    '',
    `Inicia sesión aquí: ${urlLogin}`,
  ].join('\n')

  return { asunto, html, texto }
}
```

- [ ] **Step 4: Verificar que el test pasa**

Run: `pnpm test correo.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/lib/correo/correo.ts src/lib/correo/correo.test.ts
git commit -m "feat: agregar construirCorreoBienvenida (contenido del correo de credenciales)"
```

---

### Task 2: Envío vía MailerSend — `enviarCorreoBienvenida`

**Files:**
- Modify: `src/lib/correo/correo.ts`

**Interfaces:**
- Consumes: `construirCorreoBienvenida(input: InputCorreoBienvenida)` y `RolCorreo` de Task 1 (mismo archivo).
- Produces: `export async function enviarCorreoBienvenida(input: Omit<InputCorreoBienvenida, 'urlBase'>): Promise<void>`.

Esta función no se testea directamente (llama a un servicio externo real vía SDK — mismo criterio
que `registrarActividad` en `src/lib/bitacora/bitacora.ts`, que tampoco tiene test propio). La
verificación de este task es manual: instalar la dependencia, compilar, y confirmar que el resto
de la suite sigue pasando.

- [ ] **Step 1: Instalar la dependencia**

Run: `pnpm add mailersend`

- [ ] **Step 2: Agregar las variables de entorno**

Pide al usuario (tú) que agregue a `.env.local` (no lo hace el agente — son credenciales reales,
no deben inventarse ni commitearse):

```
MAILERSEND_API_KEY=<tu API token de MailerSend>
MAILERSEND_FROM_EMAIL=<remitente permitido por tu cuenta trial>
```

`NEXT_PUBLIC_SITE_URL` es opcional — si no está definida, el código usa
`http://localhost:3000` por defecto.

- [ ] **Step 3: Implementar `enviarCorreoBienvenida`**

Agrega al final de `src/lib/correo/correo.ts`:

```typescript
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY ?? '' })

/**
 * Envía el correo de bienvenida con credenciales. Best-effort: si falla (red,
 * API key inválida, destinatario rechazado por la cuenta trial), se loguea el
 * error a consola pero nunca se propaga — el registro que lo dispara (alta de
 * miembro o creación de usuario) no debe verse afectado.
 */
export async function enviarCorreoBienvenida(
  input: Omit<InputCorreoBienvenida, 'urlBase'>,
): Promise<void> {
  const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { asunto, html, texto } = construirCorreoBienvenida({ ...input, urlBase })

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
    console.error('No se pudo enviar el correo de bienvenida:', err)
  }
}
```

Recuerda mover el `import { ... } from 'mailersend'` junto a los demás imports al inicio del
archivo (antes de `export type RolCorreo`), no dejarlo a mitad de archivo.

- [ ] **Step 4: Verificar que la suite completa sigue pasando**

Run: `pnpm test`
Expected: PASS — los tests de `correo.test.ts` (Task 1) siguen pasando; `enviarCorreoBienvenida`
no tiene test propio.

- [ ] **Step 5: Lint y build**

Run: `pnpm lint && pnpm build`
Expected: sin errores. El build confirma que el import de `mailersend` resuelve bien.

- [ ] **Step 6: Commit**

```bash
git add src/lib/correo/correo.ts package.json pnpm-lock.yaml
git commit -m "feat: enviar correo de bienvenida vía MailerSend (best-effort)"
```

---

### Task 3: Integrar en `registrarMiembro`

**Files:**
- Modify: `src/app/admin/miembros/actions.ts:1-9` (imports), `src/app/admin/miembros/actions.ts:192-206` (después de `registrarActividad`, antes de `revalidatePath`)

**Interfaces:**
- Consumes: `enviarCorreoBienvenida(input: { nombre: string; correo: string; password: string; rol: RolCorreo })` de Task 2 (`@/lib/correo/correo`).

- [ ] **Step 1: Agregar el import**

En `src/app/admin/miembros/actions.ts`, agrega junto a los demás imports (después de la línea
`import { registrarActividad } from '@/lib/bitacora/bitacora'`):

```typescript
import { enviarCorreoBienvenida } from '@/lib/correo/correo'
```

- [ ] **Step 2: Agregar la llamada después de `registrarActividad`**

Localiza este bloque (alrededor de la línea 192):

```typescript
  await registrarActividad(admin, {
    actorId: actor.userId,
    accion: 'alta',
    entidadId: miembroId,
    datosNuevos: {
      nombres,
      apellidos,
      cedula,
      plan_nombre: plan.nombre,
      precio_pagado,
    },
  })

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
}
```

Reemplázalo por (agrega la llamada a `enviarCorreoBienvenida` entre `registrarActividad` y
`revalidatePath`):

```typescript
  await registrarActividad(admin, {
    actorId: actor.userId,
    accion: 'alta',
    entidadId: miembroId,
    datosNuevos: {
      nombres,
      apellidos,
      cedula,
      plan_nombre: plan.nombre,
      precio_pagado,
    },
  })

  await enviarCorreoBienvenida({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo,
    password,
    rol: 'miembro',
  })

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
}
```

- [ ] **Step 3: Verificar tipos y lint**

Run: `pnpm lint`
Expected: sin errores.

- [ ] **Step 4: Verificar que la suite completa sigue pasando**

Run: `pnpm test`
Expected: PASS — no hay tests automatizados de `registrarMiembro` (server action con dependencias
de Supabase), así que esto confirma que no se rompió nada más.

- [ ] **Step 5: Verificación manual**

Con `MAILERSEND_API_KEY`, `MAILERSEND_FROM_EMAIL` configurados y tu propio correo verificado en la
cuenta trial de MailerSend:

1. `pnpm dev`
2. Entra como empleado/admin a `/admin/miembros`, registra un miembro nuevo usando tu propio
   correo verificado en MailerSend como "correo" del miembro.
3. Confirma que la pantalla sigue mostrando la contraseña una sola vez (comportamiento sin
   cambios).
4. Revisa la bandeja de entrada de ese correo: debe llegar el correo de bienvenida con el enlace a
   `/miembros/login`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/miembros/actions.ts
git commit -m "feat: enviar correo de bienvenida al registrar un miembro"
```

---

### Task 4: Integrar en `crearUsuario`

**Files:**
- Modify: `src/app/admin/usuarios/actions.ts:1-8` (imports), `src/app/admin/usuarios/actions.ts:108-118` (después de insertar en `empleados`, antes de `revalidatePath`)

**Interfaces:**
- Consumes: `enviarCorreoBienvenida(input: { nombre: string; correo: string; password: string; rol: RolCorreo })` de Task 2 (`@/lib/correo/correo`).

- [ ] **Step 1: Agregar el import**

En `src/app/admin/usuarios/actions.ts`, agrega junto a los demás imports (después de la línea
`import { getPerfilActual } from '@/lib/auth/auth'`):

```typescript
import { enviarCorreoBienvenida } from '@/lib/correo/correo'
```

- [ ] **Step 2: Agregar la llamada después de insertar en `empleados`**

Localiza este bloque (alrededor de la línea 108):

```typescript
  const { error: errEmpleado } = await admin
    .from('empleados')
    .insert({ perfil_id: userId, ...datosEmpleado })
  if (errEmpleado) {
    await revertir()
    return { error: `No se pudo registrar el empleado: ${errEmpleado.message}` }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true, email, password }
}
```

Reemplázalo por (agrega la llamada a `enviarCorreoBienvenida` entre el insert y
`revalidatePath`):

```typescript
  const { error: errEmpleado } = await admin
    .from('empleados')
    .insert({ perfil_id: userId, ...datosEmpleado })
  if (errEmpleado) {
    await revertir()
    return { error: `No se pudo registrar el empleado: ${errEmpleado.message}` }
  }

  await enviarCorreoBienvenida({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo: email,
    password,
    rol: 'staff',
  })

  revalidatePath('/admin/usuarios')
  return { ok: true, email, password }
}
```

- [ ] **Step 3: Verificar tipos y lint**

Run: `pnpm lint`
Expected: sin errores.

- [ ] **Step 4: Verificar que la suite completa sigue pasando**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Verificación manual**

Con el servidor corriendo (`pnpm dev`):

1. Entra como super_admin a `/admin/usuarios`, crea un usuario (tipo empleado) usando tu propio
   correo verificado en MailerSend.
2. Confirma que la pantalla sigue mostrando la contraseña una sola vez (comportamiento sin
   cambios).
3. Revisa la bandeja de entrada: debe llegar el correo de bienvenida con el enlace a `/login`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/usuarios/actions.ts
git commit -m "feat: enviar correo de bienvenida al crear un usuario interno"
```

---

### Task 5: Cerrar la idea pendiente en el ROADMAP

**Files:**
- Modify: `docs/ROADMAP.md` (sección "10. Ideas pendientes (no priorizadas)")

- [ ] **Step 1: Actualizar la sección**

En `docs/ROADMAP.md`, localiza el bloque bajo `## 10. Ideas pendientes (no priorizadas)` que
empieza con `- **Correo de bienvenida con credenciales al registrar un usuario.**` y reemplázalo
por una nota de cierre:

```markdown
- ~~**Correo de bienvenida con credenciales al registrar un usuario.**~~ **Implementado.** Al
  registrar un miembro (`/admin/miembros`) o un usuario interno (`/admin/usuarios`), se envía un
  correo con las credenciales de acceso y un enlace al login correspondiente, vía MailerSend
  (`src/lib/correo/correo.ts`). Envío best-effort: un fallo no bloquea ni revierte el registro.
  Comercios sigue excluido (sin portal de login con este flujo). Ver
  `docs/superpowers/specs/2026-08-16-correo-bienvenida-design.md`.
```

Si esa era la única idea listada en la sección, deja la sección con un texto indicando que no hay
ideas pendientes por ahora, en vez de dejarla vacía.

- [ ] **Step 2: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: cerrar la idea de correo de bienvenida en el ROADMAP"
```
