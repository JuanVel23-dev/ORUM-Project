# Varias categorías por comercio — diseño

Fecha: 21/10/2026 · Encargo del propietario.

## Intención

Hoy un comercio tiene UNA categoría y UNA subcategoría (`comercios.categoria_id`,
`comercios.subcategoria_id`). Hay negocios que no caben en una sola (una
barbería que también vende productos, un café que también es librería). El
propietario quiere que un comercio pueda tener varias categorías, cada una con
su subcategoría, para aparecer donde su cliente lo buscaría.

## Reglas (decididas por el propietario)

- Cada comercio tiene de **1 a 3 categorías**. Mínimo 1 obligatorio; tope 3.
- Cada categoría lleva **como máximo una subcategoría**, y debe pertenecer a esa
  categoría. La subcategoría sigue siendo **opcional**.
- Una categoría no se repite en el mismo comercio.

## Llamadas del diseñador (no discutidas, revisables)

- No hay categoría «principal»: las tres pesan igual.
- La ficha del comercio (pública y de miembros) muestra las categorías como
  píldoras.
- Las columnas viejas `comercios.categoria_id` / `subcategoria_id` NO se borran
  en este cambio: quedan sin uso, para poder volver atrás. Se retiran en una
  migración aparte cuando todo esté probado en producción.
- El mínimo de 1 se exige en el servidor (server actions), no en la base de
  datos: los comercios nuevos pueden crearse en dos pasos. El tope de 3 y la
  coherencia categoría↔subcategoría sí los garantiza la base de datos.
- Los iconos de categoría no cambian: van por categoría, no por comercio.

## Llamadas tras la revisión del constructor (del diseñador)

- **Fuente de verdad:** `comercio_categorias`. La tabla lleva `orden` (smallint,
  0–2) para que «la primera» esté definida. Las acciones del panel, además,
  copian la fila de `orden` 0 a `comercios.categoria_id`/`subcategoria_id`, de
  modo que revertir el código no deje categorías viejas. Es una copia, no una
  segunda fuente: nada la lee en la versión nueva.
- **Otros lectores de las columnas viejas:** el primer paso del plan es consultar
  en la base real funciones, vistas y políticas que mencionen `categoria_id`
  (el esquema se aplica a mano y puede haber objetos que no estén en las
  migraciones). Si aparece alguno, se adapta en la misma migración.
- **Escritura atómica:** una función de Postgres (`SECURITY DEFINER`, solo
  `service_role`) que reemplaza todas las filas de un comercio en una
  transacción. Las acciones la llaman por RPC; así un fallo a medias nunca
  deja un comercio sin categorías.
- **Borrar o fusionar una categoría:** `ON DELETE RESTRICT` sobre `categoria_id`
  (se mueven los comercios antes de borrar, como hicieron las migraciones de
  limpieza); sobre `subcategoria_id`, un trigger la deja en `null` (no una
  clave compuesta, que anularía también la categoría).
- **Comercios sin filas** (creados por otra vía): se tratan como hoy un comercio
  sin categoría. El panel los marca. «Quiero ser aliado» es una solicitud, no
  crea comercios; solo los crea el panel.
- **Lectura pública:** el constructor decide política y consulta, con la
  restricción de que solo se vean filas de comercios activos y no borrados, y
  de que se conserve la etiqueta de caché `publico`.
- **Semántica del filtro, con un ejemplo:** se eligen «Gastronomía» y la
  subcategoría «Pizzerías». Un comercio con Gastronomía (sin subcategoría) y
  Belleza NO sale: Gastronomía queda restringida a «Pizzerías» y Belleza no
  está elegida. Si además se elige Belleza, sí sale (por Belleza, entera). Las
  pruebas de `directorio.test.ts` se reescriben con esta regla.

## Objetivos

- Un comercio con varias categorías sale en el directorio bajo cada una, **una
  sola vez** si se filtran dos de sus categorías.
- Filtrar por una subcategoría restringe solo su categoría (como hoy,
  `lib/publico/directorio.ts`): con «Gastronomía» y «Belleza» y la subcategoría
  «Pizzerías», un comercio de Belleza se ve entero.
