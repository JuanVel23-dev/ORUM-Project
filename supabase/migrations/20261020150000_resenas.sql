-- ORUM · Reseñas de comercios
--
-- Encargo del cliente (20/10/2026): los socios califican a los comercios
-- aliados con 1 a 5 estrellas y, si quieren, un mensaje; el comercio y la
-- administración pueden responder. Diseño en
-- docs/superpowers/specs/2026-10-20-resenas-comercios-design.md.
--
-- Idempotente: se puede volver a ejecutar sin romper ni duplicar nada.
--
-- Quién escribe: NADIE con la sesión del navegador. La tabla no tiene
-- políticas de escritura y a `anon`/`authenticated` se les quitan todos los
-- privilegios; las server actions escriben con `service_role` después de
-- comprobar el rol y la propiedad. Aun así, la regla «solo reseña quien
-- compró, con membresía vigente, en un comercio activo» la garantiza la base
-- (trigger de abajo), igual que `fn_validar_venta`: si algún día una acción se
-- escribe mal, o alguien abre una política, la barrera sigue en pie.
--
-- Quién lee: los socios y el comercio a través de las funciones
-- `resenas_resumen`, `resenas_de_comercio` y `puedo_resenar`, que solo
-- devuelven lo que se puede enseñar (el autor como «María G.», nunca la fila
-- del socio). La administración puede leer la tabla directamente (política de
-- lectura con `es_administracion()`).

-- ---------------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------------

create table if not exists public.resenas (
  id bigint generated always as identity primary key,
  comercio_id bigint not null references public.comercios(id) on delete cascade,
  miembro_id bigint not null references public.miembros(id) on delete cascade,
  estrellas smallint not null check (estrellas between 1 and 5),
  -- Opcional: null = solo estrellas. Vacío no existe (la aplicación lo guarda
  -- como null), por eso el mínimo es 1.
  mensaje text check (char_length(mensaje) between 1 and 500),
  respuesta_comercio text check (char_length(respuesta_comercio) between 1 and 500),
  respuesta_comercio_at timestamptz,
  -- Se muestra como «ORUM», sin el nombre del empleado.
  respuesta_admin text check (char_length(respuesta_admin) between 1 and 500),
  respuesta_admin_at timestamptz,
  created_at timestamptz not null default now(),
  -- Cuándo cambiaron por última vez las estrellas o el mensaje. Responder no
  -- la mueve: una respuesta no convierte la reseña en «editada».
  updated_at timestamptz not null default now(),
  -- Una por socio y comercio. Así editar es un upsert y el doble envío no
  -- duplica.
  constraint resenas_comercio_miembro_key unique (comercio_id, miembro_id)
);

comment on table public.resenas is
  'Reseñas de socios a comercios aliados (1-5 estrellas, mensaje opcional) con una respuesta del comercio y otra de ORUM. Solo escribe service_role; el trigger trg_resenas_validar exige compra previa, comercio activo y membresía vigente.';

-- La ficha lista las reseñas de UN comercio, de la más nueva a la más vieja.
create index if not exists resenas_comercio_fecha_idx
  on public.resenas (comercio_id, created_at desc);

-- El borrado en cascada de un socio busca sus reseñas por `miembro_id`; la
-- clave única empieza por `comercio_id` y no le sirve.
create index if not exists resenas_miembro_idx
  on public.resenas (miembro_id);

-- ---------------------------------------------------------------------------
-- 2. Privilegios y RLS
-- ---------------------------------------------------------------------------
-- Supabase concede por defecto todo a `authenticated` (y SELECT a `anon`) en
-- las tablas nuevas. Se quita todo y se devuelve SOLO la lectura a
-- `authenticated`, que necesita la política de la administración; RLS la
-- limita a quien pase `es_administracion()`. Socios y comercios no leen la
-- tabla: usan las funciones de la sección 4.

revoke all on table public.resenas from anon, authenticated;
grant select on table public.resenas to authenticated;

alter table public.resenas enable row level security;

drop policy if exists "resenas_admin_lectura" on public.resenas;
create policy "resenas_admin_lectura"
on public.resenas for select to authenticated
using ((select public.es_administracion()));

