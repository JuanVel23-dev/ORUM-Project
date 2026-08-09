# ORUM — Planeación y estado del proyecto

> Documento maestro de planeación. Consolida qué es ORUM, cómo está construido, qué fases
> están hechas y cuáles faltan. Sirve como punto único de referencia para retomar el
> proyecto desde cualquier máquina sin desalinearnos.
>
> **Última actualización:** 2026-08-09

---

## 1. Qué es ORUM

ORUM es una plataforma web de **club de beneficios**: conecta a sus **miembros** con una red
de **comercios aliados** para que accedan a descuentos, ofertas y promociones.

Documento de requisitos original: [`Contexto_ORUM.txt`](referencia/Contexto_ORUM.txt).
Esquema de base de datos: [`Esquema_BD.txt`](referencia/Esquema_BD.txt) y [`Esquema_ORUM.png`](referencia/Esquema_ORUM.png).

La plataforma tiene **4 portales**, cada uno para un tipo de usuario:

- **Portal Público** — informativo, abierto a todos; da a conocer ORUM y permite adquirir la membresía.
- **Portal para Miembros** — espacio privado: consulta de beneficios y búsqueda de comercios aliados.
- **Portal de Administración** — panel interno: membresías, usuarios, comercios y promociones.
- **Herramienta para Comercios Aliados** — las tiendas registran las ventas de los miembros.

---

## 2. Stack y arquitectura

- **Framework:** Next.js 16 + React 19 (App Router, carpeta `src/app`).
- **Lenguaje:** TypeScript.
- **Backend/BD/Auth:** Supabase (SSR con `@supabase/ssr`). **El esquema de la BD ya está creado en Supabase.**
- **Gestor de paquetes:** pnpm.
- **Tests:** Vitest (`pnpm test`) — solo funciones puras por ahora.

**Patrón de la app (se repite en todas las fases):**

- Páginas como **server components** protegidas con `requireRol` (`src/lib/auth.ts`).
- Mutaciones vía **server actions** (`actions.ts` de cada ruta).
- Formularios como **client components** con `useActionState`.
- Operaciones privilegiadas (crear usuarios en Auth, editar correos) vía **Admin API** con la
  `service_role`, aisladas en `src/lib/supabase/admin.ts` (solo servidor).

---

## 3. Modelo de autenticación e identidad

- Tabla `perfiles` (`id` uuid = `auth.users.id`) con `rol_id → roles`.
- `empleados`, `comercios` y `miembros` cuelgan de `perfiles` vía `perfil_id`.
- **Roles:** `super_admin` (1), `empleado` (2), `comercio` (3), `miembro` (4).

**Identificadores (decisión firme):**

| Identificador | Rol | Cambia |
|---|---|---|
| `perfiles.id` (UUID) | Id interno permanente; todo lo referencia | Nunca |
| Correo electrónico | Credencial de login (vía Auth) | Sí, editable por Admin API |
| Cédula | Identificador de negocio (obligatoria y única) | Sí, revalidando unicidad |

- Login del staff (admin/empleado) por **correo**.
- Login del **miembro** (portal futuro) será por **número de membresía**, que por debajo resuelve
  al correo real asociado y con eso inicia sesión. **No se inventan correos internos.**
- El primer `super_admin` se creó a mano en Supabase (bootstrap huevo-y-gallina); de ahí en
  adelante todo usuario se crea desde el panel.
- La creación de usuarios hace `upsert` en `perfiles` para funcionar exista o no un trigger.

---

## 4. Estado por fases

Leyenda: ✅ hecho · 🔄 en progreso · ⬜ pendiente

### ✅ Fase 1 — Portal Administrativo: login + gestión de usuarios

**Completa, probada por el usuario, y en `origin/main`.**

- Login (`/login`), panel protegido (`/admin`).
- CRUD de usuarios (`/admin/usuarios`): crear/listar/editar/activar-desactivar empleados,
  comercios y admins.
