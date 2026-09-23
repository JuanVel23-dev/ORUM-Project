# Spec UX: Rediseño de la Herramienta de Comercios (`/comercios`)
> ux-designer · 13/09/2026 · rama `mejora-diseno`
>
> Base: `CLAUDE.md`, `API-CONTRACT.md` (28/08), `SPEC-pantallas-miembros.md` v2 (01/09),
> `T4-direccion-arte.md` (31/08), `AUDIT-movil-2026-09-13.md`, `AUDIT-a11y-2026-09-13.md`,
> y el código real de `src/app/comercios/**`. `graphify-out/` no se ha leído.
>
> **Esta spec no escribe código.** Su único artefacto es este archivo.

---

## 0. Quién lo usa, y por qué eso descarta media spec antes de empezar

Un cajero **de pie**, con el cliente delante, a veces con mala luz, a veces con el
celular del cliente en la otra mano. El portal tiene **un solo destino**: verificar
una membresía y registrar la venta. No hay navegación que inventar, no hay
segunda pestaña, no hay historial que mostrar aquí (eso es fuera de alcance, ver
«Lo que no entra»).

Consecuencia de diseño que gobierna todo lo demás: **en cada pantalla hay una
sola decisión posible**, nunca dos ofrecidas a la vez. Hoy el reposo ya casi lo
cumple (un campo + dos botones); el formulario de venta no (seis controles a la
vez). Esta spec reordena para que en todo momento el cajero sepa qué toca a
continuación sin tener que decidir por dónde empezar.

### 0.1 Relación con la API — qué no puede cambiar

Del contrato (`API-CONTRACT.md` §1.5, §2.4):

- `buscarMiembro` solo devuelve `{ id, nombreCompleto, numeroMembresia, vigente, membresiaId, planNombre }`.
  **No hay `fecha_fin` ni `motivo`**: el portal no puede decir «vencida» vs
  «cancelada» vs «suspendida», solo `vigente: true/false`. Toda la spec respeta
  esto — ver §5.3.
- `registrarVenta` recalcula el descuento en servidor; lo que viaja del
  formulario es informativo. El diseño puede mostrarlo, no depender de él.
- **No existe ninguna acción de anulación o reversa de venta.** Ver §8 y
  «Propuestas para backend».
- No hay `ToastProvider` fuera de `/admin`: ningún estado de esta spec usa
  `useToast()`. La confirmación de éxito vive en la propia tarjeta, no en un
  toast flotante — además es más legible «a un metro» que una notificación
  esquinada.

---

## 1. El flujo completo, con conteo de toques

### 1.1 Hoy (verificado en código)

```
/comercios/login ──▶ /comercios (REPOSO)
                          │
        ┌─────────────────┼─────────────────┐
        │ toca "Escanear   │ toca el campo    │
        │  QR" (1)         │  y escribe       │
        ▼                  ▼
   cámara abre        teclea 8 dígitos
        │ apunta al QR     │
        │ (detecta solo,   │
        │  NO envía)       │
        ▼                  ▼
   toca "Verificar" (1)  toca "Verificar" (1)
        └─────────────────┬─────────────────┘
                           ▼
                     RESULTADO (automático)
                           │ si vigente, aparece el
                           │ formulario de venta (automático)
                           ▼
              toca Promoción (1) · toca Sucursal si hay >1 (1)
              toca "Valor de la compra" y escribe
              [«Descuento» es de solo lectura pero enfocable:
               un toque accidental abre teclado y tapa el total — DEFECTO]
                           ▼
                  toca "Registrar venta" (1)
                           ▼
                   VENTA REGISTRADA
                           ▼
              toca "Verificar otro miembro" (1) ──▶ vuelve a REPOSO
```

**Toques mínimos, caso feliz, QR, una sucursal, sin promoción:**
Escanear (1) + Verificar (1) + Valor de la compra (1) + Registrar (1) +
Verificar otro (1) = **5 toques**. Con promoción: **6**. Con selector de
sucursal (>1 sede): **7**.

### 1.2 Propuesto

```
/comercios/login ──▶ /comercios (REPOSO)
   Un solo botón primario: «Escanear código QR».
   Debajo, en texto: «¿No puedes escanear? Escribe el número»
        │                              │
        │ toca "Escanear QR" (1)       │ toca el enlace (1) → aparece
        ▼                              │ el campo con foco YA puesto
   cámara abre                         ▼
        │ apunta al QR            escribe 8 dígitos
        │ detecta ⇒ ENVÍA SOLO         │ (envía solo al completar
        │ (0 toques extra)             │  el 8.º dígito; el botón
        ▼                              │  "Buscar" sigue visible
   BUSCANDO (automático)               │  como alternativa siempre)
        └──────────────┬───────────────┘
                        ▼
                  RESULTADO (automático, banner grande)
                        │ si vigente, aparece el formulario de venta
                        ▼
        (si hay >1 sucursal) toca Sucursal (1)
        toca "Valor de la compra" y escribe — el total se ve al instante
        (si aplica promoción) toca Promoción (1)
        «Descuento»: texto si es automático (0 toques posibles),
                      campo real solo si el cajero debe tasarlo (1)
                        ▼
        toca "Cobrar $45.000" (1)  ← el botón lee el total en su propio texto
                        ▼
                VENTA REGISTRADA (con el monto y la hora, para poder
                reclamar un error después)
                        ▼
        toca "Verificar otro miembro" (1) ──▶ vuelve a REPOSO
        (o se reinicia solo a los 6 s si el cajero no toca nada)
```

**Toques mínimos, caso feliz, QR, una sucursal, sin promoción:**
Escanear (1) + Valor de la compra (1) + Cobrar (1) + Verificar otro (1) =
**4 toques** (–20% frente a hoy). Con promoción: **5**. Y el toque de
«Verificar otro» se vuelve opcional si se acepta el reinicio automático
temporizado (§7.5) — en ese caso, **3 toques** para todo el ciclo.

**De dónde sale la reducción**: (a) el QR ya no exige un «Verificar» aparte
—se busca en cuanto se detecta un código válido—, (b) el número manual se
busca solo al completar 8 dígitos, con el botón «Buscar» de respaldo, y (c) el
botón final lee el total, así que no hace falta mirar dos veces para
confirmar antes de tocar.

---

## 2. El cromo

### 2.1 Lo que se mantiene (ya es correcto)

- **Sin barra inferior ni navegación.** El comentario de `portal.module.css:1-8`
  lo explica bien y sigue siendo cierto: un destino, no dos.
- Cabecera pegajosa con wordmark ORUM (barrido dorado, `background-clip: text`,
  ya correcto) y nombre del comercio operando.
