# Reporte de pruebas — Recorrido de los 3 portales + fix F1

- **Fecha:** 2026-09-02
- **Entorno:** deployment de Vercel `orum-project-test-6pktyeojg-juan-vel23-dev.vercel.app`
  (acceso vía bypass de Deployment Protection). El fix se verificó además en `pnpm dev` local.
- **Herramienta:** Playwright (navegador de escritorio; tema Auto por defecto, algunas capturas en Oscuro).
- **Credenciales:** `Usuarios Pruebas PlayWright.txt`.
- **Capturas:** en esta carpeta (`.playwright-mcp/recorrido-3-portales/`), 40 archivos numerados por portal y paso.

Clasificación de cada hallazgo:

- 🟥 **FUNCIONAL** — bug de comportamiento; requiere cambio de código.
- 🟧 **PRODUCTO / IA** — requiere una decisión de producto o una limpieza de arquitectura de información.
- 🟦 **VISUAL** — cosmético; no cambia ninguna función.
- ⬜ **BLOQUEADO / INFO** — no se pudo probar con los datos disponibles.

| # | Tipo | Título | Estado |
|---|---|---|---|
| F1 | 🟥 Funcional | Los overlays no cierran (Cancelar / éxito / `redirect()`) | ✅ **Resuelto y verificado** |
| F2 | 🟧 Producto/IA | «Mi contraseña» listado dos veces en `/admin` | ⛔ Abierto |
| P1 | 🟧 Producto | Niveles de membresía («Premium») visibles al miembro | ⛔ Abierto |
| V1 | 🟦 Visual | Botón circular recortado en el borde derecho | ⛔ Abierto (probable Vercel Toolbar) |
| V2 | 🟦 Visual | Copy redundante en «Crear usuario» | ✅ Resuelto (al descartar el revert de contraseña) |
| V3 | 🟦 Visual | Warning de consola por preload de fuente | ⛔ Abierto (benigno) |
| B1 | ⬜ Bloqueado | Vista de miembro con membresía vencida | ⬜ Sin credenciales |

---

## 🟥 F1 — Los overlays interceptados no se cierran · ✅ RESUELTO

### Síntoma

En **los seis** formularios que viven en un overlay de ruta interceptada (`@modal`)
—registrar miembro, crear comercio, crear usuario, nueva sucursal, nueva promoción,
y todos los «editar»— el overlay **no se cerraba**:

- Al pulsar **«Cancelar»**, la URL volvía a la lista pero el overlay seguía montado
  encima, vacío. (`diag-01`)
- Al **crear con éxito** una sucursal o promoción, el registro se guardaba (aparecía
  en la tabla de detrás) pero el overlay quedaba montado como formulario vacío;
  ✕ / Escape / «Cancelar» no lo quitaban, solo una recarga. (`comercio-04`, `comercio-05`, `comercio-08`)
- Escape a veces movía la URL *hacia adelante* (`/…/nueva`) y hacían falta **dos**
  pulsaciones. (`diag-02`)
- Cerrar el overlay **sin enviar** sí funcionaba (`comercio-16`) → el fallo estaba
  en las vías de salida, no en la interceptación.

### Causa raíz (en el código)

El overlay interceptado solo se desmonta con `router.back()` y con el historial
limpio. Todas las demás salidas dejaban una entrada de historial hacia adelante y
no vaciaban la ranura `@modal`:

- **Los botones `<Button href>`** de los formularios («Cancelar», «Ir a la lista»,
  «Registrar/Crear otro») son navegación `<Link>` hacia adelante.
- **El `redirect()` del servidor** al final de `crearSucursal`, `editarSucursal`,
  `crearPromocion`, `editarPromocion`, `crearPlan`, `editarPlan`, `editarComercio`,
  `editarUsuario`, `editarMiembro` — y `renovarMembresia` devolvía `{}`, así que la
  hoja de renovación tampoco se cerraba nunca.

Los tres formularios de creación (miembro/comercio/usuario) no reventaban visualmente
porque muestran una pantalla de credenciales tras el éxito, pero su «Ir a la lista»
tenía el mismo `<Link>` roto.

### Fix aplicado (17 archivos, sin commitear)

