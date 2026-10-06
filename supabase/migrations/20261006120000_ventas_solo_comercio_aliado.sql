-- Un comercio retirado del club no debe poder registrar ventas.
--
-- «Retirar del club» (comercios.activo = false) lo saca de la fachada, del
-- catalogo y de las fichas, pero es independiente de «Desactivar acceso»
-- (perfiles.activo): la cuenta puede seguir con sesion y cobrar descuentos a
-- los socios. `registrarVenta` ahora lo comprueba, pero esa validacion solo
-- vive en la Server Action; la barrera real es esta, porque el INSERT puede
-- llegar por POST /rest/v1/ventas sin pasar por ella.
--
-- Es el cuerpo de `fn_validar_venta` de 20260918090000 sin tocar nada mas que
-- el bloque nuevo (marcado abajo). CREATE OR REPLACE conserva el trigger
-- `trg_validar_venta` y los permisos ya revocados en 20260918091500: no hace
-- falta repetirlos.
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

  -- NUEVO: solo un comercio aliado vigente puede registrar ventas.
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
           p.valor, tb.codigo as tipo_codigo
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

    -- Mismo calculo que `calcularDescuento` en src/lib/comercios/ventas.ts.
    -- 'dos_por_uno' y 'regalo' se digitan a mano ahi tambien: no hay un valor
    -- de referencia que recalcular en la base para esos dos tipos.
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

comment on function public.fn_validar_venta() is
  'Ultima linea de defensa: revalida en la base lo que registrarVenta ya calcula en servidor (comercio aliado vigente, dueno/vigencia de la promocion, descuento correcto, membresia vigente). Sin esto, un comercio autenticado podia saltarse la Server Action llamando POST /rest/v1/ventas directo.';
