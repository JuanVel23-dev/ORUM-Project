# Log · m1-fundacion

> Una entrada por tarea terminada. Formato: `## <tarea>` + qué se hizo, qué quedó fuera y por qué.


---

## A · Tokens (13/09/2026)

### Hecho

**`src/styles/tokens.css`**
- §6 sombras reescrita con la escala desplazada de §2.3, literal:
  `--shadow-1: 0 2px 0 …/.10` · `--shadow-2: 0 3px 0 …/.14 + 0 6px 16px …/.08` ·
  `--shadow-3: 0 6px 0 …/.16 + 0 12px 28px …/.10` ·
  `--shadow-4: 0 10px 0 …/.18 + 0 24px 56px …/.14`, todas en rgb 20/20/28
  (el susurro frío, no negro puro).
- Añadido `--shadow-0: 0 1px 0 rgba(20,20,28,.10)` — la mitad de `--shadow-1`.
  No estaba en el documento pero §4.3 exige «sombra a la mitad» al pulsar y
  sin token habría que escribir el literal en cada componente.
- Los cuatro grises `--w-100..400` quedan SIN consumidor y se anotan como tal
  en la rampa. Se conservan (es la capa cruda, no el mapeo) con la advertencia
  de que usarlos es volver a la dirección anterior.

**`src/app/globals.css`**
- §2.1 papel: `--bg` y `--surface-sunk` pasan a `--w-0`; `--surface` ya lo era;
  `--surface-hover` a `--w-50`.
- §2.2 tinta: `--border-strong: var(--n-1000)` · `--border: color-mix(…55%…)`
  · `--border-subtle: color-mix(…22%…)`. Se usa `color-mix` sobre `--n-1000`
  y no un rgba literal, para que los tres sigan siendo EL MISMO color si la
  tinta cambia.
- Nuevo `--shadow-press` (claro `= --shadow-0`; oscuro `= 0 0 rgba(0,0,0,0)`).
- Nuevo `--surface-hueco` (claro: tinta al 7 %; oscuro: `--n-850`). Ver abajo.
- §3: los tres bloques oscuros ([data-theme], fallback de
  `prefers-color-scheme`) conservan filo claro + `--edge` intactos. Se añadió
  el comentario que explica por qué §2 NO se traslada al oscuro.

### Verificación de la prohibición del `none`

Revisadas las 18 declaraciones `box-shadow` que consumen tokens. Ninguna
contiene `none` dentro de una lista. Los dos `box-shadow: none` que existen
(`card .sunk` y `data-list .envoltorio` en móvil) son el valor COMPLETO de la
declaración, que sí es legal. `--edge` sigue valiendo `0 0 rgba(0,0,0,0)` y
los `--shadow-*` del tema oscuro también usan sombra transparente, no `none`.

### Contrastes (tema claro, sobre papel #ffffff)

| Token | Valor efectivo | Ratio vs papel | Papel |
|---|---|---|---|
| `--border-strong` | #0a0a0c | 20,4:1 | define superficie ✓ 1.4.11 |
| `--border` | tinta 55 % ≈ #787879 | 4,42:1 | separa dentro ✓ 1.4.11 |
| `--border-subtle` | tinta 22 % ≈ #c9c9ca | 1,67:1 | hairline de fila (antes 1,17:1) |

`--border-subtle` no llega a 3:1 y no debe llevar él solo el peso de definir
una superficie: es división interna. Donde una superficie se definía con
`--border-subtle` y encima perdió su relleno distinto, se sube a `--border`
(bloque B).

### Fuera / no hecho

- `--surface-hover: var(--w-50)` se aplica LITERAL como pide el encargo, pero
  sobre papel blanco da 1,02:1: es imperceptible. Está señalado en el reporte
  como el punto de la dirección que falla al tocar el código. Mitigación en el
  bloque B: donde el hover era la única señal se le añade una segunda (trazo
  que aparece, acciones que se revelan), nunca se deja color solo.
- No se toca `--material`, `--scrim` ni la tabla de contrastes dorados.
