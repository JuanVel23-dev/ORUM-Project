# Graph Report - ORUM-Project  (2026-09-18)

## Corpus Check
- 311 files · ~456,923 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1949 nodes · 3631 edges · 153 communities (135 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56bb4bdb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ui/layout.tsx
- editar-comercio-form.tsx
- confirmar-venta-form.tsx
- devDependencies
- miembros/[id]/page.tsx
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
- getPerfilActual
- Fase 4 — Métricas y trazabilidad — Plan de implementación
- Global Constraints
- sucursal-form.tsx
- numeros/page.tsx
- Estructura de archivos
- admin/layout.tsx
- planes/actions.ts
- comercios/[id]/page.tsx
- graphify reference: extra exports and benchmark
- Global Constraints
- Portal de Comercios — Verificación de membresía y registro de venta
- graphify reference: extra exports and benchmark
- input.tsx
- Global Constraints
- Reorganización — Paso 6: Bitácora y Métricas con el kit — Implementation Plan
- graphify reference: query, path, explain
- Global Constraints
- Reorganización — Paso 7: admin/layout.tsx con el kit — Implementation Plan
- graphify reference: query, path, explain
- Reorganización — Paso 2: `src/lib/` por dominio — Implementation Plan
- theme-provider.tsx
- proxy.ts
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- validate-coverage-ledger.cjs
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- validate-findings.cjs
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify.js
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- gallery.tsx
- .claude/CLAUDE.md
- .claude/skills/graphify/references/extraction-spec.md
- eslint.config.mjs
- next.config.ts
- .opencode/skills/graphify/references/extraction-spec.md
- bitacora/page.tsx
- createAdminClient
- app-shell.tsx
- Verificación OWASP — estado de `BACKEND-PENDIENTE.md`
- Los 20 puntos
- miembros/page.tsx
- motion.ts
- Reporte de pruebas — Recorrido de los 3 portales + fix F1
- auth.ts
- ORUM — Reglas de diseño e interfaz
- Stack
- usuario-form.tsx
- Security Audit
- password-form.tsx
- miembros/actions.ts
- dependencies
- field.tsx
- correo.ts
- Strix Cloud (managed, no local infra)
- instalar-app.tsx
- Pendientes de backend
- Auditoría de la Fase G — accesibilidad, movimiento y rendimiento
- buscar-miembro-form.tsx
- miembros/(portal)/layout.tsx
- Correo por SMTP de Gmail y recuperación de contraseña (diseño)
- comercio-form.tsx
- miembros/nuevo/page.tsx
- comercios/(portal)/page.tsx
- toast.tsx
- FASE E — Portal de Administración
- penetration-testing-with-strix/SKILL.md
- Client-Side and Browser Hunting
- Cloud and Deployment Hunting
- Memory Safety, Binary, and Kernel Hunting
- FASE B — Primitivas de UI
- File Structure
- AI, LLM, and Agent Hunting
- Desktop, Mobile, and Local IPC Hunting
- Vulnerability Hunting
- Protocols, RPC, and Messaging Hunting
- Resource Exhaustion and Availability Hunting
- Validation, Structured Output, Verification, and Reporting
- HTTP-Protocol and Authentication Hunting
- ORUM
- overlay.tsx
- button.tsx
- ATTACK-CLASSES.md
- Data Isolation and Lifecycle Hunting
- Supply Chain and Release Hunting
- ORUM — Rediseño visual completo: sistema de diseño, movimiento y PWA
- 2. Sistema de color
- Correo de bienvenida con credenciales
- comercio-card.tsx
- 2026-08-05-rediseno-visual-plan.md
- Global Constraints
- database.types.ts
- ci-security-scanning-with-strix/SKILL.md
- Find security vulnerabilities in code
- Herramientas y dependencias
- FASE G — Auditoría y pulido
- 5. Movimiento — el núcleo de la sensación Apple
- package.json
- copiar.tsx
- Security-test an API
- Application security testing
- Fix Strix findings and verify
- Test against the OWASP Top 10
- Pentest a web application
- FASE C — App Shell y navegación
- 2.8 Mapa de estados de ORUM
- 6. Navegación y arquitectura de pantalla
- scripts
- Reconnaissance
- FASE A — Fundaciones
- FASE F — PWA
- 4. Espacio, forma y profundidad
- 9. Decisiones técnicas
- 8. PWA — instalable y persistente en el móvil
- apple-icon.tsx
- 3. Tipografía
- regions
- next
- @supabase/ssr
- @yudiel/react-qr-scanner
- sw.js

## God Nodes (most connected - your core abstractions)
1. `createAdminClient()` - 98 edges
2. `requireRol()` - 82 edges
3. `Button()` - 41 edges
4. `getPerfilActual()` - 34 edges
5. `PageHeader()` - 31 edges
6. `createClient()` - 31 edges
7. `Input()` - 26 edges
8. `useCerrarOverlay()` - 22 edges
9. `Stack()` - 21 edges
10. `Los 20 puntos` - 21 edges

## Surprising Connections (you probably didn't know these)
- `CargarRangoInterceptado()` --calls--> `requireRol()`  [EXTRACTED]
  src/app/admin/@modal/(.)miembros/numeros/cargar/page.tsx → src/lib/auth/auth.ts
- `NuevoUsuarioInterceptado()` --calls--> `requireRol()`  [EXTRACTED]
  src/app/admin/@modal/(.)usuarios/nuevo/page.tsx → src/lib/auth/auth.ts
- `EditarComercioForm()` --indirect_call--> `editarComercio()`  [INFERRED]
  src/app/admin/comercios/[id]/editar/_components/editar-comercio-form.tsx → src/app/admin/comercios/actions.ts
- `AdminLayout()` --calls--> `requireRol()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/auth/auth.ts
- `RenovarForm()` --indirect_call--> `renovarMembresia()`  [INFERRED]
  src/app/admin/miembros/[id]/_components/renovar-form.tsx → src/app/admin/miembros/actions.ts

## Import Cycles
- None detected.

## Communities (153 total, 18 thin omitted)

### Community 0 - "ui/layout.tsx"
Cohesion: 0.09
Nodes (25): EditarComercioPage(), metadata, EditarSucursalPage(), metadata, metadata, EditarMiembroPage(), metadata, CargarRangoPage() (+17 more)

### Community 1 - "editar-comercio-form.tsx"
Cohesion: 0.21
Nodes (12): EditarComercioState, ComercioInicial, EditarComercioForm(), estadoInicial, Opcion, EditarMiembroState, EditarMiembroForm(), estadoInicial (+4 more)

### Community 2 - "confirmar-venta-form.tsx"
Cohesion: 0.31
Nodes (10): registrarVenta(), RegistrarVentaState, ConfirmarVentaForm(), estadoInicial, PESOS, Promocion, Sucursal, calcularDescuento() (+2 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, supabase, @types/node, @types/nodemailer (+11 more)

### Community 4 - "miembros/[id]/page.tsx"
Cohesion: 0.13
Nodes (17): COLUMNAS_ACTIVIDAD, ETIQUETA_ACCION, EventoFicha, FichaMiembroPage(), formatearFecha(), formatearPrecio(), hoyISO(), metadata (+9 more)

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
Cohesion: 0.12
Nodes (25): BitacoraPage(), COL_COMERCIO, COL_EMPLEADO, COL_USO, FECHA_LARGA, fechaLegible(), metadata, MetricasPage() (+17 more)

### Community 9 - "createClient"
Cohesion: 0.16
Nodes (19): FiltrosForm(), MembresiaInactivaPage(), metadata, MiembrosLayout(), escaparLike(), metadata, MiembrosHomePage(), primero() (+11 more)

### Community 10 - "Fase 2 — Miembros y Membresías (diseño)"
Cohesion: 0.11
Nodes (18): 10. Criterios de aceptación, 11. Tareas previas (antes de construir), 1. Objetivo, 2. Alcance, 3. Decisiones tomadas, 4. Modelo de datos, 5. Rutas y navegación, 6. Componente A — Planes de membresía (+10 more)

### Community 11 - "ORUM — Planeación y estado del proyecto"
Cohesion: 0.11
Nodes (18): 1. Qué es ORUM, 2. Stack y arquitectura, 3. Modelo de autenticación e identidad, 4. Estado por fases, 5. Cobertura de requisitos (RF), 6. Decisiones clave (transversales), 7. Deuda técnica conocida (aceptada), 8. Cómo retomar el proyecto en otra máquina (+10 more)

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
Cohesion: 0.21
Nodes (13): estadoInicial, PromocionInicial, TipoOpcion, TIPOS_SIN_VALOR, cambiarEstadoPromocion(), crearPromocion(), editarPromocion(), exigirSuperAdmin() (+5 more)

### Community 19 - "Reorganización del proyecto: estructura de carpetas + kit de UI (diseño)"
Cohesion: 0.13
Nodes (14): 10. Criterios de aceptación, 11. Tareas previas (antes de construir), 1. Objetivo, 2. Alcance, 3. Kit de componentes — `src/components/ui/`, 4.1 Mapeo completo (todas las entidades), 4.2 Naming pass, 4. Convención de carpetas por ruta (+6 more)

### Community 20 - "getPerfilActual"
Cohesion: 0.05
Nodes (55): ActivarForm(), activar(), DESTINO_POR_ROL, Estado, Admin, cargarRangoNumeros(), CargarRangoState, eliminarNumeroRegistro() (+47 more)

### Community 21 - "Fase 4 — Métricas y trazabilidad — Plan de implementación"
Cohesion: 0.18
Nodes (11): Fase 4 — Métricas y trazabilidad — Plan de implementación, Global Constraints, Task 1: Extender `database.types.ts` con `bitacora_actividad` y `ventas`, Task 2: `src/lib/bitacora.ts` — resumen legible + escritura de eventos, Task 3: `src/lib/metricas.ts` — funciones puras de agregación, Task 4: Instrumentar `miembros/actions.ts` con `registrarActividad`, Task 5: Sección "Historial de actividad" en la ficha del miembro, Task 6: Listado global `/admin/bitacora` (+3 more)

### Community 22 - "Global Constraints"
Cohesion: 0.18
Nodes (10): Acceptance check (maps to spec §10, comercios-module slice), Global Constraints, Next steps, Reorganización — Paso 3: Kit de UI + módulo comercios — Implementation Plan, Task 1: Build the UI kit (`src/components/ui/`), Task 2: Migrate `comercios` listing + create form, Task 3: Migrate `comercios/[id]/editar`, Task 4: Migrate `comercios/[id]/sucursales` (+2 more)

### Community 23 - "sucursal-form.tsx"
Cohesion: 0.19
Nodes (13): estadoInicial, Opcion, SucursalForm(), SucursalInicial, metadata, NuevaSucursalPage(), cambiarEstadoSucursal(), crearSucursal() (+5 more)

### Community 24 - "numeros/page.tsx"
Cohesion: 0.13
Nodes (16): COLUMNAS, FILTROS, metadata, normalizarFiltro(), SELLO, AdminInicioPage(), hoyISO(), metadata (+8 more)

### Community 25 - "Estructura de archivos"
Cohesion: 0.14
Nodes (13): Estructura de archivos, Fase 2 — Miembros y Membresías — Implementation Plan, Global Constraints, Task 1: Setup de BD (enums, restricciones) y tipos de TypeScript, Task 2: Funciones puras de membresía + Vitest, Task 3: Extraer `generarPassword` a un módulo compartido (DRY), Task 4: Planes — Server Actions, Task 5: Planes — Páginas (lista, nuevo, editar) y enlace de menú (+5 more)

### Community 26 - "admin/layout.tsx"
Cohesion: 0.40
Nodes (4): AdminLayout(), metadata, cerrarSesion(), RouteProgress()

### Community 27 - "planes/actions.ts"
Cohesion: 0.52
Nodes (6): cambiarEstadoPlan(), crearPlan(), editarPlan(), exigirSuperAdmin(), leerCampos(), PlanState

### Community 28 - "comercios/[id]/page.tsx"
Cohesion: 0.11
Nodes (21): metadata, Promocion, Sucursal, COLUMNAS, Fila, metadata, ComerciosLayout(), metadata (+13 more)

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

### Community 33 - "input.tsx"
Cohesion: 0.27
Nodes (9): Opcion, useField(), ComunProps, Input(), InputProps, Select(), SelectProps, Textarea() (+1 more)

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

### Community 42 - "theme-provider.tsx"
Cohesion: 0.11
Nodes (23): inter, metadata, viewport, RegistrarSW(), esModoValido(), leerModo(), leerModoEnServidor(), leerSistema() (+15 more)

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

### Community 47 - "validate-coverage-ledger.cjs"
Cohesion: 0.06
Nodes (64): ATTEMPT_FIELDS, ATTEMPT_STATUSES, canonicalCoverageId(), collectUnitErrors(), createErrorList(), encodeCanonicalRef(), escapeUnsafeDiagnosticCharacters(), fs (+56 more)

### Community 48 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 49 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 50 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 51 - "validate-findings.cjs"
Cohesion: 0.06
Nodes (55): canonicalKey(), append(), encode(), codePointLength(), collect(), collectDataLimitErrors(), collectFindingSemanticErrors(), collectSchemaErrors() (+47 more)

### Community 58 - "gallery.tsx"
Cohesion: 0.07
Nodes (24): metadata, MIEMBROS_FALSOS, ShellPreview(), COLUMNAS, Gallery(), MiembroDemo, MIEMBROS, metadata (+16 more)

### Community 66 - "bitacora/page.tsx"
Cohesion: 0.08
Nodes (27): COLUMNAS, ETIQUETA_ACCION, Evento, FECHA, HORA, metadata, TONO_ACCION, COLUMNAS (+19 more)

### Community 67 - "createAdminClient"
Cohesion: 0.13
Nodes (26): ComercioForm(), FichaComercioPage(), PromocionForm(), metadata, NuevaPromocionPage(), EditarPromocionPage(), metadata, metadata (+18 more)

### Community 68 - "app-shell.tsx"
Cohesion: 0.10
Nodes (27): GuiaInstalacionIOS(), AppShell(), Props, ShellUser, Sidebar(), TabBar(), Accion, ACCIONES (+19 more)

### Community 69 - "Verificación OWASP — estado de `BACKEND-PENDIENTE.md`"
Cohesion: 0.07
Nodes (26): 🔵 11-12. Decisiones abiertas (no son hallazgos OWASP), 🟢 13. `registrar_venta` sin validar promoción, expuesta a `authenticated` — resuelto, ⏳ 14. Protección de contraseñas filtradas desactivada — pendiente de Dashboard, 🟢 1. Dos membresías activas a la vez — resuelto, 🟢 2. RLS — ya estaba activo, no aplicaba, ⏳ 3. Sin límite de intentos de login — pendiente de Dashboard, 🟢 4. Datos de usuario sin escapar en el HTML del correo — resuelto, 🟢 5. Contraseñas en claro por correo — resuelto (+18 more)

### Community 70 - "Los 20 puntos"
Cohesion: 0.08
Nodes (25): ✅ 10. Hashear las contraseñas, ❌ 11. Limitar los intentos de login, ❌ 12. Protección antibots, ✅ 13. Parametrizar las consultas SQL, ✅ 14. Validar todos los inputs, ⚠️ 15. Escapar todo el contenido del usuario, ✅ 16. Restringir la subida de archivos, ✅ 17. Recortar las respuestas de la API (+17 more)

### Community 71 - "miembros/page.tsx"
Cohesion: 0.15
Nodes (19): buscarMiembrosAction(), COLUMNAS, metadata, MiembrosPage(), BadgeProps, ETIQUETA_MOTIVO, buscarMiembros(), hoyISO() (+11 more)

### Community 72 - "motion.ts"
Cohesion: 0.15
Nodes (17): ConfirmDialog(), ConfirmProps, Modal(), Props, Detent, Props, Sheet(), Toast() (+9 more)

### Community 73 - "Reporte de pruebas — Recorrido de los 3 portales + fix F1"
Cohesion: 0.10
Nodes (19): ⬜ B1 — Vista de miembro con membresía vencida · ⬜ SIN CREDENCIALES, Cambio hecho: fuera la pantalla de contraseña temporal, Causa raíz (en el código), Datos de prueba creados en el deployment (para limpieza), Diagnóstico y verificación del fix F1, 🟥 F1 — Los overlays interceptados no se cierran · ✅ RESUELTO, 🟧 F2 — «Mi contraseña» aparece dos veces en la misma pantalla · ⛔ ABIERTO, Fix aplicado (17 archivos, sin commitear) (+11 more)

### Community 74 - "auth.ts"
Cohesion: 0.18
Nodes (10): CargarRangoForm(), EditarComercioInterceptado(), CargarRangoInterceptado(), NuevoUsuarioInterceptado(), estadoInicial, PlanForm(), PlanInicial, UsuarioForm() (+2 more)

### Community 75 - "ORUM — Reglas de diseño e interfaz"
Cohesion: 0.11
Nodes (19): Accesibilidad: mínimos no negociables, Adaptación al ancho: `@container`, no `@media`, Antes de dar algo por hecho, Arquitectura que no cambia, Componentes: usa los que hay, Configuración de herramientas, Deuda conocida, Dónde va cada cosa (+11 more)

### Community 76 - "Stack"
Cohesion: 0.20
Nodes (8): Card(), Skeleton(), Stack(), SkeletonAccesos(), SkeletonBuscador(), SkeletonCifras(), SkeletonPageHeader(), SkeletonTabla()

### Community 77 - "usuario-form.tsx"
Cohesion: 0.16
Nodes (15): cambiarEstadoAcceso(), crearUsuario(), CrearUsuarioState, editarUsuario(), EditarUsuarioState, exigirSuperAdmin(), TIPOS_VALIDOS, TipoUsuario (+7 more)

### Community 78 - "Security Audit"
Cohesion: 0.11
Nodes (18): Anti-patterns, Core principles, Cost budget, Coverage and prior runs, Full audit planning, Full audit setup, Full audit workflow, Operating modes (+10 more)

### Community 79 - "password-form.tsx"
Cohesion: 0.18
Nodes (12): cambiarPassword(), PasswordState, CLASE_NIVEL, estadoInicial, ETIQUETA_NIVEL, PasswordForm(), Contenido(), useToast() (+4 more)

### Community 80 - "miembros/actions.ts"
Cohesion: 0.21
Nodes (15): Admin, editarMiembro(), exigirEmpleadoOAdmin(), registrarMiembro(), RegistrarMiembroState, renovarMembresia(), resolverEmpleadoId(), estadoInicial (+7 more)

### Community 81 - "dependencies"
Cohesion: 0.12
Nodes (17): lucide-react, motion, nodemailer, dependencies, lucide-react, motion, nodemailer, react (+9 more)

### Community 82 - "field.tsx"
Cohesion: 0.15
Nodes (13): RenovarState, estadoInicial, PlanOpcion, estadoInicial, Formulario(), Alert(), AlertTone, ICONO (+5 more)

### Community 83 - "correo.ts"
Cohesion: 0.19
Nodes (13): ConfigSmtp, construirCorreoInvitacion(), construirCorreoRecuperacion(), CuerpoCorreo, enviarCorreo(), enviarCorreoRecuperacion(), InputCorreo, InputCorreoInvitacion (+5 more)

### Community 84 - "Strix Cloud (managed, no local infra)"
Cohesion: 0.12
Nodes (15): 0. Credits & top-ups, 1. Register the target as an asset, 2. Launch a scan, 3. Wait for completion, 4. Read findings, 5. Export & report, 6. PR reviews, 7. Continuous testing (schedules & webhooks) (+7 more)

### Community 85 - "instalar-app.tsx"
Cohesion: 0.28
Nodes (13): avisar(), esSafariEnIOS(), esStandalone(), EventoInstalacion, lanzarInstalacion(), leerInstalable(), leerInstalableEnServidor(), oyentes (+5 more)

### Community 86 - "Pendientes de backend"
Cohesion: 0.13
Nodes (15): 10. No hay comprobante de pago, 🔵 11-12. Decisiones abiertas, 🔴 1. Se pueden crear dos membresías activas a la vez, 🔴 2. RLS sin activar en todas las tablas, 🔴 3. Sin límite de intentos de login, 🟠 4. Datos de usuario sin escapar en el HTML del correo, 🟠 5. Se envían contraseñas en claro por correo, 🟠 6. Los flujos multi-tabla no son atómicos (+7 more)

### Community 87 - "Auditoría de la Fase G — accesibilidad, movimiento y rendimiento"
Cohesion: 0.14
Nodes (13): 1. `--text-3` reprobaba AA en los DOS temas, 2. Texto blanco fijo en el botón de peligro, 3. Botones aplastados a 2px de ancho, 4. Service worker sirviendo assets obsoletos en desarrollo, Auditoría de la Fase G — accesibilidad, movimiento y rendimiento, Comprobado y correcto, Deuda conocida que sale de este rediseño, Hallazgos corregidos (+5 more)

### Community 88 - "buscar-miembro-form.tsx"
Cohesion: 0.18
Nodes (10): buscarMiembro(), BuscarMiembroState, MiembroEncontrado, BuscarMiembroForm(), EscanerQr, estadoInicial, Promocion, Sucursal (+2 more)

### Community 89 - "miembros/(portal)/layout.tsx"
Cohesion: 0.21
Nodes (11): cerrarSesionMiembro(), DESTINOS, esActivo(), PortalNav(), PortalTabBar(), metadata, ButtonSize, ButtonVariant (+3 more)

### Community 90 - "Correo por SMTP de Gmail y recuperación de contraseña (diseño)"
Cohesion: 0.15
Nodes (12): 10. Archivos afectados, 11. Verificación, 1. Objetivo, 2. Alcance, 3. Diagnóstico: por qué no redirige hoy, 4. Arquitectura: qué hace cada sistema, 5. Transporte de correo (`src/lib/correo/correo.ts`), 6. Configuración externa (checklist, fuera del código) (+4 more)

### Community 91 - "comercio-form.tsx"
Cohesion: 0.27
Nodes (10): cambiarEstadoAccesoComercio(), cambiarEstadoComercio(), crearComercio(), CrearComercioState, editarComercio(), exigirSuperAdmin(), leerCamposComercio(), estadoInicial (+2 more)

### Community 92 - "miembros/nuevo/page.tsx"
Cohesion: 0.23
Nodes (10): MiembroForm(), metadata, NuevoMiembroPage(), NumerosRegistroPage(), NuevoMiembroInterceptado(), FilaConMiembro, listarNumerosDisponibles(), listarNumerosRegistro() (+2 more)

### Community 93 - "comercios/(portal)/page.tsx"
Cohesion: 0.23
Nodes (8): Promocion, Sucursal, VerificacionTool(), ComerciosHomePage(), metadata, PerfilActual, esPromocionVigente(), requireRolComercio()

### Community 94 - "toast.tsx"
Cohesion: 0.22
Nodes (11): ICONO, ToastContext, ToastItem, ToastOptions, ToastProvider(), ToastTone, Viewport(), enCliente() (+3 more)

### Community 95 - "FASE E — Portal de Administración"
Cohesion: 0.17
Nodes (12): FASE E — Portal de Administración, Task E0: ⚠ Prerrequisito — `derivarEstadoMembresia`, Task E10: Limpieza, Task E1: `/admin` — Inicio, Task E2: `/admin/miembros` — lista, Task E3: `/admin/miembros/[id]` — ficha, Task E4: Formularios de miembros, Task E5: Comercios — lista y ficha (+4 more)

### Community 96 - "penetration-testing-with-strix/SKILL.md"
Cohesion: 0.18
Nodes (10): Exit codes (headless), Option A — Open-source CLI (self-hosted), Option B — Managed cloud (no local infra), Prerequisites, Reading results, Reporting & next steps, Run a Strix pentest, Running a scan (+2 more)

### Community 97 - "Client-Side and Browser Hunting"
Cohesion: 0.18
Nodes (10): Client-Side and Browser Hunting, Core discipline (include in every agent prompt for this domain), Cross-origin messaging and network attack classes (subagent_type: `general`), Cross-site information leak classes (subagent_type: `general`), DOM and object-state attack classes (subagent_type: `general`), Service-worker and browser-storage attack classes (subagent_type: `general`), UI-redress and navigation attack classes (subagent_type: `general`), Universal moves (apply across the above) (+2 more)

### Community 98 - "Cloud and Deployment Hunting"
Cohesion: 0.18
Nodes (10): Cloud and Deployment Hunting, Configuration and secret lifecycle attack classes (subagent_type: `general`), Container and orchestration attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), Ingress, network, and control-plane attack classes (subagent_type: `general`), Managed storage, events, and edge attack classes (subagent_type: `general`), Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here) (+2 more)

### Community 99 - "Memory Safety, Binary, and Kernel Hunting"
Cohesion: 0.18
Nodes (10): Binary loading and runtime attack classes (subagent_type: `general`), Bounds, integer, and representation attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), FFI and ABI attack classes (subagent_type: `general`), Kernel and privileged-interface attack classes (subagent_type: `general`), Lifetime, type, and concurrency attack classes (subagent_type: `general`), Memory Safety, Binary, and Kernel Hunting, Universal moves (apply across the above) (+2 more)

### Community 100 - "FASE B — Primitivas de UI"
Cohesion: 0.18
Nodes (11): FASE B — Primitivas de UI, Task B10: Galería `/dev/ui`, Task B1: Instalar `motion`, Task B2: `Button` + `Spinner`, Task B3: Campos de formulario, Task B4: Superficies, Task B5: `Badge` + `StatusBadge` + `PlanTierBadge`, Task B6: Feedback (+3 more)

### Community 101 - "File Structure"
Cohesion: 0.18
Nodes (10): Correo por SMTP de Gmail y recuperación de contraseña — Implementation Plan, File Structure, Global Constraints, Self-Review, Task 1: Transporte Nodemailer/Gmail y `enviarCorreo` genérico, Task 2: Plantilla del correo de recuperación, Task 3: URL de activación y copy por `modo` (arregla el redireccionamiento en código), Task 4: Envío de recuperación (servidor) y pantalla de miembros (+2 more)

### Community 102 - "AI, LLM, and Agent Hunting"
Cohesion: 0.20
Nodes (9): AI, LLM, and Agent Hunting, Context, retrieval, and memory attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), MCP and sub-agent trust classes (subagent_type: `general`), Output and disclosure attack classes (subagent_type: `general`), Tool and action attack classes (subagent_type: `general`), Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here) (+1 more)

### Community 103 - "Desktop, Mobile, and Local IPC Hunting"
Cohesion: 0.20
Nodes (10): Application-state and device-lifecycle attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), Deep-link, callback, and navigation attack classes (subagent_type: `general`), Desktop, Mobile, and Local IPC Hunting, Local IPC and exported-component attack classes (subagent_type: `general`), Privileged-helper and local-file attack classes (subagent_type: `general`), Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here) (+2 more)

### Community 104 - "Vulnerability Hunting"
Cohesion: 0.20
Nodes (10): Core hunting method — include in every hunter prompt, Core validation rules — include in every hunter prompt, Coverage-critic waves, Local validation boundaries, Parent consolidation and ledger update, Phase 2: Run coverage-led hunting waves, Promotion procedure — copy this promotion procedure verbatim into every hunter prompt, Required hunter prompt (+2 more)

### Community 105 - "Protocols, RPC, and Messaging Hunting"
Cohesion: 0.20
Nodes (9): Broker and queue isolation attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), Framing, schema, and interpretation attack classes (subagent_type: `general`), Protocols, RPC, and Messaging Hunting, Replay, ordering, and transaction attack classes (subagent_type: `general`), RPC identity and authorization attack classes (subagent_type: `general`), Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here) (+1 more)

### Community 106 - "Resource Exhaustion and Availability Hunting"
Cohesion: 0.20
Nodes (9): Computational amplification attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), Failure and recovery attack classes (subagent_type: `general`), Quota and scheduling attack classes (subagent_type: `general`), Resource accumulation attack classes (subagent_type: `general`), Resource Exhaustion and Availability Hunting, Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here) (+1 more)

### Community 107 - "Validation, Structured Output, Verification, and Reporting"
Cohesion: 0.20
Nodes (9): Candidate-verifier prompt, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`, Phase 3: Independently validate every candidate, Phase 4: Write and validate `findings.json`, Phase 5: Verify the final records with fresh eyes, Phase 6: Produce target-neutral reports from final records, `REPORT.md` (+1 more)

### Community 108 - "HTTP-Protocol and Authentication Hunting"
Cohesion: 0.20
Nodes (10): API-key and mTLS attack classes (subagent_type: `general`), Browser-session attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), Federated-identity attack classes (subagent_type: `general`), HTTP framing and cache attack classes (subagent_type: `general`), HTTP-Protocol and Authentication Hunting, MFA, passkey, and account-transition attack classes (subagent_type: `general`), Universal moves (apply across the above) (+2 more)

