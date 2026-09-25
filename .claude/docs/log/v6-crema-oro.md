# v6 · «negro, crema y oro cálido» — reemplaza la gobernanza v5

**Fecha**: 22/09/2026 · rama `claude/portal-inicial-redesign-83a79d`
**Alcance**: `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`,
`CLAUDE.md`, este registro, y el rediseño visual de `src/app/(publico)/`.

> **Por qué existe esta versión**
>
> El cliente entregó una guía de marca real (logo con destello ✦, paleta
> negro/crema/oro metálico, tipografía **Playfair Display** (títulos) +
> **Montserrat** (texto)) y pidió que el portal inicial fuera fiel a ella. Eso
> choca de frente con la v5 (15/09/2026, `v5-negro-oro.md`), que había
> **derogado explícitamente** la mezcla serif+sans y los neutrales cálidos, con
> una auditoría que medía oro sobre crema en 1,99–2,03:1 (falla AA).
>
> No es un vaivén de gusto de sesión: es una identidad de marca entregada por
> el cliente, confirmada explícitamente como reemplazo formal de la v5.

---

## 0. Resumen ejecutable

| | |
|---|---|
| Pares de contraste recalculados (tema claro) | **35** |
| Cumplen | **35** |
| Fallan | **0** |
| Pares sin cambio (oscuro, cacao, placa de logo) | 31, ya auditados en v5 |
| Tokens de oro que cambiaron de valor | **0** — la escala entera se conservó |
| Tokens de neutral claro que cambiaron | 6 (`--w-0/50/100`, `--tinta-1/2/3`) |
| Familias tipográficas | 1 → **2** (Playfair Display + Montserrat) |
| Bug corregido de paso | `--cacao-bg` en tema claro mapeaba a un champán
  claro en vez de negro — contradecía `CLAUDE.md` y el propio comentario de
  arriba en `globals.css`. Confirmado con el propietario, corregido. |
| `tsc` · `eslint` · `vitest` · `next build` | limpios · 279/279 pruebas · 40 rutas |

**Sin verificar**: igual que con la v5, nadie ha mirado una pantalla — esta
máquina no renderiza (ver `CLAUDE.md`, «Deuda conocida»).

---

## 1. Qué cambió, en una tabla

### Neutrales: de gris neutro a crema cálido

| Token | v5 (gris neutro) | v6 (crema) |
|---|---|---|
| `--w-0` | `#FFFFFF` blanco puro | **`#FAF6EC`** crema |
| `--w-50` | `#F6F6F8` gris claro | **`#F7F1E4`** gris claro cálido |
| `--w-100` | `#EFEFF3` gris hondo | **`#F5EFDF`** gris hondo cálido |
| `--tinta-1` | `#121216` | **`#201B15`** |
| `--tinta-2` | `#55555F` | **`#5A5044`** |
| `--tinta-3` | `var(--n-500)` = `#6B6B75` | **`#5F5548`** (valor propio, ya no
  comparte token con la rampa oscura) |

**Ningún tono de oro cambió.** `--gold-600` (`#AE8118`) y `--gold-700`
(`#886712`) —los dos que viven sobre superficies claras— se mantuvieron
exactamente iguales. El crema se calibró ALREDEDOR del oro ya probado, no al
revés: mover un token (el crema) es más barato que mover cuatro
(`--gold-500/600/700/800`) y volver a auditar cada consumidor.

**Lo que sí tuvo que ceder**: `--surface-hover` bajó su mezcla de tinta de
6 % a **3,5 %**. Con el crema (más oscuro que el blanco puro) la mezcla al 6 %
hacía que `--gold-600` cayera a 2,89:1 contra el hover — bajo el 3:1 de
1.4.11. Al 3,5 % el hover se separa 1,07:1 del fondo (antes 1,13:1) y el oro
vuelve a pasar en 3,04:1.

### Tipografía: de una familia a dos

| | v5 | v6 |
|---|---|---|
| Interfaz | Plus Jakarta Sans | **Montserrat** |
| Display | Plus Jakarta Sans (alias) | **Playfair Display** (familia real) |
| `--font-sans` | `var(--font-jakarta), …` | `var(--font-montserrat), …` |
| `--font-display` | `var(--font-sans)` | `var(--font-playfair), Georgia, …` |
| `hero-1` | 800 · −0,040em | **600 · −0,032em** (vuelve a la v4) |
| `hero-2` | 700 · −0,030em | **600 · −0,024em** |
| `hero-cifra` | 700 · −0,022em | **600 · −0,018em** |
| `display-1` | 700 · −0,030em | **700 · −0,030em** — SIN CAMBIO: usa
  `--font-sans` (Montserrat), no `--font-display`. Ver §2. |

**`-webkit-font-smoothing: auto` vuelve** en `.t-hero-1/.t-hero-2/.t-hero-cifra`
(`globals.css`): la v5 lo había retirado porque un sans geométrico no lo
necesita; con Playfair Display de vuelta, el motivo original (pierde astas
finas con `antialiased` en Chrome/macOS) reaparece igual que estaba antes de
la v5.

