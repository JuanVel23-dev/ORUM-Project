# Log · Z2 · El carnet centrado y ampliable · 15/09/2026

> Encargo literal del propietario: «En el carnet quiero que se vea todo centrado
> como un carnet de verdad. La foto grandecita, el nombre no tan grande y en
> general la información está bien pero todo centrado. Y que se pueda agrandar y
> poner por encima como cuando abro mi usuario para cambiar tema o cerrar
> sesión.»

Alcance cerrado: solo `src/app/miembros/(portal)/perfil/**`. No se tocó ni un
archivo de `src/components/ui/`, ni `portal.module.css`, ni el catálogo, ni
`(publico)`.

---

## Lo que cambió

| Archivo | Qué |
|---|---|
| `perfil/page.tsx` | Solo datos y reparto. El marcado del objeto salió de aquí |
| `perfil/_components/carnet.tsx` | **Nuevo.** El objeto, presentacional, Server Component |
| `perfil/_components/carnet-ampliable.tsx` | **Nuevo.** `'use client'`. Un booleano y el `<Overlay>` |
| `perfil/perfil.module.css` | Composición en un eje, medidas publicadas, QR fluido |

### 1 · Un solo eje vertical

`.carnetInterior` centra **el contenedor**, no bloque a bloque:
`justify-items: center` + `text-align: center`. Centrar pieza a pieza es lo que
se olvida en la siguiente que se añade; así lo que entre mañana nace centrado.

Orden: emisor → foto → nombre → plan → estado → número → vigencia → QR.
Desaparecen `.cabecera` (foto en la esquina del pasaporte), `.credencial` y
`.pie`; entran `.emisor`, `.datos` y `.estadoFila` dentro de `.identidad`.

### 2 · La foto manda, el nombre baja

| | Antes | Ahora |
|---|---|---|
| Foto | 88px, cuadrada con esquina `--radius-md`, esquina superior derecha | `clamp(104px, 30vw, 128px)`, **círculo**, en el eje |
| Nombre | `hero-2` · clamp(32px, 5vw, 48px) | `display-2` · clamp(28px, 3.5vw, 36px) |

Sigue en Fraunces y sigue **por encima del suelo de ~28px** que la dirección le
pone al serif. El aro de la foto es `--brand-edge`, que dentro del ámbito de
cacao es `--gold-600`: **4,63:1** sobre el chocolate. El segundo anillo difuso
al 12 % es paspartú: es sombra, no borde, y no anima.

### 3 · Ampliar: `<Overlay>`, no ruta

`CarnetAmpliable` guarda un booleano y nada más. Los **dos** carnets se crean en
el servidor (`page.tsx`) y viajan como props: no se hidrata ni el QR ni el
retrato.

- `ariaLabel="Carnet de socio ampliado"` — el overlay no lleva `title` visible,
  y el `<h1>` de la página no nombra al `<dialog>`.
- `detent="large"`: aquí **no** conviene ver el fondo.
- `width="520px"` → 472px de carnet, ~60 más que en la página.
- Disparador: `<Button variant="brand" size="lg">` (52px, por encima del mínimo
  de 44), `aria-haspopup="dialog"`, `:focus-visible` global, acuse de pulsación
  de `globals.css` §4b. Fuera de la tarjeta: lo que se enseña en una caja no
  lleva botones impresos encima, y en la copia ampliada no aparece.

**Frecuencia**: no se añadió **ni una** animación propia. Lo único que se mueve
es lo que ya trae `Overlay` (~0,30 s de entrada, ~0,20 de salida, sin rebote).
La copia ampliada cuelga directamente del overlay y **no** de `.carnetCaja`, así
que tampoco hereda la entrada de 180 ms de la versión de página: dos
animaciones encadenadas en la acción más repetida del producto es exactamente lo
que se siente como lentitud.

### 4 · El QR pasa a ser fluido, y la zona de silencio con él

Era `size={160}` con `padding: var(--space-7)` (32px). Ese relleno **solo era
correcto a ese tamaño**: al ampliar se habría quedado en 1,8 módulos y la norma
pide 4. No rompe siempre — rompe en la caja, delante del cliente.

Ahora manda el CSS:

```css
.qr        { width: 100%; max-width: var(--qr-max); }
.qr .qrMarco     { width: 100%; padding: 14.3%; }
.qr .qrMarco svg { width: 100%; height: auto; }
```

Con relleno del **14,3 %** del ancho de la placa, el código ocupa el 71,4 % y el
silencio equivale a **0,2 lados de código = 4,2 módulos** en la versión 1
(21×21) — y más en cualquier versión superior, porque a más módulos cada uno es
más pequeño. La proporción no se puede desalinear al cambiar de tamaño.

| | `--qr-max` | Placa real | Código |
|---|---|---|---|
| Página (460px) | 224px | 224 | **160px** — idéntico al anterior |
| Ampliado (escritorio) | 320px | 320 | **~229px** |
| Ampliado (móvil 390px) | 320px | ~300 | **~214px** |

`size={256}` en el componente solo fija el `viewBox`; el QR es vectorial y no se
pixela al crecer. **Negro sobre blanco en los dos temas**, sin tocar.

### 5 · Tres medidas publicadas, una variante

`.carnet.carnet` declara `--carnet-pad`, `--foto-lado` y `--qr-max`.
`.carnet.ampliado` **solo cambia esos tres números**. Es el mismo objeto más
cerca, no un segundo diseño: dos carnets escritos a mano se separan al primer
retoque.

El relleno responde al ancho (`clamp(--space-5, 6vw, --space-7)`) para que en un
teléfono de 320px el QR no se quede sin sitio.

