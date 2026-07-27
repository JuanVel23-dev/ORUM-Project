# Fase 3 — Comercios, sucursales y promociones (diseño)

- **Fecha:** 2026-07-26
- **Estado:** Aprobado para planificación
- **Depende de:** Fase 1 y Fase 2 (`main`, commit `04f20b7`)

## 1. Objetivo

Completar la gestión del comercio aliado como entidad de negocio (no solo como cuenta de
acceso), y agregar sus **sucursales** y **promociones**. Cubre RF-17 (gestión de comercios) y
RF-18 (gestión de promociones), y deja lista la base de datos que consumirán las métricas
(Fase 4) y el Portal de Miembros (fase posterior).

## 2. Punto de partida (lo que ya existe)

Desde la Fase 1, `/admin/usuarios` ya permite crear un usuario de tipo **comercio**: crea la
cuenta de Auth + una fila en `comercios` (`nombre`, `descripcion`, `marca_id`, `categoria_id`),
lista comercios junto a empleados/admins, permite editar `nombre`/`descripcion`/correo, y
activar/desactivar su **acceso** (`perfiles.activo`).

Lo que falta: **sucursales**, **promociones**, edición de `marca_id`/`categoria_id` tras la
creación, `logo_url`, y uso del campo propio `comercios.activo` (hoy nunca se toca).

## 3. Alcance

**Dentro de esta fase:**

1. Nueva sección `/admin/comercios`: creación de comercio (cuenta + datos de negocio en un solo
   flujo), lista, ficha, edición completa.
2. **Sucursales** — CRUD colgado del comercio.
3. **Promociones** — CRUD colgado del comercio, con validación según su `tipo_beneficio`.
4. Reducir `/admin/usuarios` a solo empleados/admins (se quita la opción "comercio").

**Fuera de esta fase (fases posteriores):**

- Registro de ventas (`ventas`, RF-20 a RF-22) — la herramienta de comercios es posterior; esta
  fase solo deja `comercios`, `sucursales` y `promociones` listos para que `ventas` los referencie.
- Expiración automática de promociones por fecha (`fecha_inicio`/`fecha_fin` quedan como datos
  informativos; ningún proceso las usa todavía para ocultar la promoción).
- Subida de archivos para `logo_url` (queda como campo de texto para pegar una URL).
- Gestión de `marcas`, `categorias`, `ciudades`, `tipos_beneficio` — son catálogos de referencia
  ya sembrados en Supabase, sin pantalla propia (mismo patrón ya usado); se seleccionan por
  dropdown.

## 4. Decisiones tomadas

| # | Decisión | Detalle |
|---|----------|---------|
| D1 | Comercio pasa a tener su propia sección | `/admin/comercios` reemplaza a `/admin/usuarios` como lugar de creación/edición de comercios (mismo motivo que Fase 2: sucursales y promociones cuelgan naturalmente de la ficha del comercio). |
| D2 | Dos estados independientes por comercio | `comercios.activo` = "¿es un aliado activo?" (visible/operativo). `perfiles.activo` = "¿tiene acceso a su cuenta?" (login). Se editan por separado en la ficha. |
| D3 | Solo `super_admin` gestiona comercios/sucursales/promociones | Es catálogo maestro del negocio (como planes de membresía), no operación diaria; los empleados siguen limitados a miembros/membresías. |
| D4 | `nombre` de sucursal obligatorio a nivel de app | La BD lo permite nulo, pero una sucursal sin nombre es mala UX; se exige en el formulario aunque no en la columna. |
| D5 | Validación de `promociones.valor` según `tipos_beneficio.codigo` | `porcentaje` y `monto_fijo` requieren `valor` (porcentaje además ≤ 100); `dos_por_uno` y `regalo` deben dejarlo vacío. Catálogo ya sembrado en Supabase (4 filas), no se toca. |

## 5. Modelo de datos

Tablas que **ya existen** en Supabase (ver `Esquema_BD.txt`). No se crean tablas nuevas.

- **`sucursales`**: `comercio_id` (→ comercios, obligatoria), `ciudad_id` (→ ciudades,
  obligatoria), `nombre`, `direccion`, `telefono` (los tres nullable en BD, `nombre` obligatorio
  en app por D4), `activo` (default true), `deleted_at`.
- **`promociones`**: `comercio_id` (→ comercios, obligatoria), `tipo_beneficio_id` (→
  tipos_beneficio, obligatoria), `titulo`, `descripcion`, `valor` (numeric, nullable — ver D5),
  `fecha_inicio`, `fecha_fin` (date, nullable, informativas), `activo` (default true),
  `deleted_at`.
- **`tipos_beneficio`** (catálogo, ya sembrado): `porcentaje`, `dos_por_uno`, `monto_fijo`,
  `regalo`.
- **`comercios`** (ya existe, se completa su uso): `marca_id`, `categoria_id`, `logo_url`,
  `activo`, `deleted_at` — hoy solo se escriben `nombre`/`descripcion` al crear; esta fase agrega
  edición de `marca_id`/`categoria_id`/`logo_url`/`activo`.

Se extiende `src/lib/supabase/database.types.ts` con `sucursales`, `promociones` y
`tipos_beneficio`.

## 6. Rutas y navegación