1. **`src/components/shell/overlay-ruta.tsx`** — nuevo primitivo:
   - `useCerrarOverlay()` → el único cierre correcto: `router.back()` (no-op fuera de un overlay).
   - `useCerrarCuando(state.ok)` → cierra al terminar la acción, con guardia `useRef`
     para no llamar `router.back()` dos veces (React estricto reejecuta el efecto en
     dev y saltaba dos entradas — detectado y corregido durante la prueba).
   - `OverlayRuta` reparte el cierre por contexto.
2. **Server actions** — `redirect(<padre>)` → `return { ok: true }` (se mantiene
   `revalidatePath`; intactos los `redirect` de auth y de los `cambiarEstado*` void).
   Añadido `ok?: boolean` a `SucursalState`, `PromocionState`, `PlanState`,
   `EditarComercioState`, `EditarUsuarioState`, `EditarMiembroState`, `RenovarState`.
   Import de `redirect` ya sobrante eliminado en `miembros/actions.ts`.
3. **Formularios (10)** — «Cancelar» pasa de `<Button href>` a `onClick={cerrar}`;
   edición/renovación/sucursal/promoción/plan añaden `useCerrarCuando(state.ok)`;
   los de creación cierran con `cerrar` y «Crear otro» reinicia el formulario en
   sitio (`key`), sin navegar.

### Verificación (dev local)

| Caso | Antes | Ahora |
|---|---|---|
| «Cancelar» en overlay de creación | quedaba abierto | cierra en 1 clic ✅ (`fix-01`) |
| Crear sucursal | overlay vacío atascado | cierra solo, vuelve a la ficha, sucursal visible ✅ (`fix-02`) |
| Editar comercio (tenía `redirect()`) | atascado / 2× Escape | cierra solo a la ficha ✅ (`fix-03`) |

`pnpm exec tsc --noEmit` · `pnpm lint` · `pnpm test` (115) · `pnpm build` → todo en verde.

Los caminos de la pantalla de éxito («Ir a la lista» / «Crear otro») quedan
cubiertos por `tsc` + `build` + revisión de código; no probados en vivo para no
crear miembros/comercios de usar y tirar.

---

## 🟧 F2 — «Mi contraseña» aparece dos veces en la misma pantalla · ⛔ ABIERTO

**Corrección respecto al reporte inicial:** cuando se llega **haciendo clic** (no por
URL directa), `/admin/cuenta/password` **sí abre como overlay interceptado**
(`diag-03`). El «es página completa» del primer reporte fue un falso positivo por
navegar a la URL directamente (que es el fallback correcto para enlaces compartidos).

Lo que **sí** sigue siendo un problema: en `/admin` la acción «Mi contraseña» está
enlazada **dos veces en la misma pantalla** — en el menú del avatar *y* como tarjeta
fija en la sección «Accesos». `CLAUDE.md` lo describe como el error exacto a evitar:

> «si una acción se hace y se cierra, no merece un sitio fijo… la misma acción
> listada dos veces en la misma pantalla.»

**Qué haría falta:** quitar la entrada de la tarjeta «Accesos» (dejarla solo en el
menú del avatar) y, según `CLAUDE.md`, comprobar la hoja «Más» en móvil, donde no
hay menú de avatar. Cambio pequeño, pero de código.

Capturas: `admin-01-inicio.png`, `admin-13-menu-cuenta.png`, `diag-03-mi-contrasena-desde-accesos.png`.

---

## 🟧 P1 — Hay «niveles» de membresía («Premium») visibles para el miembro · ⛔ ABIERTO

`/admin/planes` tiene un plan **«Premium»** ($500, 2 meses). El carnet del miembro
(`/miembros/perfil`) y la pantalla de verificación del comercio muestran **«Premium»**
junto al nombre de Daniel Usaquen.

`CLAUDE.md`: «Un solo producto: la membresía mensual. No hay niveles ni planes
premium. El estado de un miembro es binario: paga o no paga.»

La UI de planes («Crear plan», duración configurable) indica que el sistema **sí**
soporta niveles. **Decisión de producto:** eliminar el concepto, o actualizar
`CLAUDE.md`. Mientras tanto, el nivel se le muestra al miembro y al comercio.

Capturas: `admin-11-planes.png`, `miembro-02-perfil.png`, `comercio-11-membresia-verificada.png`.

---

## 🟦 V1 — Botón circular recortado en el borde derecho · ⛔ ABIERTO

Botón circular (icono tipo credencial/lista) pegado al borde derecho, **cortado por
el viewport**, en varias pantallas de admin y del portal de comercios. Muy
probablemente la **Vercel Toolbar** del preview y no de la app — conviene
confirmarlo; si es de la aplicación, reposicionarlo.

