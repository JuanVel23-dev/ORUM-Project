-- ORUM · Favoritos del socio y comercios más usados
--
-- Acompaña a `20260913120000_imagenes_y_avatares.sql`. Los dos se aplican en
-- orden; ver `supabase/README.md`.
--
-- Encargo del propietario, 14/09/2026: el catálogo tendrá dos apartados nuevos
-- —«Tus favoritos» y «Los que más usas»— y el corazón de cada tarjeta tiene que
-- guardar de verdad, no solo en el navegador de ese teléfono.

-- ---------------------------------------------------------------------------
-- 1. Favoritos
-- ---------------------------------------------------------------------------
-- La clave primaria es el PAR. Así un socio no puede marcar dos veces el mismo
-- comercio ni por carrera de red ni por doble toque, y el «quitar de favoritos»
-- es un `delete` por clave, sin necesidad de leer antes.

create table if not exists public.favoritos (
  miembro_id  bigint      not null references public.miembros(id)  on delete cascade,
  comercio_id bigint      not null references public.comercios(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (miembro_id, comercio_id)
);

comment on table public.favoritos is
  'Comercios que el socio marcó con el corazón. La clave primaria es el par, así el doble toque no duplica.';

-- El índice por comercio sirve al camino inverso —«cuántos socios tienen este
-- comercio en favoritos»—, que hoy no se usa pero es la consulta natural del día
-- que se quiera ordenar el catálogo por popularidad.
create index if not exists favoritos_comercio_idx on public.favoritos (comercio_id);

alter table public.favoritos enable row level security;

-- Cada socio ve y escribe SOLO los suyos. El `miembro_id` no viene del cliente:
-- se comprueba contra el perfil de la sesión, así que un `insert` con el id de
-- otro socio no pasa la política aunque alguien componga la petición a mano.
create or replace function public.es_mi_miembro(p_miembro_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros m
    where m.id = p_miembro_id
      and m.perfil_id = auth.uid()
      and m.deleted_at is null
  );
$$;

drop policy if exists "favoritos_propios_lectura" on public.favoritos;
create policy "favoritos_propios_lectura"
on public.favoritos for select to authenticated
using (public.es_mi_miembro(miembro_id) or public.es_administracion());

drop policy if exists "favoritos_propios_escritura" on public.favoritos;
create policy "favoritos_propios_escritura"
on public.favoritos for all to authenticated
using (public.es_mi_miembro(miembro_id))
with check (public.es_mi_miembro(miembro_id));

-- ---------------------------------------------------------------------------
-- 2. Los que más usas
-- ---------------------------------------------------------------------------
-- `ventas` NO guarda `comercio_id`: guarda `sucursal_id`. Contar «cuántas veces
-- he usado este comercio» exige el salto sucursal → comercio, y hacerlo desde el
-- cliente serían dos consultas y un agrupado en JavaScript sobre todo el
-- historial del socio. Va como función para que sea una sola ida y vuelta.
--
-- `security definer` con `search_path` fijo: la función solo devuelve datos del
-- miembro que se le pide, y quién puede pedirlos lo decide el `grant` de abajo
-- más la comprobación de propiedad.

create or replace function public.comercios_mas_usados(
  p_miembro_id bigint,
  p_limite     integer default 8
)
returns table (comercio_id bigint, usos bigint, ultimo_uso timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.comercio_id,
         count(*)            as usos,
         max(v.fecha_hora)   as ultimo_uso
  from public.ventas v
  join public.sucursales s on s.id = v.sucursal_id
  join public.comercios  c on c.id = s.comercio_id
  where v.miembro_id = p_miembro_id
    -- Solo el socio dueño del historial, o la administración. Sin esto, un
    -- socio podría pedir el historial de compras de otro pasando su id.
    and (public.es_mi_miembro(p_miembro_id) or public.es_administracion())
    and c.activo
    and c.deleted_at is null
  group by s.comercio_id
  -- Empate por número de usos: gana el más reciente. Un comercio de hace un año
  -- no debería adelantar al de la semana pasada solo por tener una venta más.
  order by usos desc, ultimo_uso desc
  limit greatest(1, least(coalesce(p_limite, 8), 50));
$$;

comment on function public.comercios_mas_usados(bigint, integer) is
  'Comercios donde el socio más ha usado su membresía. Salta sucursal -> comercio porque ventas no guarda comercio_id.';

revoke all on function public.comercios_mas_usados(bigint, integer) from public;
grant execute on function public.comercios_mas_usados(bigint, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Galería de imágenes del comercio
-- ---------------------------------------------------------------------------
-- El encargo pide que la ficha tenga un apartado de imágenes, y que diga con
-- todas las letras cuándo no hay ninguna. `comercios.logo_url` es una marca y
-- `portada_url` (migración anterior) es UNA foto: ninguna de las dos es una
-- galería.

create table if not exists public.comercio_imagenes (
  id          bigserial   primary key,
  comercio_id bigint      not null references public.comercios(id) on delete cascade,
  url         text        not null,
  descripcion text,
  orden       integer     not null default 0,
  created_at  timestamptz not null default now()
);

comment on column public.comercio_imagenes.descripcion is
  'Texto alternativo. Si va vacío la imagen se pinta decorativa, nunca con el nombre del archivo.';

create index if not exists comercio_imagenes_comercio_idx
  on public.comercio_imagenes (comercio_id, orden);

alter table public.comercio_imagenes enable row level security;

-- Lectura pública: la ficha del comercio y el portal público las pintan a
-- visitantes sin sesión.
drop policy if exists "comercio_imagenes_lectura" on public.comercio_imagenes;
create policy "comercio_imagenes_lectura"
on public.comercio_imagenes for select
using (true);

drop policy if exists "comercio_imagenes_escritura_admin" on public.comercio_imagenes;
create policy "comercio_imagenes_escritura_admin"
on public.comercio_imagenes for all to authenticated
using (public.es_administracion())
with check (public.es_administracion());
