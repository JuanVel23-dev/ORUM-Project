# Auditoría de seguridad

> Revisión de los 20 puntos solicitados, más la correspondencia con OWASP Top 10 (2021).
>
> Cada veredicto sale de una comprobación sobre el código o la configuración, no de una
> impresión. Donde no se pudo comprobar desde aquí, se dice.
>
> **Fecha:** 2026-08-19 · **Commit auditado:** rama `main`

---

## Resumen

| Estado | Puntos |
|---|---|
| ✅ Cumple | 1, 2, 3, 6, 8, 9, 10, 13, 14, 15*, 16, 17 |
| ⚠️ Parcial | 5, 18, 19, 20 |
| ❌ No cumple | 4, 11, 12 |
| — No aplica | — |

\* El punto 15 cumple en la interfaz; falla en el correo (ver detalle).

**Lo que más urge:** activar RLS (4) y limitar los intentos de login (11).

---

## Los 20 puntos

### ✅ 1. Ocultar la API Key

Las claves viven en `.env.local`, que está en `.gitignore`. El repositorio solo
contiene `.env.example` con los nombres y sin valores.

**Comprobado:** se buscó `SUPABASE_SERVICE_ROLE_KEY` y el prefijo `sb_secret_` en los
**56 chunks de JavaScript compilados** que se sirven al navegador. Cero apariciones.

### ✅ 2. Purgar los secretos del historial de git

**Comprobado:** se recorrió **todo el historial de todas las ramas** buscando archivos
`.env` añadidos alguna vez y patrones de clave de Supabase.

Resultado: el único archivo `.env*` que ha existido es `.env.example`, y no hay ninguna
clave con formato Supabase en ningún commit. **No hay nada que purgar.**

### ✅ 3. Usar la clave pública en la base de datos

El navegador nunca habla con Supabase directamente: no existe ningún uso de
`@/lib/supabase/client` en el código. Todo pasa por Server Components y server actions.

La `service_role` está aislada en `src/lib/supabase/admin.ts`, que además lleva
`import 'server-only'`: importarla desde un componente cliente **rompe la compilación**,
no falla en silencio.

### ❌ 4. Activar el RLS

**No está activo en todas las tablas.** La autorización vive en la aplicación
(`requireRol`), que es una sola capa.

Importa más ahora que los portales de Miembros y Comercios están publicados y entran
usuarios ajenos al equipo. → `BACKEND-PENDIENTE.md`, punto 2.

### ⚠️ 5. Encriptación de datos sensibles

Supabase cifra en reposo y en tránsito, así que la base está cubierta. Los datos
personales que se guardan (cédula, teléfono, dirección) están en claro en columnas
normales, lo cual es lo habitual y permite buscarlos.

**Lo que sí falla:** el correo de bienvenida envía **la contraseña en claro** y queda
indefinidamente en el buzón del usuario. → `BACKEND-PENDIENTE.md`, punto 5.

### ✅ 6. Forzar la autenticación en el servidor

Toda página bajo `/admin` pasa por `requireRol` en su layout, y **cada server action
vuelve a verificar el rol al entrar** — no confía en que la página ya lo hiciera.

Los portales tienen sus propias guardias: `requireRolMiembro` / `requireMiembroVigente`
y `requireRolComercio`. Ocultar un enlace no protege nada, y el código lo trata así.

### ✅ 7. Restringir el acceso a los registros

En la aplicación, sí: cada consulta acota por el actor. El Portal de Miembros usa
siempre el cliente de sesión, nunca el admin, salvo en el login (antes de que exista
sesión).

`registrarVenta` es el mejor ejemplo: **re-deriva el miembro en servidor** desde el
número de membresía y valida que la sucursal y la promoción pertenezcan al comercio que
está operando, en vez de fiarse del formulario.

**Matiz:** en la base todavía falta la segunda capa (punto 4).

### ✅ 8. Bloquear la manipulación de campos

No hay asignación masiva en ninguna acción: cada una **lee campo por campo** con
`formData.get('...')` y valida tipo y rango. Nunca se vuelca un objeto entero del
formulario a la base.

