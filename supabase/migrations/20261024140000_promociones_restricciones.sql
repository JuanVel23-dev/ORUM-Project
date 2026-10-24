-- ORUM · «Condiciones y restricciones» de una promoción (24/10/2026)
--
-- Texto libre y opcional que dice cuándo o cómo NO aplica el beneficio
-- («No acumulable con otras promociones», «No aplica en domicilios»). Es
-- informativo: nada del sistema lo hace cumplir. Lo escribe el administrador y
-- lo leen el socio (ficha) y el cajero (caja del comercio).
--
-- Aditiva: las promociones de hoy quedan en NULL = sin restricciones. Los
-- permisos y las políticas de `promociones` son de tabla, así que la columna
-- nueva los hereda sin tocar nada.
--
-- El tope de 400 caracteres lo repite `MAX_RESTRICCIONES`
-- (src/lib/comercios/restricciones-promocion.ts). La aplicación guarda NULL, no
-- una cadena vacía; la base lo exige.

alter table public.promociones
  add column restricciones text
    constraint promociones_restricciones_largo
    check (restricciones is null or char_length(restricciones) between 1 and 400);
