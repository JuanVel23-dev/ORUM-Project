-- ORUM · Membresías de cortesía (22/10/2026)
--
-- Una membresía de cortesía existe (el miembro la necesita para usar el club)
-- pero NO es una venta: no suma a los ingresos ni al conteo de membresías
-- vendidas. Antes solo se distinguía poniendo precio 0, que no se diferencia
-- de un descuento total ni se ve en la ficha.
--
-- `es_cortesia` es la fuente de verdad; el CHECK impide una cortesía con precio.
-- Las membresías que ya existen quedan como están (no son cortesía).

alter table public.membresias
  add column es_cortesia boolean not null default false;

alter table public.membresias
  add constraint membresias_cortesia_sin_precio
  check (not es_cortesia or precio_pagado = 0);