### Community 109 - "ORUM"
Cohesion: 0.20
Nodes (10): Antes de escribir código, Comandos, Documentos del proyecto, Dónde vive cada cosa, Frontend y backend van en paralelo, Los cuatro portales, ORUM, Puesta en marcha (+2 more)

### Community 110 - "overlay.tsx"
Cohesion: 0.31
Nodes (5): OverlayCargando(), Overlay(), Props, ESCRITORIO, useMediaQuery()

### Community 111 - "button.tsx"
Cohesion: 0.27
Nodes (9): Base, Button(), ButtonProps, clases(), ComoBoton, ComoEnlace, LinkButton(), Variant (+1 more)

### Community 113 - "Data Isolation and Lifecycle Hunting"
Cohesion: 0.22
Nodes (9): Core discipline (include in every agent prompt for this domain), Data Isolation and Lifecycle Hunting, Deletion, revocation, and lifecycle attack classes (subagent_type: `general`), Derived-data and disclosure attack classes (subagent_type: `general`), Export, backup, restore, and migration attack classes (subagent_type: `general`), Tenant and object-isolation attack classes (subagent_type: `general`), Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here) (+1 more)

### Community 114 - "Supply Chain and Release Hunting"
Cohesion: 0.22
Nodes (8): CI and automation attack classes (subagent_type: `general`), Core discipline (include in every agent prompt for this domain), Dependency and build-input attack classes (subagent_type: `general`), Release and update attack classes (subagent_type: `general`), Supply Chain and Release Hunting, Universal moves (apply across the above), Validation rules (apply before reporting ANY finding here), When to use this file

