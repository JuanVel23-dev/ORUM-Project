update public.comercios c
set categoria_id = v.cat, subcategoria_id = v.sub
from (values
  (47, 1, 12), (15, 1, 4),  (18, 1, 3),  (35, 1, 5),  (54, 1, 5),  (34, 1, 1),
  (30, 1, 1),  (45, 1, 2),  (23, 1, 8),  (48, 1, 1),  (25, 1, 5),  (56, 1, 3),
  (55, 1, 4),  (32, 1, null::int),
  (17, 8, null), (33, 8, null),
  (27, 4, 21), (24, 4, 22),
  (22, 7, null), (31, 7, null),
  (21, 3, 19), (39, 3, 15), (38, 3, 16),
  (29, 5, 23), (19, 5, 24),
  (40, 2, 14)
) as v(id, cat, sub)
where c.id = v.id and c.deleted_at is null;
