-- ORUM · Almacenamiento de imágenes: logos, portadas y avatares
--
-- Contexto y contrato completo: `.claude/docs/BACKEND-implementacion-imagenes.md`.
-- Esta migración implementa lo allí acordado y lo extiende con lo que el
-- propietario pidió el 13/09/2026: portadas de comercio para el carrusel del
-- portal público, y foto de perfil para administradores y socios.
--
-- Las columnas guardan la URL PÚBLICA COMPLETA, no la ruta interna del bucket.
-- Es deliberado: `comercios.logo_url` ya contiene hoy URLs de servidores ajenos
-- y las dos fuentes tienen que convivir sin que el frontend las distinga.

-- ---------------------------------------------------------------------------
-- 1. Columnas nuevas
-- ---------------------------------------------------------------------------

-- Foto de portada del comercio: la imagen ancha y apetecible del carrusel
-- público. Es distinta del logo, que es una marca sobre fondo neutro y se
-- pinta con `contain` en una placa de proporción fija.
alter table public.comercios
  add column if not exists portada_url text;

comment on column public.comercios.portada_url is
  'URL pública de la foto de portada (16/9). Alimenta el carrusel del portal público. Si es null se cae al logo.';

-- Avatar de quien trabaja en el club. Vive en `perfiles` y no en una tabla por
-- rol porque la bitácora y los reportes muestran al AUTOR de una acción, y el
-- autor es un perfil.
alter table public.perfiles
  add column if not exists avatar_url text;

comment on column public.perfiles.avatar_url is
  'URL pública de la foto de perfil. Se muestra junto al nombre en bitácora y reportes.';

-- Foto del socio. Va en `miembros` y no en `perfiles` porque un miembro puede
-- existir sin cuenta de acceso (`miembros.perfil_id` es nullable): registrado
-- en el mostrador antes de activar su acceso, tiene que poder tener foto igual.
alter table public.miembros
  add column if not exists foto_url text;

comment on column public.miembros.foto_url is
  'URL pública de la foto del socio. Si es null, el carnet cae al avatar de iniciales.';

-- ---------------------------------------------------------------------------
-- 2. Buckets
-- ---------------------------------------------------------------------------
-- Dos buckets y no uno: los límites de tamaño son distintos y las políticas de
-- escritura también. Un avatar lo sube su dueño; un logo de comercio lo sube la
-- administración.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Logos y portadas. La portada es una foto: 1 MB, no 512 KB.
  ('imagenes-comercios', 'imagenes-comercios', true, 1048576,
   array['image/png','image/jpeg','image/webp']),
  -- Avatares. 512 KB sobra para una foto de perfil bien exportada.
  ('avatares', 'avatares', true, 524288,
   array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- SVG queda EXCLUIDO a propósito: puede contener scripts y, servido desde un
-- bucket público, es superficie de XSS.

-- ---------------------------------------------------------------------------
-- 3. Convención de rutas — es lo que hace verificable la seguridad
-- ---------------------------------------------------------------------------
--   imagenes-comercios/comercios/{comercio_id}/logo.{ext}
--   imagenes-comercios/comercios/{comercio_id}/portada.{ext}
--   imagenes-comercios/marcas/{marca_id}/logo.{ext}
--   avatares/perfiles/{auth.uid()}/avatar.{ext}
--   avatares/miembros/{miembro_id}/foto.{ext}
--
-- El identificador va EN LA RUTA para que la política pueda compararlo contra
-- el dueño de la sesión. No se cambia sin reescribir las políticas.

-- ---------------------------------------------------------------------------
-- 4. Políticas
-- ---------------------------------------------------------------------------
-- El criterio de «quién es administración» es EL MISMO que usa `requireRol` en
-- `src/lib/auth/auth.ts`: perfil activo cuyo rol es `super_admin` o `empleado`.
-- Dos verdades sobre quién es administrador es como se cuelan los agujeros.

create or replace function public.es_administracion()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles p
    join public.roles r on r.id = p.rol_id
    where p.id = auth.uid()
      and p.activo
      and r.codigo in ('super_admin', 'empleado')
  );
$$;

comment on function public.es_administracion() is
  'Espejo exacto de requireRol(''super_admin'',''empleado'') en src/lib/auth/auth.ts. Si cambia allí, cambia aquí.';

-- 4.1 Imágenes de comercio — lectura pública, escritura solo administración.
--     La lectura es pública sin sesión a propósito: el carrusel del portal
--     público las pinta a visitantes anónimos.

drop policy if exists "imgcom_lectura_publica" on storage.objects;
create policy "imgcom_lectura_publica"
on storage.objects for select
using (bucket_id = 'imagenes-comercios');

drop policy if exists "imgcom_escritura_admin" on storage.objects;
create policy "imgcom_escritura_admin"
on storage.objects for all to authenticated
using (bucket_id = 'imagenes-comercios' and public.es_administracion())
with check (bucket_id = 'imagenes-comercios' and public.es_administracion());

-- 4.2 Avatares — lectura pública; cada quien escribe SOLO su propia carpeta,
--     y la administración puede escribir la de cualquier socio (registra al
--     miembro en el mostrador, con foto, antes de que el socio tenga cuenta).

drop policy if exists "avatares_lectura_publica" on storage.objects;
create policy "avatares_lectura_publica"
on storage.objects for select
using (bucket_id = 'avatares');

drop policy if exists "avatares_escritura_propia" on storage.objects;
create policy "avatares_escritura_propia"
on storage.objects for all to authenticated
using (
  bucket_id = 'avatares'
  and (
    -- Su propio avatar de perfil.
    ((storage.foldername(name))[1] = 'perfiles'
     and (storage.foldername(name))[2] = auth.uid()::text)
    -- La foto del socio que le corresponde.
    or ((storage.foldername(name))[1] = 'miembros'
        and (storage.foldername(name))[2] in (
          select m.id::text from public.miembros m
          where m.perfil_id = auth.uid() and m.deleted_at is null
        ))
    -- O es administración.
    or public.es_administracion()
  )
)
with check (
  bucket_id = 'avatares'
  and (
    ((storage.foldername(name))[1] = 'perfiles'
     and (storage.foldername(name))[2] = auth.uid()::text)
    or ((storage.foldername(name))[1] = 'miembros'
        and (storage.foldername(name))[2] in (
          select m.id::text from public.miembros m
          where m.perfil_id = auth.uid() and m.deleted_at is null
        ))
    or public.es_administracion()
  )
);
