# Reorganización — Paso 1: Limpieza de la raíz del repo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the three client reference documents out of the repo root into `docs/referencia/`, fix the two live references to them, and delete the unused `create-next-app` scaffold SVGs from `public/`.

**Architecture:** Pure file moves + text updates. No code logic changes, no route/behavior changes. This is Paso 1 of the reorganization spec (`docs/superpowers/specs/2026-08-05-reorganizacion-proyecto-design.md`, §6) — the first, lowest-risk, independently-committable step of the migration order defined in §7.

**Tech Stack:** Next.js 15 (App Router), TypeScript, pnpm.

## Global Constraints

- Zero behavior change: no route changes, no logic changes — only file locations and doc text.
- Historical specs/plans under `docs/superpowers/specs/2026-07-*` and `docs/superpowers/plans/2026-07-*` that mention the old filenames are **not** touched — they are a record of what existed at that point in time (spec §6).
- `Contexto_ORUM_txt` gets a proper `.txt` extension when moved (it didn't have one).
- After each task: `pnpm build` must succeed (this repo has no lint/test coverage of static assets or markdown links, so `pnpm build` plus a manual grep is the verification net for this step, per spec §8/§9).
- **Single commit policy:** per user direction, this is a purely structural change — do **not** commit after each task or after this plan. Leave all changes staged/unstaged in the working tree; one single commit covers the entire reorganization (all plans: root cleanup, `lib/` reorg, UI kit + per-module migration) at the very end, once everything is verified.

---

### Task 1: Move reference documents to `docs/referencia/` and fix live references

**Files:**
- Move: `Contexto_ORUM_txt` → `docs/referencia/Contexto_ORUM.txt`
- Move: `Esquema_BD.txt` → `docs/referencia/Esquema_BD.txt`
- Move: `Esquema_ORUM.png` → `docs/referencia/Esquema_ORUM.png`
- Modify: `docs/ROADMAP.md:16-17`
- Modify: `src/lib/supabase/database.types.ts:9`

**Interfaces:** None — no code exports change. This task only touches file locations and prose/comment text.

- [ ] **Step 1: Create the target directory and move the three files with `git mv`**

```bash
mkdir -p docs/referencia
git mv Contexto_ORUM_txt docs/referencia/Contexto_ORUM.txt
git mv Esquema_BD.txt docs/referencia/Esquema_BD.txt
git mv Esquema_ORUM.png docs/referencia/Esquema_ORUM.png
```

- [ ] **Step 2: Update the two links in `docs/ROADMAP.md`**

Current (`docs/ROADMAP.md:16-17`):

```markdown
Documento de requisitos original: [`Contexto_ORUM_txt`](../Contexto_ORUM_txt) (raíz del repo).
Esquema de base de datos: [`Esquema_BD.txt`](../Esquema_BD.txt) y `Esquema_ORUM.png`.
```

Replace with:

```markdown
Documento de requisitos original: [`Contexto_ORUM.txt`](referencia/Contexto_ORUM.txt).
Esquema de base de datos: [`Esquema_BD.txt`](referencia/Esquema_BD.txt) y [`Esquema_ORUM.png`](referencia/Esquema_ORUM.png).
```

(Link paths change from `../<file>` to `referencia/<file>` because `ROADMAP.md` lives in `docs/` — same directory as the new `referencia/` folder — whereas before the files were one level up, in the repo root.)

- [ ] **Step 3: Update the header comment in `src/lib/supabase/database.types.ts`**

Current (`src/lib/supabase/database.types.ts:9`):

```typescript
 * Referencia: ver `Esquema_BD.txt` en la raíz del proyecto.
```

Replace with:

```typescript
 * Referencia: ver `docs/referencia/Esquema_BD.txt`.
```

- [ ] **Step 4: Grep for any remaining live reference to the old paths**

Run:

```bash
grep -rn "Contexto_ORUM_txt\|(\.\./Esquema_BD\.txt\|(\.\./Esquema_ORUM\.png" --include="*.ts" --include="*.tsx" --include="*.md" . 2>/dev/null | grep -v "docs/superpowers/specs/2026-07-\|docs/superpowers/plans/2026-07-\|docs/superpowers/specs/2026-08-05-reorganizacion-proyecto-design.md"
```

Expected: no output. If anything prints, fix that reference the same way as Step 2/3 before continuing (unless it's inside a `2026-07-*` historical spec/plan file, which is intentionally left alone per Global Constraints).

- [ ] **Step 5: Verify the build**

Run: `pnpm build`
Expected: build succeeds with no new errors (this build doesn't type-check markdown links, but it will fail fast if `database.types.ts` has a syntax issue from the edit).

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 2: Delete unused `create-next-app` scaffold SVGs

**Files:**
- Delete: `public/file.svg`
- Delete: `public/globe.svg`
- Delete: `public/next.svg`
- Delete: `public/vercel.svg`
- Delete: `public/window.svg`

**Interfaces:** None.

- [ ] **Step 1: Confirm nothing under `src/` references any of the five SVGs**

Run:

```bash
grep -rn "file\.svg\|globe\.svg\|next\.svg\|vercel\.svg\|window\.svg" src/
```

Expected: no output. (Already verified during planning — this step re-confirms at execution time in case other work landed in between.)

- [ ] **Step 2: Delete the files**

```bash
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: build succeeds — no page references these assets, so removing them cannot break a build that was passing before.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

## Acceptance check (maps to spec §10)

- [ ] Repo root no longer contains `Contexto_ORUM_txt`, `Esquema_BD.txt`, or `Esquema_ORUM.png`.
- [ ] `docs/referencia/` contains the three files (`Contexto_ORUM.txt`, `Esquema_BD.txt`, `Esquema_ORUM.png`).
- [ ] `docs/ROADMAP.md` and `database.types.ts` point at the new location; no live reference to the old paths remains outside `2026-07-*` historical specs/plans.
- [ ] `public/` no longer has `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`.
- [ ] `pnpm build` passes after both tasks.
