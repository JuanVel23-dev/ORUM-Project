# Spec UX: Portal de Miembros — las seis pantallas
> ux-designer · **v2 · 01/09/2026** (v1: 30/08) · rama `mejora-diseno` · **T2** de `PLAN-rediseno-miembros.md`
>
> **Lienzo canónico: 375×667.** Cada pantalla se decide primero ahí; tableta y escritorio son variantes justificadas.
>
> Base: `CLAUDE.md` (rev. 30/08), `API-CONTRACT.md`, `PLAN-rediseno-miembros.md`, **`T4-direccion-arte.md`**, **`T5-validacion-contraste.md`**, las auditorías de `mobile-ux-specialist` y `apple-hig-specialist`, y el código real de `src/app/**`, `src/components/ui/**`, `src/styles/tokens.css`, `public/sw.js`. `graphify-out/` no se ha leído (`SCOPE.md` §3).
>
> **Esta spec no escribe código.** Su único artefacto es este archivo.

---

## 0. Cómo leer esta spec

### 0.0 Registro de cambios de la v2 · ▲ marca las secciones que cambiaron

**Hallazgos normativos (algo roto en el dispositivo). Prevalecen sobre la v1.**

| # | Hallazgo | Fuente | Se resuelve en |
|---|---|---|---|
| **N1** | `manifest.ts:16` → `start_url: '/admin'`. Un socio que instala la PWA arranca **en el acceso administrativo, en cada arranque**, y en `display:'standalone'` no hay barra de direcciones para corregirlo | apple-hig, verificado | §8.4 |
| **N2** | `input.module.css:14` usa `--t-body-size` = **15px**. Safari iOS hace **zoom al enfocar** cualquier campo bajo 16px, y §3.3 pone `autoFocus`: lo primero que ve un socio nuevo es un salto de zoom que descoloca la tarjeta y recorta el halo | apple-hig, verificado | §3.3, §4.2 |
| **N3** | `portal.module.css` **no reserva `env(safe-area-inset-top)`** en `.cabecera` (el shell del panel sí: `app-shell.module.css:414`). Con `black-translucent` + `viewport-fit=cover`, en PWA instalada el wordmark y **el avatar** quedan bajo la barra de estado | apple-hig, verificado | §2.4 |
| **N4** | `.tabbar` usa `height` fija (`portal.module.css:205`), no `min-height` | mobile-ux | §2.4 |
| **N5** | El chip de categoría a 36px queda **bajo el mínimo táctil de 44px** | mobile-ux + T4 §7.6 | §4.3 |
| **N6** | El sangrado del carril llegaba al **borde físico**, que es zona del gesto de atrás del sistema | mobile-ux | §4.4 |
| **N7** | **La v1 se contradecía en el carnet**: §6.3 afirmaba que cabe sin desplazar y §6.7/§10 exigían plan a dos líneas | mobile-ux | §6.3 |
| **N8** | El navegador **no** suprime `::view-transition-*` bajo `prefers-reduced-motion`, y Safari ≤17 no ejecuta la transición | apple-hig | §2.6 |
| **N9** | Zona de silencio del QR: `--space-4` sobre `size={200}` da **1,7 módulos**; la norma del código pide **4** | mobile-ux | §6.3 |

**Cambios que vienen de T4 y que esta spec adopta.**

| # | Cambio | Dónde |
|---|---|---|
| T4-1 | **El relleno de la acción dorada es plano `--action-gold` (`--gold-600`), nunca `--gold-sheen`**: en claro el barrido baja a `#5c4b25` = **2,34:1** contra el texto tinta. Variante nueva **`Button variant="brand"`** | §2.2 |
| T4-2 | **RUP-1 aprobado**: 5,40:1 texto y 3,66:1 / 4,92:1 borde, firmados en T5. Las tres acciones doradas **dejan de ser condicionales** | §2.2 |
| T4-3 | Presupuesto de oro → **tres reglas medibles sobre captura (A/B/C)**. La excepción del carnet de RUP-2 **se retira**: medido gasta 0,46 % | §2.2 |
| T4-4 | Geometría exacta de la placa: relleno `--space-1`/`--space-3`, caja interior **64×40** y **120×72**, radio `--radius-xs`/`--radius-sm`, tokens `--placa-logo-*` | §2.3 |
| T4-5 | **El respaldo ante logo roto cambia de mecanismo**: el de la v1 no podía funcionar en sus dos ramas a la vez | §2.3 |
| T4-6 | **El chip activo es tinta (`--action`), no oro**: codifica estado de filtro | §4.3 |
| T4-7 | Se estrenan piezas ya construidas: `Card variant="brand"`, `Card variant="sunk"`, `Card interactive`, `--radius-xl`, prop `error` de `Field`, `ErrorState` con `titularNivel`, `Carril`, `--carril-tarjeta-w: 200px` | §3–§8 |
| T4-8 | `h2` de estantería a `--t-title-2`; nombre del comercio a `--t-title-3`; `h1` de la ficha a `--t-title-1`; descripción de la ficha a `--t-body` | §2.1, §4.4, §5 |

**Decisiones que la v1 dejaba abiertas y aquí se cierran.**

| # | Decisión | Dónde |
|---|---|---|
| D-a | **Jerarquía del catálogo: se elige.** La rejilla lleva `h2` visible «Todos los comercios» y **todas** las tarjetas bajan a `h3` | §2.1 |
| D-b | La vuelta de la ficha **se ancla al cromo**: barra pegajosa propia bajo la cabecera | §5.4 |
| D-c | El indicador de pestaña al tocar «Mostrar mi carnet» se mueve **al confirmarse la navegación**, no al tocar | §5.8 |
| D-d | Búsqueda: `type="search"` + `enterkeyhint="search"` | §4.2 |
| D-e | En `/miembros/inactiva`, al ocultar la barra inferior **se hereda su zona segura** | §7.3 |

**Confirmado por ambas auditorías y NO se toca**: scroll nativo en vez de gesto propio · RUP-5 cumplido por duplicación real · `key={error}` en el `Alert`, no en el `<form>` · QR negro sobre blanco en los dos temas · `type="text"` + `inputMode="numeric"` · el ojo con `preventDefault` en `onPointerDown` · la ficha como página empujada y no overlay · `100dvh` bien usado en todo `src/` (no hay ni un `100vh`).

**Una corrección a mi favor**: mi cautela con Dynamic Type era infundada — iOS Safari lo aplica como **zoom de página**, que escala geometría y tipografía a la vez, y un layout correcto lo aguanta solo. El riesgo real era N4, la altura fija de la barra inferior.

### 0.1 Qué decide esta spec, y qué no

| Decide (dueño único) | No decide |
|---|---|
| Flujo, pasos, puntos de abandono, rutas de vuelta | Valores de token → T4 |
| Los ocho estados de cada pantalla | Curvas, resortes, `view-transition-name` → T6/T26 |
| Jerarquía de información y de encabezados | Los ratios firmados → T5 |
| Requisitos de comportamiento del layout y puntos de ruptura | Qué componente se crea o se amplía → T4 |
| Copy literal, íntegro, en español | |

`mobile-ux-specialist` y `apple-hig-specialist` **auditan**; no producen una spec paralela. Si contradicen algo se resuelve a favor de esta spec **salvo que el hallazgo sea normativo**, en cuyo caso se corrige aquí y se republica: eso es lo ocurrido con N1–N9.

Frontera con T4: **T4 pone el número, esta spec pone el requisito.** Si un número de T4 incumple un requisito de comportamiento de aquí, se recalcula el número, no se relaja el requisito. Hay un caso en esta revisión y está nombrado: §4.4, el sangrado del carril.

### 0.2 Los ocho estados

| # | Estado | Condición canónica |
|---|---|---|
| 1 | **Primera vez** | El socio entra por primera vez, o sin haber hecho nada todavía |
| 2 | **Carga** | El servidor no ha resuelto la consulta (`loading.tsx` / `<Suspense>`) |
| 3 | **Carga parcial** | Parte del contenido está pintado y el resto sigue en vuelo |
| 4 | **Éxito** | El caso normal, con datos |
| 5 | **Vacío** | Resolvió y no hay filas. Se distingue **vacío inicial** de **vacío tras filtro** |
| 6 | **Error** | Recuperable (hay reintento) o fatal (hay salida). Nunca sin salida |
| 7 | **Sin permiso** | La sesión no da acceso a esta pantalla |
| 8 | **Sin conexión** | El SW (`public/sw.js`) sirve `/offline` en una navegación fallida |

Donde uno no aplique, se dice **por qué**; no se omite en silencio.

### 0.3 Puntos de ruptura: `@container`, nunca `@media` dentro de `<main>`

`.main` declara `container-type: inline-size; container-name: contenido` (`portal.module.css:174-175`). Un `@media` ahí se equivoca ~200px.

Anchos reales de `contenido`: **288px** a 320 · **343px** a 375 · **398px** a 430 · **720px** a 768 · **976px** a 1024 · **1052px** desde 1196 (tope `--content-max: 1100px`).

| Nombre | Regla | Por qué ahí |
|---|---|---|
| **Móvil** | `contenido` < 560px | Una columna. A 343px una segunda daría 165px por tarjeta: el nombre no cabe |
| **Tableta** | 560 ≤ `contenido` < 900 | Dos columnas (`Grid min="290px"` ya las da a 720px). Hereda el **cromo de móvil** por debajo de 768px de *viewport*, porque la barra inferior vive fuera del contenedor |
| **Escritorio** | `contenido` ≥ 900px | Tres columnas; ficha y carnet a dos columnas reales. 900px es donde un carril de ~300px deja ≥560px al contenido |

**El cromo sí usa `@media`** (vive fuera de `<main>`, sin contenedor ancestro). Su punto de ruptura ya existe y no cambia: **768px de viewport**.

### 0.4 Lo que ya está implementado y no se rehace

Filtro de promociones vigentes, D14 cerrado (`page.tsx:118,206`) · cadena de logo comercio→marca→inicial (`resolverLogoComercio`, `:218`) · filtro por categoría en la URL con `primero()` (`:43,99`) · los filtros con diccionario vacío se ocultan solos (`filtros-form.tsx:82`) · `(portal)/loading.tsx`, `perfil/loading.tsx`, `miembros/error.tsx` · `scale: 1` bajo `prefers-reduced-motion` en la barra inferior, D3 cerrado (`portal.module.css:261-266`).

---

## 1. El recorrido completo

```
PWA instalada ─┐
dominio raíz ──┴─▶ /  → redirect('/admin')   ◀── DEFECTO: el socio aterriza en el
                                                  acceso administrativo (N1, §8.4)

/miembros/login ─┬─ correctas ──▶ requireRolMiembro ──▶ requireMiembroVigente ─┐
                 ├─ incorrectas ▶ mismo formulario, sacudida, lo tecleado se conserva
                 └─ rol ajeno ──▶ ?error=sin_permiso                            │
                                          ┌─────────────────────────────────────┘
                    vigente ◀─────────────┴─────────────▶ no vigente
                       │                                       │
              /miembros CATÁLOGO                     /miembros/inactiva
              h1 · buscar · chips                    EN PAUSA: motivo + fecha
              estanterías · rejilla                  + WhatsApp + cerrar sesión
                       │ toque en tarjeta
                       ▼
              /miembros/comercios/[id] FICHA
              hero · beneficios · sedes
                  │                    │ atrás (gesto del sistema o barra pegajosa)
   «Mostrar mi carnet»                 └─▶ vuelve al catálogo CON los filtros
                  ▼
              /miembros/perfil CARNET + QR ──▶ se enseña en la caja ──▶ fin
```

| Dónde abandona | Por qué | Qué lo evita |
|---|---|---|
| **Arranque de la PWA** | Aterriza en el acceso administrativo y concluye que la app no es para él | **Hoy nada.** N1: decisión de producto, §8.4 |
| Acceso | No recuerda su número | El pie dice dónde encontrarlo. **Ya existe** |
| Acceso | El formulario se vacía al fallar | El `key` va en el `Alert`, no en el `<form>`. Ya existe |
| Acceso | Salto de zoom al abrir el teclado | N2: ningún campo bajo 16px en puntero grueso (§3.3) |
| Catálogo | Cuatro tarjetas que dicen «sin promociones» ⇒ «no hay club» | §4.6: estado terminado, no hueco |
| Catálogo | Filtra y no sale nada | §4.9: vacío tras filtro con vuelta en un toque |
| Ficha | No sabe qué hacer con lo leído | La acción principal es **«Mostrar mi carnet»** |
| Ficha | Desliza para volver y sale de la app | N6: el carril no invade la zona del gesto (§4.4) |
| Carnet | El QR no se escanea | 4 módulos de zona de silencio y lado ≥160px (§6.3). Y el número es copiable: la caja acepta `metodo:'numero'` |
| En pausa | Callejón sin salida | WhatsApp **y** cerrar sesión (§7.3) |

**Mínimo clic**: acceso → carnet, **dos toques**. Catálogo → beneficio concreto, **uno**. Ficha → carnet, **uno**.

---

## 2. Reglas transversales

### 2.1 ▲ Jerarquía de encabezados — se elige, ya no se ofrecen dos opciones

**Un `<h1>` por pantalla, sin saltos.** La v1 ofrecía dos alternativas para el catálogo, que era pasarle una decisión de producto al implementador. Se cierra:

> **La rejilla principal lleva un `h2` visible, «Todos los comercios», y TODAS las tarjetas —rejilla y estanterías— son `h3`.**

1. **Una sola forma para la misma pieza.** La alternativa obligaría a `ComercioCard` a recibir el nivel como prop; un componente que cambia de nivel según dónde esté es una trampa que alguien pisa al siguiente cambio.
2. **El `h2` hace falta igualmente**: con estanterías encima, una rejilla sin cabecera se lee como «lo que sobró». Le da nombre y **cierra la lista**.
3. **Y da un destino de salto** al lector de pantalla, que hoy no tiene forma de llegar a la rejilla.

| Pantalla | `h1` | `h2` | `h3` |
|---|---|---|---|
| Acceso (las 6) | El nombre del portal. **Hoy no hay ningún `h1`: defecto que esta spec cierra** | — | — |
| Catálogo | Beneficios del club | Título de cada estantería · **Todos los comercios** | Nombre de cada comercio |
| Ficha | Nombre del comercio | Tus beneficios · Dónde usarlo | Título de promoción · Nombre de sede |
| Carnet | Mi carnet | Cómo usarlo | — |
| En pausa | Tu membresía está en pausa | — | — |
| Error / `not-found` / Sin conexión | El título del estado | — | — |

**Para el implementador**: `comercio-card.tsx:37` es hoy un `h2` con un comentario que dice *«el catálogo pone el `h1` y no intercala ningún `h2`»*. **Esa premisa deja de ser cierta.** Pasa a `h3` y **el comentario se actualiza, no se borra**: explicaba bien por qué no podía ser `h3` con el layout viejo, y esa historia es lo que evita que alguien lo revierta.

**`ErrorState` gana `titularNivel`** (T4 §7.5), por defecto `h2` para no alterar el panel, y `h1` cuando actúa de frontera de ruta.

### 2.2 ▲ El oro — reescrita: RUP-1 aprobado, pero con relleno plano

| v1 (incorrecto) | v2 |
|---|---|
| `Button variant="gold"` como acción principal | **`Button variant="brand"`**, variante nueva con **relleno plano `--action-gold`** |
| El relleno podía ser el barrido `--gold-sheen` | **Prohibido.** En claro, `globals.css:54-60` remapea el barrido a `#9e8244 → #7d6733 → #5c4b25 → #9e8244`; la parada oscura da **2,34:1** contra el texto tinta — reprueba 1.4.3 por más del doble, en el 62 % del recorrido del botón |
| «Condicional al veredicto de RUP-1» | **Aprobado.** T5 firma: texto tinta sobre `--action-gold` = **5,40:1**; borde contra superficie = **3,66:1** claro y **4,92:1** oscuro |

**Las tres acciones doradas, ya no condicionales:**

| Acción | Pantalla | Variante |
|---|---|---|
| «Iniciar sesión» / «Activar cuenta» | Acceso (siempre oscuro) | `Button variant="brand" size="lg" fullWidth` |
| «Mostrar mi carnet» | Ficha | `Button variant="brand"` |
| «Reactivar mi membresía» / «Escribir a soporte» | En pausa | `WhatsAppButton` con la misma variante |

