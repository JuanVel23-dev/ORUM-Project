# Verificación OWASP — estado de `BACKEND-PENDIENTE.md`

> Cruza los 12 puntos de [`BACKEND-PENDIENTE.md`](BACKEND-PENDIENTE.md) contra OWASP Top 10:2021.
> Para cada punto: a qué categoría OWASP pertenece, qué quedó **confirmado leyendo el código**
> y, desde que hay MCP de Supabase conectado, qué se **verificó directamente contra la base de
> datos de producción** (RLS, políticas, privilegios de funciones) sin depender del Dashboard.
>
> **Última actualización:** 2026-08-19 · Verificado y cerrado con
> [`docs/superpowers/plans/2026-08-19-hotfix-auditoria-owasp.md`](superpowers/plans/2026-08-19-hotfix-auditoria-owasp.md).

---

## Resumen

| # | Punto | OWASP Top 10:2021 | Estado |
|---|---|---|---|
| 1 | Dos membresías activas a la vez | A04 Insecure Design · A08 Data Integrity | 🟢 Resuelto |
| 2 | RLS sin activar | A01 Broken Access Control · A05 Security Misconfiguration | 🟢 No aplicaba — ya estaba activo |
| 3 | Sin límite de intentos de login | A07 Identification & Auth Failures | ⏳ Pendiente de Dashboard |
| 4 | Datos sin escapar en el correo | A03 Injection | 🟢 Resuelto |
| 5 | Contraseñas en claro por correo | A02 Cryptographic Failures | 🟢 Resuelto |
| 6 | Flujos multi-tabla sin transacción | A04 Insecure Design · A08 Data Integrity | 🟡 Mitigado parcialmente (ver nota) |
| 7 | No se puede dar de baja a nadie | A04 Insecure Design (ciclo de vida de datos) | 🟡 Confirmado — hueco funcional |
| 8 | No se puede cancelar ni suspender | A04 Insecure Design | 🟡 Confirmado — hueco funcional |
| 9 | Los miembros no se desactivan | A04 Insecure Design | 🟡 Confirmado — falta la columna en BD |
| 10 | Sin comprobante de pago | A09 Security Logging (soporte de auditoría) | 🟡 Confirmado — hueco funcional |
| 11 | `codigo_publico` sin usar | No aplica (decisión de producto) | 🔵 Confirmado — cero usos |
| 12 | Techo de 9.999 miembros | No aplica (capacidad) | 🔵 No urgente |
| 13 | `registrar_venta` sin validar promoción, expuesta a `authenticated` | A04 Insecure Design | 🟢 Resuelto |
| 14 | Protección de contraseñas filtradas desactivada | A07 Identification & Auth Failures | ⏳ Pendiente de Dashboard |

---

## 🟢 1. Dos membresías activas a la vez — resuelto

**OWASP:** A04 Insecure Design (invariante de negocio no forzada a nivel de datos) + A08 Software
and Data Integrity Failures (condición de carrera que infla ingresos reportados).

El índice único `uq_membresia_activa` (`membresias(miembro_id) WHERE estado = 'activa'`) **ya
existe en producción** — la documentación de esquema del repo estaba desactualizada. Pero su
sola existencia, sin ajustar el código, generó un bug propio: `renovarMembresia`
(`src/app/admin/miembros/actions.ts`) insertaba la fila nueva `'activa'` **antes** de marcar la
anterior `'vencida'`, así que el índice rechazaba el `INSERT` con `duplicate key` en toda
renovación de un miembro que ya tuviera membresía vigente — el caso normal.

**Confirmado con una simulación SQL (BEGIN/ROLLBACK, sin persistir nada) vía Supabase MCP**, antes
y después del cambio. Corregido reordenando la escritura: vencer la anterior primero, insertar la
nueva después, con reversión si el `INSERT` falla.

---

## 🟢 2. RLS — ya estaba activo, no aplicaba

**OWASP:** A01 Broken Access Control + A05 Security Misconfiguration.