-- ---------------------------------------------------------------------------
-- 3. Trigger de validación
-- ---------------------------------------------------------------------------
-- Comprueba contra `new.miembro_id`, nunca contra `auth.uid()`: las escrituras
-- llegan con `service_role`, donde `auth.uid()` es null.
--
-- Solo valida cuando cambia la reseña en sí (INSERT, o UPDATE de estrellas,
-- mensaje, comercio o socio). Responder no pasa por aquí: el comercio debe
-- poder responder aunque la membresía del socio haya vencido. Borrar tampoco:
-- el socio vencido puede quitar la suya.

create or replace function public.fn_validar_resena()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.estrellas is distinct from old.estrellas
     or new.mensaje is distinct from old.mensaje
     or new.comercio_id is distinct from old.comercio_id
     or new.miembro_id is distinct from old.miembro_id
  then
    if not exists (
      select 1
      from comercios c
      where c.id = new.comercio_id
        and c.activo
        and c.deleted_at is null
    ) then
      raise exception 'El comercio no esta activo como aliado';
    end if;

    if not exists (
      select 1
      from miembros mi
      where mi.id = new.miembro_id
        and mi.deleted_at is null
    ) then
      raise exception 'El socio no existe o fue dado de baja';
    end if;

    -- `ventas` guarda la sucursal, no el comercio: el salto es obligado.
    if not exists (
      select 1
      from ventas v
      join sucursales s on s.id = v.sucursal_id
      where v.miembro_id = new.miembro_id
        and s.comercio_id = new.comercio_id
    ) then
      raise exception 'Solo puede resenar quien ha comprado en este comercio';
    end if;

    -- Misma regla que `derivarEstadoMembresia`: nunca el estado en crudo.
    if not exists (
      select 1
      from membresias m
      where m.miembro_id = new.miembro_id
        and m.estado = 'activa'
        and m.fecha_fin >= current_date
    ) then
      raise exception 'La membresia del socio no esta vigente';
    end if;

    if tg_op = 'UPDATE' then
      new.updated_at := now();
    end if;
  end if;

  -- Fecha de cada respuesta: se pone sola al escribirla o cambiarla y se
  -- vacía al borrarla.
  if tg_op = 'INSERT' or new.respuesta_comercio is distinct from old.respuesta_comercio then
    new.respuesta_comercio_at :=
      case when new.respuesta_comercio is null then null else now() end;
  end if;
  if tg_op = 'INSERT' or new.respuesta_admin is distinct from old.respuesta_admin then
    new.respuesta_admin_at :=
      case when new.respuesta_admin is null then null else now() end;
  end if;

  return new;
end;
$$;

comment on function public.fn_validar_resena() is
  'Barrera de reseñas en la base: al crear o cambiar estrellas/mensaje exige compra previa del socio en el comercio, comercio activo y no eliminado, socio no eliminado y membresía vigente. Usa new.miembro_id (las escrituras llegan con service_role, sin auth.uid()). Mantiene updated_at y las fechas de las respuestas.';

drop trigger if exists trg_resenas_validar on public.resenas;
create trigger trg_resenas_validar
before insert or update on public.resenas
for each row execute function public.fn_validar_resena();

-- Patrón de 20260918091500: el EXECUTE por defecto va a PUBLIC.
revoke execute on function public.fn_validar_resena() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Lectura
-- ---------------------------------------------------------------------------

-- 4.1 Firma del autor: primer nombre + inicial del primer apellido.
--     Gemela exacta de `nombreCorto` en src/lib/resenas/resenas.ts: si cambia
--     una, cambia la otra. Sin apellido, solo el nombre (sin punto).

create or replace function public.resenas_nombre_corto(p_nombres text, p_apellidos text)
returns text
language sql
immutable
set search_path = public
as $$
  with partes as (
    select
      split_part(btrim(regexp_replace(coalesce(p_nombres, ''), '\s+', ' ', 'g')), ' ', 1) as nombre,
      split_part(btrim(regexp_replace(coalesce(p_apellidos, ''), '\s+', ' ', 'g')), ' ', 1) as apellido
  )
  select
    upper(left(nombre, 1)) || lower(substr(nombre, 2))
    || case when apellido = '' then '' else ' ' || upper(left(apellido, 1)) || '.' end
  from partes;
