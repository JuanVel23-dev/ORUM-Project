-- ORUM · Dejar dos planes de membresía: Mensual $30.000 y Anual $250.000
--
-- NO es una migración: cambia DATOS, no el esquema. Por eso vive en
-- `scripts/`, igual que `ajustes-y-venta-de-prueba.sql`.
--
-- Encargo del propietario (25/09/2026): «borres las membresías actuales y
-- pongas estas: Mensual: 30.000 · Anual: 250.000».
--
-- ⚠️ LOS PLANES VIEJOS SE RETIRAN, NO SE BORRAN, Y NO ES UNA LICENCIA QUE ME
-- TOME. `membresias.plan_id` es clave foránea contra esta tabla y hay 13
-- membresías apuntando a los tres planes que había (Membresía ORUM, Premium y
-- Platinum). Un `delete` fallaría por la foránea; y si la foránea fuera
-- `on delete cascade` sería peor, porque se llevaría por delante el historial
-- de pagos de socios reales y el carnet de quien tiene una membresía vigente
-- se quedaría sin nombre de plan.
--
-- Retirar = `activo = false` + `deleted_at`. Es exactamente lo que el producto
-- ya entiende por «ya no existe»: `/admin/planes` filtra `deleted_at is null`,
-- así que desaparecen de la lista, no se pueden vender ni renovar, y el
-- historial sigue en pie.
--
-- Idempotente: correrlo dos veces deja los mismos dos planes.

do $$
declare
  v_mensual bigint;
  v_anual   bigint;
begin
  -- ---------------------------------------------------------------------
  -- 1. Los dos planes nuevos. Se busca por nombre antes de insertar porque
  --    `planes_membresia.nombre` no tiene índice único: un insert a ciegas
  --    crearía un segundo «Mensual» en la segunda pasada.
  -- ---------------------------------------------------------------------
  select id into v_mensual
  from public.planes_membresia
  where nombre = 'Mensual' and deleted_at is null
  order by id
  limit 1;

  if v_mensual is null then
    insert into public.planes_membresia (nombre, descripcion, precio, duracion_meses, activo)
    values ('Mensual', 'Acceso a todos los beneficios del club durante un mes.', 30000, 1, true)
    returning id into v_mensual;
  else
    update public.planes_membresia
       set precio = 30000,
           duracion_meses = 1,
           activo = true,
           deleted_at = null,
           updated_at = now()
     where id = v_mensual;
  end if;

  select id into v_anual
  from public.planes_membresia
  where nombre = 'Anual' and deleted_at is null
  order by id
  limit 1;

  if v_anual is null then
    insert into public.planes_membresia (nombre, descripcion, precio, duracion_meses, activo)
    values ('Anual', 'Acceso a todos los beneficios del club durante doce meses.', 250000, 12, true)
    returning id into v_anual;
  else
    update public.planes_membresia
       set precio = 250000,
           duracion_meses = 12,
           activo = true,
           deleted_at = null,
           updated_at = now()
     where id = v_anual;
  end if;

  -- ---------------------------------------------------------------------
  -- 2. Todo lo demás se retira.
  -- ---------------------------------------------------------------------
  update public.planes_membresia
     set activo = false,
         deleted_at = coalesce(deleted_at, now()),
         updated_at = now()
   where id not in (v_mensual, v_anual);

  raise notice 'Planes vigentes: Mensual (id %) y Anual (id %). El resto queda retirado.', v_mensual, v_anual;
end $$;
