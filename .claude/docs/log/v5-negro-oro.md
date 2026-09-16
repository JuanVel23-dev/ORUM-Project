# v5 · «negro, oro brillante y blanco» — fundación por tokens

**Fecha**: 15/09/2026 · rama `mejora-diseno`
**Alcance**: `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`,
`CLAUDE.md`, este registro. **Ni un `.module.css`, ni un componente.**

> **Encargo literal del propietario**
> - «Cambiar tonos cafés a negros, además de utilizar dorados (no tan oscuros,
>   más brillantes) y blanco. Además de tonos grises.»
> - «Tipografía similar a la de Avianca. Y que toda sea de la misma familia, no
>   combinar.»

La premisa de la tanda era que el cambio entrara **por la capa de tokens** y que
las pantallas lo heredaran sin tocarlas. Se cumplió: cero módulos modificados.

---

## 0. Resumen ejecutable

| | |
|---|---|
| Pares de contraste calculados | **94** (fórmula WCAG 2.1 desde los hex) |
| Cumplen | **92** |
| Fallan | **2** — el mismo `--border` de tema oscuro, deuda **preexistente** |
| Módulos CSS tocados | 0 |
| `var()` huérfanos introducidos | 0 (verificado por cruce exhaustivo, §6) |
| Familias tipográficas | 2 → **1** |
| Fuentes servidas | 57,6 KB woff2, 26,6 KB precargados |
| `tsc` · `eslint` · `vitest` · `next build` | limpios · 253/253 pruebas |

**Sin verificar**: nadie ha mirado una pantalla. Ver §7.

---

## 1. Qué cambió, en una tabla

### Neutrales: de cálidos a neutros

| Token | v4 (cálido) | v5 (neutro) | Papel |
|---|---|---|---|
| `--w-0` | `#FDFCFA` papel | **`#FFFFFF`** blanco | Fondo y tarjeta |
| `--w-50` | `#FAF7F0` crema | **`#F6F6F8`** gris claro | Franja alterna |
| `--w-100` | `#F3EEE3` crema honda | **`#EFEFF3`** gris hondo | Relleno, hueco, carril |
| `--tinta-1` | `#1B1A18` | **`#121216`** | Texto primario |
| `--tinta-2` | `#5C5349` | **`#55555F`** | Texto secundario |
| `--n-1000` | `#14100E` | **`#111114`** | Fondo raíz oscuro |
| `--n-900` | `#211A16` | **`#1D1D22`** | Tarjeta oscura |
| `--n-500` | `#7A7068` | **`#6B6B75`** | `--tinta-3` |
| `--cacao-900` | `#2B1A15` cacao | **`#0A0A0C`** negro | **La franja ceremonial** |
| Tinte de sombra | `rgb(28,22,18)` | **`rgb(10,10,14)`** | Las cinco sombras |
| `--edge-light` | `rgba(255,249,240,…)` | **`rgba(255,255,255,…)`** | El anillo de luz en oscuro |

La rampa es **neutra**, con un desvío frío de 3–10 puntos de azul sobre rojo
(≈2 % del canal). No es indecisión: el oro es amarillo saturado y un gris
exactamente neutro a su lado se percibe empujado hacia el caqui por contraste
simultáneo. Tres puntos de azul lo cancelan.

**No es volver a la v3.** Aquella pedía matiz ~240° —gris azulado *visible*—;
esto es gris, y el desvío está por debajo del umbral de percepción salvo junto
al oro.

### Oro: sube donde puede, y donde no puede, baja

| Token | v4 · luminancia | v5 · luminancia | Δ | Dónde vive |
|---|---|---|---|---|
| `--gold-300` | 0,627 | **0,727** | **+16 %** | Texto dorado sobre negro |
| `--gold-400` | 0,444 | **0,601** | **+35 %** | Display sobre negro · focus en oscuro |
| `--gold-500` | 0,355 | **0,466** | **+31 %** | Marca · relleno de acción en oscuro |
| `--gold-600` | 0,242 | **0,248** | +2 % | Relleno de acción en claro · filo |
| `--gold-700` | 0,165 | **0,150** | **−9 %** | Texto dorado sobre claro |
| `--gold-800` | 0,096 | **0,087** | −10 % | Dorado enfático |

