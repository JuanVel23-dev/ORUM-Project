-- ORUM · Dos cosas de una vez, para pegar en el SQL Editor de Supabase
--
-- NO es una migración: la parte 2 inserta DATOS DE PRUEBA, no cambia el esquema.
-- Por eso vive en `scripts/` y no en `migrations/`.
--
-- Se puede ejecutar entero de una sola pasada.

-- ===========================================================================
-- PARTE 1 · Cerrar el permiso de `top_descuentos()`  (esto SÍ es de esquema)
-- ===========================================================================
-- El script original solo hacía `revoke ... from public`, y eso NO basta en
-- Supabase: Postgres concede EXECUTE a PUBLIC al crear la función, pero Supabase
-- además concede a `anon` y `authenticated` por separado. Quitar el de PUBLIC
-- deja los individuales en pie y la función sigue siendo llamable SIN SESIÓN.
--
-- Comprobado con la clave anónima contra la base real: devolvía las tres filas.
-- El impacto es bajo —solo sale el agregado, nunca quién usó qué— pero no es lo
-- que el script decía que hacía.

revoke all on function public.top_descuentos(integer) from public, anon, authenticated;
grant execute on function public.top_descuentos(integer) to authenticated;

-- ===========================================================================
-- PARTE 2 · Una venta de prueba, para que el «Top del club» aparezca
-- ===========================================================================
-- La marquesina exige TRES descuentos con al menos un uso. Hoy hay tres
-- vigentes, pero uno —«15% en tu pedido», de Pequeño cesar— tiene cero usos.
-- Esta venta es la que lo mete en el top.
--
-- Se inserta directamente y NO con `registrar_venta()`: esa función no valida
-- que la promoción sea del comercio ni revalida su vigencia, y por eso se le
-- revocó el acceso en agosto. La aplicación tampoco la usa — registra con un
-- insert propio y validaciones en servidor. Este script hace lo mismo.

do $$
declare
  v_promocion_id  bigint;
  v_sucursal_id   bigint;
  v_miembro_id    bigint;
  v_membresia_id  bigint;
  v_compra        numeric := 40000;
  v_descuento     numeric;
begin
  -- Nada se escribe a ciegas: cada identificador se busca por su nombre real y,
  -- si falta, el script se detiene diciendo QUÉ falta. Un insert con un id
  -- inventado crearía una venta huérfana que luego nadie sabe de dónde salió.
  select p.id into v_promocion_id
  from public.promociones p
  where p.titulo = '15% en tu pedido' and p.deleted_at is null
  limit 1;

  if v_promocion_id is null then
    raise exception 'No existe la promoción «15%% en tu pedido». ¿Se creó con otro título?';
  end if;

  select s.id into v_sucursal_id
  from public.sucursales s
  join public.promociones p on p.id = v_promocion_id
  where s.comercio_id = p.comercio_id
    and s.activo and s.deleted_at is null
  order by s.id
  limit 1;

  if v_sucursal_id is null then
    raise exception 'El comercio de esa promoción no tiene sucursales activas, y una venta necesita sucursal.';
  end if;

  select m.id into v_miembro_id
  from public.miembros m
  where m.numero_membresia = '00031324' and m.deleted_at is null
  limit 1;

  if v_miembro_id is null then
    raise exception 'No existe el socio 00031324.';
  end if;

  -- La membresía vigente del socio, si la tiene. Es nullable en `ventas`, así
  -- que no se exige: una venta puede quedar registrada aunque la membresía se
  -- borre después.
  select mb.id into v_membresia_id
  from public.membresias mb
  where mb.miembro_id = v_miembro_id
    and mb.estado = 'activa'
    and mb.fecha_fin >= current_date
  order by mb.fecha_fin desc
  limit 1;

  -- Si ya existe una venta de esta promoción para este socio, no se duplica:
  -- así el script se puede volver a ejecutar sin inflar el contador.
  if exists (
    select 1 from public.ventas v
    where v.promocion_id = v_promocion_id and v.miembro_id = v_miembro_id
  ) then
    raise notice 'Ya había una venta de esta promoción para este socio. No se duplica.';
    return;
  end if;

  v_descuento := round(v_compra * 0.15);

  insert into public.ventas (
    miembro_id, membresia_id, sucursal_id, promocion_id,
    valor_compra, valor_descuento, valor_final,
    metodo_registro, fecha_hora
  ) values (
    v_miembro_id, v_membresia_id, v_sucursal_id, v_promocion_id,
    v_compra, v_descuento, v_compra - v_descuento,
    'numero', now()
  );

  raise notice 'Venta de prueba registrada: promoción %, sucursal %, socio %.',
    v_promocion_id, v_sucursal_id, v_miembro_id;
end $$;

-- ===========================================================================
-- Comprobación: debería devolver TRES filas, las tres con usos > 0
-- ===========================================================================
select titulo, comercio_nombre, usos
from public.top_descuentos(10)
order by usos desc;