**`variant="gold"` (barrido) sobrevive, pero nunca bajo texto**: filo del carnet, wordmark con `background-clip: text`, barra de `ProgressBar`. Su JSDoc gana la advertencia.

**Estados del relleno**: no cambia de color en `hover`/`active`/`disabled` — no hay hueco legal sin aterrizar al borde de un umbral de WCAG. `hover` sube elevación (claro) o enciende un filo `--gold-hairline` (oscuro); `active` encoge con `--escala-press`; `:focus-visible` dibuja el anillo **por fuera** con `outline-offset`. Es además lo correcto en el idioma de Apple: un botón de iOS no cambia de tono al pulsarse.

**Presupuesto de oro — tres reglas medibles** (T4 §3.2), en sustitución del «≤5 % del área visible», que no era verificable porque no definía qué cuenta como oro:

> **A · Oro sólido (α ≥ 0,5)**: exactamente **una pieza por pantalla**, máximo **7,5 %** del lienzo 375×667. Se verifica **contando**: dos rellenos opacos en la misma captura es fallo sin medir nada.
> **B · Oro difuso (α < 0,5)**, ponderado por α: **≤2 %**, sumando halos, filos, barridos, insignias y anillo de foco.
> **C · Invariantes**: el oro **nunca** es fondo de una superficie de contenido; **nunca** codifica dato ni estado; **nunca** hay dos rellenos sólidos compitiendo; **el chip de categoría activo es tinta, no oro**.

**La excepción del carnet de RUP-2 (~15 %) se retira**: medido gasta **0,46 %**. El carnet no se lee como credencial por cantidad de oro, sino por el filo, `--radius-xl`, el material y el aire.

**Oro que no es acción y se conserva**: wordmark de cabecera y de acceso, halo del acceso, filo del carnet, `Badge tone="gold"` del beneficio, anillo de foco.

### 2.3 ▲ La placa del logo — geometría cerrada y respaldo corregido

**(a) Proporción 3:2 apaisada, no cuadrada.** Con `object-fit: contain` —la regla correcta para un logo, porque `cover` cambia deformación por **mutilación**— un logotipo 4:1 en un cuadro 1:1 se pinta al 25 % de su alto; en 3:2 recupera ~50 %. Y la inicial centrada en un rectángulo se lee como **placa de marca**, no como avatar: un comercio no es una persona.

**(b) Geometría exacta** (T4 §4.2 — la v1 sugería 6px de relleno, y **6px está fuera de la rejilla de 4pt**, que es la única regla que la escala tiene):

| Contexto | Placa | Relleno | Caja interior | Radio |
|---|---|---|---|---|
| Tarjeta de rejilla y de carril | **72 × 48** | `--space-1` (4px) | **64 × 40** | `--radius-xs` |
| Hero de la ficha | **144 × 96** | `--space-3` (12px) | **120 × 72** | `--radius-sm` |
| Esqueleto de carga | Idéntica a la real, mismo radio | | | |

El ancho sale de `--placa-logo-w`; **la altura no se declara**, la deriva `aspect-ratio`. El hero inyecta `--placa-logo-w: 144px` localmente —único uso de `style` que la norma admite— y eso **mata el `style={{width,height}}` de D13**. `flex-shrink: 0`: **la placa nunca se encoge**; una de 68px junto a otra de 72px destroza la rejilla antes que cualquier logo feo.

**(c) Fondo constante en los dos temas (RUP-6).** Un PNG transparente con logotipo oscuro desaparece sobre placa oscura: es el caso de `QrCode`, **el activo no es nuestro y asume fondo claro**. Fondo `--placa-logo-bg` (blanco) y filo `--placa-logo-borde` de 1px, **idénticos en claro y oscuro**, con tokens y nunca literales — esa es la diferencia con `QrCode`. En claro **la placa la dibuja el filo y solo el filo** (el cuerpo da 1,00:1 contra la tarjeta); en oscuro la placa es la pieza más luminosa (18,05:1). El filo da 3,33 / 3,22 / 5,42 / 5,95:1 en las cuatro superficies donde vive.

**(d) ¿Se distingue un logo de marca de uno propio? No.** El socio no tiene por qué ver nuestro modelo de datos. La honestidad la aporta el texto: el **nombre de la marca** bajo el del comercio explica por qué se ve ese logotipo, y se lee como información, no como excusa.

**(e) ▲ Respaldo ante logo roto — el mecanismo de la v1 no podía funcionar.** La v1 decía *«la inicial se renderiza siempre como fondo y queda al descubierto cuando la imagen falla»*. T4 §4.5 demuestra que sus dos ramas se excluyen: si el `<img>` es transparente para dejar ver la inicial, **un logo transparente legítimo deja ver la inicial entre sus trazos**; y si lleva fondo opaco para taparla, **una imagen rota también la tapa** y se ve placa vacía. El servidor no puede distinguir «cargó» de «falló», y no hay selector de CSS para eso.

> **Mecanismo v2**: la placa entera va `aria-hidden` y **el `alt` del `<img>` es la inicial del comercio**, con `font-size`, `color` y `text-align` aplicados al propio `<img>`. Al fallar, el navegador pinta el texto alternativo **ya estilado**: se ve la inicial, en su sitio y con su aspecto. Coste cero, sigue siendo Server Component, cero JavaScript.

- **Verificar en Chrome, Firefox y Safari** (T12): Chrome puede pintar un glifo de rotura **junto** al texto alternativo cuando el `<img>` tiene dimensiones explícitas. Si ocurre, se documenta cuál y se pasa al camino de fondo opaco, cuyo peor caso es **placa vacía** —feo, nunca icono de rotura—. Solo si la placa vacía se rechaza se paga convertir `ComercioLogo` a cliente con `onError`, que en el catálogo cuesta **~100 raíces de hidratación** en la pantalla cuya regla nº2 es el rendimiento.
- **Esto sustituye al `alt=""` de la v1** y resuelve D12 igual de bien: el `aria-hidden` oculta el `alt` al lector, el nombre sigue visible al lado y **no se anuncia dos veces**.

**Los cinco estados de la placa**: logo propio → la imagen entera · sin propio con marca → la de la marca, presentación idéntica · sin ninguno → la inicial en `--placa-logo-inicial` (5,26:1 sobre la placa, constante en los dos temas) · **roto → la inicial, por la vía del `alt` estilado** · cargando → placa con su filo; el esqueleto usa **la placa real**.

### 2.4 ▲ Cromo: cabecera, barra inferior, menú — zonas seguras

```
┌────────────────────────────────────────┐
│ ░░ safe-area-inset-top ░░░░░░░░░░░░░░░ │ ◀── N3: hoy NO se reserva
├────────────────────────────────────────┤
│  ORUM                             (A)  │ cabecera pegajosa, material
├────────────────────────────────────────┤
│               contenido                │
├────────────────────────────────────────┤
│    ⌂ Inicio          ☺ Mi perfil       │ barra inferior fija, material
│ ░░ safe-area-inset-bottom ░░░░░░░░░░░░ │ ◀── esta sí se reserva ya
└────────────────────────────────────────┘
```

> **N3 · Requisito duro.** `.cabecera` debe reservar la zona segura superior, igual que el shell del panel (`app-shell.module.css:414`): `padding-top: max(var(--space-3), env(safe-area-inset-top, 0px))`. Y **las tres superficies de cromo —`.cabecera`, `.main`, `.tabbar`— deben reservar también los insets laterales**: `padding-inline: max(<relleno actual>, env(safe-area-inset-left/right, 0px))`, porque en horizontal sobre un dispositivo con muesca el contenido se mete bajo el bisel.

**Por qué es grave y no cosmético**: `src/app/layout.tsx:33` declara `statusBarStyle:'black-translucent'` y `:46` declara `viewportFit:'cover'` — en PWA instalada el contenido llega hasta arriba del todo **y el hueco de la barra de estado hay que reservarlo a mano**. Sin ese `padding-top`, el wordmark y **el avatar** quedan debajo. Y como el avatar es **la única puerta al menú en móvil**, y §7.3 oculta la barra inferior en `/miembros/inactiva`, **esa pantalla se queda sin ninguna salida alcanzable**: el callejón que esta spec diseñó para evitar, reintroducido por un `padding` que falta.

> **N4** · `.tabbar` pasa de `height` a **`min-height`** con el mismo valor (`portal.module.css:205`). Con zoom de página —que es como iOS aplica Dynamic Type— la etiqueta crece y la altura no, así que se recorta. Es no-op en el caso base.

**Resto del cromo (sin cambios respecto de la v1):**

- **La cabecera móvil no lleva navegación**: la barra inferior es la navegación.
- **(A) es el avatar**, única puerta al menú en móvil. Contiene, en orden: correo (no accionable) · separador · **Tema** (tres opciones) · separador · **Soporte por WhatsApp** · **Cerrar sesión**.
- **El conmutador de tema sale de la cabecera y entra en el menú.** Compite con las dos únicas pestañas que importan y Apple lo entierra. Se cumple el corolario de `CLAUDE.md`: cabecera y avatar se renderizan a todos los anchos (`layout.tsx:42-82`), así que el destino no desaparece del teléfono.
- **Trampa verificada, no la redescubras**: el menú vive dentro de `<form action={cerrarSesionMiembro}>`. Un `SegmentedControl` son `<input type="radio">`; con el foco en un radio, **Enter dispara la submisión implícita, o sea cierra la sesión**. El tema va como **tres `MenuItem` con `onSelect`**, en un componente de cliente propio que consume `useTheme()` con `useSyncExternalStore` —nunca `useState`+`useEffect`—. Es el único cliente que gana el cromo y se paga **una vez**, no por fila.
- **Se retira el botón de WhatsApp de la cabecera** (D4): la misma acción no puede estar dos veces en la misma pantalla. Con eso **el wordmark vuelve a ser el único oro del cromo**.
- **Escritorio (≥768px)**: la barra inferior desaparece y la navegación sube a la cabecera. El indicador activo es **una barra bajo el enlace**, no un cambio de color (`portal.module.css:123-132`): sobrevive a la ceguera al color. Se conserva.

**D6 — la pestaña activa dentro de una ficha.** Hoy `esActivo` marca `/miembros` solo en coincidencia exacta, así que dentro de `/miembros/comercios/[id]` **ninguna pestaña queda activa** y el socio pierde la referencia.

> «Inicio» activo en `/miembros` **y** en cualquier ruta bajo `/miembros/comercios/`. «Mi perfil» activo en `/miembros/perfil` y sus hijos. `/miembros/inactiva` no activa ninguna: no es destino de navegación, y allí la barra ni se muestra.

Se extrae a `src/lib/` como función pura para que `qa-tester` cubra las tres formas de ruta: hoy vive en un componente de cliente y `vitest` solo descubre `.test.ts`.

### 2.5 Atajos de teclado (escritorio)

| Atajo | Qué hace | Coste |
|---|---|---|
| `Tab` / `Shift+Tab` | Recorre chips, tarjetas y acciones con `:focus-visible` | Cero: HTML correcto |
| `Enter` sobre una tarjeta | Abre la ficha | Cero: la tarjeta **es** un enlace |
| `Enter` en la búsqueda | Envía el `method="get"` | Cero: submisión implícita |
| `Enter` en «Confirma tu contraseña» | Activa la cuenta sin tocar el botón | Cero, y resuelve el hallazgo del teclado (§3.6) |
| `Escape` / flechas en el menú | Cierra / recorre | Ya lo hace `DropdownMenu` |
| `←` `→` con el foco dentro de un carril | Lo desplaza | Nativo: el navegador desplaza el scroller al enfocar un hijo |

**No se especifica paleta de comandos en el portal.** La del panel existe porque hay 20 destinos; aquí hay dos. Una paleta sobre dos destinos es decoración.

### 2.6 ▲ Movimiento: dos reglas normativas (sección nueva)

Esta spec no define curvas ni duraciones (T6/T26). Define **dos condiciones de comportamiento** que, si no se escriben aquí, no las escribe nadie.

**(a) `prefers-reduced-motion` NO suprime las transiciones de vista. Hay que suprimirlas a mano.** El navegador respeta la preferencia en animaciones y transiciones CSS declaradas, pero **ejecuta igual el morfeo de `::view-transition-*`**. Sin regla explícita, quien pidió no ver movimiento vestibular lo ve.

> **Requisito**: la hoja que introduzca la transición debe llevar su rama `@media (prefers-reduced-motion: reduce)` anulando la animación de `::view-transition-group(*)`, `::view-transition-old(*)` y `::view-transition-new(*)`. **La forma exacta la fija T6**; la obligación de que exista la fija esta spec, y su ausencia es un fallo de accesibilidad, no un detalle de pulido. Y como en todo el producto: **movimiento reducido ≠ sin feedback** — el relevo entre pantallas sigue existiendo en su equivalente no vestibular.

**(b) La transición de elemento compartido sale del argumento de «lujo».** Safari ≤17 no ejecuta `startViewTransition`: en una parte grande del parque de iPhones —que es el dispositivo del socio— sencillamente no ocurre nada. Tratarla como rasgo del producto lleva a dos errores: prometerle al propietario algo que la mitad de sus clientes no verá, y apoyar la jerarquía visual en un efecto que puede no existir.

> **Lo que sostiene «lujoso» en todos los navegadores**: la placa y su filo, el material del cromo, el `--radius-xl` y el filo metálico del carnet, cinco niveles de la rampa por pantalla, y el aire. **La transición es un regalo cuando está.** Si en T26 no se consigue verificar, se retira sin que el diseño pierda nada.

---

## 3. PANTALLA 1 — Acceso (las seis)

### 3.1 Cuáles son las seis

`PantallaAuth` es una envoltura que comparten cuatro rutas; una tiene tres estados que son pantallas distintas para el usuario:

| # | Pantalla | Ruta | `h1` |
|---|---|---|---|
| 1 | Administración | `/login` | Administración |
| 2 | Comercios | `/comercios/login` | Herramienta de comercios |
| 3 | Miembros | `/miembros/login` | Portal de Miembros |
| 4 | Activación — verificando | `/activar-cuenta` | Activa tu cuenta |
| 5 | Activación — enlace inválido | `/activar-cuenta` | Activa tu cuenta |
| 6 | Activación — elegir contraseña | `/activar-cuenta` | Activa tu cuenta |

**«Son dos puertas al mismo club» queda intacto**: las seis cambian a la vez y comparten dirección de arte. Solo cambian el `h1`, la línea de apoyo y los campos.

**Aclaración que T4 §6.3 pide dejar escrita**: entre las seis están `/login` y `/comercios/login`. Un lector rápido de *«en Administración el primario sigue siendo tinta»* concluirá que ahí el CTA no puede ser dorado. **Sí puede**: la norma habilita «el Portal de Miembros **y las seis pantallas de acceso**». Lo que sigue siendo tinta es el primario **dentro** del panel y de la herramienta, no su puerta.

### 3.2 Objetivo del usuario

Entrar. En menos de diez segundos, sin dudar de que está en el sitio correcto y sin que la pantalla parezca un formulario administrativo.

### 3.3 ▲ Layout — móvil (375×667), el canónico

Siempre en oscuro, con `data-theme="dark"` en el contenedor. Ya es así y no cambia.

```
      ·  halo dorado  ·                  ::before radial, casi imperceptible
 ┌──────────────────────────┐
 │ ▔▔▔ filo de luz ▔▔▔▔▔▔▔▔ │  Card variant="brand" · --gold-hairline
 │        O R U M           │ ①  wordmark --t-display-2, barrido metálico
 │   Portal de Miembros     │ ②  h1 --t-title-2
 │ Entra con tu número de   │ ③  apoyo --t-footnote
 │        membresía.        │
 │  [ aviso, si lo hay ]    │ ④
 │  Número de membresía     │ ⑤  campo ≥16px (N2)
 │  ┌────────────────────┐  │
 │  │ 00012345           │  │
 │  └────────────────────┘  │
 │  Contraseña              │
 │  ┌────────────────────┐  │
 │  │ ••••••••        👁 │  │
 │  └────────────────────┘  │
 │  ┌────────────────────┐  │ ⑥  variant="brand", relleno plano --action-gold
 │  │   Iniciar sesión   │  │
 │  └────────────────────┘  │
 └──────────────────────────┘
  ¿No recuerdas tu número…    ⑦  pie, fuera de la tarjeta
```