`registrarVenta` va más allá y **recalcula el descuento en servidor** para porcentaje y
monto fijo, ignorando el valor que mandó el navegador.

### ✅ 9. Asegurar las cookies de sesión

Las gestiona `@supabase/ssr` mediante `cookies()` de Next: `httpOnly`, `secure` en
HTTPS y `sameSite` por defecto. El código no las manipula a mano en ningún sitio.

El service worker **nunca cachea HTML autenticado ni respuestas de Supabase**, para que
la sesión no quede en el almacenamiento del navegador.

### ✅ 10. Hashear las contraseñas

Las contraseñas viven **solo en Supabase Auth**, que las almacena con bcrypt. Se
comprobó que ninguna tabla propia guarda contraseñas ni hashes.

`src/lib/shared/password.ts` solo **genera** contraseñas aleatorias; no almacena.

### ❌ 11. Limitar los intentos de login

**No hay ninguna limitación.** Ni rate limiting, ni bloqueo por intentos, ni retardo
progresivo, en ninguno de los tres accesos.

Es el punto más expuesto junto con RLS, porque el usuario del Portal de Miembros es un
número de 8 dígitos con estructura conocida. → `BACKEND-PENDIENTE.md`, punto 3.

### ❌ 12. Protección antibots

No hay captcha en ningún formulario.

**Matiz:** ninguno de los tres accesos es público-masivo —no hay registro abierto—, así
que el riesgo real es menor que en un sitio con alta público. Recomendación: **no
añadirlo todavía**. Añade fricción a un cajero con prisa, y sin el punto 11 resuelto no
sirve de mucho. Primero rate limiting; captcha solo si aparece abuso.

### ✅ 13. Parametrizar las consultas SQL

**No se construye SQL en ningún sitio.** Todo va por los filtros de PostgREST
(`.eq()`, `.ilike()`, `.in()`), que viajan parametrizados.