### Community 115 - "ORUM — Rediseño visual completo: sistema de diseño, movimiento y PWA"
Cohesion: 0.22
Nodes (9): 0. Diagnóstico del punto de partida, 10. Rendimiento y accesibilidad, 11. Plan de ejecución por fases, 12. Riesgos y mitigaciones, 13. Decisiones que necesito de ti, 14. Referencias, 1. Filosofía de diseño, 7. Inventario de componentes (+1 more)

### Community 116 - "2. Sistema de color"
Cohesion: 0.22
Nodes (9): 2.1 Dos correcciones críticas, 2.2 Neutrales — la base, 2.3 Oro — la rampa, 2.4 El oro metálico, 2.5 Reglas de uso del oro (no negociables), 2.6 Colores de acción (tinta), 2.7 Colores semánticos, 2.9 Los tres modos: claro, oscuro y automático (+1 more)

### Community 117 - "Correo de bienvenida con credenciales"
Cohesion: 0.22
Nodes (8): 1. Qué es y qué no es, 2. Proveedor y dependencias, 3. Módulo `src/lib/correo/correo.ts`, 4. Integración en los registros existentes, 5. Manejo de errores, 6. Testing, 7. Checklist de implementación (referencia, no reemplaza el plan), Correo de bienvenida con credenciales

