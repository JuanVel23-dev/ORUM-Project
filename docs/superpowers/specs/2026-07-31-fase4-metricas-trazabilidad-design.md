# Fase 4 — Métricas y trazabilidad (diseño)

- **Fecha:** 2026-07-31
- **Estado:** Aprobado para planificación
- **Depende de:** Fase 1, Fase 2 y Fase 3 (`main`)

## 1. Objetivo

Agregar trazabilidad fina del historial de movimientos de los miembros (RF-19) y un dashboard
de métricas para `super_admin`, usando dos tablas que **ya existen en Supabase pero aún no se
usan**: `bitacora_actividad` (auditoría genérica) y `ventas` (registro de uso de la membresía en
comercios).

## 2. Punto de partida (lo que ya existe)

- `bitacora_actividad`: `id, actor_id (uuid), accion (text), entidad (text), entidad_id (bigint),
  datos_anteriores (jsonb), datos_nuevos (jsonb), fecha_hora (timestamptz)`. Sin tipos en
  `database.types.ts`, sin ningún `insert` en el código todavía.
- `ventas`: `id, miembro_id, membresia_id, sucursal_id, promocion_id, valor_compra,
  valor_descuento, valor_final, metodo_registro (enum 'qr'|'numero'), registrada_por_perfil,
  fecha_hora, created_at`. Tampoco tiene tipos ni código que la use.
- `miembros/actions.ts` ya tiene exactamente 3 acciones que mutan miembros/membresías:
  `registrarMiembro` (alta), `editarMiembro` (edición), `renovarMembresia` (renovación). La
  autoría de venta/registro (`vendido_por`/`registrado_por`) ya se guarda desde Fase 2; lo que
  falta es el historial de eventos en sí.
- La ficha de miembro (`/admin/miembros/[id]`) ya muestra datos + "Historial de membresías".

## 3. Alcance

**Dentro de esta fase:**

