# Reorganización del proyecto: estructura de carpetas + kit de UI (diseño)

- **Fecha:** 2026-08-05
- **Estado:** Aprobado para planificación
- **Depende de:** Fases 1-4 (`main`, todas mergeadas)
- **No es una fase de producto** — es deuda técnica de organización/DRY sobre el código ya
  construido. No agrega funcionalidad ni cambia RF.

## 1. Objetivo

Dejar todo el proyecto (no solo el portal admin) organizado siguiendo buenas prácticas, a partir
de tres problemas identificados:

1. **Duplicación de UI:** 36 archivos `.tsx` bajo `src/app/admin` repiten a mano la misma
   estructura JSX (headers de listado, campos de formulario, tablas, estados vacíos, botones) con
   estilos inline sueltos encima de las clases `orum-*` de `globals.css`.
2. **Organización de archivos de ruta:** los componentes de formulario (`*-form.tsx`) están
   sueltos en la misma carpeta que `page.tsx`/`actions.ts`, sin usar la convención de carpetas
   privadas (`_folder`) que documenta Next.js para separar código no enrutable del enrutable.
3. **Organización del resto del proyecto:** `src/lib` es plano (un archivo por dominio) sin
   agrupar por feature, y la raíz del repo mezcla configuración con documentos de referencia del
   cliente (`Contexto_ORUM_txt`, `Esquema_BD.txt`, `Esquema_ORUM.png`).

