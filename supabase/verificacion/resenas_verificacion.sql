-- ORUM · Verificación de 20261020150000_resenas.sql
--
-- Correr DESPUÉS de aplicar la migración (SQL Editor de Supabase, o MCP
-- `execute_sql`). Todo va dentro de una transacción que termina en ROLLBACK:
-- no deja datos. Crea sus propios comercios, sucursales, socios, membresías y
-- ventas de prueba.
--
-- Cómo leer el resultado: cada caso emite `NOTICE: OK (x) …`. Si un caso no
-- cumple lo esperado, lanza `FALLO (x): …` y la transacción entera aborta
-- (el ROLLBACK final la deshace igual). Si un INSERT de fixtures falla por una
-- columna obligatoria que no esté contemplada aquí, ajustar ese INSERT: no es
-- un fallo de la migración.

begin;

create temp table _ctx (clave text primary key, id bigint) on commit drop;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

with c as (
  insert into comercios (nombre, activo) values ('ZZ Prueba reseñas A', true) returning id
) insert into _ctx select 'comercio_a', id from c;

with c as (
  insert into comercios (nombre, activo) values ('ZZ Prueba reseñas B', true) returning id
) insert into _ctx select 'comercio_b', id from c;

with s as (
  insert into sucursales (comercio_id, ciudad_id, nombre, activo)
  values ((select id from _ctx where clave = 'comercio_a'), (select min(id) from ciudades), 'Sede A', true)
  returning id
) insert into _ctx select 'sucursal_a', id from s;

with s as (
  insert into sucursales (comercio_id, ciudad_id, nombre, activo)
  values ((select id from _ctx where clave = 'comercio_b'), (select min(id) from ciudades), 'Sede B', true)
  returning id
) insert into _ctx select 'sucursal_b', id from s;

-- M1: María Gómez, con compra en A y en B, membresía vigente.
with m as (
  insert into miembros (numero_membresia, nombres, apellidos, cedula)
  values ('ZZRES0001', 'María', 'Gómez', '9990000001') returning id
) insert into _ctx select 'miembro_1', id from m;

-- M2: Pedro, membresía vigente pero SIN compra en A.
with m as (
  insert into miembros (numero_membresia, nombres, apellidos, cedula)
  values ('ZZRES0002', 'Pedro', 'Sin Compra', '9990000002') returning id
) insert into _ctx select 'miembro_2', id from m;

with m as (
  insert into membresias (miembro_id, plan_id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado)
  values ((select id from _ctx where clave = 'miembro_1'), (select min(id) from planes_membresia),
          'nueva', 'activa', current_date - 31, current_date + 30, 0)
  returning id
) insert into _ctx select 'membresia_1', id from m;

insert into membresias (miembro_id, plan_id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado)
values ((select id from _ctx where clave = 'miembro_2'), (select min(id) from planes_membresia),
        'nueva', 'activa', current_date - 31, current_date + 30, 0);

insert into ventas (miembro_id, membresia_id, sucursal_id, valor_compra, valor_descuento, valor_final, metodo_registro)
values
  ((select id from _ctx where clave = 'miembro_1'), (select id from _ctx where clave = 'membresia_1'),
   (select id from _ctx where clave = 'sucursal_a'), 1000, 0, 1000, 'numero'),
  ((select id from _ctx where clave = 'miembro_1'), (select id from _ctx where clave = 'membresia_1'),
   (select id from _ctx where clave = 'sucursal_b'), 1000, 0, 1000, 'numero');

-- ---------------------------------------------------------------------------
-- Casos
-- ---------------------------------------------------------------------------

do $$
declare
  v_a  bigint := (select id from _ctx where clave = 'comercio_a');
  v_b  bigint := (select id from _ctx where clave = 'comercio_b');
  v_m1 bigint := (select id from _ctx where clave = 'miembro_1');
  v_m2 bigint := (select id from _ctx where clave = 'miembro_2');
  v_resena bigint;
  v_n integer;
  v_texto text;
  v_fecha timestamptz;