- Contraseña autogenerada mostrada una sola vez.
- Cambio de contraseña propio (`/admin/cuenta/password`).
- Helpers `getPerfilActual` y `requireRol` en `src/lib/auth.ts`.
- Cédula obligatoria y única (regla SQL `empleados_cedula_unica` + `not null` ya aplicada).
- Correo editable vía Admin API.

Requisitos cubiertos: **RF-16** (gestión de usuarios) + auth base.

### ✅ Fase 2 — Miembros y Membresías

**Implementada, fusionada en `main`, subida a `origin`, y revisada manualmente por el usuario.**
Verificado además: 9/9 tests (Vitest), `tsc` limpio, `pnpm build` OK.

- **Planes de membresía** (`/admin/planes/**`) — CRUD, solo super_admin. Un plan inactivo no se
  puede vender; borrado lógico con `deleted_at`.
- **Miembros** (`/admin/miembros/**`) — solo super_admin + empleado:
  - Registro de cliente **+ su primera membresía** en un flujo (crea cuenta de Auth con el correo
    real + contraseña autogenerada mostrada una vez).
  - Lista/búsqueda (por número, cédula o nombre).
  - Ficha con datos, membresía vigente e historial.
  - Renovación desde la ficha.
  - Edición de datos.
- **Número de membresía** = 8 dígitos (4 secuenciales + 4 aleatorios), único; es el payload del
  futuro QR y lo que teclea el comercio (RF-22). Funciones puras testeadas:
  `generarNumeroMembresia` y `calcularFechaFin` en `src/lib/membresias.ts`.
- **Autoría:** `registrado_por` / `vendido_por` = `empleados.id` si actúa un empleado, `null` si
  actúa un super_admin (autoría fina irá en la bitácora de Fase 4).
- SQL aplicado en Supabase: índices únicos `miembros_numero_membresia_unica` y
  `miembros_cedula_unica`, más una ciudad de prueba.

**Documentos de diseño/plan de esta fase:**
- Spec: [`docs/superpowers/specs/2026-07-22-fase2-miembros-membresias-design.md`](superpowers/specs/2026-07-22-fase2-miembros-membresias-design.md)
- Plan (9 tareas): [`docs/superpowers/plans/2026-07-22-fase2-miembros-membresias.md`](superpowers/plans/2026-07-22-fase2-miembros-membresias.md)

Requisitos cubiertos: **RF-15** (planes) + parte administrativa de **RF-16** (miembros) + los
cambios de la reunión sobre autoría de venta/registro y tipo de membresía (nueva/renovada).

### ✅ Fase 3 — Comercios, sucursales y promociones

**Completa, en `main`.**

- **Comercios** (`/admin/comercios/**`) — solo super_admin: crear (cuenta de Auth + contraseña
  autogenerada mostrada una vez), listar/buscar por nombre, ficha, editar datos y correo.
- Dos estados independientes por comercio: `comercios.activo` (¿aliado activo?) y
  `perfiles.activo` (¿acceso a su cuenta?).
- **Sucursales** por comercio — CRUD con `ciudad_id` obligatorio, `nombre` obligatorio a nivel
  de app; "eliminar" = desactivar (`activo = false`).
- **Promociones/beneficios** por comercio — tipo (`porcentaje`, `dos_por_uno`, `monto_fijo`,
  `regalo`) vía `tipos_beneficio`; validación de `valor` según tipo en función pura testeada
  `validarValorPromocion` (`src/lib/promociones.ts`).
- Se retiró la gestión de comercios de `/admin/usuarios` (ahora vive solo en `/admin/comercios`).
- Prepara los datos que las métricas (Fase 4) y el Portal de Miembros medirán/mostrarán.

**Documentos de diseño/plan de esta fase:**
- Spec: [`docs/superpowers/specs/2026-07-26-fase3-comercios-sucursales-promociones-design.md`](superpowers/specs/2026-07-26-fase3-comercios-sucursales-promociones-design.md)
- Plan: [`docs/superpowers/plans/2026-07-27-fase3-comercios-sucursales-promociones-plan.md`](superpowers/plans/2026-07-27-fase3-comercios-sucursales-promociones-plan.md)

Requisitos cubiertos: **RF-17** (comercios) + **RF-18** (promociones).

