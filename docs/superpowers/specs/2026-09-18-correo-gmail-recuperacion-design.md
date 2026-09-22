# Correo por SMTP de Gmail y recuperación de contraseña (diseño)

- **Fecha:** 2026-09-18
- **Estado:** Aprobado para planificación
- **Depende de:** Turnstile en los tres logins (rama `turnstile-logins`), Portal de Miembros y
  Portal de Comercios ya construidos, flujo de invitación (`generateLink` + `/activar-cuenta`) ya
  existente.
- **Cubre:** migrar el transporte de correo transaccional de MailerSend a SMTP de Gmail/Google
  Workspace, arreglar el redireccionamiento del enlace de invitación/contraseña nueva (hoy no
  funciona), y agregar "olvidé mi contraseña" para miembros y comercios.

## 1. Objetivo

Hoy el único correo que envía el sistema es la invitación de alta (miembro, empleado o comercio),
por MailerSend, y el enlace de esa invitación no redirige a ningún lado utilizable: hay que asumir
que la función completa (invitar → recibir correo → activar cuenta) no está operativa. Este pase
deja el correo funcionando de punta a punta con infraestructura propia (Google Workspace, ya
configurado), y agrega la posibilidad de recuperar acceso sin depender de un administrador.

## 2. Alcance

**Dentro:**

- Reemplazar MailerSend por SMTP de Gmail en `src/lib/correo/correo.ts`, con un transporte genérico
  reutilizable para cualquier correo futuro (no solo invitaciones).
- Diagnosticar y corregir el redireccionamiento del enlace de invitación/contraseña nueva
  (`/activar-cuenta`), incluida la configuración externa que hoy falta.
- "Olvidé mi contraseña" para **miembros** (por número de membresía) y **comercios** (por correo).
- Reutilizar `/activar-cuenta` como página de destino tanto para invitación como para recuperación.

**Fuera de alcance (este pase):**

- "Olvidé mi contraseña" para el portal admin/staff — decisión ya tomada: un `super_admin`
  reinvita manualmente desde el panel si un empleado pierde el acceso; es un grupo pequeño y
  controlado, no justifica un flujo de autoservicio todavía.
- Configurar SMTP personalizado en Supabase Auth. Ya se evaluó: solo cubriría correos que Supabase
  dispara internamente (que este proyecto no usa, porque el enlace se manda con nuestra propia
  plantilla), y dejaría dos sistemas de correo desconectados en vez de uno. Ver §4 para la división
  exacta de responsabilidades.
- Correos que no sean de autenticación (recibos de venta, recordatorios de vencimiento). El
  transporte genérico de §5 queda listo para ellos, pero construirlos es tarea aparte.
- SPF/DKIM del dominio: se deja como verificación dentro del checklist de §6, no como tarea nueva —
  Google Workspace normalmente ya los deja configurados al activar el dominio.

## 3. Diagnóstico: por qué no redirige hoy

`NEXT_PUBLIC_SITE_URL` no está confirmado en las variables de entorno de Vercel (localmente cae al
valor por defecto `http://localhost:3000` que trae el código, inútil para cualquier usuario real).
Aunque estuviera bien puesta, Supabase Auth **rechaza redirigir** a cualquier URL que no esté en su
lista blanca ("Redirect URLs", Authentication → URL Configuration del dashboard) — y esa lista
nunca se actualizó con el dominio real. Cualquiera de las dos causas produce el mismo síntoma
observado: el enlace no lleva a ninguna parte utilizable. Se corrigen ambas (§6).

## 4. Arquitectura: qué hace cada sistema

Dos responsabilidades separadas que no deben mezclarse:

```
[Server Action]  --generateLink (Admin API)-->  [Supabase Auth]
[Supabase Auth]  --valida `redirectTo` contra su lista blanca-->  permite o no la redirección futura
[Server Action]  --arma el correo con ese action_link y lo envía-->  [SMTP de Gmail]
```

- **Identidad y enlace de un solo uso:** exclusivo de Supabase Auth. Solo Supabase puede firmar un
  token que, al visitarse, deja una sesión válida para ese usuario — nuestro código nunca genera
  esto por su cuenta. Se sigue llamando `admin.auth.admin.generateLink({ type, email, options:
  { redirectTo } })`, que **no envía correo**, solo devuelve el `action_link`.
- **Envío del correo:** exclusivo de nuestro código (§5). Supabase Auth no participa en la entrega;
  sus plantillas de correo integradas no se usan en ningún punto de este sistema.
- **Redirección tras el clic:** la decide Supabase Auth, comparando `redirectTo` contra su lista
  blanca — de ahí que arreglar el redireccionamiento (§6) sea configuración de su dashboard, no
  solo código.

## 5. Transporte de correo (`src/lib/correo/correo.ts`)

