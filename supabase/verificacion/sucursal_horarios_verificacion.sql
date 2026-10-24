-- ORUM · Verificación de 20261024120000_sucursal_horarios.sql
--
-- Correr DESPUÉS de aplicar la migración (SQL Editor de Supabase, o MCP
-- `execute_sql`). Todo va dentro de una transacción que termina en ROLLBACK:
-- no deja datos. Crea su propio comercio y sucursal de prueba.
--
-- Cada caso emite `NOTICE: OK (x) …`; si no cumple lo esperado lanza
-- `FALLO (x): …` y la transacción entera aborta. Los casos negativos
-- comprueban además el MOTIVO.

begin;

create temp table _ctx (clave text primary key, id bigint) on commit drop;

with c as (
  insert into comercios (nombre, activo) values ('ZZ Prueba horarios', true) returning id
) insert into _ctx select 'comercio', id from c;

with s as (
  insert into sucursales (comercio_id, ciudad_id, nombre, activo)
  select (select id from _ctx where clave = 'comercio'), (select id from ciudades limit 1), 'ZZ Sede', true
  returning id
) insert into _ctx select 'sucursal', id from s;

-- a) Una jornada con almuerzo dentro se guarda.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  perform reemplazar_horario_sucursal(v,
    '[{"dia":1,"abre":"09:00","cierra":"18:00","almuerzo_desde":"12:00","almuerzo_hasta":"13:00"}]'::jsonb);
  if (select count(*) from sucursal_horarios where sucursal_id = v) <> 1 then
    raise exception 'FALLO (a): no se guardo la fila';
  end if;
  raise notice 'OK (a) jornada con almuerzo';
end $$;

-- b) Reemplazar NO acumula.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  perform reemplazar_horario_sucursal(v,
    '[{"dia":2,"abre":"10:00","cierra":"14:00"},{"dia":8,"abre":null,"cierra":null}]'::jsonb);
  if (select count(*) from sucursal_horarios where sucursal_id = v) <> 2 then
    raise exception 'FALLO (b): el reemplazo acumulo filas';
  end if;
  raise notice 'OK (b) el reemplazo no acumula; cerrado (festivos) se acepta';
end $$;

-- c) Cierre pasada la medianoche con almuerzo valido.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  perform reemplazar_horario_sucursal(v,
    '[{"dia":5,"abre":"22:00","cierra":"02:00","almuerzo_desde":"23:30","almuerzo_hasta":"00:30"}]'::jsonb);
  raise notice 'OK (c) cierre pasada la medianoche';
end $$;

-- d) Almuerzo fuera de jornada: rechazado por el trigger.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  begin
    perform reemplazar_horario_sucursal(v,
      '[{"dia":1,"abre":"09:00","cierra":"18:00","almuerzo_desde":"08:00","almuerzo_hasta":"10:00"}]'::jsonb);
    raise exception 'FALLO (d): acepto un almuerzo fuera de jornada';
  exception when others then
    if sqlerrm not like 'El almuerzo debe quedar dentro%' then
      raise exception 'FALLO (d): motivo inesperado: %', sqlerrm;
    end if;
  end;
  raise notice 'OK (d) almuerzo fuera de jornada rechazado';
end $$;

-- e) Almuerzo huerfano (una sola hora) y almuerzo en dia cerrado: CHECK.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  begin
    perform reemplazar_horario_sucursal(v,
      '[{"dia":1,"abre":"09:00","cierra":"18:00","almuerzo_desde":"12:00","almuerzo_hasta":null}]'::jsonb);
    raise exception 'FALLO (e1): acepto un almuerzo con una sola hora';
  exception when check_violation then null;
  end;
  begin
    perform reemplazar_horario_sucursal(v,
      '[{"dia":1,"abre":null,"cierra":null,"almuerzo_desde":"12:00","almuerzo_hasta":"13:00"}]'::jsonb);
    raise exception 'FALLO (e2): acepto almuerzo en un dia cerrado';
  exception when check_violation then null;
  end;
  raise notice 'OK (e) almuerzo huerfano / en dia cerrado rechazados';
end $$;

-- f) Dia 9, jornada de una sola hora y abre = cierra: CHECK.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  begin
    perform reemplazar_horario_sucursal(v, '[{"dia":9,"abre":"09:00","cierra":"18:00"}]'::jsonb);
    raise exception 'FALLO (f1): acepto el dia 9';
  exception when check_violation then null;
  end;
  begin
    perform reemplazar_horario_sucursal(v, '[{"dia":1,"abre":"09:00","cierra":null}]'::jsonb);
    raise exception 'FALLO (f2): acepto una jornada con una sola hora';
  exception when check_violation then null;
  end;
  begin
    perform reemplazar_horario_sucursal(v, '[{"dia":1,"abre":"09:00","cierra":"09:00"}]'::jsonb);
    raise exception 'FALLO (f3): acepto abre = cierra';
  exception when check_violation then null;
  end;
  raise notice 'OK (f) dia 9, media jornada y abre = cierra rechazados';
end $$;

-- g) Un arreglo vacio deja la sucursal sin horario.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  perform reemplazar_horario_sucursal(v, '[]'::jsonb);
  if exists (select 1 from sucursal_horarios where sucursal_id = v) then
    raise exception 'FALLO (g): quedaron filas';
  end if;
  raise notice 'OK (g) arreglo vacio = sin horario';
end $$;

-- h) anon no escribe ni ejecuta la funcion.
do $$
declare v bigint := (select id from _ctx where clave = 'sucursal');
begin
  set local role anon;
  begin
    insert into sucursal_horarios (sucursal_id, dia, abre, cierra) values (v, 1, '09:00', '18:00');
    reset role;
    raise exception 'FALLO (h1): anon pudo insertar';
  exception when insufficient_privilege then reset role;
  end;
  set local role anon;
  begin
    perform reemplazar_horario_sucursal(v, '[]'::jsonb);
    reset role;
    raise exception 'FALLO (h2): anon pudo ejecutar la funcion';
  exception when insufficient_privilege then reset role;
  end;
  raise notice 'OK (h) anon sin escritura';
end $$;

-- i) Cambiar el horario deja huella en la bitacora (via sucursales.updated_by).
do $$
declare
  v bigint := (select id from _ctx where clave = 'sucursal');
  antes bigint;
begin
  select count(*) into antes from bitacora_actividad where entidad = 'sucursales' and entidad_id = v;
  perform reemplazar_horario_sucursal(v, '[{"dia":3,"abre":"08:00","cierra":"12:00"}]'::jsonb);
  if (select count(*) from bitacora_actividad where entidad = 'sucursales' and entidad_id = v) <= antes then
    raise exception 'FALLO (i): no se anoto el cambio en la bitacora';
  end if;
  raise notice 'OK (i) la bitacora anota el cambio de horario';
end $$;

rollback;