### Community 118 - "comercio-card.tsx"
Cohesion: 0.33
Nodes (5): ComercioCard(), ComercioListado, ComercioLogo(), ComercioLogoProps, formatearBeneficio()

### Community 119 - "2026-08-05-rediseno-visual-plan.md"
Cohesion: 0.25
Nodes (7): FASE D — Login y cuenta · **punto de evaluación**, Global Constraints, Rediseño visual ORUM — Plan de implementación, Supuestos asumidos (decisiones §13 del spec aún abiertas), Task D1: `/login`, Task D2: `/admin/cuenta/password`, Task D3: 🚦 Punto de evaluación

### Community 120 - "Global Constraints"
Cohesion: 0.25
Nodes (7): Correo de Bienvenida con Credenciales — Implementation Plan, Global Constraints, Task 1: Función pura `construirCorreoBienvenida`, Task 2: Envío vía MailerSend — `enviarCorreoBienvenida`, Task 3: Integrar en `registrarMiembro`, Task 4: Integrar en `crearUsuario`, Task 5: Cerrar la idea pendiente en el ROADMAP

### Community 121 - "database.types.ts"
Cohesion: 0.32
Nodes (5): esMembresiaVigente(), EstadoMembresia, Row, Timestamp, TipoMembresia

### Community 122 - "ci-security-scanning-with-strix/SKILL.md"
Cohesion: 0.29
Nodes (6): GitHub Actions, Option A — Self-hosted OSS CLI in the runner, Option B — Managed platform (no runner infra), Optional: upload findings to GitHub code scanning, Other CI systems, Set up Strix in CI/CD

