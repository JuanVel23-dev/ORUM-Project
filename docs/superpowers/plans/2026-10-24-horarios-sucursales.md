# Horarios de atención por sucursal — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada sucursal guarda un horario semanal estructurado (con almuerzo opcional y una regla única de festivos), lo edita el super administrador y lo ve el socio y el público en la ficha, con una línea «Abierto ahora».

**Architecture:** Lógica pura y probada en `src/lib/comercios/` (validar, festivos de Colombia, estado ahora, agrupar). Una tabla `sucursal_horarios` escrita solo por `service_role` mediante una función SQL que reemplaza el horario completo en una transacción. El editor vive en `SucursalForm` (overlay del panel) y manda el horario como JSON en un campo oculto; la ficha lo pinta en servidor y una pieza de cliente pequeña añade la línea de estado, porque la ficha sale de caché.

**Tech Stack:** Next.js 16 (Server Components + server actions), Supabase (Postgres, RLS), TypeScript, Vitest, CSS Modules con tokens.

**Spec:** `docs/superpowers/specs/2026-10-24-horarios-sucursales-design.md`

## Global Constraints

- Trabajar en un worktree **fuera de OneDrive**: `C:\dev\orum-worktrees\horarios-sucursales`, rama `claude/horarios-sucursales`. Nunca dentro del directorio sincronizado.
- `pnpm` no está en el `PATH`: usar `.\node_modules\.bin\tsc.cmd --noEmit`, `.\node_modules\.bin\eslint.cmd .`, `.\node_modules\.bin\vitest.cmd run --reporter=dot`, `.\node_modules\.bin\next.cmd build`.
- Numeración de días ISO: lunes = 1 … domingo = 7; **festivos = 8**. Mismo criterio que `DIAS_SEMANA` de `dias-promocion.ts`.
- Hora **siempre** de Colombia (`America/Bogota`, UTC−5, sin horario de verano). Nunca la del navegador ni la del servidor.
- Horas en TypeScript como `'HH:MM'` (24 h); en pantalla 12 h con «a. m.» / «p. m.». La base devuelve `'HH:MM:SS'`: normalizar al leer.
- Sin horario cargado = no se muestra nada (no «Cerrado»). Fila con `abre null` = «cerrado» explícito.
- Dirección **no** se vuelve obligatoria.
- Estilos: tokens `var(--…)` en `.module.css`; sin `style={{}}` para maquetar, sin `transition: all`, sin colores literales, solo `--font-sans`/`--font-display`. El estado abierto/cerrado va con punto lleno/hueco **y** texto, nunca solo color. Objetivos táctiles ≥44 px. Campos de hora con borde `--border-control`.
- Formularios del panel: overlay, validan con `useValidacion`; el servidor valida de nuevo y decide.
- Server actions: `exigirSuperAdmin`, escriben con `createAdminClient`, sueltan `updateTag('publico')` y `revalidatePath`.
- La migración se aplica **a mano y solo con OK explícito del propietario** (es la base de producción). El código debe aguantar la base sin la tabla.
- Commits: uno por tarea, terminando con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Cierre pasada la medianoche: lunes 22:00–02:00 y es martes 01:00 → abierta; martes 03:00 → cerrada.
2. Instante UTC `2026-10-24T03:00:00Z` es **23 de octubre 22:00** en Bogotá, no el 24: el día y el festivo salen de Bogotá.
3. Festivo sin fila de festivos cargada → se rige por el día de la semana normal (decisión de este plan, ver Tarea 1).
4. Almuerzo en día cerrado, o fuera de la jornada, o con una sola hora → se rechaza con mensaje claro.
5. La base sin la tabla `sucursal_horarios`: la ficha pública, la del socio y el formulario de sucursal siguen funcionando sin horario.

---

### Task 1: Festivos de Colombia

**Files:**
- Create: `src/lib/comercios/festivos-colombia.ts`
- Test: `src/lib/comercios/festivos-colombia.test.ts`

**Interfaces:**
- Produces: `festivosColombia(anio: number): string[]` (fechas civiles `'YYYY-MM-DD'`, ordenadas) y `esFestivoColombia(fecha: string): boolean`.

