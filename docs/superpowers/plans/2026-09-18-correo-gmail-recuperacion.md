# Correo por SMTP de Gmail y recuperación de contraseña — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir MailerSend por SMTP de Gmail/Workspace (remitente = alias), arreglar el redireccionamiento del enlace de `/activar-cuenta` y agregar "olvidé mi contraseña" para miembros y comercios.

**Architecture:** `src/lib/correo/correo.ts` pasa a tener un transporte Nodemailer genérico (`enviarCorreo`) del que cuelgan la invitación y la recuperación. La recuperación reutiliza `admin.auth.admin.generateLink({ type: 'recovery' })` (mismo mecanismo que la invitación) y la página `/activar-cuenta`, que cambia solo el copy según `?modo=recuperar`. El trabajo de recuperación corre dentro de `after()` de Next para que la respuesta sea idéntica exista o no la cuenta.

**Tech Stack:** Next.js 16.2 (App Router, server actions, `after`), React 19, Supabase Auth (Admin API), Nodemailer, Vitest (solo funciones puras), Cloudflare Turnstile.

**Spec:** `docs/superpowers/specs/2026-09-18-correo-gmail-recuperacion-design.md`

## Global Constraints

- Pruebas automatizadas **solo de funciones puras**; el resto se verifica a mano (CLAUDE.md).
- Nada de `className="orum-*"`, valores literales de color/espaciado/radio/duración, ni `style={{}}` para maquetar: todo con `var(--…)` de `src/styles/tokens.css` en `.module.css`.
- Un formulario **no navega**, pero "olvidé mi contraseña" es una pantalla de acceso (no un formulario de lista): vive como página propia bajo `login/recuperar` y usa `PantallaAuth` con `estilosAuth`, como los tres logins.
- Componentes de `src/components/ui/` en kebab-case; reutilizar `Alert`, `Button`, `Field`, `Input`, `Turnstile`, `PantallaAuth`, `estilosAuth`. No crear equivalentes.
- Páginas = Server Components; `'use client'` solo en el formulario. Mutaciones = server actions.
- Transporte: `smtp.gmail.com:465` (SSL implícito). Variables: `GMAIL_SMTP_USER` (cuenta que autentica), `GMAIL_SMTP_APP_PASSWORD`, `GMAIL_FROM_EMAIL` (alias visible). `from` = `"ORUM" <GMAIL_FROM_EMAIL>`. Se retiran `MAILERSEND_API_KEY` y `MAILERSEND_FROM_EMAIL`.
- Envío best-effort: si falla, se registra en el log del servidor y la operación de negocio se completa igual.
- Anti-enumeración: mismo mensaje de éxito y misma respuesta exista o no la cuenta.
- Turnstile fail-closed en ambas pantallas de recuperación (`verificarTurnstileDeFormulario`).
- Admin/staff **no** lleva "olvidé mi contraseña" (un `super_admin` reinvita).
- Aviso de recuperación: título `Restablece tu contraseña`; asunto `Restablece tu contraseña en ORUM`.
- Verificación final: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`. Usar **pnpm**, nunca npm.
- Un solo commit al final solo aplica a reorganizaciones puras; aquí se commitea por tarea.
- La rama de trabajo es `turnstile-logins` (o una derivada); worktrees, si se usan, fuera de OneDrive (`C:\dev\orum-worktrees\<nombre>`).

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/lib/correo/correo.ts` (modificar) | Plantilla de invitación (sin cambios), plantilla de recuperación, `leerConfigSmtp`, `enviarCorreo`, `enviarCorreoInvitacion` |
| `src/lib/correo/correo.test.ts` (modificar) | Pruebas de las funciones puras del módulo |
| `src/lib/auth/activacion.ts` (crear) | Funciones puras: `construirUrlActivacion`, `urlBaseSitio`, `textosActivacion` |
| `src/lib/auth/activacion.test.ts` (crear) | Pruebas de esas funciones |
| `src/lib/auth/recuperacion.ts` (crear) | `enviarRecuperacion(correo, rol)`: genera el enlace, valida el rol y envía el correo (servidor) |
| `src/app/activar-cuenta/page.tsx` / `_components/activar-form.tsx` (modificar) | Copy condicional por `modo` |
| `src/app/admin/{comercios,miembros,usuarios}/actions.ts` (modificar) | Usar `construirUrlActivacion` en lugar de armar la URL a mano |
| `src/app/miembros/login/recuperar/{page.tsx,actions.ts,_components/recuperar-form.tsx}` (crear) | Pantalla y action de recuperación de miembros |
| `src/app/comercios/login/recuperar/{page.tsx,actions.ts,_components/recuperar-form.tsx}` (crear) | Ídem para comercios |
| `src/app/{miembros,comercios}/login/_components/login-form.tsx` (modificar) | Enlace "¿Olvidaste tu contraseña?" |
| `.env.example`, `package.json` (modificar) | Variables y dependencias |

---

### Task 1: Transporte Nodemailer/Gmail y `enviarCorreo` genérico