1. **Wordmark ORUM** — responde «¿dónde estoy?». `--space-8` de aire antes del `h1`. **Pasa a `--t-display-2`** y deja de ser el `font-size: 1.75rem` literal de `pantalla-auth.module.css:116`, fuera de la rampa sin motivo. Al ser `clamp`, crece en escritorio, donde el halo también crece.
2. **`h1`** — `--t-title-2`, centrado. **Hoy este texto es un `<span>` y la pantalla no tiene ningún `h1`**: es un fallo de accesibilidad, no una preferencia.
3. **Línea de apoyo** — `--t-footnote`, `--text-3`. Dice con qué se entra y elimina la duda de «¿me pide el correo o el número?» antes de tocar el campo. **Es nueva.**
4. **Aviso** (solo si hay error), con la sacudida.
5. **Campos.** 6. **Acción principal**, ancho completo, `size="lg"`. 7. **Pie**, fuera de la tarjeta.

**La tarjeta estrena `Card variant="brand"`**, construida hace dos años y cuyo único consumidor es la galería de desarrollo: es literalmente «la tarjeta buena». Junto al carnet son las **dos únicas** superficies del producto que la llevan.

**Cambio estructural**: `PantallaAuth` recibe `titular` (el `h1`) y `apoyo` además de `pie`. `subtitulo` desaparece como prop; su contenido pasa a `titular`. Aditivo, y afecta a las cuatro rutas a la vez.

#### N2 · Requisito: ningún campo bajo 16px en puntero grueso

**Safari iOS hace zoom al enfocar un campo con `font-size` computado < 16px.** `input.module.css:14` declara `var(--t-body-size)` = **15px**, y aquí hay `autoFocus`. La secuencia real: el socio abre la app → el campo recibe el foco solo → **salto de zoom** que descentra la tarjeta, recorta el halo y deja la interfaz desplazada. Es la primera impresión, y es la pantalla que T10 somete a aprobación.

> **Requisito**: en el recorrido del cliente **ningún campo de texto puede computar por debajo de 16px bajo `(pointer: coarse)`**. Afecta a los cuatro accesos, a los dos campos de `/activar-cuenta` y al campo de búsqueda del catálogo (§4.2).
>
> **Camino propuesto, decisión del valor es de T4**: token `--t-control-size` con `0.9375rem` bajo `(pointer: fine)` y `1rem` bajo `(pointer: coarse)`, consumido por `input.module.css:14`. Es **aditivo**: ningún token existente cambia de valor y en escritorio el control se ve igual que hoy.
>
> **⛔ Prohibido resolverlo con `user-scalable=no` o `maximum-scale=1`**: mata el pinch-zoom y es fallo de WCAG 1.4.4. `src/app/layout.tsx:41-53` **no** los declara y **no puede ganarlos**.
>
> **Si T4 no aprueba el token**, `autoFocus` se retira del acceso en móvil: un salto de zoom en la primera impresión cuesta más que el toque que ahorra. **No se hacen las dos cosas mal a la vez.**

**Lo que se conserva porque ya está verificado**: `estilosAuth` como fuente de `formulario` y `alerta` —la sacudida usa `:has(.alerta)` y **ambas clases deben salir del mismo módulo**, moverlas la rompe **en silencio**— · el `key={error}` en el `Alert`, **nunca en el `<form>`** · `type="text"` con `inputMode="numeric"` (el número lleva ceros a la izquierda y `type="number"` los descarta) · `autoComplete` · el ojo con `InputButton` y `preventDefault` en `onPointerDown` · `tabIndex: 0`, **nunca `-1`** · las ramas de `prefers-reduced-transparency` y `prefers-reduced-motion` · **D7**: el halo pasa de `rgba(191,160,99,…)` a token.

### 3.4 Layout — tableta

**Idéntico al móvil.** Hereda de móvil, no de escritorio: la tarjeta ya tiene `max-width: 400px` y entre 400 y 900px no hay nada que reorganizar, solo más aire. Estirarla a 700px daría campos de 700px, que es la forma más rápida de que un formulario de dos campos parezca uno de veinte.

### 3.5 Layout — escritorio

**También idéntico: tarjeta centrada de 400px sobre el fondo con halo, y está justificado.** Mi propia norma prohíbe la columna centrada estrecha *por defecto*; aquí no es por defecto:

1. **No hay contenido que poner al lado.** Un panel con «ventajas del club» sería marketing inventado: el Portal Público no existe y no hay datos que mostrarle a quien todavía no ha entrado.
2. **La tarea es de dos campos.** Ensancharla no reduce un clic ni un movimiento del ojo.
3. **El halo necesita negro alrededor para leerse como luz.** Su efecto depende de la proporción entre tarjeta y fondo; dos columnas lo destruirían.

Lo que sí cambia: el halo crece con el viewport (`min(760px,120vw)`, ya implementado) y el wordmark crece con su `clamp`. Si en T10 el propietario pide otra cosa, la alternativa preparada es un fondo con textura de marca a sangre, **no** una segunda columna de texto.

### 3.6 Los ocho estados

**Primera vez** — no aplica de forma distinta: todas las visitas son iguales y esa uniformidad es parte de la confianza. El matiz es la **activación** (pantallas 4-6), única en la vida del usuario, y por eso su copy habla de «activar», no de «entrar».

**Carga** — (a) acción en vuelo: el botón entra en `loading`; `Button` ya pone `disabled={props.disabled || loading}` y `aria-busy` (`button.tsx:117-118`), así que **el doble envío está resuelto por construcción**, y los campos siguen visibles y editables. (b) `/activar-cuenta` comprobando el enlace: hoy es `<p>Verificando el enlace…</p>` a pelo, el estado más pobre de las seis; pasa a `Spinner` + texto dentro de un bloque con **la misma altura mínima que el formulario que va a sustituir**, para que la tarjeta no salte al resolverse, con `role="status"` y `aria-live="polite"`. Copy: «Comprobando tu enlace…»

**Carga parcial** — no aplica: el formulario es una sola unidad.

**Éxito** — nada que mostrar: la acción redirige. **No hay pantalla intermedia de «entrando…»**: sería un paso más para no decir nada.

**Vacío** — no aplica: no hay lista.

**Error** — todos recuperables (el usuario se queda con lo tecleado intacto) salvo la pantalla 5:

| Situación | Copy | Origen |
|---|---|---|
| Credenciales incorrectas | Correo o contraseña incorrectos. | Servidor |
| Cuenta inactiva | Tu cuenta está inactiva. Contacta al administrador. | Servidor |
| Portal equivocado (admin) | Esta cuenta no tiene acceso al portal administrativo. | Servidor |
| Portal equivocado (comercios) | Este acceso es exclusivo para comercios. | Servidor |
| Portal equivocado (miembros) | Ese acceso no tiene una cuenta de miembro asociada. | `?error=sin_permiso` |
| Contraseña corta (activar) | La contraseña debe tener al menos 8 caracteres. | Cliente, **al campo** |
| Contraseñas distintas (activar) | Las contraseñas no coinciden. | Cliente, **al campo** |
| Fallo al guardar (activar) | No se pudo activar la cuenta. Vuelve a intentarlo. | Cliente, banner |

El `Alert tone="danger"` entra con su animación y **el formulario se sacude una vez**; bajo `prefers-reduced-motion` no se sacude pero el aviso sigue apareciendo y siendo anunciado. **Los dos errores de contraseña pasan al campo**: son de cliente, sabemos cuál falló, y `Field` ya lo pinta con `aria-describedby` y `aria-invalid` (`field.tsx:29-39`) — un prop que de sus 78 usos **solo consume la galería de desarrollo**. En los accesos por credenciales se queda el banner global porque la API no dice qué campo falló (`API-CONTRACT.md` §P4).

> **▲ v2 — hallazgo de `mobile-ux-specialist`**: con dos campos, dos posibles líneas de error y el teclado abierto, el botón «Activar cuenta» puede quedar bajo el teclado en 667px. **No se retira la mejora de accesibilidad; se resuelve así:**
> 1. **`enterkeyhint="done"` en «Confirma tu contraseña».** Con la submisión implícita **el usuario nunca necesita alcanzar el botón**: envía desde el teclado. Es el arreglo real y cuesta un atributo.
> 2. **Los mensajes de campo son de una línea.** El copy ya lo es y no puede crecer sin recalcular esto.
> 3. **`.pantalla` conserva su `overflow-y: auto`** (`pantalla-auth.module.css:21`): el botón siempre es alcanzable desplazando.
> 4. **El error de «confirmar» aparece al salir del campo**, no solo al enviar: el desplazamiento ocurre mientras el usuario mira ese campo, no cuando busca el botón.
> 5. **Sin `scrollIntoView` automático**: mover la vista bajo los dedos de quien escribe es peor que un desplazamiento voluntario.

**Error fatal — pantalla 5, enlace inválido.** Hoy: un `Alert` y **nada más, un callejón**. A partir de ahora: el mismo `Alert` y debajo una salida real, elegida con el `?rol=` que la pantalla ya lee (`activar-form.tsx:23`): `staff` → `/login`, `comercio` → `/comercios/login`, cualquier otro → `/miembros/login`. **Sin acción primaria**: no hay nada que el usuario pueda hacer aquí que resuelva el problema, y un botón grande que no arregla nada es peor que ninguno.

**Sin permiso** — se muestra el mismo formulario con el aviso correspondiente. **No se dice a qué portal sí tiene acceso**: un acceso que enumera portales le cuenta la arquitectura del sistema a quien prueba credenciales.

**Sin conexión** — §8.3.

### 3.7 Interacciones

| Elemento | Trigger | Resultado | Feedback |
|---|---|---|---|
| Campo del número | `autoFocus` | Teclado numérico. **Sin salto de zoom** (N2) | Anillo de foco |
| Ojo de la contraseña | `pointerdown` | Alterna visible/oculto | El icono cambia, **el teclado NO se cierra**, el foco sigue en el campo |
| «Iniciar sesión» | `click` o `Enter` en un campo | Envía | `loading` + deshabilitado |
| «Confirma tu contraseña» | `Enter` (`enterkeyhint="done"`) | Envía sin tocar el botón | Ídem |
| Envío fallido | Respuesta | Vuelve con lo tecleado | Aviso + una sacudida |
| «Ir a iniciar sesión» | `click` | Acceso de su rol | Navegación normal |

### 3.8 Navegación y URL

`/login` · `/comercios/login` · `/miembros/login` · `/activar-cuenta`. Parámetros: `?error=sin_permiso` y `?rol=staff|comercio`. Atrás: sale de la app o vuelve al referente; un acceso no acumula historial propio. Sobrevive a un refresco el parámetro `error`; **lo tecleado no**, y es correcto. Con sesión ya iniciada, cada acceso redirige a su portal antes de pintar (ya lo hace).

---

## 4. PANTALLA 2 — Catálogo (`/miembros`)

### 4.1 Objetivo del usuario

Dos, y compiten: **explorar** («¿qué me da este club?», domina las primeras visitas) y **buscar** («¿tienen X?», domina a partir de la tercera). Un solo layout sirve a los dos: **explorar es el estado por defecto; buscar es lo que ocurre cuando hay algo en la URL.** Con filtros activos, las estanterías desaparecen y la rejilla ocupa la pantalla, porque en modo búsqueda una estantería de novedades es ruido.

### 4.2 ▲ Layout — móvil: qué entra en el primer pantallazo sin desplazar

Es el criterio de «no genérica» del plan. Aritmética a 375×667, **con el chip a 44px** (N5):

| Bloque | Alto | Acum. |
|---|---|---|
| Cabecera pegajosa | 56 | 56 |
| `.main` padding-top `--space-6` | 24 | 80 |
| Overline «TU MEMBRESÍA» `--t-overline` | 14 | 94 |
| `h1` `--t-display-2` (24px a 375, leading 1,1) | 27 | 121 |
| Lede `--t-footnote`, 2 líneas | 38 | 159 |
| `--space-5` | 20 | 179 |
| Campo de búsqueda (44 + etiqueta) | 61 | 240 |
| `--space-4` | 16 | 256 |
| **Fila de categorías, `--tap-min`** — *solo si hay categorías* | **44** | 300 |
| `--space-5` | 20 | 320 |
| Primera tarjeta completa | ~200 | 520 |
| Segunda tarjeta, asomando | 147 visibles | 667 |

**Resultado**: caben el wordmark, **cinco niveles de la rampa** (`--t-overline`, `--t-display-2`, `--t-footnote`, `--t-callout` del chip, `--t-title-3` del nombre), la fila de categorías y **una tarjeta entera más otra asomando**. La que asoma no es accidente: es lo que le dice al ojo que hay que desplazar. Los 8px que cuesta subir el chip de 36 a 44 **no cambian la conclusión**.

**Con las categorías vacías —el caso de hoy— la fila no se renderiza** y el pantallazo gana 64px: entra tarjeta y media más. Eso es mejor, no peor, y por eso la fila **no reserva hueco**.

```
┌────────────────────────────────────────┐
│  ORUM                             (A)  │
├────────────────────────────────────────┤
│  TU MEMBRESÍA                       ①  │ overline
│  Beneficios del club                ②  │ h1
│  Muestra tu carnet en la caja y el  ③  │ lede
│  comercio aplica tu beneficio.         │
│  🔍 Busca un comercio o un beneficio ④ │ type="search", ≥16px
│  (Todas)(Gastronomía)(Salud)(Belle→ ⑤  │ chips 44px, deslizable
│  Todos los comercios                ⑥  │ h2 (D-a)
│  ┌──────────────────────────────────┐  │
│  │ ▭▭▭▭  Casa Duarte            h3  │  │ placa 72×48
│  │ ▭▭▭▭  Grupo Duarte               │  │
│  │ Cocina de autor en el centro.    │  │
│  │ ──────────────────────────────── │  │
│  │ Almuerzo ejecutivo        (2x1)  │  │
│  │ Postre de la casa        (-20%)  │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│    ⌂ Inicio          ☺ Mi perfil       │
└────────────────────────────────────────┘
```

**Lo que desaparece del diseño actual:**

| Se retira | Razón |
|---|---|
| Desplegable **«Comercio»** | Duplica la búsqueda: `q` ya hace `ILIKE` sobre `nombre`. Con 100 opciones es peor buscador que un campo de texto, y **es lo que más ocupa el primer pantallazo**. Escribir tres letras es menos trabajo que abrir un selector de cien |
| Desplegable **«Categoría»** | Sube a chips: un toque en vez de abrir → elegir → «Filtrar» |
| El botón **«Filtrar»** en modo por defecto | Con búsqueda y chips, el único envío es `Enter` en el campo. Vuelve dentro de «Más filtros» cuando hay desplegables |

**Se conserva `method="get"`**: los filtros quedan en la URL, se comparten, sobreviven a un refresco y funcionan sin JavaScript. Es la convención del repositorio y es correcta.

**«Más filtros»** — los desplegables que sobrevivan (Marca, Ciudad) van en un `<details>` **dentro del mismo `<form>`**: un `<details>` cerrado **sigue enviando** los controles que contiene, funciona sin JavaScript, y se renderiza `open` si alguno está activo, para que nunca haya un filtro aplicado y escondido. **No se usa un overlay**: la ranura `@modal` vive solo en `app/admin/layout.tsx`, y crear una aquí sería inventar arquitectura para dos desplegables.

**Regla nueva de renderizado de un desplegable**: se muestra con **dos o más opciones**, no con una. Hoy el umbral es «una o más», y con una sola ciudad —Bogotá, el caso real— se pinta un control que no puede discriminar nada. **Un filtro que solo puede dar un resultado no es un filtro; es una etiqueta con forma de control.**

**Consecuencia con los datos de hoy**: no se renderiza ningún desplegable ni ninguna fila de chips. El catálogo es **encabezado + búsqueda + rejilla**. Es exactamente lo que el propietario pidió, y llega solo: el día que se pueble `categorias` aparece la fila; el día que haya dos ciudades aparece «Más filtros».

**D-d · El campo de búsqueda** lleva `type="search"` (da el botón nativo de limpiar en iOS, un toque menos), `enterkeyhint="search"` (la tecla del teclado dice «buscar» en vez de «intro»), `autocorrect="off"`, `autocapitalize="none"` y `autoComplete="off"`. **Y le aplica N2**: ≥16px en puntero grueso, o al enfocarlo la página da un salto de zoom sobre la rejilla ya pintada, que es peor que en el acceso porque hay más contenido que desplazar. `type="search"` exige `-webkit-appearance: none` para no heredar el aspecto nativo; lo resuelve `input.module.css`.