- [ ] **Step 1: Write the failing tests** — `festivosColombia(2026)` es exactamente: `2026-01-01, 01-12, 03-23, 04-02, 04-03, 05-01, 05-18, 06-08, 06-15, 06-29, 07-20, 08-07, 08-17, 10-12, 11-02, 11-16, 12-08, 12-25` (18). `festivosColombia(2027)` contiene `2027-03-25` y `2027-03-26` (Pascua el 28 de marzo). `esFestivoColombia('2026-12-24')` es `false`; `esFestivoColombia('2026-04-03')` es `true`.
- [ ] **Step 2: Run** `.\node_modules\.bin\vitest.cmd run src/lib/comercios/festivos-colombia.test.ts` → FAIL (módulo no existe).
- [ ] **Step 3: Implement** con fechas civiles en UTC (`Date.UTC`, ver CLAUDE.md → «Fechas»). Reglas: fijos 1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic · trasladados al **lunes siguiente** (si ya es lunes, se quedan) 6 ene, 19 mar, 29 jun, 15 ago, 12 oct, 1 nov, 11 nov · por Pascua: Jueves Santo (−3) y Viernes Santo (−2) sin trasladar; Ascensión (+39), Corpus Christi (+60) y Sagrado Corazón (+68) trasladados al lunes siguiente. Pascua por el algoritmo gregoriano anónimo.
- [ ] **Step 4: Run** el mismo comando → PASS.
- [ ] **Step 5: Commit** `feat(horarios): festivos de Colombia calculados por código`.

---

### Task 2: Lógica del horario

**Files:**
- Create: `src/lib/comercios/horario.ts`
- Test: `src/lib/comercios/horario.test.ts`

**Interfaces:**
- Consumes: `esFestivoColombia` (Task 1), `DIAS_SEMANA` de `dias-promocion.ts`.
- Produces (todo exportado desde `horario.ts`):
  - `type DiaHorario = { dia: number; abre: string | null; cierra: string | null; almuerzoDesde: string | null; almuerzoHasta: string | null }` (`dia` 1–8)
  - `type HorarioSucursal = DiaHorario[]` (vacío = sin horario)
  - `const DIA_FESTIVOS = 8`
  - `normalizarHora(valor: string | null | undefined): string | null` — `'08:00:00'` → `'08:00'`; inválido → `null`
  - `validarHorario(filas: readonly DiaHorario[]): string | null` — primer error en español o `null`
  - `type EstadoHorario = { tipo: 'abierto' | 'almuerzo' | 'cerrado' | 'sin_horario'; proximo: { cuando: 'hoy' | 'manana' | number; hora: string } | null }` (`number` = día ISO)
  - `estadoAhora(horario: HorarioSucursal, instante: Date): EstadoHorario`
  - `type GrupoHorario = { dias: number[]; fila: DiaHorario }`
  - `resumenHorario(horario: HorarioSucursal): { grupos: GrupoHorario[]; festivos: DiaHorario | null }` — agrupa días **consecutivos** con jornada y almuerzo idénticos
  - `formatearHora(hhmm: string): string` — `'18:00'` → `'6:00 p. m.'`, `'00:00'` → `'12:00 a. m.'`
  - `textoGrupo(g: GrupoHorario): string` — `'Lun–vie · 9:00 a. m. – 6:00 p. m.'`, `'Sáb · Cerrado'`; con almuerzo añade `' · Almuerzo 12:00 p. m. – 1:00 p. m.'`

- [ ] **Step 1: Write the failing tests** (nombres y aserciones):
  - `validarHorario` acepta `abre 09:00 cierra 18:00 almuerzo 12:00–13:00`; **rechaza** almuerzo con una sola hora, almuerzo en día con `abre null`, almuerzo fuera de la jornada, `abre === cierra`, hora mal formada (`'25:00'`), `dia` fuera de 1–8, días repetidos. **Acepta** `abre 22:00 cierra 02:00` (pasada la medianoche) y «24 horas» como `abre '00:00' cierra '23:59'`.
  - `estadoAhora` con lunes–viernes 09:00–18:00 y almuerzo 12:00–13:00: lunes 10:00 Bogotá → `abierto` con `proximo {cuando:'hoy', hora:'12:00'}`; lunes 12:30 → `almuerzo` con `proximo {hoy,'13:00'}`; lunes 19:00 → `cerrado` con `proximo {cuando:'manana', hora:'09:00'}`; sábado 10:00 → `cerrado`, `proximo {cuando:1, hora:'09:00'}`; horario vacío → `sin_horario`.
  - Medianoche: lunes `22:00–02:00`; martes 01:00 → `abierto` (`proximo {hoy,'02:00'}`); martes 03:00 → `cerrado`.
  - Zona: `new Date('2026-10-24T03:00:00Z')` se evalúa como viernes 23 de octubre 22:00.
  - Festivos: con fila 8 `abre 10:00 cierra 16:00`, el **lunes 2026-05-18 (festivo)** a las 17:00 → `cerrado`, aunque el lunes normal cierre a las 18:00; con fila 8 `abre null` ese día → `cerrado` todo el día; **sin fila 8** el mismo festivo se rige por el lunes normal.
  - `resumenHorario`: lun–vie iguales → un grupo `dias [1,2,3,4,5]`; sábado distinto → grupo aparte; domingo sin fila → no aparece; fila 8 sale en `festivos`.
  - `formatearHora`: `'09:00'`→`'9:00 a. m.'`, `'12:00'`→`'12:00 p. m.'`, `'00:00'`→`'12:00 a. m.'`, `'23:59'`→`'11:59 p. m.'`. `normalizarHora('08:00:00')`→`'08:00'`, `normalizarHora('x')`→`null`.
