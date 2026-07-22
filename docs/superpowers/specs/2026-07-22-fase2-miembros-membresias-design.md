# Fase 2 — Miembros y Membresías (diseño)

- **Fecha:** 2026-07-22
- **Estado:** Aprobado para planificación
- **Depende de:** Fase 1 (Portal Administrativo: login + gestión de usuarios), commit `ad4cb72`

## 1. Objetivo

Permitir que un empleado (o super_admin) registre clientes del club (**miembros**) y les
venda **membresías**, dejando constancia de quién registró y quién vendió, el tipo de
membresía (nueva o renovada) y su vigencia. Incluye la gestión del catálogo de **planes de
membresía**, requisito previo para vender.

Cubre los requisitos RF-15 (gestión de planes de membresía) y la parte administrativa de
RF-16 relacionada con miembros, más los cambios pedidos en la reunión: "los empleados pueden
consultar los clientes y su estado de membresía, añadir una membresía y que quede registrado
qué usuario hizo la venta y registró al cliente", y "saber cuándo se registró el cliente y si
la membresía es nueva o renovada".

## 2. Alcance

**Dentro de esta fase:**

1. **Planes de membresía** — CRUD (crear, listar, editar, activar/desactivar). Solo super_admin.
2. **Miembros** — registrar un cliente y su **primera membresía** en un solo flujo; listar/buscar;
   ver ficha; editar datos. Empleado y super_admin.
3. **Membresías** — creación de la primera (nueva) al registrar, y **renovación** desde la ficha.

**Fuera de esta fase (fases posteriores):**

- Portal de Miembros (login del miembro por número, perfil, descuentos, QR visual). Aquí solo se
  **provisiona la credencial**; la pantalla donde el miembro inicia sesión llega después.
- Comercios, sucursales y promociones (Fase 3).
- Métricas / dashboard y `bitacora_actividad` (Fase 4).
- Registro de ventas de comercios (RF-20 a RF-22) — el número de membresía se deja "listo" como
  payload, pero la herramienta de comercios es posterior.
- Subida de comprobante de pago (`membresias.comprobante_url`) — queda `null` por ahora.

## 3. Decisiones tomadas

| # | Decisión | Detalle |
|---|----------|---------|
| D1 | El cliente recibe cuenta de acceso al registrarse | Se crea usuario en Supabase Auth en el momento del registro. |
| D2 | Login del miembro por **número de membresía** | El número es la credencial visible. El **correo real** (obligatorio, único) se usa como email de Auth por debajo; **no** se inventan correos internos. En el Portal de Miembros (fase posterior) el login tomará número → correo asociado → inicia sesión. |
| D3 | Número de membresía = 8 dígitos: **4 secuenciales + 4 aleatorios** | Los 4 primeros identifican el orden del miembro; los 4 últimos son aleatorios. Único. Es el payload del QR y lo que el comercio teclea (RF-22). |
| D4 | Se incluye el **CRUD de planes** | Solo super_admin. Un plan inactivo no se puede vender. |
| D5 | Registran/venden **empleado y super_admin** | `vendido_por` / `registrado_por` = `empleados.id` cuando actúa un empleado; **`null`** cuando actúa un super_admin (sin fila en `empleados`). La autoría completa quedará en la bitácora (Fase 4). |

## 4. Modelo de datos

Se usan tablas que **ya existen** en Supabase (ver `Esquema_BD.txt`). No se crean tablas nuevas.

- **`planes_membresia`**: `nombre`, `descripcion`, `precio`, `duracion_meses` (default 1),
  `activo`, `deleted_at` (borrado lógico).
- **`miembros`**: `perfil_id` (uuid → perfiles, la cuenta de Auth), `codigo_publico` (uuid, ya con
  default; queda disponible por si el QR debe ser no adivinable), `numero_membresia` (text, único),
  `nombres`, `apellidos`, `cedula` (obligatoria, única), `telefono`, `direccion`, `ciudad_id`
  (→ ciudades), `registrado_por` (→ empleados), `fecha_registro`, `deleted_at`.
