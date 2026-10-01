# Derechos sobre las fotos de los socios — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada foto de socio lleve una declaración de derechos, que solo pueda subirse una foto con una sola cara (cuando la detección funciona), que el admin pueda retirar fotos y que exista una página pública de reclamos.

**Architecture:** Funciones puras y probadas en `src/lib/imagenes/derechos.ts`; la declaración se comprueba y se guarda en el servidor dentro de las dos acciones que ya escriben `miembros.foto_url`; la detección de caras corre en el navegador con MediaPipe cargado de forma diferida y alojado en `public/`; la retirada es una acción de servidor exclusiva de `super_admin` montada como overlay interceptado; la página `/derechos-de-autor` reutiliza `PaginaLegal`.

**Tech Stack:** Next.js 16.2.11 (App Router, Server Actions), React 19, TypeScript, Supabase (Postgres + Storage), Vitest (solo funciones puras), `@mediapipe/tasks-vision`, CSS Modules con tokens.

**Spec:** `docs/superpowers/specs/2026-09-30-derechos-imagenes-design.md`

## Global Constraints

- **NO HACER COMMITS** en ningún paso de este plan (instrucción del propietario; además el repo está en medio de un merge con `UU` en `src/app/(publico)/explorar/**`, que no se tocan). Donde el flujo habitual pondría un commit, no hay ninguno.
- Gestor de paquetes: **pnpm** (`packageManager: pnpm@11.17.0`). Nunca `npm`. `pnpm` está en `C:/Users/jseba/AppData/Local/pnpm/bin/pnpm`; si no está en el `PATH`, invocar con esa ruta.
- Verificación: `./node_modules/.bin/vitest.cmd run --reporter=dot` y `./node_modules/.bin/eslint.cmd <rutas>`. `tsc --noEmit` y `next build` **fallan por el merge sin resolver** ajeno a este trabajo: para tipos usar un `tsconfig` temporal que incluya solo `src/lib`, `src/components`, `src/app/miembros`, `src/app/admin` y `src/app/(publico)` **excluyendo `src/app/(publico)/explorar/**`**… y si aun así arrastra esos archivos, limitar `include` a lo tocado. Borrar el tsconfig temporal al terminar.
- CLAUDE.md: valores solo de `var(--…)`; sin `style={{}}` para maquetar; sin `className="orum-*"`; `:hover` solo dentro de `@media (hover: hover)`; formularios como overlay (ruta interceptada `@modal`), no página; pruebas automatizadas solo de funciones puras; un `<h1>` por pantalla; español en todo el texto visible.
- Seguridad: la declaración y la autorización **se comprueban en el servidor**; la comprobación del navegador es comodidad. `retirarFotoMiembro` exige **solo `super_admin`**.
- Si la detección facial no puede ejecutarse (`no_disponible`), el socio **continúa** (decisión del propietario).
- Los textos legales son **borrador** y **no se publican** hasta el visto bueno del abogado: la página y la cláusula llevan un aviso visible de «borrador pendiente de revisión legal» hasta entonces.
- Alias de reclamos: `derechos@cluborum.com` (el propietario dice que ya está creado en Workspace; se comprueba con un correo de prueba antes de publicar).
- La migración se **muestra al propietario y se aplica solo con su visto bueno** (es producción).

## Review Focus

1. **Declaración ausente o falsificada:** un POST a `guardarMiFoto`/`guardarFotoMiembro` sin `declaracion=si` (o con `on`, `true`, `1`, vacío) debe rechazarse, y **no** debe subir nada a Storage ni tocar `foto_url`. (Task 1 y 3)
2. **Empleado intentando retirar:** un `empleado` que invoque `retirarFotoMiembro` directamente debe recibir un rechazo aunque el botón no se le muestre. (Task 6)
3. **Motivo inválido en la retirada:** cualquier valor fuera de la lista cerrada se rechaza antes de borrar nada. (Task 1 y 6)
4. **Fallo de la detección facial** (WASM no carga, navegador sin soporte, tiempo agotado): el socio continúa y no ve un error. (Task 1 y 4)
5. **Miembro sin foto o ya retirada:** «Retirar foto» no aparece, y la acción responde con un mensaje claro si se invoca igualmente, sin lanzar. (Task 6)

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/lib/imagenes/derechos.ts` (nuevo) | Funciones puras: declaración, motivos de retirada, veredicto de caras |
| `src/lib/imagenes/derechos.test.ts` (nuevo) | Pruebas de lo anterior |
| `src/lib/imagenes/detectar-caras.ts` (nuevo) | Cliente: carga diferida de MediaPipe y conteo de caras con tiempo límite |
| `supabase/migrations/20260930120000_derechos_fotos.sql` (nuevo) | Columna `miembros.foto_declaracion_at` y clave `correo_reclamos` |
| `src/lib/supabase/database.types.ts` | Añadir `foto_declaracion_at` a `miembros` |
| `src/app/miembros/(portal)/perfil/imagenes-actions.ts` | Exigir y guardar la declaración (socio) |
| `src/app/admin/miembros/imagenes-actions.ts` | Exigir y guardar la declaración (admin) + `retirarFotoMiembro` |
| `src/components/imagenes/declaracion-foto.tsx` (nuevo) | Casilla de declaración compartida por ambos editores |
| `src/app/miembros/(portal)/perfil/foto/_components/editor-foto.tsx` | Casilla + detección antes de encuadrar |
| `src/components/imagenes/subida-imagen.tsx` | Props opcionales `declaracion` y `verificarCara` |
| `src/app/admin/miembros/[id]/foto/_components/foto-miembro.tsx` | Activa los props anteriores |
| `src/app/admin/miembros/[id]/foto/retirar/…` y `@modal/(.)…/retirar/…` (nuevos) | Overlay de retirada |
| `src/app/admin/miembros/[id]/page.tsx` | Botón «Retirar foto» (solo `super_admin` y con foto) |
| `src/app/(publico)/derechos-de-autor/page.tsx` (nuevo) | Página de reclamos |
| `src/app/(publico)/terminos/page.tsx` | Cláusula nueva, renumeración y fecha |
| `src/components/pie/pie-sitio.tsx`, `src/app/sitemap.ts` | Enlace en el pie y entrada en el sitemap |
| `public/mediapipe/…` (nuevo) | WASM y modelo de detección, alojados en el sitio |

---

### Task 1: Funciones puras de derechos (TDD)

**Files:**
- Create: `src/lib/imagenes/derechos.ts`
- Test: `src/lib/imagenes/derechos.test.ts`

**Interfaces:**
- Produces (las usan las Tasks 3, 4, 5, 6):
  - `CAMPO_DECLARACION: 'declaracion'`, `VALOR_DECLARACION: 'si'`
  - `declaracionAceptada(valor: FormDataEntryValue | null): boolean`
  - `MOTIVOS_RETIRADA` (tupla), `type MotivoRetirada`, `esMotivoRetirada(valor: unknown): valor is MotivoRetirada`, `ETIQUETA_MOTIVO: Record<MotivoRetirada, string>`
  - `type ResultadoCaras = { estado: 'disponible'; caras: number } | { estado: 'no_disponible' }`
  - `type VeredictoCaras = 'una' | 'ninguna' | 'varias' | 'no_disponible'`
  - `veredictoDeCaras(r: ResultadoCaras): VeredictoCaras`
  - `permiteContinuar(v: VeredictoCaras): boolean`
  - `mensajeDeCaras(v: VeredictoCaras): string | null`

- [ ] **Step 1: Escribir la prueba que falla**

```ts
// src/lib/imagenes/derechos.test.ts
import { describe, it, expect } from 'vitest'
import {
  CAMPO_DECLARACION,
  VALOR_DECLARACION,
  MOTIVOS_RETIRADA,
  declaracionAceptada,
  esMotivoRetirada,
  mensajeDeCaras,
  permiteContinuar,
  veredictoDeCaras,
} from './derechos'