- [ ] **Step 2: Run** `.\node_modules\.bin\vitest.cmd run src/lib/comercios/horario.test.ts` → FAIL.
- [ ] **Step 3: Implement** en `horario.ts`. Una jornada con `cierra <= abre` termina el día siguiente. Para el instante: convertir a fecha y minutos de Bogotá (`Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`). Para saber si «ahora» está abierto, mirar la jornada de hoy **y** la de ayer si esta pasa de medianoche. La fila aplicable a una fecha civil es la 8 si `esFestivoColombia(fecha)` y existe esa fila; si no, la del día ISO. `proximo`: buscar el siguiente cambio (apertura, inicio/fin de almuerzo, cierre) hasta 8 días adelante.
- [ ] **Step 4: Run** → PASS; luego `.\node_modules\.bin\tsc.cmd --noEmit`.
- [ ] **Step 5: Commit** `feat(horarios): lógica pura del horario de una sucursal`.

---

### Task 3: Base de datos

**Files:**
- Create: `supabase/migrations/20261024120000_sucursal_horarios.sql`
- Create: `supabase/verificacion/sucursal_horarios_verificacion.sql`
- Modify: `src/lib/supabase/database.types.ts` (añadir `sucursal_horarios` y el RPC, junto a `sucursales`, ~línea 429)

**Interfaces:**
- Produces: tabla `public.sucursal_horarios(sucursal_id bigint, dia smallint, abre time, cierra time, almuerzo_desde time, almuerzo_hasta time)` y función `public.reemplazar_horario_sucursal(p_sucursal_id bigint, p_filas jsonb, p_actor uuid default null) returns void`. `p_filas` = `[{ "dia": 1, "abre": "09:00", "cierra": "18:00", "almuerzo_desde": "12:00"|null, "almuerzo_hasta": "13:00"|null }, …]`.

- [ ] **Step 1: Escribir la migración** siguiendo el patrón de `20261021130000_comercio_categorias.sql`: PK `(sucursal_id, dia)`, FK `on delete cascade` a `sucursales`; RLS activada, `revoke all` a `anon, authenticated`, `grant select` a `authenticated` con política que solo deja ver filas de sucursales activas de comercios activos (la ficha del socio lee con su sesión). CHECKs: `dia between 1 and 8`; `abre` y `cierra` ambos o ninguno; almuerzo ambos o ninguno y solo con `abre` no nulo; `abre <> cierra`. Trigger de validación: el almuerzo cae dentro de la jornada (considerando cierre pasada la medianoche). Función `reemplazar_horario_sucursal`: `security definer`, `set search_path = public`, borra e inserta en una transacción, `raise exception` si `p_filas` no es arreglo de ≤ 8, y **toca `sucursales.updated_by = p_actor`** para que la bitácora anote la edición (verificar que el trigger de auditoría de `sucursales` genera su fila). `revoke execute … from public, anon, authenticated; grant execute … to service_role`.
- [ ] **Step 2: Escribir el script de verificación** (patrón de `resenas_verificacion.sql`, con rollback): rechaza almuerzo huérfano, almuerzo fuera de jornada, `dia = 9`; acepta cierre `02:00`; `anon` no puede insertar; el RPC reemplaza (no acumula); aparece una fila en `bitacora_actividad`.
- [ ] **Step 3: Actualizar `database.types.ts`** con la tabla y la función a mano (mismo estilo que el resto del archivo).
- [ ] **Step 4: `.\node_modules\.bin\tsc.cmd --noEmit`** → sin errores.
- [ ] **Step 5: PARAR y pedir OK al propietario** antes de aplicar la migración a la base de producción (`mcp__supabase__apply_migration`). Con OK: aplicarla, ejecutar el script de verificación y confirmar `get_advisors` sin avisos nuevos de seguridad.
- [ ] **Step 6: Commit** `feat(horarios): tabla sucursal_horarios y función de reemplazo`.