- El menú del avatar como única puerta a tema/soporte/salir.

### 2.2 ▲ Hallazgo SERIO (audit-movil #1): zona segura superior

`.cabecera` no reserva `env(safe-area-inset-top)`. Con `statusBarStyle:
'black-translucent'` y `viewport-fit: cover` (globales, `layout.tsx`), un
cajero que agregue `/comercios` a su pantalla de inicio en iOS ve el
wordmark y el nombre del comercio **bajo la barra de estado**.

> **Requisito**: replicar exactamente el patrón ya resuelto en
> `app-shell.module.css:414` y en el Portal de Miembros:
> `padding-top: max(var(--space-3), env(safe-area-inset-top, 0px))` en
> `.cabecera`. Y por el hallazgo #5: `.cabecera` y `.main` reciben también
> `padding-inline: max(<relleno actual>, env(safe-area-inset-left/right, 0px))`,
> porque en horizontal sobre un dispositivo con muesca el formulario de venta
> puede quedar bajo el bisel. El manifest fija `orientation: portrait`, pero
> eso no ata al navegador suelto (fuera de PWA instalada).

### 2.3 ▲ Menú del avatar: mismo idioma que Miembros, sin duplicar código

Hoy `ThemeToggle` (un `SegmentedControl`) vive suelto en la cabecera, junto
al avatar — dos controles, dos objetivos táctiles compitiendo por espacio en
una cabecera que ya aloja el nombre del comercio (que se trunca con
`text-overflow: ellipsis`).

**Cambio**: el conmutador de tema baja al menú del avatar, igual que ya
resolvió el Portal de Miembros (`miembros/(portal)/layout.tsx:76`,
`_components/menu-tema.tsx`). La cabecera de Comercios se queda con **un
solo control**: el avatar. Más espacio para el nombre del comercio, menos
objetivos que un pulgar pueda rozar por error de pie en la caja.

> **No se duplica el componente.** `MenuTema` ya existe y ya resuelve la
> trampa real (`SegmentedControl` son `<input type="radio">`; dentro de un
> `<form action={cerrarSesionComercio}>`, Enter sobre un radio dispara la
> submisión implícita — cerraría la sesión). Como ahora lo usan **dos**
> portales, deja de ser un componente de ruta: se mueve de
> `src/app/miembros/(portal)/_components/menu-tema.tsx` a
> `src/components/theme/menu-tema.tsx` (junto a `theme-toggle.tsx` y
> `theme-provider.tsx`, que ya viven ahí), actualizando el único import de
> Miembros y agregando el de Comercios. Cero componentes nuevos.

### 2.4 El oro en este portal — sin cambios de fondo

`CLAUDE.md` es explícito: en la Herramienta de Comercios **el primario es
tinta**, siempre. Esta spec no introduce ningún `Button variant="brand"`
dentro de `(portal)`. Los únicos oros del árbol después del rediseño:

| Dónde | Ya existe / se mantiene |
|---|---|
| Wordmark ORUM en la cabecera | Ya existe, sin cambios |
| Anillo de `:focus-visible` | Global, sin cambios |
| Esquinas de la mira del escáner (`--gold-400`) | Ya existe — es marca sobre una superficie ajena (la imagen de cámara), igual que `QrCode`. Se mantiene |
| Hairlines de tarjeta | Los que ya trae `Card` por defecto |

`Card variant="brand"` **no se usa aquí**: T4 la reserva a una superficie por
producto (carnet + tarjeta de acceso). Meterla en el resultado del socio
competiría por la misma escasez que la hace valer.

---

## 3. PANTALLA — Reposo (`/comercios`)

### 3.1 Objetivo

Que el cajero, mirando de reojo mientras atiende, sepa en cuánto tiempo qué
tocar: escanear.

### 3.2 Layout — móvil (el canónico; de pie, una mano)

```
┌────────────────────────────────────────┐
│ ORUM              Panadería Central (A)│ cabecera, con safe-area
├────────────────────────────────────────┤
│  Verificar membresía                ①  │ h1
│  Escanea el carnet del socio o       │ ②  lede
│  escribe su número.                   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │      📷  Escanear código QR      │  │ ③ botón ÚNICO primario,
│  └──────────────────────────────────┘  │    tinta, size="lg", fullWidth
│                                        │
│         ¿No puedes escanear?          │ ④ enlace de texto, terciario
│          Escribe el número            │
└────────────────────────────────────────┘
```

1. **`h1` «Verificar membresía»** — se mantiene (`PageHeader`).
2. **Lede** — reescrita para nombrar las dos rutas sin mostrarlas todavía:
   «Escanea el carnet del socio o escribe su número.»
3. **Botón primario único**: «Escanear código QR», `variant="primary"`
   (tinta), `size="lg"`, `fullWidth`, icono de cámara. Es la ruta más rápida y
   la que usa la mayoría de las ventas (el carnet lleva el QR); por eso es la
   que se ve primero y sola.
4. **Salida secundaria**: un enlace de texto (no un segundo botón grande —
   dos botones grandes compitiendo violaría la regla de una acción primaria
   por pantalla). Al tocarlo, revela el campo numérico con foco puesto de
   inmediato (ver §5).

**Por qué no mostrar el campo numérico siempre visible, como hoy**: hoy el
campo va primero y sin `autoFocus`; si se le pusiera `autoFocus` para ahorrar
un toque, Android dispara el teclado al cargar la página (audit-movil #3,
mismo defecto que en el login de Miembros) y tapa el botón «Escanear QR» en
pantallas cortas. Ocultarlo detrás de un gesto explícito permite dar
`autoFocus` real (después de un toque del usuario, nunca al cargar) sin ese
riesgo, y deja la pantalla de reposo con una sola pieza que leer.

### 3.3 Layout — tableta y escritorio

**Idéntico al móvil**, tarjeta centrada `max-width: 420px`. Es una
herramienta de un solo paso operada con el pulgar; ensancharla no reduce
ningún toque ni aporta una segunda columna con algo real que mostrar (no hay
historial, no hay lista — eso es fuera de alcance). Punto de ruptura: no
aplica, no hay reflow que decidir.

### 3.4 Los ocho estados