describe('declaracionAceptada — viene del cliente, así que no es de fiar', () => {
  it('acepta solo el valor afirmativo exacto', () => {
    expect(CAMPO_DECLARACION).toBe('declaracion')
    expect(declaracionAceptada(VALOR_DECLARACION)).toBe(true)
  })

  it('rechaza ausente, vacío y valores parecidos', () => {
    for (const malo of [null, '', 'on', 'true', '1', 'SI', 'no', ' si']) {
      expect(declaracionAceptada(malo)).toBe(false)
    }
  })

  it('rechaza un archivo colado en ese campo', () => {
    expect(declaracionAceptada(new File(['x'], 'x.txt'))).toBe(false)
  })
})

describe('esMotivoRetirada — lista cerrada', () => {
  it('acepta los tres motivos', () => {
    expect(MOTIVOS_RETIRADA).toEqual([
      'reclamo_derechos',
      'contenido_inapropiado',
      'peticion_del_socio',
    ])
    for (const m of MOTIVOS_RETIRADA) expect(esMotivoRetirada(m)).toBe(true)
  })

  it('rechaza cualquier otra cosa', () => {
    for (const malo of ['', 'otro', 'RECLAMO_DERECHOS', null, undefined, 1, {}, ['reclamo_derechos']]) {
      expect(esMotivoRetirada(malo)).toBe(false)
    }
  })
})

describe('veredictoDeCaras', () => {
  it('una cara → una', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: 1 })).toBe('una')
  })
  it('cero caras → ninguna', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: 0 })).toBe('ninguna')
  })
  it('varias caras → varias', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: 2 })).toBe('varias')
    expect(veredictoDeCaras({ estado: 'disponible', caras: 9 })).toBe('varias')
  })
  it('sin detector → no_disponible', () => {
    expect(veredictoDeCaras({ estado: 'no_disponible' })).toBe('no_disponible')
  })
  it('un conteo absurdo no rompe: negativo o NaN cuentan como ninguna', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: -1 })).toBe('ninguna')
    expect(veredictoDeCaras({ estado: 'disponible', caras: NaN })).toBe('ninguna')
  })
})