Hex nuevos: `#FBEECB` `#F3DC9E` `#EDC85F` `#DFAF35` `#AE8118` `#886712` `#675010`.

**La trampa de esta tarea, resuelta:** sobre negro el oro brillante **gana**
contraste; sobre blanco lo **pierde**. Es la misma fórmula leída en direcciones
opuestas. Ningún oro puede ser a la vez más brillante y más legible sobre papel,
así que el reparto no es una preferencia — es lo único posible.

- Los tres que viven sobre negro suben entre 16 % y 35 %. Ahí está el brillo del
  encargo, y ahí es donde el usuario lo va a ver: el titular de la franja.
- `--gold-600` solo pudo subir un 2 %. Lo topa **1.4.11 contra `--surface-alt-2`**
  (gris hondo): a 0,254 de luminancia el filo cae por debajo de 3:1. Está en
  0,248 — a **0,08 puntos de contraste** del suelo.
- `--gold-700` **bajó** un 9 %, contra el encargo, y es correcto: a cambio pasa a
  cumplir AA sobre las **tres** superficies claras. En la v4 reprobaba sobre la
  más honda (4,21:1) y había que sustituirlo por `--gold-800` a mano.

### Tipografía: de dos familias a una

| | v4 | v5 |
|---|---|---|
| Interfaz | Inter | **Plus Jakarta Sans** |
| Display | Fraunces (serif, 35,8 KB) | **Plus Jakarta Sans** (la misma) |
| `--font-display` | `var(--font-fraunces), Georgia, …` | **`var(--font-sans)`** |
| `hero-1` | 600 · −0,032em | **800 · −0,040em** |
| `hero-2` | 600 · −0,024em | **700 · −0,030em** |
| `hero-cifra` | 600 · −0,018em | **700 · −0,022em** |
| `display-1` | 600 · −0,026em | **700 · −0,030em** |

Por qué Plus Jakarta Sans y no las otras dos candidatas:

- **Outfit** es la que más se parece de lejos al lenguaje de Avianca, y la que
  peor aguanta de cerca: sus letras son círculos casi perfectos y a 13px la `a`,
  la `o` y la `e` comparten demasiada silueta. Esta aplicación es en buena parte
  tablas de cédulas, montos y fechas.
- **DM Sans** habría servido. Es la más neutra y por eso la menos característica:
  no aporta nada que `system-ui` no diera ya.
- **Plus Jakarta Sans** es geométrica con correcciones humanistas —terminales
  cortadas en ángulo, `a` de doble piso, caja alta grande—. Sostiene la lectura
  geométrica a 72px y sigue siendo distinguible a 13px.

**Por qué el peso sube y el tracking cierra**, que es lo que no se ve en el diff:
un serif de contraste alto crea presencia con la **modulación** de sus astas y
por eso 600 le basta a 72px; una geométrica tiene el asta de grosor constante y a
600 se lee delgada. El peso sustituye a la modulación. Y una geométrica tiene las
contraformas más redondas, así que al crecer abre más hueco entre letras.

**`--font-display` NO se borró.** Lo consumen ocho módulos CSS fuera del alcance
de esta tanda. Un `var()` que apunta a un token inexistente **no falla**: la
propiedad se queda en su valor inicial y el texto se pinta con la fuente por
defecto del navegador. Borrarlo habría roto ocho titulares en silencio. Se deriva
de `--font-sans` para que no puedan divergir.

---

## 2. Tabla de ratios · TEMA CLARO

Método: fórmula de luminancia relativa de WCAG 2.1 aplicada a los hex leídos del
propio `tokens.css` por script, no a mano. Mínimos: **4,5:1** texto (1.4.3),
**3:1** límite de control (1.4.11).