### 4.3 ▲ La fila de categorías

- **Son enlaces, no campos.** `<Link href="?categoria_id=3">`: un toque, cero pulsaciones de «Filtrar», queda en la URL y funciona sin JavaScript. Es la regla nº1.
- **Cada chip conserva los demás parámetros**: el `href` se construye sobre la búsqueda actual cambiando solo `categoria_id`. Si no, elegir categoría borraría lo que el socio escribió.
- **«Todas» va primero y siempre**, con la URL actual **sin** `categoria_id`: el reset de un toque.
- **El chip activo se coloca en segunda posición**, tras «Todas»; el resto, alfabético. Sin JavaScript no se puede desplazar la fila hasta el chip activo, así que podría quedar fuera de vista tras un refresco. Hoistarlo es la única solución sin código de cliente. **El resto es alfabético a propósito**: una fila que se reordena sola entre visitas destruye la memoria muscular.
- **Tocar el chip activo lo desactiva** (su `href` pierde `categoria_id`): encender y apagar con el mismo dedo, en el mismo sitio.
- **▲ N5 · El chip mide `var(--tap-min)` (44px), no 36px.** La v1 lo dejaba en 36 y exigía la técnica del `::after` de ampliación —la misma que exige para el botón de copiar— y luego **no la especificaba**. Se resuelve mejor **sin `::after`**: el chip mide el mínimo táctil de verdad. Cuesta 8px del primer pantallazo (§4.2 ya recalculado), y a cambio elimina un literal de alto, elimina la técnica de ampliación y **elimina la posibilidad de que quede un objetivo de 36px vivo**.
- **▲ T4-6 · El chip activo es tinta (`--action` / `--action-fg`), no oro.** Un chip activo **codifica un estado de filtro**, y el oro no codifica estado (Regla C). Precedente en el sistema: `toggle.module.css:144` ya pinta el estado marcado con `--action`.
- **Sin depender del color**: relleno lleno + peso 590 + **check de 13px antes de la etiqueta** + `aria-current="true"`. El check es el portador que sobrevive a la ceguera al color; el relleno es refuerzo.
- **Categorías sin comercios no se pintan.** Se cruza el diccionario con los `categoria_id` de los comercios activos. Esa lista ya se consulta hoy para poblar el desplegable «Comercio» que se retira (`page.tsx:63-69`): **la consulta no se añade, se reutiliza**, cambiando su `select` de `id, nombre` a `id, categoria_id`. Coste neto: cero.
- **La fila se renderiza solo con dos o más chips además de «Todas».** Con uno, el chip es la rejilla entera.
- **Sin contadores.** El número sería el total de la categoría, no el de la búsqueda activa: al combinarlo con `q` mentiría. Un número que miente en una pantalla cuyo objetivo es la confianza no vale los píxeles.
- **Sin icono ni color por categoría**: `categorias` es solo `id, nombre` (§12).
- **Gesto**: scroll horizontal nativo con `scroll-snap-type: x proximity`. **Nunca gesto propio**: el nativo ya da seguimiento 1:1, resistencia elástica y proyección de momento del sistema, corre en el compositor y funciona sin JavaScript. **La fila no puede atrapar el desplazamiento vertical** —el fallo clásico— y se verifica en teléfono real (T22). Se aplica la geometría de §4.4, incluido el sangrado asimétrico.

### 4.4 ▲ Las estanterías y la forma del carril

Las tres construibles son **categorías** (ya resuelta como chips), **novedades** (`created_at`) y **promociones vigentes**. «Destacados» no existe: ninguna tabla tiene columna de destacado, orden ni prioridad (§12).

**Las dos estanterías llevan umbral de renderizado**, porque una estantería que repite la rejilla entera no comprime nada: la estorba.

| Estantería | Se renderiza si… | Hoy | Origen |
|---|---|---|---|
| **Nuevos en el club** | **≥8** comercios en el resultado **y** ≥4 con `created_at` de los últimos 90 días | **No** (hay 4 comercios) | `comercios.created_at`, `order desc`, tope 10 |
| **Beneficios del momento** | **≥3** promociones vigentes en **≥2** comercios | **No** (hay 0 vigentes) | El mapa `promocionesPorComercio` que la página **ya construye**. Cero consultas nuevas |

**Las dos desaparecen cuando hay búsqueda o filtro activo**: en modo búsqueda el resultado es el contenido, y una estantería curada al lado es una distracción.

**Umbral de 8, explicado**: por debajo, la rejilla completa cabe en dos pantallazos. Un atajo hacia algo que ya está a un dedo de distancia no es un atajo.

**RUP-5 se cumple por duplicación, no por enlace.** Todo lo de una estantería está también en la rejilla, en la misma página. Por eso las cabeceras **no llevan «Ver todos»**: no habría a dónde ir que no fuera esta misma URL, y un enlace que no lleva a ninguna parte es peor que ninguno. **Se deja escrito para que T18 no lo lea como incumplimiento.** Si algún día una estantería mostrara algo que la rejilla no muestra, el «Ver todos» pasa a obligatorio.

**Forma**: cabecera `h2` en `--t-title-2` + apoyo en `--t-footnote` + el scroller. Tarjeta compacta de `--carril-tarjeta-w` (200px): placa 72×48, nombre (`h3`, `--t-title-3`) y **el mejor beneficio** en `Badge tone="gold"`. Sin descripción ni ciudades: eso es lo que la comprime. La cabecera a `--t-title-2` y el nombre a `--t-title-3` **no es un detalle**: si compartieran nivel, la estantería y su contenido pesarían igual y la agrupación desaparecería.

**▲ N6 · El sangrado no llega al borde físico.** T4 §5.2 propone `margin-inline: calc(var(--pad-contenido) * -1)`, simétrico. **Eso pone contenido desplazable dentro de la zona del gesto de atrás del sistema**, que en iOS vive en el borde izquierdo y en Android en los dos: el socio arrastra donde el diseño le invita y **sale de la pantalla**.

> **Requisito de comportamiento**: en reposo, **ninguna tarjeta del carril empieza dentro de la banda de gesto del borde**, y el carril nunca es el objetivo de un arrastre iniciado en el borde.
>
> **Forma elegida: sangrado solo hacia `inline-end`.** `margin-inline-start: 0` con el primer elemento alineado al contenido; `margin-inline-end: calc(var(--pad-contenido) * -1)` con `padding-inline-end: var(--pad-contenido)`. La tarjeta cortada —que es la que dice «hay más»— sigue apareciendo en el borde derecho, que es hacia donde se va, no desde donde se arrastra.
>
> **Y hay una ganancia de diseño, no solo de seguridad**: el primer elemento del carril queda alineado con el `h1`, con el `h2` y con la rejilla. Eso es lo que hace que la estantería se lea **como parte de la página** y no como un widget pegado encima.
>
> **Esto corrige el número de T4 §5.2**, según la frontera de §0.1: el requisito de comportamiento manda, la geometría se recalcula. **T22 lo verifica en teléfono real, iOS y Android.**

Del resto de la forma del carril de T4 se adopta todo: `overscroll-behavior-x: contain` y **ningún `touch-action`** (el fallo de atrapar el scroll vertical viene de gestos propios en JS; con scroll nativo el navegador reparte el gesto solo) · `scroll-snap-type: x proximity`, no `mandatory`, que pelea con el momento · **`scroll-padding-inline-start` igual al relleno**, sin el cual la tarjeta anclada queda pegada al borde · `padding-block: var(--space-1)` para que el `overflow` no recorte el anillo de foco —es la diferencia entre un carril navegable con teclado y uno que parece que no lo es— · `scrollbar-width: none` · **sin `backdrop-filter`** (es una fila de lista: prohibición dura) · **sin `tabIndex` en el contenedor**, porque cada tarjeta es un enlace y el navegador desplaza la fila al enfocar; añadirlo metería una parada estéril antes de cada estantería.

**Las tarjetas de estantería NO llevan `view-transition-name`.** Si un comercio sale en la estantería y en la rejilla, dos elementos compartirían nombre en el mismo documento y la transición se rompe **sin avisar**. El nombre lo lleva **solo la tarjeta de la rejilla**; tocar una de estantería degrada a fundido, que es aceptable —y que, por §2.6b, es además lo que ocurre en Safari ≤17 en todos los casos—. El nombre concreto lo fija T6.

### 4.5 La tarjeta de la rejilla

De arriba abajo: **cabecera** (placa 72×48 + `h3` con el nombre + nombre de la marca en `--t-caption`/`--text-3` si existe) · **descripción**, dos líneas con `-webkit-line-clamp` (ya existe, y su comentario explica bien por qué: una descripción larga desalinearía lo que de verdad se compara) · **ciudades** con el pin · **divisoria + bloque de beneficio**, anclado al fondo con `margin-top: auto` (ya existe).

**La línea de ciudades se pinta solo si el catálogo tiene dos o más ciudades distintas, o si este comercio está en más de una.** Repetir «Bogotá» en las cuatro tarjetas no informa de nada. Es la misma regla del umbral de dos que gobierna los filtros, aplicada a la tarjeta.

**La tarjeta entera es un enlace** a `/miembros/comercios/[id]`, sobre `Card interactive`, que ya trae su `:focus-visible` propio (`card.module.css:54-80`). El `h3` **no** se envuelve en un segundo enlace: un enlace dentro de otro es marcado inválido y el lector lo anuncia dos veces.

**Tope de promociones en la tarjeta: dos.** Si hay más, la segunda línea la sustituye «**+N beneficios más**» en `--t-caption`. Mantiene comparables las alturas —que es el propósito de la divisoria— y **le da a la ficha una razón de existir** ya desde el catálogo.

### 4.6 La tarjeta sin beneficio vigente — el caso frecuente

Con D14 arreglado, **la mayoría de las tarjetas no tiene promoción que mostrar**. Hoy son las cuatro. No es una excepción que se cubre con una disculpa: es **el aspecto habitual del catálogo**, y tiene que verse terminado.

**La divisoria se queda.** El comentario de `comercio-card.module.css:64-66` tiene razón —las promociones deben caer a la misma altura en todas las tarjetas para poder compararse— y `.sinPromociones` ya reserva ese alto con `margin-top: auto` y el mismo `border-top`. **La alineación no se sacrifica.** Lo que cambia es qué ocupa el espacio.

| Caso | Bloque inferior |
|---|---|
| 1+ vigentes | Hasta 2 líneas «título … `Badge gold`», más «+N beneficios más» si sobran |
| 0 vigentes, **con** categoría conocida | La **categoría** a la izquierda en `--t-caption`/`--text-3`, y «Sin beneficio vigente hoy» a la derecha, mismo tono |
| 0 vigentes, **sin** categoría (hoy) | «Sin beneficio vigente hoy», `--t-caption`, `--text-3`, a la izquierda |

**Por qué ese copy**: «Sin beneficio vigente hoy» es exactamente lo que ocurre, y «hoy» lo enmarca como temporal, no como catálogo roto. **No se escribe «pregunta en el local» ni «consulta tu beneficio»**: la caja **rechaza** una promoción no vigente (`comercios/(portal)/actions.ts:149`), y prometer lo que el sistema deniega delante del cliente es el defecto que D14 vino a cerrar — no se reintroduce por la puerta del copy. **Sin icono ni color de aviso**: un triángulo ámbar convertiría una situación normal en una alarma.

**Cómo se evita confundirlo con un beneficio**: un beneficio es una `Badge tone="gold"` a la derecha con una cifra dentro; esta línea es texto plano, sin píldora, sin oro, en `--text-3` y a `--t-caption`. Cuatro diferencias a la vez: forma, color, peso y tamaño.

**Y una defensa del conjunto**: cuando la mayoría está en este estado, lo que sostiene la pantalla no es la tarjeta, es el resto del catálogo —encabezado, búsqueda, logos bien presentados y nombres—. Por eso §2.3 importa aquí más que en ningún otro sitio: **cuando no hay cifra que enseñar, lo único que queda es lo bien hecho que esté el resto.**

### 4.7 Layout — tableta (560 ≤ `contenido` < 900)

Rejilla a **dos columnas** (a 720px caben dos de 348px). Encabezado, búsqueda y chips a ancho completo. Las estanterías muestran ~3,5 tarjetas. **Hereda de móvil en todo lo que es cromo**: por debajo de 768px de viewport sigue habiendo barra inferior, y es correcto — una tableta en vertical se sostiene con las dos manos y el pulgar llega abajo, no arriba.

### 4.8 Layout — escritorio (`contenido` ≥ 900)

**No es la columna del móvil estirada. Cambian tres cosas:**

1. **Rejilla a tres columnas.** A 1052px, `Grid min="290px"` da tres de ~340px. Una cuarta dejaría 250px por tarjeta y el nombre empezaría a truncarse.
2. **Búsqueda y «Más filtros» en una sola fila**: campo a la izquierda (flexible), desplegables a la derecha (ancho fijo). Es lo que ya hace `filtros-form.module.css` con `--columnas`. Con los datos de hoy solo hay campo, y ahí hay decisión: **se topa a 420px y se alinea a la izquierda.** Un `<input>` de 1052px para escribir «pizza» es la señal más barata de que nadie diseñó esta pantalla.
3. **Hover sobre la tarjeta**: eleva la sombra y la placa gana un filo. **Nada aparece en hover que no estuviera antes**: no se revelan botones ocultos, porque entonces la versión táctil perdería funcionalidad. El hover refuerza, no añade.

**Lo que NO se hace, y por qué**: **sin panel lateral de filtros** —con dos desplegables como máximo, un carril permanente de 280px robaría una columna de tarjetas para mostrar dos controles; se reevalúa cuando haya categorías, ciudades y marcas de verdad—; **sin vista de detalle en paralelo** —patrón bueno para inspeccionar muchos elementos parecidos, pero la ficha se consulta una vez, justo antes de entrar al local, y casi siempre desde el teléfono; un split view desdoblaría la ficha en dos versiones y duplicaría sus estados sin ganar un clic—; **sin tabla de muchas columnas** —`DataList` sustituye a toda tabla en este producto, pero un catálogo de aliados no es una tabla: se compara la marca y el beneficio, no ocho campos alineados—.

### 4.9 Los ocho estados

**Primera vez** — se muestra el estado de éxito, sin capa de bienvenida. **No hay onboarding, ni tour, ni tarjeta de «empieza aquí»**: el lede ya dice lo único que hay que saber y está en pantalla en **cada** visita, no solo en la primera. Un modal de bienvenida es un clic de más para todos, contra la regla nº1.

**Carga** — `(portal)/loading.tsx`, que **ya existe y está bien construido**: replica el layout real tomando las clases de los propios componentes que sustituye, en vez de recrear su geometría. Esqueleto, no spinner. **Hay que actualizarlo al layout nuevo**: overline, sin desplegable «Comercio», chips si procede, y **placa 72×48 con su radio** en vez del cuadrado de 44 —si el esqueleto dibuja un cuadrado y llega un rectángulo, el relevo salta—. `Skeleton` ya lleva `data-motion-esencial`, así que **el barrido sigue vivo bajo `prefers-reduced-motion`**: un esqueleto congelado se lee como contenido roto. El bloque va `aria-hidden` con un `role="status"` fuera que anuncia «Cargando los comercios…».

**Carga parcial** — **no se introduce.** Las consultas van en un `Promise.all`; partirlas en `<Suspense>` crearía cascadas de red para ganar décimas en el encabezado. Donde sí se usa es en la ficha (§5.7).

**Éxito** — encabezado, búsqueda, chips (si procede), estanterías (si superan umbral y no hay filtros), `h2` «Todos los comercios» y rejilla.

**Vacío inicial** — no hay filtros y el catálogo devuelve cero. `EmptyState` con icono de tienda: **ya existe, está verificado y el plan lo declara fuera de alcance, no se rehace.** Copy: «Aún no hay comercios» / «Estamos sumando aliados al club. Vuelve pronto.» **Sin acciones**: no hay nada que el socio pueda hacer, y ofrecerle un botón sería fingir que sí.

