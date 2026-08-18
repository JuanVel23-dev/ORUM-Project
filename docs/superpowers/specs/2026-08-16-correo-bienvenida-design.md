# Correo de bienvenida con credenciales

> Spec de diseño. Cubre la idea pendiente registrada en ROADMAP §10: al registrar un miembro o un
> usuario interno, enviarle un correo con sus credenciales de acceso y un botón al login
> correspondiente. Retoma el brainstorming de 2026-08-12 (pausado antes de elegir proveedor).
>
> **Fecha:** 2026-08-16

---

## 1. Qué es y qué no es

Hoy, al registrar un miembro (`/admin/miembros`) o un usuario interno (`/admin/usuarios`), la
contraseña autogenerada solo se muestra una vez en pantalla al admin/empleado que hizo el
registro; el usuario nuevo no se entera de nada. Este pase agrega el envío de un correo con esas
credenciales y un enlace directo al login que le corresponde.

**Alcance:**

- Se envía al registrar un **miembro** (`registrarMiembro`) y al crear un **usuario interno**
  (`crearUsuario`, tipo `empleado` o `super_admin`).
- **Comercios queda excluido** — ya se documentó como fuera de alcance en el spec del Portal de
  Comercios (2026-08-12); su portal de login no tiene el mismo flujo de credenciales visibles.
- Contenido del correo: saludo con el nombre, correo de acceso, contraseña, y un botón al login
  correcto (`/login` para staff, `/miembros/login` para miembros). Sin logo ni branding adicional.
- Envío **best-effort**: un fallo del proveedor de correo nunca bloquea ni revierte el registro. La
  pantalla sigue mostrando la contraseña una sola vez, sin cambios — el correo es un canal
  adicional, no un reemplazo.

**Fuera de alcance de este pase:**

- Reenvío manual del correo (ej. botón "reenviar credenciales" en la ficha del miembro/usuario).
- Indicador en la UI de si el correo se envió o falló.
- Renovaciones de membresía, edición de datos, ni ningún otro evento — solo el alta inicial.
- Verificación de dominio propio en MailerSend — la cuenta hoy es trial, remitente y destinatarios
  restringidos al dominio/correo de prueba. El diseño deja el remitente en variable de entorno para
  que el cambio a dominio verificado sea solo una actualización de config, sin tocar código.

---

## 2. Proveedor y dependencias

**MailerSend**, vía su SDK oficial de Node (`mailersend` en npm — `MailerSend`, `EmailParams`,
`Sender`, `Recipient`). Ya existe una cuenta trial con API token.

**Nueva dependencia:** `mailersend` (dependencies, no dev).

**Variables de entorno nuevas** (`.env.local`, y placeholder en `.env.example` si existe):

- `MAILERSEND_API_KEY` — token de la cuenta.
- `MAILERSEND_FROM_EMAIL` — remitente; hoy limitado al dominio/correo de prueba de la cuenta trial.
- `NEXT_PUBLIC_SITE_URL` — base para el botón de login; por defecto `http://localhost:3000` si no
  está definida.

---

## 3. Módulo `src/lib/correo/correo.ts`

Mismo patrón de organización por dominio que `lib/bitacora`, `lib/miembros`, etc. Dos funciones:

```
construirCorreoBienvenida(input): { asunto: string; html: string; texto: string }
```

Función **pura**, sin red. Recibe `{ nombre, correo, password, rol: 'miembro' | 'staff' }` y arma
el asunto y el cuerpo del correo (HTML + texto plano) con el botón/enlace apuntando a
`/miembros/login` o `/login` según `rol`, usando `NEXT_PUBLIC_SITE_URL` como base. Testeable sin
mocks — mismo rol que `resumirEventoBitacora` en `bitacora.ts`.

```
enviarCorreoBienvenida(input): Promise<void>
```

Toma el mismo input, llama a `construirCorreoBienvenida`, arma el `EmailParams` del SDK
(`Sender`/`Recipient` desde las env vars y el input) y llama a `mailerSend.email.send(...)`.
Envuelve todo en `try/catch`; si falla, `console.error` con el motivo y **nunca lanza** — idéntico
al patrón best-effort de `registrarActividad` en `lib/bitacora/bitacora.ts`.

El cliente `MailerSend` se instancia una sola vez a nivel de módulo con `MAILERSEND_API_KEY`.

---

## 4. Integración en los registros existentes

En ambos actions, la llamada va **justo después** de que el registro queda confirmado en base de
datos — nunca antes, para que un fallo de correo jamás pueda impedir la creación de la cuenta.

- **`registrarMiembro`** (`src/app/admin/miembros/actions.ts`): después de insertar la membresía y
  llamar a `registrarActividad(..., 'alta', ...)`, se llama a
  `enviarCorreoBienvenida({ correo, nombre: \`${nombres} ${apellidos}\`, password, rol: 'miembro' })`.
- **`crearUsuario`** (`src/app/admin/usuarios/actions.ts`): después de insertar en `empleados`, se
  llama a
  `enviarCorreoBienvenida({ correo: email, nombre: \`${nombres} ${apellidos}\`, password, rol: 'staff' })`.

Ambas llamadas se `await`-ean (igual que `registrarActividad`), pero como la función nunca lanza,
el `return { ok: true, ... }` de cada action se sigue ejecutando exactamente igual que hoy.

---

## 5. Manejo de errores

Cualquier falla del SDK (red, API key inválida, destinatario rechazado por la restricción de la
cuenta trial) se captura dentro de `enviarCorreoBienvenida`, se loguea con `console.error` y no se
propaga. No revierte el registro, no cambia la respuesta de la action, no aparece en la UI.

---

## 6. Testing

- `construirCorreoBienvenida` — tests unitarios (vitest) puros, mismo estilo que
  `bitacora.test.ts`: verifican asunto, que el cuerpo incluya correo y contraseña, y que el enlace
  sea `/login` o `/miembros/login` según `rol`.
- `enviarCorreoBienvenida` — sin test directo. Llama a un servicio externo real vía SDK; el
  proyecto no mockea SDKs externos en esta capa (mismo criterio que `registrarActividad`, que
  tampoco tiene test propio).
- No se agregan tests de integración a `registrarMiembro`/`crearUsuario` para el correo — ya
  tienen cobertura, y el envío es best-effort, no observable desde el resultado de la action.

---

## 7. Checklist de implementación (referencia, no reemplaza el plan)

1. `pnpm add mailersend`.
2. Agregar `MAILERSEND_API_KEY`, `MAILERSEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` a `.env.local`.
3. Crear `src/lib/correo/correo.ts` con `construirCorreoBienvenida` + `enviarCorreoBienvenida`.
4. Crear `src/lib/correo/correo.test.ts` para la función pura.
5. Integrar la llamada en `registrarMiembro` y `crearUsuario`.
6. Probar manualmente con la cuenta trial (correo propio verificado en MailerSend).
7. Actualizar ROADMAP §10: mover esta idea de "pendiente" a implementada, o cerrarla si aplica.