### Texto sobre las tres superficies claras

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--text` (tinta-1) sobre blanco | 18,69:1 | 4,5 | OK |
| `--text` sobre gris claro | 17,31:1 | 4,5 | OK |
| `--text` sobre gris hondo | 16,29:1 | 4,5 | OK |
| `--text-2` sobre blanco | 7,37:1 | 4,5 | OK |
| `--text-2` sobre gris claro | 6,82:1 | 4,5 | OK |
| `--text-2` sobre gris hondo | 6,42:1 | 4,5 | OK |
| `--text-3` sobre blanco | 5,27:1 | 4,5 | OK |
| `--text-3` sobre gris claro | 4,88:1 | 4,5 | OK |
| **`--text-3` sobre gris hondo** | **4,59:1** | 4,5 | **OK — era 4,18 ✗ en la v4** |

### Oro de texto

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--brand` (gold-700) sobre blanco | 5,26:1 | 4,5 | OK |
| `--brand` sobre gris claro | 4,87:1 | 4,5 | OK |
| **`--brand` sobre gris hondo** | **4,58:1** | 4,5 | **OK — era 4,21 ✗ en la v4** |
| `--gold-800` sobre blanco | 7,69:1 | 4,5 | OK |
| `--gold-800` sobre gris claro | 7,12:1 | 4,5 | OK |
| `--gold-800` sobre gris hondo | 6,70:1 | 4,5 | OK |

### El par de acción ceremonial

| Par | Ratio | Mín. | |
|---|---|---|---|
| **1.4.3** texto `--tinta-1` sobre relleno `--gold-600` | **5,30:1** | 4,5 | OK (era 4,84) |
| **1.4.11** filo `--gold-600` vs `--surface` (blanco) | **3,53:1** | 3 | OK (era 3,51) |
| 1.4.11 filo vs `--surface-alt` (gris claro) | 3,27:1 | 3 | OK |
| 1.4.11 filo vs `--surface-alt-2` (gris hondo) | **3,08:1** | 3 | OK ← **el techo** |
| 1.4.11 filo vs `--surface-hover` | 3,12:1 | 3 | OK |
| 1.4.11 filo vs `--cacao-bg` (la franja negra) | 5,61:1 | 3 | OK |

### Acción en tinta

| Par | Ratio | Mín. | |
|---|---|---|---|
| blanco sobre `--action` (tinta-1) | 18,69:1 | 4,5 | OK |
| blanco sobre `--action-hover` (n-850) | 15,04:1 | 4,5 | OK |

### Semánticos

| | blanco | gris claro | gris hondo | Mín. |
|---|---|---|---|---|
| `--success-light` | 5,42 | 5,02 | 4,73 | 4,5 OK |
| `--warning-light` | 5,29 | 4,90 | 4,61 | 4,5 OK |
| `--danger-light` | 6,22 | 5,77 | 5,43 | 4,5 OK |
| `--info-light` | 5,82 | 5,39 | 5,07 | 4,5 OK |

Ninguno se cambió de valor: sobre blanco puro **todos subieron** respecto de la
v4, porque el fondo se aclaró.

### Bordes, hover y hueco (mezclas `color-mix` compuestas)

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--border` (tinta 55 %) vs blanco | 4,17:1 | 3 | OK |
| `--border` vs gris hondo | 4,00:1 | 3 | OK |
| `--border-subtle` (tinta 22 %) vs blanco | 1,62:1 | — | hairline |
| `--text` sobre `--surface-hover` | 16,54:1 | 4,5 | OK |
| `--text-3` sobre `--surface-hover` | 4,67:1 | 4,5 | OK |
| `--brand` sobre `--surface-hover` | 4,65:1 | 4,5 | OK |
| `--text-3` sobre `--surface-hueco` | 4,54:1 | 4,5 | OK ← margen mínimo |
| `prefers-contrast: more` · `--border-strong` vs blanco | 18,85:1 | 3 | OK |

---

## 3. Tabla de ratios · LA FRANJA NEGRA

No sigue al tema: es negra en claro y en oscuro, igual que el `QrCode`.

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--cacao-fg` (blanco) sobre la franja | 19,78:1 | 4,5 | OK |
| `--cacao-fg-2` (n-300) sobre la franja | 11,30:1 | 4,5 | OK |
| `--cacao-fg-3` (n-400) sobre la franja | 7,10:1 | 4,5 | OK |
| **`--cacao-brand` (gold-400) sobre la franja** | **12,27:1** | 4,5 | **OK — era 7,83 en cacao** |
| `--gold-300` sobre la franja | 14,64:1 | 4,5 | OK |
| `--gold-500` sobre la franja | 9,72:1 | 4,5 | OK |
| `--cacao-edge` (gold-600) filo vs la franja | 5,61:1 | 3 | OK |
| blanco sobre `--cacao-surface` | 17,70:1 | 4,5 | OK |
| n-300 sobre `--cacao-surface` | 10,11:1 | 4,5 | OK |
| n-400 sobre `--cacao-surface` | 6,35:1 | 4,5 | OK |
| gold-400 sobre `--cacao-surface` | 10,98:1 | 4,5 | OK |