- Se reemplaza `mailersend` por `nodemailer`, con un transporte SMTP fijo:
  `smtp.gmail.com:465` (SSL implícito), autenticado con `GMAIL_SMTP_USER` +
  `GMAIL_SMTP_APP_PASSWORD`. El remitente visible (`from`) sale de `GMAIL_FROM_EMAIL`, que es un
  **alias** de la cuenta autenticada (decisión de costos: evita una licencia extra de Workspace por
  ahora). Autenticación y remitente son variables separadas a propósito: migrar a un usuario
  dedicado más adelante es solo cambiar variables de entorno, sin tocar código.
- Se extrae una función genérica:

  ```ts
  export async function enviarCorreo(input: { para: string; nombre: string; asunto: string; html: string; texto: string }): Promise<void>
  ```

  `enviarCorreoInvitacion` pasa a ser un caso particular que arma el asunto/html/texto (sin cambios,
  ya está desacoplado del transporte) y delega en `enviarCorreo`. El correo de recuperación (§7)
  reutiliza la misma función con su propio asunto/plantilla — un solo transporte para todo correo
  transaccional presente y futuro.
- Se mantiene el criterio "best-effort" que ya documenta `.env.example`: si el envío falla, se
  registra en el log del servidor y la operación de negocio (invitación, solicitud de recuperación)
  se completa igual — nunca se le muestra al usuario un error de correo que revele si su cuenta
  existe o no (ver §8, anti-enumeración).
- Variables de entorno: se retiran `MAILERSEND_API_KEY` y `MAILERSEND_FROM_EMAIL`; se agregan
  `GMAIL_SMTP_USER` (correo real de la cuenta de Workspace que autentica, hoy la del admin),
  `GMAIL_SMTP_APP_PASSWORD` (contraseña de aplicación de esa cuenta, no su contraseña normal) y
  `GMAIL_FROM_EMAIL` (alias que ven los destinatarios, p. ej. `no-reply@<dominio>`). El `from` se
  arma como `"ORUM" <GMAIL_FROM_EMAIL>`. `.env.example` se actualiza con el mismo estilo de
  comentarios que ya tiene.
- Riesgo asumido: mientras se use la cuenta del admin, un cambio de contraseña o suspensión de esa
  cuenta detiene el envío de correos. Mitigación: pasar a un usuario dedicado (solo variables de
  entorno) cuando el costo de la licencia se justifique.

## 6. Configuración externa (checklist, fuera del código)

**Google Workspace (cuenta del admin como remitente autenticado; alias como remitente visible):**

1. Crear el alias (Consola de administración → Directorio → Usuarios → admin → Alias de correo),
   p. ej. `no-reply@<dominio>`.
2. Activar verificación en 2 pasos en la cuenta del admin (requisito para generar contraseñas de
   aplicación). Si las contraseñas de aplicación están bloqueadas por política, habilitarlas en
   Consola de administración → Seguridad → Autenticación.
3. Generar una contraseña de aplicación (myaccount.google.com → Seguridad → Contraseñas de
   aplicaciones) y guardarla como `GMAIL_SMTP_APP_PASSWORD` en Vercel — nunca en el repo ni en el chat.
4. En Gmail de esa cuenta: Configuración → Cuentas e importación → "Enviar como" → añadir el alias.
   Sin este paso Gmail reescribe el remitente a la cuenta autenticada.
5. Confirmar el límite de envío de Workspace (~2000 correos/día por cuenta vía SMTP): de sobra
   para invitaciones y recuperaciones al volumen actual.
6. Verificar (no crear) que el dominio tenga MX/SPF/DKIM — el DKIM se genera en Consola de
   administración → Apps → Google Workspace → Gmail → Autenticar correo; revisar en Cloudflare DNS
   si algún correo empieza a caer en spam. La verificación es por dominio, no por usuario.

**Vercel:**

7. Definir `NEXT_PUBLIC_SITE_URL` en Production y Preview con el dominio real (hoy ausente — causa
   raíz del §3).
8. Definir `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD` y `GMAIL_FROM_EMAIL`.

**Supabase Auth (dashboard, Authentication → URL Configuration):**

9. Agregar `https://<dominio-real>/activar-cuenta` a "Redirect URLs".
10. Confirmar que "Site URL" apunta al dominio real (afecta comportamiento interno de Auth aunque no
    se usen sus plantillas de correo).

**Verificación end-to-end (no continúa a producción sin esto):**

11. Confirmar que el correo llega con el alias como remitente (no la cuenta del admin), y luego invitar a un miembro de prueba real, recibir el correo, hacer clic, confirmar que aterriza en
   `/activar-cuenta` (no un 404 ni `localhost`) y que el flujo completo hasta el portal funciona.

## 7. "Olvidé mi contraseña"

Dos pantallas nuevas, mismo mecanismo (`generateLink({ type: 'recovery', ... })`) que ya usa la
invitación — no es un flujo nuevo desde cero, es el mismo Admin API con otro `type`:

