-- ORUM · Índices de bitacora_actividad
--
-- Auditoría de carga del 1/10/2026. La tabla solo tenía el índice de su clave
-- primaria, y crece con cada alta, edición y renovación:
--
--   · La ficha del miembro la filtra por (entidad, entidad_id) y ordena por
--     fecha_hora descendente.
--   · La pantalla /admin/bitacora filtra por entidad y ordena por fecha_hora
--     descendente.
--
-- Sin estos índices ambas consultas recorren la tabla entera, y el coste crece
-- con la tabla. Hoy son 171 filas, así que se crean sin riesgo y sin bloqueo
-- apreciable (por eso no hace falta `concurrently`).

create index idx_bitacora_entidad_id_fecha
  on public.bitacora_actividad (entidad, entidad_id, fecha_hora desc);

create index idx_bitacora_entidad_fecha
  on public.bitacora_actividad (entidad, fecha_hora desc);