**Ese margen es lo que financió el encargo.** Pasar de cacao a negro sube el
titular dorado de 7,83 a 12,27:1, y es ese colchón el que permitió subir el oro
de display un 35 % sin perder ni un criterio. Sobre cacao no habría cabido.

**El riesgo que había que comprobar y se comprobó**: una franja negra sobre un
fondo oscuro podía desaparecer. Se separa por **1,049:1** — el mismo orden que el
gris claro sobre blanco (1,079:1), que es la separación que el sistema ya
considera suficiente para leer una franja sin trazo.

---

## 4. Tabla de ratios · TEMA OSCURO

**Auditado aparte.** Un ratio firmado en claro no vale en oscuro.

### Texto

| | sobre fondo (n-1000) | sobre tarjeta (n-900) | sobre banda alterna (n-950) |
|---|---|---|---|
| `--text` (n-50) | 17,17 | 15,29 | 16,28 |
| `--text-2` (n-300) | 10,77 | 9,59 | 10,21 |
| `--text-3` (n-400) | 6,76 | 6,02 | 6,41 |

Todos ≥ 4,5. OK.

### Oro y acción

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--brand` (gold-300) sobre el fondo | 13,95:1 | 4,5 | OK |
| `--brand` sobre la tarjeta | 12,42:1 | 4,5 | OK |
| `--focus` (gold-400) vs el fondo | 11,69:1 | 3 | OK |
| `--focus` vs la tarjeta | 10,41:1 | 3 | OK |
| `--brand-edge` (gold-500) vs la tarjeta | 8,25:1 | 3 | OK |
| `--brand-edge` vs el fondo | 9,26:1 | 3 | OK |
| `--brand-edge` vs la banda alterna | 8,79:1 | 3 | OK |
| **1.4.3** texto `--n-1000` sobre relleno `--gold-500` | **9,26:1** | 4,5 | OK (era 7,30) |
| `--action-fg` sobre `--action` | 17,17:1 | 4,5 | OK |
| `--action-fg` sobre `--action-hover` | 15,72:1 | 4,5 | OK |

Los tres oros de oscuro subieron respecto de la v4 **porque el oro subió y el
fondo sigue siendo casi negro**. Es la dirección favorable de la fórmula, y es
exactamente por eso que el brillo del encargo se ve aquí y no en el tema claro.

### Semánticos

| | fondo | tarjeta | banda alterna | Mín. |
|---|---|---|---|---|
| `--success-dark` | 10,02 | 8,92 | 9,50 | 4,5 OK |
| `--warning-dark` | 7,89 | 7,03 | 7,49 | 4,5 OK |
| `--danger-dark` | 6,14 | 5,46 | 5,82 | 4,5 OK |
| `--info-dark` | 6,92 | 6,16 | 6,56 | 4,5 OK |

### ⛔ LOS DOS ÚNICOS FALLOS DE TODA LA AUDITORÍA

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--border` (n-700) vs la tarjeta | **1,92:1** | 3 | **FALLA 1.4.11** |
| `--border` (n-700) vs el fondo | **2,15:1** | 3 | **FALLA 1.4.11** |

`--border` es el **borde en reposo** de `Input`, `Select` y `Textarea`. WCAG
1.4.11 pide 3:1 en el límite de un control.

**Es deuda preexistente, no una regresión**: con la rampa cálida de la v4 daba
**1,46:1** y **1,61:1**. Esta tanda lo mejora en ~30 % y no lo cierra.

