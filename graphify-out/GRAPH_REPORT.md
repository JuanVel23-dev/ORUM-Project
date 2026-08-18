# Graph Report - ORUM-Project  (2026-08-15)

## Corpus Check
- 160 files · ~119,050 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 847 nodes · 1463 edges · 66 communities (54 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34cf0ff0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createAdminClient
- index.ts
- database.types.ts
- devDependencies
- miembros/actions.ts
- compilerOptions
- What You Must Do When Invoked
- What You Must Do When Invoked
- metricas/page.tsx
- createClient
- Fase 2 — Miembros y Membresías (diseño)
- ORUM — Planeación y estado del proyecto
- Portal de Miembros — Plan de implementación
- Portal de Comercios — Implementation Plan
- Fase 4 — Métricas y trazabilidad (diseño)
- Fase 3 — Comercios, sucursales y promociones — Plan de implementación
- Fase 3 — Comercios, sucursales y promociones (diseño)
- Portal de Miembros (diseño)
- promocion-form.tsx
- Reorganización del proyecto: estructura de carpetas + kit de UI (diseño)
- miembros/login/actions.ts
- Fase 4 — Métricas y trazabilidad — Plan de implementación
- Global Constraints
- sucursal-form.tsx
- getPerfilActual
- Estructura de archivos
- app/login/actions.ts
- plan-form.tsx
- comercios/login/actions.ts
- graphify reference: extra exports and benchmark
- Global Constraints
- Portal de Comercios — Verificación de membresía y registro de venta
- graphify reference: extra exports and benchmark
- miembros/(portal)/page.tsx
- Global Constraints
- Reorganización — Paso 6: Bitácora y Métricas con el kit — Implementation Plan
- graphify reference: query, path, explain
- Global Constraints
- Reorganización — Paso 7: admin/layout.tsx con el kit — Implementation Plan
- graphify reference: query, path, explain
- Reorganización — Paso 2: `src/lib/` por dominio — Implementation Plan
- app/layout.tsx
- proxy.ts
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- Fase 2 — Miembros y Membresías — Implementation Plan
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- README.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify.js
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- CLAUDE.md
- .claude/CLAUDE.md
- .claude/skills/graphify/references/extraction-spec.md
- eslint.config.mjs
- next.config.ts
- .opencode/skills/graphify/references/extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `createAdminClient()` - 65 edges
2. `requireRol()` - 44 edges
3. `getPerfilActual()` - 33 edges
4. `createClient()` - 27 edges
5. `Row()` - 19 edges
6. `Portal de Miembros — Plan de implementación` - 18 edges
7. `Portal de Comercios — Implementation Plan` - 18 edges
8. `LinkButton()` - 17 edges
9. `PageHeader()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AdminLayout()` --calls--> `requireRol()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/auth/auth.ts
- `EditarMiembroForm()` --indirect_call--> `editarMiembro()`  [INFERRED]
  src/app/admin/miembros/[id]/editar/_components/editar-miembro-form.tsx → src/app/admin/miembros/actions.ts
- `MiembroForm()` --indirect_call--> `registrarMiembro()`  [INFERRED]
  src/app/admin/miembros/_components/miembro-form.tsx → src/app/admin/miembros/actions.ts
- `ComerciosLayout()` --calls--> `requireRolComercio()`  [EXTRACTED]
  src/app/comercios/(portal)/layout.tsx → src/lib/comercios/requerir-comercio.ts
- `LoginMiembroPage()` --calls--> `getPerfilActual()`  [EXTRACTED]
  src/app/miembros/login/page.tsx → src/lib/auth/auth.ts

## Import Cycles
- None detected.

## Communities (66 total, 12 thin omitted)

### Community 0 - "createAdminClient"
Cohesion: 0.06
Nodes (65): BitacoraPage(), metadata, cambiarEstadoAccesoComercio(), cambiarEstadoComercio(), crearComercio(), editarComercio(), exigirSuperAdmin(), leerCamposComercio() (+57 more)

### Community 1 - "index.ts"
Cohesion: 0.05
Nodes (45): CrearComercioState, EditarComercioState, estadoInicial, Opcion, ComercioInicial, estadoInicial, Opcion, cambiarPassword() (+37 more)

### Community 2 - "database.types.ts"
Cohesion: 0.09
Nodes (32): buscarMiembro(), BuscarMiembroState, MiembroEncontrado, registrarVenta(), RegistrarVentaState, BuscarMiembroForm(), estadoInicial, Promocion (+24 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (44): eslint, eslint-config-next, next, dependencies, next, react, react-dom, react-qr-code (+36 more)

### Community 4 - "miembros/actions.ts"
Cohesion: 0.12
Nodes (25): Admin, editarMiembro(), exigirEmpleadoOAdmin(), registrarMiembro(), renovarMembresia(), RenovarState, resolverEmpleadoId(), estadoInicial (+17 more)

### Community 5 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 7 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 8 - "metricas/page.tsx"
Cohesion: 0.16
Nodes (18): metadata, MetricasPage(), agruparMembresiasPorEmpleado(), agruparVentasPorComercio(), agruparVentasPorMiembroYComercio(), ComercioInfo, EmpleadoInfo, formatearFechaBogota() (+10 more)

### Community 9 - "createClient"
Cohesion: 0.19
Nodes (14): cerrarSesionMiembro(), MembresiaInactivaPage(), metadata, metadata, MiembrosLayout(), metadata, PerfilMiembroPage(), esMembresiaVigente() (+6 more)

### Community 10 - "Fase 2 — Miembros y Membresías (diseño)"
Cohesion: 0.11
Nodes (18): 10. Criterios de aceptación, 11. Tareas previas (antes de construir), 1. Objetivo, 2. Alcance, 3. Decisiones tomadas, 4. Modelo de datos, 5. Rutas y navegación, 6. Componente A — Planes de membresía (+10 more)

### Community 11 - "ORUM — Planeación y estado del proyecto"
Cohesion: 0.11
Nodes (18): 10. Ideas pendientes (no priorizadas), 1. Qué es ORUM, 2. Stack y arquitectura, 3. Modelo de autenticación e identidad, 4. Estado por fases, 5. Cobertura de requisitos (RF), 6. Decisiones clave (transversales), 7. Deuda técnica conocida (aceptada) (+10 more)

### Community 12 - "Portal de Miembros — Plan de implementación"
Cohesion: 0.11
Nodes (18): Global Constraints, Notas antes de empezar, Portal de Miembros — Plan de implementación, Task 10: Ruta `/miembros/login` — login por número de membresía (RF-06), Task 11: `/miembros/(portal)/layout.tsx` — guardia de rol, header y soporte persistente, Task 12: `/miembros/inactiva` — pantalla de bloqueo, Task 13: `/miembros/perfil` — perfil de solo lectura + QR (RF-07, RF-14), Task 14: `/miembros` — home con búsqueda, filtros y listado (RF-08 a RF-12) (+10 more)

### Community 13 - "Portal de Comercios — Implementation Plan"
Cohesion: 0.11
Nodes (18): Global Constraints, Portal de Comercios — Implementation Plan, Task 10: Server action `registrarVenta`, Task 11: Componente `EscanerQr`, Task 12: Componente `ResultadoMiembro`, Task 13: Componente `ConfirmarVentaForm`, Task 14: Componente `BuscarMiembroForm`, Task 15: Orquestador `VerificacionTool` + `page.tsx` (+10 more)

### Community 14 - "Fase 4 — Métricas y trazabilidad (diseño)"
Cohesion: 0.11
Nodes (18): 10. Criterios de aceptación, 11. Tareas previas (antes de construir), 1. Objetivo, 2. Punto de partida (lo que ya existe), 3. Alcance, 4. Decisiones tomadas, 5. Modelo de datos, 6. Rutas y navegación (+10 more)

### Community 15 - "Fase 3 — Comercios, sucursales y promociones — Plan de implementación"
Cohesion: 0.12
Nodes (16): Fase 3 — Comercios, sucursales y promociones — Plan de implementación, Global Constraints, Nota sobre datos semilla, Task 10: Edición de datos del comercio (`/admin/comercios/[id]/editar`), Task 11: Navegación — agregar "Comercios" al menú admin, Task 12: Reducir `/admin/usuarios` a solo empleados/administradores, Task 13: Verificación final contra los criterios de aceptación del spec, Task 1: Extender `database.types.ts` con `sucursales`, `promociones` y `tipos_beneficio` (+8 more)

### Community 16 - "Fase 3 — Comercios, sucursales y promociones (diseño)"
Cohesion: 0.12
Nodes (16): 10. Puntos transversales, 11. Criterios de aceptación, 12. Tareas previas (antes de construir), 1. Objetivo, 2. Punto de partida (lo que ya existe), 3. Alcance, 4. Decisiones tomadas, 5. Modelo de datos (+8 more)

### Community 17 - "Portal de Miembros (diseño)"
Cohesion: 0.12
Nodes (16): 10. Riesgos y mitigación, 11. Criterios de aceptación, 1. Objetivo, 2. Alcance, 3. Arquitectura de rutas, 4. Login (RF-06), 5. Seguridad de datos: RLS, 6. Reorganización de `src/lib/` (+8 more)

### Community 18 - "promocion-form.tsx"
Cohesion: 0.23
Nodes (12): estadoInicial, PromocionInicial, TipoOpcion, TIPOS_SIN_VALOR, cambiarEstadoPromocion(), crearPromocion(), editarPromocion(), exigirSuperAdmin() (+4 more)

### Community 19 - "Reorganización del proyecto: estructura de carpetas + kit de UI (diseño)"
Cohesion: 0.13
Nodes (14): 10. Criterios de aceptación, 11. Tareas previas (antes de construir), 1. Objetivo, 2. Alcance, 3. Kit de componentes — `src/components/ui/`, 4.1 Mapeo completo (todas las entidades), 4.2 Naming pass, 4. Convención de carpetas por ruta (+6 more)

### Community 20 - "miembros/login/actions.ts"
Cohesion: 0.26
Nodes (8): iniciarSesionMiembro(), LoginMiembroState, estadoInicial, LoginMiembroForm(), LoginMiembroPage(), MENSAJES, metadata, resolverCorreoPorNumeroMembresia()

### Community 21 - "Fase 4 — Métricas y trazabilidad — Plan de implementación"
Cohesion: 0.18
Nodes (11): Fase 4 — Métricas y trazabilidad — Plan de implementación, Global Constraints, Task 1: Extender `database.types.ts` con `bitacora_actividad` y `ventas`, Task 2: `src/lib/bitacora.ts` — resumen legible + escritura de eventos, Task 3: `src/lib/metricas.ts` — funciones puras de agregación, Task 4: Instrumentar `miembros/actions.ts` con `registrarActividad`, Task 5: Sección "Historial de actividad" en la ficha del miembro, Task 6: Listado global `/admin/bitacora` (+3 more)

### Community 22 - "Global Constraints"
Cohesion: 0.18
Nodes (10): Acceptance check (maps to spec §10, comercios-module slice), Global Constraints, Next steps, Reorganización — Paso 3: Kit de UI + módulo comercios — Implementation Plan, Task 1: Build the UI kit (`src/components/ui/`), Task 2: Migrate `comercios` listing + create form, Task 3: Migrate `comercios/[id]/editar`, Task 4: Migrate `comercios/[id]/sucursales` (+2 more)

### Community 23 - "sucursal-form.tsx"
Cohesion: 0.33
Nodes (9): estadoInicial, Opcion, SucursalInicial, cambiarEstadoSucursal(), crearSucursal(), editarSucursal(), exigirSuperAdmin(), leerCamposSucursal() (+1 more)

### Community 24 - "getPerfilActual"
Cohesion: 0.24
Nodes (8): AdminInicioPage(), LoginComercioPage(), MENSAJES, metadata, LoginPage(), MENSAJES, metadata, getPerfilActual()

### Community 25 - "Estructura de archivos"
Cohesion: 0.20
Nodes (10): Estructura de archivos, Task 1: Setup de BD (enums, restricciones) y tipos de TypeScript, Task 2: Funciones puras de membresía + Vitest, Task 3: Extraer `generarPassword` a un módulo compartido (DRY), Task 4: Planes — Server Actions, Task 5: Planes — Páginas (lista, nuevo, editar) y enlace de menú, Task 6: Miembros — Action `registrarMiembro`, Task 7: Miembros — Registro (formulario + página) y lista/búsqueda (+2 more)

### Community 26 - "app/login/actions.ts"
Cohesion: 0.29
Nodes (7): AdminLayout(), metadata, cerrarSesion(), iniciarSesion(), LoginState, estadoInicial, LoginForm()

### Community 27 - "plan-form.tsx"
Cohesion: 0.38
Nodes (8): cambiarEstadoPlan(), crearPlan(), editarPlan(), exigirSuperAdmin(), leerCampos(), PlanState, estadoInicial, PlanInicial

### Community 28 - "comercios/login/actions.ts"
Cohesion: 0.29
Nodes (7): cerrarSesionComercio(), iniciarSesionComercio(), LoginComercioState, estadoInicial, LoginComercioForm(), ComerciosLayout(), metadata

### Community 29 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 30 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Acceptance check (maps to spec §10, planes/usuarios/cuenta slice), Global Constraints, Next steps, Reorganización — Paso 5: Planes, Usuarios, Cuenta con el kit — Implementation Plan, Task 1: Migrate `planes`, Task 2: Migrate `usuarios` listing + create form, Task 3: Migrate `usuarios/[id]/editar` (with the naming pass), Task 4: Migrate `cuenta/password`

### Community 31 - "Portal de Comercios — Verificación de membresía y registro de venta"
Cohesion: 0.22
Nodes (8): 1. Qué es y qué no es, 2. Rutas y estructura de archivos, 3. Flujo de la pantalla principal, 4. Seguridad de datos: RLS y función RPC, 5. Manejo de errores y casos borde, 6. Testing, 7. Checklist de implementación, Portal de Comercios — Verificación de membresía y registro de venta

### Community 32 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 33 - "miembros/(portal)/page.tsx"
Cohesion: 0.31
Nodes (7): ComercioListado, FiltrosForm(), Opcion, escaparLike(), metadata, MiembrosHomePage(), primero()

### Community 35 - "Global Constraints"
Cohesion: 0.25
Nodes (7): Acceptance check (maps to spec §10, miembros-module slice), Global Constraints, Next steps, Reorganización — Paso 4: Módulo miembros con el kit — Implementation Plan, Task 1: Migrate `miembros` listing + registration form (and extend `SearchForm`), Task 2: Migrate `miembros/[id]/editar`, Task 3: Migrate the miembro ficha (`[id]/page.tsx`) + renewal form

### Community 36 - "Reorganización — Paso 6: Bitácora y Métricas con el kit — Implementation Plan"
Cohesion: 0.29
Nodes (6): Acceptance check (maps to spec §10), Global Constraints, Next steps, Reorganización — Paso 6: Bitácora y Métricas con el kit — Implementation Plan, Task 1: Migrate `bitacora/page.tsx`, Task 2: Migrate `metricas/page.tsx`

### Community 37 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 38 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Acceptance check (maps to spec §10), Global Constraints, Reorganización — Paso 1: Limpieza de la raíz del repo — Implementation Plan, Task 1: Move reference documents to `docs/referencia/` and fix live references, Task 2: Delete unused `create-next-app` scaffold SVGs

### Community 39 - "Reorganización — Paso 7: admin/layout.tsx con el kit — Implementation Plan"
Cohesion: 0.33
Nodes (5): Acceptance check (maps to spec §10 — full checklist, all steps), Global Constraints, Next steps, Reorganización — Paso 7: admin/layout.tsx con el kit — Implementation Plan, Task 1: Migrate `admin/layout.tsx`

### Community 40 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 41 - "Reorganización — Paso 2: `src/lib/` por dominio — Implementation Plan"
Cohesion: 0.40
Nodes (4): Acceptance check (maps to spec §10), Global Constraints, Reorganización — Paso 2: `src/lib/` por dominio — Implementation Plan, Task 1: Move `src/lib/*.ts` into per-domain folders and update every import site

### Community 42 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 43 - "proxy.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 44 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 45 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 46 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 47 - "Fase 2 — Miembros y Membresías — Implementation Plan"
Cohesion: 0.50
Nodes (3): Fase 2 — Miembros y Membresías — Implementation Plan, Global Constraints, Verificación final

### Community 48 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 49 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 50 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 51 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **435 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `createAdminClient` to `index.ts`, `miembros/actions.ts`, `metricas/page.tsx`, `promocion-form.tsx`, `miembros/login/actions.ts`, `sucursal-form.tsx`, `plan-form.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `getPerfilActual()` connect `getPerfilActual` to `createAdminClient`, `database.types.ts`, `miembros/actions.ts`, `createClient`, `promocion-form.tsx`, `miembros/login/actions.ts`, `sucursal-form.tsx`, `app/login/actions.ts`, `plan-form.tsx`, `comercios/login/actions.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `createAdminClient`, `index.ts`, `database.types.ts`, `miembros/(portal)/page.tsx`, `miembros/login/actions.ts`, `getPerfilActual`, `app/login/actions.ts`, `comercios/login/actions.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createAdminClient` be split into smaller, more focused modules?**
  _Cohesion score 0.05542283803153368 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05472636815920398 - nodes in this community are weakly interconnected._
- **Should `database.types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08758503401360544 - nodes in this community are weakly interconnected._