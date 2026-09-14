-- ORUM · Top de descuentos más usados (global, no por socio)
--
-- TERCER script. Los dos anteriores ya están aplicados; este es nuevo.
--
-- Encargo del propietario, 14/09/2026: «un top 10 que se mueva de los descuentos
-- más usados». Ojo a la diferencia con lo que ya existe:
--
--   comercios_mas_usados(p_miembro_id)  -> los MÍOS. Personal, por socio.
--   top_descuentos()                    -> los del CLUB. Global, igual para todos.
--
-- Son dos apartados distintos de la misma pantalla y no se pueden servir con la
-- misma consulta.

-- ---------------------------------------------------------------------------
-- Por qué tiene que ser una función y no una consulta desde el cliente
-- ---------------------------------------------------------------------------
-- Contar esto exige leer `ventas` DE TODOS LOS SOCIOS, y un socio no puede —ni
-- debe— leer el historial de compras de los demás. `security definer` permite
-- hacer el recuento dentro de la base y devolver solo el agregado: cuántas veces
-- se usó cada promoción, nunca quién la usó.
--
-- El `search_path` fijo es parte de eso: sin él, una función `security definer`
-- puede ser secuestrada resolviendo sus tablas contra otro esquema.

create or replace function public.top_descuentos(p_limite integer default 10)
returns table (
  promocion_id     bigint,
  titulo           text,
  valor            numeric,
  tipo_beneficio_id bigint,
  comercio_id      bigint,
  comercio_nombre  text,
  logo_url         text,
  usos             bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         p.titulo,
         p.valor,
         p.tipo_beneficio_id,
         c.id,
         c.nombre,
         c.logo_url,
         count(v.id) as usos
  from public.promociones p
  join public.comercios c on c.id = p.comercio_id
  -- LEFT y no INNER: la función devuelve un SUPERCONJUNTO a propósito, con las
  -- promociones de cero usos incluidas. Quién entra en el «top» lo decide la
  -- aplicación (`prepararTopDescuentos`), que descarta las de cero porque una
  -- lista de «los más usados» con algo que nadie usó es una mentira pequeña y
  -- constante.
  --
  -- Se deja aquí el superconjunto para no tener que volver a tocar la base el
  -- día que se quiera una variante «vitrina» que sí los muestre. La base da los
  -- datos; el criterio editorial vive en un módulo puro y con pruebas.
  left join public.ventas v on v.promocion_id = p.id
  where p.activo
    and p.deleted_at is null
    and c.activo
    and c.deleted_at is null
    -- Vigencia con la MISMA regla que el catálogo: nulo = sin límite por ese lado.
    and (p.fecha_inicio is null or p.fecha_inicio <= current_date)
    and (p.fecha_fin    is null or p.fecha_fin    >= current_date)
  group by p.id, p.titulo, p.valor, p.tipo_beneficio_id, c.id, c.nombre, c.logo_url
  -- Empate a cero usos: manda el alfabético, que al menos es estable entre
  -- cargas. Un orden aleatorio haría que el «top» cambiara al refrescar.
  order by usos desc, c.nombre asc
  limit greatest(1, least(coalesce(p_limite, 10), 50));
$$;

comment on function public.top_descuentos(integer) is
  'Descuentos más usados del club, global. Agrega ventas de todos los socios y devuelve solo el recuento, nunca quién los usó.';

-- `revoke ... from public` NO basta en Supabase, y es una trampa fácil de pisar.
-- Al crear una función, Postgres concede EXECUTE a PUBLIC, pero Supabase además
-- concede a `anon` y `authenticated` por separado: quitar el de PUBLIC deja los
-- individuales en pie, y la función sigue siendo llamable sin sesión. Hay que
-- revocar de los tres.
revoke all on function public.top_descuentos(integer) from public, anon, authenticated;
grant execute on function public.top_descuentos(integer) to authenticated;

-- El índice que hace barato el recuento. Sin él, cada carga del catálogo
-- recorre `ventas` entera.
create index if not exists ventas_promocion_idx on public.ventas (promocion_id);
