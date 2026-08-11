# Reorganización — Paso 7: admin/layout.tsx con el kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `src/app/admin/layout.tsx`'s header/nav inline flex styles to `Row` from the kit. This is the final step of the reorganization spec (`docs/superpowers/specs/2026-08-05-reorganizacion-proyecto-design.md`, §7 step 7): "el header/nav con estilos inline también pasa a usar `Row`/`Stack` del kit al final, una vez que existen."

**Architecture:** `admin/layout.tsx` has two `display: flex` blocks (the header bar, and the nav link row) that are exactly `Row`'s pattern — `Row` accepts a `style` override so the header's extra `padding`/`borderBottom`/`alignItems` and the nav's `flex: 1` can ride along unchanged.

**Tech Stack:** Next.js 16 (App Router), TypeScript, React 19, pnpm.

## Global Constraints

- **Zero visual/behavioral change**, same as every prior step.
- Depends on Pasos 3-6 already being applied (kit exists; all other modules already migrated).
- This is the **last** file touched by the reorganization. After this task's verification passes, spec §10's full acceptance checklist (all steps) can be run end-to-end.
- No automated UI tests exist (spec §8) — verification is `tsc --noEmit` + `pnpm lint` + `pnpm build`, plus your manual visual check.
- **Single commit policy:** this whole reorganization lands as one commit at the very end. This task's completion is the trigger to do that commit — see the "Next steps" section below.

---

### Task 1: Migrate `admin/layout.tsx`

**Files:**
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `Row` from `@/components/ui`.

- [ ] **Step 1: Rewrite `src/app/admin/layout.tsx` to use `Row`**

Replace the full file with:

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth/auth'
import { cerrarSesion } from '@/app/login/actions'
import { Row } from '@/components/ui'

export const metadata = {
  title: 'Panel · ORUM',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Solo super_admin y empleado pueden entrar al portal administrativo.
  const perfil = await requireRol('super_admin', 'empleado')
  const esSuperAdmin = perfil.rolCodigo === 'super_admin'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Row
        gap="1.5rem"
        style={{
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--orum-border)',
        }}
      >
        <Link href="/admin" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
          ORUM
        </Link>

        <Row gap="1rem" style={{ flex: 1 }}>
          <Link href="/admin">Inicio</Link>
          <Link href="/admin/miembros">Miembros</Link>
          {esSuperAdmin && <Link href="/admin/comercios">Comercios</Link>}
          {esSuperAdmin && <Link href="/admin/usuarios">Usuarios</Link>}
          {esSuperAdmin && <Link href="/admin/planes">Planes</Link>}
          {esSuperAdmin && <Link href="/admin/bitacora">Bitácora</Link>}
          {esSuperAdmin && <Link href="/admin/metricas">Métricas</Link>}
          <Link href="/admin/cuenta/password">Mi contraseña</Link>
        </Row>

        <span className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {perfil.email} · {perfil.rolNombre}
        </span>
        <form action={cerrarSesion}>
          <button type="submit" className="orum-button orum-button--secondary">
            Cerrar sesión
          </button>
        </form>
      </Row>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
```

Note this uses `Row` as the header container itself (was `<header style={{display:'flex',...}}>` — becomes `<Row style={{...}}>`, which renders a `<div>` instead of a semantic `<header>` element). This is a deliberate, spec-sanctioned trade-off: `Row`'s contract is a generic flex `<div>`, and the spec explicitly calls for this exact file to adopt `Row`/`Stack`. If semantic-HTML preservation for `<header>` turns out to matter later (e.g. accessibility audit), that's a follow-up outside this reorg's scope — not a "zero visual change" regression, since `<header>` vs `<div>` has no visual rendering difference.

- [ ] **Step 2: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 3: Manual visual check**

Load any `/admin/*` page as both a `super_admin` (all nav links visible) and an `empleado` (only "Inicio", "Miembros", "Mi contraseña" visible) — header layout, nav spacing, and "Cerrar sesión" must look and behave identically to before.

Do not commit yet — see "Next steps" below.

---

## Acceptance check (maps to spec §10 — full checklist, all steps)

- [ ] `src/components/ui/` exists with all 9 components from spec §3.
- [ ] All 11 `*-form.tsx` files are under `_components/` per spec §4.1, imports updated; `usuarios/.../editar-form.tsx` renamed to `editar-usuario-form.tsx` (§4.2).
- [ ] No `page.tsx`, `layout.tsx`, or `actions.ts` changed location or public route anywhere in the reorg.
- [ ] `src/lib/` organized by domain per spec §5.
- [ ] Repo root has no `Contexto_ORUM_txt`, `Esquema_BD.txt`, `Esquema_ORUM.png`; `public/` has no scaffold SVGs.
- [ ] `docs/ROADMAP.md` and `database.types.ts` point at `docs/referencia/`.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm test` (41/41), and `pnpm build` all pass clean.
- [ ] User has visually confirmed every migrated module.
- [ ] `bitacora` and `metricas` use the kit.

## Next steps

This is the last plan in the reorganization (spec §7 steps 1-7 all done). Once this task's verification and your visual check both pass:

1. Run the full verification net one final time (`tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`) as a last end-to-end sanity check across everything touched by Pasos 1-7.
2. Make the single commit covering the entire reorganization (root cleanup + `lib/` reorg + kit + all 8 migrated modules), per the "single commit policy" honored throughout every plan.