**Files:**
- Modify: `package.json` (vía pnpm), `.env.example`, `.env.local` (a mano, no se commitea)
- Modify: `src/lib/correo/correo.ts`
- Test: `src/lib/correo/correo.test.ts`

**Interfaces:**
- Consumes: `escaparHtml` de `src/lib/shared/html.ts` (ya usada).
- Produces:
  - `type ConfigSmtp = { usuario: string; password: string; remitente: string }`
  - `leerConfigSmtp(env: Record<string, string | undefined>): ConfigSmtp | null`
  - `type InputCorreo = { para: string; nombre: string; asunto: string; html: string; texto: string }`
  - `enviarCorreo(input: InputCorreo): Promise<void>` (nunca lanza)
  - `enviarCorreoInvitacion(input: InputCorreoInvitacion): Promise<void>` (firma sin cambios)

- [ ] **Step 1: Cambiar dependencias**

```bash
pnpm remove mailersend
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

Expected: `package.json` ya no lista `mailersend` y sí `nodemailer` y `@types/nodemailer`.

- [ ] **Step 2: Escribir la prueba que falla**

Agregar al final de `src/lib/correo/correo.test.ts` (y añadir `leerConfigSmtp` al import de `./correo`):

```ts
describe('leerConfigSmtp', () => {
  const env = {
    GMAIL_SMTP_USER: 'admin@orum.example.com',
    GMAIL_SMTP_APP_PASSWORD: 'abcd efgh ijkl mnop',
    GMAIL_FROM_EMAIL: 'no-reply@orum.example.com',
  }

  it('devuelve la configuración cuando están las tres variables', () => {
    expect(leerConfigSmtp(env)).toEqual({
      usuario: 'admin@orum.example.com',
      password: 'abcdefghijklmnop',
      remitente: 'no-reply@orum.example.com',
    })
  })

  it('quita los espacios de la contraseña de aplicación (Google la muestra en bloques)', () => {
    expect(leerConfigSmtp(env)?.password).toBe('abcdefghijklmnop')
  })

  it.each(['GMAIL_SMTP_USER', 'GMAIL_SMTP_APP_PASSWORD', 'GMAIL_FROM_EMAIL'])(
    'devuelve null si falta %s',
    (clave) => {
      expect(leerConfigSmtp({ ...env, [clave]: undefined })).toBeNull()
      expect(leerConfigSmtp({ ...env, [clave]: '   ' })).toBeNull()
    },
  )
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `pnpm exec vitest run src/lib/correo/correo.test.ts`
Expected: FAIL — `leerConfigSmtp` no está exportada (y `mailersend` ya no resuelve).

- [ ] **Step 4: Reemplazar el transporte en `correo.ts`**

Sustituir la línea 1 (`import { MailerSend, ... } from 'mailersend'`) por:

```ts
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
```

Borrar desde `const mailerSend = new MailerSend(...)` hasta el final del archivo (líneas 43-63) y poner en su lugar:

```ts
export type ConfigSmtp = { usuario: string; password: string; remitente: string }

/**
 * Lee la configuración SMTP del entorno. Devuelve `null` si falta cualquier
 * variable: el envío es best-effort y una ausencia no debe romper el flujo.
 * La contraseña de aplicación de Google se muestra en bloques separados por
 * espacios ("abcd efgh …"); se quitan para que funcione pegada tal cual.
 */
export function leerConfigSmtp(env: Record<string, string | undefined>): ConfigSmtp | null {
  const usuario = env.GMAIL_SMTP_USER?.trim()
  const password = env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s+/g, '')
  const remitente = env.GMAIL_FROM_EMAIL?.trim()
  if (!usuario || !password || !remitente) return null
  return { usuario, password, remitente }
}

export type InputCorreo = {
  para: string
  nombre: string
  asunto: string
  html: string
  texto: string
}

let transporte: Transporter | null = null

function obtenerTransporte(config: ConfigSmtp): Transporter {
  transporte ??= nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.usuario, pass: config.password },
  })
  return transporte
}

/** Envía un correo transaccional por SMTP de Gmail. Nunca lanza: registra y sigue. */
export async function enviarCorreo(input: InputCorreo): Promise<void> {
  const config = leerConfigSmtp(process.env)
  if (!config) {
    console.error('Correo no enviado: faltan variables GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD / GMAIL_FROM_EMAIL.')
    return
  }

  try {
    await obtenerTransporte(config).sendMail({
      from: { name: 'ORUM', address: config.remitente },
      to: { name: input.nombre, address: input.para },
      subject: input.asunto,
      html: input.html,
      text: input.texto,
    })
  } catch (err) {
    console.error('No se pudo enviar el correo:', err)
  }
}

export async function enviarCorreoInvitacion(input: InputCorreoInvitacion): Promise<void> {
  const { asunto, html, texto } = construirCorreoInvitacion(input)
  await enviarCorreo({ para: input.correo, nombre: input.nombre, asunto, html, texto })
}
```

- [ ] **Step 5: Ejecutar pruebas y tipos**

Run: `pnpm exec vitest run src/lib/correo/correo.test.ts && pnpm exec tsc --noEmit`
Expected: PASS y sin errores de tipos (las tres actions de admin siguen importando `enviarCorreoInvitacion` con la misma firma).

- [ ] **Step 6: Actualizar `.env.example`**

Reemplazar el bloque "Correo de bienvenida (MailerSend)" completo (desde la línea de guiones `# ----` que abre ese bloque hasta `MAILERSEND_FROM_EMAIL=`) por:

```
# ---------------------------------------------------------------------------
# Correo transaccional (SMTP de Gmail / Google Workspace) — OPCIONAL
#
# Se usa para las invitaciones de alta y la recuperación de contraseña. El
# envío es "best-effort": si estas variables faltan o el servicio falla, la
# operación se completa igual y el error solo queda en el log del servidor.
# Por eso conviene revisarlas: una ausencia NO da error visible.
# ---------------------------------------------------------------------------

# Cuenta de Workspace que AUTENTICA el envío (correo real, p. ej. el del admin).
GMAIL_SMTP_USER=

# Contraseña de aplicación de esa cuenta (16 caracteres; requiere verificación
# en 2 pasos). NO es la contraseña normal de la cuenta. Nunca se sube al repo.
GMAIL_SMTP_APP_PASSWORD=

# Remitente que VEN los destinatarios. Puede ser un alias de la cuenta anterior
# (p. ej. no-reply@tudominio.com); debe estar añadido en Gmail como "Enviar como".
GMAIL_FROM_EMAIL=
```

Y dejar `NEXT_PUBLIC_SITE_URL` con este comentario (reemplaza el actual):

```
# Dominio real del sitio, sin barra final. Ej.: https://orum.example.com
# Base de los enlaces de los correos. En local puede omitirse (usa
# http://localhost:3000); en PRODUCCIÓN es OBLIGATORIA: sin ella el enlace de
# invitación/recuperación apunta a localhost y no lleva a ninguna parte.
NEXT_PUBLIC_SITE_URL=
```

- [ ] **Step 7: Retirar `MAILERSEND_*` de `.env.local` y añadir las tres variables nuevas**

A mano (no se commitea). Poner los valores reales solo si ya se generó la contraseña de aplicación (Task 6, paso 1); si no, dejarlas vacías: el envío queda deshabilitado y lo registra el log.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example src/lib/correo/correo.ts src/lib/correo/correo.test.ts
git commit -m "feat: transporte de correo por SMTP de Gmail en lugar de MailerSend"
```

---

### Task 2: Plantilla del correo de recuperación

**Files:**
- Modify: `src/lib/correo/correo.ts`
- Test: `src/lib/correo/correo.test.ts`

**Interfaces:**
- Consumes: `escaparHtml`, tipo interno `CuerpoCorreo` (ya definido en `correo.ts`).
- Produces:
  - `type InputCorreoRecuperacion = { urlRecuperacion: string }`
  - `construirCorreoRecuperacion(input: InputCorreoRecuperacion): CuerpoCorreo`
  - `enviarCorreoRecuperacion(input: { correo: string; urlRecuperacion: string }): Promise<void>`

El correo no lleva nombre: el flujo de miembros solo conoce el correo, y una plantilla igual para los dos portales evita divergencias.

- [ ] **Step 1: Escribir la prueba que falla**

Añadir `construirCorreoRecuperacion` al import y agregar:

```ts
describe('construirCorreoRecuperacion', () => {
  const url = 'https://orum.example.com/auth/v1/verify?token=abc&type=recovery'

  it('arma el asunto fijo', () => {
    expect(construirCorreoRecuperacion({ urlRecuperacion: url }).asunto).toBe(
      'Restablece tu contraseña en ORUM',
    )
  })

  it('incluye el enlace en html y texto plano', () => {
    const correo = construirCorreoRecuperacion({ urlRecuperacion: url })
    expect(correo.html).toContain(url)
    expect(correo.texto).toContain(url)
  })

  it('avisa que se ignore si no lo pidió el usuario', () => {
    const correo = construirCorreoRecuperacion({ urlRecuperacion: url })
    expect(correo.html).toMatch(/ignorarlo/i)
    expect(correo.texto).toMatch(/ignorarlo/i)
  })
})
```

- [ ] **Step 2: Verificar que falla**

Run: `pnpm exec vitest run src/lib/correo/correo.test.ts`
Expected: FAIL — `construirCorreoRecuperacion` no existe.

- [ ] **Step 3: Implementar**

En `correo.ts`, después de `construirCorreoInvitacion` y antes de `ConfigSmtp`:

```ts
export type InputCorreoRecuperacion = { urlRecuperacion: string }

export function construirCorreoRecuperacion(input: InputCorreoRecuperacion): CuerpoCorreo {
  const asunto = 'Restablece tu contraseña en ORUM'

  const html = `
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña en ORUM. Elige una
    nueva con este enlace de un solo uso:</p>
    <p><a href="${input.urlRecuperacion}">Restablecer mi contraseña</a></p>
    <p>Si no fuiste tú, puedes ignorarlo: tu contraseña actual sigue funcionando.</p>
  `.trim()

  const texto = [
    'Hola,',
    '',
    'Recibimos una solicitud para restablecer tu contraseña en ORUM. Elige una',
    'nueva con este enlace de un solo uso:',
    '',
    input.urlRecuperacion,
    '',
    'Si no fuiste tú, puedes ignorarlo: tu contraseña actual sigue funcionando.',
  ].join('\n')

  return { asunto, html, texto }
}
```

Y al final del archivo:

```ts
export async function enviarCorreoRecuperacion(input: {
  correo: string
  urlRecuperacion: string
}): Promise<void> {
  const { asunto, html, texto } = construirCorreoRecuperacion({
    urlRecuperacion: input.urlRecuperacion,
  })
  await enviarCorreo({ para: input.correo, nombre: input.correo, asunto, html, texto })
}
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec vitest run src/lib/correo/correo.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/correo/correo.ts src/lib/correo/correo.test.ts
git commit -m "feat: plantilla del correo de recuperación de contraseña"
```

---

### Task 3: URL de activación y copy por `modo` (arregla el redireccionamiento en código)

**Files:**
- Create: `src/lib/auth/activacion.ts`, `src/lib/auth/activacion.test.ts`
- Modify: `src/app/activar-cuenta/page.tsx`, `src/app/activar-cuenta/_components/activar-form.tsx`
- Modify: `src/app/admin/comercios/actions.ts:59-64`, `src/app/admin/miembros/actions.ts:112-119`, `src/app/admin/usuarios/actions.ts:72-77`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type RolActivacion = 'miembro' | 'comercio' | 'staff'`
  - `type ModoActivacion = 'invitar' | 'recuperar'`
  - `construirUrlActivacion(urlBase: string, rol: RolActivacion, modo?: ModoActivacion): string` — quita barras finales de `urlBase`; añade `&modo=recuperar` solo si `modo === 'recuperar'`.
  - `urlBaseSitio(): string` — `process.env.NEXT_PUBLIC_SITE_URL` o `http://localhost:3000`; en producción sin variable registra `console.error` (la causa raíz del spec §3).
  - `textosActivacion(modo: string | undefined): { subtitulo: string; etiquetaPassword: string; boton: string }`

- [ ] **Step 1: Escribir las pruebas que fallan**

`src/lib/auth/activacion.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { construirUrlActivacion, textosActivacion } from './activacion'

describe('construirUrlActivacion', () => {
  it('arma la URL de invitación sin parámetro modo', () => {
    expect(construirUrlActivacion('https://orum.example.com', 'miembro')).toBe(
      'https://orum.example.com/activar-cuenta?rol=miembro',
    )
  })

  it('añade modo=recuperar solo en recuperación', () => {
    expect(construirUrlActivacion('https://orum.example.com', 'comercio', 'recuperar')).toBe(
      'https://orum.example.com/activar-cuenta?rol=comercio&modo=recuperar',
    )
  })

  it('tolera barras finales en la base', () => {
    expect(construirUrlActivacion('https://orum.example.com//', 'staff')).toBe(
      'https://orum.example.com/activar-cuenta?rol=staff',
    )
  })
})

describe('textosActivacion', () => {
  it('usa el copy de invitación por defecto y ante valores desconocidos', () => {
    for (const modo of [undefined, '', 'otro']) {
      expect(textosActivacion(modo)).toEqual({
        subtitulo: 'Activa tu cuenta',
        etiquetaPassword: 'Elige tu contraseña',
        boton: 'Activar cuenta',
      })
    }
  })

  it('usa el copy de recuperación con modo=recuperar', () => {
    expect(textosActivacion('recuperar')).toEqual({
      subtitulo: 'Restablece tu contraseña',
      etiquetaPassword: 'Elige tu nueva contraseña',
      boton: 'Guardar contraseña',
    })
  })
})
```

- [ ] **Step 2: Verificar que falla**

Run: `pnpm exec vitest run src/lib/auth/activacion.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `src/lib/auth/activacion.ts`**

```ts
export type RolActivacion = 'miembro' | 'comercio' | 'staff'
export type ModoActivacion = 'invitar' | 'recuperar'

/** Base del sitio para los enlaces de correo. En producción es obligatoria. */
export function urlBaseSitio(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (url) return url
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'NEXT_PUBLIC_SITE_URL no está definida: los enlaces de los correos apuntarán a localhost.',
    )
  }
  return 'http://localhost:3000'
}

