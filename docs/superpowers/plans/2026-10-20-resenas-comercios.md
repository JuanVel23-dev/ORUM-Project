# Reseñas de comercios — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Los socios que compraron en un comercio lo califican (1–5 estrellas, mensaje opcional); el comercio y el administrador ven las reseñas y responden; el administrador también las elimina.

**Architecture:** Una tabla `resenas` (una fila por socio+comercio, con las dos respuestas en la misma fila). Nadie escribe con el rol `authenticated`: todas las escrituras van por server actions con `service_role`, que derivan socio/comercio de la SESIÓN, y un trigger en la base revalida "compró aquí + membresía vigente" como última línea de defensa. Los socios leen por funciones SQL `security definer` que devuelven solo columnas seguras (nombre + inicial); el comercio y el admin leen con el cliente de administración filtrado por el comercio de la sesión / el id de la URL.

**Tech Stack:** Next.js App Router (Server Components + server actions), Supabase (Postgres + RLS), CSS Modules con los tokens v6, Vitest para funciones puras.

**Spec:** `docs/superpowers/specs/2026-10-20-resenas-comercios-design.md`

## Global Constraints

- Estrellas: enteros 1 a 5. Mensaje opcional, 1–500 caracteres si existe, sin enlaces ni marcado. Respuestas (comercio y admin): 1–500 caracteres.
- Una reseña por (comercio, socio), no por sucursal. Borrado real (sin borrado lógico); las respuestas se van con la fila.
- Solo reseña quien tiene ≥1 fila en `ventas` de una sucursal de ese comercio. Crear/editar exige membresía vigente (`derivarEstadoMembresia`: `estado='activa' and fecha_fin >= hoy`); borrar la propia, no.
- Comercio inactivo o con `deleted_at`: los socios no ven sus reseñas ni pueden escribir; comercio y admin sí las ven.
- Autor ante otros socios: "María G." (nombre + inicial del apellido). Comercio y admin ven nombre completo.
- La respuesta del admin se muestra como "ORUM". Solo `super_admin` modera/responde (igual que la ficha de comercio del panel, `requireRol('super_admin')`).
- Eliminar una reseña (admin) y responder (admin) se anotan en `bitacora_actividad`, sin el texto de la reseña. El borrado del socio no se anota.
- Promedio y conteo en vivo desde la base; nada denormalizado.
- Si la tabla no existe aún (el esquema se aplica a mano), las tres superficies ocultan la sección sin romper la página.
- UI: tokens `var(--…)` y `.module.css`, sin `style={{}}` salvo tokens dinámicos, sin trazo en superficies en reposo, `:hover` solo en `@media (hover: hover)`, `prefers-reduced-motion`, objetivos táctiles ≥ 44px, formularios en overlay (`Modal`/`Sheet`/`Overlay`), validación con `useValidacion`. Portales de usuario con `createClient()`, nunca el de administración para leer como socio.
- Rama de trabajo: worktree en `C:\dev\orum-worktrees\resenas` (nunca dentro de OneDrive, nunca en `main`). Verificación final: `.\node_modules\.bin\tsc.cmd --noEmit`, `.\node_modules\.bin\eslint.cmd .`, `.\node_modules\.bin\vitest.cmd run --reporter=dot`, `.\node_modules\.bin\next.cmd build`.

## Review Focus

1. Un socio con ventas solo en OTRO comercio intenta reseñar este (por la interfaz y por POST directo): rechazado. → Task 2 (SQL) y Task 5.
2. Mensaje de solo espacios o con `http://`/`www.`/`<`: espacios = sin mensaje; enlace o marcado = error. → Task 1.
3. Comercio sin reseñas: "Sin reseñas todavía", nunca "NaN" ni "0,0". → Task 1 (`promedio`) y Task 4.
4. Doble envío simultáneo (dos pestañas) del mismo socio: no crea duplicado ni error crudo; queda una sola fila. → Task 2 (índice único) y Task 5 (upsert).
5. Socio con membresía vencida: no crea ni edita, sí borra su reseña. → Task 2 y Task 5.
6. Apellidos vacíos o de una sola palabra, con tildes/minúsculas: `"ana"`+`""` → "Ana"; `"José"`+`"ñañez"` → "José Ñ.". → Task 1.
7. Calificación `0`, `6`, `2.5`, `"abc"`, vacía: rechazada. → Task 1.
8. Comercio retirado del club: sus reseñas desaparecen para el socio pero siguen en el portal del comercio y en el panel. → Task 2 y Tasks 5–7.

