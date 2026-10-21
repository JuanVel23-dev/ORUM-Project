-- ORUM · Novedades programadas
--
-- Encargo del propietario (21/10/2026): «añade la funcionalidad para que el
-- administrador pueda programar el anuncio; por ejemplo un rango de fechas
-- con una hora de salida y una hora de finalización».
--
-- Dos columnas OPCIONALES:
--   · publicar_desde: desde cuándo se ve. Vacía = desde que se guarda.
--   · publicar_hasta: hasta cuándo se ve. Vacía = hasta que se retire.
-- Las novedades que ya existen quedan con las dos vacías: se siguen viendo
-- igual que hoy.
--
-- Idempotente: se puede volver a ejecutar sin romper ni duplicar nada.

alter table public.anuncios
  add column if not exists publicar_desde timestamptz,
  add column if not exists publicar_hasta timestamptz;

-- El fin no puede ser anterior al inicio (el panel ya lo impide; esto es la
-- última barrera).
alter table public.anuncios drop constraint if exists anuncios_programacion_valida;
alter table public.anuncios
  add constraint anuncios_programacion_valida
  check (publicar_desde is null or publicar_hasta is null or publicar_hasta > publicar_desde);

-- La lectura pública solo ve lo que está EN SU VENTANA: una novedad
-- programada no se puede leer por adelantado pidiéndola directamente a la
-- API, ni una vencida después. Mismas condiciones de antes, más las fechas.
alter policy "anuncios_public_select" on public.anuncios
  using (
    activo
    and deleted_at is null
    and (mostrar_publico or (select auth.role()) = 'authenticated')
    and (publicar_desde is null or publicar_desde <= now())
    and (publicar_hasta is null or publicar_hasta > now())
  );

-- Las consultas de los portales filtran por estas fechas.
create index if not exists idx_anuncios_programacion
  on public.anuncios (publicar_desde, publicar_hasta)
  where activo and deleted_at is null;