/** URL a la que Supabase redirige tras seguir el enlace del correo. */
export function construirUrlActivacion(
  urlBase: string,
  rol: RolActivacion,
  modo: ModoActivacion = 'invitar',
): string {
  const base = urlBase.replace(/\/+$/, '')
  const sufijo = modo === 'recuperar' ? '&modo=recuperar' : ''
  return `${base}/activar-cuenta?rol=${rol}${sufijo}`
}

export function textosActivacion(modo: string | undefined) {
  if (modo === 'recuperar') {
    return {
      subtitulo: 'Restablece tu contraseña',
      etiquetaPassword: 'Elige tu nueva contraseña',
      boton: 'Guardar contraseña',
    }
  }
  return {
    subtitulo: 'Activa tu cuenta',
    etiquetaPassword: 'Elige tu contraseña',
    boton: 'Activar cuenta',
  }
}
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec vitest run src/lib/auth/activacion.test.ts`
Expected: PASS.

- [ ] **Step 5: Usar `textosActivacion` en la página y el formulario**

`src/app/activar-cuenta/page.tsx` (reemplazar el archivo entero):

```tsx
import { Suspense } from 'react'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { textosActivacion } from '@/lib/auth/activacion'
import { ActivarForm } from './_components/activar-form'

export default async function ActivarCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>
}) {
  const { modo } = await searchParams

  return (
    <PantallaAuth subtitulo={textosActivacion(modo).subtitulo}>
      <Suspense>
        <ActivarForm />
      </Suspense>
    </PantallaAuth>
  )
}
```

En `activar-form.tsx`: añadir el import `import { textosActivacion } from '@/lib/auth/activacion'`; tras la línea `const destino = ...` añadir `const textos = textosActivacion(searchParams.get('modo') ?? undefined)`; cambiar `label="Elige tu contraseña"` por `label={textos.etiquetaPassword}`; y el texto del botón `Activar cuenta` por `{textos.boton}`. También, en el `setError('No se pudo activar la cuenta. Intenta de nuevo.')` no hace falta tocar nada.

- [ ] **Step 6: Usar `construirUrlActivacion` en las tres actions de admin**

En cada archivo, importar `import { construirUrlActivacion, urlBaseSitio } from '@/lib/auth/activacion'`, eliminar la línea `const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'` y cambiar el `redirectTo`:

