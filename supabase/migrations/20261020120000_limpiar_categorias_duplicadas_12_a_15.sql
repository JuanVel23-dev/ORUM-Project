-- 15 «Otros\n» es duplicado de 11 «Otros»: se reasignan sus comercios.
-- 12 Veterinaria, 13 Salud y 14 Deporte no tienen comercios (verificado antes).
update public.comercios set categoria_id = 11 where categoria_id = 15;

delete from public.categorias where id in (12, 13, 14, 15)
  and not exists (select 1 from public.comercios c where c.categoria_id in (12, 13, 14, 15));