**Por qué no se cerró aquí.** `--border` hace dos trabajos a la vez: el borde de
un control y las **divisiones internas** de una superficie (cabeceras, pies,
`Divider`, cromo del shell). Subirlo a 3:1 en oscuro significa un `#6A6A74` —y
eso engorda todos los divisores de la aplicación—, además de obligar a recolocar
`--n-600` y `--n-500`, que están justo encima y los consume el CSS de impresión
del carnet. El arreglo correcto es **separar `--border-control` de `--border`**,
y eso toca `input.module.css`, `select` y `textarea`, que están fuera del alcance
declarado de esta tanda.

**Lo que sí se cerró**, y era el mismo problema un escalón más allá: en modo
`prefers-contrast: more` el token de reserva `--border-strong` daba **2,62:1** en
oscuro, o sea que quien *pedía explícitamente más contraste* seguía sin un límite
conforme. Pasa de `--n-600` a `--n-500` y da **3,19:1** contra la tarjeta y
**3,58:1** contra el fondo. Un token, cero módulos.

---

## 5. La placa de logo · tercera revisión de los mismos cuatro números

`ComercioLogo` no sigue al tema (el activo no es nuestro y asume fondo claro).

| Par | Ratio | Mín. | |
|---|---|---|---|
| filo `--n-450` vs placa blanca | 3,65:1 | 3 | OK |
| filo `--n-450` vs franja gris | 3,38:1 | 3 | OK |
| filo `--n-450` vs tarjeta oscura | 4,60:1 | 3 | OK |
| filo `--n-450` vs fondo oscuro | 5,16:1 | 3 | OK |
| inicial `--n-500` sobre placa blanca | 5,27:1 | 4,5 | OK |

**La lección, que ya ha costado tres veces**: la v3 lo tenía en `--n-400`; al
pasar a cálido en la v4 cayó a 2,81:1 y hubo que **añadir `--n-450`**; al pasar a
neutro en la v5 los cuatro se movieron otra vez. Ningún token cambió aquí —el
escalón sigue siendo el correcto— pero hubo que **volver a medirlo para saberlo**.
Al cambiar la temperatura o la claridad de una rampa cambia la luminancia, y un
ratio firmado deja de valer aunque nadie haya tocado el token.

---

## 6. Verificación de tokens huérfanos

Un `var(--token)` que no existe **no produce error**: la propiedad se queda en su
valor inicial —o hereda— y el fallo es mudo. Por eso el cruce se hizo por script
y no por lectura.

**Método**: extraer todo `var(--…)` de `src/**/*.{css,tsx}`, extraer todo
`--…:` definido en `tokens.css` + `globals.css`, y restar. Lo que quedaba se
contrastó contra las propiedades declaradas **dentro** de cada `.module.css` y
contra las inyectadas por `style={{}}` en TSX.

**Resultado: cero huérfanos.** Lo que queda sin definir en la capa global es, sin
excepción, legítimo:

- `--font-jakarta` — lo define `next/font` vía `jakarta.variable` en `<html>`.
- `--indice` `--total` `--progreso` `--avance` `--retardo` `--duracion` `--gap`
  `--alinear` `--justificar` `--min` `--ancho` `--alto-hoja` `--direccion`
  `--desplazamiento-entrada` — propiedades de componente inyectadas en línea.
- `--space-` — fragmento de `var(--space-${step})` en `layout.tsx` del kit.

**Y lo importante**: `--font-inter` y `--font-fraunces` **desaparecieron de los
dos lados**. No quedó ningún consumidor apuntando a las familias retiradas.

Se conservaron a propósito, con el nombre viejo, los **once tokens `--cacao-*`**
(3 crudos + 8 semánticos). Seis módulos los consumen. Renombrarlos sin tocar esos
módulos habría producido exactamente el fallo mudo que este apartado verifica.

---

## 7. Lo que queda por mirar A OJO

**Nada de esto se ha visto renderizado.** `tsc`, `eslint`, 253 pruebas y
`next build` pasan, y los 94 pares están calculados — pero la automatización de
navegador de esta máquina no pinta, y una medición sobre una pestaña que no se
pinta devuelve el valor inicial (ya dio tres diagnósticos falsos en la v4).