### Community 123 - "Find security vulnerabilities in code"
Cohesion: 0.29
Nodes (6): Complementary tooling, Find security vulnerabilities in code, Fix and verify, Read the results, Reviewing a pull request instead of the whole repo, Run it

### Community 124 - "Herramientas y dependencias"
Cohesion: 0.29
Nodes (7): Dependencias nuevas, Descartado explícitamente, Herramientas y dependencias, Plataforma nativa antes que librería, Proceso de diseño: prototipo en código, sin Figma, Verificación, Ya en el proyecto (sin cambios)

### Community 125 - "FASE G — Auditoría y pulido"
Cohesion: 0.29
Nodes (7): FASE G — Auditoría y pulido, Orden y dependencias, Riesgos operativos, Task G1: Accesibilidad de preferencias, Task G2: Teclado y lectores de pantalla, Task G3: Rendimiento, Task G4: Revisión de movimiento

### Community 126 - "5. Movimiento — el núcleo de la sensación Apple"
Cohesion: 0.29
Nodes (7): 5.1 Los cinco comportamientos que hay que respetar, 5.2 Tokens de movimiento, 5.3 Catálogo de movimiento por elemento, 5.4 Consistencia espacial, 5.5 Rendimiento del movimiento, 5.6 Movimiento reducido, 5. Movimiento — el núcleo de la sensación Apple

