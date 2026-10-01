-- ORUM · Auditoría del 1/10/2026 · punto 3
--
-- (a) Funciones SECURITY DEFINER que un visitante anónimo podía ejecutar.
--
--     Las tres validan el rol por dentro y a un anónimo no le devuelven datos,
--     pero no deberían ser ejecutables sin sesión: es una barrera menos que
--     depender de que el cuerpo de la función nunca cambie.
--
--     Mismo caso que 20260918091500: revocar solo de `anon` no alcanza si la
--     función conserva EXECUTE otorgado a PUBLIC (el grant por defecto de
--     Postgres al crear una función), así que se revoca de PUBLIC y de anon.
--     `authenticated` y `service_role` conservan el permiso: la herramienta de
--     comercios llama a `buscar_miembro_comercio` con la sesión del comercio.
--
--     NO se tocan las funciones `es_admin`, `es_administracion`,
--     `es_super_admin`, `es_mi_miembro` y `rol_actual`: las evalúan las
--     políticas RLS y revocarlas podría romper el acceso en silencio.

revoke execute on function public.buscar_miembro_comercio(text) from public, anon;
revoke execute on function public.estado_membresia_por_numero(text) from public, anon;
revoke execute on function public.comercios_mas_usados(bigint, integer) from public, anon;

-- (b) Índices idénticos a otro que ya existe: solo cuestan escrituras.
--
--     `miembros_numero_membresia_key` respalda una restricción UNIQUE y se
--     conserva; `miembros_numero_membresia_unica` es el duplicado suelto.
--     `idx_ventas_promocion` y `ventas_promocion_idx` son idénticos; se
--     conserva el primero.

drop index public.miembros_numero_membresia_unica;
drop index public.ventas_promocion_idx;
