# V9 · Requisitos por dispositivo del carrusel destacado

> `mobile-ux-specialist` · 12/09/2026 · rama `mejora-diseno`, HEAD `acf7cc0`
>
> Auditoría de `.claude/docs/PLAN-carrusel-destacados.md` y del `Carril` existente como base.
> Persistido por el orquestador: el agente audita con herramientas de solo lectura.
>
> **Bloqueantes: 0 · Serios: 3 · Moderados: 5 · Menores: 3**

---

## Veredicto

La aritmética de móvil del plan (320 y 375px) **cuadra**. La de escritorio **no**: ignoraba
`--content-max`, y su conclusión de que «con 4 comercios no hay nada que deslizar» era falsa.
La herencia de `scroll-snap-type: proximity` es correcta para el `Carril` e **incorrecta para
esta pieza**. Las otras seis decisiones heredadas aguantan sin cambios: están calculadas
sobre geometría que no depende del ancho de tarjeta.

Las tres correcciones ya están aplicadas en el plan (§5.1 a §5.6).

---

## 1. Las siete decisiones heredadas del carril

| # | Decisión | ¿Aguanta? | Por qué |
|---|---|---|---|
| 1 | Sangrado solo a `inline-end` | ✅ **Sin cambios** | Protege el **borde de arranque**, y la banda del gesto «atrás» tiene ancho fijo (~20–30px) independiente de cuánto mida la tarjeta. Con menos tarjetas visibles a la vez, el atajo es **más** necesario, no menos |
| 2 | `scroll-snap-type: x proximity` | 🔴 **No — `mandatory` aquí** | Ver F3 |
| 3 | `scroll-padding-inline-start: 0` | ✅ Sin cambios | Sigue atado al sangrado de arranque cero. El tipo de snap es un eje independiente: no se toca |
| 4 | Ningún `touch-action` | ✅ **Más importante que antes** | Con la tarjeta casi a ancho de pantalla, el área donde el gesto es ambiguo entre «deslizar la fila» y «hacer scroll de la página» es mayor. Forzar `pan-x` mataría el scroll vertical en más superficie |
| 5 | `padding-block: var(--space-1)` | ✅ Sin cambios | Es geometría del **anillo de foco** (2px de trazo + 2px de desplazamiento), no de la tarjeta |
| 6 | `overscroll-behavior-inline: contain` | ✅ Sin cambios | No depende del tamaño de tarjeta |
| 7 | Sin `tabindex` en la pista | ✅ Sin cambios | Cada tarjeta sigue siendo un `<Link>` |

---

## 2. Tabla por franja, con la aritmética verificada

Fórmula: ancho visible = `contenedor − --pad-contenido`; asomo = `visible − Cw − gap`;
alto de imagen = `Cw × 3/4`. Gap asumido `var(--space-3)` = 12px, igual que el `Carril`.
Bloque de contenido bajo la imagen ≈ **99px** (relleno 32 + nombre 24 + 4 + meta 16 + 8 +
insignia 15), **estimado — a confirmar contra el CSS que se escriba**.

| Franja | `--pad-contenido` | Tarjeta | Asomo | Imagen 4:3 | Alto total | Visibles |
|---|---|---|---|---|---|---|
| Teléfono pequeño · 320px | 16px | **243px** | **49px** (20 %) | 182px | ~281px | 1 + asomo |
| **Canónico · 375×667** | 16px | **285px** | **62px** (22 %) | 214px | ~313px | 1 + asomo |
| Teléfono grande · 430px | 16px | **300px** (tope) | **102px** (34 %) | 225px | ~324px | 1 + ~1,3 |
| Tableta · 768px | 24px | **340px** (tope) | **40px** (12 %) | 255px | ~354px | 2 + asomo |
| Escritorio · contenido topado a 1100px | 24px | **320px** | **92px** (29 %) | 240px | ~339px | **3 + asomo** |

---

## 3. La franja de la siguiente tarjeta

Sustituye a las flechas, así que es un requisito, no un adorno.

- **Piso duro: 24px.** Por debajo, el borde de la tarjeta cortada se confunde con la sombra
  del `Card` y se lee como margen decorativo, no como «hay más».
- **Objetivo: 48–72px**, suficiente para asomar el logo o la esquina de la imagen siguiente.
- **A 320px**: 49px. Pasa el piso y roza el objetivo por abajo. **Sin margen de sobra**: si el
  gap sube a `--space-4` (16px) o la tarjeta se ensancha, cae bajo el piso.
- **El punto más ajustado de la tabla es 768px, con 40px.** No bloquea, pero es el primer
  sitio a mirar en captura real.

---

## Hallazgos