- `admin/comercios/actions.ts`: `redirectTo: construirUrlActivacion(urlBaseSitio(), 'comercio')`
- `admin/miembros/actions.ts`: `redirectTo: construirUrlActivacion(urlBaseSitio(), 'miembro')`
- `admin/usuarios/actions.ts`: `redirectTo: construirUrlActivacion(urlBaseSitio(), 'staff')`

Comprobar con Grep que no queda ninguna otra referencia a `urlBase` en esos tres archivos antes de continuar (si `urlBase` se usa en otra línea, sustituirla también).

- [ ] **Step 7: Verificar**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth/activacion.ts src/lib/auth/activacion.test.ts src/app/activar-cuenta src/app/admin
git commit -m "feat: URL de activación centralizada y copy de /activar-cuenta según modo"
```

---

### Task 4: Envío de recuperación (servidor) y pantalla de miembros

**Files:**
- Create: `src/lib/auth/recuperacion.ts`
- Create: `src/app/miembros/login/recuperar/page.tsx`, `actions.ts`, `_components/recuperar-form.tsx`
- Modify: `src/app/miembros/login/_components/login-form.tsx`, `src/components/ui/pantalla-auth.module.css` (solo si hace falta el estilo del enlace, ver Step 5)

**Interfaces:**
- Consumes: `construirUrlActivacion`, `urlBaseSitio` (Task 3); `enviarCorreoRecuperacion` (Task 2); `createAdminClient` (`@/lib/supabase/admin`); `resolverCorreoPorNumeroMembresia`; `verificarTurnstileDeFormulario`, `ERROR_TURNSTILE`.
- Produces:
  - `enviarRecuperacion(correo: string, rol: 'miembro' | 'comercio'): Promise<void>` — no lanza; no envía nada si el correo no existe, si el perfil no tiene ese rol o está inactivo.
  - `type RecuperarState = { enviado?: boolean; error?: string }` (definido en cada `actions.ts`).
  - `solicitarRecuperacionMiembro(_prev: RecuperarState, formData: FormData): Promise<RecuperarState>` — campo `numero_membresia`.

Sin prueba automatizada: usa Supabase y correo (no es función pura). Se verifica a mano en la Task 6.

- [ ] **Step 1: Crear `src/lib/auth/recuperacion.ts`**

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarCorreoRecuperacion } from '@/lib/correo/correo'
import { construirUrlActivacion, urlBaseSitio } from './activacion'

/**
 * Genera el enlace de recuperación y lo envía por correo. Nunca lanza y no
 * distingue resultados hacia fuera: si el correo no existe, o su perfil no es
 * del rol esperado o está inactivo, simplemente no envía nada. El llamador
 * responde siempre lo mismo (anti-enumeración).
 *
 * El rol se comprueba aquí para que el formulario de un portal no pueda
 * disparar la recuperación de una cuenta de otro (p. ej. staff desde el
 * portal de comercios).
 */
export async function enviarRecuperacion(
  correo: string,
  rol: 'miembro' | 'comercio',
): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: correo,
      options: { redirectTo: construirUrlActivacion(urlBaseSitio(), rol, 'recuperar') },
    })
    if (error || !data?.user) return

    const { data: rolFila } = await admin.from('roles').select('id').eq('codigo', rol).single()
    if (!rolFila) return

    const { data: perfil } = await admin
      .from('perfiles')
      .select('activo')
      .eq('id', data.user.id)
      .eq('rol_id', rolFila.id)
      .maybeSingle()
    if (!perfil?.activo) return

    await enviarCorreoRecuperacion({
      correo,
      urlRecuperacion: data.properties.action_link,
    })
  } catch (err) {
    console.error('No se pudo procesar la recuperación de contraseña:', err)
  }
}
```