### Community 127 - "package.json"
Cohesion: 0.29
Nodes (6): engines, node, name, packageManager, private, version

### Community 128 - "copiar.tsx"
Cohesion: 0.52
Nodes (5): Copiar(), error(), exito(), toque(), vibrar()

### Community 129 - "Security-test an API"
Cohesion: 0.33
Nodes (5): 1. Gather what the agents need, 2. Run the scan, 3. Verify findings, 4. Fix, re-test, and keep it tested, Security-test an API

### Community 130 - "Application security testing"
Cohesion: 0.33
Nodes (5): 1. Map the assets, 2. Pick the right test per asset, 3. Consolidate into one plan, 4. Be honest about coverage, Application security testing

### Community 131 - "Fix Strix findings and verify"
Cohesion: 0.33
Nodes (5): 1. Triage, 2. Fix, 3. Verify by re-running Strix, 4. Report, Fix Strix findings and verify

### Community 132 - "Test against the OWASP Top 10"
Cohesion: 0.33
Nodes (5): Report honestly, Run it, Test against the OWASP Top 10, Then fix and re-test, What is and is not testable by an agent

### Community 133 - "Pentest a web application"
Cohesion: 0.33
Nodes (5): 1. Confirm authorization and scope, 2. Run the scan, 3. Review results, 4. Fix and verify, Pentest a web application