Capturas: p. ej. `admin-06-comercio-detalle.png`, `comercio-10-verificar-con-sucursal.png`.

---

## 🟦 V2 — Copy redundante en «Crear usuario» · ✅ RESUELTO

El overlay «Crear usuario» decía a la vez «La contraseña se genera automáticamente»
(encabezado) y «se envía un correo con un enlace de un solo uso» (pie). Ese doble
mensaje venía de los cambios sin commitear que revertían a «contraseña en pantalla».
Al **descartar ese revert** (ver abajo), el copy vuelve a ser una sola frase de
invitación por enlace. Ya no aplica.

---

## 🟦 V3 — Warning de consola por preload de fuente · ⛔ ABIERTO (benigno)

En todas las páginas: `The resource …83afe278…woff2 was preloaded using link preload
but not used within a few seconds…`. No afecta a la funcionalidad. Se corrige
ajustando el `preload`/`as` de esa fuente o se ignora si es intencional. **0 errores
de consola** en todo el recorrido.

---

## ⬜ B1 — Vista de miembro con membresía vencida · ⬜ SIN CREDENCIALES

No hay credenciales de un miembro **inactivo/vencido**, así que el Portal de Miembros
en ese estado no se pudo ver (solo el rechazo desde el lado del comercio,
`comercio-14`). Los dos miembros de prueba (`00031324`, `00044150`) están activos.

---

## Cambio hecho: fuera la pantalla de contraseña temporal

Había 6 archivos con cambios sin commitear que revertían la invitación por enlace a
«generar contraseña y mostrarla en pantalla» (comentario *«TEMPORAL fase de
pruebas»*). Se **descartaron** (`git checkout` de los 6) y se **borró el huérfano**
`src/lib/shared/password.ts`. Vuelve el flujo de invitación por enlace de HEAD, y el
fix F1 se montó sobre esas versiones.

Nota: `MAILERSEND_API_KEY` / `MAILERSEND_FROM_EMAIL` **no** están en el entorno de
Vercel todavía (va a cambiar), así que los correos de invitación no saldrán hasta
configurarlas. Onboarding de usuarios reales en pausa hasta entonces.

---

## Verificado OK (sin acción)

- **Accesos:** los 3 logins y los 3 logouts. Rutas agrupadas: `/login` (admin),
  `/miembros/login` (Nº de membresía), `/comercios/login` (correo).
- **Overlays de alta** (miembro / comercio / usuario): abren como ruta interceptada
  (diálogo centrado, lista atenuada detrás). Ninguno pide contraseña → invitación
  por enlace aplicada en los tres.
- **Estado de membresía** derivado correctamente: «Activa» + «Vence en N días»
  (ámbar, secundario); «Inactiva · vencida» con texto además del color.
- **QR** negro sobre blanco en tema claro y oscuro.
- **Tema** Auto / Claro / Oscuro en los 3 portales.
- **Flujo completo del Portal de Comercios** (con sucursal + promoción creadas):
  | Caso | Resultado |
  |---|---|
  | Sin sucursal activa | Empty state «Sin sucursales activas» |
  | Con sucursal | Aparece el formulario de verificación |
  | Miembro activo (`00031324`) | Datos + «Membresía activa» + formulario de venta |
  | Promoción aplicada | Descuento y valor final calculados solos («Ahorra $10.000») |
  | Registrar venta | «Venta registrada» |
  | Miembro vencido (`00029417`) | «Membresía inactiva», **sin** formulario de venta |
  | Número inexistente (`99999999`) | Alerta «No se encontró un miembro con ese número» |
- **Propagación de datos:** la venta de prueba se refleja en **Métricas** (Ventas por
  comercio, Uso de la membresía, Ahorro entregado $20.000 → $30.000).
- Métricas, Bitácora, Planes, fichas de miembro y de comercio: renderizan sin errores.

---

## Datos de prueba creados en el deployment (para limpieza)

- **Comercio 8 «Comercio de prueba # nose»** (`pruebacomercio@comercio.com`):
  - Sucursal **«Sede Prueba QA»** — Calle 100 #15-20, 3001234567, Bogotá.
  - Sucursal **«Sede Fix QA»** — Bogotá. ⚠️ Quedó **duplicada** (dos filas): una del
    primer intento de la prueba del fix, antes de añadir la guardia anti-doble
    `router.back()`. Conviene borrar una.
  - Promoción **«20% en toda la carta»** — Descuento por porcentaje, 20%.