- Ningún comercio actual pierde su categoría ni su subcategoría.

## No objetivos

- «Mi negocio» NO edita categorías (hoy tampoco): solo el panel de administración.
- No se cambian los iconos, el orden de la tira de categorías ni las reseñas.
- No se tocan el diseño visual ni los tokens: se reutilizan los componentes
  existentes (`SelectMenu`, `Field`, `Badge`).

## Anti-objetivos

- Que un comercio quede sin categoría tras la migración.
- Que el directorio muestre un mismo comercio duplicado.
- Que un comercio pueda escribir sus categorías desde el navegador: la tabla nueva
  queda sin privilegios para `anon`/`authenticated`, como `comercios` desde el
  07/10/2026 (`20261007130000_comercios_sin_escritura_directa.sql`). Solo
  escriben las server actions con `service_role`.

## Cambios

### Base de datos (migración nueva en `supabase/migrations/`)

- Tabla `comercio_categorias`: `comercio_id`, `categoria_id`, `subcategoria_id`
  (nullable), con clave única `(comercio_id, categoria_id)`.
- Clave foránea compuesta o trigger que garantice que `subcategoria_id`
  pertenece a `categoria_id`.
- Trigger que rechaza una cuarta categoría por comercio.
- Lectura: igual que `categorias`/`subcategorias`, lectura pública de lo que ya
  es público (comercios activos); sin escritura para `anon`/`authenticated`.
- Migración de datos: cada comercio no borrado con `categoria_id` pasa a una fila
  con su `subcategoria_id`.
- Script de verificación en `supabase/verificacion/` (patrón de
  `resenas_verificacion.sql`).

### Panel de administración

- `campos-categoria.tsx`: de un par de selectores a una lista de hasta 3 filas
  (categoría + su subcategoría debajo). «Añadir otra» se deshabilita al llegar a 3;
  cada fila se puede quitar salvo la última. La subcategoría ofrece solo las de
  su categoría; una categoría ya elegida no se ofrece en otra fila.
- `actions.ts`: crear y editar leen las filas, validan (1–3, sin repetir,
  subcategoría de su categoría) y reemplazan las filas del comercio.
- `REGLAS` del formulario (`useValidacion`): «Elige al menos una categoría».
- Listado (`page.tsx`), filtro por categoría (`listado-admin.ts`, con pruebas) y
  ficha (`[id]/page.tsx`, `[id]/editar`): muestran y filtran por todas.

### Directorio público y catálogo de miembros

- `datos-publicos.ts`: cada comercio trae `categorias: {categoriaId, subcategoriaId}[]`
  en vez de un par. Las subcategorías disponibles por categoría siguen siendo las
  que tienen algún comercio activo.
- `directorio.ts` (puro, con pruebas): el filtro por categoría casa si el comercio
  tiene ALGUNA de las elegidas; el de subcategoría restringe solo la categoría
  de esa subcategoría, mirando la fila correspondiente del comercio.
- `directorio-interactivo.tsx`, `subcategorias-directorio.tsx`, `vistas-catalogo.ts`
  adaptan los tipos.
- Fichas (`datos-publicos.ts` ficha pública, `miembros/(portal)/comercios/[id]/page.tsx`):
  píldoras con las categorías (y subcategoría cuando la hay).
- `database.types.ts`: regenerar con la tabla nueva.

## Restricciones del proyecto que aplican

- Formularios con validación campo a campo (`useValidacion`); sin estilos en línea;
  tokens, no valores literales; el servidor es quien decide.
- Pruebas automatizadas solo de funciones puras (`directorio.test.ts`,
  `listado-admin.test.ts`); el resto se verifica a mano.
- Antes de dar por hecho: `tsc --noEmit`, `eslint .`, `vitest run`, `next build`.
- Tras aplicar la migración, comprobar en la base real que ningún comercio activo
  se quedó sin fila.

## Qué queda al constructor

Nombres exactos de columnas y políticas, si la coherencia categoría↔subcategoría
va por clave compuesta o por trigger, y la forma visual de la lista de filas en el
formulario (reutilizando componentes existentes). El orden de las filas se
muestra tal cual se guardaron.
