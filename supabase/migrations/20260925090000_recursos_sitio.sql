-- ORUM · Recursos del sitio: la biblioteca de imágenes de la página pública
--
-- Encargo del propietario (25/09/2026): «una nueva tabla para los recursos de
-- la página, como logos de ORUM, cosas de la pagina web»; un apartado de
-- promociones en la página de inicio que se administre desde el panel —subir,
-- borrar, ver todas las alojadas y elegir cuáles se ven—; y poder cambiar la
-- imagen principal del héroe o poner varias para que roten.
--
-- Las tres cosas son la MISMA forma: una imagen, un sitio donde va, un orden y
-- un interruptor de «se publica o no». Una tabla con una columna `ubicacion`
-- las cubre las tres; tres tablas con las mismas cinco columnas habrían
-- triplicado las políticas, el gestor del panel y la lectura pública.
--
-- ⚠️ EL NOMBRE NO ES `promociones`, Y NO ES UN DESCUIDO. `public.promociones`
-- ya existe y es otra cosa: el descuento que un COMERCIO ofrece al socio, con
-- su tipo de beneficio y su vigencia. Lo de aquí son los carteles del club en
-- su propia portada. Por eso la ubicación se llama `promo` y la tabla
-- `recursos_sitio`: dos conceptos con el mismo nombre en el mismo esquema es
-- como se acaba leyendo la tabla equivocada.
--
-- Idempotente, igual que el resto: `if not exists`, `drop policy if exists` y
-- `on conflict do nothing`. Volver a correrla no duplica nada.

-- ---------------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------------

create table if not exists public.recursos_sitio (
  id          bigserial   primary key,
  ubicacion   text        not null,
  titulo      text        not null,
  descripcion text,
  url         text        not null,
  enlace_url  text,
  orden       integer     not null default 0,
  visible     boolean     not null default false,
  creado_por  uuid        references public.perfiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- `check` y no un `enum` de Postgres: añadir una ubicación nueva a un enum
  -- exige `alter type`, que en una transacción con otros DDL da guerra. Un
  -- check se cambia con un `alter table` corriente y se lee desde psql.
  constraint recursos_sitio_ubicacion_valida
    check (ubicacion in ('heroe', 'promo', 'logo', 'general'))
);

comment on table public.recursos_sitio is
  'Imágenes del sitio público administradas desde el panel: héroe, promociones del club, logos de ORUM y otros recursos. NO son las promociones de los comercios (public.promociones).';

comment on column public.recursos_sitio.ubicacion is
  'heroe = imagen principal de la portada (varias visibles rotan); promo = carteles del apartado de promociones; logo = logotipos de ORUM; general = cualquier otro recurso. Los dos últimos no se publican solos: son biblioteca.';

comment on column public.recursos_sitio.descripcion is
  'Texto alternativo. Vacío = imagen decorativa, nunca el nombre del archivo.';

comment on column public.recursos_sitio.enlace_url is
  'Destino opcional del cartel. Solo se admite https:// o una ruta interna que empiece por /. La validación vive también en el servidor (src/lib/sitio/recursos.ts).';

comment on column public.recursos_sitio.visible is
  'El interruptor de «se ve en la página». Arranca APAGADO: subir un archivo no es publicarlo.';

comment on column public.recursos_sitio.url is
  'URL pública completa, no la ruta interna del bucket. Mismo contrato que comercios.logo_url.';

-- El índice cubre la única consulta pública que existe: «dame lo visible de
-- esta ubicación, en su orden».
create index if not exists recursos_sitio_publicos_idx
  on public.recursos_sitio (ubicacion, visible, orden, id);

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
-- Mismo patrón que `comercio_imagenes`, con una diferencia que importa: allí
-- la lectura es `using (true)` porque una imagen de comercio no tiene estado
-- de publicación. Aquí SÍ lo tiene, y el borrador de un cartel no puede salir
-- por la puerta pública solo porque alguien adivine el id.

alter table public.recursos_sitio enable row level security;

drop policy if exists "recursos_sitio_lectura_publica" on public.recursos_sitio;
create policy "recursos_sitio_lectura_publica"
on public.recursos_sitio for select to anon, authenticated
using (visible);

drop policy if exists "recursos_sitio_escritura_admin" on public.recursos_sitio;
create policy "recursos_sitio_escritura_admin"
on public.recursos_sitio for all to authenticated
using (public.es_administracion())
with check (public.es_administracion());

-- ---------------------------------------------------------------------------
-- 3. Bucket
-- ---------------------------------------------------------------------------
-- Tercer bucket y no una carpeta dentro de `imagenes-comercios`: el límite es
-- distinto (2 MB, porque la imagen del héroe es una fotografía a ancho de
-- pantalla, no un logo de 72px) y las políticas también. Meterlo dentro del de
-- comercios obligaría a que la política de escritura de los comercios mirara
-- la carpeta para saber a qué se aplica, que es justo como se abren buckets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('recursos-sitio', 'recursos-sitio', true, 2097152,
   array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- SVG queda EXCLUIDO, igual que en los otros dos buckets: puede contener
-- scripts y, servido desde un bucket público del mismo origen, es XSS directo.
-- El encargo dice «logos de ORUM» y un logo pide SVG; la respuesta es exportar
-- a PNG, no abrir el bucket.

-- Convención de rutas — es lo que hace verificable la seguridad:
--   recursos-sitio/{ubicacion}/{clave}.{ext}
--
-- La clave es OPACA y se genera en servidor (`claveGaleria`), nunca el nombre
-- del archivo que trae el administrador: viene con espacios, tildes y a veces
-- una ruta de Windows entera.

drop policy if exists "recsitio_lectura_publica" on storage.objects;
create policy "recsitio_lectura_publica"
on storage.objects for select
using (bucket_id = 'recursos-sitio');

drop policy if exists "recsitio_escritura_admin" on storage.objects;
create policy "recsitio_escritura_admin"
on storage.objects for all to authenticated
using (bucket_id = 'recursos-sitio' and public.es_administracion())
with check (bucket_id = 'recursos-sitio' and public.es_administracion());
