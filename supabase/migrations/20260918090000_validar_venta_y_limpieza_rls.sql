-- La Server Action `registrarVenta` (src/app/comercios/(portal)/actions.ts)
-- ya recalcula el descuento y valida dueno/vigencia de la promocion y
-- vigencia de la membresia, pero esa validacion solo vive en la Server
-- Action. El INSERT final pasa por el cliente de sesion (rol `authenticated`),
-- y la unica barrera en la base era `ventas_insert_comercio_propio`, que solo
-- confirma que la sucursal es del propio comercio. Cualquiera con esa sesion
-- podia llamar POST /rest/v1/ventas directo y fabricar una venta con
-- cualquier miembro (vigente o no), una promocion ajena o vencida, o un
-- descuento inventado.
--
-- SECURITY DEFINER porque el rol `comercio` no tiene policy de lectura sobre
-- `membresias` (a proposito: solo la ve a traves de RPCs como
-- `buscar_miembro_comercio`), y este trigger necesita confirmarla.
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
  'Ultima linea de defensa: revalida en la base lo que registrarVenta ya calcula en servidor (dueno/vigencia de la promocion, descuento correcto, membresia vigente). Sin esto, un comercio autenticado podia saltarse la Server Action llamando POST /rest/v1/ventas directo.';

create trigger trg_validar_venta
  before insert on public.ventas
  for each row
  execute function public.fn_validar_venta();

-- fn_auditar es una funcion de trigger (RETURNS trigger): invocarla fuera de
-- un trigger falla porque NEW/OLD/TG_OP no existen en ese contexto, pero el
-- EXECUTE otorgado a anon/authenticated era superficie innecesaria. Mismo
-- criterio que ya se aplico a registrar_venta en 20260819120000/...120100.
revoke execute on function public.fn_auditar() from anon, authenticated;

-- Policies duplicadas: mismo predicado que otra policy ya existente para el
-- mismo rol, resultado de alguna migracion que agrego una sin borrar la
-- anterior. No debilitaban nada (RLS combina policies permisivas con OR),
-- pero quedaban como ruido que podia leerse como si tuviera un matiz propio.
drop policy if exists "comercios activos visibles para autenticados" on public.comercios;
drop policy if exists "sucursales activas visibles para autenticados" on public.sucursales;
drop policy if exists "promociones activas visibles para autenticados" on public.promociones;