---

## Lo que NO se tocó, a propósito

- `derivarEstadoMembresia` sigue siendo la única fuente del estado. Nunca
  `membresias.estado` en crudo.
- `fecha_fin` se sigue construyendo con `Date.UTC(...)` y formateando con
  `timeZone: 'UTC'`. La fecha ya formateada viaja al componente como cadena, así
  que no hay un segundo sitio donde equivocarse de zona.
- El ámbito de tema cacao de `.carnet.carnet`, el halo, el guilloché, el barrido
  del wordmark y el bloque `@media print` entero. Solo se renombraron dentro del
  print las clases que cambiaron (`.credencial` → `.datos`) y se le quitó el
  paspartú a la foto, que en papel sale como cerco gris.

---

## Ratios recalculados desde los hex (WCAG 2.1, no estimados)

| Par | Ratio | Criterio |
|---|---|---|
| papel `#fdfcfa` / cacao `#2b1a15` — nombre, vigencia | **16,24:1** | 1.4.3 ✓ |
| `--gold-400` / cacao — etiquetas, wordmark | **7,83:1** | 1.4.3 ✓ |
| `--gold-300` / cacao — número | **10,74:1** | 1.4.3 ✓ |
| `--n-300` / cacao — plan, «carnet de socio» | **8,56:1** | 1.4.3 ✓ |
| `--gold-600` / cacao — **aro de la foto** | **4,63:1** | 1.4.11 ✓ |
| `--gold-400` / `--cacao-surface` — iniciales | **6,75:1** | 1.4.3 ✓ |
| `--tinta-1` / `--gold-600` — botón «Ampliar» | **4,84:1** | 1.4.3 ✓ |
| `--gold-600` / papel — filo del botón | **3,51:1** | 1.4.11 ✓ |
| `--gold-600` / blanco — costura de la placa del QR | **3,60:1** | 1.4.11 ✓ |

La vigencia **subió** de `--text-2` (8,56) a `--text` (16,24): ahora es un campo
del documento, no una nota al pie.

---

## Verificado

```
tsc --noEmit          sin salida
eslint .              sin salida
vitest run            20 archivos · 249 pruebas   (baseline intacto)
next build            OK — /miembros/perfil y /miembros/(.)perfil/foto siguen en el manifiesto
```

Y la comprobación que más veces ha mordido aquí: **las 32 clases citadas desde
los tres TSX existen en `perfil.module.css`**, y no sobra ninguna. Se verificó
con un script que extrae `estilos.X` / `styles.X` del marcado y los selectores
del módulo (ignorando comentarios) y cruza los dos conjuntos. Un
`estilos.loQueSea` inexistente sale `undefined`, deja la cadena «undefined» en
el `className` y **compila, tipa y pasa lint**.

---

## Lo que queda por mirar a ojo — no hay navegador en esta sesión

1. **La altura del ampliado en la hoja de móvil.** Con foto 132px + QR ~214px el
   conjunto ronda los 800px y la hoja `large` deja ~700 útiles: **debe scrollar
   unos 100px**. `.cuerpo` de `Sheet` ya tiene `overflow-y: auto` con
   `overscroll-behavior: contain`, pero conviene ver si el QR queda por debajo
   del pliegue al abrir. Si molesta, la palanca es una sola línea:
   `--foto-lado` de `.carnet.ampliado`.
2. **El gesto de arrastrar la hoja no compite con nada** — dentro del carnet no
   hay scroll horizontal ni carruseles, pero hay que verlo con el dedo.
3. **El aro de la foto en tema oscuro.** `--gold-600` da 4,63:1 sobre el cacao y
   el cacao no sigue al tema, así que el número no cambia; lo que hay que juzgar
   es si el paspartú al 12 % se lee como halo o como suciedad sobre un fondo
   `--n-1000`.
4. **La impresión.** Se cambiaron nombres de clase dentro de `@media print`
   (`.credencial` → `.datos`) y se le quitó la sombra a la foto. Imprimir a PDF
   y comprobar que el carnet sale claro, con trazo, con el wordmark en tinta y
   el QR sin marco.
5. **El foco vuelve al botón «Ampliar» al cerrar.** Lo restaura el `<dialog>`
   nativo; no se verificó.
6. **Nombres muy largos.** `text-wrap: balance` + `overflow-wrap: anywhere` a
   28–36px: ver un nombre de cuatro palabras y un apellido compuesto.

---

## Observaciones, sin tocar

- **El ámbito de tema cacao está duplicado.** `.carnet.carnet` reescribe casi lo
  mismo que `.tonoCacao` de `src/components/ui/layout.module.css`, más cuatro
  cosas que `Section` no tiene (el barrido del wordmark invertido, los bordes de
  luz, los `--*-bg` derivados y `--edge`). No se unificó porque el carnet es una
  **tarjeta con sombra, textura y halo**, no una franja teñida a sangre, y
  porque `src/components/ui/**` está fuera de este alcance y hay otro agente
  trabajando ahí. Si algún día se extrae un `data-ambito="cacao"` reutilizable,
  este es el tercer sitio que lo pediría (catálogo, ficha, carnet).
- **`Overlay` no expone `hideClose`.** Aquí viene bien —la X es la única salida
  visible en escritorio—, pero deja sin opción a quien quiera un overlay
  ceremonial sin cromo.
- **La duración de entrada del overlay no se puede ajustar desde fuera.**
  `Modal` usa `SPRING_UI` fijo. Para la acción más repetida del producto
  convendría un preset más corto; requeriría tocar `src/components/ui/modal.tsx`,
  que está fuera de alcance. Anotado, no hecho.