- [ ] **Step 2: Crear `src/app/miembros/login/recuperar/actions.ts`**

```ts
'use server'

import { after } from 'next/server'
import { ERROR_TURNSTILE, verificarTurnstileDeFormulario } from '@/lib/auth/turnstile-request'
import { enviarRecuperacion } from '@/lib/auth/recuperacion'
import { resolverCorreoPorNumeroMembresia } from '@/lib/miembros/auth-miembro'

export type RecuperarState = { enviado?: boolean; error?: string }

/**
 * Pide el enlace para restablecer la contraseña de un miembro (por número de
 * membresía). Responde SIEMPRE igual exista o no la cuenta: el trabajo real
 * corre en `after()`, así la respuesta tampoco delata la diferencia por tiempo.
 */
export async function solicitarRecuperacionMiembro(
  _prev: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const numeroMembresia = String(formData.get('numero_membresia') ?? '').trim()
  if (!numeroMembresia) return { error: 'Ingresa tu número de membresía.' }

  const captcha = await verificarTurnstileDeFormulario(formData)
  if (!captcha.valido) return { error: ERROR_TURNSTILE }

  after(async () => {
    const correo = await resolverCorreoPorNumeroMembresia(numeroMembresia)
    if (correo) await enviarRecuperacion(correo, 'miembro')
  })

  return { enviado: true }
}
```