Verificado directamente contra `pg_class`/`pg_policy` vía Supabase MCP: **RLS está activo en las
7 tablas** (`miembros`, `membresias`, `ventas`, `bitacora_actividad`, `comercios`, `sucursales`,
`promociones`), con políticas granulares por rol — admin, dueño del comercio, miembro propio —
no solo activado en bruto. La sospecha original ("no hay carpeta `supabase/migrations/`, no se
puede verificar desde el repo") era correcta en cuanto a que no había registro en el repo, pero
la conclusión de "sin confirmar" ya no aplica: se verificó directamente contra la base.

`supabase/migrations/` ahora sí existe en el repo (creada en este plan para las migraciones de
los puntos 1 y 13), así que los próximos cambios de esquema quedan versionados.

---

## ⏳ 3. Sin límite de intentos de login — pendiente de Dashboard

**OWASP:** A07 Identification and Authentication Failures.

**Confirmado en código:** búsqueda de `rate.?limit|captcha|hcaptcha|turnstile` en `src/` no arroja
resultados. Los tres accesos (`/login`, `/miembros/login`, `/comercios/login`) llaman
`signInWithPassword` sin contador ni bloqueo.

**Sigue sin ser verificable vía MCP**: los límites de intentos de Auth no están expuestos por las
herramientas de Supabase MCP disponibles (`execute_sql`, `get_advisors`, etc. no leen
configuración de Auth). Verificación pendiente en Dashboard → Authentication → Rate Limits.

---

## 🟢 4. Datos de usuario sin escapar en el HTML del correo — resuelto

**OWASP:** A03 Injection (HTML injection en el cliente de correo del destinatario).

Se agregó `escaparHtml` (`src/lib/shared/html.ts`, función pura con tests) y se aplica a
`nombre`/`correo` antes de interpolarlos en `construirCorreoInvitacion`
(`src/lib/correo/correo.ts`). Verificado con un test que intenta inyectar
`Juan <img src=x onerror=alert(1)>` y confirma que el HTML resultante no contiene `<img`.

---

## 🟢 5. Contraseñas en claro por correo — resuelto

**OWASP:** A02 Cryptographic Failures (exposición de credenciales en un canal persistente).

`registrarMiembro`, `crearUsuario` y `crearComercio` (las tres altas que generaban o emailaban una
contraseña) ya no generan ni envían contraseña alguna: usan
`admin.auth.admin.generateLink({ type: 'invite' })`, que crea el usuario y devuelve un enlace de un
solo uso. El correo (`enviarCorreoInvitacion`) solo lleva ese enlace. Una pantalla compartida,
`/activar-cuenta`, confirma la sesión que deja el enlace y deja que la persona elija su propia
contraseña con `supabase.auth.updateUser`, antes de redirigirla a su portal (`/admin`, `/comercios`
o `/miembros` según el rol). `generarPassword` (`src/lib/shared/password.ts`) quedó sin ningún
llamador y se eliminó.

---

## 🟡 6. Los flujos multi-tabla no son atómicos — mitigado parcialmente

**OWASP:** A04 Insecure Design + A08 Data Integrity Failures.

`registrarMiembro` y `renovarMembresia` siguen escribiendo en varias tablas con compensación
manual (`revertir()` / reversión del `UPDATE`) en vez de una función RPC transaccional real. El
punto 1 (la corrupción de datos más grave — dos membresías activas) ya está cerrado por el índice
único, independientemente de la atomicidad de la aplicación. Migrar `renovarMembresia` y
`registrarMiembro` a funciones RPC en Postgres sigue siendo la solución de fondo, pero queda como
mejora arquitectónica futura, no como hotfix — el hotfix de este plan resuelve el síntoma
observable (el bug de renovación) sin rediseñar el flujo completo.

---

## 🟡 7-10. Funcionalidad que la base da por hecha y no existe

Sin cambios respecto a la auditoría anterior — no son vulnerabilidades OWASP directas, pero A04
Insecure Design cubre el patrón: el esquema previó estos controles de ciclo de vida y ninguna
server action los dispara.

| # | Confirmado en código |
|---|---|
| 7. Sin baja lógica | `deleted_at` se lee (`is('deleted_at', null)`) en decenas de archivos; cero escrituras en todo `src/`. |
| 8. Sin cancelar/suspender | `EstadoMembresia` incluye `'cancelada' \| 'suspendida'` (`database.types.ts`); ningún `.update` los escribe. |
| 9. Miembros sin activar/desactivar | `comercios`, `perfiles`, `planes_membresia` y `promociones` tienen columna `activo`; `miembros` **no tiene esa columna en absoluto**. No es solo falta de UI: falta el campo en la base. |
| 10. Sin comprobante de pago | `comprobante_url` solo aparece en `database.types.ts`; cero escrituras y ningún bucket de Storage referenciado en el repo. |

---

## 🔵 11-12. Decisiones abiertas (no son hallazgos OWASP)

- **11. `codigo_publico`:** solo aparece en `database.types.ts`; cero usos reales en `src/`. El QR
  usa `numero_membresia`. Confirmado como columna sin consumir.
- **12. Techo de 9.999 miembros:** `generarNumeroMembresia` (`src/lib/miembros/membresias.ts`)
  genera 4 dígitos secuenciales + 4 aleatorios. Confirmado el límite; no urgente.

---

## 🟢 13. `registrar_venta` sin validar promoción, expuesta a `authenticated` — resuelto

**OWASP:** A04 Insecure Design.

**Hallazgo nuevo**, no estaba en la auditoría original. `registrar_venta` es una función
`SECURITY DEFINER` en la base de datos (distinta del código de la app: `registrarVenta` en
`src/app/comercios/(portal)/actions.ts` hace un `insert` directo con sus propias validaciones y
nunca llama a esta función vía `.rpc()`). A diferencia del código de la app, `registrar_venta`
**no valida que la promoción sea del comercio ni revalida su vigencia, y confía en el
`p_valor_descuento` recibido por parámetro**. Estaba expuesta por REST
(`/rest/v1/rpc/registrar_venta`) a `anon` y `authenticated` — un comercio autenticado podía
llamarla directo y fabricar un descuento, saltándose toda la lógica de `registrarVenta()`.

Como el código de la app no la usa, se revocó el acceso en vez de arreglarla — menos superficie
que mantener. **Importante:** revocar el grant individual de `anon`/`authenticated` no bastó,
porque Postgres otorga `EXECUTE` a `PUBLIC` (pseudo-rol = todos los roles) por defecto al crear una
función, y ese grant se suma vía UNION independientemente de los revokes individuales. Hizo falta
un segundo `REVOKE ... FROM PUBLIC`. Verificado con `information_schema.routine_privileges`: solo
quedan `postgres` y `service_role`.

---

## ⏳ 14. Protección de contraseñas filtradas desactivada — pendiente de Dashboard

**OWASP:** A07 Identification and Authentication Failures.

**Hallazgo nuevo.** `mcp__supabase__get_advisors(type: "security")` reporta
`auth_leaked_password_protection`: Supabase Auth puede rechazar contraseñas que aparecen en
HaveIBeenPwned.org, y esa verificación está desactivada.

**No accionable desde el repo ni desde el MCP disponible** (no hay herramienta MCP para tocar
configuración de Auth). Se activa en Dashboard → Authentication → Policies → Password Security →
"Leaked password protection".

---

## Controles ya verificados

Sin secretos en el historial de git, `service_role` protegida con `import 'server-only'`, sin
concatenación de SQL, contraseñas solo en Supabase Auth, ninguna consulta con `select('*')`,
`registrarVenta` (la acción de la app, no la función `registrar_venta` de la BD — ver punto 13)
re-derivando el descuento en servidor. Las funciones `SECURITY DEFINER` restantes marcadas por el
linter de seguridad (`es_admin`, `es_super_admin`, `rol_actual`, `buscar_miembro_comercio`,
`estado_membresia_por_numero`, `fn_auditar`) se revisaron una por una: son helpers de RLS que se
autoverifican con `auth.uid()` (devuelven `false`/lanzan excepción para quien no tiene el rol
correcto) o funciones de trigger que Postgres bloquea si se invocan fuera de un trigger — ninguna
requiere acción.

---

## Pendiente (no resuelto en este plan)

1. **Punto 3** (límite de intentos de login) y **punto 14** (protección de contraseñas filtradas):
   ambos requieren Dashboard → Authentication, sin equivalente en las herramientas MCP disponibles.
2. **Punto 6**: `renovarMembresia` y `registrarMiembro` siguen sin ser transaccionales de verdad
   (compensación manual, no RPC). El síntoma agudo (punto 1) ya está cerrado por el índice único;
   la atomicidad completa queda como mejora arquitectónica futura.
3. Los puntos 7-10 quedan como backlog funcional, sin cambios respecto a la auditoría anterior.
