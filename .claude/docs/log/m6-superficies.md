# M6 — Rescatar superficies invisibles (dirección v2, tema claro)

Registro de las 10 líneas del encargo + el barrido adicional. Cada entrada dice
qué salida se aplicó (trazo / hueco / quitado) y por qué.

---

## `src/styles/formulario.module.css:68` — `.credencial`

**Salida: trazo, `--border-strong`.**

Caja que muestra la contraseña generada una sola vez (múltiples formularios:
alta de miembro, de usuario, de comercio, activación de cuenta). Es una
superficie real —el bloque que hay que copiar antes de perderlo— nunca anidada
dentro de otra tarjeta con borde propio. Tenía `--border-subtle` (1,67:1),
insuficiente para definir una superficie. Sube a `--border-strong`. Es la hoja
COMPARTIDA por más rutas: la de mayor impacto de todo el encargo.

---

## `src/app/(publico)/landing.module.css:19` — `.puente`

**Salida: trazo, `--border` (no `-strong`).**

Píldora informativa («ya tienes sesión»), redondeada a `radius-full`. Se trató
como un chip, no como una tarjeta: mismo criterio que `badge.module.css`
`.neutral`, ya corregido por la fundación con `border-color: var(--border)` en
vez de `--border-strong`. Un borde de tinta plena en una píldora tan pequeña
pesaría más que el propio texto.

## `src/app/(publico)/landing.module.css:68` — `.cierre`

**Salida: trazo, `--border-strong`.**

Panel de cierre de la landing (CTA final, `radius-xl`, no anidado en ninguna
tarjeta). Funciona como una tarjeta por derecho propio, así que entra en la
lista de `--border-strong` de CLAUDE.md («tarjetas, campos, botones con
contorno, modales…»). 1px, no 2px: no compite por ser LA superficie principal
de la pantalla (esa no está definida aún en esta ruta).

*Nota:* revisé también `.aliados` (línea 111, `border-top` con
`--border-subtle`) por estar en el mismo archivo, pero no usa `surface-sunk` ni
apareció en el grep del encargo — es un divisor de sección, no la anomalía que
se pide rescatar. Lo dejé intacto para no ampliar el alcance sin encargo.

---

## `src/app/(publico)/_components/como-funciona.module.css:80` — `.numero`

**Salida: trazo, `--border` (mismo criterio que `.puente`).**

Disco con el numeral de cada paso («①②③»). Mismo patrón que un badge/chip
decorativo, no una tarjeta. `--border-subtle` (1,67:1) no bastaba para que el
disco se recortara sobre el papel; sube a `--border` (4,42:1).

---

## `src/app/(publico)/_components/hero-publico.module.css:154` (bg) / línea nueva (borde) — `.celda`

**Salida: trazo, `--border-strong`.**

Celdas del collage de logotipos en el héroe (decorativo, `aria-hidden`). Sin
tarjeta envolvente (a diferencia de la vitrina de más abajo, donde el mismo
tipo de cubierta vive dentro de `<Card>`). Necesita su propio trazo para no
desaparecer contra el papel. Uso `--border-strong` para que el collage hable el
mismo idioma visual que las tarjetas reales de la vitrina inmediatamente
debajo (esas ya llevan `--border-strong` vía `Card`).

---

## `src/app/(publico)/_components/pie-publico.module.css:11` — `.pie`

**Salida: quitado.**

El pie ya tenía `border-top` como separador de sección (igual que `.seccion` en
«Cómo funciona» y `.envoltura` en la vitrina). El `background: var(--surface-sunk)`
solo existía para teñir el pie de un gris ligeramente distinto al resto de la
página — el caso de manual que la dirección de arte v2 pide resolver quitando,
no añadiendo. Se retira la línea; el `border-top` que ya estaba (fuera del
encargo, no tocado) sigue marcando el límite de sección.

---

## `src/app/(publico)/_components/vitrina-publica.module.css:158` — `.cubierta`

**Salida: ninguna (verificado, no requiere cambio).**

Esta superficie vive DENTRO de `<Card padding="none">` (`vitrina-publica.tsx`),
y `Card` ya lleva `border: 1px solid var(--border-strong)` (corregido por la
fundación). `.cubierta` es contenido interior, no una superficie que deba
declararse por separado — coincide exactamente con el patrón ya usado en
`carrusel-destacados.module.css` (`.cubierta` dentro de `.superficie`/`Card`
del portal de miembros, fuera de mi alcance pero consultado como referencia).
Dejar `background: var(--surface-sunk)` intacto: sigue siendo la base sobre la
que se pinta `--gold-halo`, y en oscuro diferencia `n-950` de `n-900`.

---