- [ ] **Step 3: Crear `src/app/miembros/login/recuperar/_components/recuperar-form.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { estilosAuth } from '@/components/ui/pantalla-auth'
import { Turnstile } from '@/components/ui/turnstile'
import { solicitarRecuperacionMiembro, type RecuperarState } from '../actions'

const estadoInicial: RecuperarState = {}

export function RecuperarMiembroForm() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacionMiembro, estadoInicial)

  if (state.enviado) {
    return (
      <div className={estilosAuth.formulario}>
        <Alert tone="success" title="Revisa tu correo">
          Si el número de membresía existe, te enviamos un enlace para restablecer tu contraseña.
          Puede tardar un par de minutos; mira también en spam.
        </Alert>
        <Link href="/miembros/login">Volver a iniciar sesión</Link>
      </div>
    )
  }

  return (
    <form action={formAction} className={estilosAuth.formulario} noValidate>
      {state.error && (
        <Alert key={state.error} tone="danger" className={estilosAuth.alerta}>
          {state.error}
        </Alert>
      )}

      <Field
        label="Número de membresía"
        help="Te enviaremos el enlace al correo con el que te registraron."
      >
        <Input
          name="numero_membresia"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="00012345"
          required
          autoFocus
        />
      </Field>

      <Turnstile />

      <Button type="submit" size="lg" fullWidth loading={pending} icon={<Mail size={17} />}>
        Enviar enlace
      </Button>
    </form>
  )
}
```

Antes de dar el paso por bueno, confirmar con Grep que `Alert` acepta `tone="success"` (`src/components/ui/alert.tsx`, tipo `AlertTone`); si el tono se llama distinto, usar el que exista.

- [ ] **Step 4: Crear `src/app/miembros/login/recuperar/page.tsx`**

```tsx
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { RecuperarMiembroForm } from './_components/recuperar-form'

export const metadata = { title: 'Recuperar contraseña · ORUM Miembros' }

export default function RecuperarMiembroPage() {
  return (
    <PantallaAuth subtitulo="Restablece tu contraseña">
      <RecuperarMiembroForm />
    </PantallaAuth>
  )
}
```

- [ ] **Step 5: Enlace en el login de miembros**

En `src/app/miembros/login/_components/login-form.tsx`: importar `import Link from 'next/link'` y, justo después del `</Field>` de la contraseña y antes de `<Turnstile />`, añadir:

```tsx
      <Link href="/miembros/login/recuperar">¿Olvidaste tu contraseña?</Link>
```

Mirarlo renderizado (Step 7). Si el enlace queda sin estilo coherente (subrayado/foco/área táctil ≥44px), añadir a `src/components/ui/pantalla-auth.module.css` una clase `.enlace` usando solo tokens de `tokens.css` (color de texto secundario, `:focus-visible` con el anillo de foco existente, `min-height: var(--tap-min)` con `display: inline-flex; align-items: center`) y exponerla en `estilosAuth` igual que `formulario`/`alerta`; luego usar `className={estilosAuth.enlace}` en ambos enlaces (miembros y comercios) y en el "Volver" del Step 3. No usar valores literales.

- [ ] **Step 6: Verificar tipos y lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sin errores.

- [ ] **Step 7: Verificar en el navegador**