| Ruta | Qué hace | Rol |
|------|----------|-----|
| `/admin/comercios` | Listar/buscar comercios (por nombre) | super_admin |
| `/admin/comercios/nuevo` | Crear comercio: cuenta de acceso + datos de negocio en un flujo | super_admin |
| `/admin/comercios/[id]` | Ficha: datos, estado (activo/acceso), lista de sucursales, lista de promociones | super_admin |
| `/admin/comercios/[id]/editar` | Editar nombre, descripción, marca, categoría, logo_url, correo | super_admin |
| `/admin/comercios/[id]/sucursales/nueva` | Crear sucursal | super_admin |
| `/admin/comercios/[id]/sucursales/[sucursalId]/editar` | Editar sucursal | super_admin |
| `/admin/comercios/[id]/promociones/nueva` | Crear promoción | super_admin |
| `/admin/comercios/[id]/promociones/[promoId]/editar` | Editar promoción | super_admin |

En `src/app/admin/layout.tsx` se agrega **"Comercios"** al menú (solo super_admin).

`/admin/usuarios`: se quita `'comercio'` de `TIPOS_VALIDOS` en `actions.ts`, se elimina la rama
`datosComercio` de `crearUsuario`/`editarUsuario`, y `page.tsx` deja de consultar/listar
`comercios`. Los comercios ya creados antes de este cambio siguen intactos (sus filas no se
tocan); solo cambia dónde se gestionan de ahora en adelante.

## 7. Componente A — Comercios

### 7.1 Creación (`/admin/comercios/nuevo`)

Mismo patrón que `registrarMiembro`/`crearUsuario`: validar → crear usuario en Auth (correo +
contraseña autogenerada, mostrada una sola vez) → `upsert` en `perfiles` (rol `comercio`) →
`insert` en `comercios`. Si un paso falla, se revierte lo anterior (borrar perfil/usuario).

Campos: `correo` (obligatorio, único), `nombre` (obligatorio), `descripcion`, `marca_id` (select
de `marcas`, opcional), `categoria_id` (select de `categorias`, opcional), `logo_url` (opcional).

### 7.2 Ficha y edición

- `/admin/comercios/[id]`: datos del comercio, badges de estado (**activo/inactivo** y
  **acceso**) con botones para alternar cada uno por separado, lista de sucursales con acciones
  rápidas, lista de promociones con acciones rápidas.
- `/admin/comercios/[id]/editar`: edita `nombre`, `descripcion`, `marca_id`, `categoria_id`,
  `logo_url`, y `correo` (vía Admin API, solo si cambió, mismo patrón que miembros).

## 8. Componente B — Sucursales

CRUD directo sobre `sucursales`, siempre con `comercio_id` fijo desde la ficha (no es un select
en el formulario):

- **Crear/editar:** `nombre` (obligatorio por D4), `direccion`, `telefono`, `ciudad_id` (select
  de `ciudades`, obligatorio en BD).
- **Activar/desactivar:** alterna `activo` (mismo patrón `cambiarEstadoPlan`).

## 9. Componente C — Promociones

CRUD directo sobre `promociones`, con `comercio_id` fijo desde la ficha:

- **Crear/editar:** `titulo` (obligatorio), `descripcion`, `tipo_beneficio_id` (select de
  `tipos_beneficio`), `valor`, `fecha_inicio`, `fecha_fin` (las dos fechas opcionales).
- **Activar/desactivar:** alterna `activo`.

### 9.1 Validación de `valor` según tipo (D5)

Función pura `validarValorPromocion(tipoCodigo, valor)` en `src/lib/promociones.ts`, testeable:

- `porcentaje` → `valor` obligatorio, `0 < valor <= 100`.
- `monto_fijo` → `valor` obligatorio, `valor > 0`.
- `dos_por_uno` / `regalo` → `valor` debe ser `null`/vacío; si llega un valor, error.

Se usa tanto en `crearPromocion` como en `editarPromocion` antes de escribir en la BD.

## 10. Puntos transversales

1. **Permisos:** todo `/admin/comercios/**` exige `super_admin` (D3), con `requireRol` en cada
   página y una verificación equivalente al inicio de cada server action (`exigirSuperAdmin`,
   igual que en planes).
2. **Tipos:** se extiende `database.types.ts` con `sucursales`, `promociones`, `tipos_beneficio`.
3. **Funciones puras + pruebas:** `validarValorPromocion` con pruebas unitarias. El resto se
   verifica manualmente (mismo criterio que Fases 1 y 2).
4. **Borrado lógico:** `sucursales` y `promociones` tienen `deleted_at`, pero — igual que en
   planes — esta fase no implementa borrado físico ni lo usa; "eliminar" se resuelve como
   desactivar (`activo = false`). El campo queda listo para un futuro borrado real si se decide.

## 11. Criterios de aceptación

- [ ] Un super_admin puede crear un comercio (cuenta + datos) en un solo flujo; la contraseña se
      muestra una sola vez.
- [ ] La ficha del comercio permite alternar `comercios.activo` y `perfiles.activo` de forma
      independiente.
- [ ] Un super_admin puede editar nombre, descripción, marca, categoría, logo_url y correo del
      comercio.
- [ ] Un super_admin puede crear, editar y activar/desactivar sucursales de un comercio, con
      ciudad obligatoria.
- [ ] Un super_admin puede crear, editar y activar/desactivar promociones de un comercio.
- [ ] Una promoción de tipo `porcentaje` o `monto_fijo` sin `valor` (o con `valor` inválido) se
      rechaza con un mensaje claro; una de tipo `dos_por_uno` o `regalo` con `valor` también se
      rechaza.
- [ ] `/admin/usuarios` ya no ofrece crear comercios ni los lista; los empleados/admins existentes
      siguen funcionando igual que antes.

## 12. Tareas previas (antes de construir)

1. Confirmar que exista al menos una ciudad en `ciudades`, una marca y una categoría (para
   pruebas manuales del formulario de comercio y sucursal).
2. Ninguna migración SQL nueva: todas las tablas y el catálogo `tipos_beneficio` ya existen.
