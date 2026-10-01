-- ORUM · Derechos sobre las fotos de los socios
--
-- Spec: docs/superpowers/specs/2026-09-30-derechos-imagenes-design.md
--
-- La declaración de derechos se guarda como fecha: prueba de CUÁNDO aceptó el
-- socio, no una casilla. Sin política nueva: la escribe el servidor con
-- service_role (igual que foto_url) y `miembros_self_select` ya limita la lectura.

alter table public.miembros
  add column foto_declaracion_at timestamptz;

comment on column public.miembros.foto_declaracion_at is
  'Cuándo se declaró tener derecho sobre foto_url. null = sin declaración (fotos anteriores a 30/09/2026 o foto retirada).';

-- Buzón público de reclamos de derechos de autor (alias de recepción de la
-- cuenta del admin). `configuracion.id` es identity (tiene secuencia propia):
-- NO se escribe a mano, o se desincroniza la secuencia o el insert falla.
insert into public.configuracion (clave, valor, descripcion)
select 'correo_reclamos',
       'derechos@cluborum.com',
       'Correo público para reclamos de derechos de autor (página /derechos-de-autor).'
where not exists (select 1 from public.configuracion where clave = 'correo_reclamos');