---

### Task 1: Reglas puras de reseñas

**Files:**
- Create: `src/lib/resenas/resenas.ts`
- Test: `src/lib/resenas/resenas.test.ts`

**Interfaces:**
- Consumes: nada. (Si `src/lib/aliados/solicitud-aliado.ts` ya exporta un detector de enlaces/marcado reutilizable, impórtalo en vez de duplicar la expresión.)
- Produces:
  - `ESTRELLAS_MIN = 1`, `ESTRELLAS_MAX = 5`, `MENSAJE_MAXIMO = 500`
  - `revisarEstrellas(crudo: unknown): { ok: true; estrellas: number } | { ok: false; error: string }`
  - `revisarMensaje(crudo: string): { ok: true; mensaje: string | null } | { ok: false; error: string }` (espacios colapsados salvo saltos de línea simples; vacío → `null`)
  - `revisarRespuesta(crudo: string): { ok: true; respuesta: string } | { ok: false; error: string }` (obligatoria, mismas reglas de enlaces y largo)
  - `promedio(estrellas: number[]): number | null` (`null` si vacío; redondeado a 1 decimal)
  - `formatearPromedio(valor: number | null): string` (`"4,5"` con coma; `null` → `"—"`)
  - `nombreCorto(nombres: string, apellidos: string): string`
  - `esTablaAusente(error: { code?: string } | null | undefined): boolean` (`'42P01'` o `'PGRST205'`)
  - `type ResenaVista = { id: number; estrellas: number; mensaje: string | null; autor: string; creadaEn: string; respuestaComercio: string | null; respuestaAdmin: string | null }`

