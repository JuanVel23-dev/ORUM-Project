-- ORUM · Límite de uso (rate limiting) en la aplicación · capa 2
--
-- Contadores de ventana fija, uno por «clave» (qué acción + quién: una IP o el
-- hash de un correo). Los consulta SOLO el servidor, con `service_role`, a
-- través de `consumir_cupo`. Ningún rol del navegador toca esta tabla.
--
-- Sin `pg_cron`: la limpieza de filas vencidas es oportunista, dentro de
-- `consumir_cupo` (ver más abajo). Evita depender de una extensión que no está
-- instalada y de un trabajo programado más que traspasar al cliente.

create table public.limite_uso (
  clave           text primary key,
  conteo          integer     not null,
  ventana_inicia  timestamptz not null default now()
);

-- Para que la limpieza oportunista no recorra la tabla entera.
create index idx_limite_uso_ventana on public.limite_uso (ventana_inicia);

-- RLS activa y SIN políticas: ni `anon` ni `authenticated` pueden leer ni
-- escribir. `service_role` la ignora, que es justo lo que queremos. Se revoca
-- además el privilegio de tabla: segunda barrera, como en 20261001150000.
alter table public.limite_uso enable row level security;
revoke all on public.limite_uso from public, anon, authenticated;

comment on table public.limite_uso is
  'Contadores de límite de uso por clave (acción + IP o hash de correo). Solo accesible desde el servidor con service_role mediante consumir_cupo / reiniciar_cupo.';

-- consumir_cupo: suma 1 al contador de la clave y dice si todavía hay cupo.
--
-- UNA sola sentencia atómica (insert … on conflict do update): si fueran un
-- select y luego un update, veinte peticiones simultáneas de un bot leerían el
-- mismo contador y pasarían todas. Aquí la fila se bloquea durante el upsert.
--
-- Ventana fija: si la ventana de la fila ya venció, el contador vuelve a 1 y la
-- ventana empieza ahora. Devuelve true mientras `conteo <= p_tope`; las
-- peticiones rechazadas también suman, pero no alargan la ventana.
--
-- SECURITY DEFINER con search_path vacío: todo va calificado (`public.`,
-- `pg_catalog.`), así una tabla homónima en otro esquema no puede secuestrarla.
create function public.consumir_cupo(
  p_clave            text,
  p_tope             integer,
  p_ventana_segundos integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conteo integer;
begin
  if p_clave is null or p_tope < 1 or p_ventana_segundos < 1 then
    raise exception 'consumir_cupo: argumentos inválidos';
  end if;

  insert into public.limite_uso as l (clave, conteo, ventana_inicia)
  values (p_clave, 1, pg_catalog.now())
  on conflict (clave) do update
    set conteo = case
          when l.ventana_inicia + pg_catalog.make_interval(secs => p_ventana_segundos)
               <= pg_catalog.now()
          then 1
          else l.conteo + 1
        end,
        ventana_inicia = case
          when l.ventana_inicia + pg_catalog.make_interval(secs => p_ventana_segundos)
               <= pg_catalog.now()
          then pg_catalog.now()
          else l.ventana_inicia
        end
  returning l.conteo into v_conteo;

  -- Limpieza oportunista (~1 de cada 100 llamadas): borra las filas cuya
  -- ventana empezó hace más de dos días. La ventana más larga que usamos es de
  -- un día, así que nada aún vigente se toca.
  if pg_catalog.random() < 0.01 then
    delete from public.limite_uso
    where ventana_inicia < pg_catalog.now() - interval '2 days';
  end if;

  return v_conteo <= p_tope;
end;
$$;

-- reiniciar_cupo: borra el contador de una clave. Lo usa el login al acertar,
-- para que el tope cuente FALLOS seguidos y no inicios de sesión.
create function public.reiniciar_cupo(p_clave text) returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.limite_uso where clave = p_clave;
$$;

-- Solo el servidor las ejecuta. Mismo criterio que 20261001140000: revocar de
-- `anon` no basta si PUBLIC conserva el EXECUTE por defecto.
revoke execute on function public.consumir_cupo(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.reiniciar_cupo(text) from public, anon, authenticated;
grant  execute on function public.consumir_cupo(text, integer, integer) to service_role;
grant  execute on function public.reiniciar_cupo(text) to service_role;
