# Reorganización — Paso 2: `src/lib/` por dominio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `src/lib/*.ts` (currently a flat list of one file per domain) into per-domain folders, updating every import across `src/app`, with zero change in runtime behavior.

**Architecture:** Pure file moves + import path rewrites. This is Paso 2 of the reorganization spec (`docs/superpowers/specs/2026-08-05-reorganizacion-proyecto-design.md`, §5, §7) — done **before** the UI kit / `_components` migration (Paso 3+) specifically so import-path churn from this step and from the `_components` moves never overlap on the same files.

**Tech Stack:** Next.js 15 (App Router), TypeScript, pnpm, Vitest.

## Global Constraints

- Zero behavior change: function bodies are not touched, only file location and the import paths that point at them.
- `src/lib/supabase/**` (5 files) is already its own domain folder — out of scope, no changes.
- Every `.test.ts` travels with its source file (same directory), same as today — only the directory itself moves.
- **Single commit policy:** per user direction this whole reorganization lands as one commit at the very end — do not commit after this plan. Leave changes staged/unstaged in the working tree.
- Verification net (spec §8): `tsc --noEmit` clean, `pnpm test` still 41/41 (moving files must not change any test result, only its import paths), `pnpm lint` no new errors, `pnpm build` OK — run all four after this task.

---

### Task 1: Move `src/lib/*.ts` into per-domain folders and update every import site

**Files:**
- Move: `src/lib/auth.ts` → `src/lib/auth/auth.ts`
- Move: `src/lib/bitacora.ts` + `src/lib/bitacora.test.ts` → `src/lib/bitacora/bitacora.ts` + `src/lib/bitacora/bitacora.test.ts`
- Move: `src/lib/membresias.ts` + `src/lib/membresias.test.ts` → `src/lib/miembros/membresias.ts` + `src/lib/miembros/membresias.test.ts`
- Move: `src/lib/metricas.ts` + `src/lib/metricas.test.ts` → `src/lib/metricas/metricas.ts` + `src/lib/metricas/metricas.test.ts`
- Move: `src/lib/promociones.ts` + `src/lib/promociones.test.ts` → `src/lib/comercios/promociones.ts` + `src/lib/comercios/promociones.test.ts`
- Move: `src/lib/password.ts` → `src/lib/shared/password.ts`
- Modify (import path only, `@/lib/auth` → `@/lib/auth/auth`): `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/comercios/actions.ts`, `src/app/admin/comercios/nuevo/page.tsx`, `src/app/admin/comercios/promociones-actions.ts`, `src/app/admin/comercios/sucursales-actions.ts`, `src/app/admin/comercios/page.tsx`, `src/app/admin/comercios/[id]/page.tsx`, `src/app/admin/comercios/[id]/editar/page.tsx`, `src/app/admin/comercios/[id]/sucursales/nueva/page.tsx`, `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`, `src/app/admin/comercios/[id]/promociones/nueva/page.tsx`, `src/app/admin/comercios/[id]/promociones/[promoId]/editar/page.tsx`, `src/app/admin/miembros/actions.ts`, `src/app/admin/miembros/page.tsx`, `src/app/admin/miembros/nuevo/page.tsx`, `src/app/admin/miembros/[id]/page.tsx`, `src/app/admin/miembros/[id]/editar/page.tsx`, `src/app/admin/bitacora/page.tsx`, `src/app/admin/metricas/page.tsx`, `src/app/admin/planes/page.tsx`, `src/app/admin/planes/actions.ts`, `src/app/admin/planes/nuevo/page.tsx`, `src/app/admin/planes/[id]/editar/page.tsx`, `src/app/admin/usuarios/page.tsx`, `src/app/admin/usuarios/actions.ts`, `src/app/admin/usuarios/[id]/editar/page.tsx`, `src/app/admin/usuarios/nuevo/page.tsx`
- Modify (`@/lib/bitacora` → `@/lib/bitacora/bitacora`): `src/app/admin/miembros/actions.ts`, `src/app/admin/bitacora/page.tsx`, `src/app/admin/miembros/[id]/page.tsx`
- Modify (`@/lib/membresias` → `@/lib/miembros/membresias`): `src/app/admin/miembros/actions.ts`
- Modify (`@/lib/metricas` → `@/lib/metricas/metricas`): `src/app/admin/metricas/page.tsx`
- Modify (`@/lib/promociones` → `@/lib/comercios/promociones`): `src/app/admin/comercios/promociones-actions.ts`
- Modify (`@/lib/password` → `@/lib/shared/password`): `src/app/admin/comercios/actions.ts`, `src/app/admin/miembros/actions.ts`, `src/app/admin/usuarios/actions.ts`
- Modify (self-referencing import inside the moved test files, e.g. `from './bitacora'` — unaffected since sibling files move together, but verify in Step 3)

**Interfaces:** None — every exported function name, signature, and return type from `auth.ts`, `bitacora.ts`, `membresias.ts`, `metricas.ts`, `promociones.ts`, `password.ts` stays exactly as-is. Only the module's file path changes.

- [ ] **Step 1: Create the domain folders and move each file with `git mv`**

```bash
mkdir -p src/lib/auth src/lib/miembros src/lib/shared
git mv src/lib/auth.ts src/lib/auth/auth.ts
git mv src/lib/bitacora.ts src/lib/bitacora/bitacora.ts
git mv src/lib/bitacora.test.ts src/lib/bitacora/bitacora.test.ts
git mv src/lib/membresias.ts src/lib/miembros/membresias.ts
git mv src/lib/membresias.test.ts src/lib/miembros/membresias.test.ts
git mv src/lib/metricas.ts src/lib/metricas/metricas.ts
git mv src/lib/metricas.test.ts src/lib/metricas/metricas.test.ts
git mv src/lib/promociones.ts src/lib/comercios/promociones.ts
git mv src/lib/promociones.test.ts src/lib/comercios/promociones.test.ts
git mv src/lib/password.ts src/lib/shared/password.ts
```