Nota sobre (2) y (3): la [guía de Next.js](https://nextjs.org/docs/app/getting-started/project-structure)
solo es prescriptiva sobre el árbol de `app` (rutas). Para todo lo demás (`lib`, `components`,
organización de la raíz) es explícitamente **"unopinionated"** — lo de abajo son buenas prácticas
generales de ingeniería de software, no una convención de Next.js.

## 2. Alcance

**Dentro:**

- Todo `src/app/admin/**` (usuarios, miembros, comercios, sucursales, promociones, planes,
  bitácora, métricas, cuenta) — es donde vive la duplicación de UI.
- Construcción de `src/components/ui/` (kit de componentes compartidos).
- Reorganización de archivos existentes en `_components/` dentro de cada carpeta de ruta.
- Reorganización de `src/lib/**` en carpetas por dominio.
- Limpieza de la raíz del repo: mover documentos de referencia a `docs/`, eliminar assets
  estáticos sin usar.
- Pase de consistencia de naming en archivos de formulario.

**Fuera:**

- **URLs** — ninguna cambia. La anidación de rutas (`/admin/comercios/[id]/promociones/...`)
  refleja jerarquía real de datos (decisión tomada explícitamente con el usuario: se prefiere cero
  riesgo de romper enlaces sobre acortar paths).
- **Lógica de negocio** — el *comportamiento* de `actions.ts` y de las funciones en `src/lib/**`
  no cambia, solo su ubicación de archivo (ver §5).
- `globals.css` y las variables/clases `orum-*` — se siguen usando tal cual, solo que ahora
  detrás de componentes en vez de className repetido a mano.
- Portal público (`/`, `/login`) — su duplicación de UI es mínima (2-3 archivos), no justifica el
  esfuerzo del kit en esta pasada. Se puede alinear más adelante si crece.
- Specs/plans históricos en `docs/superpowers/`, `docs/ROADMAP.md` en sus secciones de fases ya
  cerradas — son registro histórico, no se reescriben (ver §6, solo se actualizan referencias de
  rutas que quedarían rotas).

## 3. Kit de componentes — `src/components/ui/`

Wrappers delgados sobre las clases `orum-*` existentes (sin cambio visual). Cada uno reemplaza un
patrón JSX que hoy se repite a mano:

| Componente | Reemplaza (ejemplo de origen) | Props clave |
|---|---|---|
| `PageHeader` | Bloque `<div style={{display:'flex', justifyContent:'space-between'}}><h1>...<Link className="orum-button">` en cada `page.tsx` de listado | `title`, `action?: { href, label }` |
| `Field` | `<div className="orum-field"><label className="orum-label">...<input className="orum-input">` en cada form | `label`, `htmlFor`, `children` |
| `Button` / `LinkButton` | `<button className="orum-button orum-button--...">` / `<Link className="orum-button...">` | `variant: 'primary'\|'secondary'\|'danger'`, resto de props nativas |
| `EmptyState` | Card "aún no hay X" en cada listado | `children` (mensaje) |
| `Badge` | `orum-badge orum-badge--on/off` | `tone: 'on'\|'off'`, `children` |
| `SearchForm` | `<form method="get" className="orum-card">` de búsqueda en cada listado | `name`, `placeholder`, `defaultValue` |
| `DataTable` | Wrapper `orum-card` (con `overflowX:auto`) + `orum-table` | `children` (thead/tbody ya armados por el caller) |
| `Row` / `Stack` | Los `style={{display:'flex', gap:'0.75rem'}}` / `flexDirection:'column'` sueltos (~20+ apariciones) | `gap?`, `children` |
| `Alert` | `orum-alert orum-alert--error/success` | `tone: 'error'\|'success'`, `children` |

No se crean componentes para casos usados una sola vez (ej. el bloque de "copiar contraseña" en
`comercio-form.tsx` / `usuario-form.tsx` / `miembro-form.tsx` es casi idéntico 3 veces — **si**
durante la implementación se confirma que es texto-por-texto igual, se extrae como
`PasswordReveal` dentro del kit; si no, se deja local).

## 4. Convención de carpetas por ruta

Regla simple, aplicada de forma consistente:

- **Se quedan en la raíz de la carpeta de ruta** (donde Next.js los espera): `page.tsx`,
  `layout.tsx`, `actions.ts`.
- **Bajan a `_components/`**: cualquier componente de formulario o UI local a esa ruta.
  - Si un componente se usa desde **una sola** subruta, vive en el `_components/` de esa
    subruta.
  - Si se comparte entre **varias subrutas hermanas** (ej. `promocion-form.tsx` usado por
    `promociones/nueva/` y `promociones/[promoId]/editar/`), sube a `_components/` en la carpeta
    padre común (`promociones/_components/`).

Ejemplo (`comercios`, antes → después):

```
admin/comercios/
  page.tsx                          # sin cambio
  actions.ts                        # sin cambio
  comercio-form.tsx                 → _components/comercio-form.tsx
  nuevo/page.tsx                    # sin cambio
  [id]/
    page.tsx                        # sin cambio
    editar/
      page.tsx                      # sin cambio
      editar-comercio-form.tsx      → _components/editar-comercio-form.tsx
    promociones/
      promocion-form.tsx            → _components/promocion-form.tsx   (compartido por nueva/ y [promoId]/editar/)
      nueva/page.tsx                # sin cambio
      [promoId]/editar/page.tsx     # sin cambio
    sucursales/
      sucursal-form.tsx             → _components/sucursal-form.tsx    (compartido por nueva/ y [sucursalId]/editar/)
      nueva/page.tsx                # sin cambio
      [sucursalId]/editar/page.tsx  # sin cambio
```

### 4.1 Mapeo completo (todas las entidades)

| Archivo actual | Nuevo path |
|---|---|
| `comercios/comercio-form.tsx` | `comercios/_components/comercio-form.tsx` |
| `comercios/[id]/editar/editar-comercio-form.tsx` | `comercios/[id]/editar/_components/editar-comercio-form.tsx` |
| `comercios/[id]/promociones/promocion-form.tsx` | `comercios/[id]/promociones/_components/promocion-form.tsx` |
| `comercios/[id]/sucursales/sucursal-form.tsx` | `comercios/[id]/sucursales/_components/sucursal-form.tsx` |
| `cuenta/password/password-form.tsx` | `cuenta/password/_components/password-form.tsx` |
| `miembros/miembro-form.tsx` | `miembros/_components/miembro-form.tsx` |
| `miembros/[id]/editar/editar-miembro-form.tsx` | `miembros/[id]/editar/_components/editar-miembro-form.tsx` |
| `miembros/[id]/renovar-form.tsx` | `miembros/[id]/_components/renovar-form.tsx` |
| `planes/plan-form.tsx` | `planes/_components/plan-form.tsx` |
| `usuarios/[id]/editar/editar-form.tsx` | `usuarios/[id]/editar/_components/editar-usuario-form.tsx` (renombrado por consistencia, ver §4.2) |
| `usuarios/nuevo/usuario-form.tsx` | `usuarios/nuevo/_components/usuario-form.tsx` |

Todos los `page.tsx`, `layout.tsx` y `actions.ts` (12 archivos) permanecen en su ubicación
actual — solo cambian los `import` que apuntaban a los forms movidos.

### 4.2 Naming pass

`usuarios/[id]/editar/editar-form.tsx` es el único form de edición que no incluye el nombre de la
entidad (comparar con `editar-comercio-form.tsx`, `editar-miembro-form.tsx`). Se renombra a
`editar-usuario-form.tsx` al moverlo, y su export (`EditarForm` → `EditarUsuarioForm`) y el único
import que lo consume (`usuarios/[id]/editar/page.tsx`) se actualizan junto con el move.

## 5. Reorganización de `src/lib/`

`src/lib` pasa de plano a carpetas por dominio, reflejando los mismos límites de negocio que ya
existen en `src/app/admin/**` (miembros, comercios, etc.). Cada `.test.ts` viaja junto a su
archivo, igual que hoy (colocación de tests: sin cambios de convención, solo de ubicación).

| Archivo actual | Nuevo path |
|---|---|
| `lib/auth.ts` | `lib/auth/auth.ts` |
| `lib/bitacora.ts` + `.test.ts` | `lib/bitacora/bitacora.ts` + `.test.ts` |
| `lib/membresias.ts` + `.test.ts` | `lib/miembros/membresias.ts` + `.test.ts` |
| `lib/metricas.ts` + `.test.ts` | `lib/metricas/metricas.ts` + `.test.ts` |
| `lib/promociones.ts` + `.test.ts` | `lib/comercios/promociones.ts` + `.test.ts` |
| `lib/password.ts` | `lib/shared/password.ts` |
| `lib/supabase/**` (5 archivos) | Sin cambios — ya es su propia carpeta de dominio (integración con Supabase transversal a todos los demás). |

Notas:

- `lib/miembros/` y `lib/comercios/` quedan como el punto natural donde caerán las funciones
  puras de las fases futuras (Portal de Miembros, Herramienta de Comercios) en vez de seguir
  agregando archivos sueltos a la raíz de `lib/`.
- `password.ts` (genera contraseñas temporales) es usado por comercios, miembros y usuarios por
  igual — no pertenece a un dominio, va a `lib/shared/`.
- Todos los imports (`@/lib/auth`, `@/lib/membresias`, `@/lib/promociones`, etc.) cambian a la
  nueva ruta; `tsc` marca cualquiera que quede desactualizado.

## 6. Limpieza de la raíz del repo

| Acción | Detalle |
|---|---|
| Mover `Contexto_ORUM_txt` → `docs/referencia/Contexto_ORUM.txt` | Se le agrega extensión `.txt` correcta de paso (el original no la tenía). |
| Mover `Esquema_BD.txt` → `docs/referencia/Esquema_BD.txt` | — |
| Mover `Esquema_ORUM.png` → `docs/referencia/Esquema_ORUM.png` | — |
| Actualizar referencias rotas | `docs/ROADMAP.md` (líneas 16-17, links relativos) y el comentario de cabecera de `src/lib/supabase/database.types.ts` (línea 9, menciona "`Esquema_BD.txt` en la raíz del proyecto"). Las menciones dentro de specs/plans **históricos** (`docs/superpowers/specs/2026-07-*`, `docs/superpowers/plans/2026-07-*`) no se tocan — son registro de lo que existía en ese momento. |
| Eliminar `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Assets por defecto del scaffold de `create-next-app`. Verificado: ningún archivo en `src/` los referencia — nunca se reemplazaron por branding de ORUM. |

## 7. Orden de migración

Para que sea revisable en pasos chicos y no un cambio masivo de una sola vez:

1. **Limpieza de raíz** (§6) — mover los 3 documentos de referencia, actualizar las 2 referencias
   activas, borrar los SVG sin usar. Cero riesgo, cero dependencias de lo demás; se hace primero
   y por separado.
2. **`src/lib/` por dominio** (§5) — mueve archivos y actualiza imports en todo `src/app`. Se hace
   antes que la reorganización de `src/app/admin` para no tener dos tandas de cambios de import
   superpuestas sobre los mismos archivos.
3. **Construir el kit** (`src/components/ui/`) usando **comercios** como módulo de referencia:
   migrar `comercios/page.tsx`, `comercios/comercio-form.tsx`,
   `comercios/[id]/page.tsx`, `comercios/[id]/editar/*`, `.../promociones/*`,
   `.../sucursales/*` a la vez, aplicando el kit + la reorganización de carpetas juntas (es el
   módulo con más variedad de patrones: listado, form de creación, ficha, sub-recursos).
4. **Miembros** (listado, form, ficha con historial + renovación, editar).
5. **Planes, Usuarios (incluye el naming pass de §4.2), Cuenta** (módulos más simples, mismo
   patrón ya validado).
6. **Bitácora y Métricas** — estas páginas no tienen `_components` que mover (son solo
   `page.tsx`), pero sí adoptan el kit (`PageHeader`, `DataTable`, `EmptyState`) para consistencia
   visual con el resto.
7. **`admin/layout.tsx`** — el header/nav con estilos inline también pasa a usar `Row`/`Stack`
   del kit al final, una vez que existen.

Cada paso es commiteable de forma independiente.

## 8. Verificación

No hay tests automatizados de UI en el proyecto (los `*.test.ts` cubren solo funciones puras de
`src/lib`); esa no cambia con este trabajo. La red de seguridad, igual que en fases anteriores:

- `tsc` limpio y `pnpm build` OK después de cada paso del orden de migración (§7).
- `pnpm test` sigue en 41/41 después de mover `src/lib/**` (§5) — mover archivos no debe cambiar
  ningún resultado, solo rutas de import.
- `pnpm lint` sin nuevos errores.
- Revisión visual manual en navegador por el usuario **por módulo migrado** (no al final de
  todo): mismo look-and-feel que antes, sin regresiones funcionales (formularios siguen
  enviando/validando igual, links siguen navegando igual).

## 9. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Cambiar sin querer el comportamiento de un form (ej. perder un `required`, un `defaultValue`, un `name` de input) durante el traslado a componentes | Migración módulo por módulo con verificación visual intermedia (§8), no todo de una vez |
| El kit termina siendo una abstracción prematura si algún patrón "compartido" en realidad tiene variaciones sutiles por entidad | Se construye el kit contra el caso real de `comercios` primero (paso 3 de §7) antes de generalizar a las demás entidades; si un patrón no encaja limpio en un componente genérico, se deja local en vez de forzarlo |
| Imports rotos tras mover archivos (`_components/` o `lib/<dominio>/`) | Cambio mecánico y de bajo riesgo: `tsc` lo detecta inmediato si algo queda roto |
| Referencia rota a `Esquema_BD.txt`/`Contexto_ORUM_txt` en algún lugar no detectado por el grep hecho para este diseño | `tsc`/build no detectan links markdown rotos; se hace una búsqueda de texto (`grep`) del nombre viejo en `docs/` y `src/` como paso explícito de verificación al mover (§6) |

## 10. Criterios de aceptación

- [ ] Existe `src/components/ui/` con los componentes de la tabla §3, usados por al menos el
      módulo `comercios` completo.
- [ ] Todos los `*-form.tsx` (11 archivos, tabla §4.1) están movidos a `_components/` según la
      regla de §4, con sus imports actualizados; `usuarios/.../editar-form.tsx` quedó renombrado
      (§4.2).
- [ ] Ningún archivo `page.tsx`, `layout.tsx` o `actions.ts` cambió de ubicación ni de ruta
      pública.
- [ ] `src/lib/` está organizado por dominio según la tabla §5, sin cambiar el comportamiento de
      ninguna función.
- [ ] La raíz del repo ya no tiene `Contexto_ORUM_txt`, `Esquema_BD.txt` ni `Esquema_ORUM.png`
      (viven en `docs/referencia/`); `public/` ya no tiene los SVG del scaffold sin usar.
- [ ] `docs/ROADMAP.md` y `database.types.ts` apuntan a la nueva ubicación de los documentos de
      referencia; ninguna referencia rota queda en código o docs vivos.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm test` (41/41) y `pnpm build` pasan limpio al final de
      cada paso del orden de migración.
- [ ] Revisión visual del usuario confirma que cada módulo migrado se ve y funciona igual que
      antes.
- [ ] `bitacora` y `metricas` usan el kit (`PageHeader`, `DataTable`, `EmptyState`) aunque no
      tuvieran archivos que reorganizar.

## 11. Tareas previas (antes de construir)

Ninguna. Es un refactor puro sobre código ya existente en `main`; no depende de datos, migraciones
ni de ninguna fase pendiente.