1. Bitácora de actividad **acotada a miembros** (RF-19 dice literalmente "historial de
   movimientos realizados por los miembros"): instrumentar las 3 acciones de
   `miembros/actions.ts`, mostrar el historial en la ficha del miembro y en un listado global
   `/admin/bitacora`.
2. Dashboard de métricas `/admin/metricas` con las 4 métricas mencionadas en la reunión con el
   cliente: miembros nuevos por periodo, membresías vendidas por empleado, ventas por comercio,
   uso de membresía por miembro y comercio.
3. Tipar `ventas` en `database.types.ts` para poder consultarla desde el dashboard.

**Fuera de esta fase (fases posteriores):**

- **Registro de ventas real** — eso es la Herramienta para Comercios (RF-20 a RF-22), fase
  posterior. Como resultado, "ventas por comercio" y "uso de membresía por comercio" mostrarán
  estado vacío hasta entonces; la query y el render quedan listos y correctos.
- Bitácora para comercios, sucursales, promociones o usuarios internos — se decidió limitar el
  alcance a miembros; se puede ampliar en una fase futura si se necesita.
- Gráficos/visualizaciones — el dashboard se construye como tablas y una tarjeta de conteo, sin
  librerías de charts.

## 4. Decisiones tomadas

| # | Decisión | Detalle |
|---|----------|---------|
| D1 | Bitácora acotada a `entidad = 'miembro'` | Se sigue el texto literal de RF-19. `registrarActividad` siempre escribe `entidad: 'miembro'`; no se generaliza a otras entidades en esta fase. |
| D2 | La bitácora es *best-effort* | Si el `insert` en `bitacora_actividad` falla, se loguea el error a consola pero **no** revierte ni bloquea la operación principal (alta/edición/renovación). La auditoría nunca debe tumbar el flujo de negocio. |
| D3 | Agregaciones en JS, filtrado por fecha en la query | PostgREST no hace `GROUP BY` cómodo. Se filtra por rango de fechas con `.gte()/.lte()` en la consulta a Supabase, y se agrupa/suma en funciones puras de JS, testeables sin BD (mismo espíritu que `validarValorPromocion`). |
| D4 | Métricas basadas en `ventas` quedan con estado vacío por ahora | Se construyen igual (query + UI), aceptando que mostrarán "sin datos" hasta que exista la Herramienta para Comercios. No se bloquea la Fase 4 por esta dependencia. |
| D5 | Solo `super_admin` ve bitácora global y dashboard | Consistente con Fases 2-3 (catálogos/reportes = super_admin) y con el texto de la reunión ("el administrador mayor va a poder ver..."). Los empleados siguen viendo solo lo suyo (la ficha del miembro, donde ya ven el historial de ese miembro puntual). |

## 5. Modelo de datos

Tablas que **ya existen** en Supabase. No se crean tablas nuevas ni migraciones.

- **`bitacora_actividad`**: ver columnas arriba. `datos_anteriores`/`datos_nuevos` guardan un
  snapshot parcial (solo los campos relevantes del evento, no la fila completa) como JSON.
- **`ventas`**: ver columnas arriba. `sucursal_id` es la puerta de entrada a `comercio_id` (vía
  `sucursales.comercio_id`); `metodo_registro` distingue si se registró por QR o por número de
  membresía (RF-20-22, informativo en esta fase).

Se extiende `src/lib/supabase/database.types.ts` con `bitacora_actividad` y `ventas`.

## 6. Rutas y navegación

| Ruta | Qué hace | Rol |
|------|----------|-----|
| `/admin/bitacora` | Listado global de eventos de miembros, con filtros por miembro/fecha/tipo de acción | super_admin |
| `/admin/metricas` | Dashboard con las 4 métricas, filtrable por rango de fechas | super_admin |

En `src/app/admin/layout.tsx` se agregan **"Bitácora"** y **"Métricas"** al menú (solo
super_admin, mismo patrón que "Comercios"/"Usuarios"/"Planes").

`/admin/miembros/[id]` gana una nueva sección "Historial de actividad" (visible para
super_admin y empleado, igual que el resto de la ficha).

## 7. Componente A — Bitácora de actividad

### 7.1 Helper de escritura

`src/lib/bitacora.ts`:

```
registrarActividad(admin, { actorId, accion, entidadId, datosAnteriores?, datosNuevos? }): Promise<void>
```

Hace el `insert` en `bitacora_actividad` con `entidad: 'miembro'` fijo (D1); atrapa cualquier
error y lo loguea sin propagarlo (D2).

### 7.2 Instrumentación

Se llama desde las 3 acciones existentes en `miembros/actions.ts`, después de que la operación
principal tuvo éxito:

- `registrarMiembro` → `accion: 'alta'`, `datos_nuevos`: nombres, apellidos, cédula, plan,
  precio_pagado.
- `editarMiembro` → `accion: 'edicion'`, `datos_anteriores`: fila previa (nombres, apellidos,
  cédula, teléfono, dirección, ciudad), `datos_nuevos`: los mismos campos tras el cambio.
- `renovarMembresia` → `accion: 'renovacion'`, `datos_nuevos`: plan, fecha_inicio, fecha_fin,
  precio_pagado de la nueva membresía.

`actor_id` = `actor.userId` (el perfil autenticado que ejecuta la acción); `entidad_id` =
`miembro.id` en los tres casos (incluida la renovación, que referencia al miembro, no a la
membresía, para que toda su bitácora quede en un solo hilo consultable desde su ficha).

### 7.3 Texto legible

`src/lib/bitacora.ts` también expone:

```
resumirEventoBitacora(accion, datosAnteriores, datosNuevos): string
```

Función pura que arma el texto mostrado en las dos vistas (p. ej. "Membresía renovada — Plan
Oro, vence 2027-01-15"), para no duplicar lógica de formato entre la ficha y el listado global.

### 7.4 Vistas

- **Ficha del miembro** (`/admin/miembros/[id]`): sección "Historial de actividad" debajo de
  "Historial de membresías" — tabla con fecha/hora, acción (badge) y el resumen de
  `resumirEventoBitacora`, más quién lo hizo (correo del `actor_id`, resuelto vía
  `admin.auth.admin.getUserById`, mismo patrón ya usado para mostrar el correo del miembro).
- **Listado global** (`/admin/bitacora`): misma tabla pero de todos los miembros, con el nombre
  del miembro como columna adicional (enlazando a su ficha) y filtros por query params: miembro
  (nombre/número/cédula), rango de fechas, tipo de acción (`alta`/`edicion`/`renovacion`).

## 8. Componente B — Dashboard de métricas

### 8.1 Filtro de periodo

Formulario `GET` con `desde`/`hasta` (inputs `type="date"`), por defecto últimos 30 días.
`rangoUltimosDias(dias, hoy)` en `src/lib/metricas.ts` calcula el default, función pura testeada
(igual idea que `hoyISO()` en `miembros/actions.ts`, pero exportada y testeable).

### 8.2 Las 4 métricas

Cada consulta filtra por fecha en Supabase (`.gte()/.lte()` sobre el campo de fecha relevante) y
pasa las filas crudas a una función pura de `src/lib/metricas.ts` que agrupa/suma:

1. **Miembros nuevos** — tarjeta con el conteo de `miembros` cuyo `fecha_registro` cae en el
   rango. Cálculo directo (sin función de agrupación, es solo un conteo).
2. **Membresías vendidas por empleado** — tabla `empleado | # vendidas | monto total`. Filtra
   `membresias` por `fecha_inicio` en el rango, agrupa por `vendido_por` con
   `agruparMembresiasPorEmpleado(membresias, empleados)`; incluye fila "Super admin" para
   `vendido_por = null`.
3. **Ventas por comercio** — tabla `comercio | # ventas | monto total | descuento total`. Filtra
   `ventas` por `fecha_hora`, agrupa vía `sucursal_id → comercio_id` con
   `agruparVentasPorComercio(ventas, sucursales, comercios)`.
4. **Uso de membresía por miembro y comercio** — tabla `miembro | comercio | veces usada`,
   mismo filtro de `ventas`, agrupado por par miembro+comercio con
   `agruparVentasPorMiembroYComercio(ventas, sucursales, comercios, miembros)`, ordenado
   descendente, primeros 20 resultados.

Las métricas 3 y 4 muestran "Aún no hay ventas registradas en este periodo" cuando la consulta
regresa vacío (D4) — no es un caso de error, es el estado esperado hasta la fase de comercios.

## 9. Puntos transversales

1. **Permisos:** `/admin/bitacora` y `/admin/metricas` exigen `requireRol('super_admin')`. La
   sección de historial en la ficha del miembro hereda el permiso ya existente de esa página
   (`super_admin`, `empleado`).
2. **Tipos:** se extiende `database.types.ts` con `bitacora_actividad` y `ventas`.
3. **Funciones puras + pruebas:** `resumirEventoBitacora`, `rangoUltimosDias`,
   `agruparMembresiasPorEmpleado`, `agruparVentasPorComercio`,
   `agruparVentasPorMiembroYComercio` — todas testeadas con Vitest. `registrarActividad` (hace
   I/O) se verifica manualmente, mismo criterio que el resto de server actions del proyecto.
4. **Sin migraciones SQL:** ambas tablas ya existen tal cual se necesitan; no se modifica el
   esquema.

## 10. Criterios de aceptación

- [ ] Registrar, editar y renovar un miembro genera una fila en `bitacora_actividad` con
      `entidad = 'miembro'` y el `entidad_id` correcto, sin importar si el insert de bitácora
      tarda o falla (la operación principal siempre se completa).
- [ ] La ficha del miembro muestra su historial de actividad en orden cronológico con texto
      legible.
- [ ] `/admin/bitacora` lista eventos de todos los miembros y los filtros (miembro, fecha, tipo
      de acción) funcionan combinados.
- [ ] `/admin/metricas` calcula correctamente miembros nuevos y membresías vendidas por
      empleado contra datos reales existentes, respetando el rango de fechas.
- [ ] `/admin/metricas` muestra "sin datos" (no un error) en ventas por comercio y uso por
      miembro/comercio mientras `ventas` esté vacía.
- [ ] Un `empleado` puede ver el historial de actividad en la ficha de un miembro, pero no puede
      acceder a `/admin/bitacora` ni `/admin/metricas` (redirige/rechaza como el resto de rutas
      super_admin).

## 11. Tareas previas (antes de construir)

Ninguna. Ambas tablas (`bitacora_actividad`, `ventas`) ya existen en Supabase con las columnas
necesarias; no requiere sembrar datos ni migraciones.
