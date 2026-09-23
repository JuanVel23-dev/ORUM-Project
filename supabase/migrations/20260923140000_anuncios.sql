-- ORUM · Novedades del club: tabla anuncios, RLS y bucket de imágenes
--
-- Spec: docs/superpowers/specs/2026-09-23-anuncios-novedades-design.md
--
-- "anuncios" y no "novedades": `src/lib/comercios/estanterias.ts` ya usa
-- "novedades" para los comercios recién sumados al catálogo
-- (`seleccionarNovedades`). La etiqueta de interfaz sigue siendo "Novedades";
-- el nombre interno evita el choque de conceptos en el código.

-- ---------------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------------

create table public.anuncios (
  id bigint generated always as identity primary key,
  titulo text not null,
  cuerpo text not null,
  imagen_url text,
  mostrar_publico boolean not null default true,
  mostrar_miembros boolean not null default true,
  activo boolean not null default true,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.anuncios is
  'Novedades del club publicadas por administración. Visibles en el Portal Público y/o el de Miembros según mostrar_publico/mostrar_miembros.';

-- ---------------------------------------------------------------------------
-- 2. RLS de la tabla — mismo patrón que comercios_admin / planes_admin
-- ---------------------------------------------------------------------------

alter table public.anuncios enable row level security;

drop policy if exists "anuncios_admin" on public.anuncios;
create policy "anuncios_admin"
on public.anuncios for all to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "anuncios_public_select" on public.anuncios;
create policy "anuncios_public_select"
on public.anuncios for select to anon, authenticated
using (activo and deleted_at is null);

-- ---------------------------------------------------------------------------
-- 3. Bucket de imágenes — mismo patrón que imagenes-comercios
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('imagenes-anuncios', 'imagenes-anuncios', true, 1048576,
   array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "imganu_lectura_publica" on storage.objects;
create policy "imganu_lectura_publica"
on storage.objects for select
using (bucket_id = 'imagenes-anuncios');

drop policy if exists "imganu_escritura_admin" on storage.objects;
create policy "imganu_escritura_admin"
on storage.objects for all to authenticated
using (bucket_id = 'imagenes-anuncios' and public.es_administracion())
with check (bucket_id = 'imagenes-anuncios' and public.es_administracion());
