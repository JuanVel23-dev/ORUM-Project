-- Una promocion puede valer solo ciertos dias de la semana.
--
-- `dias_semana` guarda los dias en numeracion ISO (lunes = 1 ... domingo = 7).
-- NULL = sin restriccion, vale todos los dias: asi se quedan las promociones
-- que ya existen. La aplicacion nunca guarda una lista vacia ni los siete dias
-- (los normaliza a NULL), y el CHECK impide que se cuele por otra via.
alter table public.promociones
  add column if not exists dias_semana smallint[];

alter table public.promociones
  drop constraint if exists promociones_dias_semana_valido;

alter table public.promociones
  add constraint promociones_dias_semana_valido
  check (
    dias_semana is null
    or (
      cardinality(dias_semana) between 1 and 6
      and dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    )
  );

comment on column public.promociones.dias_semana is
  'Dias de la semana (ISO: lunes=1 ... domingo=7) en que vale la promocion. NULL = todos los dias. Se comprueba contra el dia de Colombia al registrar la venta.';

-- `fn_validar_venta` es la de 20261006120000 sin tocar nada mas que el bloque
-- nuevo (marcado abajo). CREATE OR REPLACE conserva el trigger y los permisos.
create or replace function public.fn_validar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comercio_id bigint;
  v_promo record;
  v_descuento_esperado numeric;
  v_membresia record;
begin
  select s.comercio_id into v_comercio_id
  from sucursales s
  where s.id = new.sucursal_id;

  if v_comercio_id is null then
    raise exception 'Sucursal invalida';
  end if;

  if not exists (
    select 1
    from comercios c
    where c.id = v_comercio_id
      and c.activo
      and c.deleted_at is null
  ) then
    raise exception 'El comercio no esta activo como aliado';
  end if;

  if new.promocion_id is not null then
    select p.comercio_id, p.activo, p.deleted_at, p.fecha_inicio, p.fecha_fin,
           p.dias_semana, p.valor, tb.codigo as tipo_codigo
      into v_promo
      from promociones p
      join tipos_beneficio tb on tb.id = p.tipo_beneficio_id
     where p.id = new.promocion_id;

    if not found or v_promo.comercio_id is distinct from v_comercio_id then
      raise exception 'La promocion no pertenece a este comercio';
    end if;

    if not (
      v_promo.activo
      and v_promo.deleted_at is null
      and (v_promo.fecha_inicio is null or v_promo.fecha_inicio <= current_date)
      and (v_promo.fecha_fin is null or v_promo.fecha_fin >= current_date)
    ) then
      raise exception 'La promocion ya no esta vigente';
    end if;

    -- NUEVO: si la promocion solo vale ciertos dias, hoy (en Colombia, no en
    -- la zona de la sesion, que es UTC) tiene que ser uno de ellos.
    if v_promo.dias_semana is not null
       and not (
         extract(isodow from (now() at time zone 'America/Bogota'))::smallint
         = any (v_promo.dias_semana)
       ) then
      raise exception 'La promocion no aplica el dia de hoy';
    end if;

    if v_promo.tipo_codigo = 'porcentaje' then
      v_descuento_esperado := round(new.valor_compra * coalesce(v_promo.valor, 0) / 100);
    elsif v_promo.tipo_codigo = 'monto_fijo' then
      v_descuento_esperado := least(coalesce(v_promo.valor, 0), new.valor_compra);
    else
      v_descuento_esperado := new.valor_descuento;
    end if;

    if new.valor_descuento is distinct from v_descuento_esperado then
      raise exception 'El descuento no coincide con la promocion';
    end if;
  elsif new.valor_descuento <> 0 then
    raise exception 'No puede haber descuento sin promocion';
  end if;

  if new.valor_final is distinct from greatest(0, new.valor_compra - new.valor_descuento) then
    raise exception 'El valor final no coincide con compra y descuento';
  end if;

  if new.membresia_id is null then
    raise exception 'Falta la membresia del miembro';
  end if;

  select m.estado, m.fecha_fin, m.miembro_id into v_membresia
  from membresias m
  where m.id = new.membresia_id;

  if not found or v_membresia.miembro_id is distinct from new.miembro_id then
    raise exception 'La membresia no corresponde a este miembro';
  end if;

  if not (v_membresia.estado = 'activa' and v_membresia.fecha_fin >= current_date) then
    raise exception 'La membresia del miembro no esta vigente';
  end if;

  return new;
end;
$$;