- [ ] **Step 1: Write the failing tests** in `resenas.test.ts`, one `it` per Review Focus line 2, 3, 6, 7 plus: `revisarEstrellas(5)` ok, `revisarEstrellas('3')` → 3, `revisarMensaje('  ')` → `{ok:true, mensaje:null}`, `revisarMensaje('a'.repeat(501))` error, `promedio([5,4])` → `4.5`, `promedio([])` → `null`, `formatearPromedio(4.5)` → `'4,5'`, `nombreCorto('maría','gómez')` → `'María G.'`, `nombreCorto('Ana','')` → `'Ana'`, `esTablaAusente({code:'42P01'})` true y `esTablaAusente({code:'23505'})` false.
- [ ] **Step 2: Run to verify failure** — `.\node_modules\.bin\vitest.cmd run src/lib/resenas` → FAIL (módulo no existe).
- [ ] **Step 3: Implement** `resenas.ts` con las firmas de arriba; comentarios en español, estilo de `src/lib/publicidad/publicidad.ts`.
- [ ] **Step 4: Run to verify pass** — mismo comando → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/resenas && git commit -m "feat(resenas): reglas puras de calificación, mensaje y nombre"` (con la línea Co-Authored-By del sistema).

---

### Task 2: Migración SQL

**Files:**
- Create: `supabase/migrations/20261020150000_resenas.sql` (idempotente; estilo y cabecera explicativa de `20261013120000_publicidad.sql`)
- Modify: `src/lib/supabase/database.types.ts` (añadir `resenas` y las dos funciones, a mano o regenerado con el MCP `generate_typescript_types`)

**Interfaces:**
- Consumes: tablas `comercios`, `miembros`, `membresias`, `ventas`, `sucursales`, `bitacora_actividad`; función `public.es_administracion()`.
- Produces (SQL):
  - Tabla `public.resenas(id bigint identity pk, comercio_id bigint not null → comercios on delete cascade, miembro_id bigint not null → miembros on delete cascade, estrellas smallint not null check 1..5, mensaje text null check (char_length(mensaje) between 1 and 500), respuesta_comercio text null (mismo check), respuesta_comercio_at timestamptz, respuesta_admin text null (mismo check), respuesta_admin_at timestamptz, created_at, updated_at timestamptz default now(), unique (comercio_id, miembro_id))`; índice por `(comercio_id, created_at desc)`.
  - RLS activo; **sin** políticas de escritura para `anon`/`authenticated`; `revoke insert, update, delete` a ambos. Política de lectura solo para `es_administracion()`. (Socios y comercios no leen la tabla directamente.)
  - Trigger `trg_resenas_validar` BEFORE INSERT OR UPDATE, `security definer`, `set search_path = public`: si cambian `estrellas` o `mensaje` (o es INSERT) exige (a) ≥1 venta del `miembro_id` en una sucursal del `comercio_id`, (b) comercio `activo` y sin `deleted_at`, (c) membresía del socio vigente; mantiene `updated_at`. Revocar `execute` de la función a `public`/`anon`/`authenticated` (patrón de `20260918091500_…`).
  - `public.resenas_resumen(p_comercio_id bigint) returns table(total int, promedio numeric)` — `security definer`, `stable`; devuelve la fila solo si el comercio está activo y no eliminado.
  - `public.resenas_de_comercio(p_comercio_id bigint) returns table(id bigint, estrellas smallint, mensaje text, autor text, created_at timestamptz, respuesta_comercio text, respuesta_admin text, es_mia boolean)` — `security definer`, mismo filtro de comercio activo; `autor` = nombre + inicial del apellido calculado en SQL; `es_mia` compara `miembros.perfil_id = auth.uid()`; orden `created_at desc`. `grant execute … to authenticated`.
  - `public.puedo_resenar(p_comercio_id bigint) returns boolean` — `security definer`, `stable`: hay venta propia en ese comercio, comercio activo y membresía vigente (la usa la interfaz para mostrar/ocultar el botón; el trigger sigue siendo la barrera).

- [ ] **Step 1: Escribir la migración** con las piezas de arriba y `comment on` en tabla y funciones explicando el porqué.
- [ ] **Step 2: Pedir permiso al usuario** para aplicarla (el esquema se aplica a mano; no usar `apply_migration` sin su OK). Con OK, aplicar con el MCP de Supabase o `supabase db push`.
- [ ] **Step 3: Verificar en SQL** (MCP `execute_sql`, dentro de una transacción con rollback o con datos de prueba que se borran después), con salida esperada en cada caso: (a) INSERT de un socio con venta en el comercio → ok; (b) INSERT de un socio sin venta ahí → excepción; (c) segundo INSERT del mismo par → violación de unicidad; (d) membresía vencida + UPDATE de `estrellas` → excepción, UPDATE de `respuesta_comercio` → ok; (e) comercio `activo=false` → `resenas_de_comercio` devuelve 0 filas; (f) `resenas_de_comercio` con 'María'/'Gómez' devuelve `autor = 'María G.'`; (g) `delete from comercios` o `miembros` borra sus reseñas en cascada.
- [ ] **Step 4: Actualizar `database.types.ts`** y correr `.\node_modules\.bin\tsc.cmd --noEmit` → sin errores.
- [ ] **Step 5: Commit** — `feat(resenas): tabla, trigger de validación y funciones de lectura`.

---

### Task 3: Capa de datos del servidor

**Files:**
- Create: `src/lib/resenas/datos.ts` (`import 'server-only'`)

**Interfaces:**
- Consumes: Task 1 (`ResenaVista`, `esTablaAusente`), Task 2 (funciones SQL, tabla), `createClient` (`@/lib/supabase/server`), `createAdminClient` (`@/lib/supabase/admin`), `obtenerMiComercio` (`@/lib/comercios/comercio-sesion`).
- Produces (todas devuelven `null` o `{ disponible: false }` si la tabla/funciones no existen; nunca lanzan por eso):
  - `obtenerResenasParaSocio(comercioId: number): Promise<{ disponible: boolean; total: number; promedio: number | null; resenas: (ResenaVista & { esMia: boolean })[] }>` — con `createClient()` y las RPC.
  - `puedoResenar(comercioId: number): Promise<boolean>` — RPC `puedo_resenar`.
  - `obtenerResenasParaComercio(): Promise<{ disponible: boolean; total: number; promedio: number | null; resenas: ResenaGestion[] }>` — cliente de administración filtrado por `obtenerMiComercio().id`, con nombre completo del autor.
  - `obtenerResenasParaAdmin(comercioId: number): Promise<` mismo formato `>` — cliente de administración; el id viene de la URL ya validada con `requireRol('super_admin')` en la página.
  - `type ResenaGestion = Omit<ResenaVista,'autor'> & { autor: string; respuestaComercioAt: string | null; respuestaAdminAt: string | null }`
  - Constante exportada `PAGINA_RESENAS = 20` (límite de la primera carga; el orden es más recientes primero; "Ver más" fuera de alcance, ver No metas ampliado abajo).

- [ ] **Step 1:** Implementar las cuatro funciones con `cache()` de React donde se repitan en un render. Lanzar a consola (no a la página) los errores distintos de tabla ausente.
- [ ] **Step 2:** `.\node_modules\.bin\tsc.cmd --noEmit` y `.\node_modules\.bin\eslint.cmd src/lib/resenas` → limpios.
- [ ] **Step 3:** Verificar a mano con una consulta contra la base real ya migrada (script temporal en el scratchpad, no commiteado) que `obtenerResenasParaSocio` devuelve lo mismo que `resenas_de_comercio`.
- [ ] **Step 4: Commit** — `feat(resenas): consultas del servidor para socio, comercio y admin`.

---

### Task 4: Componente de estrellas

**Files:**
- Create: `src/components/ui/estrellas.tsx`, `src/components/ui/estrellas.module.css`
- Modify: `src/app/dev/ui/…` (la página de catálogo de `/dev/ui`, si existe, añade un ejemplo; si no, omitir)

**Interfaces:**
- Consumes: tokens de `src/styles/tokens.css`.
- Produces:
  - `<EstrellasLectura valor={number | null} total?: number tamano?: 'sm' | 'md' />` — muestra estrellas llenas/medias/vacías con `aria-label` "4,5 de 5 estrellas" (o "Sin calificaciones"); el color nunca es el único portador (forma llena vs. hueca).
  - `<EstrellasSelector name="estrellas" valorInicial?: number onChange?(v: number): void />` — grupo `radiogroup` de 5 radios con teclado (flechas), objetivos ≥ 44px (`::after`), foco visible 2px, `aria-label` por opción ("3 estrellas"); el valor viaja en un `<input type="hidden" name>` o los propios radios.
  - Estrella llena en `--gold-600` sobre claro (la fachada de miembros fija tema claro; `--gold-500` como letra/ícono sobre claro está prohibido); vacía en `--border-control`.

- [ ] **Step 1:** Implementar ambos componentes con la forma de la estrella por SVG inline (sin librería nueva); transiciones solo `transform`/`opacity`, sin rebote; `prefers-reduced-motion` respetado.
- [ ] **Step 2:** Verificar renderizado en el navegador (Playwright MCP o `pnpm dev`) a 390 y 1280 px, con teclado, y con `prefers-reduced-motion`. Capturar y mirar.
- [ ] **Step 3:** `tsc` y `eslint` limpios.
- [ ] **Step 4: Commit** — `feat(ui): estrellas de lectura y selector`.

---

### Task 5: Socio — ficha, formulario y acciones

**Files:**
- Create: `src/app/miembros/(portal)/comercios/resenas-actions.ts`, `src/components/resenas/seccion-resenas.tsx`, `src/components/resenas/seccion-resenas.module.css`, `src/components/resenas/formulario-resena.tsx`
- Modify: `src/components/comercios/ficha-comercio.tsx` (añadir prop opcional `resenas?: ReactNode`, pintada tras la información principal, solo la usa la superficie de miembros), `src/app/miembros/(portal)/comercios/[id]/page.tsx` (cargar datos con Task 3 y pasar `<SeccionResenas …/>`)

**Interfaces:**
- Consumes: Tasks 1, 3, 4; `requireMiembroVigente` (`@/lib/miembros/requerir-miembro`); `Modal`/`Overlay`, `useValidacion`, `Field`, `Textarea`, `Button`, `EmptyState`.
- Produces:
  - `guardarResena(_prev: ResenaState, formData: FormData): Promise<ResenaState>` con `ResenaState = { error?: string; ok?: boolean }` — campos `comercio_id`, `estrellas`, `mensaje`. El `miembro_id` sale de la sesión (`requireMiembroVigente`), nunca del formulario. Hace `upsert` por `(comercio_id, miembro_id)` con el cliente de administración; el error del trigger (sin compra, membresía vencida) se traduce a un mensaje en español. Termina con `revalidatePath('/miembros/comercios/' + id)`.
  - `borrarMiResena(_prev: ResenaState, formData: FormData): Promise<ResenaState>` — borra por `(comercio_id, miembro_id de la sesión)`; funciona aunque la membresía esté vencida (usa un helper de sesión que no exija vigencia, p. ej. el que usa el carnet para miembros vencidos; si no existe, leer el miembro por `perfil_id`).
  - `<SeccionResenas comercioId resumen resenas puedeResenar miReseña />` — cabecera con promedio + conteo (`EstrellasLectura`), botón "Escribir reseña" / "Editar mi reseña" (si `puedeResenar`), tarjeta propia destacada con "Borrar" (confirmación en overlay), lista con la respuesta del comercio y la de "ORUM" debajo, estado vacío "Sin reseñas todavía", sin la sección si `!disponible`. Fechas en `America/Bogota`.
  - `<FormularioResena …/>` — overlay con `EstrellasSelector` (obligatorio) y `Textarea` opcional con contador de 500; reglas de `useValidacion` basadas en Task 1.

- [ ] **Step 1:** Escribir `guardarResena` y `borrarMiResena` usando `revisarEstrellas`/`revisarMensaje`; probar a mano los casos de Review Focus 1, 4 y 5 contra la base real (un POST directo con otro `comercio_id` falla en el trigger).
- [ ] **Step 2:** Construir `SeccionResenas` y `FormularioResena`; cablear en la ficha.
- [ ] **Step 3:** Verificar en navegador con un socio de prueba con compra: crear, editar, borrar, volver a crear; socio sin compra no ve el botón; 390 y 1280 px; teclado; lector de pantalla básico (`aria-live` en el resultado del formulario).
- [ ] **Step 4:** `tsc`, `eslint`, `vitest` limpios.
- [ ] **Step 5: Commit** — `feat(resenas): reseñas en la ficha del socio`.

---

### Task 6: Comercio — ver y responder

**Files:**
- Create: `src/app/comercios/(portal)/resenas-actions.ts`, `src/app/comercios/(portal)/_components/resenas-comercio.tsx`, `src/app/comercios/(portal)/_components/resenas-comercio.module.css`
- Modify: `src/app/comercios/(portal)/page.tsx` (montar la sección; el portal tiene un solo destino, así que va como tarjeta debajo de las existentes con el estilo de `.tarjeta` de `verificar.module.css`)

**Interfaces:**
- Consumes: Tasks 1, 3, 4; `obtenerMiComercio`; `Textarea`, `Button`, `Modal`.
- Produces:
  - `responderResena(_prev: ResenaState, formData: FormData): Promise<ResenaState>` — campos `resena_id`, `respuesta`. Toma el comercio de `obtenerMiComercio()` (sesión) y actualiza `respuesta_comercio`/`respuesta_comercio_at` con `.eq('id', resena_id).eq('comercio_id', mi.id)`; si no afecta ninguna fila → error "No se encontró la reseña". Una respuesta vacía no se guarda aquí.
  - `quitarMiRespuesta(_prev, formData)` — pone ambas columnas en `null` con el mismo filtro.
  - `<ResenasComercio …/>` — promedio, conteo y lista (autor completo, fecha, estrellas, mensaje) con "Responder / Editar respuesta / Quitar" en un overlay; sin botón de borrar reseña.

- [ ] **Step 1:** Implementar acciones; verificar que responder una reseña de otro comercio (id manipulado) no cambia nada.
- [ ] **Step 2:** Implementar la sección y montarla; comprobar que un comercio retirado del club sigue viendo sus reseñas.
- [ ] **Step 3:** Verificar en navegador (comercio de prueba): responder, editar, quitar; 390 y 1366 px. La página de comercios no se había visto con sesión real (Deuda #4 de `CLAUDE.md`): si no hay credenciales, probar la acción con un script contra la base y la UI en `/dev`.
- [ ] **Step 4:** `tsc`, `eslint`, `vitest`.
- [ ] **Step 5: Commit** — `feat(resenas): reseñas y respuestas en el portal del comercio`.

---

### Task 7: Administración — ver, eliminar y responder

**Files:**
- Create: `src/app/admin/comercios/resenas-actions.ts`, `src/app/admin/comercios/[id]/_components/resenas-admin.tsx`, `src/app/admin/comercios/[id]/_components/resenas-admin.module.css` (o la carpeta de componentes que use la ficha; ajustar al patrón de `imagenes/_components`)
- Modify: `src/app/admin/comercios/[id]/page.tsx` (añadir `'resenas'` a `PARTES`, una `Pestanas` más con recuento, y render de la parte)

**Interfaces:**
- Consumes: Tasks 1, 3, 4; `getPerfilActual`/patrón `exigirSuperAdmin` de `promociones-actions.ts`; `createAdminClient`; `Pestanas`, `DataList`/lista, `Modal`.
- Produces:
  - `eliminarResena(_prev, formData)` — campo `resena_id`, `comercio_id`; solo `super_admin`; `delete` por `id` Y `comercio_id`; inserta en `bitacora_actividad` `{ actor_id, accion: 'eliminar', entidad: 'resena', entidad_id: resena_id, datos_anteriores: { comercio_id } }` (sin el texto). Antes verificar en `bitacora_actividad` que no haya `check` sobre `accion`/`entidad` que lo rechace; si lo hay, ampliar la migración de Task 2 en un archivo nuevo.
  - `responderComoAdmin(_prev, formData)` y `quitarRespuestaAdmin(_prev, formData)` — escriben `respuesta_admin`/`respuesta_admin_at`; responder también se anota en bitácora (`accion: 'responder'`, mismos campos).
  - `<ResenasAdmin …/>` — lista por comercio con autor completo, fecha, estrellas, mensaje, ambas respuestas, y acciones "Responder", "Eliminar" (confirmación en overlay que dice que no se puede deshacer).
  - Todas terminan con `revalidatePath('/admin/comercios/' + id)`.

- [ ] **Step 1:** Implementar acciones; comprobar en la base que quedan filas en `bitacora_actividad` y que no contienen el texto.
- [ ] **Step 2:** Añadir la pestaña y la lista; verificar que un `empleado` no puede ejecutar las acciones (la página ya exige `super_admin`, pero probar la acción directa).
- [ ] **Step 3:** Verificar en navegador a 1280 y 390 px con datos de prueba; revisar que `/admin/bitacora` muestra los eventos sin romper su resumen (`resumirEventoBitacora` cae a "Evento: …"; añadir un caso legible para `eliminar`/`responder` de `resena` solo si ese listado ya trata otras entidades).
- [ ] **Step 4:** `tsc`, `eslint`, `vitest`.
- [ ] **Step 5: Commit** — `feat(resenas): moderación y respuesta desde el panel`.

---

### Task 8: Cierre y documentación

**Files:**
- Modify: `CLAUDE.md` (una nota breve en "Componentes" o en la sección de portales: reseñas, dónde viven, quién escribe y que las escrituras van por `service_role` con el trigger como barrera; y los límites 1–5 / 500), `docs/ROADMAP.md` si lista funciones.

- [ ] **Step 1:** Ejecutar la verificación completa: `tsc`, `eslint .`, `vitest run`, `next build` — todos limpios.
- [ ] **Step 2:** Recorrido manual de punta a punta con tres perfiles (socio → comercio responde → admin responde → admin elimina → socio vuelve a reseñar) y registrar qué se vio y qué no (Deuda #3/#4: sin dispositivo real).
- [ ] **Step 3:** Pasar `accessibility-auditor` y `security-auditor` sobre el diff (foco: RLS, `execute` revocado, acciones sin confiar en ids del formulario, contraste de las estrellas) y aplicar lo que reporten.
- [ ] **Step 4: Commit** — `docs(resenas): nota en CLAUDE.md`. Luego `superpowers:finishing-a-development-branch`.

---

## Autorrevisión

- **Cobertura de la spec:** reseñar solo con compra (T2/T5), una por comercio y editable (T2/T5), 1–5 (T1/T2), mensaje opcional (T1), visible a socios con promedio (T3/T5), comercio ve y responde (T6), admin ve/elimina/responde y se anota (T7), nombre + inicial (T1/T2), borrado real y en cascada (T2), comercio retirado (T2/T3/T6), tabla ausente (T1/T3), promedio en vivo (T2). Sin huecos.
- **Elección mía a revisar:** solo `super_admin` modera y responde (la spec dejaba abierto "administrador o empleado"); se alinea con que la ficha de comercio del panel ya exige `super_admin`.
- **Elección mía a revisar:** la primera carga trae las 20 reseñas más recientes; paginar queda fuera de alcance salvo que el cliente lo pida.
- **Proporción:** el plan decide nombres, firmas, filtros de seguridad y pruebas; los cuerpos los escribe quien implementa.
