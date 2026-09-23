# T5 — Validación de contraste, previa a implementación

> `accessibility-auditor` · 30/08/2026 · WCAG 2.1 AA
> Alcance: el par relleno/texto `--gold-600` que RUP-1 propone para el botón primario
> del Portal de Miembros y las seis pantallas de acceso.
>
> Aritmética re-verificada de forma independiente antes de firmar la tabla de `CLAUDE.md`.

---

## Veredicto

**`--gold-600` como relleno con texto en tinta CUMPLE los dos criterios, en los dos temas.
La puerta se abre: el primario dorado puede implementarse.**

La estimación preliminar del plan (~5.8:1) **estaba sobrevalorada**. El número real es
**5.40:1**. Sigue por encima del 4.5:1 exigido, pero con menos margen del que se asumía.

Bloqueante: 0 · Serio: 0 · Moderado: 1 · Menor: 2

---

## Método

Luminancia relativa, WCAG 2.1 §1.4.3:

```
c_srgb = canal / 255
c_lin  = c_srgb / 12.92                         si c_srgb ≤ 0.03928
c_lin  = ((c_srgb + 0.055) / 1.055) ^ 2.4        en otro caso

L = 0.2126·R_lin + 0.7152·G_lin + 0.0722·B_lin
Contraste = (L_claro + 0.05) / (L_oscuro + 0.05)
```

**Autocalibración**: antes de medir nada nuevo, se recalcularon las seis filas que
`CLAUDE.md` ya daba por verificadas (`tokens.css:47-53`). Las seis coinciden con el
número publicado. El método es fiable.

---

## 1. Texto sobre relleno — WCAG 1.4.3, umbral 4.5:1

`--gold-600 = #9e8244` (verificado en `tokens.css:60`) → R=158, G=130, B=68

| Canal | c_srgb | c_lin |
|---|---|---|
| R | 0.619608 | 0.341944 |
| G | 0.509804 | 0.223228 |
| B | 0.266667 | 0.057805 |

**L(gold-600) = 0.236551**

| Texto | Hex | L | Contraste | ¿Cumple 4.5:1? |
|---|---|---|---|---|
| `--n-1000` (el que ya usa `.gold`) | `#0a0a0c` | 0.003082 | **5.40:1** | ✅ margen +0.90 |
| `--text` claro | `#141418` | 0.007150 | **5.01:1** | ✅ margen +0.51 |

---

## 2. Borde contra superficie — WCAG 1.4.11, umbral 3:1

El `.button` lleva `border: 1px solid transparent`, así que el filo es la propia
transición relleno→superficie.

### Tema claro

| Superficie | Token | Contraste |
|---|---|---|
| Tarjeta / fondo de campo | `--surface` (`#ffffff`) | **3.66:1** ✅ |
| Fondo de página | `--bg` (`#fbfbfc`) | **3.54:1** ✅ |

El primero reproduce exactamente el 3.66:1 ya publicado en `tokens.css:52`.

### Tema oscuro

| Superficie | Token | Contraste |
|---|---|---|
| Fondo de página | `--bg` (`--n-1000`) | **5.40:1** ✅ |
| Tarjeta | `--surface` (`--n-900`, `#16161a`) | **4.92:1** ✅ |

### Pantallas de acceso

La tarjeta de `pantalla-auth` no es un color sólido:
`color-mix(in srgb, var(--surface) 82%, transparent)` sobre el fondo. Compuesta:

```
R = G = 0.82·22 + 0.18·10 = 19.84
B     = 0.82·26 + 0.18·12 = 23.48
```

L ≈ 0.007055 → **5.02:1** ✅

**Las cinco superficies pasan.** El margen más ajustado es 3.54:1 en tema claro: un 18%
por encima del mínimo, no un empate técnico.

---

## 3. Por qué `--gold-600` y no otro

| Candidato | Texto/relleno | Borde/superficie clara | ¿Sirve? |
|---|---|---|---|
| `--gold-500` | 7.94:1 ✅ | 2.49:1 ❌ | No — falla 1.4.11 |
| **`--gold-600`** | **5.40:1** ✅ | **3.66:1** ✅ | **Sí — el único que resuelve ambos lados** |
| `--gold-700` | 3.64:1 ❌ | 5.44:1 ✅ | No — falla 1.4.3 |