### ✅ Fase 4 — Métricas y trazabilidad

**Implementada en `worktree-fase4-metricas-trazabilidad`, verificada automáticamente (41/41 tests,
`tsc` limpio, `pnpm build` OK). Pendiente prueba manual del usuario en navegador antes de dar por
cerrada del todo** (login como super_admin/empleado, recorrer las pantallas nuevas, y sembrar
manualmente algunas filas de `ventas` en Supabase para ver las tablas de comercio con datos reales).

- **Bitácora de actividad** (`bitacora_actividad`, ya existía en Supabase sin usar) — acotada a
  eventos de miembros (D1 del spec): alta, edición y renovación, instrumentados en
  `miembros/actions.ts` vía `registrarActividad` (`src/lib/bitacora.ts`), best-effort (nunca
  bloquea la operación principal si falla el insert).
  - Sección "Historial de actividad" en la ficha del miembro (`/admin/miembros/[id]`).
  - Listado global `/admin/bitacora` (solo super_admin) con filtros por miembro, fecha y tipo
    de acción.
- **Dashboard de métricas** `/admin/metricas` (solo super_admin), filtrable por rango de fechas:
  miembros nuevos en el periodo, membresías vendidas por empleado, ventas por comercio, uso de
  membresía por miembro y comercio. Agregaciones en funciones puras testeadas
  (`src/lib/metricas.ts`); las dos métricas basadas en `ventas` muestran estado vacío hasta que
  exista la Herramienta para Comercios (fase posterior) que alimenta esa tabla — comportamiento
  esperado, no un bug (D4 del spec).
- Se tipó `ventas` en `database.types.ts` (tabla ya existente en Supabase, sin usar hasta ahora).

**Documentos de diseño/plan de esta fase:**
- Spec: [`docs/superpowers/specs/2026-07-31-fase4-metricas-trazabilidad-design.md`](superpowers/specs/2026-07-31-fase4-metricas-trazabilidad-design.md)
- Plan: [`docs/superpowers/plans/2026-07-31-fase4-metricas-trazabilidad-plan.md`](superpowers/plans/2026-07-31-fase4-metricas-trazabilidad-plan.md)

Requisitos cubiertos: **RF-19** (trazabilidad) + parte de las métricas pedidas en la reunión.

### ✅ Fase 5 — Portal de Miembros

**Implementada en `worktree-portal-miembros`, verificada automáticamente (51/51 tests, `tsc`
limpio, `pnpm lint` limpio, `pnpm build` OK — rutas públicas confirmadas: `/miembros`,
`/miembros/login`, `/miembros/perfil`, `/miembros/inactiva`). Pendiente prueba manual del usuario
en navegador con datos reales de Supabase antes de dar por cerrada del todo** (login con número de
membresía real, membresía vencida/suspendida → bloqueo, búsqueda + cada filtro, QR escaneado,
botón de soporte).

- **Login por número de membresía** (`/miembros/login`, RF-06) — resuelve el número al correo real
  vía `resolverCorreoPorNumeroMembresia` (`src/lib/miembros/auth-miembro.ts`, único punto de este
  portal que usa el admin client, porque corre antes de que exista sesión) y luego
  `signInWithPassword`. Mensaje de error genérico ante número inválido o contraseña incorrecta (no
  revela cuál de los dos falló).
- **RLS activo en Supabase** para `miembros`, `membresias`, `comercios`, `sucursales`,
  `promociones` (más lectura abierta de catálogos de referencia) — verificado manualmente por el
  usuario antes de implementar (miembro ve solo su propia fila/membresía; catálogo de comercios
  visible completo). Todo el portal usa el cliente de sesión (`createClient()`), nunca
  `createAdminClient()`, salvo la excepción de login ya mencionada.
- **Guardias propias del portal** (`src/lib/miembros/requerir-miembro.ts`): `requireRolMiembro`
  (solo rol) y `requireMiembroVigente` (rol + membresía vigente). Separadas a propósito — el
  layout guardado y `/miembros/inactiva` usan la primera para no crear un bucle de redirect.