Note: `src/lib/bitacora/` and `src/lib/comercios/` don't exist yet — `git mv` creates the destination directory automatically when the target path doesn't exist, same as regular `mv`.

- [ ] **Step 2: Verify each moved `.test.ts` still imports its sibling with a relative path**

Since both the source file and its test move into the same new folder together, the existing relative import (e.g. `import { registrarActividad } from './bitacora'` inside `bitacora.test.ts`) does not need to change. Confirm this by reading the first ~10 lines of each moved test file:

```bash
grep -n "^import" src/lib/bitacora/bitacora.test.ts src/lib/miembros/membresias.test.ts src/lib/metricas/metricas.test.ts src/lib/comercios/promociones.test.ts
```

Expected: all imports use relative paths (`./<name>`) or external packages (`vitest`) — none use `@/lib/...` pointing at themselves. If one does, fix it to the correct relative path.

- [ ] **Step 3: Update every `@/lib/auth` import to `@/lib/auth/auth`**

Run this to find every remaining reference, then fix each one (change only the import path string, nothing else on the line):

```bash
grep -rln "from '@/lib/auth'" src/
```

For every file returned, change:

```typescript
from '@/lib/auth'
```

to:

```typescript
from '@/lib/auth/auth'
```

This applies to (per the grep done during planning): `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/comercios/actions.ts`, `src/app/admin/comercios/nuevo/page.tsx`, `src/app/admin/comercios/promociones-actions.ts`, `src/app/admin/comercios/sucursales-actions.ts`, `src/app/admin/comercios/page.tsx`, `src/app/admin/comercios/[id]/page.tsx`, `src/app/admin/comercios/[id]/editar/page.tsx`, `src/app/admin/comercios/[id]/sucursales/nueva/page.tsx`, `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`, `src/app/admin/comercios/[id]/promociones/nueva/page.tsx`, `src/app/admin/comercios/[id]/promociones/[promoId]/editar/page.tsx`, `src/app/admin/miembros/actions.ts`, `src/app/admin/miembros/page.tsx`, `src/app/admin/miembros/nuevo/page.tsx`, `src/app/admin/miembros/[id]/page.tsx`, `src/app/admin/miembros/[id]/editar/page.tsx`, `src/app/admin/bitacora/page.tsx`, `src/app/admin/metricas/page.tsx`, `src/app/admin/planes/page.tsx`, `src/app/admin/planes/actions.ts`, `src/app/admin/planes/nuevo/page.tsx`, `src/app/admin/planes/[id]/editar/page.tsx`, `src/app/admin/usuarios/page.tsx`, `src/app/admin/usuarios/actions.ts`, `src/app/admin/usuarios/[id]/editar/page.tsx`, `src/app/admin/usuarios/nuevo/page.tsx`.

- [ ] **Step 4: Update the remaining single-domain imports**

Change each of these (exact string replace, same line otherwise unchanged):

| File | From | To |
|---|---|---|
| `src/app/admin/miembros/actions.ts` | `from '@/lib/bitacora'` | `from '@/lib/bitacora/bitacora'` |
| `src/app/admin/bitacora/page.tsx` | `from '@/lib/bitacora'` | `from '@/lib/bitacora/bitacora'` |
| `src/app/admin/miembros/[id]/page.tsx` | `from '@/lib/bitacora'` | `from '@/lib/bitacora/bitacora'` |
| `src/app/admin/miembros/actions.ts` | `from '@/lib/membresias'` | `from '@/lib/miembros/membresias'` |
| `src/app/admin/metricas/page.tsx` | `from '@/lib/metricas'` | `from '@/lib/metricas/metricas'` |
| `src/app/admin/comercios/promociones-actions.ts` | `from '@/lib/promociones'` | `from '@/lib/comercios/promociones'` |
| `src/app/admin/comercios/actions.ts` | `from '@/lib/password'` | `from '@/lib/shared/password'` |
| `src/app/admin/miembros/actions.ts` | `from '@/lib/password'` | `from '@/lib/shared/password'` |
| `src/app/admin/usuarios/actions.ts` | `from '@/lib/password'` | `from '@/lib/shared/password'` |

- [ ] **Step 5: Confirm no stale import remains**

```bash
grep -rn "from '@/lib/auth'\|from '@/lib/bitacora'\|from '@/lib/membresias'\|from '@/lib/metricas'\|from '@/lib/promociones'\|from '@/lib/password'" src/
```

Expected: no output (every match found in Steps 3-4 has been rewritten to its domain-folder path).

- [ ] **Step 6: Run the full verification net**

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm lint
pnpm build
```

Expected: `tsc` clean (0 errors — any leftover stale import path shows up here as "Cannot find module"), `pnpm test` reports 41/41 passing (same count as before the move), `pnpm lint` no new errors, `pnpm build` succeeds.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

## Acceptance check (maps to spec §10)

- [ ] `src/lib/` is organized by domain per spec §5's table (`auth/`, `bitacora/`, `miembros/`, `metricas/`, `comercios/`, `shared/`, `supabase/` — no loose `.ts` files directly under `src/lib/`).
- [ ] No function behavior changed — only file location and import paths.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm test` (41/41), and `pnpm build` all pass clean.