describe('permiteContinuar y mensajeDeCaras', () => {
  it('continúan una cara y el fallo técnico', () => {
    expect(permiteContinuar('una')).toBe(true)
    expect(permiteContinuar('no_disponible')).toBe(true)
  })
  it('bloquean ninguna y varias, con mensaje', () => {
    expect(permiteContinuar('ninguna')).toBe(false)
    expect(permiteContinuar('varias')).toBe(false)
    expect(mensajeDeCaras('ninguna')).toMatch(/cara/i)
    expect(mensajeDeCaras('varias')).toMatch(/una sola|varias/i)
  })
  it('sin mensaje cuando se puede continuar', () => {
    expect(mensajeDeCaras('una')).toBeNull()
    expect(mensajeDeCaras('no_disponible')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `./node_modules/.bin/vitest.cmd run src/lib/imagenes/derechos.test.ts --reporter=dot`
Expected: FAIL (no existe `./derechos`).

- [ ] **Step 3: Implementación mínima**

```ts
// src/lib/imagenes/derechos.ts
/*
  DERECHOS SOBRE LAS FOTOS DE LOS SOCIOS  ·  funciones puras

  Spec: docs/superpowers/specs/2026-09-30-derechos-imagenes-design.md

  Nada de esto es seguridad por sí solo: la declaración es PRUEBA, no
  prevención, y la comprobación de caras corre en el navegador (se salta). Lo
  que sí es seguridad es que el SERVIDOR exija la declaración y que solo
  `super_admin` pueda retirar.
*/

/** Nombre del campo del formulario y único valor que cuenta como «acepto». */
export const CAMPO_DECLARACION = 'declaracion'
export const VALOR_DECLARACION = 'si'

/**
 * El valor llega del cliente. Solo el literal exacto pasa: `on`, `true`, `1`,
 * vacío o ausente se rechazan, para que un checkbox sin `value` explícito (que
 * envía `on`) no cuele por accidente.
 */
export function declaracionAceptada(valor: FormDataEntryValue | null): boolean {
  return valor === VALOR_DECLARACION
}

export const MOTIVOS_RETIRADA = [
  'reclamo_derechos',
  'contenido_inapropiado',
  'peticion_del_socio',
] as const

export type MotivoRetirada = (typeof MOTIVOS_RETIRADA)[number]

export function esMotivoRetirada(valor: unknown): valor is MotivoRetirada {
  return typeof valor === 'string' && (MOTIVOS_RETIRADA as readonly string[]).includes(valor)
}

export const ETIQUETA_MOTIVO: Record<MotivoRetirada, string> = {
  reclamo_derechos: 'Reclamo de derechos de autor',
  contenido_inapropiado: 'Contenido inapropiado',
  peticion_del_socio: 'A petición del socio',
}

export type ResultadoCaras =
  | { estado: 'disponible'; caras: number }
  | { estado: 'no_disponible' }

export type VeredictoCaras = 'una' | 'ninguna' | 'varias' | 'no_disponible'

export function veredictoDeCaras(r: ResultadoCaras): VeredictoCaras {
  if (r.estado === 'no_disponible') return 'no_disponible'
  if (!Number.isFinite(r.caras) || r.caras < 1) return 'ninguna'
  return r.caras === 1 ? 'una' : 'varias'
}

/** `no_disponible` continúa: la capa legal cubre y un fallo técnico no bloquea a un socio legítimo. */
export function permiteContinuar(v: VeredictoCaras): boolean {
  return v === 'una' || v === 'no_disponible'
}

export function mensajeDeCaras(v: VeredictoCaras): string | null {
  if (v === 'ninguna') {
    return 'No detectamos una cara en esta imagen. Sube una foto tuya, de frente, donde se te vea bien.'
  }
  if (v === 'varias') {
    return 'Detectamos varias caras. Sube una foto donde aparezcas solo tú.'
  }
  return null
}
```

- [ ] **Step 4: Ejecutar y comprobar que pasa**

Run: `./node_modules/.bin/vitest.cmd run src/lib/imagenes/derechos.test.ts --reporter=dot`
Expected: PASS (todas).

---

### Task 2: Migración y tipos

**Files:**
- Create: `supabase/migrations/20260930120000_derechos_fotos.sql`
- Modify: `src/lib/supabase/database.types.ts` (tabla `miembros`: `Row`, `Insert`, `Update`)

**Interfaces:**
- Produces: columna `miembros.foto_declaracion_at: string | null` y fila `configuracion.correo_reclamos = 'derechos@cluborum.com'`.

- [ ] **Step 1: Escribir la migración**

```sql
-- ORUM · Derechos sobre las fotos de los socios
--
-- Spec: docs/superpowers/specs/2026-09-30-derechos-imagenes-design.md
--
-- La declaración de derechos se guarda como fecha: prueba de CUÁNDO aceptó el
-- socio, no una casilla. Sin política nueva: la escribe el servidor con
-- service_role (igual que foto_url) y `miembros_self_select` ya limita la lectura.

alter table public.miembros
  add column foto_declaracion_at timestamptz;

comment on column public.miembros.foto_declaracion_at is
  'Cuándo se declaró tener derecho sobre foto_url. null = sin declaración (fotos anteriores a 30/09/2026 o foto retirada).';

-- Buzón público de reclamos de derechos de autor (alias de recepción de la
-- cuenta del admin). `configuracion.id` no tiene default: se toma el siguiente.
insert into public.configuracion (id, clave, valor, descripcion)
select coalesce(max(id), 0) + 1,
       'correo_reclamos',
       'derechos@cluborum.com',
       'Correo público para reclamos de derechos de autor (página /derechos-de-autor).'
from public.configuracion
where not exists (select 1 from public.configuracion where clave = 'correo_reclamos');
```

- [ ] **Step 2: Mostrar el SQL al propietario y esperar su visto bueno**

No aplicar sin confirmación explícita. Es producción.

- [ ] **Step 3: Aplicar con `mcp__supabase__apply_migration`** (name `derechos_fotos`, el SQL de arriba) y verificar:

```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='miembros' and column_name='foto_declaracion_at';
select clave, valor from public.configuracion where clave='correo_reclamos';
```
Expected: una fila cada consulta.

- [ ] **Step 4: Actualizar `database.types.ts`**

En `miembros`, junto a `foto_url`, añadir en `Row`: `foto_declaracion_at: Timestamp | null` (con el comentario `/** Cuándo se declaró tener derecho sobre la foto. */`) y en `Insert` y `Update`: `foto_declaracion_at?: Timestamp | null`. Usar el mismo alias `Timestamp` que ya usa el archivo.

- [ ] **Step 5: Comprobar tipos** con el tsconfig temporal (ver Global Constraints). Expected: sin errores.

---

### Task 3: La declaración, exigida y guardada en el servidor

**Files:**
- Modify: `src/app/miembros/(portal)/perfil/imagenes-actions.ts`
- Modify: `src/app/admin/miembros/imagenes-actions.ts`

**Interfaces:**
- Consumes: `CAMPO_DECLARACION`, `declaracionAceptada` (Task 1); columna `foto_declaracion_at` (Task 2).
- Produces: ambas acciones devuelven `{ error: 'Confirma que tienes derecho a usar esta foto.' }` si falta la declaración, **antes** de tocar Storage.

- [ ] **Step 1: En `guardarMiFoto`**

Importar `CAMPO_DECLARACION, declaracionAceptada` de `@/lib/imagenes/derechos`. Justo después de `const perfil = await requireRolMiembro()`, añadir:

```ts
  // Antes de leer el archivo y de tocar Storage: sin declaración no se sube nada.
  if (!declaracionAceptada(formData.get(CAMPO_DECLARACION))) {
    return { error: 'Confirma que eres tú quien aparece en la foto y que tienes derecho a usarla.' }
  }
```

Y en el `update` de `miembros`, cambiar a:

```ts
    .update({ foto_url: resultado.url, foto_declaracion_at: new Date().toISOString() })
```

- [ ] **Step 2: En `guardarFotoMiembro` (admin)**

Mismo import. Tras comprobar `actorId` y antes de leer `id`:

```ts
  if (!declaracionAceptada(formData.get(CAMPO_DECLARACION))) {
    return { error: 'Confirma que el socio te entregó esta foto y tiene derecho a usarla.' }
  }
```

Y el `update` igual que arriba con `foto_declaracion_at`.

- [ ] **Step 3: Lint**

Run: `./node_modules/.bin/eslint.cmd "src/app/miembros/(portal)/perfil/imagenes-actions.ts" src/app/admin/miembros/imagenes-actions.ts`
Expected: sin salida.

---

### Task 4: Detección de caras en el navegador

**Files:**
- Create: `src/lib/imagenes/detectar-caras.ts`
- Create: `public/mediapipe/wasm/*` y `public/mediapipe/blaze_face_short_range.tflite`
- Modify: `package.json` (dependencia)

**Interfaces:**
- Consumes: `ResultadoCaras` (Task 1).
- Produces: `contarCaras(imagen: HTMLImageElement): Promise<ResultadoCaras>` — **nunca lanza**; ante cualquier fallo o tras 8 s devuelve `{ estado: 'no_disponible' }`.

- [ ] **Step 1: Instalar**

Run: `pnpm add @mediapipe/tasks-vision`
Expected: añadida a `dependencies`.

- [ ] **Step 2: Alojar el WASM y el modelo en el propio sitio**

```bash
mkdir -p public/mediapipe/wasm
cp node_modules/@mediapipe/tasks-vision/wasm/* public/mediapipe/wasm/
curl -L -o public/mediapipe/blaze_face_short_range.tflite \
  https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite
ls -la public/mediapipe public/mediapipe/wasm
```
Expected: el modelo pesa del orden de cientos de KB; los `.wasm` pesan varios MB. **Anotar los tamaños reales** y decírselos al propietario: solo se descargan al abrir el editor de la foto, pero sí entran en el repo. Si el modelo no descarga (archivo vacío o HTML), detener y avisar.

- [ ] **Step 3: Escribir el módulo**

```ts
// src/lib/imagenes/detectar-caras.ts
import type { FaceDetector } from '@mediapipe/tasks-vision'
import type { ResultadoCaras } from './derechos'

/*
  DETECCIÓN DE CARAS  ·  solo en el navegador

  La foto NO sale del dispositivo: el modelo y el WASM se sirven desde
  `/mediapipe` (nuestro propio sitio), no desde un CDN. Se carga con
  `import()` dinámico y solo al primer uso, para que el resto del portal no
  pague ese peso.

  Esto es una barrera de comodidad, NO de seguridad: corre en el cliente y se
  salta. Y JAMÁS debe bloquear a un socio por un fallo técnico, así que
  cualquier problema —navegador antiguo, WASM que no carga, tiempo agotado—
  devuelve `no_disponible` y la subida continúa.
*/

const TIEMPO_MAXIMO_MS = 8000

let detector: Promise<FaceDetector> | null = null

async function crearDetector(): Promise<FaceDetector> {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  return FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: '/mediapipe/blaze_face_short_range.tflite' },
    runningMode: 'IMAGE',
    minDetectionConfidence: 0.5,
  })
}

export async function contarCaras(imagen: HTMLImageElement): Promise<ResultadoCaras> {
  const fallo: ResultadoCaras = { estado: 'no_disponible' }

  const trabajo = (async (): Promise<ResultadoCaras> => {
    detector ??= crearDetector()
    const d = await detector
    return { estado: 'disponible', caras: d.detect(imagen).detections.length }
  })()

  try {
    return await Promise.race([
      trabajo,
      new Promise<ResultadoCaras>((resolver) => setTimeout(() => resolver(fallo), TIEMPO_MAXIMO_MS)),
    ])
  } catch (err) {
    // Se suelta el detector en caché: si falló al crearse, el próximo intento reintenta.
    detector = null
    console.error('[detectar-caras] no se pudo comprobar la foto:', err)
    return fallo
  }
}
```

- [ ] **Step 4: Lint y tipos**

Run: `./node_modules/.bin/eslint.cmd src/lib/imagenes/detectar-caras.ts` y tipos con el tsconfig temporal.
Expected: sin errores. (No hay prueba automatizada: es navegador + WASM; se verifica a mano en la Task 8.)

---

### Task 5: La casilla y la detección en las dos pantallas de subida

**Files:**
- Create: `src/components/imagenes/declaracion-foto.tsx`, `src/components/imagenes/declaracion-foto.module.css`
- Modify: `src/app/miembros/(portal)/perfil/foto/_components/editor-foto.tsx`
- Modify: `src/components/imagenes/subida-imagen.tsx`
- Modify: `src/app/admin/miembros/[id]/foto/_components/foto-miembro.tsx`

**Interfaces:**
- Consumes: `CAMPO_DECLARACION`, `VALOR_DECLARACION`, `veredictoDeCaras`, `permiteContinuar`, `mensajeDeCaras` (Task 1); `contarCaras` (Task 4).
- Produces: `DeclaracionFoto` — props `{ texto: string; marcada: boolean; onChange: (v: boolean) => void }`; renderiza `<input type="checkbox" name="declaracion" value="si">` con etiqueta y enlaces a `/terminos` y `/derechos-de-autor`.
- `SubidaImagen` gana props opcionales `declaracion?: string` (texto de la casilla; si se pasa, la casilla es obligatoria) y `verificarCara?: boolean`.

- [ ] **Step 1: Crear `DeclaracionFoto`**

```tsx
// src/components/imagenes/declaracion-foto.tsx
'use client'

import Link from 'next/link'
import { useId } from 'react'
import { CAMPO_DECLARACION, VALOR_DECLARACION } from '@/lib/imagenes/derechos'
import styles from './declaracion-foto.module.css'

/*
  La casilla de declaración de derechos. `value="si"` EXPLÍCITO: un checkbox sin
  `value` envía `on`, y el servidor solo acepta `si`.

  Dentro de un `<form>` con server action la casilla viaja sola. En el editor
  del socio (que arma el `FormData` a mano) se añade el campo a mano: ver ahí.
*/
export function DeclaracionFoto({
  texto,
  marcada,
  onChange,
}: {
  texto: string
  marcada: boolean
  onChange: (valor: boolean) => void
}) {
  const id = useId()

  return (
    <div className={styles.declaracion}>
      <input
        id={id}
        type="checkbox"
        name={CAMPO_DECLARACION}
        value={VALOR_DECLARACION}
        checked={marcada}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.casilla}
      />
      <label htmlFor={id} className={styles.texto}>
        {texto}{' '}
        <Link href="/terminos" target="_blank" className={styles.enlace}>
          Términos
        </Link>
        {' · '}
        <Link href="/derechos-de-autor" target="_blank" className={styles.enlace}>
          Derechos de autor
        </Link>
      </label>
    </div>
  )
}
```

```css
/* src/components/imagenes/declaracion-foto.module.css */
.declaracion {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.casilla {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: var(--space-1);
  accent-color: var(--brand);
  cursor: pointer;
}

.casilla:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* El área que se toca es la etiqueta entera, que supera el mínimo táctil. */
.texto {
  min-height: var(--tap-min);
  font-size: var(--t-footnote-size);
  line-height: var(--t-footnote-leading);
  color: var(--text-2);
  cursor: pointer;
}

.enlace {
  color: var(--text);
  text-decoration: underline;
}
```

- [ ] **Step 2: Editor del socio (`editor-foto.tsx`)**

Cambios, en este orden:

1. Imports: `DeclaracionFoto` de `@/components/imagenes/declaracion-foto`; `contarCaras` de `@/lib/imagenes/detectar-caras`; `CAMPO_DECLARACION, VALOR_DECLARACION, mensajeDeCaras, permiteContinuar, veredictoDeCaras` de `@/lib/imagenes/derechos`.
2. Estado nuevo junto a `errorLocal`: `const [declarada, setDeclarada] = useState(false)`.
3. En `cargar`, dentro de `imagen.onload`, **antes** de `setFuente(...)`, comprobar caras. Sustituir el callback por:

```ts
    imagen.onload = async () => {
      const veredicto = veredictoDeCaras(await contarCaras(imagen))
      if (!permiteContinuar(veredicto)) {
        URL.revokeObjectURL(url)
        setErrorLocal(mensajeDeCaras(veredicto))
        return
      }
      setFuente({ url, ancho: imagen.naturalWidth, alto: imagen.naturalHeight, imagen })
      setEncuadre(ENCUADRE_INICIAL)
      setSuave(false)
    }
```
   y marcar «ocupado» mientras se comprueba: al inicio de `cargar` tras las validaciones, `setPreparando(true)`, y en el callback `finally`-equivalente (después de `setFuente` o del rechazo, y en `onerror`) `setPreparando(false)`.
4. En `guardar`, tras `datos.set('archivo', …)`: `datos.set(CAMPO_DECLARACION, VALOR_DECLARACION)`. (Solo se llega aquí con la casilla marcada: ver 5.)
5. En el bloque `fuente ? (...)`, encima de `<div className={estilos.acciones}>`, añadir:

```tsx
          <DeclaracionFoto
            texto="Confirmo que soy yo quien aparece en esta foto y que tengo derecho a usarla."
            marcada={declarada}
            onChange={setDeclarada}
          />
```
6. El botón «Guardar foto» gana `disabled={!declarada}`. Y `guardar()` empieza con `if (!fuente || ocupado || !declarada) return`.
7. Al elegir otra foto la casilla se conserva (no se pide dos veces en la misma sesión); al cerrar el overlay se desmonta y vuelve a pedirse.

- [ ] **Step 3: `SubidaImagen` (admin)**

Props nuevos: `declaracion?: string` y `verificarCara?: boolean`. Cambios:
- Estado `const [declarada, setDeclarada] = useState(false)`.
- Importar `DeclaracionFoto`, `contarCaras`, `mensajeDeCaras`, `permiteContinuar`, `veredictoDeCaras`.
- En `alElegir`, después de la validación de formato y **antes** de `setPrevia(...)`, si `verificarCara`:

```ts
    if (verificarCara) {
      const url = URL.createObjectURL(archivo)
      const imagen = new Image()
      imagen.onload = async () => {
        const veredicto = veredictoDeCaras(await contarCaras(imagen))
        URL.revokeObjectURL(url)
        if (!permiteContinuar(veredicto)) {
          setErrorLocal(mensajeDeCaras(veredicto))
          evento.target.value = ''
          return
        }
        setPrevia(URL.createObjectURL(archivo))
      }
      imagen.onerror = () => {
        // No se pudo abrir para comprobarla: que decida el servidor.
        URL.revokeObjectURL(url)
        setPrevia(URL.createObjectURL(archivo))
      }
      imagen.src = url
      return
    }
```
  (`evento.target` se captura antes del `await`: guardar `const campo = evento.target` al inicio de la función y usar `campo.value = ''`.)
- Antes del botón de envío: `{declaracion && <DeclaracionFoto texto={declaracion} marcada={declarada} onChange={setDeclarada} />}`.
- El botón de envío gana `disabled={Boolean(declaracion) && !declarada}`.

- [ ] **Step 4: `foto-miembro.tsx`**

Añadir a `<SubidaImagen …>`:

```tsx
      declaracion="Confirmo que el socio me entregó esta foto y tiene derecho a usarla."
      verificarCara
```

- [ ] **Step 5: Lint**

Run: `./node_modules/.bin/eslint.cmd src/components/imagenes "src/app/miembros/(portal)/perfil/foto" "src/app/admin/miembros/[id]/foto"` y tipos con el tsconfig temporal.
Expected: sin errores.

---

### Task 6: Retirada de la foto (solo `super_admin`)

**Files:**
- Modify: `src/app/admin/miembros/imagenes-actions.ts` (añadir `retirarFotoMiembro`)
- Create: `src/app/admin/miembros/[id]/foto/retirar/page.tsx`
- Create: `src/app/admin/miembros/[id]/foto/retirar/_components/retirar-foto-form.tsx`
- Create: `src/app/admin/@modal/(.)miembros/[id]/foto/retirar/page.tsx`
- Modify: `src/app/admin/miembros/[id]/page.tsx` (botón)

**Interfaces:**
- Consumes: `esMotivoRetirada`, `MOTIVOS_RETIRADA`, `ETIQUETA_MOTIVO`, `MotivoRetirada` (Task 1); `borrarObjeto`, `rutaDesdeUrlPublica` (`@/lib/imagenes/subir`); `registrarCambioImagen`; `BUCKET_AVATARES`.
- Produces: `retirarFotoMiembro(_prev: EstadoSubida, formData: FormData): Promise<EstadoSubida>` — campos `id` (miembro) y `motivo`.

- [ ] **Step 1: La acción**

Añadir al final de `src/app/admin/miembros/imagenes-actions.ts` (importar `esMotivoRetirada`, `borrarObjeto`, `rutaDesdeUrlPublica`):

```ts
/*
  RETIRAR LA FOTO DE UN SOCIO  ·  solo super_admin

  Es la mitad operativa del procedimiento de aviso y retirada. Decisión del
  propietario (30/09/2026): por ahora SOLO el administrador retira; los
  empleados pueden cambiar la foto pero no retirarla. La autorización real es
  esta, no que el botón se oculte.
*/
export async function retirarFotoMiembro(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') {
    return { error: 'Solo el administrador puede retirar fotos.' }
  }

  const motivo = formData.get('motivo')
  if (!esMotivoRetirada(motivo)) return { error: 'Elige un motivo de la lista.' }

  const miembroId = Number(formData.get('id'))
  if (!Number.isInteger(miembroId) || miembroId < 1) {
    return { error: 'Falta el identificador del miembro.' }
  }

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('id, foto_url')
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) return { error: 'El miembro ya no existe.' }
  if (!miembro.foto_url) return { error: 'Este miembro no tiene foto que retirar.' }

  // 1) La fila primero: si el borrado del archivo fallara, la foto ya no se
  //    muestra en ninguna parte y solo queda un objeto huérfano.
  const { error } = await admin
    .from('miembros')
    .update({ foto_url: null, foto_declaracion_at: null })
    .eq('id', miembroId)
  if (error) return { error: `No se pudo retirar la foto: ${error.message}` }

  // 2) El archivo, en TODAS las extensiones posibles (el formato pudo cambiar).
  for (const ext of ['png', 'jpg', 'webp']) {
    await borrarObjeto(admin, BUCKET_AVATARES, rutaFotoMiembro(miembroId, ext))
  }

  // 3) Rastro: quién, cuándo y por qué.
  await registrarCambioImagen(admin, {
    actorId: actor.userId,
    entidad: 'miembro',
    entidadId: miembroId,
    campo: 'foto_url',
    urlAnterior: miembro.foto_url,
    urlNueva: null,
    contexto: { accion: 'retirada', motivo },
  })

  revalidatePath('/admin/miembros')
  revalidatePath(`/admin/miembros/${miembroId}`)
  revalidatePath('/miembros/perfil')
  revalidatePath('/miembros', 'layout')
  return { ok: true, url: null }
}
```
(`rutaDesdeUrlPublica` no se usa: quitar ese import si se añadió.)

- [ ] **Step 2: El formulario**

```tsx
// src/app/admin/miembros/[id]/foto/retirar/_components/retirar-foto-form.tsx
'use client'

import { useActionState } from 'react'
import { Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/input'
import { useCerrarCuando } from '@/components/shell/overlay-ruta'
import { retirarFotoMiembro } from '@/app/admin/miembros/imagenes-actions'
import { ESTADO_SUBIDA_INICIAL } from '@/lib/imagenes/estado'
import { ETIQUETA_MOTIVO, MOTIVOS_RETIRADA } from '@/lib/imagenes/derechos'

export function RetirarFotoForm({ miembroId, nombre }: { miembroId: number; nombre: string }) {
  const [estado, accion, enviando] = useActionState(retirarFotoMiembro, ESTADO_SUBIDA_INICIAL)
  useCerrarCuando(estado.ok)

  return (
    <form action={accion}>
      <input type="hidden" name="id" value={miembroId} />
      <Alert tone="warning">
        Se borrará la foto de {nombre} y su carnet volverá a mostrar las iniciales. La acción
        queda registrada en la bitácora con el motivo.
      </Alert>
      <Field label="Motivo" error={estado.error ?? null}>
        <Select name="motivo" required defaultValue="">
          <option value="" disabled>
            Elige un motivo…
          </option>
          {MOTIVOS_RETIRADA.map((m) => (
            <option key={m} value={m}>
              {ETIQUETA_MOTIVO[m]}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" variant="primary" loading={enviando} icon={<Trash2 size={16} />}>
        Retirar foto
      </Button>
    </form>
  )
}
```
Antes de darlo por bueno, abrir `src/components/ui/field.tsx` y `src/components/ui/stack` (`layout.tsx`) y envolver los hijos en `<Stack>` si el resto de formularios del admin lo hace para el espaciado (seguir el patrón de `renovar-form.tsx`).

- [ ] **Step 3: Página completa y gemela interceptada**

```tsx
// src/app/admin/miembros/[id]/foto/retirar/page.tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { cargarFotoMiembro } from '../_components/datos'
import { RetirarFotoForm } from './_components/retirar-foto-form'

export const metadata = { title: 'Retirar foto · ORUM' }

export default async function RetirarFotoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const datos = await cargarFotoMiembro(Number(id))
  if (!datos || !datos.fotoUrl) notFound()

  return (
    <>
      <PageHeader title="Retirar foto" description={datos.nombre} />
      <FormCard>
        <RetirarFotoForm miembroId={datos.id} nombre={datos.nombre} />
      </FormCard>
    </>
  )
}
```

```tsx
// src/app/admin/@modal/(.)miembros/[id]/foto/retirar/page.tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { cargarFotoMiembro } from '@/app/admin/miembros/[id]/foto/_components/datos'
import { RetirarFotoForm } from '@/app/admin/miembros/[id]/foto/retirar/_components/retirar-foto-form'

export default async function RetirarFotoInterceptado({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id } = await params
  const datos = await cargarFotoMiembro(Number(id))
  if (!datos || !datos.fotoUrl) notFound()

  return (
    <OverlayRuta title="Retirar foto" description={datos.nombre} width="480px" detent="medium">
      <RetirarFotoForm miembroId={datos.id} nombre={datos.nombre} />
    </OverlayRuta>
  )
}
```

- [ ] **Step 4: El botón en la ficha**

En `src/app/admin/miembros/[id]/page.tsx`: la página ya llama `await requireRol('super_admin', 'empleado')` **sin guardar el resultado**; cambiar a `const actor = await requireRol('super_admin', 'empleado')`. Asegurar que la consulta del miembro trae `foto_url` (añadirlo al `select` si falta). Junto al botón «Cambiar foto», añadir:

```tsx
            {actor.rolCodigo === 'super_admin' && miembro.foto_url && (
              <Button
                href={`/admin/miembros/${miembro.id}/foto/retirar`}
                variant="secondary"
                icon={<Trash2 size={16} />}
              >
                Retirar foto
              </Button>
            )}
```
(importar `Trash2` de `lucide-react`).

- [ ] **Step 5: Reiniciar el servidor de desarrollo** (regla del proyecto: tras añadir rutas paralelas el manifiesto queda obsoleto y la interceptación falla en silencio).

- [ ] **Step 6: Lint y tipos** sobre lo tocado. Expected: sin errores.

---

### Task 7: Página de reclamos, cláusula en los Términos, pie y sitemap

**Files:**
- Create: `src/app/(publico)/derechos-de-autor/page.tsx`
- Modify: `src/app/(publico)/terminos/page.tsx`
- Modify: `src/components/pie/pie-sitio.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `configuracion.correo_reclamos` (Task 2); `PaginaLegal` (`../_components/pagina-legal`).

- [ ] **Step 1: La página**

```tsx
// src/app/(publico)/derechos-de-autor/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PaginaLegal } from '../_components/pagina-legal'

export const metadata: Metadata = {
  alternates: { canonical: '/derechos-de-autor' },
  title: 'Reclamos por derechos de autor · ORUM',
  description: 'Cómo reportar un contenido que infringe tus derechos de autor en ORUM.',
}

/*
  BORRADOR — pendiente de revisión legal (el abogado del propietario lo está
  revisando). No se publica hasta tener su visto bueno: el aviso de abajo se
  retira SOLO con esa confirmación.

  El correo sale de `configuracion.correo_reclamos` (alias de recepción de la
  cuenta del admin), igual que `whatsapp_soporte`, para cambiarlo sin desplegar.
*/
export default async function DerechosDeAutorPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'correo_reclamos')
    .maybeSingle()
  const correo = data?.valor?.trim() || null

  return (
    <PaginaLegal titulo="Reclamos por derechos de autor" actualizado="30 de septiembre de 2026">
      <section>
        <p>
          <strong>Borrador pendiente de revisión legal.</strong> Este texto puede cambiar antes
          de su publicación definitiva.
        </p>
      </section>

      <section>
        <h2>1. Qué puedes reportar</h2>
        <p>
          Los socios de ORUM pueden subir una foto a su perfil. Si eres titular de derechos
          sobre una imagen publicada en ORUM sin tu autorización, o actúas en nombre de quien lo
          es, puedes solicitar su retiro.
        </p>
      </section>

      <section>
        <h2>2. Qué debe incluir tu aviso</h2>
        <ul>
          <li>La obra protegida que consideras infringida y cómo acreditas tus derechos.</li>
          <li>La dirección (enlace) de la imagen en ORUM, o información suficiente para ubicarla.</li>
          <li>Tu nombre, dirección, teléfono y correo de contacto.</li>
          <li>
            Una declaración de que actúas de buena fe y de que la información del aviso es
            exacta.
          </li>
          <li>Tu firma o la de quien te representa.</li>
        </ul>
      </section>

      <section>
        <h2>3. Dónde enviarlo</h2>
        {correo ? (
          <p>
            Escribe a <a href={`mailto:${correo}`}>{correo}</a>.
          </p>
        ) : (
          <p>El canal de reclamos no está disponible en este momento. Vuelve a intentarlo pronto.</p>
        )}
      </section>

      <section>
        <h2>4. Qué hacemos al recibirlo</h2>
        <p>
          Revisamos el aviso y, si corresponde, retiramos la imagen con prontitud y avisamos a
          quien la subió. Quien crea que el retiro fue un error puede responder al mismo correo.
        </p>
      </section>

      <section>
        <h2>5. Infractores reincidentes</h2>
        <p>
          ORUM puede suspender las cuentas de quienes infrinjan derechos de autor de forma
          repetida.
        </p>
      </section>
    </PaginaLegal>
  )
}
```

- [ ] **Step 2: Cláusula en Términos**

En `src/app/(publico)/terminos/page.tsx`: insertar tras la sección `8. Propiedad intelectual` una sección nueva **`9. Contenido que subes`**:

```tsx
      <section>
        <h2>9. Contenido que subes</h2>
        <p>
          Al subir una foto a tu perfil declaras que eres quien aparece en ella y que tienes
          derecho a usarla, y nos autorizas a mostrarla en tu carnet. ORUM puede retirar un
          contenido ante un reclamo de derechos de autor o si incumple estos Términos, y puede
          suspender las cuentas con infracciones repetidas. Para reportar un contenido, consulta
          la página de{' '}
          <Link href="/derechos-de-autor">reclamos por derechos de autor</Link>.
        </p>
      </section>
```
Renumerar `9. Limitación…` → `10.`, `10. Terminación` → `11.`, `11. Modificaciones` → `12.`, `12. Ley aplicable` → `13.`, `13. Contacto` → `14.`. Importar `Link from 'next/link'`. Actualizar `actualizado="30 de septiembre de 2026"`. Añadir al comentario de cabecera: `Sección 9 (30/09/2026): borrador, pendiente de revisión del abogado.`

- [ ] **Step 3: Pie y sitemap**

En `pie-sitio.tsx`, dentro del `<nav aria-label="Legal">`, tras «Política de privacidad», añadir `<Link href="/derechos-de-autor" className={estilos.enlaceLegal}>Derechos de autor</Link>`. En `sitemap.ts`, en `PAGINAS_FIJAS` tras `/privacidad`: `{ ruta: '/derechos-de-autor', prioridad: 0.2 },`.

- [ ] **Step 4: Lint y tipos** sobre lo tocado. Expected: sin errores.

---

### Task 8: Verificación final

**Files:** ninguno (solo comprobación)

- [ ] **Step 1: Pruebas completas**

Run: `./node_modules/.bin/vitest.cmd run --reporter=dot`
Expected: todas pasan (las 366 previas + las nuevas de `derechos.test.ts`).

- [ ] **Step 2: Lint y tipos de todo lo tocado**, con el tsconfig temporal. Borrar el tsconfig temporal.

- [ ] **Step 3: Verificación manual en navegador real** (no se puede desde la automatización de esta máquina; pedir al propietario o usar su navegador):
  1. Socio: abrir «Carnet» → cambiar foto. Elegir una foto con una cara → el encuadre aparece; «Guardar foto» está apagado hasta marcar la casilla; al guardar, `foto_declaracion_at` queda con fecha (`select foto_declaracion_at from miembros where id = …`).
  2. Elegir una imagen sin cara (un logo) → mensaje «No detectamos una cara…» y no avanza. Elegir una con varias caras → «Detectamos varias caras…».
  3. Simular fallo de detección (bloquear `/mediapipe/*` en la pestaña de red de las DevTools) → la foto **sí** continúa.
  4. Enviar el formulario saltándose la casilla (quitar `disabled` en DevTools y borrar el campo) → el servidor responde «Confirma que…» y **no** cambia `foto_url`.
  5. Admin (`/admin/miembros/[id]/foto`): casilla y detección funcionan igual.
  6. Como `super_admin`: «Retirar foto» aparece solo con foto; abre como overlay encima de la ficha (`document.querySelector('dialog[open]')` con la ficha detrás); al confirmar, la ficha pierde la foto, el carnet muestra iniciales, la URL antigua deja de cargar (tardar ~1 min por la CDN) y `/admin/bitacora` muestra la retirada con su motivo.
  7. Como `empleado`: el botón **no** aparece, y abrir `/admin/miembros/[id]/foto/retirar` a mano redirige fuera.
  8. `/derechos-de-autor` muestra el correo; `/terminos` tiene la sección 9 y los enlaces; el pie y el sitemap incluyen la página. Vista móvil.
  9. **Correo:** enviar un mensaje de prueba a `derechos@cluborum.com` y confirmar que llega a la bandeja del admin.
  10. Anotar el peso real de `public/mediapipe/` y decírselo al propietario.

- [ ] **Step 4: Recordatorio al propietario** de que la página y la cláusula son borrador y **no deben publicarse** hasta el visto bueno del abogado (el aviso «Borrador pendiente de revisión legal» de la página se retira solo con esa confirmación).