`--gold-700`, **por ser más oscuro, reduce** el contraste con un texto también oscuro.
Es contraintuitivo pero correcto: cuanto más se acerca el relleno al tono de la tinta,
menor es la diferencia de luminancia entre ambos. No se puede "ir a más oscuro" buscando
seguridad.

---

## Hallazgos

### [MODERADO] El presupuesto de oro se puede romper con un solo CTA

- **Criterio**: no es WCAG. Es la regla de marca de `CLAUDE.md` (≤5% del área visible).
- **Ubicación**: `src/components/ui/button.module.css:96-100` (`.md`=44px, `.lg`=52px).
- **Problema**: un botón dorado de ancho completo a 52px sobre un lienzo de 375×667 ocupa
  `375×52 = 19 500px²` de `250 125px²` → **7.8%**. A 44px baja a **6.6%**. Ambos por
  encima del 5%, y eso **antes** de sumar wordmark, anillo de foco y hairlines dorados de
  la misma pantalla.
- **Impacto**: ninguno en accesibilidad. Es el riesgo de que la regla de marca se
  incumpla en cuanto exista una pantalla real.
- **Corrección**: medir el presupuesto **sobre captura real** del primer pantallazo a
  375×667 antes de dar RUP-1 por cerrado. Si el CTA por sí solo roza el límite, la fila
  de categorías, el badge de beneficio y el filo del carnet no tienen margen.

### [MENOR] Los estados `hover`/`active`/`disabled` del relleno nuevo no existen todavía

- **Ubicación**: no hay variante de relleno plano en `button.module.css`; la `.gold`
  actual usa `--gold-sheen`, no `--gold-600` sólido.
- **Problema**: aclarar el relleno en `:hover` mejora 1.4.3 pero lo acerca a la superficie
  clara y perjudica 1.4.11. Oscurecerlo hace lo contrario.
- **Corrección**: repetir este cálculo para el color exacto de cada estado antes de
  fusionar. **No asumir que "más oscuro es más seguro"**: la tabla de arriba demuestra
  que `--gold-700` falla el lado del texto.

### [MENOR] El anillo de foco comparte token con el relleno propuesto — verificado, no es fallo

- **Ubicación**: `globals.css:47` (`--focus: var(--gold-600)`), con `outline-offset: 2px`.
- **Resultado**: al llevar desplazamiento, el anillo se dibuja **fuera** del botón, sobre
  la superficie circundante, así que su contraste es el ya calculado. No hay solape de
  color idéntico sobre color idéntico. En tema oscuro el foco es `--gold-400`, no 600.
- **Corrección**: ninguna. Se registra como verificado.

---

## Verificado sin hallazgos

| Fila de `CLAUDE.md` | Recalculado | ¿Coincide? |
|---|---|---|
| `--gold-300` sobre `--n-1000` | 13.03:1 | ✅ |
| `--gold-500` sobre `--n-1000` | 7.94:1 | ✅ |
| `--n-1000` sobre `--gold-500` | 7.94:1 | ✅ |
| `--gold-700` sobre `--w-0` | 5.44:1 | ✅ |
| `--gold-600` sobre `--w-0` | 3.66:1 | ✅ |
| `--gold-500` sobre `--w-0` | 2.49:1 | ✅ prohibición correcta |

---

## Requiere prueba manual

- **Presupuesto de oro sobre captura real** (hallazgo moderado). No es medible sobre
  maquetas que aún no existen.
- **Conmutación de tema en vivo**: el cálculo asume que `color-mix(in srgb, …)` compone
  como mezcla lineal de canales gamma, que es el comportamiento estándar. Confírmalo con
  una captura cuando exista el componente — recordando el aviso de `CLAUDE.md`: medir
  durante una transición en una pestaña sin pintar da falsos negativos.
- **Estados del relleno** (hallazgo menor 1): no hay código que auditar todavía.
- **Lector de pantalla sobre el botón dorado**: fuera del alcance de una auditoría de CSS.