| Portal | Ruta nueva | Pide | Resuelve correo vía |
|---|---|---|---|
| Comercios | `/comercios/login/recuperar` | Correo | Directo (ya es correo) |
| Miembros | `/miembros/login/recuperar` | Número de membresía | `resolverCorreoPorNumeroMembresia` (`src/lib/miembros/auth-miembro.ts`), igual que el login |

Miembros pide número y no correo a propósito: es el mismo dato que ya usa para entrar (RF-06), y el
socio no necesariamente recuerda qué correo quedó registrado en su alta.

Ambas pantallas:

- Enlace "¿Olvidaste tu contraseña?" en `login-form.tsx` de miembros y de comercios (admin no lo
  lleva, ver §2).
- Turnstile, mismo patrón que los tres logins existentes — es exactamente el tipo de formulario
  público que dispara un efecto de lado (correo saliente) que ya se decidió proteger.
- `generateLink({ type: 'recovery', email, options: { redirectTo: '.../activar-cuenta?rol=<rol>&modo=recuperar' } })`
  seguido de `enviarCorreo` (§5) con una plantilla nueva ("Restablece tu contraseña en ORUM").
- Server action responde **siempre** el mismo mensaje genérico, exista o no la cuenta (§8).

## 8. Página de destino: `/activar-cuenta` reutilizada

Mismo componente (`ActivarForm`) para invitación y recuperación — el mecanismo es idéntico
(Supabase deja una sesión válida al seguir el enlace; luego `supabase.auth.updateUser({ password
})`). Cambia solo el copy, controlado por un nuevo query param `modo`:

- `?modo=recuperar` → título "Restablece tu contraseña" en vez de "Elige tu contraseña".
- Sin el param (como hoy) → se asume invitación, sin cambios de comportamiento para los flujos
  existentes.

El destino tras guardar sigue resolviéndose por `rol` exactamente como hoy (`DESTINO_POR_ROL` en
`activar-form.tsx`) — recuperación no cambia esa lógica, solo cómo se llegó a la pantalla.

## 9. Seguridad

- **Anti-enumeración:** ninguna de las dos pantallas de recuperación revela si el número de
  membresía o el correo corresponden a una cuenta real. Mismo mensaje de éxito siempre, mismo
  tiempo de respuesta aproximado (no cortar temprano si `resolverCorreoPorNumeroMembresia` no
  encuentra nada — seguir hasta el mismo punto del flujo antes de responder).
- **Turnstile fail-closed**, igual que los logins (§7).
- **Sin rate limit propio en este pase:** `generateLink` es una llamada de administración y NO
  está sujeta al limitador de correos de GoTrue, así que no hay tope nativo. Riesgo aceptado:
  quien resuelva Turnstile puede enviar recuperaciones repetidas a una dirección conocida o
  consumir la cuota diaria de Workspace, lo que también detendría las invitaciones. Mitigación:
  Turnstile ahora, más una regla de rate limiting de Cloudflare sobre
  `/miembros/login/recuperar` y `/comercios/login/recuperar` en la Fase 2 de Cloudflare prevista.
- El enlace de recuperación es de un solo uso y expira igual que el de invitación (comportamiento
  nativo de Supabase Auth, sin configuración adicional).

## 10. Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/lib/correo/correo.ts` | Transporte Nodemailer/Gmail, `enviarCorreo` genérico |
| `.env.example`, `.env.local` | Quitar `MAILERSEND_*`, agregar `GMAIL_SMTP_USER`/`GMAIL_SMTP_APP_PASSWORD`/`GMAIL_FROM_EMAIL` |
| `package.json` | Quitar `mailersend`, agregar `nodemailer` (+ `@types/nodemailer`) |
| `src/app/activar-cuenta/_components/activar-form.tsx` | Copy condicional por `modo` |
| `src/app/miembros/login/_components/login-form.tsx` | Enlace a `/miembros/login/recuperar` |
| `src/app/comercios/login/_components/login-form.tsx` | Enlace a `/comercios/login/recuperar` |
| `src/app/miembros/login/recuperar/page.tsx` + `_components/recuperar-form.tsx` + `actions.ts` | Nuevo |
| `src/app/comercios/login/recuperar/page.tsx` + `_components/recuperar-form.tsx` + `actions.ts` | Nuevo |
| `src/lib/correo/` | Nueva plantilla de correo de recuperación (junto a `construirCorreoInvitacion`) |

## 11. Verificación

Sin pruebas automatizadas de interfaz (convención ya establecida del proyecto). Verificación
manual, con datos de prueba reales y limpieza posterior, igual que se hizo con el trigger de
`ventas`:

1. Invitación real end-to-end (§6, paso 11), comprobando también que el remitente visible es el alias.
2. Recuperación real end-to-end para un miembro de prueba (número de membresía → correo → clic →
   nueva contraseña → entra al portal).
3. Recuperación real end-to-end para un comercio de prueba (mismo flujo, por correo).
4. Confirmar que un número de membresía o correo inexistente responde igual que uno existente (sin
   diferencia observable).
