# Reorganización del portal Admin: kit de UI + estructura de archivos (diseño)

- **Fecha:** 2026-08-05
- **Estado:** Aprobado para planificación
- **Depende de:** Fases 1-4 (`main`, todas mergeadas)
- **No es una fase de producto** — es deuda técnica de organización/DRY sobre el portal admin ya
  construido. No agrega funcionalidad ni cambia RF.

## 1. Objetivo

Dos problemas señalados por el usuario tras revisar la [guía oficial de estructura de proyecto de
Next.js](https://nextjs.org/docs/app/getting-started/project-structure):

1. **Duplicación de UI:** 36 archivos `.tsx` repiten a mano la misma estructura JSX (headers de
   listado, campos de formulario, tablas, estados vacíos, botones) con estilos inline sueltos
   encima de las clases `orum-*` de `globals.css`.
2. **Organización de archivos:** los componentes de formulario (`*-form.tsx`) están sueltos en la
   misma carpeta que `page.tsx`/`actions.ts`, sin usar la convención de carpetas privadas
   (`_folder`) que documenta Next.js para separar código no enrutable del enrutable.

## 2. Alcance

**Dentro:**

- Todo `src/app/admin/**` (users, miembros, comercios, sucursales, promociones, planes, bitácora,
  métricas, cuenta) — es donde vive toda la duplicación.
- Construcción de `src/components/ui/` (kit de componentes compartidos).
- Reorganización de archivos existentes en `_components/` dentro de cada carpeta de ruta.

**Fuera:**

- **URLs** — ninguna cambia. La anidación de rutas (`/admin/comercios/[id]/promociones/...`)
  refleja jerarquía real de datos (decisión tomada explícitamente con el usuario: se prefiere cero
  riesgo de romper enlaces sobre acortar paths).
- **Lógica de negocio** — `actions.ts`, `src/lib/**`, esquema de BD: sin cambios.
- `globals.css` y las variables/clases `orum-*` — se siguen usando tal cual, solo que ahora
  detrás de componentes en vez de className repetido a mano.
- Portal público (`/`, `/login`) — su duplicación es mínima (2-3 archivos), no justifica el
  esfuerzo en esta pasada. Se puede alinear al kit más adelante si crece.

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
| `usuarios/[id]/editar/editar-form.tsx` | `usuarios/[id]/editar/_components/editar-form.tsx` |
| `usuarios/nuevo/usuario-form.tsx` | `usuarios/nuevo/_components/usuario-form.tsx` |

Todos los `page.tsx`, `layout.tsx` y `actions.ts` (12 archivos) permanecen en su ubicación
actual — solo cambian los `import` que apuntaban a los forms movidos.

## 5. Orden de migración

Para que sea revisable en pasos chicos y no un cambio masivo de una sola vez:

1. **Construir el kit** (`src/components/ui/`) usando **comercios** como módulo de referencia:
   migrar `comercios/page.tsx`, `comercios/comercio-form.tsx`,
   `comercios/[id]/page.tsx`, `comercios/[id]/editar/*`, `.../promociones/*`,
   `.../sucursales/*` a la vez, aplicando el kit + la reorganización de carpetas juntas (es el
   módulo con más variedad de patrones: listado, form de creación, ficha, sub-recursos).
2. **Miembros** (listado, form, ficha con historial + renovación, editar).
3. **Planes, Usuarios, Cuenta** (módulos más simples, mismo patrón ya validado).
4. **Bitácora y Métricas** — estas páginas no tienen `_components` que mover (son solo
   `page.tsx`), pero sí adoptan el kit (`PageHeader`, `DataTable`, `EmptyState`) para consistencia
   visual con el resto.
5. **`admin/layout.tsx`** — el header/nav con estilos inline también pasa a usar `Row`/`Stack`
   del kit al final, una vez que existen.

Cada paso es commiteable de forma independiente.

## 6. Verificación

No hay tests automatizados de UI en el proyecto (los `*.test.ts` cubren solo funciones puras de
`src/lib`); esa no cambia con este trabajo. La red de seguridad, igual que en fases anteriores:

- `tsc` limpio y `pnpm build` OK después de cada paso del orden de migración (§5).
- `pnpm lint` sin nuevos errores.
- Revisión visual manual en navegador por el usuario **por módulo migrado** (no al final de
  todo): mismo look-and-feel que antes, sin regresiones funcionales (formularios siguen
  enviando/validando igual, links siguen navegando igual).

## 7. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Cambiar sin querer el comportamiento de un form (ej. perder un `required`, un `defaultValue`, un `name` de input) durante el traslado a componentes | Migración módulo por módulo con verificación visual intermedia (§6), no todo de una vez |
| El kit termina siendo una abstracción prematura si algún patrón "compartido" en realidad tiene variaciones sutiles por entidad | Se construye el kit contra el caso real de `comercios` primero (§5.1) antes de generalizar a las demás entidades; si un patrón no encaja limpio en un componente genérico, se deja local en vez de forzarlo |
| Imports rotos tras mover archivos a `_components/` | Cambio mecánico y de bajo riesgo: `tsc` lo detecta inmediato si algo queda roto |

## 8. Criterios de aceptación

- [ ] Existe `src/components/ui/` con los componentes de la tabla §3, usados por al menos el
      módulo `comercios` completo.
- [ ] Todos los `*-form.tsx` (11 archivos, tabla §4.1) están movidos a `_components/` según la
      regla de §4, con sus imports actualizados.
- [ ] Ningún archivo `page.tsx`, `layout.tsx` o `actions.ts` cambió de ubicación ni de ruta
      pública.
- [ ] `tsc --noEmit`, `pnpm lint` y `pnpm build` pasan limpio al final de cada módulo migrado.
- [ ] Revisión visual del usuario confirma que cada módulo migrado se ve y funciona igual que
      antes.
- [ ] `bitacora` y `metricas` usan el kit (`PageHeader`, `DataTable`, `EmptyState`) aunque no
      tuvieran archivos que reorganizar.

## 9. Tareas previas (antes de construir)

Ninguna. Es un refactor puro sobre código ya existente en `main`; no depende de datos, migraciones
ni de ninguna fase pendiente.