### F1 · SERIO — La aritmética de escritorio del plan estaba mal
`PLAN-carrusel-destacados.md` §5.3 (versión original) ignoraba `--content-max: 1100px`
(`tokens.css:336`), que `.main` aplica como `max-width` (`portal.module.css:243`). En
cualquier viewport ≥1100px el contenido **no crece**: son 1052px útiles y 1076px de pista con
sangrado, nunca 1440. Cuatro tarjetas piden 1316px y no caben — caben tres y un 29 % de la
cuarta. **Corregido en §5.3.** El comportamiento resultante es el bueno; el razonamiento que
lo sostenía, no.

### F2 · MODERADO — `vw` contra `@container`, en el mismo documento
El plan pedía `min(76vw, …)` dos líneas antes de exigir «`@container contenido`, nunca
`@media`». `vw` mide viewport; `cqi` mide el contenedor que `.main` publica. Hoy coinciden
porque el portal no tiene barra lateral: coincidencia de topología, no garantía, y es el mismo
error que el plan advertía para `@media`. **Corregido a `cqi` en §5.5.**

### F3 · SERIO — `mandatory`, no `proximity`, solo en esta pieza
La razón original de `proximity` —«pelea con el momento en listas largas»— vale para el
`Carril` (10 tarjetas de 200px, varias visibles, se hojea). No vale aquí: tope de 6, tarjeta
al 76–94 % del ancho, **una visible a la vez**. Con `proximity` un flick corto que no alcanza
el umbral heurístico del motor —umbral que **difiere entre Chrome y Safari**— deja media
tarjeta de cada una a la vista. **Corregido en §5.1**, con el comentario que explica por qué
esta pieza diverge de la regla general.

### F4 · SERIO — Horizontal: la primera tarjeta no cabe
A 667×375 la tarjeta mide ~324px de alto contra ~215–260px de altura útil, porque la barra
inferior sigue visible (el umbral que la oculta es 768px). El socio ve una foto cortada y
tiene que desplazarse para leer el nombre. **Corregido en §5.4** con un cap por altura.

### F5 · MENOR — El sangrado no incluye `safe-area-inset-right`
`carril.module.css:65-66` cancela `var(--pad-contenido)` pero `.main` calcula su relleno como
`max(--pad-contenido, env(safe-area-inset-right))` (`portal.module.css:264`). En horizontal
con muesca a la derecha el sangrado se queda ~20–30px corto. **No es peligroso**: la tarjeta
queda más adentro, nunca invade la zona insegura. Corrección opcional:

```css
margin-inline-end: calc(max(var(--pad-contenido, 0px), env(safe-area-inset-right, 0px)) * -1);
padding-inline-end: max(var(--pad-contenido, 0px), env(safe-area-inset-right, 0px));
```

### F7 · MODERADO — No se puede reutilizar `.tarjeta` tal cual
`--carril-tarjeta-w` vale 200px en todos los anchos, deliberadamente. Sobrescribirlo
globalmente rompería los dos consumidores actuales del `Carril`. **Resuelto en §5.6**:
se sobrescribe en una instancia, vía token dinámico.

### F8 · MODERADO — El equivalente reducido de A3 no puede ser solo color
El plan lo dice bien (filo + sombra). Lo que faltaba es el precedente exacto:
`portal.module.css:394-399` ya resuelve `.tab:active` bajo movimiento reducido. El realce debe
**reutilizar** `--shadow-2` → `--shadow-3` y `--gold-hairline`, que `Card interactive` ya usa,
sin inventar un tercer mecanismo.

### F9 · Informativo — No hace falta `dvh`
El carrusel no usa ninguna unidad de viewport vertical: su tamaño sale de `cqi` y de
`aspect-ratio`. `.portal` usa `min-height: 100dvh`, que es un mínimo y deja de aplicar cuando
la página ya es más alta que la pantalla. No hay `viewport.interactiveWidget` declarado en
`src/app/layout.tsx`, así que el comportamiento por defecto es *resizes-visual*: el viewport
de layout no cambia al abrir el teclado.

Lo que sí ocurre, y **es correcto**: el campo de búsqueda hace scroll automático al enfocarse
y empuja el carrusel fuera de la vista. **No poner `position: sticky`** en el título ni en la
pista, o competiría con ese scroll.

### F10 · Confirmación — CLS
Lo único que garantiza salto cero es `aspect-ratio: 4/3` **fijo por CSS en el marco**, no
atributos `width`/`height` en el `<img>`, que competirían con `object-fit: cover` en fotos de
proporción real distinta. Mismo patrón que la placa (`comercio-logo.module.css:41`). El marco
es idéntico en I1, I2, I3 y en el esqueleto, así que tampoco hay salto entre estados.

### F11 · Confirmación — Objetivos táctiles · sin hallazgos
Peor caso (320px): tarjeta de 243×281px, muy por encima de 44×44. El gap de 12px supera el
mínimo de 8px entre destinos. Nada interactivo anidado: insignia, placa y velo son
decorativos, así que no hay robo de foco ni doble destino.