**Vacío tras filtro** — hay `q`, `categoria_id`, `marca_id` o `ciudad_id` y el resultado es cero. **Es un estado distinto y no comparte copy.** La fila de chips **sigue visible encima**: el socio debe poder cambiar de categoría sin dar marcha atrás. Tres variantes, porque decir siempre lo mismo desperdicia la única información útil que tenemos:

| Situación | Título | Descripción |
|---|---|---|
| Solo texto | Sin resultados para «{término}» | Prueba con menos palabras, o revisa las categorías. |
| Solo categoría | Nada en {Categoría}, por ahora | Todavía no hay aliados en esta categoría. Están en camino. |
| Texto + filtros | Sin resultados | Ningún comercio coincide con lo que buscas y los filtros aplicados. |

Acción primaria: «Ver todos los comercios» → `/miembros` (limpia todo). Acción secundaria **solo en el tercer caso**: «Quitar los filtros», que conserva `q` y borra el resto — es lo que el usuario suele querer: no ha fallado su palabra, ha fallado la combinación.

**Error** — `miembros/error.tsx`, que **ya existe** y pone su propio marco porque la frontera sustituye al layout del portal. Dos salidas reales: «Reintentar» (`reset()`, sin recargar ni perder la sesión) y «Volver al catálogo». **Hueco conocido que esta spec nombra**: las consultas desestructuran solo `data` e ignoran `error` (`API-CONTRACT.md` §3), así que **un fallo de lectura no lanza: devuelve cero filas y el socio ve el vacío inicial**. Le estamos diciendo «aún no hay comercios» a alguien cuyo catálogo sí existe. Está en §13-B6.

**Sin permiso** — (a) sin sesión o cuenta inactiva → `/miembros/login`; (b) rol distinto → `?error=sin_permiso`; (c) miembro sin membresía vigente → `/miembros/inactiva`. Las tres son redirecciones **antes** de pintar, y es lo correcto: una pantalla de «no tienes permiso» con el catálogo difuminado detrás enseña exactamente lo que se está negando.

**Sin conexión** — §8.3. **No hay catálogo cacheado**, y es deliberado: el SW **nunca** guarda HTML autenticado ni respuestas de Supabase (`sw.js:16-17`). Un catálogo desde caché podría anunciar una promoción que caducó ayer, que es el defecto que este plan cerró.

### 4.10 Interacciones

| Elemento | Trigger | Resultado | Feedback |
|---|---|---|---|
| Búsqueda | `Enter` | `?q=…` conservando filtros | Esqueleto |
| Chip | `click` | `?categoria_id=…` conservando `q` | Se rellena en tinta + check; esqueleto |
| Chip activo | `click` | Navega sin `categoria_id` | Se vacía |
| «Todas» | `click` | Quita `categoria_id`, conserva `q` | — |
| «Más filtros» | `click` | Abre el `<details>` | El triángulo gira; **sin animación de altura** |
| «Filtrar» / «Limpiar» | `click` | Envía / `/miembros` | Botón en `loading` |
| Tarjeta | `click` / `Enter` | Abre la ficha | Feedback en `pointerdown`, no en `click`. Transición compartida si T6 la aprueba y el navegador la soporta |
| Tarjeta | `hover` (escritorio) | Eleva sombra, filo en la placa | Solo refuerzo |
| Chips y estanterías | Arrastre horizontal | Desplaza | Scroll nativo con snap. **No captura el desplazamiento vertical ni invade la banda del gesto de atrás** |

### 4.11 Navegación y URL

URL `/miembros`. Parámetros: `q`, `categoria_id`, `marca_id`, `ciudad_id`. **`comercio_id` se retira con su desplegable**; si llega en una URL antigua se ignora sin error. Normalización con `primero()`, porque Next entrega `string[]` si el parámetro se repite — **este archivo es el único de seis que lo hace bien: no se pierda**. Atrás desde la ficha vuelve **con los filtros y el scroll**, porque están en la URL. Todo sobrevive a un refresco y es compartible: un socio puede pasarle a otro `/miembros?categoria_id=3`.

---

## 5. PANTALLA 3 — Ficha de comercio (`/miembros/comercios/[id]`) · RUTA NUEVA

### 5.1 Objetivo del usuario

Está a punto de entrar al local, o lo está considerando. Necesita, en este orden: **qué me descuentan**, **dónde queda**, **cómo lo cobro**. Ese orden manda sobre el layout entero.

### 5.2 Por qué es una página y no un overlay

`CLAUDE.md` dice que un formulario no navega. **La ficha no es un formulario**: es contenido, y en el idioma de Apple el contenido se **empuja**; la hoja es para tareas. Además, un overlay exigiría una ranura `@modal` nueva en `/miembros`, y la norma es explícita: la ranura vive en `app/admin/layout.tsx`, **solo ahí**. Es la ruptura que más fácil se cuela por reflejo y **no aplica**.

### 5.3 Layout — móvil (375×667)

```
┌────────────────────────────────────────┐
│  ORUM                             (A)  │ cabecera
├────────────────────────────────────────┤
│  ‹ Comercios                        ①  │ BARRA DE VUELTA, pegajosa (D-b)
├────────────────────────────────────────┤
│  ┌────────┐                            │
│  │ ▭▭▭▭▭▭ │  Casa Duarte           ②   │ placa 144×96 + h1 --t-title-1
│  │ ▭▭▭▭▭▭ │  Grupo Duarte          ③   │ marca --t-footnote
│  └────────┘                            │
│  (Gastronomía)   📍 Bogotá         ④   │
│  Cocina de autor en el centro de la ⑤  │ descripción --t-body, completa
│  ciudad, con carta de temporada.       │
│  Tus beneficios                     ⑥  │ h2 --t-title-2
│  ┌──────────────────────────────────┐  │
│  │ Almuerzo ejecutivo   h3    (2x1) │  │
│  │ De lunes a viernes, 12 a 3 pm.   │  │
│  │ Postre de la casa    h3   (-20%) │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │ ⑦ ACCIÓN PRINCIPAL
│  │       Mostrar mi carnet          │  │   variant="brand"
│  └──────────────────────────────────┘  │
│  Dónde usarlo                       ⑧  │ h2
│  ┌──────────────────────────────────┐  │
│  │ Sede Chapinero              h3   │  │
│  │ Calle 63 #11-20 · Bogotá         │  │
│  │ 601 555 0100                     │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│    ⌂ Inicio          ☺ Mi perfil       │ «Inicio» activo (D6)
└────────────────────────────────────────┘
```

**«Mostrar mi carnet» va inmediatamente después de los beneficios y antes de las sedes.** El socio lee lo que le descuentan y, en ese momento exacto, tiene delante el botón que lo hace efectivo. Al final de la página quedaría escondido tras la lista de sucursales; arriba llegaría antes de que sepa si le interesa. Es la **única acción primaria** de la pantalla: la vuelta es terciaria y las sedes no son accionables.

### 5.4 ▲ D-b · La vuelta: anclada al cromo, y preserva los filtros

**El camino normal es el gesto atrás del sistema**, que conserva filtros y scroll gratis porque están en la URL. La barra de vuelta es la salida para quien llega por enlace directo o pierde el gesto.

> **La vuelta no es un enlace dentro del contenido: es una barra pegajosa propia de la ficha, `position: sticky` justo bajo la cabecera, con fondo sólido `--surface` y su hairline inferior.** Nunca se desplaza fuera de la vista, que es la convención de la vista empujada de iOS.

**Por qué sticky y no dentro de la cabecera del portal**: meter la vuelta en la cabecera obligaría a un componente de cliente con `useSearchParams()` para leer `?volver`, lo que arrastra una frontera de `Suspense` al cromo entero. La barra propia se renderiza **en el servidor**, dentro de la página, donde los `searchParams` ya están disponibles. **Y no lleva `backdrop-filter`**: apilar dos capas de material es caro en gama media, y con fondo sólido la regla de `CLAUDE.md` ni siquiera entra en juego.

**Preservar los filtros sin backend**: el enlace de cada tarjeta lleva la búsqueda actual codificada —`/miembros/comercios/12?volver=%2Fmiembros%3Fcategoria_id%3D3`— y la ficha construye el `href` con ese valor. **Se valida con una función pura** que solo acepta cadenas que empiecen por `/miembros?` o sean exactamente `/miembros`; cualquier otra cosa cae a `/miembros`. Un parámetro de URL es entrada no confiable y sin esa guarda es una **redirección abierta**. La función es pura y de tres ramas: **testeable, y va al lote de `qa-tester`**.

**Etiqueta: «Comercios», no «Volver».** Es el destino, que es lo que la convención de Apple pone en un botón de retroceso, y no promete «volver a tus resultados» cuando puede que no haya resultados a los que volver.

### 5.5 Layout — tableta

Una columna como en móvil, con la ficha topada a **700px y alineada a la izquierda**, no centrada: los bloques de más de ~75 caracteres por línea se leen peor, y la alineación izquierda mantiene la relación con la barra de vuelta. Las sedes pasan a dos columnas con tres o más.

### 5.6 Layout — escritorio (`contenido` ≥ 900): dos columnas reales

```
‹ Comercios                                        (barra pegajosa, ancho completo)
┌──────────────────────────────────────┐  ┌────────────────────┐
│ ┌──────┐ Casa Duarte                 │  │ Dónde usarlo       │
│ │ ▭▭▭▭ │ Grupo Duarte                │  │ ┌────────────────┐ │
│ └──────┘ (Gastronomía) 📍 Bogotá     │  │ │ Sede Chapinero │ │
│ Cocina de autor en el centro …       │  │ └────────────────┘ │
│ Tus beneficios                       │  │ ┌────────────────┐ │
│ ┌──────────────────────────────────┐ │  │ │ Sede Usaquén   │ │
│ │ Almuerzo ejecutivo        (2x1)  │ │  │ └────────────────┘ │
│ │ Postre de la casa        (-20%)  │ │  │ ┌────────────────┐ │
│ └──────────────────────────────────┘ │  │ │ Mostrar mi     │ │
└──────────────────────────────────────┘  │ │ carnet         │ │
        columna principal, 1fr            │ └────────────────┘ │
                                          └────────────────────┘
                                             carril 320px, pegajoso
```

- **Columna principal (1fr)**: hero, categoría, descripción y beneficios. **Carril derecho (320px, pegajoso)**: sedes y, al fondo, la acción principal, que así queda a la vista mientras el socio recorre los beneficios sin que nada le persiga.
- **A 1052px**: 320 + 32 de hueco = **700px** para la columna principal. Es el ancho de lectura correcto, no un texto de 1052px.
- **El orden visual cambia, el del DOM no.** El carril se coloca con `grid-column`/`grid-row`, de modo que lectura y tabulación siguen siendo beneficios → acción → sedes. Un lector de pantalla y un teclado recorren la ficha en el orden de importancia, no en el de las columnas.

### 5.7 Los ocho estados

**Primera vez** — no aplica: la ficha no tiene concepto de primera visita.

**Carga** — **necesita su propio `comercios/[id]/loading.tsx`**; sin él, Next cae al del catálogo y **dibuja el esqueleto de la rejilla dentro de la ficha** —el mismo error que la norma documenta para la ranura `@modal`—. Esqueleto con la silueta real: placa 144×96 con su radio, dos líneas de título, chip, tres líneas de descripción, cabecera «Tus beneficios» y dos filas. `role="status"`: «Cargando el comercio…».

**Carga parcial** — **aquí sí, y es donde aporta.** El hero sale de una consulta rápida por `id`; beneficios y sedes son dos consultas más, **en `Promise.all` entre ellas**. El hero se pinta de inmediato; «Tus beneficios» y «Dónde usarlo» llegan dentro de sus propios `<Suspense>`, cada uno con su esqueleto de dos filas. Aquí el hero es lo que confirma «estoy en el sitio correcto», y confirmarlo 200ms antes es una ganancia real; en el catálogo no hay hero equivalente. **Lo que no se acepta es convertir esto en tres esperas encadenadas.**

**Éxito** — el comercio existe, está activo y sin `deleted_at`.

**Vacío — son cinco, no uno:**

| # | Qué falta | Qué se muestra | Copy |
|---|---|---|---|
| V1 | Sin promociones vigentes | «Tus beneficios» **conserva su `h2`** y contiene un bloque de estado sobre `Card variant="sunk"`, no un hueco | «Sin beneficios vigentes hoy» · «Este aliado no tiene ningún beneficio publicado en este momento. En cuanto lo tenga, aparecerá aquí.» · acción secundaria «Ver otros comercios» |
| V2 | Sin sucursales | «Dónde usarlo» con un texto breve y salida | «Este aliado todavía no ha publicado sus sedes. Escríbenos por WhatsApp y te decimos dónde encontrarlo.» + «Escribir a soporte» |
| V3 | Sin descripción | El bloque **no se renderiza** y no deja hueco | — (un «Sin descripción» de relleno sería peor que el silencio) |
| V4 | Sin logo propio, con logo de marca | La placa muestra el de la marca, indistinguible de uno propio; el nombre de la marca bajo el `h1` es lo que lo explica | — |
| V5 | Sin ninguno de los dos | La inicial sobre la placa, `aria-hidden` | — |

**Y el sexto, que es error y no vacío**: **logo roto** → la inicial por la vía del `alt` estilado (§2.3e). **Nunca el icono de rotura.**

**Una ficha sin beneficios y sin sedes** es un comercio del que solo sabemos el nombre. Sigue siendo una pantalla válida —hero, categoría, vuelta— y **no se convierte en un error**: el comercio existe y está activo. Lo que no puede pasar es que parezca a medio cargar; por eso las dos secciones conservan su `h2` y su bloque de estado.

**Error** — recuperable: `miembros/error.tsx`, con reintento y salida. **Fatal —no existe, inactivo o borrado—: `notFound()`**, y aquí hay decisión de producto:

> El `not-found` de la ficha **se ve como el portal, no como un 404 del sistema**. Título «Este comercio ya no está disponible» · cuerpo «Puede que haya salido del club o que el enlace esté mal. Vuelve al catálogo y busca otro.» · acción «Ver todos los comercios».
> **No se dice si el id existe o no.** Un mensaje que distinga «no existe» de «está inactivo» permite enumerar comercios inactivos probando ids. **Los tres casos dan exactamente la misma pantalla.**

**Sin permiso** — `requireMiembroVigente()` al entrar, **sin excepción**: un socio con la membresía vencida no puede ver la ficha de un beneficio que no puede usar. `createClient()`, **nunca** `createAdminClient()`.

**Sin conexión** — §8.3. No hay ficha cacheada, y es correcto.

### 5.8 Interacciones

| Elemento | Trigger | Resultado | Feedback |
|---|---|---|---|
| «‹ Comercios» | `click` | Catálogo con los filtros de `?volver` | Navegación normal |
| Gesto atrás | Deslizar / botón atrás | Vuelve con filtros y scroll | Nativo |
| «Mostrar mi carnet» | `click` | `/miembros/perfil` | Feedback en `pointerdown`; el botón entra en estado pendiente |
| Teléfono de una sede | `click` | `tel:` abre el marcador | El número es enlace y se conserva legible |
| «Ver otros comercios» / soporte | `click` | `/miembros` / WhatsApp | — |

> **▲ D-c · El indicador de pestaña al tocar «Mostrar mi carnet».** El destino es una pestaña, así que la barra inferior tiene que reaccionar. **El indicador se mueve de «Inicio» a «Mi perfil» cuando la navegación se confirma, no al tocar.** Durante la espera, el feedback lo da el propio botón y el esqueleto de la ruta. Un indicador que se adelanta miente sobre dónde estás y, si la navegación falla, tiene que volver — dos movimientos donde debería haber uno.

### 5.9 Navegación y URL

URL `/miembros/comercios/[id]` con `id` numérico. Parámetro `volver`, opcional y validado. `metadata.title`: `{Nombre del comercio} · ORUM`. Atrás vuelve al catálogo —es navegación push, no hay nada que cerrar—. **El enlace directo debe funcionar**: un socio puede pasárselo a otro. No hay estado de cliente, así que todo sobrevive a un refresco.

---

## 6. PANTALLA 4 — Carnet (`/miembros/perfil`)

### 6.1 Objetivo del usuario

Enseñarlo. En la caja, con una mano, con prisa, con el cajero mirando. Todo lo demás es secundario.

### 6.2 El problema que hay que resolver

Hoy el carnet se estira hasta `--content-max: 1100px` con `grid-template-columns: 1fr auto` (`perfil.module.css:31`), lo que produce en escritorio **un hueco muerto de varios cientos de píxeles** entre los datos y el QR. Un carnet de 1100px no es un carnet: es un formulario con un código al lado.