begin
  -- (a) Socio CON compra en el comercio y membresía vigente → se inserta.
  insert into resenas (comercio_id, miembro_id, estrellas, mensaje)
  values (v_a, v_m1, 5, 'Muy buena atención')
  returning id into v_resena;
  raise notice 'OK (a) insert con compra previa: resena %', v_resena;

  -- (b) Socio SIN compra en ese comercio → excepción del trigger.
  begin
    insert into resenas (comercio_id, miembro_id, estrellas) values (v_a, v_m2, 3);
    raise exception 'FALLO (b): se insertó una reseña sin compra previa';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
    raise notice 'OK (b) sin compra → "%"', sqlerrm;
  end;

  -- (c) Segundo INSERT del mismo par (comercio, socio) → violación de unicidad.
  begin
    insert into resenas (comercio_id, miembro_id, estrellas) values (v_a, v_m1, 4);
    raise exception 'FALLO (c): se duplicó la reseña del mismo par';
  exception when unique_violation then
    raise notice 'OK (c) duplicado → unique_violation';
  end;

  -- (d) Membresía vencida: cambiar estrellas → excepción; responder → ok.
  update membresias set fecha_fin = current_date - 1 where miembro_id = v_m1;
  begin
    update resenas set estrellas = 4 where id = v_resena;
    raise exception 'FALLO (d1): se editaron estrellas con membresía vencida';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
    raise notice 'OK (d1) editar estrellas con membresía vencida → "%"', sqlerrm;
  end;
  update resenas set respuesta_comercio = 'Gracias por venir' where id = v_resena;
  select respuesta_comercio_at into v_fecha from resenas where id = v_resena;
  if v_fecha is null then
    raise exception 'FALLO (d2): respuesta_comercio_at no se fijó';
  end if;
  raise notice 'OK (d2) responder con membresía vencida → ok, respuesta_comercio_at = %', v_fecha;
  update membresias set fecha_fin = current_date + 30 where miembro_id = v_m1;

  -- (f) Autor en la lista: 'María' / 'Gómez' → 'María G.'.
  select autor into v_texto from resenas_de_comercio(v_a) where id = v_resena;
  if v_texto is distinct from 'María G.' then
    raise exception 'FALLO (f): autor = %, se esperaba María G.', v_texto;
  end if;
  raise notice 'OK (f) autor = %', v_texto;

  -- (f2) Firma: mismos casos que nombreCorto en TypeScript.
  if resenas_nombre_corto('ana', '') is distinct from 'Ana' then
    raise exception 'FALLO (f2): ana/'''' = %', resenas_nombre_corto('ana', '');
  end if;
  if resenas_nombre_corto('José', 'ñañez') is distinct from 'José Ñ.' then
    raise exception 'FALLO (f3): José/ñañez = %', resenas_nombre_corto('José', 'ñañez');
  end if;
  if resenas_nombre_corto('  MARÍA  josé ', ' gómez   pérez ') is distinct from 'María G.' then
    raise exception 'FALLO (f4): varios nombres/apellidos = %', resenas_nombre_corto('  MARÍA  josé ', ' gómez   pérez ');
  end if;
  if resenas_nombre_corto('Luis', 'Rojas') is distinct from 'Luis R.' then
    raise exception 'FALLO (f5): apellido de una palabra = %', resenas_nombre_corto('Luis', 'Rojas');
  end if;
  raise notice 'OK (f2-f5) ana→Ana · José ñañez→José Ñ. · varios→María G. · Luis Rojas→Luis R.';

  -- (resumen) Comercio activo con una reseña de 5 → total 1, promedio 5.0.
  select count(*) into v_n from resenas_resumen(v_a) where total = 1 and promedio = 5.0;
  if v_n <> 1 then
    raise exception 'FALLO (resumen): resenas_resumen no devolvió (1, 5.0)';
  end if;
  raise notice 'OK (resumen) total 1, promedio 5.0';

  -- (e) Comercio retirado (activo = false) → la lista y el resumen, vacíos.
  update comercios set activo = false where id = v_a;
  select count(*) into v_n from resenas_de_comercio(v_a);
  if v_n <> 0 then
    raise exception 'FALLO (e): resenas_de_comercio devolvió % filas con el comercio inactivo', v_n;
  end if;
  select count(*) into v_n from resenas_resumen(v_a);
  if v_n <> 0 then
    raise exception 'FALLO (e2): resenas_resumen devolvió fila con el comercio inactivo';
  end if;
  raise notice 'OK (e) comercio inactivo → 0 filas en lista y resumen';
  update comercios set activo = true where id = v_a;

  -- (h) Con la sesión del navegador nadie escribe: authenticated no tiene
  --     privilegio de INSERT.
  begin
    set local role authenticated;
    insert into resenas (comercio_id, miembro_id, estrellas) values (v_b, v_m1, 2);
    raise exception 'FALLO (h): authenticated pudo insertar';
  exception when insufficient_privilege then
    raise notice 'OK (h) authenticated no inserta → insufficient_privilege';
  end;
  reset role;

  -- (i) anon no ejecuta las funciones de lectura.
  begin
    set local role anon;
    perform * from resenas_de_comercio(v_a);
    raise exception 'FALLO (i): anon ejecutó resenas_de_comercio';
  exception when insufficient_privilege then
    raise notice 'OK (i) anon no ejecuta resenas_de_comercio → insufficient_privilege';
  end;
  reset role;

  -- (g) Borrado en cascada. Antes de cada DELETE se quita lo que referencia
  --     al comercio o al socio SIN cascada (ventas, sucursales, membresías):
  --     eso no es parte de lo que se prueba.

  -- (g2) Borrar el comercio B borra sus reseñas.
  insert into resenas (comercio_id, miembro_id, estrellas) values (v_b, v_m1, 4);
  delete from ventas where sucursal_id = (select id from _ctx where clave = 'sucursal_b');
  delete from sucursales where comercio_id = v_b;
  delete from comercios where id = v_b;
  select count(*) into v_n from resenas where comercio_id = v_b;
  if v_n <> 0 then
    raise exception 'FALLO (g2): quedaron % reseñas del comercio borrado', v_n;
  end if;
  raise notice 'OK (g2) delete comercio → reseñas en cascada';

  -- (g1) Borrar el socio M1 borra su reseña de A.
  delete from ventas where miembro_id = v_m1;
  delete from membresias where miembro_id = v_m1;
  delete from numeros_registro where miembro_id = v_m1;
  delete from miembros where id = v_m1;
  select count(*) into v_n from resenas where miembro_id = v_m1;
  if v_n <> 0 then
    raise exception 'FALLO (g1): quedaron % reseñas del socio borrado', v_n;
  end if;
  raise notice 'OK (g1) delete miembro → reseñas en cascada';
end;
$$;

rollback;