### F12 · Presupuesto de rendimiento en gama baja
- **Capas compuestas: máximo 1 persistente por tarjeta** — la imagen, promovida por A2. A1
  promueve una capa temporal de ~300–400ms, y con el escalonado de 60ms nunca las 6 a la vez.
  Total tras la entrada: 6, más las 2 del cromo fijo (cabecera y barra, donde
  `backdrop-filter` sí está permitido por ser cromo y no fila de lista).
- **Propiedades animables: solo `transform` y `opacity`.** El `box-shadow` de A3 no se anima
  en continuo: es un cambio discreto en interacción puntual, como ya hace
  `Card.interactive:hover`.
- **Prohibido**: `backdrop-filter` en la tarjeta, Ken Burns en bucle, y animar `width`,
  `height`, `top`, `left` o `margin`.
- **Orden de recorte si hay tirones**, de más a menos prescindible:
  1. **A2 (paralaje)** — la más cara y la de menor pérdida funcional.
  2. **La sombra extra de A3** — dejar solo el cambio de filo.
  3. **A1** — pasar a solo `opacity`, como bajo movimiento reducido.

---

## 4. Áreas seguras

| Zona | Qué hacer |
|---|---|
| Muesca / isla dinámica (arriba) | Nada nuevo: lo resuelve `.cabecera` con `max(--space-3, env(safe-area-inset-top))`. El carrusel vive por debajo |
| Gesto «atrás» (bordes verticales, retrato) | Resuelto por el sangrado asimétrico heredado |
| Muesca lateral en **horizontal** | **F5**: falta `env(safe-area-inset-right)` en el `calc()`. Seguro pero imperfecto |
| Indicador de inicio (abajo) | No interseca: el carrusel es una fila en medio del documento, no cromo fijo |
| Esquinas curvas de pantalla | Nada: solo afectan a elementos fijos en las esquinas |

---

## 5. Protocolo de verificación manual, en orden

La automatización de esta máquina **no puede redimensionar la ventana** (deuda conocida de
`CLAUDE.md`). Todo esto exige dispositivo real o, como mínimo, el modo dispositivo de DevTools
con estrangulamiento de CPU.

1. **Gesto «atrás» desde el borde izquierdo, en iOS y Android, con el carrusel visible.**
   Arrastrar desde el borde físico sobre la primera tarjeta. **Fallo**: la aplicación navega
   atrás o se cierra. Es el fallo más grave y el menos visible en código. Repetir en Android,
   que tiene el gesto en los dos bordes.
2. **Snap tras el cambio a `mandatory`**: flick corto sobre la primera tarjeta. Debe aterrizar
   limpio en la 1 o la 2, nunca a medio camino. En Chrome Android **y** Safari iOS.
3. **Asomo a 320px y a 768px**, los dos puntos más ajustados: confirmar que se lee como «hay
   más» y no como ruido de sombra.
4. **Horizontal a 667×375**: rotar con el catálogo abierto. ¿Cabe la primera tarjeta?
5. **Teclado**: tocar el campo de búsqueda con el carrusel visible. El scroll automático debe
   sacarlo de la vista sin recortes ni franjas en blanco.
6. **Anillo de foco**: tabular hasta la primera y la última tarjeta. Sin recorte por
   `overflow`.
7. **`prefers-reduced-motion` activado**: sigue habiendo respuesta al toque (sombra y filo), y
   el paralaje desaparece por completo.
8. **Gama baja**: Android de gama media-baja real, o CPU al 4–6×. Arrastrar el carrusel
   mientras la página hace scroll vertical, con la cabecera translúcida visible. Si hay
   tirones, aplicar el orden de recorte de F12.
9. **Brillo mínimo, a la luz del sol**: legibilidad del nombre y de la insignia.
10. **3G simulada**: el estado I2 se pinta de inmediato, y la foto —cuando exista— no produce
    salto de layout al llegar tarde.

---

## Requiere dispositivo real, y no se puede concluir leyendo código

- El comportamiento de `mandatory` bajo momento fuerte en Safari frente a Chrome (F3).
- Si el cap de horizontal de 220px se siente apretado o cómodo (F4).
- El rendimiento real de A2 en un Android de gama baja (F12).
- Si el asomo de 40–49px en los puntos ajustados se lee como suficiente al ojo.

## Propuestas para backend

Ninguna nueva. Se reiteran **B9** (`portada_url`) y **B4** (el bucket, pendiente desde el
29/08). Sin B4 la portada hereda los tres problemas de `logo_url`, y eso es lo que hace más
urgente el presupuesto de F12: un PNG sin comprimir de un comercio, seis veces, en la primera
pantalla del socio.