> **El carnet tiene ancho propio (`max-width: 460px`), se centra, y es una sola columna a todos los anchos.** La consulta de contenedor a 620px (`perfil.module.css:37-47,85-89`) **se elimina entera**: menos CSS, no más.

**Por qué una sola forma**: el carnet debe verse igual en el teléfono del socio y en la captura que alguien enseñe en un escritorio. Si cambia de forma según el ancho, deja de ser un objeto y vuelve a ser una caja de datos. Estrena `Card variant="brand"` y `--radius-xl`, la segunda y última superficie héroe del producto.

### 6.3 ▲ Layout — móvil, con la aritmética del peor caso (N7, N9)

**La v1 afirmaba que el carnet cabe sin desplazar y a la vez exigía soportar un plan a dos líneas. Las dos cosas no eran ciertas a la vez, y el número lo demuestra.**

**Además, N9**: `qr-code.module.css:13` rodea el QR de `--space-4` (16px). Con `size={200}` y un contenido de 8 dígitos —versión 1, 21 módulos, 9,5px por módulo— eso son **1,7 módulos de zona de silencio**, y la norma del código pide **4**. Es el mismo tipo de fallo que invertir el color: no rompe siempre, rompe **en la caja, delante del cliente**.

> **Requisitos del QR**, que mandan sobre el layout:
> 1. **Zona de silencio ≥4 módulos por lado.**
> 2. **Lado del QR ≥160px en pantalla.** Por debajo, un lector a un brazo de distancia empieza a fallar y el socio no sabe por qué.
> 3. **Se elige `size={160}` con relleno `--space-7` (32px)**: 160/21 = 7,6px por módulo, y 32/7,6 = **4,2 módulos**. Cumple los dos. A 160px sobre un iPhone de 375pt son ~2,5cm físicos, por encima del mínimo práctico de 2cm. **El valor exacto lo confirma T4**; el requisito es de comportamiento y lo fija esta spec.
> 4. **Mismo tamaño en todos los anchos**: el carnet es el mismo objeto en todas partes (§6.2).

**Aritmética a 375×667, peor caso (nombre de plan a dos líneas):**

| Bloque | Alto | Acum. |
|---|---|---|
| Cabecera (inset-top = 0 en navegador) | 56 | 56 |
| `.main` padding-top `--space-6` | 24 | 80 |
| `h1` «Mi carnet» `--t-display-2` | 27 | 107 |
| Lede `--t-footnote` | 19 | 126 |
| `--space-6` hasta el carnet | 24 | 150 |
| Relleno superior de `Card padding="lg"` | 32 | 182 |
| Wordmark del carnet `--t-caption` | 16 | 198 |
| `--space-5` | 20 | 218 |
| Nombre `--t-title-1` | 29 | 247 |
| **Plan `--t-callout` × 2 líneas (peor caso)** | 42 | 289 |
| `--space-6` | 24 | 313 |
| **QR: 160 + 2×32 de zona de silencio** | 224 | 537 |
| `--space-5` | 20 | 557 |
| Etiqueta NÚMERO `--t-overline` | 13 | 570 |
| Fila del número (alto táctil del botón de copiar) | 44 | **614** |
| *pliegue a 667* | | *quedan 53px* |
| `--space-5` + etiqueta ESTADO + fila | 57 | 671 ✗ |

> **Requisito duro, verificable**: a 375×667, **sin desplazar, deben verse el QR entero y el número de membresía completo**. Es el mínimo funcional: son las dos cosas que se enseñan en la caja. **Se cumple con 53px de holgura incluso en el peor caso.**
>
> **Objetivo, no requisito**: que quepan también estado y vigencia. Se consigue en el caso base y se pierde con un plan a dos líneas. **Es aceptable**: estado y vigencia son información de contexto, no de uso.
>
> **Lo que NO se hace para conseguirlo**: encoger el QR por debajo de su mínimo, recortar su zona de silencio, ni truncar el nombre del plan.
>
> **Si T4 o el implementador cambian cualquiera de estas alturas, se recalcula la tabla.** En PWA instalada la cabecera crece con `env(safe-area-inset-top)` y el viewport crece al desaparecer el cromo del navegador; el balance es aproximado y **lo verifica T22 en dispositivo real**.

```
 Mi carnet                          ① h1
 Muestra este código en la caja.    ②
 ┌──────────────────────────────┐
 │ ▔▔▔ filo dorado ▔▔▔▔▔▔▔▔▔▔▔▔ │   2px --gold-sheen (sin texto encima)
 │  ORUM                        │ ③ wordmark --t-caption
 │  Daniel Bulla Usaquén        │ ④ --t-title-1
 │  Plan Premium                │ ⑤ --t-callout, hasta 2 líneas
 │      ┌────────────────┐      │ ⑥ QR 160 + 32 de zona de silencio
 │      │ ▓░▓░░▓▓░▓▓░░▓ │      │   NEGRO SOBRE BLANCO EN LOS DOS TEMAS
 │      └────────────────┘      │
 │  NÚMERO DE MEMBRESÍA         │ ⑦ --t-overline
 │  0 0 0 1 2 3 4 5      [⧉]    │   mono, tabular, copiable
 │  ● Activa   Vence en 24 días │ ⑧ punto lleno + texto + ámbar secundario
 │  Hasta el 23 de sep. de 2026 │
 └──────────────────────────────┘
 Cómo usarlo                      ⑨ h2 — y es lo que llena la columna
 1. Busca el comercio…               lateral en escritorio
```

**Cambios de jerarquía respecto de hoy:**

1. **El QR sube.** Hoy va después de todos los datos. Es lo que se enseña: va justo bajo el nombre. En la caja, el socio abre la pantalla y el código ya está a la vista.
2. **El número baja pero se agranda**: es el respaldo cuando el lector falla. `--font-mono`, `tabular-nums`, tracking abierto, `--t-title-3`. **Se conserva tal cual, con su botón de copiar**, cuya área táctil se amplía con un `::after` de `var(--tap-min)` sin agrandar el botón.
3. **El wordmark entra en el carnet.** Una credencial sin el nombre de quien la emite no parece una credencial. Pequeño, arriba a la izquierda.
4. **«Cómo usarlo» es nuevo**: tres pasos, texto plano, sin iconos. Es la respuesta a la pregunta del socio nuevo **y** lo que ocupa la columna lateral en escritorio en lugar del hueco muerto.
5. **Estado y vigencia se funden en un bloque**, con la fecha como línea secundaria bajo el badge en vez de un `--t-overline` propio. Ahorra 33px y elimina una etiqueta redundante.

**Estado de la membresía** — derivado **siempre** con `derivarEstadoMembresia`, nunca `membresias.estado` en crudo. **Activa** → verde, punto **lleno**. **Inactiva** → rojo atenuado, punto **hueco** (la forma cambia, no solo el color) con el motivo en texto — *en la práctica no se ve aquí porque `requireMiembroVigente` desvía antes; se especifica porque `StatusBadge` lo soporta y porque una pantalla no puede depender de que su estado imposible sea imposible*. **«Vence en N días» no es un estado**: sigue activa, y es señal ámbar **secundaria** al lado, nunca sustituyendo al badge. **El oro no participa en nada de esto.**

**Fechas** — `fecha_fin` es `'YYYY-MM-DD'` **civil**: se construye con `Date.UTC(...)` y se formatea en `timeZone: 'UTC'`. Leerla en Bogotá la retrasa un día y **el carnet ya anunció una vez el vencimiento antes de tiempo**. El código actual lo hace bien (`perfil/page.tsx:18-29`): **no se «simplifica».**

### 6.4 Layout — tableta

Carnet centrado a 460px, «Cómo usarlo» debajo, también a 460px. Es el layout de móvil con más aire: nada que reorganizar en 700px mejora un objeto de 460.

### 6.5 Layout — escritorio (`contenido` ≥ 900): dos columnas, y resuelve el hueco muerto

```
Mi carnet
Muestra este código en la caja.
┌──────────────────────┐  ┌────────────────────────────┐
│                      │  │ Cómo usarlo                │
│  [ EL CARNET, 460 ]  │  │ 1. Busca el comercio…      │
│                      │  │ 2. Muestra este código…    │
│                      │  │ 3. El comercio aplica…     │
│                      │  │ ¿Algo no cuadra?           │
│                      │  │ [ Escríbenos por WhatsApp ]│
└──────────────────────┘  └────────────────────────────┘
      460px fijos               1fr, tope 380px

el conjunto se alinea a la IZQUIERDA del contenido: centrarlo dejaría
el mismo hueco de siempre, solo que repartido a los dos lados
```

**El carnet no crece. Nunca.** Lo que crece es lo que hay al lado, y es contenido real: los tres pasos y la salida de soporte, que en móvil vive en el menú y aquí gana una segunda puerta legítima porque el carnet es donde se descubre que algo va mal con la membresía. A 900px justos: 460 + 32 + 380 = 872, cabe; por debajo se apila.

### 6.6 Impresión

`@media print` ya existe (`perfil.module.css:121-126`) y **debe seguir funcionando**: se imprime **solo el carnet** —cabecera, barra inferior, `PageHeader` y «Cómo usarlo» a `display:none`—; el carnet pierde la sombra y gana un borde de 1px; **el QR se imprime negro sobre blanco**, que es lo que ya es; y el filo dorado se imprime en gris si el navegador no imprime fondos, **sin que ningún significado dependa de él**. A 160px el QR impreso mide ~4,2cm, de sobra.

### 6.7 Los ocho estados

**Primera vez** — el estado de éxito. «Cómo usarlo» está **siempre** presente, así que el onboarding es permanente y no cuesta un clic.

**Carga** — `perfil/loading.tsx`, que **ya existe**. Hay que corregirlo: **no es una tabla** y debe replicar la forma nueva —una columna, QR arriba—. **El hueco del QR se reserva a su tamaño exacto**: es el bloque más grande y, si aparece de golpe, todo lo de abajo salta.

**Carga parcial** — **no aplica.** Un carnet a medio pintar no es un carnet. **Matiz**: el nombre del plan sale de una segunda consulta y **no se aísla en un `<Suspense>`** — un carnet que dice «Daniel Bulla» y medio segundo después añade «Plan Premium» se lee como un fallo. Va en el mismo `Promise.all`.

**Éxito** — hay membresía vigente. Acciones: copiar el número, imprimir, navegar.

**Vacío** — no aplica: si no hay membresía vigente, `requireMiembroVigente` desvía a `/miembros/inactiva` **antes** de pintar.

**Error** — `miembros/error.tsx`. **Caso propio**: si `planes_membresia` no devuelve nada, el carnet muestra **«Membresía ORUM»** como respaldo; ya lo hace (`perfil/page.tsx:72`) y **se conserva** — un carnet con un hueco donde va el plan parece roto; con un nombre genérico, no. **`plan?.nombre` se mantiene y es correcto**: el producto **no** es binario (`planes_membresia` sostiene varios planes con precio y duración propios) aunque el estado sí lo sea; que el carnet de prueba diga «PREMIUM» no es un defecto. **Nombre de plan largo**: dos líneas con `text-wrap: balance`, sin truncar, verificado con 40 caracteres.

**Sin permiso** — redirección. La pantalla nunca se pinta sin derecho.

**Sin conexión** — **aquí duele más que en ninguna otra pantalla**: el socio está en la caja y sin señal. **Lo que ocurre hoy es correcto y no se cambia**: el SW sirve `/offline` y el carnet no está disponible, porque cachearlo significaría guardar HTML autenticado con el número dentro, y la regla de oro del SW lo prohíbe (`sw.js:16-17`). **Lo que sí se mejora es `/offline`** (§8.3), cuya nota al pie recuerda que se puede dictar el número — la caja acepta `metodo: 'numero'`. Esa nota convierte un callejón en una salida.

### 6.8 Interacciones

| Elemento | Trigger | Resultado | Feedback |
|---|---|---|---|
| Botón de copiar | `click` | Copia el número | El icono cambia a un check y vuelve solo. Lo hace `Copiar`, con `data-pulsable="sm"` |
| QR | — | No es interactivo | **No se abre a pantalla completa**: ya ocupa el tamaño que necesita y un paso más es un clic contra la regla nº1 |
| «Escríbenos por WhatsApp» (escritorio) | `click` | WhatsApp con mensaje predefinido | Sale de la app |

### 6.9 Navegación y URL

`/miembros/perfil`, sin parámetros. Atrás vuelve a donde estuviera. Sin estado de cliente: todo sobrevive a un refresco.

---

## 7. PANTALLA 5 — Membresía en pausa (`/miembros/inactiva`)

### 7.1 Objetivo del usuario

Entender por qué no puede entrar y **poder resolverlo ahora mismo**. El objetivo del negocio es que vuelva. Los dos apuntan al mismo sitio: una salida clara, sin culpa y sin fricción.

### 7.2 El giro de tono

Hoy dice «Tu membresía no está activa» y «No encontramos una membresía vigente asociada a tu cuenta»: correcto, y frío — describe un fallo de búsqueda en una base de datos.

**Cambia a «Tu membresía está en pausa».** «Pausa» es reversible; «no activa» es un veredicto. Y donde tengamos el dato, se dice **cuándo** venció: un dato concreto tranquiliza más que una frase amable.

### 7.3 ▲ Layout — móvil, y el cromo que se retira

```
┌────────────────────────────────────────┐
│  ORUM                             (A)  │ cabecera SIN navegación
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │              ⏸                   │  │ ① icono, decorativo
│  │  Tu membresía está en pausa      │  │ ② h1
│  │  Venció el 12 de mayo de 2026.   │  │ ③ el dato, cuando lo hay
│  │  Reactivarla toma un minuto y    │  │
│  │  vuelves a tener todos los       │  │
│  │  beneficios del club.            │  │
│  │  ┌────────────────────────────┐  │  │ ④ ACCIÓN PRINCIPAL
│  │  │  Reactivar mi membresía    │  │  │   variant="brand"
│  │  └────────────────────────────┘  │  │
│  │        Cerrar sesión             │  │ ⑤ terciaria, texto
│  └──────────────────────────────────┘  │
│ ░░ safe-area-inset-bottom heredado ░░░ │ ◀── D-e
└────────────────────────────────────────┘
```

**«Cerrar sesión» es nuevo y necesario.** Hoy la única salida es WhatsApp, que **sale de la aplicación**. Un socio que entró con la cuenta equivocada, o que ya pagó por otro canal y quiere volver a entrar, no puede hacerlo sin buscar el menú del avatar. El menú existe, pero pedirle que lo descubra en la pantalla que le acaba de dar una mala noticia es de mal diseño.

**La barra inferior y la navegación de cabecera se ocultan aquí.** Sus dos pestañas llevan a pantallas que van a rebotar a esta misma: un bucle visible. **Un control que no lleva a ninguna parte es peor que la ausencia del control.** El cromo se reduce al wordmark y al menú de cuenta.

> **▲ D-e · Al ocultar la barra inferior se hereda su zona segura.** `.main` reserva hoy el hueco de la barra con `padding-bottom: calc(var(--tabbar-h) + var(--space-8) + env(safe-area-inset-bottom))`. Si la barra desaparece y ese cálculo desaparece con ella, **el inset desaparece también** y el contenido se mete bajo el indicador de inicio. En esta ruta el relleno inferior pasa a `max(var(--space-10), env(safe-area-inset-bottom, 0px))`: sin hueco de barra, **con** zona segura.
>
> **Y esta pantalla es la razón por la que N3 es grave** (§2.4): con la barra oculta, el avatar es la **única** salida alcanzable. Si además queda bajo la barra de estado por falta de `padding-top`, la pantalla no tiene ninguna.

### 7.4 Copy por motivo

`derivarEstadoMembresia` distingue tres motivos y merecen tres textos. Hoy la pantalla no consulta la membresía: **para dar motivo y fecha hay que leerla en `inactiva/page.tsx`**, que es zona de trabajo. Sin esa lectura se usa la variante de respaldo.