### Community 134 - "FASE C — App Shell y navegación"
Cohesion: 0.33
Nodes (6): FASE C — App Shell y navegación, Task C1: Shell y sidebar, Task C2: TabBar móvil, Task C3: Indicador activo, Task C4: Búsqueda global y paleta de comandos, Task C5: Transiciones de ruta

### Community 135 - "2.8 Mapa de estados de ORUM"
Cohesion: 0.33
Nodes (6): 2.8 Mapa de estados de ORUM, El eje es binario, ~~El segundo eje: tier del plan~~ — ELIMINADO (2026-08-09), "Por vencer" no es un estado, ⚠ Riesgo de datos que afecta directamente a la UI, ¿Y el oro?

### Community 136 - "6. Navegación y arquitectura de pantalla"
Cohesion: 0.33
Nodes (6): 6.1 App Shell adaptativo, 6.2 Wayfinding, 6.3 Menor número de clics — las decisiones concretas, 6.4 Tablas → listas responsive, 6.5 Estados de carga y vacío, 6. Navegación y arquitectura de pantalla

### Community 137 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 138 - "Reconnaissance"
Cohesion: 0.40
Nodes (5): Architecture summary and companion selection, Deterministic coverage ledger, Phase 1: Map the source and plan coverage, Prior-run input, Reconnaissance