Reiniciar el servidor de desarrollo (`pnpm dev`) tras crear rutas nuevas. Abrir `/miembros/login`: se ve el enlace; clic → `/miembros/login/recuperar`; enviar un número inexistente → aparece el mensaje de éxito idéntico. Tomar captura para comprobar el render (no medir con `getComputedStyle`). No redimensionar la ventana (CLAUDE.md): pedir captura móvil al usuario si hace falta.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth/recuperacion.ts src/app/miembros/login src/components/ui/pantalla-auth.module.css
git commit -m "feat: recuperación de contraseña para miembros"
```

---

### Task 5: Pantalla de recuperación de comercios

**Files:**
- Create: `src/app/comercios/login/recuperar/page.tsx`, `actions.ts`, `_components/recuperar-form.tsx`
- Modify: `src/app/comercios/login/_components/login-form.tsx`

**Interfaces:**
- Consumes: `enviarRecuperacion(correo, 'comercio')` (Task 4), `verificarTurnstileDeFormulario`, `ERROR_TURNSTILE`.
- Produces: `solicitarRecuperacionComercio(_prev: RecuperarState, formData: FormData): Promise<RecuperarState>` — campo `email`.

- [ ] **Step 1: Crear `src/app/comercios/login/recuperar/actions.ts`**

```ts
'use server'

import { after } from 'next/server'
import { ERROR_TURNSTILE, verificarTurnstileDeFormulario } from '@/lib/auth/turnstile-request'
import { enviarRecuperacion } from '@/lib/auth/recuperacion'

export type RecuperarState = { enviado?: boolean; error?: string }

/**
 * Pide el enlace para restablecer la contraseña de un comercio (por correo).
 * Misma regla anti-enumeración que la de miembros: respuesta idéntica exista o
 * no la cuenta, y el trabajo real va en `after()`.
 */
export async function solicitarRecuperacionComercio(
  _prev: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email || !email.includes('@')) return { error: 'Ingresa un correo válido.' }

  const captcha = await verificarTurnstileDeFormulario(formData)
  if (!captcha.valido) return { error: ERROR_TURNSTILE }

  after(() => enviarRecuperacion(email, 'comercio'))

  return { enviado: true }
}
```

- [ ] **Step 2: Crear `_components/recuperar-form.tsx`**

Igual que el de miembros (Task 4, Step 3), con estos cambios: función `RecuperarComercioForm`, action `solicitarRecuperacionComercio`, enlace de vuelta a `/comercios/login`, mensaje de éxito "Si el correo está registrado, te enviamos un enlace…", y el campo:

```tsx
      <Field label="Correo electrónico">
        <Input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="comercio@ejemplo.com"
          required
          autoFocus
        />
      </Field>
```

Escribir el archivo completo (no referirse al de miembros), con los mismos imports (`useActionState`, `Link`, `Mail`, `Alert`, `Button`, `Field`, `Input`, `estilosAuth`, `Turnstile`) y la misma estructura `if (state.enviado) … return <form>…`.

- [ ] **Step 3: Crear `page.tsx`**

```tsx
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { RecuperarComercioForm } from './_components/recuperar-form'

export const metadata = { title: 'Recuperar contraseña · ORUM Comercios' }

export default function RecuperarComercioPage() {
  return (
    <PantallaAuth subtitulo="Restablece tu contraseña">
      <RecuperarComercioForm />
    </PantallaAuth>
  )
}
```

- [ ] **Step 4: Enlace en el login de comercios**

En `src/app/comercios/login/_components/login-form.tsx`: importar `Link` y añadir, después del `</Field>` de la contraseña y antes de `<Turnstile />`:

```tsx
      <Link href="/comercios/login/recuperar">¿Olvidaste tu contraseña?</Link>
```

(con `className={estilosAuth.enlace}` si en la Task 4 se creó esa clase).

- [ ] **Step 5: Verificar**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Reiniciar `pnpm dev` y comprobar en el navegador `/comercios/login` → enlace → `/comercios/login/recuperar` → enviar un correo inexistente → mismo mensaje de éxito.

- [ ] **Step 6: Commit**

```bash
git add src/app/comercios/login
git commit -m "feat: recuperación de contraseña para comercios"
```

---

### Task 6: Configuración externa y verificación de punta a punta

**Files:** ninguno (configuración fuera del repo, `.env.local` local).

**Interfaces:** consume todo lo anterior. No produce código.

Esta tarea es manual y bloquea el paso a producción (spec §6 y §11). Los datos de prueba son reales y se limpian al final. **La contraseña de aplicación no se pega en el chat ni en el repo.**

- [ ] **Step 1: Google Workspace** (spec §6, pasos 1-6)

1. Consola de administración → Directorio → Usuarios → admin → Alias de correo: crear `no-reply@<dominio>`.
2. Activar verificación en 2 pasos en la cuenta del admin; si las contraseñas de aplicación están bloqueadas, habilitarlas en Seguridad → Autenticación.
3. myaccount.google.com → Seguridad → Contraseñas de aplicaciones → crear "ORUM" y copiarla.
4. Gmail de esa cuenta → Configuración → Cuentas e importación → "Enviar como" → añadir el alias.
5. Comprobar MX/SPF/DKIM del dominio en Cloudflare DNS (el DKIM se genera en Consola de administración → Apps → Google Workspace → Gmail → Autenticar correo).

- [ ] **Step 2: Variables de entorno**

- `.env.local`: `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `GMAIL_FROM_EMAIL`.
- Vercel (Production **y** Preview): las tres anteriores y `NEXT_PUBLIC_SITE_URL` con el dominio real.