| Motivo | Título | Cuerpo |
|---|---|---|
| `vencida` | Tu membresía está en pausa | Venció el {fecha}. Reactivarla toma un minuto y vuelves a tener todos los beneficios del club. |
| `cancelada` | Tu membresía está cancelada | Tu membresía se canceló el {fecha}. Si quieres volver al club, escríbenos y la activamos de nuevo. |
| `suspendida` | Tu membresía está suspendida | Tu membresía está suspendida por ahora. Escríbenos y revisamos qué pasó. |
| Sin dato | Tu membresía está en pausa | No encontramos una membresía vigente en tu cuenta. Escríbenos y lo resolvemos en un momento. |

**Ninguno culpa al socio**: no se escribe «no has pagado» ni «tu pago no se procesó». La fecha se formatea con la regla civil (`Date.UTC` + `timeZone:'UTC'`). Acción primaria en los cuatro casos: «Reactivar mi membresía» → WhatsApp. **En `suspendida` el botón dice «Escribir a soporte»**, porque «reactivar» no describe lo que va a pasar y el texto de un botón debe decir lo que hace.

### 7.5 Layout — tableta y escritorio

Tarjeta centrada, `max-width: 480px`. **Se justifica igual que el acceso**: es el mensaje de una decisión, no una superficie de trabajo. No hay contenido secundario que poner al lado que no sea inventado — y aquí, además, mostrarle un adelanto del catálogo sería enseñarle beneficios que no puede usar, que es la definición de una mala pantalla de bloqueo.

### 7.6 Los ocho estados

| Estado | Qué pasa |
|---|---|
| **Primera vez** | No aplica |
| **Carga** | Consulta corta (configuración + membresía). Si se nota, esqueleto de la tarjeta: icono, dos líneas, botón |
| **Carga parcial** | No aplica: es un mensaje |
| **Éxito** | El socio ve por qué no puede entrar y tiene salida |
| **Vacío** | No aplica |
| **Error** | `miembros/error.tsx`. **Y un respaldo propio**: si `configuracion` no tiene `whatsapp_soporte`, la pantalla **no puede quedarse sin salida** — la acción primaria pasa a «Cerrar sesión» y el cuerpo añade «Contacta al punto donde te inscribiste para reactivarla.» **Hoy, sin teléfono, esta pantalla no tiene ninguna acción: es un callejón, y se cierra aquí** |
| **Sin permiso** | `requireRolMiembro` (no `requireMiembroVigente`, que crearía un bucle de redirección). Sin sesión → login |
| **Sin conexión** | `/offline`, §8.3 |

### 7.7 Navegación y URL

`/miembros/inactiva`, sin parámetros. Atrás vuelve al login o a donde estuviera; **no hay bucle**, porque la pantalla usa `requireRolMiembro`, que no reenvía aquí. Sobrevive a un refresco.

---

## 8. PANTALLA 6 — Carga, error y sin conexión

Son las tres pantallas que nadie diseña y que definen si el producto se siente sólido.

### 8.1 Carga

**Esqueleto, no spinner.** Un spinner dice «espera»; un esqueleto dice «esto es lo que va a llegar». No hay en este portal ningún bloque cuya forma no se pueda anticipar.

| Ruta | Archivo | Estado |
|---|---|---|
| Catálogo | `(portal)/loading.tsx` | **Existe.** Actualizar al layout nuevo |
| Carnet | `perfil/loading.tsx` | **Existe.** Actualizar a una columna, QR arriba |
| Ficha | `comercios/[id]/loading.tsx` | **Falta.** Sin él, Next pinta el esqueleto de la rejilla dentro de la ficha |
| En pausa | — | Hereda del portal. Suficiente |

**Reglas para los tres**: (1) el esqueleto **toma las clases de los componentes que sustituye**, no recrea su geometría —el del catálogo ya lo hace y es el patrón a copiar—; (2) **`data-motion-esencial`**, para que el barrido siga vivo bajo `prefers-reduced-motion`; (3) el bloque va `aria-hidden` con un `role="status"` fuera; (4) **ningún esqueleto inventa cantidades que puedan desmentirse** — el del catálogo dibuja seis tarjetas porque son pantalla y media, y **su número de filtros hay que revisarlo cuando el desplegable «Comercio» desaparezca**, porque hoy dibuja dos y pasará a dibujar uno; (5) **la placa del logo del esqueleto es la placa real**, 72×48 con su radio, no un cuadrado de 44.

Copy de los `role="status"`: «Cargando los comercios…» · «Cargando el comercio…» · «Cargando tu carnet…»

### 8.2 Error

`miembros/error.tsx` **existe, está bien y se conserva**, con sus tres decisiones buenas: pone su propio marco (la frontera sustituye al layout, así que sin marco el mensaje saldría pegado al borde), no enseña el stack, y muestra el `digest` como referencia para buscarlo en los registros sin revelar nada interno.

**Lo que esta spec añade**: (1) **un `<h1>`** — `ErrorState` rinde su título como `h1` cuando actúa de frontera de ruta, vía la prop `titularNivel` que T4 §7.5 concede, con valor por defecto `h2` para no alterar el panel; (2) salida accesible por teclado, que ya lo es; (3) **el copy no cambia**: es bueno, no habla de «pantalla» ni de «administrador» y ofrece el siguiente paso.

| Elemento | Texto |
|---|---|
| Título (`h1`) | No pudimos cargar tus beneficios |
| Cuerpo | Puede ser algo pasajero de la conexión. Vuelve a intentarlo; si sigue igual, escríbenos por WhatsApp y lo resolvemos. |
| Detalle | Referencia: {digest} |
| Primaria / Secundaria | Reintentar / Volver al catálogo |

El `not-found` de la ficha es una pantalla distinta, con copy propio: §5.7.

### 8.3 Sin conexión

`/offline` existe, lo precarga el SW y comparte la dirección de arte del acceso. **Dos defectos, los dos de copy y destino:**

| Defecto | Hoy | Debe ser |
|---|---|---|
| El botón lleva al panel | `href="/admin"`: un socio acaba en el acceso administrativo con `?error=sin_permiso` | **Un botón que recarga la página actual.** «Reintentar» significa volver a pedir lo que se estaba pidiendo |
| El cuerpo habla de miembros en tercera persona | «los datos de los miembros necesitan conexión para consultarse» | Texto neutro, sin rol |

**El problema de fondo**: el SW sirve `/offline` para **cualquier** navegación fallida de los cuatro portales, y no puede saber quién es el usuario porque no hay conexión. Por eso **el destino correcto no es una ruta, es la recarga**.

| Elemento | Texto |
|---|---|
| Wordmark | ORUM |
| Título (`h1`) | Sin conexión |
| Cuerpo | No pudimos conectarnos. Revisa tu red y vuelve a intentarlo. |
| Acción primaria | Reintentar |
| Nota al pie | Tu carnet necesita conexión para mostrarse. Si estás en un comercio, puedes dictar tu número de membresía. |

**La nota al pie es la que salva el momento de verdad**: el socio está en la caja, sin señal, y la caja **sí** acepta el registro por número. Decirlo ahí convierte un callejón en una salida. Es cierto, es específico y no cuesta ninguna capacidad nueva.

### 8.4 ▲ N1 · La PWA instalada arranca en el acceso administrativo — sección nueva

**Verificado en el código**: `src/app/manifest.ts:16` declara `start_url: '/admin'`. Consecuencias, todas reales:

1. Un socio que instala la app **aterriza en el acceso de administración en cada arranque**, y como `display: 'standalone'` (`:20`) quita la barra del navegador, **no tiene forma de escribir otra dirección**. La app queda inservible para él.
2. Y no llega ahí por error de ruta: `/` hace `redirect('/admin')` sin mirar el rol (`app/page.tsx:8`), así que **cualquier camino corto lleva al mismo sitio**.
3. El manifiesto es además de panel en todo lo demás: la `description` (`:13-14`) dice «Panel de administración del club…», y los dos `shortcuts` (`:52-64`) son «Registrar miembro» y «Buscar miembro» — acciones de empleado, que el socio verá al mantener pulsado el icono.

**Es el mismo defecto que el botón de `/offline`, un nivel más arriba.** Yo lo detecté en la salida; aquí está en la entrada.

> **No lo puede resolver el diseño solo.** Un manifiesto no admite dos `start_url`, y un `start_url` correcto exige que `/` enrute por rol. **Es decisión de producto y se escala a `tech-lead`**, junto al punto 13 de «Fuera de alcance» del plan, que ya identificó `app/page.tsx` como pendiente.
>
> **Camino recomendado**: `start_url: '/'`, y que `/` decida por sesión —miembro → `/miembros`, comercio → `/comercios`, empleado o admin → `/admin`, sin sesión → una elección de portal o el acceso de miembros, que es el rol más numeroso—. Es un cambio pequeño con implicaciones de sesión, y por eso no se hace desde aquí.
>
> **Lo que sí puede hacerse sin decidir nada de eso, y conviene**: que `description` y `shortcuts` dejen de describir el panel. Si el socio va a instalar la app, el mínimo honesto es un texto de club.
>
> **Mientras no se resuelva**, la spec lo registra como el **primer punto de abandono del recorrido** (§1): un socio que instala la app y ve «Portal de Administración» concluye que se equivocó de aplicación, y esa conclusión ocurre **antes** de cualquier pantalla de este rediseño.

---

## 9. Copy completo

Todo el texto de interfaz de las seis pantallas. **No hay ningún `TODO`.**

### 9.1 Acceso

| Ubicación | Texto |
|---|---|
| Wordmark | ORUM |
| `h1` · `/login` | Administración |
| Apoyo · `/login` | Entra con tu correo y tu contraseña. |
| Pie · `/login` | ¿Problemas para entrar? Contacta al administrador del club. |
| `h1` · `/comercios/login` | Herramienta de comercios |
| Apoyo · `/comercios/login` | Entra con el correo de tu comercio. |
| Pie · `/comercios/login` | ¿Problemas para entrar? Escribe al administrador del club. |
| `h1` · `/miembros/login` | Portal de Miembros |
| Apoyo · `/miembros/login` | Entra con tu número de membresía. |
| Etiqueta / marcador | Número de membresía · `00012345` |
| Etiqueta | Contraseña |
| Ojo (oculta / visible) | Mostrar contraseña · Ocultar contraseña |
| Botón de envío | Iniciar sesión |
| Pie · `/miembros/login` | ¿No recuerdas tu número de membresía? Está en tu carnet o pídelo en el punto donde te inscribiste. |
| `h1` · `/activar-cuenta` | Activa tu cuenta |
| Apoyo · `/activar-cuenta` | Elige una contraseña y entra al club. |
| Estado «verificando» | Comprobando tu enlace… |
| Estado «inválido» | Este enlace no es válido o ya expiró. Pide uno nuevo a quien te invitó y vuelve a intentarlo. |
| Salida del «inválido» | Ir a iniciar sesión |
| Etiqueta / ayuda | Elige tu contraseña · Mínimo 8 caracteres. |
| Etiqueta | Confirma tu contraseña |
| Botón de envío | Activar cuenta |
| Error de campo | La contraseña debe tener al menos 8 caracteres. |
| Error de campo | Las contraseñas no coinciden. |
| Error global | No se pudo activar la cuenta. Vuelve a intentarlo. |

### 9.2 Catálogo

| Ubicación | Texto |
|---|---|
| Overline | TU MEMBRESÍA |
| `h1` | Beneficios del club |
| Lede | Muestra tu carnet en la caja y el comercio aplica tu beneficio. |
| Etiqueta / marcador de búsqueda | Buscar · Busca un comercio o un beneficio |
| Chip inicial | Todas |
| Disclosure | Más filtros |
| Etiqueta / opción vacía | Marca · Todas |
| Etiqueta / opción vacía | Ciudad · Todas |
| Botones | Filtrar · Limpiar |
| Estantería 1 | Nuevos en el club · Los últimos aliados que se sumaron |
| Estantería 2 | Beneficios del momento · Lo que puedes usar esta semana |
| `h2` de la rejilla | Todos los comercios |
| Tarjeta · sin beneficio | Sin beneficio vigente hoy |
| Tarjeta · más promociones | +{N} beneficios más |
| Vacío inicial | Aún no hay comercios · Estamos sumando aliados al club. Vuelve pronto. |
| Vacío por búsqueda | Sin resultados para «{término}» · Prueba con menos palabras, o revisa las categorías. |
| Vacío por categoría | Nada en {Categoría}, por ahora · Todavía no hay aliados en esta categoría. Están en camino. |
| Vacío combinado | Sin resultados · Ningún comercio coincide con lo que buscas y los filtros aplicados. |
| Acciones de vacío | Ver todos los comercios · Quitar los filtros |
| Carga (lector) | Cargando los comercios… |
| `metadata.title` | Comercios y beneficios · ORUM |

### 9.3 Ficha de comercio

| Ubicación | Texto |
|---|---|
| Vuelta | Comercios |
| `h1` / bajo el `h1` | {Nombre del comercio} · {Nombre de la marca} |
| `h2` | Tus beneficios |
| Sin beneficios | Sin beneficios vigentes hoy · Este aliado no tiene ningún beneficio publicado en este momento. En cuanto lo tenga, aparecerá aquí. |
| Sin beneficios · acción | Ver otros comercios |
| Acción principal | Mostrar mi carnet |
| `h2` | Dónde usarlo |
| Sin sedes | Este aliado todavía no ha publicado sus sedes. Escríbenos por WhatsApp y te decimos dónde encontrarlo. |
| Sin sedes · acción | Escribir a soporte |
| `not-found` | Este comercio ya no está disponible · Puede que haya salido del club o que el enlace esté mal. Vuelve al catálogo y busca otro. |
| `not-found` · acción | Ver todos los comercios |
| Carga (lector) | Cargando el comercio… |
| `metadata.title` | {Nombre del comercio} · ORUM |

### 9.4 Carnet

| Ubicación | Texto |
|---|---|
| `h1` / lede | Mi carnet · Muestra este código en la caja. |
| Wordmark del carnet | ORUM |
| Nombre del plan (respaldo) | Membresía ORUM |
| Etiqueta | NÚMERO DE MEMBRESÍA |
| Botón de copiar / confirmación | Copiar número de membresía · Copiado |
| Etiqueta / estado activo | ESTADO · Activa |
| Señal de vencimiento | Vence en {N} días |
| Vigencia | Hasta el {fecha} |
| `h2` | Cómo usarlo |
| Paso 1 | Busca el comercio en el catálogo. |
| Paso 2 | Muestra este código en la caja. |
| Paso 3 | El comercio aplica tu beneficio. |
| Escritorio | ¿Algo no cuadra? · Escríbenos por WhatsApp |
| QR (lector) | Código de la membresía {número} de {nombre} |
| Carga (lector) | Cargando tu carnet… |
| `metadata.title` | Mi carnet · ORUM |

### 9.5 Membresía en pausa

| Ubicación | Texto |
|---|---|
| `h1` · vencida / sin dato | Tu membresía está en pausa |
| Cuerpo · vencida | Venció el {fecha}. Reactivarla toma un minuto y vuelves a tener todos los beneficios del club. |
| `h1` / cuerpo · cancelada | Tu membresía está cancelada · Tu membresía se canceló el {fecha}. Si quieres volver al club, escríbenos y la activamos de nuevo. |
| `h1` / cuerpo · suspendida | Tu membresía está suspendida · Tu membresía está suspendida por ahora. Escríbenos y revisamos qué pasó. |
| Cuerpo · sin dato | No encontramos una membresía vigente en tu cuenta. Escríbenos y lo resolvemos en un momento. |
| Acción principal | Reactivar mi membresía |
| Acción principal · suspendida | Escribir a soporte |
| Mensaje de WhatsApp | Hola, quiero reactivar mi membresía ORUM. |
| Acción terciaria | Cerrar sesión |
| Sin teléfono de soporte | Contacta al punto donde te inscribiste para reactivarla. |
| `metadata.title` | Membresía en pausa · ORUM |

### 9.6 Cromo

| Ubicación | Texto |
|---|---|
| Wordmark (lector) | ORUM, ir al inicio |
| Pestañas | Inicio · Mi perfil |
| Disparador del menú (lector) | Mi cuenta |
| Grupo del menú / opciones | Tema · Claro · Oscuro · Automático |
| Elementos del menú | Soporte por WhatsApp · Cerrar sesión |
| Mensaje de soporte | Hola, necesito ayuda con mi membresía ORUM. |
| Navegación (lector) | Secciones del portal |

### 9.7 Error y sin conexión

Las tablas están en §8.2 y §8.3, junto a su justificación.

---

## 10. Casos límite

