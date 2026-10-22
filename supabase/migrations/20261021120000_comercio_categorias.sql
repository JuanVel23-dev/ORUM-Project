-- ORUM · Varias categorías por comercio (21/10/2026)
--
-- Un comercio tiene de 1 a 3 categorías y, en cada una, una subcategoría
-- opcional. La fuente de verdad es `comercio_categorias`; las columnas
-- `comercios.categoria_id` / `subcategoria_id` NO se borran: la función de
-- abajo les copia la fila `orden = 0` para que revertir el código no deje
-- categorías viejas. Nada de la aplicación nueva las lee.
--
-- El mínimo de 1 se exige en las server actions (un comercio nuevo se crea en
-- dos pasos). El tope de 3 y «la subcategoría es de su categoría» los
-- garantiza esta base de datos.
--
-- Sin escritura para `anon`/`authenticated`: solo escribe la `service_role`
-- (server actions), como `comercios` desde 20261007130000. `authenticated` lee
-- las filas de comercios activos (ficha del socio).

create table public.comercio_categorias (
  comercio_id     bigint   not null references public.comercios (id) on delete cascade,
  categoria_id    smallint not null references public.categorias (id) on delete restrict,
  subcategoria_id smallint          references public.subcategorias (id) on delete set null,
  orden           smallint not null check (orden between 0 and 2),
  primary key (comercio_id, categoria_id),
  unique (comercio_id, orden)
);

alter table public.comercio_categorias enable row level security;
revoke all on public.comercio_categorias from anon, authenticated;

-- Lectura para la sesión del socio (la ficha del portal de miembros lee con su
-- sesión, no con la `service_role`): solo las filas de comercios activos.
-- Escribir sigue siendo exclusivo de la `service_role`.
grant select on public.comercio_categorias to authenticated;

create policy "comercio_categorias_lectura_activos"
  on public.comercio_categorias
  for select
  to authenticated
  using (
    exists (
      select 1 from public.comercios c
      where c.id = comercio_id and c.activo and c.deleted_at is null
    )
  );

-- La subcategoría pertenece a la categoría, y no más de 3 por comercio.
create function public.fn_comercio_categorias_validar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.subcategoria_id is not null and not exists (
    select 1 from public.subcategorias s
    where s.id = new.subcategoria_id and s.categoria_id = new.categoria_id
  ) then
    raise exception 'La subcategoría % no pertenece a la categoría %',
      new.subcategoria_id, new.categoria_id;
  end if;

  if tg_op = 'INSERT' and (
    select count(*) from public.comercio_categorias c where c.comercio_id = new.comercio_id
  ) >= 3 then
    raise exception 'Un comercio puede tener hasta 3 categorías';
  end if;

  return new;
end;
$$;

create trigger trg_comercio_categorias_validar
  before insert or update on public.comercio_categorias
  for each row execute function public.fn_comercio_categorias_validar();

-- Reemplaza TODAS las categorías de un comercio en una transacción.
-- `p_filas`: [{ "categoria_id": 1, "subcategoria_id": 4 | null }, …] en orden.
-- `p_actor` llega a `updated_by` para que la bitácora sepa quién fue.
create function public.reemplazar_categorias_comercio(
  p_comercio_id bigint,
  p_filas       jsonb,
  p_actor       uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat smallint;
  v_sub smallint;
begin
  if jsonb_typeof(p_filas) is distinct from 'array' or jsonb_array_length(p_filas) > 3 then
    raise exception 'p_filas debe ser un arreglo de hasta 3 elementos';
  end if;

  delete from public.comercio_categorias where comercio_id = p_comercio_id;

  insert into public.comercio_categorias (comercio_id, categoria_id, subcategoria_id, orden)
  select p_comercio_id,
         (f.fila ->> 'categoria_id')::smallint,
         nullif(f.fila ->> 'subcategoria_id', '')::smallint,
         (f.pos - 1)::smallint
  from jsonb_array_elements(p_filas) with ordinality as f(fila, pos);

  select categoria_id, subcategoria_id into v_cat, v_sub
  from public.comercio_categorias
  where comercio_id = p_comercio_id and orden = 0;

  update public.comercios
  set categoria_id = v_cat, subcategoria_id = v_sub, updated_by = p_actor
  where id = p_comercio_id
    and (categoria_id is distinct from v_cat or subcategoria_id is distinct from v_sub);
end;
$$;

revoke execute on function public.reemplazar_categorias_comercio(bigint, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.reemplazar_categorias_comercio(bigint, jsonb, uuid)
  to service_role;

-- Los comercios de hoy conservan su categoría y subcategoría como primera fila.
insert into public.comercio_categorias (comercio_id, categoria_id, subcategoria_id, orden)
select c.id, c.categoria_id, c.subcategoria_id, 0
from public.comercios c
where c.deleted_at is null and c.categoria_id is not null;