| Estado | Cuándo | Qué se muestra | Copy | Acciones |
|---|---|---|---|---|
| **Inicial** | Siempre que se entra a `/comercios` sin acción en curso | El layout de §3.2 | «Verificar membresía» / «Escanea el carnet del socio o escribe su número.» | Escanear QR · Escribir el número |
| **Cargando** | No aplica a esta pantalla en sí — la carga es de página (Server Component). Ver §3.5 | — | — | — |
| **Carga parcial** | No aplica: sin sucursales activas o sin promociones, la pantalla ya resuelve del lado servidor antes de pintar (ver `page.tsx`) | — | — | — |
| **Éxito** | — | No aplica: el reposo no tiene un resultado propio, transiciona a Búsqueda | — | — |
| **Vacío tras filtro** | No aplica: no hay filtros en esta pantalla | — | — | — |
| **Error recuperable** | Falla la conexión al buscar (ver §4/§5) | Se resuelve en el paso siguiente, no en reposo | — | — |
| **Error fatal** | Excepción no capturada en el render de la página | Falta un `error.tsx` — ver §3.6 | — | — |
| **Sin permiso** | Sesión sin rol `comercio` o inactiva | `requireRolComercio()` ya redirige a `/comercios/login` antes de pintar nada | — | — |

### 3.5 Estados ya resueltos en el `page.tsx` actual (se conservan)

- **Cuenta sin comercio asociado**: `EmptyState` con icono de alerta. Copy
  actual correcto, se mantiene: «Cuenta sin comercio asociado» / «Esta cuenta
  no está vinculada a ningún comercio. Escribe al administrador del club para
  que la conecte.»
- **Sin sucursales activas**: `EmptyState`, se mantiene: «Sin sucursales
  activas» / «Una venta se registra siempre contra una sucursal, y este
  comercio no tiene ninguna activa. Escribe al administrador del club.»

### 3.6 ▲ Falta un `error.tsx` — hallazgo nuevo

`API-CONTRACT.md` §3 ya lo señala: `/comercios` no tiene `error.tsx`. Una
excepción no capturada en el Server Component (`page.tsx`) deja al cajero en
la pantalla de error genérica de Next, sin wordmark, sin salida reconocible,
en medio de una venta.

> **Requisito**: `src/app/comercios/(portal)/error.tsx`, mismo patrón que
> `src/app/admin/error.tsx` — `ErrorState` con título «Algo no salió bien»,
> descripción «No pudimos cargar la herramienta. Vuelve a intentarlo.», y un
> botón que llama a `reset()` de Next. Sin salida a ningún otro sitio: aquí no
> hay «otro sitio» al que mandar al cajero, solo reintentar.

---

## 4. El escáner QR

### 4.1 Encuadre e instrucciones (se mantiene el diseño actual, correcto)

Visor cuadrado (`aspect-ratio: 1`), mira con esquinas doradas (`--gold-400`,
justificado como marca sobre superficie ajena), fondo oscurecido fuera del
recuadro. Instrucción bajo el visor: «Apunta al código del carnet del
miembro.» Esto ya funciona y no se toca.

### 4.2 ▲ Cambio de comportamiento: detectar = enviar

Hoy `onDetectado` solo rellena el campo y cierra la cámara; el cajero debe
tocar «Verificar» aparte. **Se retira ese paso**: al detectar un código con
formato válido (8 dígitos), la búsqueda se dispara de inmediato, sin depender
de un toque adicional. Vibración corta (`toque()` de `haptica.ts`) en el
instante de la detección, para que el cajero sepa que «agarró» el código
sin tener que mirar la pantalla todavía (regla de causalidad de
`haptica.ts`: se dispara en el evento que la causa, en el mismo fotograma).

Si el valor leído **no** tiene 8 dígitos (un QR ajeno, mal enfocado), la
búsqueda sigue disparándose igual y el servidor devuelve el mismo error de
validación que ya existe («Ingresa un número de membresía válido (8
dígitos).»); no hace falta duplicar esa regla en el cliente.

### 4.3 Estados del escáner

| Estado | Cuándo | Qué se muestra | Copy | Acciones |
|---|---|---|---|---|
| **Abriendo** | El chunk del escáner (`dynamic import`) está en vuelo | `Spinner` + texto, ya existe | «Abriendo la cámara…» | — |
| **Encuadrando** | Cámara activa, sin detección aún | Visor + mira + instrucción | «Apunta al código del carnet del miembro.» | Cerrar (X) |
| **Detectado** | Se leyó un código | Vibración breve, la cámara se cierra y pasa a Buscando (§5.4) | — | — |
| **▲ Sin respuesta a los 10 s** | Pasaron 10 s sin detección | La instrucción cambia de tono, sin cerrar la cámara | «¿No logras enfocarlo? Acércate más o **escribe el número**» (el último tramo es un enlace) | Seguir intentando · Escribir el número |
| **▲ Permiso denegado** | `getUserMedia` rechaza por permiso | La vista de cámara se reemplaza por un `Alert tone="warning"`, **nunca desaparece en silencio** (defecto actual: `onError` solo cierra sin avisar) | «No pudimos acceder a la cámara. Actívala en los ajustes del navegador o escribe el número.» | Escribir el número |
| **▲ Sin cámara en el dispositivo** | El navegador no reporta ningún dispositivo de video | Mismo tratamiento visual que el anterior | «Este dispositivo no tiene cámara. Escribe el número del carnet.» | Escribir el número |
| **▲ Cámara ocupada por otra app** | `NotReadableError` | Mismo tratamiento | «La cámara está siendo usada por otra aplicación. Ciérrala o escribe el número.» | Escribir el número |
| **Error genérico de cámara** | Cualquier otro fallo, o si la librería no distingue el motivo | Mismo tratamiento | «No pudimos abrir la cámara. Escribe el número del carnet.» | Escribir el número |

> **Nota de implementación, no de producto**: si `@yudiel/react-qr-scanner`
> no expone `error.name` (`NotAllowedError` / `NotFoundError` /
> `NotReadableError`) a través de su prop `onError`, se usa directamente la
> fila «Error genérico de cámara» para los tres casos. Lo que **no** es
> aceptable en ninguna rama es el comportamiento actual: cerrar la cámara sin
> decir nada — un cajero que denegó el permiso sin querer no tiene forma de
> saber por qué «no pasó nada».

En **todas** las ramas de error de cámara, tocar «Escribir el número» hace
exactamente lo mismo que el enlace de reposo (§3.2④): revela el campo con
foco puesto.

### 4.4 Verificación pendiente (deuda ya anotada, se hereda)

`AUDIT-movil-2026-09-13.md` #7: sin confirmar en dispositivo real que el
`aspect-ratio: 1` no recorte el QR en cámaras de FOV distinto. Esta spec no
lo resuelve —es una prueba física, deuda conocida #3 de `CLAUDE.md`— pero fija
el requisito: si se recorta, el visor pasa a `aspect-ratio: 4/3` antes que a
`cover` (que mutilaría el encuadre exactamente igual que mutila un logo).