---

### Task 4: Guardar el horario (acciones del admin)

**Files:**
- Create: `src/lib/comercios/horario-formulario.ts`, `src/lib/comercios/horario-formulario.test.ts`
- Create: `src/lib/comercios/horario-datos.ts`
- Modify: `src/app/admin/comercios/sucursales-actions.ts` (`crearSucursal`, `editarSucursal`)

**Interfaces:**
- Consumes: `HorarioSucursal`, `validarHorario`, `normalizarHora` (Task 2); RPC de la Task 3.
- Produces:
  - `leerHorarioDelFormulario(json: string): { ok: true; horario: HorarioSucursal } | { ok: false; error: string }` — parsea el campo oculto `horario`, normaliza horas, descarta días sin datos, llama a `validarHorario`. Campo vacío o `'[]'` → `{ ok: true, horario: [] }`.
  - `leerHorarioDeSucursal(admin: ReturnType<typeof createAdminClient>, sucursalId: number): Promise<HorarioSucursal>` en `horario-datos.ts` — devuelve `[]` si la tabla no existe (error de relación) o falla; **nunca lanza**.

- [ ] **Step 1: Tests** de `leerHorarioDelFormulario`: JSON válido de 5 días → `ok`; `'[]'` y `''` → horario vacío; JSON roto → error; almuerzo fuera de jornada → error con el mensaje de `validarHorario`; horas `'09:00:00'` se normalizan a `'09:00'`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** ambos archivos. **Step 4: Run** → PASS.
- [ ] **Step 5: Modificar las acciones**: tras crear/editar la sucursal con éxito, si el campo `horario` viene en el formulario, validarlo **antes** de escribir nada y, después de guardar la sucursal, llamar `admin.rpc('reemplazar_horario_sucursal', { p_sucursal_id, p_filas, p_actor: actorId })`. En `crearSucursal` hay que recuperar el `id` insertado (`.select('id').single()`). Si el RPC falla porque falta la tabla, la sucursal ya quedó guardada: devolver `{ ok: true }` solo cuando no había horario que guardar; si lo había, devolver el error `mensajeDeError('La sucursal se guardó, pero no el horario', error)`. Horario vacío en edición = borra el horario.
- [ ] **Step 6: Run** tsc + vitest + `src/lib/bitacora/actor-en-escrituras.test.ts` (debe seguir en verde).
- [ ] **Step 7: Commit** `feat(horarios): guardar el horario desde las acciones de sucursal`.

---

### Task 5: Editor de horario en el formulario de sucursal

**Files:**
- Create: `src/app/admin/comercios/[id]/sucursales/_components/editor-horario.tsx`, `editor-horario.module.css`
- Modify: `src/app/admin/comercios/[id]/sucursales/_components/sucursal-form.tsx`
- Modify: `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx` y su gemela `src/app/admin/@modal/(.)comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`

**Interfaces:**
- Consumes: `leerHorarioDeSucursal` (Task 4), tipos y `validarHorario` (Task 2), `DIAS_SEMANA`.
- Produces: `EditorHorario({ inicial, onChange?: … }: { inicial: HorarioSucursal })` — cliente; mantiene el estado y escribe el JSON en `<input type="hidden" name="horario">`. `SucursalForm` gana la prop `horario?: HorarioSucursal`.

- [ ] **Step 1: Construir `EditorHorario`**: una fila por día (lunes–domingo) con `Switch` abierto/cerrado y dos campos de hora (`type="time"`, borde `--border-control`, ≥44 px en táctil); botón «Copiar a los días abiertos» en cada fila; `Switch` «Almuerzo» con su franja (por día, más botón «Mismo almuerzo para todos los días abiertos»); fila aparte «Festivos» con «Igual que el día / Cerrado / Abierto» y sus horas. Errores con `validarHorario` en un `Alert`/`Field` y `aria-live`. Estado inicial vacío = todos sin horario (no inventa horas).
- [ ] **Step 2: Integrar en `SucursalForm`** bajo teléfono y ciudad, en una sección «Horario» (opcional). El envío no se bloquea si el horario está vacío; sí si `validarHorario` falla.
- [ ] **Step 3: Pasar `horario`** desde las dos páginas de editar leyendo con `leerHorarioDeSucursal`. Las páginas de **nueva** (`…/sucursales/nueva` y su gemela `@modal`) no pasan nada.
- [ ] **Step 4: Verificar** tsc + eslint. **Mirarlo renderizado** con el servidor de desarrollo: abrir «Editar sucursal» desde la ficha del comercio **y** desde otro origen, comprobar `dialog[open]`, probar crear con horario, editar, vaciar, almuerzo inválido, y 390 px. Si la migración no está aplicada, el formulario debe abrir igual y mostrar el horario vacío.
- [ ] **Step 5: Commit** `feat(horarios): editor de horario en el formulario de sucursal`.