- [ ] **Step 3: Supabase Auth** (dashboard → Authentication → URL Configuration)

1. Añadir `https://<dominio-real>/activar-cuenta` a **Redirect URLs** (Supabase compara la URL con la lista; conviene añadir también `https://<dominio-real>/activar-cuenta**` si valida por comodín, porque `redirectTo` lleva `?rol=…&modo=…`).
2. Confirmar que **Site URL** es el dominio real.
3. Para probar en local, añadir temporalmente `http://localhost:3000/activar-cuenta**`.

- [ ] **Step 4: Verificación 1 — invitación real**

Con `pnpm dev` (o el deploy de Preview), invitar desde el panel admin a un miembro de prueba con un correo propio. Comprobar: el correo llega, el remitente visible es el **alias** (no la cuenta del admin), el clic aterriza en `/activar-cuenta` (ni 404 ni `localhost` en producción), se fija contraseña y se entra al portal.

- [ ] **Step 5: Verificación 2 — recuperación de miembro**

`/miembros/login` → "¿Olvidaste tu contraseña?" → número de membresía del miembro de prueba → llega el correo "Restablece tu contraseña en ORUM" → clic → pantalla titulada "Restablece tu contraseña" → nueva contraseña → entra a `/miembros`. Confirmar que el enlace no sirve una segunda vez.

- [ ] **Step 6: Verificación 3 — recuperación de comercio**

Igual, en `/comercios/login/recuperar` con el correo de un comercio de prueba; termina en `/comercios`.

- [ ] **Step 7: Verificación 4 — anti-enumeración y aislamiento de rol**

1. Número de membresía inexistente y correo de comercio inexistente: mismo mensaje de éxito que los existentes, sin diferencia de tiempo perceptible.
2. Pedir recuperación en `/comercios/login/recuperar` con el correo de un usuario **staff** o **miembro**: la pantalla responde igual pero **no llega correo** (rol distinto).

- [ ] **Step 8: Limpieza y comprobación final**

1. Borrar los miembros/comercios de prueba creados y quitar la Redirect URL de localhost de Supabase si se añadió.
2. Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`
   Expected: todo verde.
3. Revisar `git status`: no debe aparecer `.env.local` ni ninguna contraseña.

- [ ] **Step 9: Cierre**

Actualizar la memoria del proyecto (`project_infraestructura_cloudflare`: Google Workspace ya montado, SMTP con alias) y decidir con el usuario si se hace merge de la rama (`superpowers:finishing-a-development-branch`).

---

## Self-Review

**Cobertura del spec:**
- §2/§5 transporte SMTP + `enviarCorreo` genérico + variables (`GMAIL_FROM_EMAIL`, riesgo del alias): Task 1.
- §3 diagnóstico del redireccionamiento (variable ausente + lista blanca): código en Task 3 (`urlBaseSitio` avisa en producción), configuración en Task 6 pasos 2-3.
- §6 checklist externo (11 pasos): Task 6.
- §7 pantallas de recuperación, enlaces en login, Turnstile, `generateLink` recovery, mensaje genérico: Tasks 4 y 5.
- §8 `/activar-cuenta` con `modo`: Task 3.
- §9 anti-enumeración, fail-closed, un solo uso: Tasks 4-5 (usa `after()`, que además iguala el tiempo de respuesta) y verificación en Task 6 paso 7.
- §10 archivos afectados: todos cubiertos (más los tres `actions.ts` de admin, que usan el nuevo constructor de URL).
- §11 verificación manual: Task 6 pasos 4-7.
- Fuera de alcance respetado: sin recuperación admin, sin SMTP en Supabase, sin correos no-auth.

**Añadido respecto al spec (decisiones del plan, no contradicen el spec):** comprobación de rol y de perfil activo dentro de `enviarRecuperacion` (evita que el portal de comercios dispare la recuperación de una cuenta staff); `after()` en lugar de "seguir hasta el mismo punto del flujo" para la anti-enumeración por tiempo; limpieza de espacios en la contraseña de aplicación; plantilla de recuperación sin nombre (el flujo de miembros solo conoce el correo).

**Placeholders:** ninguno; los pasos con código lo muestran. El único paso condicional (clase `.enlace` de CSS, Task 4 Step 5) indica exactamente qué tokens usar y cuándo aplicarlo.

**Consistencia de tipos:** `enviarCorreo`/`InputCorreo` (Task 1) → usados por `enviarCorreoRecuperacion` (Task 2) → usada por `enviarRecuperacion` (Task 4) → usada por las dos actions. `construirUrlActivacion(urlBase, rol, modo?)` y `urlBaseSitio()` (Task 3) se usan igual en Tasks 3 y 4. `RecuperarState` se define en cada `actions.ts` y cada formulario importa el de su carpeta.