- **`membresias`**: `miembro_id` (→ miembros), `plan_id` (→ planes_membresia), `tipo`
  (enum `tipo_membresia`), `estado` (enum `estado_membresia`, default `activa`), `fecha_inicio`,
  `fecha_fin`, `precio_pagado`, `comprobante_url` (null por ahora), `vendido_por` (→ empleados),
  `membresia_anterior_id` (→ membresias, para renovaciones).

**El correo del miembro** vive en `auth.users` (es el email de Auth), **no** en una columna de
`miembros` — mismo patrón que los empleados en Fase 1, donde el correo se lee/edita vía Admin API.

**Enums a confirmar en Supabase antes de construir (primera tarea del plan):**

- `tipo_membresia`: se asume `nueva` / `renovada`.
- `estado_membresia`: se asume `activa` / `vencida` / `cancelada` (default `activa`).

**Restricciones SQL a asegurar en Supabase (parte del plan):**

- Índice único sobre `miembros.numero_membresia`.
- Índice único parcial sobre `miembros.cedula` where `deleted_at is null` (como `empleados`).

## 5. Rutas y navegación

Todo dentro del portal `/admin`. Se reutiliza el patrón de Fase 1: server components con
`requireRol`, server actions en `actions.ts`, formularios como client components con
`useActionState`, y `admin.ts` para operaciones privilegiadas.

| Ruta | Qué hace | Rol |
|------|----------|-----|
| `/admin/planes` | Listar planes; activar/desactivar | super_admin |
| `/admin/planes/nuevo` | Crear plan | super_admin |
| `/admin/planes/[id]/editar` | Editar plan | super_admin |
| `/admin/miembros` | Listar/buscar clientes (por número, cédula o nombre) | super_admin + empleado |
| `/admin/miembros/nuevo` | Registrar cliente **+ primera membresía** | super_admin + empleado |
| `/admin/miembros/[id]` | Ficha: datos + historial de membresías + botón "Renovar" | super_admin + empleado |
| `/admin/miembros/[id]/editar` | Editar datos del cliente | super_admin + empleado |

En `src/app/admin/layout.tsx` se agregan al menú: **"Miembros"** (ambos roles) y **"Planes"**
(solo super_admin).

## 6. Componente A — Planes de membresía

CRUD directo sobre `planes_membresia`, solo super_admin (patrón idéntico a usuarios de Fase 1):

- **Crear/editar:** `nombre` (obligatorio), `descripcion`, `precio` (≥ 0), `duracion_meses`
  (entero ≥ 1).
- **Activar/desactivar:** alterna `activo`. Un plan inactivo no aparece como opción al vender.
- **Eliminar:** borrado lógico con `deleted_at` (no se borra físicamente para no romper membresías
  que lo referencian).

## 7. Componente B — Registro de miembros

### 7.1 Formulario (`/admin/miembros/nuevo`)

Campos: `nombres`, `apellidos`, `cedula` (obligatoria, única), `telefono`, `direccion`,
`ciudad_id` (select de `ciudades`), **`correo`** (obligatorio, único), y para la primera
membresía: `plan_id` (select de planes activos) y `precio_pagado` (autocompletado con el precio
del plan, editable).

### 7.2 Generación del número de membresía

Función pura `generarNumeroMembresia(seq, rng)`:

- `seq` = orden del miembro (siguiente correlativo).
- Resultado = `padStart(seq, 4, '0')` + 4 dígitos aleatorios → 8 caracteres, p. ej. `00427318`.
- **Unicidad garantizada** por la restricción `UNIQUE` + reintento: si el insert choca, se
  regenera la parte aleatoria y se reintenta (N intentos).
- **Nota de capacidad:** 4 dígitos secuenciales cubren hasta 9.999 miembros. Al acercarse a ese
  límite se ampliará el ancho (5+3) o se agregará prefijo. Documentado como deuda conocida.

El QR (fase posterior) codificará este número; `codigo_publico` (uuid) queda como alternativa no
adivinable si se decide más adelante.

### 7.3 Creación de la cuenta y transaccionalidad

Flujo multi-paso reutilizando el patrón "revertir" (compensaciones) de `crearUsuario`:

1. Validar cédula/correo únicos y datos obligatorios **antes** de crear nada.
2. Crear usuario en Auth con el **correo real** + contraseña autogenerada (`email_confirm: true`).
3. `upsert` en `perfiles` con `rol_id` = 4 (miembro), `activo = true`.
4. `insert` en `miembros` (con `perfil_id`, `numero_membresia`, `registrado_por`, etc.).
5. `insert` de la **primera membresía** (ver Componente C).

Si cualquier paso falla, se revierten los anteriores (borrar membresía/miembro/perfil y
`deleteUser`). La contraseña generada se **muestra una sola vez** al empleado para entregarla al
cliente (mismo comportamiento que empleados en Fase 1).

### 7.4 Ficha y edición

- `/admin/miembros/[id]`: datos del cliente, número, estado de membresía vigente e historial de
  membresías (con tipo, plan, fechas, precio y quién vendió). Botón **"Renovar"**.
- `/admin/miembros/[id]/editar`: edita `nombres`, `apellidos`, `cedula` (revalidando unicidad),
  `telefono`, `direccion`, `ciudad_id`, y el `correo` (vía Admin API, como en Fase 1). El
  `numero_membresia` y el `perfil_id` (UUID) **no cambian**.

## 8. Componente C — Membresías (nueva / renovada)

### 8.1 Nueva (al registrar cliente)

`tipo = nueva`, `estado = activa`, `fecha_inicio = hoy`,
`fecha_fin = fecha_inicio + plan.duracion_meses`, `precio_pagado` (del formulario),
`vendido_por` = empleado actual o `null` (D5), `membresia_anterior_id = null`.

Función pura `calcularFechaFin(fechaInicio, duracionMeses)` (testeable).

### 8.2 Renovación (desde la ficha)

- Se elige plan y precio. `tipo = renovada`, `membresia_anterior_id` = id de la membresía vigente.
- La membresía anterior pasa a `estado = vencida`; la nueva queda `activa`.
- `fecha_inicio` = día siguiente al `fecha_fin` de la vigente **si aún está activa** (para no
  perder días); si ya venció, `fecha_inicio = hoy`. `fecha_fin` = inicio + `duracion_meses`.
- **Invariante:** un miembro tiene como máximo **una** membresía `activa` a la vez.

## 9. Puntos transversales

1. **Permisos:** Planes → super_admin. Miembros y membresías → super_admin + empleado. Se aplican
   con `requireRol` en cada página y con una verificación equivalente al inicio de cada server
   action (como `exigirSuperAdmin` en Fase 1).
2. **Autoría (D5):** al actuar, se resuelve el `empleados.id` del actor por su `perfil_id`; si no
   existe (super_admin), se guarda `null`.
3. **Tipos:** se extiende `src/lib/supabase/database.types.ts` con `planes_membresia`, `miembros`,
   `membresias` y los enums `tipo_membresia` / `estado_membresia`.
4. **Funciones puras + pruebas:** `generarNumeroMembresia` y `calcularFechaFin` se implementan como
   funciones puras con pruebas unitarias sencillas. El resto se verifica manualmente (como Fase 1).

## 10. Criterios de aceptación

- [ ] Un super_admin puede crear, editar y activar/desactivar planes; los inactivos no aparecen al
      vender.
- [ ] Un empleado puede registrar un cliente con su primera membresía; se genera un número único de
      8 dígitos y se crea la cuenta de Auth con el correo real; la contraseña se muestra una vez.
- [ ] La cédula y el correo duplicados se rechazan con un mensaje claro.
- [ ] La ficha del miembro muestra sus datos, la membresía vigente y el historial.
- [ ] Renovar crea una membresía `renovada` enlazada a la anterior, marca la anterior `vencida` y
      deja solo una `activa`.
- [ ] `registrado_por` / `vendido_por` guardan el `empleados.id` del empleado, o `null` si actuó un
      super_admin.
- [ ] Si un paso del registro falla, no quedan datos a medias (rollback correcto).

## 11. Tareas previas (antes de construir)

1. Confirmar en Supabase los valores reales de los enums `tipo_membresia` y `estado_membresia`.
2. Asegurar el índice único de `miembros.numero_membresia` y el índice único parcial de
   `miembros.cedula`.
3. Verificar que exista al menos una ciudad en `ciudades` y (para pruebas) un plan activo.
