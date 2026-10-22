-- Verificación de 20261021120000_comercio_categorias.sql
-- Todo dentro de una transacción que se deshace: no deja rastro.
-- Cada bloque DO lanza una excepción si la comprobación falla.

begin;

-- (a) Ningún comercio con categoría vieja se quedó sin fila.
do $$
begin
  if exists (
    select 1 from public.comercios c
    where c.deleted_at is null and c.categoria_id is not null
      and not exists (select 1 from public.comercio_categorias x where x.comercio_id = c.id)
  ) then raise exception 'FALLA (a): comercio con categoría y sin fila'; end if;
  raise notice 'OK (a) migración de datos';
end $$;

-- Datos de prueba: un comercio y tres categorías distintas con una subcategoría.
do $$
declare
  v_com bigint;
  v_cats smallint[];
  v_sub smallint;
  v_otra_sub smallint;
  v_n int;
begin
  select id into v_com from public.comercios where deleted_at is null order by id limit 1;
  select array_agg(id order by id) into v_cats from (select id from public.categorias order by id limit 4) q;
  select id into v_sub from public.subcategorias where categoria_id = v_cats[1] limit 1;
  select id into v_otra_sub from public.subcategorias where categoria_id <> v_cats[1] limit 1;

  -- (f) reemplazar deja 2 filas con orden 0 y 1 y copia la primera a comercios.
  perform public.reemplazar_categorias_comercio(
    v_com,
    jsonb_build_array(
      jsonb_build_object('categoria_id', v_cats[1], 'subcategoria_id', v_sub),
      jsonb_build_object('categoria_id', v_cats[2], 'subcategoria_id', null)));
  select count(*) into v_n from public.comercio_categorias where comercio_id = v_com;
  if v_n <> 2 then raise exception 'FALLA (f): esperaba 2 filas y hay %', v_n; end if;
  if not exists (select 1 from public.comercios where id = v_com and categoria_id = v_cats[1]
                 and subcategoria_id is not distinct from v_sub) then
    raise exception 'FALLA (f): no se copió la fila orden 0 a comercios';
  end if;
  raise notice 'OK (f) reemplazar y copiar';

  -- (b) una cuarta categoría falla.
  begin
    perform public.reemplazar_categorias_comercio(
      v_com,
      (select jsonb_agg(jsonb_build_object('categoria_id', c, 'subcategoria_id', null)) from unnest(v_cats) c));
    raise exception 'FALLA (b): aceptó 4 categorías';
  exception when others then
    if sqlerrm like 'FALLA%' then raise; end if;
    raise notice 'OK (b) rechaza la cuarta (%)', sqlerrm;
  end;

  -- (c) una subcategoría de otra categoría falla.
  if v_otra_sub is not null then
    begin
      perform public.reemplazar_categorias_comercio(
        v_com,
        jsonb_build_array(jsonb_build_object('categoria_id', v_cats[1], 'subcategoria_id', v_otra_sub)));
      raise exception 'FALLA (c): aceptó una subcategoría ajena';
    exception when others then
      if sqlerrm like 'FALLA%' then raise; end if;
      raise notice 'OK (c) rechaza subcategoría ajena (%)', sqlerrm;
    end;
  end if;

  -- (d) borrar la subcategoría deja la fila con la categoría y sin subcategoría.
  if v_sub is not null then
    perform public.reemplazar_categorias_comercio(
      v_com,
      jsonb_build_array(jsonb_build_object('categoria_id', v_cats[1], 'subcategoria_id', v_sub)));
    update public.comercios set subcategoria_id = null where subcategoria_id = v_sub;
    delete from public.subcategorias where id = v_sub;
    if not exists (select 1 from public.comercio_categorias
                   where comercio_id = v_com and categoria_id = v_cats[1] and subcategoria_id is null) then
      raise exception 'FALLA (d): la fila desapareció o conservó la subcategoría borrada';
    end if;
    raise notice 'OK (d) subcategoría borrada deja la categoría';
  end if;
end $$;

-- (e) anon no toca nada; authenticated solo lee; nadie salvo service_role escribe.
do $$
begin
  if has_table_privilege('anon', 'public.comercio_categorias', 'select,insert,update,delete')
     or has_table_privilege('authenticated', 'public.comercio_categorias', 'insert,update,delete')
     or not has_table_privilege('authenticated', 'public.comercio_categorias', 'select')
     or has_function_privilege('authenticated', 'public.reemplazar_categorias_comercio(bigint,jsonb,uuid)', 'execute')
     or has_function_privilege('anon', 'public.reemplazar_categorias_comercio(bigint,jsonb,uuid)', 'execute')
  then raise exception 'FALLA (e): privilegios de más'; end if;
  raise notice 'OK (e) privilegios correctos';
end $$;

rollback;
