# T4 — Dirección de arte y extensión del sistema

> `design-system-architect` · 31/08/2026 · rama `mejora-diseno`
> **T4** de `.claude/docs/PLAN-rediseno-miembros.md` · depende de **T2**
> (`.claude/docs/SPEC-pantallas-miembros.md`) y consume **T5**
> (`.claude/docs/T5-validacion-contraste.md`).
>
> Base de hechos: `CLAUDE.md` (revisado el 30/08), `src/styles/tokens.css`,
> `src/app/globals.css`, `src/lib/shared/motion.ts`, `src/components/ui/**` y el código
> real del portal. `graphify-out/` no se ha leído (`SCOPE.md` §3).
>
> **Este documento no escribe código de producto. Su único artefacto es este archivo.**
>
> **Dueño de lo que hay aquí**: valores de token, contraste, geometría de la placa,
> escala tipográfica y forma del carril. **No** decide flujo, estados ni copy —eso es la
> spec de T2, que no se contradice en ningún punto—; **no** decide curvas, resortes ni
> `view-transition-name` —eso es T6—; **no** firma ratios —eso es T5, y donde ya firmó,
> aquí se cita, no se recalcula.

---

## Resumen ejecutivo

| Pregunta del encargo | Respuesta corta |
|---|---|
| ¿Qué falta por explotar del sistema actual? | **18 capacidades ya construidas y verificadas que nunca llegaron a producción**, entre ellas `Card variant="brand"`, `--radius-xl`, `--gold-hairline`, `--dur-page`, el prop `error` de `Field` y las transiciones de vista. §1 |
| ¿Cuántos tokens nuevos? | **8.** Ninguno cambia un valor existente. Se descartaron 4 que parecían necesarios y no lo eran. §2 |
| ¿Se cumple el presupuesto de oro? | **No con la regla actual, y la regla actual está mal formulada.** Se sustituye por tres reglas medibles. Peor pantalla: **7,31 %** en el acceso, **1,55 %** de ella difusa. §3 |
| ¿Cómo se contiene un logo transparente oscuro? | Placa **3:2**, fondo blanco constante, filo `--n-400` a **3,33:1 / 5,42:1**, inicial constante a **5,26:1**. §4 |
| ¿Se rompe alguna regla más de `CLAUDE.md`? | **Ninguna.** Y una de las ya aprobadas (RUP-2, excepción del carnet al 15 %) **se retira por innecesaria**: medido, el carnet gasta **0,46 %**. §6 |

**Hallazgo que condiciona RUP-1**: `--gold-sheen` **no puede** ser el relleno de la acción
principal. En tema claro su parada más oscura (`#5c4b25`) da **2,34:1** contra el texto
tinta —reprueba 1.4.3 por más del doble—. El relleno tiene que ser **plano `--gold-600`**.
Detalle y aritmética en §2.2.

---

## 1. Lo que ya existe y no se está usando

**El sistema no necesita un lenguaje nuevo: necesita que se gaste el que tiene.** Antes de
proponer un solo token, esto es lo que está construido, verificado, y no ha llegado nunca a
una pantalla de producción.

### 1.1 Capacidades construidas cuyo único consumidor es la galería de desarrollo

| Capacidad | Dónde está | Único consumidor hoy | Adónde va ahora |
|---|---|---|---|
| **`Card variant="brand"`** — filo dorado de 1px con `--gold-hairline` | `src/components/ui/card.module.css:39-50` | `src/app/dev/ui/gallery.tsx:449` | **El carnet** y **la tarjeta de acceso**. Es literalmente «la tarjeta buena» y lleva dos años sin estrenar |
| **`Button variant="gold"`** — barrido metálico | `src/components/ui/button.module.css:172-190` | `src/app/dev/ui/gallery.tsx:290` | **A ningún sitio como acción** (§2.2). Se conserva como superficie ceremonial sin texto encima |
| **Prop `error` de `Field`** con `aria-describedby` + `aria-invalid` | `src/components/ui/field.tsx:29-39` | 1 de 78 usos (`SPEC` §12) | Los dos errores de contraseña de `/activar-cuenta` (SPEC §3.6) |

### 1.2 Tokens declarados y jamás consumidos

Verificado con `grep` sobre todo `src/`:

| Token | Línea | Consumidores | Destino |
|---|---|---|---|
| `--radius-xl: 28px` «superficies héroe» | `tokens.css:132` | 1 (`pantalla-auth.module.css:56,71`) | **El carnet.** Es la segunda —y última— superficie héroe del producto |
| `--dur-page: 500ms` «transición de ruta» | `tokens.css:268` | **0** | La transición de elemento compartido tarjeta → ficha (deuda #1). El token para eso ya existía |
| `--blur-md: 16px` | `tokens.css:286` | **0** | Ninguno. Se deja como está |
| `--gold-200`, `--gold-800` | `tokens.css:56,62` | **0** | Ninguno. Ver §7: son deuda, no oportunidad |
| `--ease-spring` | `tokens.css:241` | **0** | Ninguno: es **idéntico** a `--ease-rebote` (`:260`), que sí se usa. Ver §7 |
| `--escala-press-sm` vía `[data-pulsable='sm']` | `globals.css:478-480` | 1 (`copiar.tsx:60`) | **Chips y tarjetas de carril**: son controles pequeños y el 3 % por defecto no se les nota |
| `--t-display-1` | `tokens.css:170-174` | `Cifra` y la utilidad global | **Ninguno, y es correcto.** El recorrido del cliente no tiene ni una cifra de negocio. No se inventa una |
| `SPRING_SHEET`, `SPRING_FLICK` | `motion.ts:50,57` | **0** fuera de los tests | Ninguno: el carril usa scroll nativo, que ya trae momento del sistema (§5) |

### 1.3 Capacidades del entorno habilitadas y sin estrenar

| Capacidad | Evidencia | Destino |
|---|---|---|
| `experimental.viewTransition` | **Cero ocurrencias de `view-transition-name` en `src/`** | Tarjeta → ficha. La forma la fija T6 |
| `container-type: inline-size` / `container-name: contenido` | `portal.module.css:174-175` | Ya existe. Toda adaptación del rediseño cuelga de ahí. **Cero `@media` nuevos dentro de `<main>`** |
| `--material` + `--blur-xl` + rama `prefers-reduced-transparency` | `portal.module.css:25-26, 38-43, 208-209, 219-224` | Ya existe y **no se extiende**: `backdrop-filter` sigue siendo solo cromo fijo |
| `--edge` / `--edge-light` (elevación en oscuro) | `tokens.css:148`, `globals.css:88,155` | La placa del logo y las tarjetas de carril. Es el idioma de elevación en oscuro y solo lo usa `Card` |
| `scroll-snap` | **Cero ocurrencias en `src/`** | El carril (§5). Aquí sí hay capacidad nueva, pero es CSS nativo, no una librería |

### 1.4 Lo que hay que dejar de hacer (y no es token, es disciplina)

- `pantalla-auth.module.css:43-44` escribe el halo como `rgba(191,160,99,…)`: es
  `--gold-500` a mano (**D7**).
- `pantalla-auth.module.css:116` fija el wordmark en `font-size: 1.75rem`, fuera de la
  rampa. Pasa a `--t-display-2-size` (§7.2 del presente doc, tabla tipográfica).
- `comercio-logo.tsx:28,38` maquetan con `style={{ width, height }}` (**D13**). Con la
  placa desaparecen: el tamaño lo da `--placa-logo-w` y la altura sale del `aspect-ratio`.
- `perfil.module.css:37-47,85-89` adapta el carnet a 620px. **Se elimina entera**: el
  carnet es una columna a todos los anchos (SPEC §6.2). Menos CSS, no más.

**Conclusión de §1**: de las seis pantallas, cinco se visten con lo que ya hay. Lo único
que el sistema no sabe hacer es **contener un activo ajeno** (la placa) y **comprimir una
dimensión secundaria** (el carril). Ahí, y solo ahí, se amplía.

---

## 2. Los tokens nuevos: ocho

**Nada cambia de valor (P1).** Los ocho son nombres nuevos; seis de ellos son alias de
valores que ya existen en la rampa, elegidos por su ratio, no inventados.

### 2.1 Grupo A · La placa del logo (RUP-6) — 5 tokens

Van en `tokens.css`, en una **sección nueva** que hay que crear porque hoy no existe un
sitio honesto donde poner un color que no sigue el tema:

```
/* ==========================================================================
   11. SUPERFICIES QUE NO SIGUEN EL TEMA
   --------------------------------------------------------------------------
   Precedente: QrCode (negro sobre blanco en los dos temas). La causa es la
   misma en los dos casos: el activo NO ES NUESTRO y asume fondo claro.
   Diferencia con QrCode: allí son literales por excepción sancionada; aquí
   son tokens, y se consumen con var(--…) como todo lo demás.
   ======================================================================== */
```

| # | Token | Valor | Por qué ese y no otro |
|---|---|---|---|
| 1 | `--placa-logo-bg` | `var(--w-0)` (#ffffff) | Es el fondo que **asume el activo ajeno**. Blanco puro y no `--w-100`: un logotipo en color a menudo se calibró contra blanco, y medio escalón de gris no compra separación (1,10:1) pero sí ensucia el logo |
| 2 | `--placa-logo-borde` | `var(--n-400)` (#8c8c97) | **El único valor de la rampa neutra que da ≥3:1 contra las cuatro superficies donde vive la placa, en los dos temas.** `--w-400` da 1,73:1 en claro; `--n-300`, 2,22:1. Ver tabla §4.3 |
| 3 | `--placa-logo-inicial` | `var(--n-500)` (#6b6b76) | La inicial vive sobre un fondo **constante**, así que su color también debe serlo. Con `--text-3` cambiaría de 5,26:1 (claro) a 3,33:1 (oscuro) sobre la misma placa blanca: el mismo píxel con dos contrastes según el tema es un defecto |
| 4 | `--placa-logo-ratio` | `3 / 2` | Decisión normativa de la spec (§2.3a). Va en token para que no derive: un cuadrado convierte un logotipo 4:1 en un sello del 25 % de su alto |
| 5 | `--placa-logo-w` | `72px` | Ancho en tarjeta. **La altura no se declara**: sale del `aspect-ratio`. El hero de la ficha sobrescribe `--placa-logo-w: 144px` localmente (inyectar un token es lo que `CLAUDE.md` sí admite) y la altura le sigue sola a 96px |

**Por qué ninguno de los 145 servía**: los cinco describen una superficie **cuya definición
es no seguir el tema**. Todos los tokens de color consumibles hoy o son crudos (y usarlos
directamente esconde la intención: nadie sabría que `--w-0` está ahí porque *tiene* que ser
constante) o son semánticos de `globals.css` (y todos se remapean en oscuro, que es
exactamente el fallo D10).

### 2.2 Grupo B · La acción ceremonial (RUP-1) — 2 tokens

Van en `globals.css`, en el bloque `:root` de la capa semántica, y **no se duplican** en
`[data-theme='dark']` ni en la rama `prefers-color-scheme`. Eso es deliberado y hay que
comentarlo en el archivo, porque el patrón del fichero es duplicar todo y alguien lo
«arreglará»:

| # | Token | Valor | Ratio (firmado en T5) |
|---|---|---|---|
| 6 | `--action-gold` | `var(--gold-600)` (#9e8244) | Borde/superficie: 3,66:1 claro · 4,92:1 oscuro · 5,02:1 tarjeta de acceso · 3,54:1 fondo de página claro |
| 7 | `--action-gold-fg` | `var(--n-1000)` (#0a0a0c) | Texto/relleno: **5,40:1** |

**Son invariantes al tema a propósito, y ese es el argumento entero de RUP-1**: el par solo
se aprobó porque cumple los dos criterios **en los dos temas a la vez**. Un par que
cambiara por tema tendría que volver a auditarse por tema.

#### 🔴 Por qué el relleno NO puede ser `--gold-sheen`

`Button variant="gold"` usa `background-image: var(--gold-sheen)` (`button.module.css:173`)
con `color: var(--n-1000)` (`:176`). En **tema oscuro** el barrido va de `#e3d0a4` a
`#9e8244` y todas sus paradas cumplen. En **tema claro** `globals.css:54-60` lo remapea a la
mitad oscura de la rampa, y ahí:

| Parada del barrido claro | Texto `--n-1000` sobre ella | ¿Cumple 4.5:1? |
|---|---|---|
| `#9e8244` (0 %) | 5,40:1 | ✅ |
| `#7d6733` (38 %) | 3,64:1 | ❌ |
| `#5c4b25` (62 %) | **2,34:1** | ❌❌ |

*Método: WCAG 2.1 §1.4.3, el mismo de `T5-validacion-contraste.md` §Método. L(#5c4b25) =
0,074379; L(#0a0a0c) = 0,003082 (valor de T5); (0,124379)/(0,053082) = 2,34.*

El 62 % de un botón de 277px son ~172px de recorrido en los que el texto reprueba AA con
holgura. **No es un ajuste: es el doble de lejos del umbral que el peor caso que este
proyecto haya aceptado.** Por eso:

- **El relleno de acción es plano `--action-gold`.** Se necesita una **variante nueva de
  `Button`** que lo consuma. Propuesta de nombre: **`variant="brand"`**, en paralelo a
  `Card variant="brand"`; el vocabulario queda: *brand = la pieza con el tinte de ORUM*.
- **`variant="gold"` (barrido) se conserva** para superficies ceremoniales **sin texto
  encima** —el filo del carnet, el wordmark con `background-clip: text`, la barra de
  `ProgressBar` (`feedback.module.css:63`)—, y su JSDoc gana la advertencia de arriba.
  Sigue teniendo cero consumidores de producción, así que conservarlo no cuesta nada.

#### Estados `hover` / `active` / `disabled` del relleno (cierra el hallazgo MENOR 1 de T5)

**El relleno no cambia de color en ningún estado.** No es pereza, es que no hay hueco:

| Dirección | Muro que se toca | Margen real |
|---|---|---|
| Aclarar | 1.4.11 · borde vs `--w-0` cae bajo 3:1 en cuanto L > 0,30 | L(gold-600) = 0,2365 → queda **0,064** de recorrido |
| Oscurecer | 1.4.3 · texto tinta cae bajo 4,5:1 en cuanto L < 0,1889 | queda **0,048** de recorrido |

Cualquier color de `hover` dentro de ese intervalo aterriza a menos de 0,15 de un umbral de
WCAG, donde deciden el antialiasing del filo y la gestión de color del monitor, no el
diseño. **Un estado que solo se puede expresar al borde de un umbral no es un estado que
merezca existir.** Además es lo correcto en el idioma de Apple: un botón de iOS no cambia de
tono al pulsarse.

Lo que sí hace cada estado, todo con capacidades que ya existen:

| Estado | Qué cambia | Token |
|---|---|---|
| `:hover` (claro) | Sube la elevación | `--shadow-2` → `--shadow-3` |
| `:hover` (oscuro) | Aparece el filo de luz superior, 1px | `--gold-hairline` — donde las sombras no se ven, el chaflán sí |
| `:active` | Encoge | Ya lo da `globals.css:462-472` con `--escala-press` y `--dur-press` |
| `:focus-visible` | Anillo por fuera del relleno | `--focus`, `outline-offset: 2px`. **Verificado en T5** (hallazgo MENOR 3): al llevar desplazamiento el anillo se dibuja sobre la superficie, no sobre el oro |
| `:disabled` | `opacity: 0.5`, ya existe (`button.module.css:43-48`) | Exento de 1.4.3/1.4.11 por WCAG. Se anota, no se cambia |

### 2.3 Grupo C · El carril — 1 token

| # | Token | Valor | Por qué |
|---|---|---|---|
| 8 | `--carril-tarjeta-w` | `200px` | Es una **medida de componente**, como `--sidebar-w: 264px` (`tokens.css:294`), no un espaciado. A 343px de contenedor muestra 1,71 tarjetas: la cortada es la que dice «hay más» (SPEC §4.4). A 720px muestra 3,5, que es lo que la spec pide para tableta. Un solo valor sirve a todos los anchos, así que no lleva variantes |

### 2.4 Los cuatro tokens que parecían necesarios y no lo son

Se documentan porque el siguiente que se siente aquí va a proponerlos otra vez.

| Token descartado | Por qué no |
|---|---|
| `--gold-650` (relleno de `hover`) | §2.2: el intervalo legal es de 0,05 de luminancia. Un color nuevo en una rampa calibrada, para un estado que se resuelve con elevación, es puro coste |
| `--wordmark-tracking: 0.22em` y `--wordmark-tracking-sm: 0.14em` | `CLAUDE.md` prohíbe literales de **color, espaciado, radio y duración**. El tracking no está en esa lista, y la rampa dice explícitamente que **cada tamaño lleva su propio tracking** (`tokens.css:152-156`): dos valores, un uso cada uno, es ruido. Lo que sí se corrige es el `font-size: 1.75rem` de `pantalla-auth.module.css:116`, que sale de la rampa sin motivo |
| `--control-h-sm: 36px` (alto del chip) | Se resuelve **sin token**: el chip mide `var(--tap-min)`. Cuesta 8px del primer pantallazo y a cambio elimina un literal, elimina el `::after` de ampliación de área y elimina la posibilidad de que alguien deje un objetivo de 36px vivo. Ver §7.1 |
| `--sangrado` / `--main-pad-x` (sangrado del carril) | **No es un token del sistema, es una propiedad local de un layout.** `.main` publica `--pad-contenido` en las dos reglas donde ya declara su relleno (`portal.module.css:170` y `:180`) y el carril la consume. Un token global obligaría a mantener sincronizados dos sitios; así hay uno. Ver §5.2 |

---

## 3. El presupuesto de oro: la respuesta, con aritmética sobre 375×667

`accessibility-auditor` tiene razón y el número no cuadra por ningún lado. **No se esquiva:
se sustituye la regla, se mide todo, y se retira una de las excepciones ya aprobadas.**

### 3.1 Por qué «≤5 % del área visible» está mal formulada

Tres defectos, y ninguno se arregla subiendo el número:

1. **No dice qué cuenta como oro.** El halo del acceso es un radial de α 0,09 → 0. Si se
   cuenta su círculo envolvente son **63 % del viewport** y la regla es inviable desde el
   primer día. Si no se cuenta, la regla no protege contra un fondo dorado. Hoy la regla no
   dice cuál de las dos cosas es, así que **no es verificable**, y una regla no verificable
   no protege nada: es exactamente por eso que el halo lleva dos años incumpliéndola de
   hecho sin que nadie lo note (§2a del plan).
2. **Mide la superficie equivocada.** Lo que la regla quiere impedir es que el oro se
   convierta en **atmósfera**: fondo, cromo, decoración repetida. Un CTA es lo contrario de
   atmósfera: es el punto focal, y el trabajo de un punto focal **es** ser la pieza saturada
   más grande de la pantalla. Medirlo con la vara de la decoración es medirlo mal.
3. **Un porcentaje es peor guardián que un conteo.** A 375px caben **seis chips dorados de
   44px bajo el 5 %** —y seis chips dorados es justamente el desastre que la regla vino a
   evitar—, mientras que **no caben dos botones de ancho completo bajo el 10 %**. El
   porcentaje deja pasar el caso malo y bloquea el bueno.

### 3.2 La regla nueva: tres, y las tres se comprueban sobre una captura

**Se mide sobre el primer pantallazo sin desplazar, 375×667 = 250 125 px² (P2).**

> **Regla A · Oro sólido (α ≥ 0,5).**
> **Exactamente una pieza por pantalla, y como máximo el 7,5 % del lienzo.**
> Se verifica **contando**: si en la captura hay dos superficies de relleno dorado opaco,
> falla, sin necesidad de medir nada. El 7,5 % es el techo geométrico de la pieza más grande
> que el diseño permite (un botón de ancho completo `size="lg"` a 375px = 7,13 %); cualquier
> cosa mayor —una banda héroe, una tarjeta rellena— lo supera y queda prohibida.
>
> **Regla B · Oro difuso (α < 0,5), ponderado por α.**
> **≤2 % del lienzo, sumando halos, filos, barridos, insignias y el anillo de foco.**
> `área efectiva = Σ (área × α efectiva sobre el fondo)`.
>
> **Regla C · Invariantes, que no se negocian con ningún número.**
> El oro **nunca** es el fondo de una superficie de contenido; **nunca** codifica dato ni
> estado; **nunca** hay dos rellenos sólidos compitiendo; y **el chip de categoría activo es
> tinta, no oro** (§3.4).

### 3.3 La medición, pantalla por pantalla

Método: se toma la geometría real de los módulos CSS actuales; para el texto se usa la caja
tipográfica por la cobertura de tinta de una sans en versalitas a peso 600-680 (~0,22-0,28);
para el halo se integra el gradiente radial (∫ α(r)·2πr dr).

**Acceso** — `.pantalla` con relleno `--space-4`; `.tarjeta` de 343px con relleno
`--space-7`; ancho útil del botón = 343 − 64 − 2 = **277px**.

| Elemento | Geometría | α | Área efectiva | % |
|---|---|---|---|---|
| CTA `variant="brand" size="lg"` | 277 × 52 | 1,0 | 14 404 px² | **5,76 %** |
| Halo `.pantalla::before` | ⌀450, radial 0,09→0,03→0 | integrado | 2 031 px² | 0,81 % |
| Anillo de foco sobre el CTA | 2px, offset 2px | 1,0 | 1 364 px² | 0,55 % |
| Wordmark `--t-display-2` | 84 × 17,3 caja | 0,22 tinta | 320 px² | 0,13 % |
| Filo `--gold-hairline` de la tarjeta | 341 × 1 | ~0,44 | 150 px² | 0,06 % |
| | | | **Sólido** | **5,76 %** ✅ A |
| | | | **Difuso** | **1,55 %** ✅ B |
| | | | **Total** | **7,31 %** |

*El recorte del halo por los bordes del viewport no resta nada: la parte cortada cae más
allá del 68 % del radio, donde α ya es 0.*

**Catálogo** — sin acción dorada.

| Elemento | Área efectiva | % |
|---|---|---|
| Anillo de foco sobre una tarjeta (343 × ~200) | 2 220 px² | 0,89 % |
| Insignias de beneficio (4 visibles, `--gold-bg` α 0,10 + texto `--brand`) | 568 px² | 0,23 % |
| Wordmark de cabecera `--t-title-3` | 158 px² | 0,06 % |
| **Sólido: 0 %** ✅ A · **Difuso: 1,18 %** ✅ B | | **1,18 %** |

*Con los datos de hoy (cero promociones vigentes) el catálogo gasta **0,95 %**.*

**Ficha de comercio** — el caso más caro, porque el CTA ocupa el ancho del contenido, no el
de una tarjeta.

| Elemento | Geometría | Área efectiva | % |
|---|---|---|---|
| «Mostrar mi carnet» `size="md"` | 343 × 44 | 15 092 px² | **6,03 %** |
| *(alternativa `size="lg"`)* | 343 × 52 | 17 836 px² | *(7,13 %)* |
| Anillo de foco sobre el CTA | | 1 596 px² | 0,64 % |
| Insignias (2) + wordmark | | 442 px² | 0,18 % |
| **Sólido: 6,03 %** ✅ A · **Difuso: 0,82 %** ✅ B | | | **6,85 %** |

**Carnet** — y aquí está el resultado que cambia una decisión ya tomada.

| Elemento | Geometría | Área efectiva | % |
|---|---|---|---|
| Filo `--gold-sheen` del carnet | 343 × 2 | 686 px² | 0,27 % |
| Anillo de foco (botón de copiar, 44 × 44) | | 400 px² | 0,16 % |
| Wordmark del carnet (12px) | | 78 px² | 0,03 % |
| **Sólido: 0 %** · **Difuso: 0,46 %** | | | **0,46 %** |

> **RUP-2 concedía al carnet hasta ~15 %. Medido, gasta 0,46 %: treinta veces menos.**
> La excepción **se retira** (§6.2). El carnet no se lee como una credencial por cantidad de
> oro; se lee así por el filo, el `--radius-xl`, el material y el aire.

**Membresía en pausa** — CTA dentro de un `Card padding="md"`: 343 − 48 − 2 = 293px.

| Elemento | Área efectiva | % |
|---|---|---|
| «Reactivar mi membresía» `size="md"` (293 × 44) | 12 892 px² | **5,15 %** |
| Anillo de foco + wordmark | 1 526 px² | 0,61 % |
| **Sólido: 5,15 %** ✅ A · **Difuso: 0,61 %** ✅ B | | **5,76 %** |

**Peor caso del producto entero: 7,95 %** (ficha con `size="lg"`). Todas las pantallas
cumplen A, B y C.

### 3.4 De dónde se retira oro para compensar

El encargo pedía compensar. Tres retiradas concretas, todas con razón propia además del
presupuesto:

1. **El chip de categoría activo es tinta (`--action` / `--action-fg`), no oro.** Un chip
   activo **codifica un estado de filtro**, y el oro no codifica estado (Regla C, e
   invariante de `CLAUDE.md` que este plan no rompe). Precedente en el sistema:
   `toggle.module.css:144` ya pinta el estado marcado con `--action`. Y sigue sin depender
   del color: check de 13px + `aria-current` + peso (SPEC §4.3).
2. **La tarjeta del catálogo no lleva `Card variant="brand"`.** El filo dorado se reserva a
   **una superficie por pantalla**: el carnet y la tarjeta de acceso. Cien tarjetas con filo
   dorado no son cien tarjetas buenas: son un catálogo sin jerarquía.
3. **La cabecera del portal pierde el botón de WhatsApp** (D4, ya decidido por la spec), con
   lo que el wordmark vuelve a ser el único oro del cromo.

### 3.5 Lo que la regla nueva sigue prohibiendo

Para que no se lea como una relajación: bajo A/B/C **siguen prohibidas** una banda héroe
dorada (15 % en sólido), una segunda acción dorada en la misma pantalla (falla el conteo,
aunque las dos juntas sumen 6 %), una fila de chips dorados (falla C por codificar estado,
y el conteo por ser seis), y un fondo de tarjeta en oro. La regla nueva es **más estricta
que la vieja en todo lo que importa** y solo es más permisiva en la única pieza que el
lenguaje de Apple exige que sea grande: la acción principal.

---

## 4. La placa del logo

### 4.1 El problema, en una frase

Cuatro fallos distintos que hoy conviven en 26 líneas de CSS: `object-fit: cover` mutila los
apaisados (D8), un `logo_url` muerto pinta el icono de rotura (D9), un PNG transparente con
logotipo oscuro desaparece sobre `--surface-sunk` en tema oscuro (D10) y el tamaño se
maqueta con `style={{}}` (D13).

### 4.2 La forma

```
  ┌──────────────────────────────┐  ← --placa-logo-borde, 1px, constante
  │ ····························  │
  │ ·   ┌──────────────────┐   ·  │  ← relleno --space-1 (4px)
  │ ·   │   LOGO contain   │   ·  │
  │ ·   └──────────────────┘   ·  │
  │ ····························  │
  └──────────────────────────────┘
   72 × 48  (aspect-ratio 3 / 2)     fondo --placa-logo-bg, CONSTANTE
   caja interior 64 × 40
```

| Propiedad | Valor | Razón |
|---|---|---|
| Proporción | `aspect-ratio: var(--placa-logo-ratio)` = 3/2 | Decisión de la spec §2.3a |
| Ancho | `var(--placa-logo-w)` = 72px en tarjeta; el hero **inyecta 144px** | Un solo token, la altura la deriva el navegador. Mata el `style={{}}` de D13 |
| Ajuste | `object-fit: contain; object-position: center` | **Un logo se muestra entero o no se muestra.** `cover` cambia deformación por mutilación |
| Relleno | `--space-1` (4px) en tarjeta · `--space-3` (12px) en hero | La spec dejaba el valor exacto a T4 y sugería 6px (`--space-1` × 1,5). **6px está fuera de la rejilla de 4pt**, que es la única regla que la escala tiene. 4px da caja interior 64×40 —7 % más de área de logo que los 60×36 propuestos— y el marco lo dibuja el filo, no el relleno. En el hero, 12px da exactamente los 120×72 que la spec pedía |
| Radio | `--radius-xs` (6px) en tarjeta · `--radius-sm` (10px) en hero | **Sin token nuevo.** Ambos ya existen y respetan el anidamiento dentro de un `Card` de `--radius-md` |
| Fondo | `--placa-logo-bg`, **idéntico en los dos temas** | RUP-6. Resuelve D10 |
| Filo | `--placa-logo-borde`, 1px, **idéntico en los dos temas** | Es lo único que separa la placa del fondo en tema claro (§4.3) |
| `backdrop-filter` | **Ninguno** | Es una fila de lista. Prohibición dura, y no se toca |

### 4.3 Contraste de la placa — tabla nueva, no cubierta por T5

Método idéntico al de `T5-validacion-contraste.md` §Método (WCAG 2.1, luminancia relativa).
**Se entrega para que T5 la firme**; ningún número de la tabla ya firmada se recalcula aquí.

**Luminancias de partida** (las tres primeras son de T5, se reutilizan):

| Color | Hex | L |
|---|---|---|
| `--w-0` / `--placa-logo-bg` | `#ffffff` | 1,000000 |
| `--w-50` (fondo de página claro) | `#fbfbfc` | 0,965319 |
| `--n-900` (tarjeta oscura) | `#16161a` | 0,008189 |
| `--n-1000` (fondo de página oscuro) | `#0a0a0c` | 0,003082 *(T5)* |
| `--n-400` / `--placa-logo-borde` | `#8c8c97` | 0,265655 |
| `--n-500` / `--placa-logo-inicial` | `#6b6b76` | 0,149769 |

**Filo de la placa contra la superficie que la rodea — umbral 3:1 (WCAG 1.4.11):**

| Superficie | Token | Dónde ocurre | Contraste | |
|---|---|---|---|---|
| Tarjeta, tema claro | `--surface` = `#ffffff` | Tarjeta del catálogo y del carril | **3,33:1** | ✅ |
| Fondo de página, tema claro | `--bg` = `#fbfbfc` | Hero de la ficha | **3,22:1** | ✅ |
| Tarjeta, tema oscuro | `--surface` = `#16161a` | Tarjeta del catálogo y del carril | **5,42:1** | ✅ |
| Fondo de página, tema oscuro | `--bg` = `#0a0a0c` | Hero de la ficha | **5,95:1** | ✅ |

**Cuerpo de la placa contra su entorno** (informativo: la placa es decorativa,
`aria-hidden`, y no está sujeta a 1.4.11 — se publica para que se vea qué trabajo hace el
filo y cuál no):

| Par | Contraste | Lectura |
|---|---|---|
| Placa blanca vs tarjeta clara | **1,00:1** | Invisible por sí sola: **en tema claro la placa la dibuja el filo, y solo el filo** |
| Placa blanca vs fondo de página claro | 1,03:1 | Ídem |
| Placa blanca vs tarjeta oscura | **18,05:1** | En oscuro la placa es la pieza más luminosa de la tarjeta |
| Placa blanca vs fondo de página oscuro | **19,78:1** | Ídem, hero de la ficha |

**La inicial sobre la placa:**

| Par | Contraste | Umbral aplicable | |
|---|---|---|---|
| `--placa-logo-inicial` sobre `--placa-logo-bg` | **5,26:1** | 3:1 (texto grande: 19px a peso 620 en tarjeta, 38px en hero) | ✅ con margen 1,75× |
| *(si se hubiera usado `--text-3`, tema oscuro)* | *3,33:1* | *el mismo píxel con dos contrastes según el tema* | ❌ el motivo del token 3 |

### 4.4 Cómo conviven logos de proporciones distintas

Con `contain`, un logotipo 1:1 llena la altura de la caja interior y uno 4:1 llena su ancho;
**sus tamaños ópticos divergen y eso es geometría, no un defecto que se pueda pintar**. En
la caja de 64×40: un cuadrado ocupa 40×40 (1 600 px² de tinta disponible), un 4:1 ocupa
64×16 (1 024 px²). Es la misma divergencia que tienen el App Store o el directorio de
Stripe, y se vive con ella.

**Lo que hace que se lean como una colección no es el tamaño del logo, es el marco:** misma
placa, mismo relleno, mismo filo, mismo fondo, mismo radio, alineación vertical al centro y
alineación horizontal de la placa con el resto de la tarjeta. Tres reglas más, baratas y
que se notan:

1. **Ningún logo toca el filo**: el relleno es innegociable, también en el hero.
2. **La placa nunca se encoge** (`flex-shrink: 0`, ya está en `comercio-logo.module.css:2`):
   una placa de 68px junto a otra de 72px destroza la rejilla antes que cualquier logo feo.
3. **El esqueleto de carga usa la placa real** (SPEC §2.3b): mismo tamaño, mismo radio. Si
   el esqueleto dibuja un cuadrado de 44px y llega un rectángulo de 72×48, el relevo salta.

### 4.5 🔴 El respaldo ante logo roto: un conflicto que T4 no puede cerrar

La spec §2.3 decide: *«Logo roto → la inicial, que se renderiza siempre como fondo de la
placa y queda al descubierto cuando la imagen falla»*. **Analizada la mecánica de CSS, ese
mecanismo no puede funcionar y su contrario tampoco, a la vez:**

- Si el `<img>` es transparente para que la placa blanca se vea por detrás, entonces un
  **logo transparente legítimo deja ver la inicial entre sus trazos**. Inaceptable.
- Si el `<img>` lleva `background: var(--placa-logo-bg)` opaco para tapar la inicial,
  entonces **una imagen rota también la tapa**: se ve una placa vacía, no la inicial.
- **El servidor no puede distinguir «cargó» de «falló».** No hay selector de CSS para eso.

Tres caminos, con su coste. **T4 recomienda el primero y T12 debe cerrarlo en el navegador,
que es exactamente lo que la spec ya previó**:

| # | Mecanismo | Coste | Riesgo |
|---|---|---|---|
| **1 (recomendado)** | La placa entera va `aria-hidden` y el `alt` del `<img>` **es la inicial**, con `font-size`, `color` y `text-align` aplicados al propio `<img>`: al fallar, el navegador pinta el texto alternativo ya estilado | **Cero.** Sigue siendo Server Component, cero JS, cero payload | Chrome puede pintar un glifo de rotura **junto** al texto alternativo cuando el `<img>` tiene dimensiones explícitas. **Hay que verlo en Chrome, Firefox y Safari** |
| 2 | `<img>` con fondo opaco sobre la inicial | Cero | El caso roto da **placa vacía** en vez de inicial. Nunca un icono de rotura, que es el requisito real |
| 3 | `ComercioLogo` pasa a cliente con `onError` | El catálogo pinta hasta 100: **~100 raíces de hidratación** y ~12 KB extra de payload RSC (3 props primitivas × 100), en la pantalla cuya regla nº2 es el rendimiento | Ninguno funcional. Es el determinista |

**Orden de decisión**: si (1) pinta glifo en algún navegador, se documenta cuál y se pasa a
(2); solo si la placa vacía se rechaza como resultado, se paga (3). Lo que no se acepta en
ninguna rama es el icono de rotura.

**No confundir con `alt=""` (D12)**: la accesibilidad se resuelve con el `aria-hidden` de la
placa, que oculta el `alt` al lector igual de bien y además cubre el caso de la inicial. El
nombre del comercio sigue visible al lado y no se duplica.

---

## 5. El carril: forma canónica

### 5.1 Qué es y qué no

Sirve a la fila de categorías y a las dos estanterías (SPEC §4.3, §4.4). **Scroll nativo con
`scroll-snap`, nunca gesto propio**: el nativo ya da seguimiento 1:1, resistencia elástica y
proyección de momento del sistema operativo, corre en el compositor, funciona sin JavaScript
y el foco lo desplaza el navegador. Una reimplementación con `proyectarMomento` sería
peor y habría que auditarla entera. Por eso `SPRING_FLICK` sigue sin consumidores (§1.2) y
está bien que siga así.

### 5.2 La forma

```css
/* Publicado por .main, en las dos reglas donde ya declara su relleno:
   portal.module.css:170 → --pad-contenido: var(--space-4)
   portal.module.css:180 → --pad-contenido: var(--space-6)
   NO es un token del sistema: es el relleno de ESE layout, y tenerlo en un
   solo sitio es lo que impide que el sangrado se desincronice. */

.carril {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--carril-tarjeta-w);
  gap: var(--space-3);

  overflow-x: auto;
  overscroll-behavior-x: contain;      /* no dispara el «atrás» por deslizamiento */
  scroll-snap-type: x proximity;        /* proximity, no mandatory: mandatory pelea
                                           con el momento en listas largas */

  /* Sangrado: la fila llega a los bordes del <main> y la tarjeta cortada
     del borde es la que dice «hay más». */
  margin-inline: calc(var(--pad-contenido) * -1);
  padding-inline: var(--pad-contenido);
  scroll-padding-inline: var(--pad-contenido);

  /* Aire para que el anillo de foco (2px + 2px de offset) no lo recorte
     el overflow. Sin esto, tabular por el carril no se ve. */
  padding-block: var(--space-1);

  scrollbar-width: none;
}

.carril > * { scroll-snap-align: start; }
```

**Cinco detalles que decidirían si esto se siente caro o roto:**

1. **`overscroll-behavior-x: contain`** y **ningún `touch-action`**. El fallo clásico —que
   la fila atrape el desplazamiento vertical de la página— viene de gestos propios en JS;
   con scroll nativo y sin tocar `touch-action`, el navegador reparte el gesto solo. Lo
   verifica T22 en teléfono real.
2. **`padding-block: var(--space-1)`**: 4px cubren exactamente el anillo de foco. Es la
   diferencia entre un carril navegable con teclado y uno que parece que no lo es.
3. **`scroll-padding-inline`** igual al sangrado: sin él, la tarjeta anclada queda pegada
   al borde de la pantalla.
4. **Sin `backdrop-filter` en las tarjetas del carril.** Es una fila de lista. Prohibición
   dura.
5. **Sin `tabIndex` en el contenedor.** Cada tarjeta es un enlace y el navegador desplaza la
   fila al enfocar (SPEC §4.4), así que el scroller no necesita ser un punto de tabulación
   y añadirlo metería una parada estéril antes de cada estantería. **Excepción a escribir en
   el JSDoc**: si algún día un carril contiene algo no enfocable, gana `tabindex="0"` y
   `aria-label` por WCAG 2.1.1.

### 5.3 Dónde vive

**`src/components/ui/carril.tsx`, Server Component.** No usa hooks, no usa estado, no usa
eventos: es CSS y `children`. Renderiza `<section>` + `h2` + `p` de apoyo + el scroller, que
es la unidad que la spec describe (§4.4).

**Lo que NO se crea**, y hay que decirlo porque el reflejo es crear:

| Candidato | Veredicto |
|---|---|
| `Chip` en `ui/` | **No.** Construye su `href` a partir de `searchParams`: es lógica de ruta. Vive en `miembros/(portal)/_components/` |
| `Hero` de la ficha | **No.** Son una placa y dos líneas de texto dentro de un `Stack` |
| Una librería de carrusel | **No.** El scroll nativo ya cumple por construcción lo que `CLAUDE.md` exige de un gesto |
| `LogoPlaca` separado de `ComercioLogo` | **No.** `ComercioLogo` gana la placa y dos props; separar duplicaría la cadena de respaldo |

### 5.4 Coste de convertir en cliente un componente de servidor

Lo pide el DoD de T4. Medido sobre el catálogo, que es el peor caso (hasta 100 comercios):

| Componente | ¿Se convierte? | Coste si se convirtiera |
|---|---|---|
| `ComercioLogo` | **Solo si falla el camino 1 y se rechaza el 2** (§4.5) | ~100 raíces de hidratación + ~12 KB de payload RSC + el módulo entra en el bundle de cliente |
| `Carril` | **No** | — |
| Chips de categoría | **No**: son `<Link>` | — |
| Tarjeta del catálogo | **No**: es un `<Link>` que envuelve un `Card` | — |
| Menú de tema (3 `MenuItem` con `onSelect`) | **Sí, inevitable** | 1 componente de cliente en el cromo, ya decidido por la spec §2.4. Consume `useTheme()` con `useSyncExternalStore` — **nunca** `useState` + `useEffect` |

**Regla que se propone dejar escrita**: en el catálogo, convertir a cliente algo que se
repite por fila cuesta *n* veces; en el cromo cuesta una. Antes de poner `'use client'` en
algo que vive dentro de una lista, hay que decir cuántas veces se va a pagar.

---

## 6. Reglas de `CLAUDE.md`: qué se rompe además de lo aprobado

### 6.1 Ninguna

Las seis rupturas del plan (RUP-1 a RUP-6) cubren todo lo que este documento necesita.
Repasadas una a una, las prohibiciones duras y el resto de la norma **se cumplen enteras**:

| Regla | Cómo la cumple esta dirección de arte |
|---|---|
| Nada de `className="orum-*"` | No aparece. Sus últimos restos ya se borraron (`globals.css:541-548`) |
| Cero literales de color, espaciado, radio y duración | Los 8 tokens nuevos son alias de valores de la rampa. **Además se eliminan cuatro literales vivos**: el halo `rgba(191,160,99,…)` (D7), el `1.75rem` del wordmark, y los dos `style={{}}` de `comercio-logo.tsx` (D13) |
| `style={{}}` solo para inyectar tokens | El hero inyecta `--placa-logo-w: 144px`. Es el caso que la norma admite explícitamente |
| Solo `transform` y `opacity` | Nada anima `width`/`height`/`top`/`left`/`margin`. El carril es scroll del compositor; el `hover` del relleno dorado mueve `box-shadow`, no geometría. La API de vistas compartidas queda cubierta por RUP-3 |
| Nunca `none` en una lista de sombras | El `hover` del relleno pasa de `--shadow-2` a `--shadow-3`; en oscuro añade un filo. Ninguna rama escribe `none` |
| Nunca `outline: none` sin sustituto | Todo interactivo conserva `:focus-visible`, y el carril **reserva 4px para que el anillo se vea** |
| El color nunca es el único portador | Chip activo: check + `aria-current` + peso. Estado de membresía: punto lleno/hueco + texto. Insignia de beneficio: la cifra va dentro |
| `backdrop-filter` solo en cromo fijo | Prohibido explícitamente en placas, tarjetas y carriles |
| Un formulario no pone su propia tarjeta | No entra ningún formulario nuevo |
| `@container contenido`, nunca `@media` dentro de `<main>` | El sangrado se resuelve con una propiedad publicada por `.main`, no con una consulta nueva. Y **se elimina** la consulta de contenedor del carnet (`perfil.module.css:37-47,85-89`), que sobra al ser una sola columna |
| Objetivos táctiles ≥44px | El chip mide `--tap-min` (§7.1). No queda ningún objetivo por debajo |
| `QrCode` negro sobre blanco en los dos temas | Intacto. La placa **es su segundo caso**, y por eso va en la misma sección nueva de `tokens.css` |
| Estado de membresía binario, con `derivarEstadoMembresia` | No se toca. El oro no participa en el estado |

### 6.2 Una ruptura ya aprobada que se **retira** por innecesaria

> **RUP-2, excepción del carnet (~15 % de oro): se retira.**
> Medido sobre 375×667, el carnet gasta **0,46 %** (§3.3). Pedir una excepción de 15 % para
> algo que consume el 0,46 % debilitaría la norma sin comprar nada. La segunda excepción de
> RUP-2 —las pantallas de acceso— **también sobra**: con la regla A/B/C el acceso cumple sin
> excepción alguna (5,76 % sólido, 1,55 % difuso).
>
> **RUP-2 deja de ser una lista de excepciones y pasa a ser la definición operativa del
> presupuesto** (§3.2). Es una norma más estricta y, por primera vez, comprobable sobre una
> captura. `docs-handoff` lo redacta así en T7.

### 6.3 Dos precisiones para T7 que no son rupturas

1. **`--gold-sheen` no puede llevar texto encima en tema claro** (2,34:1). La tabla
   normativa de `CLAUDE.md` debería incluir esa fila con su ⛔, junto a la de
   `--gold-500` sobre blanco: es del mismo tipo de error y hoy nadie la ve venir.
2. **Las seis pantallas de acceso incluyen `/login` y `/comercios/login`**, que llevan al
   panel y a la herramienta de comercios. Un lector rápido de «en Administración el primario
   sigue siendo tinta» concluirá que ahí el CTA no puede ser dorado. **Sí puede**: la norma
   revisada habilita «el Portal de Miembros **y las seis pantallas de acceso**», y P3 exige
   que las seis cambien a la vez porque son la misma envoltura. Conviene que la frase lo
   diga sin que haya que cruzar dos secciones.

---

## 7. La jerarquía tipográfica, pantalla por pantalla

Toda de la rampa que ya existe (`tokens.css:170-228`). **Ningún tamaño nuevo, ningún
tracking nuevo, ninguna familia nueva.** Regla que gobierna la tabla: *dos bloques
consecutivos nunca comparten nivel; si lo comparten, uno de los dos está mal jerarquizado.*

### 7.1 Acceso (siempre en oscuro)

| Bloque | Nivel | Color | Nota |
|---|---|---|---|
| Wordmark ORUM | `--t-display-2` (24px→32px) | `--gold-sheen` con `background-clip: text` | **Sustituye al `1.75rem` literal** de `pantalla-auth.module.css:116`. Al ser `clamp`, crece en escritorio, que es donde el halo también crece |
| `h1` «Portal de Miembros» | `--t-title-2` (20px) | `--text` | Fijado por la spec §3.3 |
| Línea de apoyo | `--t-footnote` | `--text-3` | Nueva |
| Etiqueta de campo | `--t-callout` | `--text-2` | Ya lo hace `Field` |
| Botón | `--t-body` (viene de `size="lg"`) | `--action-gold-fg` | |
| Pie, fuera de la tarjeta | `--t-caption` | `--text-3` | Ya existe |

Seis niveles distintos en una pantalla de dos campos. **Eso es lo que la separa de un
formulario administrativo**, no el color.

### 7.2 Catálogo

| Bloque | Nivel | Color |
|---|---|---|
| Overline «TU MEMBRESÍA» | `--t-overline` | `--text-3` |
| `h1` «Beneficios del club» | `--t-display-2` | `--text` |
| Lede | `--t-footnote` | `--text-2` |
| Chip de categoría | `--t-callout` | `--text-2` / `--action-fg` si activo |
| `h2` de estantería | **`--t-title-2` (20px)** | `--text` |
| Apoyo de estantería | `--t-footnote` | `--text-3` |
| Nombre del comercio (`h2`/`h3`) | `--t-title-3` (17px) | `--text` |
| Nombre de la marca | `--t-caption` | `--text-3` |
| Descripción (2 líneas) | `--t-footnote` | `--text-2` |
| Ciudades | `--t-caption` | `--text-3` |
| Título de promoción | `--t-footnote` | `--text` |
| Insignia de beneficio | `--t-overline` (`Badge size="sm"`) | `--brand` |

**La corrección que hay que hacer aquí**: la cabecera de estantería sube a `--t-title-2` y
el nombre del comercio se queda en `--t-title-3`. Si las dos usaran `--t-title-3` —que es lo
que saldría por inercia, porque es el nivel de «título de tarjeta»—, la estantería y su
contenido pesarían igual y la agrupación desaparecería. **Cinco niveles en el primer
pantallazo, uno más de los tres que el plan exige para «no genérica».**

### 7.3 Ficha de comercio

| Bloque | Nivel | Color | Nota |
|---|---|---|---|
| Vuelta «‹ Comercios» | `--t-callout` | `--text-2` | |
| `h1` nombre del comercio | **`--t-title-1` (24px fijo)** | `--text` | **No `--t-display-2`**: convive con una placa de 144px y a 375px le quedan 187px de ancho. Un `clamp` que crece a 32px en escritorio partiría el nombre en cuatro líneas junto a la placa |
| Nombre de la marca | `--t-footnote` | `--text-2` | Es lo que explica por qué se ve ese logotipo (SPEC §2.3d) |
| Chip de categoría + ciudades | `--t-caption` | `--text-3` | |
| Descripción completa | **`--t-body`** | `--text-2` | **Sube de nivel respecto de la tarjeta**, donde va en `--t-footnote`. En la ficha la descripción es prosa de lectura, no metadato; es el único sitio del recorrido donde `--t-body` hace de cuerpo de texto |
| `h2` «Tus beneficios» / «Dónde usarlo» | `--t-title-2` | `--text` | **No `--t-overline`**, aunque `Section` (`layout.module.css:81-88`) ofrezca ese idioma gratis: un encabezado de 11px en versalitas grises es para agrupar metadatos en un panel denso. «Tus beneficios» es el contenido de la pantalla |
| `h3` título de promoción | `--t-title-3` | `--text` | |
| Detalle de promoción | `--t-footnote` | `--text-2` | |
| Nombre de sede | `--t-callout` | `--text` | |
| Dirección / teléfono | `--t-footnote` | `--text-2` / `--link` | |

### 7.4 Carnet

| Bloque | Nivel | Color |
|---|---|---|
| `h1` «Mi carnet» + lede | `--t-display-2` + `--t-footnote` | `--text` / `--text-2` |
| Wordmark del carnet | `--t-caption`, versalitas, peso 680 | `--brand` (5,44:1 claro · 13,0:1 oscuro) |
| Nombre del socio | `--t-title-1` | `--text` |
| Nombre del plan | `--t-callout`, hasta 2 líneas, `text-wrap: balance` | `--text-2` |
| Etiquetas (NÚMERO, ESTADO, VIGENCIA) | `--t-overline` | `--text-3` |
| Número de membresía | `--font-mono` a `--t-title-3`, `tabular-nums` | `--text` |
| `h2` «Cómo usarlo» + pasos | `--t-title-3` + `--t-body` | `--text` / `--text-2` |

**El carnet es la única pantalla donde `--t-overline` hace de etiqueta de dato**, y es
justo su idioma: son metadatos de una credencial. Reservarlo aquí es lo que le da a la
pieza su acento de documento.

### 7.5 Membresía en pausa · Error · Sin conexión

| Bloque | Nivel | Color |
|---|---|---|
| `h1` del estado | `--t-title-2` (`estadoTitulo` de `feedback.module.css:123-130` sube de `--t-title-3`) | `--text` |
| Cuerpo | `--t-callout` con `--t-body-leading` | `--text-2` |
| Referencia técnica (`digest`) | `--t-caption` en `--font-mono` | `--text-3` |
| Nota al pie de `/offline` | `--t-caption` | `--text-3` |

`ErrorState` debe poder rendir su título como `h1` cuando actúa de frontera de ruta (SPEC
§8.2, que dejaba la decisión a T4): **sí, con una prop `titularNivel` de valor por defecto
`h2`**, para no alterar los usos actuales dentro del panel. Es aditivo y no regresa nada.

### 7.6 Una decisión táctil que la tabla no muestra

**El chip de categoría mide `var(--tap-min)` (44px), no 36px.** La spec calculaba el primer
pantallazo con 36px (§4.2); el ajuste desplaza el acumulado 8px y **su conclusión no
cambia**: la primera tarjeta empieza en 320 en vez de 312 y la segunda sigue asomando 147px
en vez de 155px. A cambio: cero literales de alto, cero `::after` de ampliación de área, y
la imposibilidad de que quede un objetivo táctil por debajo del mínimo. Con las categorías
vacías —el caso de hoy— la fila no se renderiza y el punto es teórico.

---

## 8. Mapa de variantes: qué se usa, qué se crea, qué se descarta

### 8.1 Ya existe y cubre el rediseño (no se toca)

| Necesidad | Pieza existente |
|---|---|
| Superficie de marca del carnet y del acceso | `Card variant="brand"` + `--radius-xl` |
| Bloques de estado de la ficha (V1, V2) y «Cómo usarlo» | `Card variant="sunk"` |
| Tarjeta navegable del catálogo | `Card interactive` (`card.module.css:54-80`, con su `:focus-visible` propio) |
| Insignia de beneficio | `Badge tone="gold" size="sm"` — **ya en producción** (`comercio-card.tsx:64`) |
| Estado de membresía y «Vence en N días» | `StatusBadge` + `VenceEn` (punto lleno/hueco ya implementado) |
| Vacíos y errores | `EmptyState` / `ErrorState` |
| Esqueletos | `Skeleton`, con `data-motion-esencial` ya puesto |
| Errores de campo en `/activar-cuenta` | Prop `error` de `Field` |
| Rejilla del catálogo | `Grid min="290px"`, con la guarda `min()` ya aplicada |
| Copiar el número | `Copiar`, con `data-pulsable="sm"` ya puesto |
| QR | `QrCode`, sin tocar |

### 8.2 Se crea (tres piezas, y ninguna de cero)

| Pieza | Forma | Servidor |
|---|---|---|
| `Button variant="brand"` | Una clase en `button.module.css` que consume `--action-gold` / `--action-gold-fg`, con `hover` de elevación y filo | Sí (`Button` no lleva `'use client'`) |
| `Carril` | `src/components/ui/carril.tsx` + `carril.module.css` (§5) | Sí |
| Placa en `ComercioLogo` | Reescritura de `comercio-logo.module.css` + props `variante` y `decorativo`. **Un solo consumidor hoy** (`comercio-card.tsx:29`) | Sí, salvo que §4.5 obligue |

### 8.3 Se descarta a propósito

| Pieza | Por qué no |
|---|---|
| `DataList` en el catálogo | Un catálogo de aliados no es una tabla: se compara la marca y el beneficio, no ocho campos alineados (SPEC §4.8) |
| `Cifra` | No hay una sola cifra de negocio en el recorrido del cliente. Meter una sería inventar un dato |
| `SegmentedControl` para el tema | Son `<input type="radio">` dentro del `<form action={cerrarSesionMiembro}>`: con el foco en un radio, **Enter cierra la sesión**. Trampa ya verificada (SPEC §2.4) |
| `Section` con su `--t-overline` | §7.3: es el idioma de un panel denso, no el del recorrido del cliente |
| `Overlay` / `Modal` / `Sheet` | Ningún formulario nuevo, ninguna ranura `@modal` nueva |
| `Toast` | `useToast()` **lanza** fuera de `/admin` (`toast.tsx:50`). El feedback va en el propio control |

---

## 9. No-regresión del panel y del Portal de Comercios (P1)

**Afirmación explícita, con su prueba:**

1. **Ningún token cambia de valor.** Los ocho son nombres nuevos. `--action`,
   `--action-hover`, `--action-fg`, `--brand`, `--brand-edge`, `--focus`, la rampa neutra,
   la del oro, los espaciados, radios, sombras, curvas y duraciones quedan **byte a byte
   como están**.
2. **`Button` gana una variante; no modifica ninguna.** `primary`, `secondary`, `ghost`,
   `danger` y `gold` conservan sus reglas. Los **34 archivos** que usan `Button` no cambian
   de aspecto.
3. **No se remapea `--action` en ningún ámbito.** Se consideró y se descartó: `--action` lo
   consume también el estado marcado de `Checkbox`/`Radio`/`Switch`
   (`toggle.module.css:144-145,156,173`), así que un remapeo por ámbito convertiría el oro
   en portador de estado en cuanto alguien pusiera un interruptor en el portal. La variante
   explícita tiene un radio de impacto de exactamente una clase.
4. **`Card`, `Badge`, `Grid`, `Stack`, `Section`, `PageHeader`, `Field`, `Input`,
   `DataList`, `Cifra`, `Modal`, `Sheet`, `Toast`, `Menu`: intactos.** `ErrorState` gana una
   prop opcional con valor por defecto igual al comportamiento actual.
5. **`ComercioLogo` tiene un único consumidor en todo `src/`**: `comercio-card.tsx:29`, en
   el Portal de Miembros. **Superficie de panel afectada: cero.**
6. **`QrCode` tiene un único consumidor**: `perfil/page.tsx:99`. Ídem.
7. **La única superficie compartida que sí cambia es `pantalla-auth.*`**, que sirve a los
   seis accesos —incluidos los de administración y comercios—. **P3 lo autoriza
   explícitamente** y es el punto de partida del encargo: *«mejoremos el diseño del login
   para todo»*. El principio «son dos puertas al mismo club» queda intacto porque las seis
   cambian a la vez.
8. **`globals.css` solo recibe adiciones** en `:root`. Ninguna declaración existente se
   modifica ni se reordena.
9. **`portal.module.css` es exclusivo del Portal de Miembros.**

**Cómo se comprueba, y forma parte del DoD de T28**: `pnpm exec tsc --noEmit && pnpm lint &&
pnpm test && pnpm build`, y captura antes/después de `/admin`, `/admin/metricas`,
`/admin/miembros` y `/comercios` en los dos temas. Diferencia esperada: **ninguna**.

---

## 10. «Elegante, lujoso, confiable, novedoso, no genérico», traducido

Cada adjetivo, una decisión de esta dirección de arte, y cómo se falsea.

| Adjetivo | Decisión verificable | Cómo se comprueba |
|---|---|---|
| **Elegante** | Ninguna pantalla usa menos de **cinco niveles de la rampa**, y dos bloques consecutivos nunca comparten nivel (§7) | Captura a 375×667 anotada con el token de cada bloque. Si dos bloques adyacentes llevan el mismo, falla |
| **Lujoso** | El oro se **gana**: una sola pieza sólida por pantalla, ≤7,5 %, y ≤2 % de difuso. El lujo lo llevan el aire, el material y el filo, no la cantidad de oro | Conteo sobre captura (una pieza sólida) + la tabla de §3.3 |
| **Confiable** | **Ningún logo se ve roto, deformado ni invisible**: `contain`, placa de fondo constante a 18,05:1 en oscuro, filo a ≥3,22:1 en las cuatro superficies, cadena de respaldo cerrada (§4) | Catálogo con un `logo_url` muerto, uno transparente oscuro y uno 4:1, en los dos temas |
| **No genérica** | El primer pantallazo del catálogo **no contiene ni un desplegable**, contiene cinco niveles tipográficos, y la tarjeta sin beneficio —que hoy es el 100 % de las tarjetas— se ve terminada porque lo que la sostiene es la placa y el nombre, no la cifra ausente | Captura a 375×667 sin desplazar |
| **Novedosa** | Tres cosas que hoy no existen en el producto: transición de elemento compartido (`--dur-page` estrena consumidor), carril con `scroll-snap` (**cero ocurrencias en `src/` hoy**) y el carnet como objeto con `--radius-xl` y filo metálico | Vídeo corto de cada una |
| **Profesional** | Una familia (Inter + SF Mono para lo que se dicta), radios y sombras **solo** de `tokens.css`, cero degradados que no sean `--gold-sheen` o `--gold-hairline`, y **cuatro literales vivos eliminados** (D7, el `1.75rem` del wordmark, los dos `style={{}}` de D13) | `code-reviewer` en T20: cero literales nuevos y cuatro menos |
| **Móvil de verdad** | Todo decidido a 375px primero; **ningún objetivo táctil por debajo de `--tap-min`**, chip incluido; el carril no atrapa el desplazamiento vertical | Captura móvil antes que la de escritorio en cada DoD; T22 en teléfono real |

**Y lo que explícitamente NO se hace, porque es lo genérico**: sombras difusas de librería,
degradados arbitrarios, esquinas fuera de la escala de radios, iconos de otra familia,
rebote sin gesto previo (`bounce: 0` por defecto sigue mandando), y logos ajenos pintados
tal como llegan.

---

## 11. Propuestas de ampliación y limpieza · para `tech-lead`

**Nada de esto entra en el rediseño ni se toca en FASE 2.** Se levanta porque el inventario
lo destapó.

| # | Hallazgo | Propuesta |
|---|---|---|
| **P1** | `--gold-200` (`tokens.css:56`) y `--gold-800` (`:62`) llevan **cero consumidores** en todo `src/`. La rampa del oro tiene siete escalones y cinco se usan | Retirarlos, o documentar para qué se reservan. Dos de los «145 tokens» son ficción, y un inventario que miente es peor que uno corto |
| **P2** | `--ease-spring` (`:241`) es **exactamente el mismo valor** que `--ease-rebote` (`:260`): `cubic-bezier(0.34, 1.56, 0.64, 1)`. El segundo tiene doce líneas de comentario explicando por qué el rebote vive en la vuelta; el primero, cero consumidores | Retirar `--ease-spring` y dejar `--ease-rebote` como único nombre de esa curva. Dos nombres para una curva garantizan que dentro de un año tengan valores distintos |
| **P3** | Las alturas de control (36 / 44 / 52) son literales en `button.module.css:84,91,96`; solo el 44 tiene token (`--tap-min`) | Un trío `--control-h-sm/md/lg` con **los mismos valores**. Es un refactor no-op, pero toca un componente presente en 34 archivos: **decisión de `tech-lead`, no de este plan** |
| **P4** | La ficha se especifica para funcionar **sin fotos** y la placa 3:2 del hero es exactamente el hueco de una fotografía apaisada del local | Refuerza **B4** de la spec (`PROPUESTA-BACKEND-imagenes.md`): el día que haya bucket, la ficha ya tiene el sitio y la proporción decididos. Cero rediseño |
| **P5** | `SPRING_SHEET` y `SPRING_FLICK` (`motion.ts:50,57`) no tienen consumidores fuera de los tests, y con el carril nativo seguirán sin tenerlos | **No se retiran**: `SPRING_SHEET` es el preset de la hoja inferior del panel y su ausencia de uso es un síntoma de otra cosa. Anotar, no tocar |

---

## 12. Qué queda abierto al salir de T4

| # | Asunto | Quién lo cierra |
|---|---|---|
| 1 | Firmar la tabla de contraste de la placa (§4.3): cuatro filas de filo, cuatro de cuerpo, una de inicial | **T5**, `accessibility-auditor` |
| 2 | Confirmar que `--gold-sheen` en claro reprueba 1.4.3 a 2,34:1 y que por tanto el relleno es plano | **T5** |
| 3 | El respaldo ante logo roto (§4.5): probar el camino 1 en Chrome, Firefox y Safari | **T12**, en el navegador |
| 4 | `view-transition-name`: qué elemento, con qué nombre, y qué pasa cuando el logo es el respaldo tipográfico o el de la marca | **T6**, `motion-ux-polish` |
| 5 | Que el carril no atrape el desplazamiento vertical | **T22**, en teléfono real |
| 6 | Redactar RUP-2 en su forma nueva (§3.2) y la fila prohibida de `--gold-sheen` (§6.3) | **T7**, `docs-handoff` |
| 7 | Medir el presupuesto sobre captura real y contrastar con §3.3 | **T28** |
