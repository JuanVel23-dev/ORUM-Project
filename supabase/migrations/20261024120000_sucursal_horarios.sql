-- ORUM · Horario de atención por sucursal (24/10/2026)
--
-- Una fila por sucursal y «día»: 1 = lunes … 7 = domingo (numeración ISO) y
-- 8 = festivos (una sola regla para todos los festivos). `abre`/`cierra` nulos
-- = cerrado ese día. Una sucursal SIN filas = «sin horario cargado» (la ficha
-- no dice nada), que es distinto de una fila cerrada.
--
-- Un `cierra` menor o igual que `abre` significa que la jornada termina pasada
-- la medianoche. El almuerzo es opcional y cae dentro de la jornada.
--
-- Sin escritura para `anon`/`authenticated`: solo escribe la `service_role`
-- (server actions del panel), por `reemplazar_horario_sucursal`.
-- `authenticated` lee el horario de las sucursales activas de comercios
-- activos (la ficha del socio lee con su sesión).

create table public.sucursal_horarios (
  sucursal_id    bigint   not null references public.sucursales (id) on delete cascade,
  dia            smallint not null check (dia between 1 and 8),
  abre           time,
  cierra         time,
  almuerzo_desde time,
  almuerzo_hasta time,
  primary key (sucursal_id, dia),
  constraint sucursal_horarios_jornada check (
    (abre is null) = (cierra is null) and (abre is null or abre <> cierra)
  ),
  constraint sucursal_horarios_almuerzo check (
    (almuerzo_desde is null) = (almuerzo_hasta is null)
    and (almuerzo_desde is null or abre is not null)
  )
);

alter table public.sucursal_horarios enable row level security;
revoke all on public.sucursal_horarios from anon, authenticated;
grant select on public.sucursal_horarios to authenticated;

create policy "sucursal_horarios_lectura_activas"
  on public.sucursal_horarios
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sucursales s
      join public.comercios c on c.id = s.comercio_id
      where s.id = sucursal_id
        and s.activo and s.deleted_at is null
        and c.activo and c.deleted_at is null
    )
  );

-- El almuerzo cae dentro de la jornada, también cuando esta pasa de medianoche.
create function public.fn_sucursal_horarios_validar()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_abre   integer;
  v_cierra integer;
  v_desde  integer;
  v_hasta  integer;
begin
  if new.almuerzo_desde is null then
    return new;
  end if;

  v_abre   := extract(hour from new.abre)::int * 60 + extract(minute from new.abre)::int;
  v_cierra := extract(hour from new.cierra)::int * 60 + extract(minute from new.cierra)::int;
  v_desde  := extract(hour from new.almuerzo_desde)::int * 60 + extract(minute from new.almuerzo_desde)::int;
  v_hasta  := extract(hour from new.almuerzo_hasta)::int * 60 + extract(minute from new.almuerzo_hasta)::int;

  if v_cierra <= v_abre then v_cierra := v_cierra + 1440; end if;
  if v_desde < v_abre then v_desde := v_desde + 1440; end if;
  while v_hasta <= v_desde loop v_hasta := v_hasta + 1440; end loop;

  if v_desde < v_abre or v_hasta > v_cierra then
    raise exception 'El almuerzo debe quedar dentro del horario de atencion';
  end if;

  return new;
end;
$$;

create trigger trg_sucursal_horarios_validar
  before insert or update on public.sucursal_horarios
  for each row execute function public.fn_sucursal_horarios_validar();

-- Reemplaza TODO el horario de una sucursal en una transacción.
-- `p_filas`: [{ "dia": 1, "abre": "09:00", "cierra": "18:00",
--               "almuerzo_desde": "12:00" | null, "almuerzo_hasta": "13:00" | null }, …]
-- Un arreglo vacío deja la sucursal sin horario. `p_actor` llega a
-- `sucursales.updated_by`: tocar la sucursal es lo que hace que la bitácora
-- anote quién cambió el horario (la tabla de horarios no se audita aparte).
create function public.reemplazar_horario_sucursal(
  p_sucursal_id bigint,
  p_filas       jsonb,
  p_actor       uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_filas) is distinct from 'array' or jsonb_array_length(p_filas) > 8 then
    raise exception 'p_filas debe ser un arreglo de hasta 8 elementos';
  end if;

  perform 1 from public.sucursales where id = p_sucursal_id;
  if not found then
    raise exception 'La sucursal % no existe', p_sucursal_id;
  end if;

  delete from public.sucursal_horarios where sucursal_id = p_sucursal_id;

  insert into public.sucursal_horarios
    (sucursal_id, dia, abre, cierra, almuerzo_desde, almuerzo_hasta)
  select p_sucursal_id,
         (f ->> 'dia')::smallint,
         nullif(f ->> 'abre', '')::time,
         nullif(f ->> 'cierra', '')::time,
         nullif(f ->> 'almuerzo_desde', '')::time,
         nullif(f ->> 'almuerzo_hasta', '')::time
  from jsonb_array_elements(p_filas) as f;

  update public.sucursales set updated_by = p_actor where id = p_sucursal_id;
end;
$$;

revoke execute on function public.reemplazar_horario_sucursal(bigint, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.reemplazar_horario_sucursal(bigint, jsonb, uuid)
  to service_role;
