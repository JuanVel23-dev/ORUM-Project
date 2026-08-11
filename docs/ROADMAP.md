# ORUM — Planeación y estado del proyecto

> Documento maestro de planeación. Consolida qué es ORUM, cómo está construido, qué fases
> están hechas y cuáles faltan. Sirve como punto único de referencia para retomar el
> proyecto desde cualquier máquina sin desalinearnos.
>
> **Última actualización:** 2026-08-05

---

## 1. Qué es ORUM

ORUM es una plataforma web de **club de beneficios**: conecta a sus **miembros** con una red
de **comercios aliados** para que accedan a descuentos, ofertas y promociones.

Documento de requisitos original: [`Contexto_ORUM_txt`](../Contexto_ORUM_txt) (raíz del repo).
Esquema de base de datos: [`Esquema_BD.txt`](../Esquema_BD.txt) y `Esquema_ORUM.png`.

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

**Implementada y fusionada en `main`** (commits `46f121d`, `7552c62`, `9747f3d`).

- Gestión de comercios aliados (`/admin/comercios/**`), solo super_admin — **RF-17**.
- Sucursales por comercio.
- Gestión de promociones/beneficios con tipo (porcentaje, 2x1, monto fijo, regalo) — **RF-18**.
- `comercios.activo` (¿aliado activo?) y `perfiles.activo` (¿acceso a su cuenta?) son
  estados independientes.
- Validación de `promociones.valor` según el tipo de beneficio en la función pura
  `validarValorPromocion` (`src/lib/promociones.ts`).
- Los comercios salieron de `/admin/usuarios`, que quedó reducido a empleados y admins.

**Documentos de diseño/plan de esta fase:**
- Spec: [`docs/superpowers/specs/2026-07-26-fase3-comercios-sucursales-promociones-design.md`](superpowers/specs/2026-07-26-fase3-comercios-sucursales-promociones-design.md)
- Plan: [`docs/superpowers/plans/2026-07-27-fase3-comercios-sucursales-promociones-plan.md`](superpowers/plans/2026-07-27-fase3-comercios-sucursales-promociones-plan.md)

### 🔄 Rediseño visual — sistema de diseño, movimiento y PWA

**Transversal a todas las fases.** No cambia funcionalidad: sustituye la capa de
presentación completa (oro / negro / blanco, estética Apple, movimiento con resortes,
tres modos de tema) y convierte la app en PWA instalable.

- **Fase A (fundaciones) — hecha:** tipografía Inter Variable, capa de tokens
  (`src/styles/tokens.css`), `globals.css` reescrito con mapeo semántico por tema,
  sistema de tres temas sin parpadeo, y utilidades de movimiento (`src/lib/motion.ts`).
- Fases B–G pendientes: primitivas de UI, app shell, login, pantallas del admin, PWA
  y auditoría.

**Documentos:**
- Spec: [`docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md`](superpowers/specs/2026-08-04-rediseno-visual-orum-design.md)
- Plan: [`docs/superpowers/plans/2026-08-05-rediseno-visual-plan.md`](superpowers/plans/2026-08-05-rediseno-visual-plan.md)

### ⬜ Fase 4 — Métricas y trazabilidad

- Tabla `bitacora_actividad` para trazabilidad fina (quién hizo qué y cuándo) — **RF-19**.
- Dashboard de métricas (cambios de la reunión): ventas por comercio, miembros nuevos por periodo,
  cuántas veces un miembro usó la membresía en cada comercio, membresías vendidas por empleado, etc.

### ⬜ Fases posteriores — Portales de cara al usuario final

- **Portal Público** — RF-01 a RF-04 (info, tiendas aliadas, precios, botón WhatsApp para adquirir).
- **Portal de Miembros** — RF-06 a RF-14 (login por número, perfil, descuentos, búsqueda y filtros,
  soporte, **QR** que identifica al miembro).
- **Herramienta para Comercios** — RF-20 a RF-22 (login, venta por QR, venta por número de membresía).

---

## 5. Cobertura de requisitos (RF)

| RF | Descripción | Fase | Estado |
|----|-------------|------|--------|
| RF-01–04 | Portal Público (info, tiendas, precios, adquirir) | Posterior | ⬜ |
| RF-06–14 | Portal Miembros (login, perfil, descuentos, filtros, soporte, QR) | Posterior | ⬜ |
| RF-15 | Gestión de planes de membresía | Fase 2 | ✅ |
| RF-16 | Gestión de usuarios (staff + miembros) | Fase 1 + 2 | ✅ |
| RF-17 | Gestión de comercios | Fase 3 | ✅ |
| RF-18 | Gestión de promociones | Fase 3 | ✅ |
| RF-19 | Trazabilidad / historial de movimientos | Fase 4 | ⬜ |
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
# 0. Node 22.13 o superior (la versión exacta recomendada está en .nvmrc)
#    Requisito real: pnpm 11 usa `node:sqlite`, que no existe antes de 22.13.
#    Node 20 además llegó a fin de vida en abril de 2026.
node --version      # debe ser >= v22.13
#    Con gestor de versiones:      nvm use   /   fnm use
#    Sin gestor, en Windows:       winget install OpenJS.NodeJS.LTS

# 1. Clonar el repo y entrar
git clone <url-del-repo>
cd ORUM-Project

# 2. Instalar dependencias (usar pnpm, no npm)
corepack enable pnpm    # una sola vez por máquina
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

- **La versión de Node importa y está declarada en tres sitios coherentes entre sí:**
  `engines.node` (`>=22.13.0`), `.nvmrc` y `.node-version` (24.19.0, el LTS activo).
  Si `node --version` es menor, `pnpm` fallará con
  `No such built-in module: node:sqlite`.
- **Corepack antiguo falla al descargar pnpm** con
  `Error: Cannot find matching keyid`. Es un problema de claves de firma caducadas en
  las versiones de corepack anteriores a la 0.32, no del proyecto. Se resuelve
  actualizando Node (trae un corepack nuevo) o con `npm i -g corepack@latest`.

- Las claves de Supabase son del **formato nuevo** (`sb_publishable_` / `sb_secret_`), no los JWT
  legacy `eyJ...`. Los JWT de sesión se firman con **ES256** (claves asimétricas).
- **Error transitorio conocido** tras rotar a ES256:
  `invalid JWT: ... unrecognized JWT kid <nil> for algorithm ES256`. No es un bug del código; se
  resuelve al refrescar la sesión, volver a iniciar sesión o limpiar cookies.
- Los avisos de *hydration mismatch* con `bis_skin_checked="1"` los inyecta una **extensión del
  navegador** (Bitdefender u otra). Es inofensivo y ajeno a la app: probar en incógnito.

---

## 9. Próximo paso sugerido

Con las Fases 1, 2 y 3 cerradas, el trabajo activo es el **rediseño visual**: la funcionalidad
del portal administrativo está, pero la capa de presentación no transmite la calidad que el
producto necesita, y los portales de cara al usuario (Público y Miembros) van a heredarla.

La Fase A (fundaciones) está hecha. El siguiente paso es la **Fase B: primitivas de UI**, y tras
la Fase D hay un punto de evaluación explícito antes de comprometer la migración de las ~20
pantallas del admin.

En paralelo queda pendiente la **Fase 4 (métricas y trazabilidad)**, que no depende del rediseño
salvo por los componentes de gráficos.