Por orden de riesgo:

1. **¿La franja negra es demasiado?** Es el cambio de mayor amplitud: `#2B1A15`
   → `#0A0A0C`. Sobre blanco puro el salto es de 19,78:1. Puede leerse
   espectacular o puede leerse como un agujero. Mirar el héroe público y la
   portada del catálogo.
2. **Las sombras sobre blanco puro.** No se tocaron geometrías ni opacidades,
   pero el fondo se aclaró (0,974 → 1,000) y el tinte pasó de sepia a neutro, así
   que **se ven más que antes**. Si alguna tarjeta parece ahora pesada, la causa
   está aquí y la respuesta es bajar el escalón de esa tarjeta, no la escala.
3. **El peso 800 del `hero-1` a 72px.** Es un cambio de carácter, no de tamaño.
   Puede quedarse corto (una geométrica a 800 sigue siendo más ligera que un
   serif a 600 en masa percibida) o pasarse. Mirar `PageHeader display`.
4. **`display-1` a 700 en Administración.** Es el único peldaño por debajo de
   `hero` que subió de peso, y el panel lo consume. Si los encabezados del panel
   se ven pesados, revertir **solo ese** a 600.
5. **El hover de la acción en tinta.** Cambió de dirección: antes oscurecía
   (hacia el cacao), ahora aclara (hacia `--n-850`). Comprobar que no se lee como
   «el botón se apaga».
6. **El ámbar contra el oro.** `--warning-light` (0,148 de luminancia) y
   `--gold-700` (0,150) son casi el mismo gris al desaturar, y son vecinos de
   tono. Nada lo impide salvo la regla de que ningún estado se codifique solo con
   color. **No se cambió**: mover un semántico es cambiar el significado, no la
   piel, y eso es decisión de producto. Mirarlo junto, en una pantalla real, y
   decidir.
7. **Plus Jakarta Sans a 13px en las tablas del panel.** Es donde vive la mayor
   parte de la aplicación y donde una geométrica se paga. Mirar `DataList` en
   `/admin/miembros` con cédulas y montos.
8. **El gris claro (1,08:1) en móvil, al sol.** La franja alterna es lo que da
   estructura a la pantalla ancha; si en un teléfono de gama media no se
   distingue, no estorba, pero tampoco sirve.

---

## 8. Pendiente fuera del alcance de esta tanda

1. **Tres copias a mano de la paleta quedaron en los colores de la v4**, y hacen
   que la PWA instalada arranque con una dirección de arte retirada:
   - `src/app/manifest.ts` — `background_color` y `theme_color` = `#14100E`
   - `src/app/apple-icon.tsx` — fondo `#14100E`, anillo `#C69A43`
   - `src/app/icon.svg` — fondo `#14100E` y las cuatro paradas del degradado de oro

   (`layout.tsx` sí se actualizó: `themeColor` pasa a `#FFFFFF` / `#111114`. Es
   el mismo archivo del alcance y el comentario que ya había allí instruía
   explícitamente moverlo con la paleta.)

2. **El renombrado `--cacao-*` → `--negro-*`**, con `<Section tono="cacao">` a la
   vez. Once tokens y seis módulos.

3. **`--border-control` separado de `--border`** para cerrar el 1.4.11 de tema
   oscuro. Ver §4.

4. **Los comentarios internos de los `.module.css` citan «Fraunces», «crema» y
   «cacao»** en una docena de sitios. No afectan al render —son comentarios— pero
   describen un sistema que ya no existe. Se limpian cuando se toque cada módulo.

---

## 9. Comandos de verificación ejecutados

```
./node_modules/.bin/tsc.cmd --noEmit                     limpio
./node_modules/.bin/eslint.cmd .                         limpio
./node_modules/.bin/vitest.cmd run --reporter=dot        253/253 en 20 archivos
./node_modules/.bin/next.cmd build                       compila, 40 rutas
```

Más el cruce de tokens huérfanos de §6 y el script de contraste que lee los hex
directamente de `tokens.css` (§2–§5), para que la tabla no pueda desincronizarse
de los valores reales.