$$;

comment on function public.resenas_nombre_corto(text, text) is
  'Cómo firma un socio su reseña ante otros socios («María G.»). Gemela de nombreCorto en src/lib/resenas/resenas.ts.';

revoke execute on function public.resenas_nombre_corto(text, text) from public, anon, authenticated;

-- 4.2 Promedio y cantidad, en vivo (sin contadores guardados: editar o borrar
--     nunca deja cifras desfasadas). Sin fila si el comercio no está activo;
--     con reseñas a cero, total 0 y promedio null. Promedio a un decimal, como
--     `promedio()` en TypeScript.

create or replace function public.resenas_resumen(p_comercio_id bigint)
returns table (total integer, promedio numeric)
language sql
stable
security definer
set search_path = public
as $$
  select count(r.id)::integer as total,
         round(avg(r.estrellas), 1) as promedio
  from comercios c
  left join resenas r on r.comercio_id = c.id
  where c.id = p_comercio_id
    and c.activo
    and c.deleted_at is null
  group by c.id;
$$;

comment on function public.resenas_resumen(bigint) is
  'Cantidad y promedio (1 decimal) de reseñas de un comercio activo. Sin fila si el comercio salió del club.';

revoke execute on function public.resenas_resumen(bigint) from public, anon;
grant execute on function public.resenas_resumen(bigint) to authenticated;

-- 4.3 La lista de la ficha. Devuelve el autor ya recortado: el nombre
--     completo del socio no sale de la base hacia otros socios.

create or replace function public.resenas_de_comercio(p_comercio_id bigint)
returns table (
  id bigint,
  estrellas smallint,
  mensaje text,
  autor text,
  created_at timestamptz,
  respuesta_comercio text,
  respuesta_admin text,
  es_mia boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
         r.estrellas,
         r.mensaje,
         public.resenas_nombre_corto(mi.nombres, mi.apellidos) as autor,
         r.created_at,
         r.respuesta_comercio,
         r.respuesta_admin,
         coalesce(mi.perfil_id = (select auth.uid()), false) as es_mia
  from resenas r
  join comercios c on c.id = r.comercio_id
  join miembros mi on mi.id = r.miembro_id
  where r.comercio_id = p_comercio_id
    and c.activo
    and c.deleted_at is null
  order by r.created_at desc, r.id desc;
$$;

comment on function public.resenas_de_comercio(bigint) is
  'Reseñas de un comercio activo para la ficha del socio, de la más nueva a la más vieja. El autor va como «María G.»; es_mia marca la del socio de la sesión.';

revoke execute on function public.resenas_de_comercio(bigint) from public, anon;
grant execute on function public.resenas_de_comercio(bigint) to authenticated;

-- 4.4 ¿Enseña la interfaz el botón «Reseñar»? Mismas condiciones que el
--     trigger, para el socio de la sesión. Es solo una pista para la
--     interfaz: la barrera sigue siendo el trigger.

create or replace function public.puedo_resenar(p_comercio_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from miembros mi
    join comercios c on c.id = p_comercio_id
    where mi.perfil_id = (select auth.uid())
      and mi.deleted_at is null
      and c.activo
      and c.deleted_at is null
      and exists (
        select 1
        from ventas v
        join sucursales s on s.id = v.sucursal_id
        where v.miembro_id = mi.id
          and s.comercio_id = c.id
      )
      and exists (
        select 1
        from membresias m
        where m.miembro_id = mi.id
          and m.estado = 'activa'
          and m.fecha_fin >= current_date
      )
  );
$$;

comment on function public.puedo_resenar(bigint) is
  'Si el socio de la sesión puede crear o editar su reseña de este comercio (compra previa, comercio activo, membresía vigente). Pista para la interfaz; la barrera es trg_resenas_validar.';

revoke execute on function public.puedo_resenar(bigint) from public, anon;
grant execute on function public.puedo_resenar(bigint) to authenticated;