---

## 5. Búsqueda por número

### 5.1 Cambio principal: enviar solo, con salida siempre visible

Al tocar «Escribe el número» (reposo) o «Escribir el número» (cualquier
error de cámara), aparece el campo con `autoFocus` real —seguro aquí porque
nace de un gesto explícito, no de la carga de la página (N2/audit-movil #3
solo aplica a `autoFocus` **al cargar**)—.

> **Requisito**: al completar el octavo dígito, el formulario se envía
> automáticamente. El botón «Buscar» permanece visible y funcional en todo
> momento —no es la única vía—, y el campo lleva un texto de ayuda
> permanente que anuncia el comportamiento antes de que ocurra: «Se busca
> automáticamente al completar el número.» Esto es lo que exige WCAG 2.2 al
> cambiar de contexto por un cambio de valor (3.2.2): advertirlo antes, no
> ejecutarlo como sorpresa. Un teclado externo, un gestor de contraseñas que
> autocompleta, o alguien que pega el número desde otra app siguen teniendo
> el botón como vía explícita.

### 5.2 Layout — móvil

```
┌────────────────────────────────────────┐
│  Número de membresía                    │
│  Está bajo el código del carnet.        │
│  ┌────────────────────────────────────┐ │
│  │ 00012345                          │ │  ≥16px, inputMode="numeric"
│  └────────────────────────────────────┘ │
│  Se busca automáticamente al completar  │  ← texto de ayuda permanente
│  el número.                             │
│  ┌────────────────────────────────────┐ │
│  │             Buscar                  │ │  secundario mientras se escribe;
│  └────────────────────────────────────┘ │  pasa a loading al enviar
└────────────────────────────────────────┘
```

Se conserva de hoy: `type="text"` + `inputMode="numeric"` (no `type="number"`,
que descartaría los ceros a la izquierda del número de membresía — esto ya
estaba bien).

### 5.3 Los ocho estados (del formulario de búsqueda, QR o número)

| Estado | Cuándo | Qué se muestra | Copy | Acciones |
|---|---|---|---|---|
| **Inicial** | Antes de cualquier búsqueda | Ver §3.2/§5.2 | — | — |
| **Buscando** | Acción en vuelo (QR detectado o número completo) | `Button` con `loading` (ya deshabilita y pone `aria-busy`); si viene de QR, la cámara ya se cerró y aparece un bloque `Spinner` + texto en su lugar | «Verificando…» | — (doble envío ya resuelto por construcción) |
| **Carga parcial** | No aplica: la búsqueda es una sola llamada, no hay partes | — | — | — |
| **Éxito — encontrado** | `state.miembro` presente | Pasa a §6 | — | — |
| **No encontrado** | El servidor no encuentra el número | `Alert tone="danger"` sobre el propio formulario, con vibración de error (`error()` de `haptica.ts`) | «No encontramos ese número. Revisa el carnet e inténtalo de nuevo.» | Reintentar (queda el campo listo para escribir de nuevo) |
| **Número mal formado** | Menos/más de 8 dígitos, atrapado por el propio input o devuelto por el servidor | Igual que hoy, `Alert tone="danger"` | «Ingresa un número de membresía válido (8 dígitos).» | Corregir y reintentar |
| **Error de red/servidor** | `error` de Supabase al llamar la RPC | `Alert tone="danger"` | «No pudimos verificar el miembro. Revisa tu conexión e inténtalo de nuevo.» | Reintentar (mismo botón) |
| **Sin permiso** | La sesión perdió el rol o expiró entre acciones | `requireRolComercio()` dentro de la Server Action redirige a `/comercios/login` | — | — |

**No existe «vacío tras filtro»**: no hay filtro, cada búsqueda es un intento
nuevo. Se anota por qué no aplica, según pide la plantilla.

---

## 6. La tarjeta de resultado — el momento de la verdad

### 6.1 El problema del diseño actual