**Los módulos que consumen `--font-display`** (héroe público, «así funciona»,
`Cifra`, `ficha.module.css`, `perfil.module.css`, `layout.module.css`) YA
TENÍAN `font-feature-settings: 'liga' 1, 'calt' 1` y
`-webkit-font-smoothing: auto` escritos desde antes de la v5 — nunca se
limpiaron (deuda conocida #4 de `CLAUDE.md`). Con el serif de vuelta, esas
propiedades vuelven a ser correctas sin tocar una línea de CSS.

**Coste de fuente, medido en `.next/static/media` tras `next build`**: 364 KB
de woff2 en total (todos los cortes de `unicode-range`), de los que
aproximadamente 110 KB son los tres cortes marcados como precargados. La v5
había bajado el presupuesto a 57,6 KB / 26,6 KB; la v6 lo sube de vuelta,
como costo aceptado del mandato del cliente — no es un descuido.

---

## 2. ⚠️ Aviso importante: `display-1` NO usa Playfair Display

Es el error más fácil de cometer al leer este registro en diagonal.
`.t-display-1` (el peldaño de 36–48px que usan las cifras y encabezados de
Administración) está declarado en `globals.css` §4 dentro del bloque que fija
`font-family: var(--font-sans)` — junto con `.t-body`, `.t-title-*`, etc.
**No** está en el bloque de `.t-hero-*`, que es el único que usa
`--font-display`.

Por eso `--t-display-1-weight` se queda en **700** (el valor de la v5) y no
vuelve a 600: Montserrat sigue siendo un sans sin modulación de asta, así que
el motivo que subió el peso en la v5 («a 48px una geométrica a 600 se lee
delgada») sigue siendo cierto con la familia nueva. Solo bajaron de peso los
TRES peldaños que de verdad cambiaron de familia: `hero-1`, `hero-2` y
`hero-cifra`.

---

## 3. El bug de `--cacao-bg` en tema claro

`globals.css` tenía dos comentarios contiguos que se contradecían:

1. Uno (v5, con las ratios de 12,27:1 etc.) decía: *«Se declara una sola vez,
   fuera de los bloques de tema, porque la franja es negra en claro y en
   oscuro.»*
2. El siguiente, sin fecha ni versión, decía: *«LA FRANJA DEPENDE DEL TEMA. En
   claro es champán con tinta y oro de texto...»* y mapeaba
   `--cacao-bg: var(--champan-100)` — un marfil claro — **solo en el bloque
   `:root` (tema claro)**.

El segundo bloque citaba un encargo posterior del propietario («el modo claro
es el primordial… el negro no lo uses en ese modo») que **`CLAUDE.md` nunca
recogió**. Confirmado directamente con el propietario para esta tanda: la
franja es negra en los dos temas, sin excepción — coincide además con la
referencia de marca del cliente (la fotografía del héroe es oscura).

Se retiró el bloque champán y los tokens raw `--champan-100/200` (sin más
consumidores tras el fix, verificado por grep). Los ocho `--cacao-*`
semánticos se declaran ahora una sola vez, iguales al bloque `[data-theme=
'dark']` — que se deja igual, redundante pero inofensivo, por si algún día
hiciera falta volver a diferenciar por tema.

---

## 4. Tabla de ratios · TEMA CLARO (recalculada completa)

Método: fórmula de luminancia relativa WCAG 2.1 aplicada a los hex leídos de
`tokens.css`/`globals.css`, por script (no a mano). Mínimos: 4,5:1 texto
(1.4.3), 3:1 límite de control (1.4.11).

### Texto sobre las tres superficies claras

| Par | Ratio | Mín. | |
|---|---|---|---|
| tinta-1 vs crema | 15,83:1 | 4,5 | OK |
| tinta-1 vs gris claro | 15,18:1 | 4,5 | OK |
| tinta-1 vs gris hondo | 14,89:1 | 4,5 | OK |
| tinta-2 vs crema | 7,30:1 | 4,5 | OK |
| tinta-2 vs gris claro | 7,00:1 | 4,5 | OK |
| tinta-2 vs gris hondo | 6,86:1 | 4,5 | OK |
| tinta-3 vs crema | 6,76:1 | 4,5 | OK |
| tinta-3 vs gris claro | 6,48:1 | 4,5 | OK |
| tinta-3 vs gris hondo | 6,35:1 | 4,5 | OK |

### Oro de texto (sin cambio de valor, superficie nueva)

| Par | Ratio | Mín. | |
|---|---|---|---|
| gold-700 (`--brand`) vs crema | 4,87:1 | 4,5 | OK |
| gold-700 vs gris claro | 4,67:1 | 4,5 | OK |
| **gold-700 vs gris hondo** | **4,58:1** | 4,5 | **OK — idéntico a la v5** |
| gold-800 vs crema | 7,12:1 | 4,5 | OK |
| gold-800 vs gris claro | 6,83:1 | 4,5 | OK |
| gold-800 vs gris hondo | 6,70:1 | 4,5 | OK |

### El par de acción ceremonial

| Par | Ratio | Mín. | |
|---|---|---|---|
| 1.4.3 texto tinta-1 sobre relleno gold-600 | 4,84:1 | 4,5 | OK (era 5,30) |
| 1.4.11 filo gold-600 vs crema | 3,27:1 | 3 | OK (era 3,53) |
| 1.4.11 filo vs gris claro | 3,13:1 | 3 | OK |
| **1.4.11 filo vs gris hondo** | **3,07:1** | 3 | **OK ← el techo (era 3,08)** |
| 1.4.11 filo vs `--surface-hover` (al 3,5 %) | 3,04:1 | 3 | OK (era 3,12 al 6 %) |
| 1.4.11 filo vs franja negra | 5,61:1 | 3 | OK — sin cambio |

### Acción en tinta

| Par | Ratio | Mín. | |
|---|---|---|---|
| crema sobre `--action` (tinta-1) | 15,83:1 | 4,5 | OK |
| crema sobre `--action-hover` (n-850) | 13,94:1 | 4,5 | OK |

### Semánticos

| | crema | gris claro | gris hondo | Mín. |
|---|---|---|---|---|
| success-light | 5,02 | 4,82 | 4,72 | 4,5 OK |
| warning-light | 4,90 | 4,70 | 4,61 | 4,5 OK |
| danger-light | 5,77 | 5,53 | 5,42 | 4,5 OK |
| info-light | 5,39 | 5,17 | 5,07 | 4,5 OK |

Ningún semántico cambió de valor: los cuatro bajaron un poco respecto a la v5
(el fondo se oscureció), pero ninguno se acerca al mínimo.

### Bordes, hover y hueco

| Par | Ratio | Mín. | |
|---|---|---|---|
| `--border` vs crema | 4,08:1 | 3 | OK (era 4,17) |
| `--border` vs gris hondo | 4,01:1 | 3 | OK (era 4,00) |
| `--text` sobre `--surface-hover` | 14,75:1 | 4,5 | OK |
| `--text-3` sobre `--surface-hover` | 6,29:1 | 4,5 | OK |
| **`--brand` (gold-700) sobre `--surface-hover`** | **4,54:1** | 4,5 | **OK ← el más ajustado de esta tabla** |
| `--text-3` sobre `--surface-hueco` | 5,86:1 | 4,5 | OK |
| `prefers-contrast: more` · `--border-strong` vs crema | 17,47:1 | 3 | OK |

---

## 5. Tema oscuro, la franja negra y la placa de logo · SIN CAMBIO

Ningún token de estas tres tablas se tocó: los 31 pares que auditó
`v5-negro-oro.md` §3–§5 (franja negra, tema oscuro, placa de logo) siguen
siendo válidos tal cual están ahí. Se verificó por inspección que ningún
valor crudo (`--n-*`, `--cacao-900/800/700`, `--gold-300/400/500`) cambió en
esta tanda.

---

## 6. Verificación de tokens huérfanos

Se retiraron `--font-jakarta` (ya no lo define nada; era `layout.tsx`) y
`--champan-100/200`. Se cruzó por grep contra todo `src/**/*.{css,tsx}`:
**cero referencias sobrantes** a ninguno de los tres. `--font-montserrat` y
`--font-playfair` se definen en `layout.tsx` y se consumen únicamente en
`tokens.css` §7 — el mismo patrón de un solo punto de entrada que ya usaba
`--font-jakarta`.

---

## 7. Comandos de verificación ejecutados

```
corepack pnpm install --frozen-lockfile                 ok, 408 paquetes
./node_modules/.bin/tsc.cmd --noEmit                     limpio
./node_modules/.bin/eslint.cmd .                         limpio
./node_modules/.bin/vitest.cmd run --reporter=dot        279/279 en 22 archivos
./node_modules/.bin/next.cmd build                       compila, 40 rutas
```

Más el script de contraste (Node, fórmula WCAG 2.1 desde los hex) de §4, y el
cruce de tokens huérfanos de §6.

---

## 8. Pendiente fuera del alcance de esta tanda

1. **Nadie ha mirado una pantalla.** Igual que con la v5: `tsc`, `eslint`,
   279 pruebas y `next build` pasan, y los 35 pares nuevos están calculados
   — pero esta máquina no renderiza. Mirar el héroe público, la tarjeta de
   beneficios y el carnet del socio en un navegador real antes de dar la v6
   por cerrada a ojo.
2. **Los comentarios de `escaparate.module.css`, `hero-publico.module.css` y
   otros módulos que citan «Fraunces»** vuelven a ser conceptualmente
   correctos (hay un serif de verdad otra vez) pero el nombre de la familia
   que citan es el viejo. Se limpian cuando se toque cada módulo — no
   afectan al render.
3. **`accessibility-auditor` no se ha corrido todavía sobre este cambio** en
   el momento de escribir este párrafo — ver el resto de esta sesión para el
   resultado.
4. El resto de la deuda conocida de la v5 (renombrado `--cacao-*` →
   `--negro-*`, `--border-control` — que ya se cerró en la v5 y sigue
   cerrado, comentarios con «crema»/«cacao» desactualizados en otros
   módulos) no cambia con esta tanda.