## `src/app/admin/comercios/[id]/ficha.module.css:51` — `.interruptor`

**Salida: trazo, `--border-strong`.**

Dos cajas independientes («Aliado del club» / «Acceso a su cuenta») dentro de
`<Section>`, sin tarjeta envolvente — cada una es su propia superficie con
etiqueta, insignia y acción. Sube de `--border-subtle` a `--border-strong`, en
línea con `.credencial` de `formulario.module.css`. 1px: hay dos cajas del
mismo peso en la pantalla, ninguna es *la* principal.

---

## `src/app/admin/cuenta/password/_components/password-form.module.css:30` — `.segmento`

**Salida: hueco, `--surface-hueco`.**

Es literalmente «el carril de la barra de progreso» que CLAUDE.md nombra como
uno de los dos únicos casos de `--surface-hueco`: el medidor de fortaleza de
contraseña, cuatro segmentos donde el relleno (vacío vs. lleno) es la
información. Sin este cambio, en claro los cuatro segmentos —llenos y vacíos—
se leían idénticos hasta que `data-lleno` pintaba el color de nivel.

---

## `src/app/admin/inicio.module.css:102` — `.accesoIcono`

**Salida: quitado.**

Placa de 40×40 para el icono, anidada dentro de `.acceso` (que ya tiene
`border: var(--border-subtle)` + `box-shadow: var(--shadow-card), var(--edge)`
— y `--shadow-card` en claro es `--shadow-1`, una sombra real desplazada, no la
translúcida de antes: `.acceso` ya se distingue sin depender del gris). El
`background: var(--surface-sunk)` del icono interior solo teñía un cuadrado que
hoy es exactamente el mismo blanco que su contenedor — el caso de manual de
«no hacía falta». Se retira; el icono queda sobre el material del acceso, sin
plaquita propia (dejé `border-radius` sin usar por si una revisión posterior le
da otra vez un relleno semántico; no rompe nada en su ausencia).

*Nota:* no toqué `.acceso` (línea 67, `--border-subtle`): no usa `surface-sunk`
ni aparece en el grep del encargo, y ya lleva sombra real que lo distingue del
fondo — no es la anomalía que se pide rescatar.

---

## `src/app/comercios/(portal)/_components/verificar.module.css:180` — `.campoLeidoValor`

**Salida: hueco, `--surface-hueco`.**

Dato de solo lectura con forma de campo (el descuento que calcula la
promoción). El comentario del propio archivo ya lo describe como el
equivalente a un campo deshabilitado: «la forma dice esto no se escribe». Es
justo el tercer caso de `--surface-hueco` que ya usa `input.module.css` para
`.control:disabled` — mismo criterio, mismo token. Mantiene su
`border: 1px dashed var(--border)` existente (fuera del encargo, no tocado).

## `src/app/comercios/(portal)/_components/verificar.module.css:209` — `.total`

**Salida: trazo, `--border-strong`.**

El total a cobrar, «el único número que se dice en voz alta» según el propio
comentario del archivo — necesita separarse de los campos que lo producen. Vive
dentro de `<Card padding="lg">` pero como franja propia sin trazo quedaba menos
definida que los `Input` de encima (que sí llevan borde). Sube a
`--border-strong`, 1px: no lo hice `principal` (2px) para no introducir un
patrón de 2px fuera de la convención de `<Card principal>` documentada en
CLAUDE.md — ver observación abajo.

## `src/app/comercios/(portal)/_components/verificar.module.css:275` — `.cargandoEscaner`

**Salida: hueco, `--surface-hueco`.**

Placeholder mientras se descarga el módulo del escáner QR — es literalmente el
«esqueleto de carga» que CLAUDE.md nombra como el primer caso canónico de
`--surface-hueco`.

---

## Barrido adicional (`grep -rn "surface-sunk|--w-100|--w-200|--w-300|--w-400"` sobre las rutas del encargo)

Ningún hallazgo nuevo fuera de las 10 líneas ya listadas. Ninguna referencia a
`--w-100..400` en mi alcance: la rampa quedó completamente retirada de estas
rutas por la fundación o nunca se usó aquí.

## Observación para quien continúe (no aplicada, fuera de mi alcance de línea)

`resultado-miembro.tsx` envuelve el veredicto de vigencia en `<Card padding="lg">`
sin el prop `principal`. Ese bloque es literalmente «la tarjeta de veredicto»
que CLAUDE.md cita como uno de los DOS ejemplos canónicos del trazo de 2px
(junto al carnet). No lo cambié porque no aparece en la lista de líneas del
encargo ni en el grep pedido, y es un cambio de componente/prop, no de token de
color — pero quien reparta el trazo de 2px por pantalla debería revisarlo.
