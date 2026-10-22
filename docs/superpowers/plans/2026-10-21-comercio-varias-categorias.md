# Varias categorías por comercio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un comercio tenga de 1 a 3 categorías, cada una con una subcategoría opcional, y que el panel, el directorio y las fichas lo reflejen.

**Architecture:** Tabla puente `comercio_categorias` (fuente de verdad, con `orden`) escrita solo por una función de Postgres atómica llamada desde las server actions con `service_role`. La lógica de filtrado y validación vive en funciones puras con pruebas; los componentes y la capa de datos solo se adaptan a la nueva forma `categorias: CategoriaDeComercio[]`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres, `service_role`), TypeScript, Vitest, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-10-21-comercio-varias-categorias-design.md`

## Global Constraints

- Mínimo 1, tope **3** categorías por comercio; categoría no repetida en el mismo comercio.
- Subcategoría: **una sola por categoría**, **opcional**, y de esa categoría.
- Columnas viejas `comercios.categoria_id` / `subcategoria_id`: **no se borran**; las acciones copian la fila `orden = 0` a ellas. Nada del código nuevo las lee.
- El mínimo de 1 se exige en las server actions, no en la base de datos. El tope de 3 y subcategoría↔categoría los garantiza la base de datos.
- `comercio_categorias`: sin privilegios para `anon`/`authenticated` (solo `service_role`), como `comercios` desde `20261007130000_comercios_sin_escritura_directa.sql`.
- Código del proyecto: sin `style={{}}` para maquetar, sin colores/espaciados literales (tokens `var(--…)`), formularios del panel con `useValidacion`/`REGLAS`, textos en español, importes no aplican.
- Tras mutar un comercio: `revalidatePath('/admin/comercios')`, `revalidatePath(`/admin/comercios/${id}`)` y `updateTag('publico')`.
- Pruebas automatizadas solo de funciones puras (`src/lib/**`). Lo demás se verifica a mano.
- No hacer `git commit` hasta que la persona lo pida; al final se propone un único commit.
- No aplicar la migración a la base real sin confirmación explícita de la persona (acción difícil de revertir).
- Verificación final: `.\node_modules\.bin\tsc.cmd --noEmit`, `.\node_modules\.bin\eslint.cmd .`, `.\node_modules\.bin\vitest.cmd run --reporter=dot`, `.\node_modules\.bin\next.cmd build` (pnpm no está en el PATH).

## Review Focus

Entradas que el spec implica y que ninguna tarea cubriría sola; cada una tiene su prueba en la tarea indicada:

1. Comercio con `categorias: []` (sin filas): con filtro de categoría activo no aparece; sin filtro aparece; nunca lanza. → Task 2.
2. Un comercio con dos de sus categorías elegidas sale **una sola vez**. → Task 2.
3. URL con una subcategoría cuya categoría no está elegida: se ignora (no restringe nada). → Task 2.
4. Formulario manipulado: 4 filas, categoría repetida, ids no numéricos, subcategoría de otra categoría → rechazado con mensaje. → Task 1.
5. Subcategoría borrada: el comercio conserva su categoría y queda «sin subcategoría», no desaparece. → Task 4 (script de verificación SQL).

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/lib/comercios/categorias-comercio.ts` (nuevo) | Lectura y validación puras de las filas de categorías de un formulario |
| `src/lib/comercios/categorias-comercio.test.ts` (nuevo) | Pruebas de lo anterior |
| `src/lib/publico/directorio.ts` / `directorio.test.ts` | Tipo `CategoriaDeComercio`, filtro y búsqueda con varias categorías |
| `src/lib/comercios/listado-admin.ts` / `listado-admin.test.ts` | Fila del listado del panel con varias categorías |
| `supabase/migrations/20261021120000_comercio_categorias.sql` (nuevo) | Tabla, triggers, función `reemplazar_categorias_comercio`, migración de datos |
| `supabase/verificacion/comercio_categorias_verificacion.sql` (nuevo) | Comprobaciones SQL post-migración |
| `src/lib/supabase/database.types.ts` | Regenerar con la tabla y la función nuevas |
| `src/lib/publico/datos-publicos.ts` | Carga de catálogo y ficha con `categorias` |
| `src/components/comercios/tarjeta-directorio.tsx`, `src/app/(publico)/_components/comercios-destacados.tsx`, `src/app/(publico)/explorar/[id]/page.tsx`, `src/app/miembros/(portal)/comercios/[id]/page.tsx` | Mostrar las categorías |
| `src/app/admin/comercios/_components/campos-categoria.tsx` | Lista de 1–3 filas categoría + subcategoría |
| `src/app/admin/comercios/actions.ts` | Crear/editar usan el validador y la función SQL |
| `src/app/admin/comercios/page.tsx`, `[id]/page.tsx`, `[id]/editar/page.tsx`, `@modal/(.)comercios/[id]/editar/page.tsx`, `[id]/editar/_components/editar-comercio-form.tsx` | Cargar y pasar las filas |
| `CLAUDE.md` | Nota breve sobre el modelo nuevo |

---

### Task 1: Validación pura de las categorías de un comercio

**Files:**
- Create: `src/lib/comercios/categorias-comercio.ts`
- Test: `src/lib/comercios/categorias-comercio.test.ts`

**Interfaces:**
- Produces:
  - `export const MAX_CATEGORIAS_COMERCIO = 3`
  - `export type FilaCategoriaComercio = { categoriaId: number; subcategoriaId: number | null }`
  - `export function leerFilasCategoria(categoriaIds: readonly string[], subcategoriaIds: readonly string[]): FilaCategoriaComercio[]` — recibe `formData.getAll('categoria_id')` y `getAll('subcategoria_id')` emparejados por posición; descarta las filas con categoría vacía; un id que no es entero positivo hace que la fila se marque inválida devolviendo `categoriaId: NaN`.
  - `export function revisarFilasCategoria(filas: readonly FilaCategoriaComercio[], categoriaDeSubcategoria: ReadonlyMap<number, number>): string | null` — mensaje de error o `null`.

- [ ] **Step 1: Write the failing tests** en `categorias-comercio.test.ts`:
  - `revisarFilasCategoria([], mapa)` → `'Elige al menos una categoría.'`
  - 4 filas distintas → `'Un comercio puede tener hasta 3 categorías.'`
  - `[{categoriaId:1,…},{categoriaId:1,…}]` → `'No repitas la misma categoría.'`
  - `[{categoriaId: NaN, subcategoriaId: null}]` → `'Una de las categorías no es válida.'`
  - `{categoriaId:1, subcategoriaId:9}` con `mapa = new Map([[9, 2]])` → `'La subcategoría no pertenece a la categoría elegida.'`; con `new Map([[9, 1]])` → `null`
  - 3 filas válidas, una con `subcategoriaId: null` → `null`
  - `leerFilasCategoria(['1','','abc'], ['4','5',''])` → `[{categoriaId:1, subcategoriaId:4}, {categoriaId: NaN, subcategoriaId: null}]`
  - `leerFilasCategoria(['2'], [''])` → `[{categoriaId:2, subcategoriaId:null}]`
- [ ] **Step 2: Run** `.\node_modules\.bin\vitest.cmd run src/lib/comercios/categorias-comercio.test.ts` — Expected: FAIL (módulo no existe).
- [ ] **Step 3: Implement** las dos funciones y la constante en `categorias-comercio.ts` (orden de comprobación de `revisarFilasCategoria`: vacío → tope → inválida → repetida → subcategoría).
- [ ] **Step 4: Run** el mismo comando — Expected: PASS.

---

### Task 2: Filtro del directorio con varias categorías

**Files:**
- Modify: `src/lib/publico/directorio.ts` (tipos `ComercioFiltrable`, `casaBusqueda`, `filtrarDirectorio`)
- Test: `src/lib/publico/directorio.test.ts` (reescribir los casos que usan `categoriaId`/`subcategoriaId` del comercio)

**Interfaces:**
- Produces:
  - `export type CategoriaDeComercio = { categoriaId: number; categoriaNombre: string; subcategoriaId: number | null; subcategoriaNombre: string | null }`
  - `ComercioFiltrable` pierde `categoriaId`, `categoriaNombre`, `subcategoriaNombre`, `subcategoriaId` y gana `categorias: CategoriaDeComercio[]` (ordenadas por `orden`; puede estar vacía).
  - `filtrarDirectorio` conserva su firma `(comercios, filtros, categoriaDe)`.
  - `export function etiquetaCategoria(c: CategoriaDeComercio): string` → `"Categoría · Subcategoría"` o solo `"Categoría"`.

- [ ] **Step 1: Write the failing tests** (nombres de `describe`: «varias categorías»):
  - comercio `categorias:[A,B]`, filtro `categoriaIds:[A.categoriaId]` → sale; filtro `[B]` → sale; filtro `[A,B]` → sale **una vez** (longitud 1).
  - comercio `categorias: []`: con `categoriaIds:[1]` no sale; con `categoriaIds:[]` sale; no lanza.
  - Regla del spec: filtros `categoriaIds:[G]`, `subcategoriaIds:[Pizzerías]` y comercio `[ {G, sub null}, {Belleza, null} ]` → NO sale; con `categoriaIds:[G, Belleza]` → sale; comercio `[ {G, Pizzerías} ]` con solo `[G]`+Pizzerías → sale.
  - `subcategoriaIds:[X]` cuya categoría no está en `categoriaIds` → no restringe (comercio de esa categoría que no se eligió no cambia el resultado).
  - búsqueda libre casa contra el nombre de **cualquiera** de las categorías y subcategorías.
  - `etiquetaCategoria` con y sin subcategoría.
- [ ] **Step 2: Run** `.\node_modules\.bin\vitest.cmd run src/lib/publico/directorio.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** el cambio: un comercio casa por categoría si **alguna** de sus filas está en `categoriaIds` y, para esa fila, o su categoría no tiene subcategorías «afinadas» o su `subcategoriaId` está entre ellas. Actualizar el comentario de `subcategoriaIds` en `FiltrosDirectorio`.
- [ ] **Step 4: Run** el mismo comando — Expected: PASS (todo el archivo, incluidos los casos existentes que no cambian: URL, `alternarCategoria`, favoritos, orden).

---

### Task 3: Listado del panel con varias categorías

**Files:**
- Modify: `src/lib/comercios/listado-admin.ts` (`FilaComercio`, `filtrarComercios`)
- Test: `src/lib/comercios/listado-admin.test.ts`

**Interfaces:**
- Produces: `FilaComercio` pierde `categoriaId`/`categoria` y gana `categoriaIds: number[]` y `categorias: string[]` (nombres, en orden). `filtrarComercios(filas, {pestana, busqueda, categoriaId})` mantiene su firma; filtra con `categoriaIds.includes(categoriaId)` y la búsqueda de texto incluye todos los nombres de `categorias`.

- [ ] **Step 1: Write the failing tests:** fila con `categoriaIds:[1,2]` aparece filtrando por 1 y por 2; fila con `[]` no aparece con `categoriaId: 1` y sí con `null`; la búsqueda «belleza» encuentra una fila cuya segunda categoría es «Belleza».
- [ ] **Step 2: Run** `.\node_modules\.bin\vitest.cmd run src/lib/comercios/listado-admin.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** y adaptar los fixtures existentes del test a la forma nueva.
- [ ] **Step 4: Run** — Expected: PASS.

---

### Task 4: Base de datos

**Files:**
- Create: `supabase/migrations/20261021120000_comercio_categorias.sql`
- Create: `supabase/verificacion/comercio_categorias_verificacion.sql` (patrón de `supabase/verificacion/resenas_verificacion.sql`)
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces (SQL):
  - Tabla `public.comercio_categorias(comercio_id, categoria_id, subcategoria_id null, orden smallint not null)`; PK `(comercio_id, categoria_id)`; único `(comercio_id, orden)`; `orden between 0 and 2`. Tipos de id iguales a los de `comercios.id`, `categorias.id`, `subcategorias.id` (comprobarlos antes). FK `comercio_id → comercios on delete cascade`, `categoria_id → categorias on delete restrict`, `subcategoria_id → subcategorias on delete set null` (FK simple, no compuesta).
  - Trigger `before insert or update`: la subcategoría pertenece a `categoria_id` (si no, error) y no hay más de 3 filas por comercio.
  - `RLS` activado; `revoke all` a `anon, authenticated`; sin políticas de lectura (la capa pública usa `service_role`, como `datos-publicos.ts`).
  - Función `public.reemplazar_categorias_comercio(p_comercio_id <tipo id>, p_filas jsonb) returns void`, `security definer`, `set search_path = public`: en una transacción borra las filas del comercio, inserta cada elemento `{categoria_id, subcategoria_id}` del arreglo con `orden` = su posición, y copia la fila `orden 0` a `comercios.categoria_id` / `subcategoria_id` (o las deja `null` si el arreglo está vacío). `revoke execute … from public, anon, authenticated; grant execute … to service_role`.
  - Migración de datos: por cada `comercios` con `deleted_at is null` y `categoria_id is not null`, una fila con `orden 0` y su `subcategoria_id`.

- [ ] **Step 1: Reconocimiento (solo lectura)** en la base real con `mcp__supabase__execute_sql`: tipos de `comercios.id`, `categorias.id`, `subcategorias.id`; y funciones, vistas y políticas que mencionen `categoria_id` (`pg_proc.prosrc`, `pg_views.definition`, `pg_policies`). Si algo depende de las columnas viejas fuera de las migraciones del repo, anotarlo y adaptarlo en la misma migración. Expected: lista de dependencias (probablemente vacía).
- [ ] **Step 2: Escribir la migración** con lo descrito arriba.
- [ ] **Step 3: Escribir el script de verificación** (transacción deshecha con `rollback`): (a) ningún comercio activo con categoría vieja se quedó sin fila; (b) una cuarta categoría falla; (c) subcategoría de otra categoría falla; (d) borrar una subcategoría deja la fila con `subcategoria_id null` y la categoría intacta; (e) `anon` y `authenticated` no pueden `select`/`insert`; (f) `reemplazar_categorias_comercio` con un arreglo de 2 deja 2 filas con `orden` 0 y 1 y copia la primera a `comercios`.
- [ ] **Step 4: PEDIR CONFIRMACIÓN a la persona** y aplicar la migración (`mcp__supabase__apply_migration`). Después ejecutar el script de verificación. Expected: todas las comprobaciones pasan.
- [ ] **Step 5: Regenerar tipos** (`mcp__supabase__generate_typescript_types`) y fusionar en `database.types.ts` solo la tabla y la función nuevas, sin tocar el formato del resto. Run `.\node_modules\.bin\tsc.cmd --noEmit` — Expected: errores solo en archivos de las Tasks 5 y 6 (aún no adaptados).

---

### Task 5: Capa pública y fichas

**Files:**
- Modify: `src/lib/publico/datos-publicos.ts`, `src/components/comercios/tarjeta-directorio.tsx`, `src/app/(publico)/_components/comercios-destacados.tsx`, `src/app/(publico)/explorar/[id]/page.tsx`, `src/app/miembros/(portal)/comercios/[id]/page.tsx`

**Interfaces:**
- Consumes: `CategoriaDeComercio`, `etiquetaCategoria` (Task 2); tabla `comercio_categorias` (Task 4).
- Produces: `ComercioVitrina` pierde `categoriaId`, `categoriaNombre`, `subcategoriaNombre`, `subcategoriaId` y gana `categorias: CategoriaDeComercio[]`. `FichaPublica` pierde `categoriaNombre`/`subcategoriaNombre` y gana `categorias: CategoriaDeComercio[]`.

- [ ] **Step 1: `leerCatalogoPublico`:** leer `comercio_categorias` (`comercio_id, categoria_id, subcategoria_id, orden`) con `.in('comercio_id', ids)` y `.limit(TOPE_DIRECTORIO * 3)`, agrupar por comercio ordenando por `orden`, y construir `categorias` con los nombres. Las `subcategorias` por categoría del filtro (`subcategoriasUsadas`) salen ahora de las filas de comercios activos. Un comercio activo sin filas queda con `categorias: []`. Actualizar el bloque de comentario sobre columnas públicas (ahora incluye `comercio_categorias`).
- [ ] **Step 2: `leerFichaPublica`:** misma lectura para ese `id`; devolver `categorias`.
- [ ] **Step 3: Consumidores.** Tarjeta del directorio y «Comercios destacados»: mostrar la primera categoría (con su subcategoría) y, si hay más, `+N` (llamada de diseño: el espacio de la tarjeta es corto). Ficha pública (`explorar/[id]`) y ficha de miembros: cada categoría como píldora (`Badge`) con `etiquetaCategoria`; las ciudades siguen como texto. Sin estilos en línea ni colores literales; si hace falta CSS, en el `.module.css` del componente con tokens.
- [ ] **Step 4: Run** `.\node_modules\.bin\tsc.cmd --noEmit` — Expected: sin errores en estos archivos.
- [ ] **Step 5: Verificación a mano** (servidor de desarrollo): `/explorar` sin filtros muestra todos; filtrar por una categoría muestra los comercios que la tengan aunque sea su 2.ª o 3.ª; elegir dos categorías de un mismo comercio no lo duplica; la ficha muestra todas las píldoras.

---

### Task 6: Panel de administración

**Files:**
- Modify: `src/app/admin/comercios/_components/campos-categoria.tsx`, `src/app/admin/comercios/actions.ts`, `src/app/admin/comercios/page.tsx`, `src/app/admin/comercios/[id]/page.tsx`, `src/app/admin/comercios/[id]/editar/page.tsx`, `src/app/admin/@modal/(.)comercios/[id]/editar/page.tsx`, `src/app/admin/comercios/[id]/editar/_components/editar-comercio-form.tsx`, y el formulario de «Crear comercio» (localizarlo con `Grep CamposCategoria`)

**Interfaces:**
- Consumes: `leerFilasCategoria`, `revisarFilasCategoria`, `MAX_CATEGORIAS_COMERCIO` (Task 1); `FilaComercio` nueva (Task 3); función SQL `reemplazar_categorias_comercio` (Task 4); `CategoriaConSubcategorias` de `lib/comercios/categorias-admin.ts` (sin cambios).
- Produces: `CamposCategoria` con props `{ categorias: CategoriaConSubcategorias[]; filasIniciales?: FilaCategoriaComercio[] }`.

- [ ] **Step 1: `CamposCategoria`.** Lista de 1 a 3 filas; cada fila: `SelectMenu name="categoria_id"` y debajo `SelectMenu name="subcategoria_id"` (siempre renderizados ambos, con valor `''` cuando no hay, para que `getAll` empareje por posición). Una categoría ya elegida no se ofrece en otra fila; la subcategoría ofrece solo las de su categoría y se reinicia al cambiar la categoría. Botón «Añadir otra categoría» deshabilitado al llegar a 3; «Quitar» en cada fila salvo la última. Arranca con `filasIniciales` o una fila vacía. El campo ya no es `optional` (la categoría es obligatoria): cada fila lleva su `Field`; el aviso viene de `REGLAS`/del servidor.
- [ ] **Step 2: `actions.ts`.** Sustituir `categoria_id`/`subcategoria_id` en `leerCamposComercio` por `filas = leerFilasCategoria(formData.getAll('categoria_id').map(String), formData.getAll('subcategoria_id').map(String))`. Reemplazar `subcategoriaInvalida` por `errorDeCategorias(admin, filas)`: carga `subcategorias(id, categoria_id)` de las subcategorías pedidas, arma el mapa y devuelve `revisarFilasCategoria(...)`. `crearComercio`: tras insertar el comercio, llamar `admin.rpc('reemplazar_categorias_comercio', { p_comercio_id, p_filas })`; si falla, borrar el comercio recién creado y `revertir()` y devolver el error. `editarComercio`: quitar `categoria_id`/`subcategoria_id` del `update` de `comercios` y llamar la misma RPC. Los avisos del servidor son los mensajes de Task 1.
- [ ] **Step 3: Listado (`page.tsx`):** cargar `comercio_categorias` de los comercios listados (no las columnas viejas) y llenar `categoriaIds`/`categorias` de cada `FilaComercio`; el filtro de categoría ofrece las categorías usadas por alguna fila; la columna de categoría muestra todas separadas por coma.
- [ ] **Step 4: Ficha (`[id]/page.tsx`) y editar (3 sitios):** cargar las filas del comercio y pasarlas como `filasIniciales`; la ficha muestra todas las categorías. Un comercio sin filas (caso residual) muestra «Sin categoría» y el formulario de edición lo obliga a elegir una.
- [ ] **Step 5: Run** `.\node_modules\.bin\tsc.cmd --noEmit` y `.\node_modules\.bin\eslint.cmd .` — Expected: sin errores.
- [ ] **Step 6: Verificación a mano** (servidor de desarrollo, sesión de super administrador): crear comercio con 3 categorías; el botón «Añadir» se deshabilita; guardar con 0 categorías muestra «Elige al menos una categoría.»; editar y quitar una categoría; el listado filtra por cada una; tras guardar, `/explorar` refleja el cambio sin esperar (caché `publico`).

---

### Task 7: Documentación y verificación final

**Files:**
- Modify: `CLAUDE.md` (sección de categorías del directorio, y «Deuda conocida»)

- [ ] **Step 1:** En `CLAUDE.md`, donde se describe que las categorías y subcategorías afinan el directorio, añadir un párrafo corto (fecha 21/10/2026): tabla `comercio_categorias`, tope 3, subcategoría opcional por categoría, escritura solo por `reemplazar_categorias_comercio`, columnas viejas conservadas y espejadas (fila `orden 0`), y que al crear una categoría nueva sigue aplicando la nota de `EXACTOS`. Añadir a «Deuda conocida» el retiro futuro de las columnas viejas y que no se ha probado con sesiones reales.
- [ ] **Step 2: Run** la verificación completa: `.\node_modules\.bin\tsc.cmd --noEmit`; `.\node_modules\.bin\eslint.cmd .`; `.\node_modules\.bin\vitest.cmd run --reporter=dot`; `.\node_modules\.bin\next.cmd build` — Expected: todo en verde.
- [ ] **Step 3:** Informar a la persona de lo verificado y de lo no verificado (sesiones reales de comercio/miembro), y proponer **un único commit** (mensaje sugerido: `feat(comercios): hasta 3 categorías por comercio, cada una con su subcategoría`).