- **Ruta guardada bajo route group** `src/app/miembros/(portal)/**` (invisible en la URL): se
  detectó durante la implementación que un layout guardado en `src/app/miembros/layout.tsx` a
  secas envolvería también a `/miembros/login`, causando un bucle infinito de redirect para
  visitantes no autenticados. `/miembros/login` vive como hermano fuera del grupo.
- **Perfil de solo lectura + QR** (`/miembros/perfil`, RF-07 y RF-14) — datos del miembro,
  membresía vigente (plan, tipo, vigencia) y QR (`react-qr-code`) con `numero_membresia` como
  payload (decisión ya tomada en Fase 2). Sin formulario de edición.
- **Home con búsqueda y filtros** (`/miembros`, RF-08 a RF-12) — una sola pantalla: sin filtros
  se ve todo el catálogo activo; búsqueda libre (nombre de comercio o título de promoción) y tres
  filtros combinables (comercio, marca, ciudad vía sucursales). Las búsquedas usan siempre
  llamadas parametrizadas (`.ilike()`/`.eq()`/`.in()`), nunca un `.or()` con texto de usuario
  interpolado, para evitar inyección de filtros PostgREST.
- **Pantalla de bloqueo** (`/miembros/inactiva`) — si la membresía no está vigente
  (`esMembresiaVigente`, función pura testeada en `src/lib/miembros/membresia-vigente.ts`, que
  chequea `estado` **y** `fecha_fin` porque no hay job que actualice `estado` solo al vencer).
- **Soporte por WhatsApp** (RF-13) — botón persistente en el layout del portal, leído desde
  `configuracion.whatsapp_soporte` (tabla ya existente en Supabase, ahora en uso).
- **Kit de UI ampliado**: `Select`, `Card`/`CardGrid`, `QrCode`, `WhatsAppButton` — nuevos
  componentes en `src/components/ui/`, reutilizables por los portales futuros (Público,
  Herramienta de Comercios).

**Documentos de diseño/plan de esta fase:**
- Spec: [`docs/superpowers/specs/2026-08-09-portal-miembros-design.md`](superpowers/specs/2026-08-09-portal-miembros-design.md)
- Plan (15 tareas): [`docs/superpowers/plans/2026-08-09-portal-miembros-plan.md`](superpowers/plans/2026-08-09-portal-miembros-plan.md)

Requisitos cubiertos: **RF-06 a RF-14** (login, perfil, descuentos, búsqueda y filtros, soporte, QR).

### ⬜ Fases posteriores — Portales de cara al usuario final

- **Portal Público** — RF-01 a RF-04 (info, tiendas aliadas, precios, botón WhatsApp para adquirir).
- **Herramienta para Comercios** — RF-20 a RF-22 (login, venta por QR, venta por número de membresía).

---

## 5. Cobertura de requisitos (RF)

| RF | Descripción | Fase | Estado |
|----|-------------|------|--------|
| RF-01–04 | Portal Público (info, tiendas, precios, adquirir) | Posterior | ⬜ |
| RF-06–14 | Portal Miembros (login, perfil, descuentos, filtros, soporte, QR) | Fase 5 | ✅ |
| RF-15 | Gestión de planes de membresía | Fase 2 | ✅ |
| RF-16 | Gestión de usuarios (staff + miembros) | Fase 1 + 2 | ✅ |
| RF-17 | Gestión de comercios | Fase 3 | ✅ |
| RF-18 | Gestión de promociones | Fase 3 | ✅ |
| RF-19 | Trazabilidad / historial de movimientos | Fase 4 | ✅ |
| RF-20–22 | Herramienta de comercios (login, venta por QR / número) | Posterior | ⬜ |

---

## 6. Decisiones clave (transversales)

1. **Desarrollo por fases con dependencias reales**, no los 4 portales en paralelo: primero los
   datos maestros (usuarios → planes/miembros → comercios/promos → métricas), luego los portales
   de cara al usuario que consumen esos datos.
2. **Reutilizar el patrón de Fase 1 en cada fase** (server components + `requireRol`, server
   actions, `admin.ts`) para mantener consistencia.