- **1 venta de prueba:** miembro `00031324`, valor $50.000, promo 20%, valor final $40.000.
- No se creó ningún usuario nuevo.

---

## Índice de capturas

### Recorrido inicial de los 3 portales
| Archivo | Contenido |
|---|---|
| `admin-01-inicio.png` | Panel `/admin` (nota: «Mi contraseña» en «Accesos») |
| `admin-02-miembro-nuevo-overlay.png` | Overlay «Registrar miembro» (sin contraseña) |
| `admin-03-miembro-detalle.png` | Ficha de miembro (Activa + «Vence en 30 días») |
| `admin-04-comercios.png` | Lista de comercios |
| `admin-05-comercio-nuevo-overlay.png` | Overlay «Crear comercio» (invita por enlace) |
| `admin-06-comercio-detalle.png` | Ficha de comercio (2 estados independientes) |
| `admin-07-metricas.png` | Métricas (antes de la venta de prueba) |
| `admin-08-bitacora.png` | Bitácora de actividad |
| `admin-09-usuario-nuevo-overlay.png` | Overlay «Crear usuario» |
| `admin-10-usuarios-lista.png` | Lista de usuarios |
| `admin-11-planes.png` | Planes (incluye «Premium») |
| `admin-12-password.png` | «Mi contraseña» abierta por URL directa (fallback a página) |
| `admin-13-menu-cuenta.png` | Menú del avatar (con «Mi contraseña») |
| `admin-14-metricas-con-venta.png` | Métricas tras la venta de prueba |
| `miembro-01-inicio.png` | Portal de Miembros — «Comercios y beneficios» |
| `miembro-02-perfil.png` | Carnet del miembro (claro) — muestra «Premium» |
| `miembro-03-perfil-oscuro.png` | Carnet del miembro (oscuro) — QR sigue negro/blanco |
| `comercio-01-verificar.png` | Portal de Comercios — sin sucursal activa |
| `comercio-02-menu.png` | Menú del comercio (solo «Cerrar sesión») |

### Flujo del comercio (sucursal + promoción + venta) y evidencia de F1
| Archivo | Contenido |
|---|---|
| `comercio-03-nueva-sucursal-overlay.png` | Overlay «Nueva sucursal» |
| `comercio-04-sucursal-creada.png` / `-04b-…` | **F1**: overlay atascado tras crear |
| `comercio-05-ficha-con-sucursal.png` | **F1**: overlay sigue tras «Cancelar» |
| `comercio-06-ficha-sucursal-ok.png` | Ficha limpia tras recargar (sucursal OK) |
| `comercio-07-nueva-promocion-overlay.png` | Overlay «Nueva promoción» |
| `comercio-08-tras-crear-promocion.png` | **F1**: mismo atasco con promoción |
| `comercio-09-ficha-completa.png` | Ficha con sucursal + promoción (tras recargar) |
| `comercio-10-verificar-con-sucursal.png` | Formulario de verificación disponible |
| `comercio-11-membresia-verificada.png` | Miembro activo + formulario de venta |
| `comercio-12-venta-calculada.png` | Cálculo automático de descuento / valor final |
| `comercio-13-venta-registrada.png` | Confirmación «Venta registrada» |
| `comercio-14-membresia-vencida.png` | Miembro vencido → sin venta |
| `comercio-15-membresia-inexistente.png` | Número inválido → alerta de error |
| `comercio-16-cerrar-sin-enviar.png` | Overlay cierra bien si NO se envía (aísla F1) |

### Diagnóstico y verificación del fix F1
| Archivo | Contenido |
|---|---|
| `diag-01-miembro-cancelar.png` | **F1**: «Cancelar» deja el overlay abierto |
| `diag-02-miembro-tras-2-escape.png` | Hacen falta 2 Escape para cerrarlo |
| `diag-03-mi-contrasena-desde-accesos.png` | «Mi contraseña» abre como overlay al hacer clic (corrige F2) |
| `fix-01-miembro-cancelar-cierra.png` | ✅ «Cancelar» cierra en 1 clic |
| `fix-02-sucursal-creada-cierra.png` | ✅ Crear sucursal cierra solo y vuelve a la ficha |
| `fix-03-editar-comercio-cierra.png` | ✅ Editar comercio cierra solo a la ficha |
