-- ORUM · Publicidad: las imágenes del carrusel de la portada
--
-- Encargo del propietario (13/10/2026): las imágenes del carrusel de «Una red
-- de valor que se nota» salían de las portadas de los comercios, y el
-- administrador no podía quitarlas ni cambiarlas. Pasan a ser PUBLICIDAD que
-- el administrador sube, ordena, oculta y quita desde el panel
-- (`/admin/publicidad`), sin relación con ningún comercio.
--
-- Idempotente: se puede volver a ejecutar sin romper ni duplicar nada.
--
-- Las imágenes van al bucket `imagenes-anuncios`, que ya existe
-- (20260923140000_anuncios.sql) y que solo escribe el super administrador
-- (20260924090000_anuncios_rls_super_admin.sql). No hace falta bucket nuevo:
-- van en su propia carpeta, `publicidad/`.

-- ---------------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------------

create table if not exists public.publicidad (
  id bigint generated always as identity primary key,
  imagen_url text not null,
  -- Qué se ve en la imagen: es su texto alternativo en la portada.
  descripcion text not null default '',
  -- Posición en el carrusel, de menor a mayor.
  orden integer not null default 0,
  -- false = guardada pero oculta: no sale en la portada.
  activo boolean not null default true,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

comment on table public.publicidad is
  'Imágenes del carrusel de la portada pública. Las sube y ordena el super administrador; no pertenecen a ningún comercio.';

create index if not exists publicidad_orden_idx on public.publicidad (orden, id);

-- ---------------------------------------------------------------------------
-- 2. RLS — mismo patrón que `anuncios`
-- ---------------------------------------------------------------------------

alter table public.publicidad enable row level security;

drop policy if exists "publicidad_admin" on public.publicidad;
create policy "publicidad_admin"
on public.publicidad for all to authenticated
using (public.es_super_admin())
with check (public.es_super_admin());

-- Cualquiera puede leer las que están publicadas: salen en la portada.
drop policy if exists "publicidad_public_select" on public.publicidad;
create policy "publicidad_public_select"
on public.publicidad for select to anon, authenticated
using (activo);