Los dos sitios con texto libre en un `.or()` —búsqueda de miembros y de bitácora— lo
**sanean antes**, quitando los caracteres que son estructura del filtro (`,()%*\`).
Sin eso, buscar "Pérez, Juan" no inyecta: rompe la consulta. Pero el saneado está y es
correcto.

### ✅ 14. Validar todos los inputs

Todas las validaciones son de **servidor**, dentro de las acciones: tipos, rangos,
obligatoriedad, formato. El número de membresía se valida con `/^\d{8}$/` antes de
tocar la base.

Las restricciones del navegador (`required`, `type="email"`) son comodidad, no
seguridad, y el código no depende de ellas.

### ⚠️ 15. Escapar todo el contenido del usuario

**En la interfaz, sí.** React escapa por defecto, y el único
`dangerouslySetInnerHTML` del proyecto es el script anti-parpadeo del tema, con una
cadena estática sin ninguna entrada de usuario.

**En el correo, no.** `correo.ts` interpola `nombre`, `correo` y `password` en HTML sin
escapar. → `BACKEND-PENDIENTE.md`, punto 4.

### ✅ 16. Restringir la subida de archivos

**No hay subida de archivos en el proyecto.** El logo del comercio se introduce como
URL (`<input type="url">`), no como fichero.

Cuando se implemente el comprobante de pago (`BACKEND-PENDIENTE.md`, punto 10) habrá
que definir tipos permitidos, tamaño máximo y política del bucket. Hoy la superficie de
ataque es cero.

### ✅ 17. Recortar las respuestas de la API

**Ninguna consulta usa `select('*')`**: todas piden columnas explícitas. La ficha del
miembro, por ejemplo, no trae `deleted_at` ni marcas de tiempo que no muestra.

Las respuestas de las server actions devuelven objetos formados a mano, no filas
crudas.

### ⚠️ 18. Agregar headers de seguridad

**No había ninguno.** Se añadieron en esta auditoría (`next.config.ts`):

| Cabecera | Qué evita |
|---|---|
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | Clickjacking |
| `X-Content-Type-Options: nosniff` | Adivinación de tipo MIME |
| `Referrer-Policy: strict-origin-when-cross-origin` | Que `/admin/miembros/42/editar` viaje a dominios externos |
| `Permissions-Policy` | Micrófono, geolocalización, pagos y USB denegados; cámara permitida en el mismo origen para el escáner QR |
| `Strict-Transport-Security` | Que la primera visita viaje en claro |

**Queda parcial** porque **falta una CSP completa**. Next inyecta scripts en línea y una
CSP mal puesta rompe la aplicación en producción sin avisar en desarrollo: necesita
hacerse con nonces y probarse desplegada.

### ⚠️ 19. Forzar HTTPS

`Strict-Transport-Security` ya va en las cabeceras, pero el navegador **solo la respeta
si la primera visita llegó por HTTPS**. La redirección de HTTP a HTTPS la tiene que
hacer la plataforma de despliegue (Vercel lo hace por defecto).

**Pendiente de confirmar al desplegar.** No se puede validar desde desarrollo.

### ⚠️ 20. Escanear las dependencias

`pnpm audit` daba **20 vulnerabilidades (13 altas, 7 moderadas)**.

Se actualizó Next de 16.2.10 a **16.2.11**, que corrige una alta y una moderada.
**Quedan 11** (9 altas, 2 moderadas) en dependencias transitivas: `sharp`, `postcss`,
`nanoid`, `js-yaml`, `brace-expansion`.

No se forzaron a mano porque son transitivas: sobrescribirlas puede romper la
compilación, y hay que hacerlo con el proyecto verificable. **Tarea abierta**, y
conviene añadir `pnpm audit` a la rutina antes de cada despliegue.

---

## Correspondencia con OWASP Top 10 (2021)

| | Categoría | Estado |
|---|---|---|
| **A01** | Pérdida de control de acceso | ⚠️ La aplicación lo hace bien —`requireRol` en cada página y acción, consultas acotadas por actor— pero **falta RLS** como segunda capa. Es la brecha principal. |
| **A02** | Fallos criptográficos | ⚠️ Cifrado en reposo y tránsito por Supabase; contraseñas con bcrypt. Falla el **envío de contraseñas en claro por correo**. |
| **A03** | Inyección | ✅ Sin SQL construido a mano; filtros parametrizados; texto libre saneado; React escapa la salida. **Salvo el HTML del correo.** |
| **A04** | Diseño inseguro | ⚠️ Dos puntos: **no se pueden crear dos membresías activas** solo por convención de código, sin restricción en la base; y **flujos multi-tabla sin transacción**. |
| **A05** | Configuración incorrecta | ⚠️ Cabeceras añadidas en esta auditoría. Falta CSP completa y confirmar HTTPS al desplegar. |
| **A06** | Componentes vulnerables | ⚠️ 11 vulnerabilidades transitivas pendientes tras parchear Next. |
| **A07** | Fallos de autenticación | ❌ **Sin límite de intentos de login.** Es lo más urgente de esta categoría. Las cookies y el hasheo sí están bien. |
| **A08** | Fallos de integridad | ✅ Sin deserialización insegura ni carga de código externo. El service worker es propio. `pnpm` verifica el lockfile. |
| **A09** | Fallos de registro y monitorización | ⚠️ Hay **bitácora de actividad** sobre miembros (RF-19), que es más de lo habitual. Pero **no registra intentos de login fallidos**, que es justo lo que haría falta para detectar el ataque del punto 11. |
| **A10** | Falsificación de peticiones del servidor (SSRF) | ✅ El servidor no hace peticiones a URLs que controle el usuario. El `logo_url` solo se guarda y se muestra en un `<img>`; no se descarga en servidor. |

---

## Qué haría primero

1. **Limitar los intentos de login** (11 / A07) — es la puerta abierta más directa.
2. **Activar RLS** (4 / A01) — la segunda capa que hoy no existe.
3. **Índice único de membresía activa** (A04) — corrupción silenciosa de datos de dinero.
4. **Escapar el HTML del correo** (15 / A03) — cinco líneas.
5. **Registrar los intentos fallidos** (A09) — sin esto no se sabe si el punto 1 pasó.

Los cinco son de backend y están detallados en
[`BACKEND-PENDIENTE.md`](BACKEND-PENDIENTE.md).