`resultado-miembro.tsx` usa `Badge` genérico (`AUDIT-a11y` #9): funciona
(tiene texto, no depende solo del color) pero es **pequeño** — pensado para
una fila de tabla, no para leerse «a un metro, de un vistazo, con el pulgar
tapando parte de la pantalla». El nombre va en `--t-title-1` (correcto) pero
el estado, que es la pieza que decide si se cobra o no, es la más chica de la
tarjeta.

### 6.2 Rediseño: banner de veredicto a todo el ancho

```
┌──────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ●  MEMBRESÍA ACTIVA                  ┃ │ ① banner, ancho completo,
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │   fondo --success-bg, punto LLENO
│                                          │
│  María Fernanda Ortiz                    │ ② --t-title-1, lo primero
│  N.º 00012345                            │    que lee el ojo tras el color
│  Plan Esencial                           │ ③ --t-footnote
└──────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ○  MEMBRESÍA INACTIVA                ┃ │ punto HUECO, fondo --danger-bg
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ atenuado
│                                          │
│  Carlos Andrés Ríos                      │
│  N.º 00099887                            │
│  No apliques el beneficio. El socio      │ ④ el motivo NO se puede dar
│  puede reactivarla con el club.          │   (la API no lo entrega, §0.1)
└──────────────────────────────────────────┘
```

**Jerarquía, en orden de lectura del ojo**: ① el color y la forma del punto
(lleno/hueco) se perciben antes que cualquier letra — es el semáforo; ② el
nombre, para confirmar que es la persona que tiene el carnet en la mano; ③ el
plan, dato de contexto; ④ si es inactiva, la instrucción de qué hacer.
**El número de membresía baja de posición** respecto de hoy: es para cotejar
contra el carnet si hay duda, no la primera lectura.

**Por qué un banner y no un `Badge` más grande**: un `Badge` es una etiqueta
que acompaña a otro contenido; aquí el estado **es** el contenido principal
de la primera mitad de la tarjeta. Ampliar `StatusBadge` en tamaño no
alcanza: necesita ocupar el ancho completo con su propio color de fondo para
leerse a un metro con el pulgar tapando una esquina. Es una composición local
del banner (fondo `--success-bg`/`--danger-bg`, radio `--radius-sm`, franja
superior de la tarjeta), no un componente nuevo de `ui/` — vive en
`resultado-miembro.tsx` con una clase nueva en `verificar.module.css`, igual
que hoy ya hace con `.veredicto`.

### 6.3 ▲ `StatusBadge` no puede usarse tal cual — conflicto con el contrato

El hallazgo #9 de `AUDIT-a11y` pide migrar a `StatusBadge`. **No es
directamente posible**: `StatusBadge` exige `estado: EstadoDerivado`
(`{ activa: true, diasRestantes } | { activa: false, motivo }`), y la única
fuente de datos de este portal —`buscar_miembro_comercio`— solo entrega
`vigente: boolean` (§0.1). No hay `motivo` ni `diasRestantes` que envolver en
un `EstadoDerivado` falso sin inventar datos que no existen.

> **Lo que sí se puede y se pide**: heredar el **patrón visual**, no la
> firma de tipos — punto lleno/hueco, texto «Activa»/«Inactiva», nunca solo
> color. Requiere una pieza que acepte un booleano plano. Dos caminos, a
> decidir por `design-system-architect`:
> 1. `StatusBadge` gana una segunda forma de invocarse: `estado:
>    EstadoDerivado | { vigente: boolean }`, y cuando es booleano omite el
>    texto de motivo (que no tiene). Reutiliza el mismo componente en los dos
>    portales.
> 2. El banner de veredicto se construye local a Comercios reutilizando solo
>    el **icono** de punto lleno/hueco (`badge.module.css` ya define
>    `.punto`/`.puntoHueco`) sin pasar por `StatusBadge`.
>
> Esta spec fija el **comportamiento** (texto + forma, nunca solo color;
> «Activa»/«Inactiva» sin tercer estado; sin motivo cuando no se conoce); la
> decisión de si eso se logra ampliando `StatusBadge` o componiendo aparte es
> de `design-system-architect`, no de esta spec.

### 6.4 Los ocho estados

| Estado | Cuándo | Qué se muestra | Copy | Acciones |
|---|---|---|---|---|
| **Inicial** | Sin búsqueda todavía | La tarjeta no se renderiza (no hay «resultado vacío» que mostrar de más) | — | — |
| **Cargando** | Cubierto en §5.3 (Buscando) | — | — | — |
| **Carga parcial** | No aplica: el resultado llega completo o no llega | — | — | — |
| **Éxito — activa** | `miembro.vigente === true` | Banner verde, punto lleno, nombre, número, plan | «Membresía activa» | El formulario de venta aparece debajo, automático |
| **Éxito — inactiva** | `miembro.vigente === false` | Banner rojo atenuado, punto hueco, nombre, número | «Membresía inactiva» / «No apliques el beneficio. El socio puede reactivarla con el club.» | Ninguna — no hay venta que ofrecer. El cajero busca otro número o cierra el resultado |
| **Vacío tras filtro** | No aplica | — | — | — |
| **Error recuperable** | Cubierto en §5.3 (no encontrado / error de red) | — | — | — |
| **Sin permiso** | Cubierto en §5.3 | — | — | — |

**Feedback háptico**: `exito()` no aplica aquí (se reserva a la venta
registrada, que es el verdadero final feliz); en el hallazgo de inactiva se
dispara `error()` — es la señal de «no, no se puede cobrar el beneficio», y
debe sentirse distinta de un fallo de red.

---

## 7. El formulario de venta

### 7.1 Los dos defectos diagnosticados, resueltos

**(a) «Descuento» de solo lectura pero enfocable (audit-movil #2, SERIO).**
Se deja de usar `<input readOnly>` para el caso automático. El campo pasa a
tener dos formas según el tipo de promoción, nunca las dos mezcladas:

| Tipo de promoción | Qué es «Descuento» | Foco / teclado |
|---|---|---|
| `porcentaje` / `monto_fijo` (se calcula solo) | **Texto, no `<input>`.** Vive dentro del mismo `Field`, con el mismo alto y borde que un campo para que la rejilla no salte, pero es un `<p>`/`<span>` sin `tabIndex`, sin cursor. `aria-live="polite"`: cambia solo al escribir el valor de la compra, y quien usa lector de pantalla necesita enterarse sin buscarlo | Ninguno — no se puede tocar, así que no hay teclado que abrir por error |
| `dos_por_uno` / `regalo` (lo tasa el cajero) | `<input>` real, editable | Se abre el teclado numérico al tocarlo, como cualquier campo — es correcto porque aquí sí hay algo que escribir |
| Sin promoción | Texto fijo «$0» | Ninguno |

**(b) `type="number"` en los importes (audit-movil #4, MODERADO).** Se
reemplaza en `valor_compra` y en el `Descuento` editable por
`type="text" inputMode="numeric" pattern="[0-9]*"` — el mismo patrón que ya
usa hoy el campo de número de membresía (`Input numeric` +
`inputMode="numeric"`), que en Android da el teclado numérico puro, sin
`+`/`-`/`,` ni spinners parásitos que un pulgar puede tocar sin querer.

### 7.2 Cómo se teclea el importe

- El valor visible se formatea con separador de miles mientras se escribe
  (`45.000`, convención `es-CO`), para que el cajero vea de un vistazo si se
  le fue un cero.
- El valor que viaja en el `FormData` sigue siendo el entero limpio (sin
  puntos) — se transporta en un campo oculto, igual que ya hace este
  formulario con `miembro_id`/`membresia_id`. La visibilidad formateada y el
  dato que se envía son cosas separadas a propósito.
- **Se escribe siempre añadiendo al final**, como una calculadora o un
  datáfono: cada dígito se agrega a la derecha, retroceder borra el último.
  No se admite mover el cursor al medio del número — es el patrón que ya
  conoce cualquiera que haya usado una caja registradora, y evita que un
  cursor invisible bajo el pulgar produzca un número mal armado.
- El campo de «Valor de la compra» se ve **más grande** que un campo
  normal —tamaño `--t-title-2`, cifras tabulares, alineado a la derecha—: es
  el número que más se mira en toda la pantalla, después del veredicto.

**Por qué no un teclado numérico propio en pantalla** (se consideró y se
descarta): un teclado a medida (nueve botones grandes + borrar) daría control
total sobre el tamaño de los objetivos, pero exige construir y **probar en
dispositivo real** un componente que reemplaza al teclado del sistema, y esa
prueba física es justo la deuda conocida #3 de `CLAUDE.md` que hoy no se
puede saldar en esta máquina. Arreglar `type` e `inputMode` da el 90% del
beneficio (teclado limpio, sin spinners) por una fracción del riesgo. Si en
producción se confirma que el teclado del sistema sigue dando problemas en
alguna gama de Android, ahí sí se justifica construirlo — no antes.

### 7.3 Layout — móvil

```
┌────────────────────────────────────────┐
│  (Sucursal, SOLO si el comercio         │  Select nativo — se omite
│   tiene más de una activa)              │  entero si hay solo una
│  ┌──────────────────────────────────┐  │
│  │ Selecciona una sucursal        ▾ │  │
│  └──────────────────────────────────┘  │
│                                          │
│  Valor de la compra                     │
│  ┌──────────────────────────────────┐  │
│  │                          45.000  │  │  grande, alineado a la derecha
│  └──────────────────────────────────┘  │
│                                          │
│  Promoción aplicada                     │
│  ┌──────────────────────────────────┐  │
│  │ Almuerzo ejecutivo — 20% ▾        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  Descuento                              │
│  ┌──────────────────────────────────┐  │
│  │ $9.000                       (i) │  │  texto, NO enfocable — «Lo
│  └──────────────────────────────────┘  │  calcula la promoción»
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Valor final           $36.000  │  │  franja aparte, --surface-sunk
│  └──────────────────────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │      Cobrar $36.000              │  │  primario, tinta, lee el total
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### 7.4 Layout — tableta y escritorio

**Sucursal y Promoción** pueden ir lado a lado a partir de `contenido ≥
420px` (ya lo hace la rejilla de hoy, `verificar.module.css:18,140`, se
conserva). **Valor de la compra, Descuento y el total siguen siendo de ancho
completo en todos los anchos**: son la cifra que se dice en voz alta, y
dividir la atención en columnas no ahorra ningún toque en una pantalla que
ya cabe entera sin desplazar. Punto de ruptura: `@container contenido
(max-width: 420px)`, el que ya existe — no se inventa uno nuevo.

### 7.5 El botón de confirmar: dónde vive y qué dice

- **Posición**: al final del formulario, tras el total, en el flujo normal
  del documento — no flotante. Con el teclado del sistema abierto sobre
  «Valor de la compra», el total y el botón pueden quedar bajo el teclado;
  se resuelve con `enterkeyhint="done"` en ese campo, para que el cajero
  cierre el teclado desde la propia tecla de retorno sin tener que ir a
  buscar un botón que no ve. **Se recomienda además** anclar el bloque
  Total+botón con `position: sticky; bottom: 0` dentro de la tarjeta, para
  que quede visible al desplazar — con la salvedad de que este patrón debe
  **verificarse en dispositivo real** (algunos navegadores Android no
  recalculan el `sticky` contra el viewport visual cuando el teclado está
  abierto); si falla, se retira y se deja solo `enterkeyhint`.
- **Copy dinámico**: el botón dice «Registrar venta» mientras no hay un
  valor de compra válido, y pasa a **«Cobrar $36.000»** en cuanto lo hay. Es
  la última oportunidad de que el cajero vea el número exacto antes de
  irreversible (ver §8) — repetirlo en el propio botón es la clase de
  detalle que la regla 4 de `CLAUDE.md` pide.

### 7.6 Los ocho estados

| Estado | Cuándo | Qué se muestra | Copy | Acciones |
|---|---|---|---|---|
| **Inicial** | El veredicto llegó «activa» | Formulario con «Valor de la compra» vacío, botón dice «Registrar venta» (deshabilitado o simplemente inerte hasta que haya un valor) | — | — |
| **Cargando** | No aplica al formulario en sí — la carga inicial de sucursales/promociones ya ocurrió en el Server Component antes de pintar la página | — | — | — |
| **Carga parcial** | No aplica | — | — | — |
| **Éxito (enviando)** | Se tocó «Cobrar $X» | `Button loading`, `aria-busy`, deshabilitado (ya resuelto por construcción, `button.tsx:117-118`) | El texto del botón se mantiene («Cobrar $36.000…») | — |
| **Vacío tras filtro** | No aplica: no hay filtro | — | — | — |
| **Error recuperable** | `registrarVenta` devuelve `error` (sucursal inválida, promoción vencida, membresía dejó de estar vigente entre la búsqueda y el registro, fallo de Postgres) | `Alert tone="danger"` sobre el formulario, **con `key={state.error}`** (hoy falta — `AUDIT-a11y` #7 menor) | Texto exacto que devuelve el servidor, ya redactado en español (`API-CONTRACT.md` §3) | Corregir y volver a tocar «Cobrar $X»; **los valores tecleados no se pierden** (viven en estado de cliente, no en el `FormData` del intento fallido) |
| **Error fatal** | No aplica a este formulario: cualquier fallo cae en el error recuperable de arriba, nunca deja al cajero sin salida | — | — | — |
| **Sin permiso** | La sesión perdió el rol entre la búsqueda y el registro | `requireRolComercio()` dentro de `registrarVenta` redirige a `/comercios/login` | — | — |

---

## 8. Venta registrada — y qué pasa cuando el cajero se equivoca

### 8.1 Pantalla de éxito

```
┌────────────────────────────────────────┐
│              ✓ (círculo verde)          │
│                                          │
│         Venta registrada                │
│   Se cobraron $36.000 a nombre del      │
│   socio N.º 00012345, a las 3:42 p.m.   │
│                                          │
│   ¿Te equivocaste? Esta venta no se     │
│   puede anular desde aquí — escribe al  │
│   administrador con la hora y el número │
│   del socio.                            │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │   Verificar otro miembro          │  │  primario, se reinicia solo en
│  └──────────────────────────────────┘  │  6 s si no se toca (§8.3)
└────────────────────────────────────────┘
```

**Cambios de copy respecto de hoy**: se agrega el **monto** y la **hora** al
mensaje de éxito. Hoy solo dice «Quedó anotada a nombre del miembro
{numero}.» — sin el monto, un cajero que sospecha un error no tiene con qué
llamar al administrador. La hora se toma del reloj del navegador en el
momento en que llega `state.ok`, formateada en `America/Bogota` (regla de
fechas de `CLAUDE.md`; es un dato de reloj de cliente, no un `timestamptz` de
base de datos, así que no aplica la regla de `hoyISO`/`Date.UTC`).

**Vibración**: `exito()` de `haptica.ts` (dos pulsos cortos), en el mismo
fotograma en que se pinta el ✓ — es el único punto de todo el flujo que
amerita esa señal, y por eso vale la pena gastarla aquí.

### 8.2 Punto 8 del encargo: ¿cómo se deshace una venta mal registrada?

**No se puede. Se dice explícitamente, en la propia pantalla de éxito.**

El contrato de datos no expone ninguna acción de anulación ni de borrado
sobre `ventas` (`API-CONTRACT.md` §4: «Borrado: ninguna acción borra»). Nada
en esta spec puede inventar una capacidad que el backend no tiene. Lo que sí
es responsabilidad del diseño es que el cajero **se equivoque menos** y que,
si se equivoca, **sepa exactamente qué decir** para que alguien con permiso
lo arregle:

1. **Prevención antes que corrección.** El total va en su propia franja
   visual desde antes de tocar el botón (§7.3), y el botón repite el monto
   en su propio texto (§7.5): dos lecturas del mismo número antes de que
   ocurra algo irreversible.
2. **El mensaje de éxito lleva los tres datos que hacen falta para
   reclamar**: monto, número de socio y hora — sin ellos, «me equivoqué en
   una venta de esta tarde» no es localizable por nadie.
3. **La frase de salida es honesta, no una promesa vacía**: no se ofrece un
   botón de «Deshacer» que no existe. Se dice, en una sola línea de tono
   secundario (no compite con el ✓ ni con el CTA), a quién acudir y con qué
   datos.

### 8.3 Vuelta a reposo

- **Acción explícita**: «Verificar otro miembro», siempre visible, siempre
  funcional — ya es así hoy y se mantiene como la garantía mínima.
- **Reinicio automático opcional**: a los 6 segundos sin ningún toque, la
  pantalla vuelve sola a reposo (mismo mecanismo de `key` creciente que ya
  usa `VerificacionTool` para remontar con estado limpio). Es una mejora de
  detalle (regla 4), no un requisito duro: si el temporizador falla o se
  retira, el botón manual sigue cubriendo el caso. Bajo
  `prefers-reduced-motion` el temporizador **se mantiene** (no es una
  animación, es un plazo) pero no debe haber ninguna cuenta regresiva visual
  que dependa de una animación de progreso — un texto simple («Volviendo en
  unos segundos…») basta, y ese texto sí anima su aparición/desaparición con
  `opacity`, nunca con `width` (regla dura de `CLAUDE.md`).

### 8.4 Venta fallida

Cubierto en §7.6 (Error recuperable). Se añade aquí solo la vibración:
`error()` de `haptica.ts` en el mismo fotograma en que aparece el `Alert`.

---

## 9. Movimiento y feedback — resumen transversal

| Momento | Feedback visual | Feedback háptico | Curva/duración |
|---|---|---|---|
| Cualquier botón, `pointerdown` | `:active { scale: var(--escala-press) }`, ya global (`globals.css:507-514`) | — | `--dur-press`, ya definida |
| QR detectado | Cierre del visor, paso a «Verificando…» | `toque()` | — (T6 define la curva) |
| Membresía inactiva | Banner rojo aparece | `error()` | — |
| No encontrado / error de red | `Alert` entra | `error()` | Sin sacudida (esto no es un formulario de credenciales; la sacudida de `estilosAuth` es propia del acceso, no se copia aquí) |
| Venta registrada | ✓ aparece con fade + escala **sin rebote** — no hay gesto de arrastre previo que lo justifique; `bounce: 0` por defecto según `CLAUDE.md` | `exito()` | `SPRING_SHEET` de valor único si se anima el ✓, nunca `animate(callback, [desde, hasta])` |
| Reinicio automático a reposo | Texto que aparece/desaparece con `opacity` | — | — |

`prefers-reduced-motion`: el ✓ de éxito y cualquier aparición de `Alert`
pierden su transición decorativa pero **no** su aparición — es contenido, no
adorno. El único elemento con `data-motion-esencial` en este árbol es el
`Spinner`/texto de «Verificando…», que ya lo hereda del componente
compartido.

---

## 10. Inventario de componentes

### 10.1 Reutilizados sin cambios

`PageHeader` · `Card` · `Field` · `Input` (con `numeric`, `inputMode`) ·
`Select` · `Button` (variant `primary`/`secondary`/`ghost`) · `Alert` ·
`EmptyState` · `ErrorState` · `Spinner` · `Avatar` · `DropdownMenu` /
`MenuItem` / `MenuSeparator` · `haptica.ts` (`toque`, `exito`, `error`,
**hoy sin usar en este árbol, se estrenan aquí**).

### 10.2 Reutilizados con relocalización (no son componentes nuevos)

| Componente | De | A | Por qué |
|---|---|---|---|
| `MenuTema` | `src/app/miembros/(portal)/_components/menu-tema.tsx` | `src/components/theme/menu-tema.tsx` | Pasa a usarlo un segundo portal; deja de ser de una sola ruta |

### 10.3 Modificaciones a un componente existente (no nuevo, pero cambia su API)

| Componente | Cambio | Por qué ningún componente nuevo lo resuelve |
|---|---|---|
| `StatusBadge` | Aceptar `estado: EstadoDerivado \| { vigente: boolean }` (§6.3), o dejar que Comercios reutilice solo su icono de punto | La única fuente de datos del portal (`buscar_miembro_comercio`) no entrega `motivo` ni `fecha_fin`; un componente nuevo duplicaría exactamente la misma lógica de punto lleno/hueco que ya vive aquí |

### 10.4 Composiciones locales (CSS/marcado nuevo, cero componentes de `ui/` nuevos)

| Pieza | Vive en | Por qué no es un componente de `ui/` |
|---|---|---|
| Banner de veredicto (§6.2) | `resultado-miembro.tsx` + `verificar.module.css` | Es específico de esta pantalla: no hay una segunda vista en todo el producto que necesite un semáforo binario a todo el ancho de una tarjeta. Igual que `Carril`/`Chip` en Miembros, si un segundo consumidor apareciera, ahí se generalizaría |
| Descuento como texto no editable (§7.1) | `confirmar-venta-form.tsx` | Es un `<p>` dentro de un `Field` existente; no hay comportamiento nuevo que envolver |
| Formateo con separador de miles + campo oculto (§7.2) | `confirmar-venta-form.tsx` | Lógica de un solo campo, no un control reutilizable en otra parte del producto (el resto de importes del sistema usan `Cifra`, que ya resuelve la presentación de un número ya calculado, no la de uno que se está tecleando) |
| Mensajes diferenciados de error de cámara (§4.3) | `escaner-qr.tsx` | Reutiliza `Alert`; solo cambia qué texto se le pasa según `error.name` |

**Ningún componente nuevo entra a `src/components/ui/`.** Es la conclusión
deliberada de esta spec: los dos defectos serios diagnosticados (`readOnly`
enfocable, `type="number"`) se resuelven con las capacidades que `Input` y
`Field` ya exponen, y el único cambio de API es un `StatusBadge` más flexible
que ya existía y solo necesita aceptar el dato que este portal sí tiene.

---

## 11. Casos límite

- **Nombre muy largo** (más de dos apellidos, nombres compuestos): el banner
  de veredicto no se ve afectado (es de color plano, no de texto); el nombre
  bajo él usa `text-wrap: balance`, ya presente en `.nombre`, para partir en
  dos líneas de forma pareja en vez de dejar una palabra suelta.
- **Comercio con una sola sucursal**: el selector no se renderiza, se manda
  oculto — comportamiento ya correcto, se mantiene.
- **Comercio con cero promociones vigentes**: el selector de promoción no se
  oculta (a diferencia de sucursal): «Sin promoción» sigue siendo una opción
  real y válida para una venta sin beneficio aplicado — pero si la lista de
  opciones queda en un solo valor («Sin promoción» a secas), el `<select>`
  se mantiene igual: es una elección legítima de una sola opción, no un
  filtro que dejó de discriminar (la regla de «ocultar con una sola opción»
  de Miembros es para filtros, esto es un dato de la venta).
- **Valor de compra en cero**: el botón se queda en «Registrar venta» (no
  «Cobrar $0») — un cero no es un monto que valga la pena repetir en el
  botón, y `registrarVenta` ya valida `valorCompra >= 0` en servidor.
- **Sesión expira a mitad de una venta**: `requireRolComercio()` dentro de
  `registrarVenta` redirige a `/comercios/login`; los datos tecleados se
  pierden porque la redirección abandona la página — es aceptable, ya es el
  comportamiento de cualquier expiración de sesión en el resto del producto,
  y no hay forma de conservarlos a través de un `redirect()` de servidor sin
  inventar persistencia que no pidió el encargo.
- **Doble toque accidental en «Cobrar $X»**: `Button` ya deshabilita durante
  `loading` (`button.tsx:117-118`) — sin cambios, ya resuelto.
- **QR de otro sistema (no de ORUM)**: se dispara la búsqueda igual (§4.2),
  el servidor responde «Ingresa un número de membresía válido (8 dígitos).»
  — mismo camino que un número mal tecleado, sin rama especial.
- **Sin conexión al momento de escanear o de registrar**: cae en el estado
  de «Error de red/servidor» (§5.3) o en el error recuperable de venta
  (§7.6). No se especifica una pantalla offline dedicada (a diferencia de
  Miembros, que tiene `public/sw.js` sirviendo `/offline`): esta herramienta
  no tiene modo de solo lectura que ofrecer sin conexión — verificar una
  membresía **requiere** el servidor, no hay nada útil que mostrar offline.

---

## 12. Notas para el implementador

1. **Orden de trabajo sugerido**: primero los dos defectos SERIO/MODERADO ya
   diagnosticados (safe-area de cabecera, `readOnly`+`type=number`) porque
   son arreglos acotados y ya validados por auditoría; después el cambio de
   flujo (auto-envío de QR y de número); al final el banner de veredicto,
   que es el cambio visual más grande.
2. **`AUDIT-a11y-2026-09-13.md` #1** (falta `aria-live` en el resultado)
   **ya está resuelto en el código actual** —
   `buscar-miembro-form.tsx:143-145` ya envuelve el resultado en
   `aria-live="polite" aria-atomic="true"` con la región montada vacía desde
   el primer render—. La auditoría queda desactualizada en ese punto
   puntual; no hay que volver a tocarlo.
3. **`AUDIT-a11y-2026-09-13.md` #7** (falta `key={state.error}` en
   `confirmar-venta-form.tsx`, a diferencia de `buscar-miembro-form.tsx` que
   sí lo tiene): inclúyelo al tocar ese archivo por el resto de cambios de
   esta spec — es una línea.
4. **Verificar en dispositivo real** (deuda conocida #3 de `CLAUDE.md`, no
   se puede comprobar desde esta máquina): el `position: sticky` del total
   con el teclado abierto (§7.5), el recorte de la cámara en distintos FOV
   (§4.4, ya anotado por `mobile-ux-specialist`), y si `@yudiel/react-qr-scanner`
   expone `error.name` para diferenciar permiso/sin-cámara/ocupada (§4.3).
5. **`Alert`, `role="alert"` para `tone="danger"` ya existe** — no
   confundirlo con `aria-live="polite"` del contenedor de resultado: son dos
   mecanismos que conviven sin conflicto porque anuncian cosas distintas en
   momentos distintos.

---

## PROPUESTAS PARA BACKEND

Cruzan la frontera de `SCOPE.md` §2. **No se implementan aquí.**

### PC-1 — Una acción de anulación de venta, acotada en el tiempo

- **Qué**: una Server Action `anularVenta(ventaId)`, disponible solo para el
  rol `comercio` dueño de esa venta, y solo dentro de una ventana corta
  (propuesta: 5 minutos desde `fecha_hora`) para que no se convierta en una
  puerta de borrado arbitrario de historial.
- **Por qué la alternativa solo-frontend es peor**: hoy, si un cajero teclea
  mal un monto y lo registra, la única salida es un mensaje humano al
  administrador (§8.2) — funciona, pero dejar un error de digitación
  parado en `ventas` durante días hasta que alguien lo corrija a mano en la
  base de datos no es sostenible en un negocio con volumen.
- **Entretanto**: el mensaje de éxito lleva monto, número de socio y hora
  (§8.1), que es lo mínimo para que un humano pueda encontrar y corregir la
  fila manualmente. Es honesto sobre la limitación, no la disfraza.

### PC-2 — `buscar_miembro_comercio` devuelve el motivo de inactividad

- **Qué**: que la función RPC entregue también `motivo` (`vencida` /
  `cancelada` / `suspendida`), calculado con la misma regla de
  `derivarEstadoMembresia`, sin exponer la fila completa de `membresias`.
- **Por qué**: hoy un socio con membresía inactiva recibe siempre el mismo
  mensaje genérico («No apliques el beneficio. El socio puede reactivarla
  con el club.»), y un cajero no puede orientarlo («tu pago venció» es una
  conversación distinta de «tu membresía está suspendida»). No es
  imprescindible para la decisión binaria de cobrar o no —esa ya funciona
  bien—, pero mejora la conversación en el mostrador.
- **Entretanto**: el mensaje genérico actual, sin inventar un motivo que el
  backend no entrega.

### PC-3 — `registrarVenta` devuelve el registro insertado

- **Qué**: que la acción devuelva también `fecha_hora` (la del servidor, no
  la del reloj del navegador) junto con `ok: true`.
- **Por qué**: el mensaje de éxito propuesto en §8.1 usa la hora del
  navegador del cajero, que puede estar mal configurada o desfasada. Con la
  hora real del servidor, el dato que se le da al administrador para
  localizar la venta es exacto.
- **Entretanto**: hora del cliente, con la advertencia implícita de que es
  aproximada — sigue siendo mejor que no dar ninguna hora, que es el estado
  actual.
