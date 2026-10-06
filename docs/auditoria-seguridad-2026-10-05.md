# Auditoría de seguridad ORUM — 05/10/2026

Revisión enfocada y de **solo lectura** contra el OWASP Top 10 (2021), a partir de
dos guías: Hostinger («Web application security») y HackerOne («OWASP Top 10»).
No se modificó código ni base de datos. Alcance: RLS y funciones de Supabase,
headers de Next, dependencias, secretos y server actions.

## Resumen de las guías

**Hostinger — seis buenas prácticas:** codificación segura, HTTPS/TLS,
actualizar dependencias, autenticación fuerte (MFA, RBAC), hash de contraseñas
(bcrypt/Argon2) y pruebas de seguridad periódicas.

**OWASP Top 10 (HackerOne):**

| # | Riesgo | Mitigación clave |
|---|---|---|
| A1 | Control de acceso roto | Mínimo privilegio, denegar por defecto, rate limiting |
| A2 | Fallos criptográficos | Cifrar en reposo y en tránsito, hash fuerte, no recopilar datos de más |
| A3 | Inyecciones | Consultas parametrizadas, validación con lista blanca |
| A4 | Diseño inseguro | Seguridad desde el inicio, modelado de amenazas |
| A5 | Configuración insegura | Hardening, sin cuentas por defecto ni errores detallados |
| A6 | Componentes vulnerables | Inventario y escaneo de dependencias, actualizar |
| A7 | Fallos de autenticación | MFA, límite de intentos, sesiones con caducidad |
| A8 | Integridad de software y datos | Firmas, proteger el CI/CD |
| A9 | Logging y monitoreo | Registros contextuales a prueba de manipulación |
| A10 | SSRF | Validar URLs, lista blanca de esquemas, denegar por defecto |

## Hallazgos (de más a menos urgente)

### 1. Next.js 16.2.11 con tres avisos críticos (A06/A08)
`pnpm audit --prod`: 3 críticos, 7 altos, 3 moderados. Los críticos son de `next`:

- RCE en `next/og` `ImageResponse` — corregido en 16.3.6. No se encontró
  `ImageResponse` en `src`, probablemente no afecta.
- RCE en la API de optimización de imágenes con AVIF — corregido en 16.3.3. El
  repo usa `next/image` en 7 archivos, así que es relevante. No se verificó si
  Vercel lo mitiga por su cuenta.
- RCE sin autenticación en servidores Windows — no aplica (Vercel corre en Linux).

Los altos son transitivos de `next`: `sharp`, `postcss`, `nanoid`, `browserslist`.

**Qué hacer:** subir a `next@^16.3.6`.

### 2. Un comercio puede reactivarse a sí mismo (A01, media)
La política `comercios_own_update` solo exige `perfil_id = auth.uid()`, y el rol
`authenticated` tiene `UPDATE` sobre todas las columnas de `comercios`, incluidas
`activo` y `deleted_at`. Un comercio suspendido por administración podría volver
a activarse llamando a la API REST de Supabase. Deducido de políticas y permisos
de columna; **no probado**.

**Qué hacer:** `REVOKE UPDATE` de esas columnas para `authenticated` y dar
`UPDATE` solo sobre las que el comercio edita (`descripcion`, `logo_url`,
`portada_url`), o mover el cambio a una server action.

### 3. Protección contra contraseñas filtradas desactivada (A07)
Aviso del linter de Supabase (`auth_leaked_password_protection`). Se activa en
el panel de Supabase → Auth.

### 4. Sin CSP real (A05)
`next.config.ts` solo declara `frame-ancestors 'none'` (el propio comentario lo
deja pendiente). Sí existen HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`
y `Permissions-Policy`. Una CSP completa necesita nonces y probarse desplegada.
Hay 3 usos de `dangerouslySetInnerHTML`, pero inyectan JSON-LD o el script del
tema, no entrada de usuario.

## Lo que está bien

- **RLS** activada en las 22 tablas. Las políticas de `miembros`, `membresias`,
  `ventas`, `favoritos`, `perfiles` y los buckets de storage están bien acotadas.
- **`limite_uso` y `numeros_registro`** sin políticas a propósito: solo se
  accede con `service_role`; `consumir_cupo` y `reiniciar_cupo` no son
  ejecutables por `anon` ni `authenticated`.
- **Funciones `SECURITY DEFINER`** revisadas (`buscar_miembro_comercio`,
  `estado_membresia_por_numero`, `comercios_mas_usados`): comprueban rol o dueño
  en el cuerpo y fijan `search_path`. Los avisos del linter sobre `es_admin` y
  similares son informativos (devuelven false para `anon`).
- **Secretos:** `.env*` y `Usuarios Pruebas PlayWright.txt` están en
  `.gitignore` y no rastreados. La `service_role` solo vive en `admin.ts` y
  rutas de servidor.
- **SSRF:** el único `fetch` dinámico es la verificación de Turnstile, contra
  una URL fija.
- **Autenticación:** Turnstile en los tres logins y límites de uso (capas 1 y 2).

## Pendiente de verificar

- 7 `actions.ts` sin `requireRol` (login, recuperación, aliados, favoritos):
  parecen intencionales, pero no se leyó cada una. Confirmar que
  `alternarFavorito` use el `auth.uid()` del servidor y no un id del cliente.
- `repomix-output.xml` está en la raíz: comprobar que no esté en git ni
  contenga secretos.
- A09: existe `bitacora_actividad` (222 filas, solo super admin la lee); no se
  revisó qué eventos se registran.
- Pendientes ya conocidos: capa 3 de rate limits en Supabase y SMTP de Workspace.

## Orden de ataque propuesto

1. Actualizar Next a ≥16.3.6.
2. Restringir columnas de `comercios` para `authenticated`.
3. Activar la protección de contraseñas filtradas.
4. CSP con nonces (más adelante).