---

### Task 6: Mostrar el horario en las fichas

**Files:**
- Create: `src/components/comercios/horario-sede.tsx` (servidor: la semana), `src/components/comercios/estado-horario.tsx` (cliente: «Abierto ahora»), `src/components/comercios/horario-sede.module.css`
- Modify: `src/components/comercios/ficha-comercio.tsx` (`SedeFicha` gana `horario?: HorarioSucursal`; pintar bajo cada sede)
- Modify: `src/lib/publico/datos-publicos.ts` (`SedePublica` gana `horario`; `leerFichaPublica` ~línea 546)
- Modify: `src/app/miembros/(portal)/comercios/[id]/page.tsx` (~línea 174 y 234)
- Modify: `src/app/(publico)/explorar/[id]/page.tsx` (pasa `ficha.sedes` — comprobar que el horario llega)

**Interfaces:**
- Consumes: `resumenHorario`, `textoGrupo`, `estadoAhora`, `formatearHora`, `normalizarHora` (Task 2).
- Produces: `HorarioSede({ horario }: { horario: HorarioSucursal })` (servidor) y `EstadoHorario({ horario }: { horario: HorarioSucursal })` (cliente).

- [ ] **Step 1: Cargar los horarios** en las dos fichas con **una consulta por comercio** a `sucursal_horarios` filtrando `sucursal_id in (ids de las sedes)`, agrupada por sucursal. Si la consulta devuelve error (tabla ausente), tratarla como «sin horarios», igual que la galería. En el portal de miembros usa la sesión del socio; en la pública, `createAdminClient`.
- [ ] **Step 2: `HorarioSede`** (Server Component): lista de grupos con `textoGrupo`, el día de hoy en negrita, y los festivos al final («Festivos · Cerrado»). Nada si el horario está vacío. Sin sombra, sin borde (es texto dentro de la ficha).
- [ ] **Step 3: `EstadoHorario`** (cliente): calcula `estadoAhora(horario, new Date())` con `useSyncExternalStore` suscrito a un reloj de un minuto y `getServerSnapshot` que devuelve `null` (el servidor no pinta estado; así no hay desajuste de hidratación ni se queda viejo en la caché). Pinta punto lleno (abierto) / hueco (cerrado o almuerzo) **y** texto: «Abierto ahora · cierra a las 6:00 p. m.», «En pausa de almuerzo · reabre a la 1:00 p. m.», «Cerrado · abre mañana a las 9:00 a. m.». Sin animación.
- [ ] **Step 4: Verificar** tsc, eslint, vitest, `next build`. **Mirarlo renderizado** en la ficha pública y en la del socio (1366, 820, 390 px): comercio con horario, sin horario, con una sede y con varias, y con la tabla ausente (ficha intacta). Comprobar contraste del texto de estado y que el estado cambia sin recargar.
- [ ] **Step 5: Commit** `feat(horarios): horario y estado «abierto ahora» en las fichas`.

---

### Task 7: Cierre

**Files:**
- Modify: `CLAUDE.md` (una nota breve en «Componentes» sobre `sucursal_horarios`, `horario.ts` y que la ficha calcula el estado en cliente) y la deuda conocida (horarios no probados con sesión real).

- [ ] **Step 1: Verificación completa**: `.\node_modules\.bin\tsc.cmd --noEmit`; `.\node_modules\.bin\eslint.cmd .`; `.\node_modules\.bin\vitest.cmd run --reporter=dot`; `.\node_modules\.bin\next.cmd build` — todo verde.
- [ ] **Step 2: Recorrido a mano** de punta a punta con una sucursal real de prueba: cargar horario en el panel → verlo en la ficha pública y en la del socio → editarlo → vaciarlo. Anotar lo que no se pudo ver.
- [ ] **Step 3: Actualizar `CLAUDE.md`** y hacer el commit final `docs: horarios por sucursal`.
- [ ] **Step 4:** Avisar al propietario de lo pendiente (editar desde «Mi negocio» y fechas sueltas quedan fuera) y **no** mezclar a `main` sin su OK: hay otra sesión empujando a `main`.