3. **UUID como id interno permanente**; correo y cédula son identificadores separados.
4. **Credencial del miembro provisionada ya en Fase 2**, aunque su portal de login llegue después.
5. **Número de membresía = payload del futuro QR**, listo desde Fase 2.
6. **Autoría de venta/registro** guardada desde Fase 2; su trazabilidad completa vivirá en la
   bitácora de Fase 4.

---

## 7. Deuda técnica conocida (aceptada)

Ninguna es bloqueante hoy, pero conviene tenerlas presentes:

1. **Atomicidad real:** los flujos multi-tabla (registro, renovación, edición) revierten con
   *compensaciones* manuales, no con una transacción de Postgres. Un fallo a mitad podría, en el
   peor caso, dejar estado inconsistente. Solución limpia: mover esos flujos a un **RPC /
   función transaccional** en Supabase.
2. **Número secuencial de 4 dígitos:** cubre hasta 9.999 miembros. El número completo sigue siendo
   único por la restricción de BD + reintento, pero al acercarse a ese techo hay que ampliar el
   ancho (p. ej. 5+3) o agregar prefijo.
3. **RLS (Row Level Security):** hoy la autorización vive en la app (`requireRol`). Antes de exponer
   los portales de miembros/comercios conviene activar **RLS en Supabase** como defensa en profundidad.
4. **Enum `estado_membresia`:** en la BD real incluye `suspendida` (no previsto en la spec de Fase 2).
   Falta definir qué flujo la dispara (probable Fase 3/4).

---

## 8. Cómo retomar el proyecto en otra máquina

El código está en `origin/main`. En la máquina nueva:

```bash
# 1. Clonar el repo y entrar
git clone <url-del-repo>
cd ORUM-Project

# 2. Instalar dependencias (usar pnpm, no npm)
pnpm install

# 3. Configurar variables de entorno
#    .env.local NO está en el repo (está en .gitignore). Copiar la plantilla:
cp .env.example .env.local
#    Luego rellenar con los valores de Supabase (Settings -> API):
#      NEXT_PUBLIC_SUPABASE_URL
#      NEXT_PUBLIC_SUPABASE_ANON_KEY   (clave nueva: empieza con sb_publishable_...)
#      SUPABASE_SERVICE_ROLE_KEY       (clave nueva: empieza con sb_secret_... ; SOLO servidor)

# 4. Levantar en desarrollo
pnpm dev            # http://localhost:3000

# Otros scripts útiles
pnpm test           # tests (Vitest)
pnpm build          # build de producción
pnpm lint           # linter
```

**Notas de entorno (ver también los archivos de memoria del proyecto):**

- Las claves de Supabase son del **formato nuevo** (`sb_publishable_` / `sb_secret_`), no los JWT
  legacy `eyJ...`. Los JWT de sesión se firman con **ES256** (claves asimétricas).
- **Error transitorio conocido** tras rotar a ES256:
  `invalid JWT: ... unrecognized JWT kid <nil> for algorithm ES256`. No es un bug del código; se
  resuelve al refrescar la sesión, volver a iniciar sesión o limpiar cookies.
- Los avisos de *hydration mismatch* con `bis_skin_checked="1"` los inyecta una **extensión del
  navegador** (Bitdefender u otra). Es inofensivo y ajeno a la app: probar en incógnito.

---

## 9. Próximo paso sugerido

Con Fases 1-5 implementadas, falta: (1) la prueba manual en navegador de la Fase 5 (login con
número de membresía real, membresía vencida/suspendida, búsqueda y filtros, QR, soporte), y
(2) fusionar la rama `worktree-portal-miembros` a `main`. Después de eso, el siguiente paso natural
es la **Herramienta para Comercios** (RF-20-22): es la que finalmente llena la tabla `ventas` que
el dashboard de métricas (Fase 4) ya consume, y también donde se usará por primera vez el QR que
ya muestra el perfil del miembro (Fase 5). El **Portal Público** (RF-01-04) puede ir en paralelo o
después — es el que menos depende de las fases ya construidas.