### Community 139 - "FASE A — Fundaciones"
Cohesion: 0.40
Nodes (5): FASE A — Fundaciones, Task A1: Tipografía Inter Variable, Task A2: Capa de tokens, Task A3: Sistema de tres temas, Task A4: Utilidades de movimiento

### Community 140 - "FASE F — PWA"
Cohesion: 0.40
Nodes (5): FASE F — PWA, Task F1: Manifest e iconos, Task F2: Service worker, Task F3: iOS, Task F4: Instalación

### Community 141 - "4. Espacio, forma y profundidad"
Cohesion: 0.40
Nodes (5): 4.1 Rejilla de espaciado — base 4pt, 4.2 Radios, 4.3 Sombras, 4.4 Materiales translúcidos, 4. Espacio, forma y profundidad

### Community 142 - "9. Decisiones técnicas"
Cohesion: 0.40
Nodes (5): 9.1 Estrategia de estilos: **CSS Modules**, 9.2 Librería de animación: **`motion`** (1 dependencia), 9.3 Transiciones de ruta, 9.4 Lo que NO cambia, 9. Decisiones técnicas

### Community 143 - "8. PWA — instalable y persistente en el móvil"
Cohesion: 0.50
Nodes (4): 8.1 Qué se implementa, 8.2 Limitaciones reales de iOS (hay que decirlo de frente), 8.3 Herramienta, 8. PWA — instalable y persistente en el móvil

### Community 145 - "3. Tipografía"
Cohesion: 0.67
Nodes (3): 3.1 Elección de fuente, 3.2 Escala tipográfica, 3. Tipografía

## Knowledge Gaps
- **1011 isolated node(s):** `fs`, `path`, `{ TextDecoder }`, `REQUIRED_FIELDS`, `REF_FIELDS` (+1006 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `createAdminClient` to `ui/layout.tsx`, `bitacora/page.tsx`, `miembros/[id]/page.tsx`, `miembros/page.tsx`, `metricas/page.tsx`, `planes/actions.ts`, `auth.ts`, `usuario-form.tsx`, `miembros/nuevo/page.tsx`, `miembros/actions.ts`, `promocion-form.tsx`, `getPerfilActual`, `sucursal-form.tsx`, `numeros/page.tsx`, `comercio-form.tsx`, `comercios/[id]/page.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `requireRol()` connect `createAdminClient` to `ui/layout.tsx`, `bitacora/page.tsx`, `miembros/[id]/page.tsx`, `miembros/page.tsx`, `metricas/page.tsx`, `auth.ts`, `miembros/nuevo/page.tsx`, `getPerfilActual`, `sucursal-form.tsx`, `numeros/page.tsx`, `admin/layout.tsx`, `comercios/[id]/page.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Button()` connect `button.tsx` to `editar-comercio-form.tsx`, `confirmar-venta-form.tsx`, `miembros/[id]/page.tsx`, `metricas/page.tsx`, `createClient`, `promocion-form.tsx`, `getPerfilActual`, `sucursal-form.tsx`, `numeros/page.tsx`, `comercios/[id]/page.tsx`, `input.tsx`, `gallery.tsx`, `bitacora/page.tsx`, `app-shell.tsx`, `miembros/page.tsx`, `motion.ts`, `auth.ts`, `usuario-form.tsx`, `password-form.tsx`, `miembros/actions.ts`, `field.tsx`, `instalar-app.tsx`, `buscar-miembro-form.tsx`, `miembros/(portal)/layout.tsx`, `comercio-form.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `{ TextDecoder }` to the rest of the system?**
  _1011 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ui/layout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08961593172119488 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `miembros/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._