| Caso | Qué pasa | § |
|---|---|---|
| Nombre de comercio de 60+ caracteres | Tarjeta: una línea con `ellipsis`. Ficha: el `h1` **envuelve** hasta tres líneas, sin truncar — ahí el nombre es el contenido | 4.5, 5.3 |
| Nombre de plan larguísimo | Dos líneas con `text-wrap: balance`, sin truncar. Probado con 40 caracteres. **La aritmética del carnet lo contempla como peor caso** | 6.3 |
| Título de promoción larguísimo | Tarjeta: `ellipsis` a una línea, el `Badge` nunca se comprime. Ficha: envuelve a dos | 4.5 |
| Descripción larguísima | Tarjeta: dos líneas con `line-clamp`. Ficha: completa, sin límite | 4.5, 5.3 |
| Comercio con 20 promociones | Tarjeta: 2 + «+18 beneficios más». Ficha: todas | 4.5 |
| Comercio con 15 sucursales | Ficha: todas, dos columnas en escritorio. Sin paginar (no existe) | 5.3 |
| Cero comercios | Vacío inicial, ya resuelto | 4.9 |
| **Cero promociones en todo el catálogo (hoy)** | Todas las tarjetas en su estado sin beneficio; «Beneficios del momento» no se renderiza. **La pantalla sigue viéndose terminada** | 4.6 |
| **Cero categorías (hoy)** | La fila de chips no se renderiza y **no reserva hueco** | 4.3 |
| **Una sola ciudad (hoy)** | Ni desplegable «Ciudad» (umbral de 2) ni línea de ciudades en la tarjeta | 4.2, 4.5 |
| Más de 100 comercios | **El catálogo se trunca en silencio.** No hay forma honesta de decirlo sin `count` | 12, 13-B1 |
| `logo_url` con `http://` | Bloqueo por contenido mixto ⇒ no carga ⇒ **se ve la inicial**. La cadena lo cubre sin código extra | 2.3 |
| `logo_url` de 2 MB | Se descarga entero para pintarse a 72px. Sin `next/image` en esta iteración; lo mide T20 | 12 |
| Logo transparente oscuro en tema oscuro | Placa de fondo claro constante (RUP-6): se ve | 2.3c |
| **PWA instalada, primer arranque** | **Aterriza en el acceso administrativo.** N1, sin resolver desde el diseño | 8.4 |
| **Campo enfocado en iOS Safari** | **Sin salto de zoom**, porque ningún campo baja de 16px en puntero grueso | 3.3 |
| **Dispositivo con muesca, en horizontal** | Cabecera, contenido y barra respetan los insets laterales | 2.4 |
| **Arrastre iniciado en el borde de la pantalla** | Dispara el gesto de atrás del sistema, **no el carril**: el carril no llega al borde inicial | 4.4 |
| Zoom de página al 200 % (Dynamic Type) | Todo envuelve; la barra inferior crece porque usa `min-height` (N4). Únicos altos fijos: placa y QR, que son objetos | 2.4 |
| Sesión expirada mientras navega | La siguiente navegación redirige al acceso. **Sin aviso previo**: no hay canal para saberlo | 12 |
| **La membresía vence mientras está dentro** | Va a `/miembros/inactiva`. **Y hay un defecto**: §11, punto 6 | 11 |
| Dos pestañas, cierra sesión en una | La otra redirige en su siguiente navegación. Sin sincronización, y no se propone | 12 |
| **JavaScript desactivado** | Búsqueda, chips, filtros, envío y navegación **funcionan**: todo es `method="get"`, `<Link>` y `<details>`. Se pierden el ojo de la contraseña y el cambio de tema | 4.2 |
| `?categoria_id=abc` | `Number('abc')` da `NaN`, el filtro no se aplica y se ve el catálogo completo. **Entrada no confiable: la audita T21** | 4.11 |
| `?categoria_id=3&categoria_id=7` | `primero()` toma el primero. Ya resuelto, conservarlo | 4.11 |
| `?volver=https://otro-sitio.com` | Se descarta: solo cadenas que empiecen por `/miembros`. Función pura con test | 5.4 |
| Tema oscuro + `prefers-reduced-transparency` | Cabecera y barra se vuelven sólidas. Ya resuelto | 2.4 |
| `prefers-reduced-motion` | Sin sacudida, sin escalado de pestañas, **sin transición de vista** (§2.6a), **con** barrido de esqueleto y **con** feedback de color al tocar | 2.6, 8.1 |
| Safari ≤17 | No hay transición de elemento compartido. **Todo lo demás se ve igual** | 2.6b |
| Impresión del carnet | Solo el carnet; QR a ~4,2cm | 6.6 |
| Impresión del catálogo | No se especifica estilo de impresión: nadie imprime un catálogo | — |

---

## 11. Notas para el implementador

1. **Empieza por el acceso (T9) y para en T10.** Es una pantalla de dos campos que carga la dirección de arte completa: si la interpretación no es la del propietario, se descubre ahí y no tras seis pantallas.
2. **Ningún `@media` nuevo dentro de `<main>`**: todo consulta `@container contenido`. Un `@container` sin contenedor ancestro **nunca casa**; si escribes uno, comprueba que hay contenedor.
3. **Ningún formulario nuevo, ninguna ranura `@modal`.** La ficha es navegación push; «Más filtros» es un `<details>` dentro del `<form>` que ya existe.
4. **`ComercioLogo` sigue siendo Server Component si se puede** (§2.3e). El catálogo pinta hasta 100: convertirlo a cliente cuesta ~100 raíces de hidratación. Solo se paga si los tres navegadores rechazan el camino del `alt` estilado, y entonces se documenta cuál.
5. **Al retirar el desplegable «Comercio», revisa `(portal)/loading.tsx`.** Su comentario explica que dibuja dos campos porque hoy se renderizan dos; con el cambio, y con las categorías vacías, se renderiza **uno**. Un esqueleto que dibuja campos que no llegan produce un salto.
6. **🔴 Defecto que esta spec encuentra y no le corresponde arreglar.** `src/lib/miembros/requerir-miembro.ts:82` calcula hoy con `new Date().toISOString().slice(0,10)`, que es **UTC**, mientras que el carnet (`perfil/page.tsx:33`) y el catálogo (`hoyISO()`) lo calculan en **`America/Bogota`**. A partir de las **7 pm hora de Colombia del último día de vigencia**, la fecha UTC ya es la del día siguiente y `esMembresiaVigente` devuelve `false`: **el socio pierde el acceso cinco horas antes de tiempo, el último día que pagó, y a la hora en que más se usa un club de restaurantes.** No falla ruidosamente: redirige a `/miembros/inactiva`. Es la trampa de zona horaria que `CLAUDE.md` documenta. **`src/lib/miembros/` no es zona de trabajo de este plan y `SCOPE.md` §7 pide escalar los cambios sobre la derivación de estado: se escala a `tech-lead`, no se arregla aquí.**
7. **El `?volver=` de la ficha necesita su función pura de validación**, tres ramas, testeable, al lote de `qa-tester`. Sin ella es una redirección abierta.
8. **Estantería y rejilla no pueden compartir `view-transition-name`.** Si un comercio sale en las dos, el nombre se duplica en el documento y la transición se rompe sin avisar. Lo lleva **solo** la tarjeta de la rejilla. Y **la rama de `prefers-reduced-motion` es obligatoria** (§2.6a): el navegador no la aplica solo.
9. **`comercio-card.tsx:37` pasa de `h2` a `h3`, y su comentario se actualiza, no se borra.** La premisa que enuncia deja de ser cierta con el `h2` de la rejilla.
10. **Tras mover o añadir rutas, reinicia el servidor de desarrollo**: el manifiesto queda obsoleto y las rutas nuevas fallan en silencio, lo que parece un bug de código y no lo es.
11. **Verifica renderizado, no con `getComputedStyle`.** En una pestaña que el navegador no pinta, las transiciones no avanzan y siempre se lee el valor inicial: ya dio tres diagnósticos falsos seguidos. Una captura fuerza el pintado; una medición, no.
12. **Toda captura de DoD empieza por 375×667.** Después 1440. En ese orden.

---

## 12. Lo que no se puede ofrecer, y por qué

Verificado contra `database.types.ts` y `API-CONTRACT.md` §4. **Nada de esto se especifica como si existiera.**

| Lo que sería mejor | Por qué no entra | Qué se hace en su lugar |
|---|---|---|
| **Estantería «Destacados»** | **Ninguna de las 16 tablas tiene columna de destacado, orden ni prioridad.** Ordenar por `id` no es destacar, es «insertado antes» | «Nuevos en el club», desde `comercios.created_at`, que es un dato real. Un club que destaca al azar pierde justo la credibilidad que busca |
| **Icono o color por categoría** | `categorias` es solo `id, nombre` | Chips de texto, con check para el activo |
| **Paginación, «ver más», scroll infinito** | `.range(` no aparece ni una vez en `src/` | Nada. La lista es lo que cabe en `.limit(100)` |
| **Avisar de que el catálogo se truncó** | Sin `count: 'exact'` la interfaz **no sabe** si sobran filas. Avisar al llegar a 100 exactos también dispara con 100 comercios exactos, y anunciar «hay más» cuando no los hay es peor que callar | Nada, y §13-B1 sube de prioridad. Con 4 comercios no muerde; el día que el club supere los 100, parte de lo que el socio paga deja de mostrarse sin aviso |
| **Contador de resultados** | Sin `count`, el número sería «los que llegaron», no «los que hay» | Nada. Un número que puede mentir en la pantalla que debe generar confianza no vale los píxeles |
| **Ordenación elegible** | Los 30 `.order()` del repositorio son fijos; ninguno parametrizado | Alfabético en la rejilla, `created_at` desc en la estantería |
| **Filtro por «tiene beneficio»** | Exigiría filtrar vigencia en SQL; hoy se deriva en memoria **después** de traer las filas | Nada: sería un filtro sobre los 100 que ya llegaron |
| **Búsqueda insensible a acentos** | `ILIKE` con comodines sobre una columna, sin `to_tsvector` ni ranking | Buscar «Cafe» no encuentra «Café». Se acepta y se anota |
| **Historial de beneficios usados** | No hay página ni acción sobre `ventas` fuera de `/admin/metricas`. **Es lo que convertiría un catálogo en un club** | Nada. §13-B3 |
| **Toasts** | `ToastProvider` se monta solo en `AppShell`; `useToast()` **lanza** fuera de `/admin` | El feedback va en el propio control: el botón de copiar cambia a un check, el chip se rellena |
| **Avisar de que la sesión va a expirar** | Sin tiempo real, sin canal y sin toasts | Nada. La siguiente navegación redirige |
| **Notificar «vence en 7 días»** | Solo hay correo saliente para la invitación; no hay bandeja, push ni centro de avisos | La señal ámbar del carnet, que solo se ve si el socio entra |
| **Nombre del socio en la cabecera** | `perfiles` **no guarda nombre**; el shell usa el correo y de ahí saca la inicial | El correo en el menú, y el nombre completo **en el carnet**, que sí lo tiene |
| **Optimización de imágenes** | `next/image` exige `remotePatterns`, y cubrir hosts arbitrarios pediría `hostname: '**'`, que convierte la app en un **proxy de optimización abierto** | `<img>` con `loading="lazy"` y la placa bien construida. §13-B4 |
| **Alojar los logos** | Los dos `logo_url` son texto que apunta a hosts de terceros. **No hay Storage ni un solo `input type="file"` en el repositorio** | La cadena comercio → marca → inicial: ningún logo se ve roto **hoy**. Resuelve el síntoma, no la causa |
| **Errores atados a su campo en el acceso** | Las acciones devuelven una cadena en español sin decir qué campo falló | Banner global. **Excepción**: en `/activar-cuenta` los dos errores de contraseña son de cliente y sí van al campo |
| **`start_url` correcto para el socio** | Un manifiesto no admite dos, y exige que `/` enrute por rol | Nada desde el diseño. **Se escala** (§8.4) |

---

## 13. PROPUESTAS PARA BACKEND

Lo que esta spec **habría diseñado** si el dato existiera, con la alternativa que se implementa entretanto.

**B1 · Paginación con total en el catálogo — prioridad alta.** Que acepte página y tamaño y devuelva el total; `count: 'exact', head: true` ya se usa en `src/app/admin/page.tsx:42`. Desbloquea un pie honesto («12 comercios»), un aviso real cuando la lista se corta, y que el filtro por categoría no mienta —si una categoría tiene 120, el socio ve 100 y cree que son todos—. **Entretanto: nada**, y se dice así. No se pone un contador que pueda mentir ni un aviso heurístico que dispare en falso.

**B2 · Una lectura para el catálogo, en vez de diez.** Una vista o función que devuelva los comercios ya resueltos con marca (y su logo), categoría, ciudades y promociones vigentes. Hoy se traen las 100 marcas, las 100 ciudades, todas las categorías y todos los tipos de beneficio **en cada visita, aunque no haya filtros**. Es la regla nº2, rendimiento. **Entretanto**: T24 puede recortar lo que no se usa dentro de `page.tsx`, pero no fusionar lecturas ni crear una vista sin tocar `supabase/migrations/**`.

**B3 · Historial de beneficios del socio — el que más cambiaría el producto.** Una lectura de `ventas` filtrada por el miembro de la sesión, con comercio, fecha y descuento, bajo RLS y no service role. Desbloquea **una tercera pestaña, «Mis beneficios»**, con lo que ha usado y cuánto ha ahorrado: es lo que convierte un catálogo en una membresía. Hoy el socio paga cada mes y **la aplicación nunca le dice qué recibió a cambio**. **Entretanto: nada.** Es la ausencia que más limita esta spec.

**B4 · Alojar y gobernar las imágenes — prioridad alta.** Redactada con SQL, RLS y límites en `PROPUESTA-BACKEND-imagenes.md`; no se duplica. Desbloquea `next/image` sin abrir un proxy, **fotos del local** además de logotipos —esta spec está escrita para funcionar sin fotos y mejorar con ellas: **la placa 3:2 del hero de la ficha es exactamente el hueco donde entraría una fotografía apaisada**, ya decidida su proporción—, y que el catálogo deje de depender de que cien servidores ajenos sigan en pie, que es la primera palabra del encargo: **confiable**. **Dato que refuerza**: el patrón «URL a un archivo sin Storage detrás» aparece **tres veces** —`comercios.logo_url`, `marcas.logo_url` y `membresias.comprobante_url`—: no es una excepción, es una costumbre. **Entretanto**: la cadena de respaldo y la placa común; ningún logo se ve roto, deformado ni invisible.

**B5 · Curaduría editorial: destacados e iconografía de categoría.** Una columna `destacado` (u `orden`) en `comercios`, o una tabla de curaduría; e `icono`/`color` en `categorias`. **Entretanto**: «Nuevos en el club» por `created_at`, que **sí** es curaduría real porque sale de un dato real, y chips de texto con check.

**B6 · Distinguir «no hay datos» de «falló la consulta».** No es backend en sentido estricto, pero condiciona el copy. Las consultas de página desestructuran solo `data` e ignoran `error` (`API-CONTRACT.md` §3): un fallo de lectura **no lanza, devuelve cero filas**, y el socio ve **«Aún no hay comercios. Estamos sumando aliados al club»** cuando lo que pasó es que la base no respondió. **Le estamos diciendo que su club está vacío.** Es el mismo tipo de defecto que D14: la aplicación afirma algo que no sabe. **La spec propone lanzar**: el error tiene salida —`error.tsx` con reintento— y el vacío falso no. **Entretanto** se sigue mostrando el vacío inicial, anotado en §4.9 para que nadie lo lea como diseño intencionado.

**B7 · `start_url` por rol.** Ver §8.4. No es capacidad nueva de backend: es una decisión de producto sobre `app/page.tsx` y el manifiesto. Se escala junto al punto 13 de «Fuera de alcance» del plan.

**B8 · Nada más.** Todo lo demás de esta spec —las seis pantallas de acceso con su `h1` y su salida, el catálogo con chips y estanterías, la placa 3:2 con su cadena de respaldo, la ficha con sus seis vacíos, el carnet a una columna con «Cómo usarlo», la pantalla en pausa con motivo y salida, y los tres estados de carga, error y sin conexión— cabe íntegramente dentro de `src/app/**` (sin Server Actions), `src/components/**` y `src/styles/**`.
