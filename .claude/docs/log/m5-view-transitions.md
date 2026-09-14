# Log · m5-view-transitions

> Una entrada por tarea terminada. Formato: `## <tarea>` + qué se hizo, qué quedó fuera y por qué.

## A · Dictamen de movimiento (el que T6 nunca emitió) — 14/09/2026

La pregunta no es «¿queda bien?», es **¿hay continuidad de objeto real?**: el
mismo objeto persiste y se transforma. Si solo cambia la pantalla, no la lleva.
Una transición de elemento compartido donde no hay continuidad se lee como un
error de la aplicación —el socio ve volar algo que no es lo mismo— y eso es peor
que no tener ninguna.

| Par de pantallas | ¿Transición? | Por qué |
|---|---|---|
| Rejilla del catálogo → ficha del comercio | **SÍ** | La placa del logotipo y el bloque nombre+marca son literalmente el mismo objeto: mismo dato, misma disposición (placa a la izquierda, texto a la derecha) en las dos pantallas. Solo cambian de tamaño y posición |
| Ficha → catálogo (vuelta) | **SÍ**, el mismo par al revés | «Entrada y salida por el mismo camino». No hace falta nada extra: el nombre se deriva del `id`, así que casa en las dos direcciones. `volver-catalogo.ts` sigue reponiendo los filtros |
| Carrusel de portada → ficha | **NO** | Colisión de nombres: un comercio puede salir en portada y en la rejilla a la vez. Dos elementos con el mismo `view-transition-name` vivos en el mismo documento **anulan la transición entera, en silencio** — restricción ya escrita en `carrusel-destacados.tsx:44-48`. Además la cubierta de portada es una tarjeta editorial con hueco de foto, no la placa: ni siquiera sería el mismo objeto |
| Estantería (`ComercioCardCompacta`) → ficha | **NO** | Misma colisión, y esta no estaba escrita: «Nuevos en el club» y «Beneficios del momento» se surten de la MISMA lista que la rejilla. Contando la portada, un comercio nuevo con beneficio vigente sale hasta **tres** veces en la misma pantalla. Queda documentado en el TSDoc del componente |
| Catálogo → carnet (`/miembros/perfil`) | **NO** | Cero objetos en común. El carnet es el documento del socio; el catálogo, un directorio de terceros. No hay nada que pueda transformarse en nada |
| Ficha → carnet («Mostrar mi carnet») | **NO** | El candidato dudoso, y la respuesta es no. Tienta porque el botón está en la ficha, pero lo que aparece no es el comercio: es la membresía. Es un cambio de contexto, no una transformación. Volar la placa del aliado hacia el carnet inventaría un parentesco que no existe — y el carnet es la pantalla que se enseña en la caja, donde una animación confusa se paga delante del cliente |
| Catálogo ↔ catálogo filtrado (chips, búsqueda) | **NO** | Misma pantalla cambiando de contenido. Morfar tarjetas que además se reordenan produce vuelos cruzados. Ahí el patrón correcto ya existe y es la entrada escalonada |
| Acceso → catálogo · catálogo → `inactiva` | **NO** | Frontera de sesión y cambio de estado de la membresía. Ningún objeto persiste |

**Resultado: un solo par aprobado.** Es lo que se implementa en el bloque B.

## B · Implementación — 14/09/2026

**Cómo se dispara, que era el punto no evidente.** En navegación de cliente, un
`view-transition-name` suelto en un `.module.css` **no anima nada**: quien llama
a `document.startViewTransition` es React, y solo si hay un `<ViewTransition>`
en el árbol que cambia. Encima el hash del módulo CSS renombraría un ident que
es global del documento. Por eso la puerta es un componente y no una clase.

Archivos:

- **`src/lib/comercios/transiciones.ts`** (nuevo). `transicionComercio(id)`
  devuelve los dos nombres (`vt-comercio-<id>-placa`, `…-titulos`). Función pura,
  del `id` y **nunca del índice** de la lista: el índice cambia al filtrar y el
  par dejaría de casar justo cuando el socio ha filtrado.
- **`src/components/ui/transicion-compartida.tsx`** (nuevo). Envoltorio único
  sobre `ViewTransition` de React. Sin `'use client'`: `ViewTransition` es un
  tipo de elemento integrado —`Symbol(react.view_transition)`, al lado de
  `Fragment` y `Suspense`— y existe también en la condición `react-server`, así
  que no añade ni un byte de cliente ni una raíz de hidratación.
- **`src/components/ui/react-canary.d.ts`** (nuevo). Una línea:
  `/// <reference types="react/canary" />`. Hace falta por una asimetría real:
  `react` instalado es 19.2.4 estable y sus tipos no declaran `ViewTransition`,
  pero la aplicación se empaqueta contra la copia que Next vendoriza
  (19.3.0-canary), que sí lo exporta. Va en un `.d.ts` y no como
  `import {} from 'react/canary'` porque ese módulo no existe en disco y un
  transpilador que conservara el import rompería el empaquetado.
- **`comercio-card.tsx`**. `ComercioCard` (rejilla) envuelve la placa y el bloque
  de títulos. `ComercioCardCompacta` **no**, con el motivo escrito en su TSDoc.
- **`comercios/[id]/page.tsx`**. El otro extremo, con los mismos dos nombres.
- **`globals.css`**. Sección 4c nueva: `--dur-page` (500ms, el token acuñado para
  «transición de ruta» que hasta hoy no tenía ni un consumidor) para la pieza,
  `--dur-base` para el fundido de la raíz, `--ease-out` en ambos. La raíz va más
  rápida a propósito: el fondo deja de competir por la atención mientras la placa
  todavía viaja.

**Dos nombres y no uno** (el contenedor común): la placa crece de 72 a 144px y el
texto se desplaza y sube de `--t-title-3` a `--t-title-1`. Un solo nombre sobre el
contenedor obligaría al navegador a interpolar una caja con contenidos de
proporciones distintas, que es el estirado que delata la técnica.

**El enlace directo no necesita caso especial.** Llegar a la ficha desde WhatsApp
deja un nombre huérfano: sin elemento anterior que emparejar, no hay transición.
Un nombre sin pareja es inerte, no un error.

**La vuelta no necesita nada aparte.** El nombre se deriva del `id` en las dos
pantallas, así que el par casa en las dos direcciones; `resolverVolverAlCatalogo`
sigue devolviendo los filtros exactamente igual, y ni el `href` ni la lista
blanca se han tocado.

## C · Las tres reglas — 14/09/2026

1. **`prefers-reduced-motion`.** Resuelto en `globals.css` §5, dentro de la media
   query que ya existía, y **escrito a mano a propósito**: la red de seguridad
   global usa `*`, que **no casa con un pseudoelemento** `::view-transition-*`.
   Sin estas reglas el morfo se habría ejecutado íntegro bajo movimiento
   reducido y nada lo habría delatado. Queda un fundido cruzado de `--dur-fast`:
   `animation-name: none` en el grupo mata el viaje de la caja;
   `inline-size`/`block-size: auto` en old/new impide que la instantánea vieja se
   estire hasta el tamaño nuevo (un zoom sin desplazamiento sigue siendo
   movimiento); `isolation: auto` + `mix-blend-mode: normal` desmontan el
   `plus-lighter` del navegador, que aclara de más cuando las dos copias son
   distintas. **Equivalente no vestibular, nunca ausencia de feedback.**
2. **Rendimiento.** Cero JavaScript de cliente añadido: `ViewTransition` es un
   built-in de React y ninguno de los archivos tocados es de cliente. La
   animación va sobre instantáneas en una capa del compositor, no sobre el árbol
   de layout — que es justo lo que hace defendible la excepción a «no animes la
   caja». **Lo que no se puede cerrar aquí es si salta el primer fotograma**:
   exige verlo en un teléfono de gama media, y esta máquina no pinta.
3. **El QR no se toca.** El carnet no entra en el alcance: ni un archivo de
   `perfil/` aparece en el diff. Sigue negro sobre blanco en los dos temas.

## D · `CLAUDE.md` — 14/09/2026

La contradicción estaba viva: la tabla de prohibiciones duras dice que animar
`width`, `height`, `top`, `left` o `margin` es un bug, y una View Transition
interpola exactamente la caja. La excepción (RUP-3) se había aprobado y nunca se
escribió.

- Fila de la tabla: ahora remite a la excepción en vez de ser absoluta.
- Sección «Movimiento» → subsección nueva **«Transiciones de elemento compartido
  — la excepción a "no animes la caja"»**: por qué el coste no es el mismo (se
  interpola una instantánea en una capa del compositor, no el elemento), que
  **sigue prohibido hacerlo a mano**, la lista de dónde sí y dónde no —el
  dictamen del bloque A—, cómo se escriben, y el aviso de que el `*` de
  movimiento reducido no alcanza a los pseudoelementos.
- «Deuda conocida» nº1: cerrada, con la salvedad de que sigue sin verificarse en
  navegador.

## Lo que queda fuera, y por qué

- **No se tocó `next.config.ts`.** No está en la zona de trabajo de `SCOPE.md`
  §1, y su comentario («las transiciones concretas se aplicarán cuando cada ruta
  tenga su diseño definitivo») ya no describe el estado. Anotado en el reporte.
- **`experimental.viewTransition` es hoy una bandera muerta en Next 16.2.11.**
  Solo aparece en el esquema de configuración (`server/config-schema.js`) y en el
  default (`server/config-shared.js`); nadie más la lee, y `needsExperimentalReact`
  —lo que antes decidía aliasar el canal experimental de React— solo mira `taint`,
  `transitionIndicator` y `gestureTransition`. Lo que hace que esto funcione es
  que la copia de React que Next vendoriza ya es canary y exporta
  `ViewTransition`, con el camino a `document.startViewTransition` compilado en
  su `react-dom`. Se deja puesta: `next build` la sigue anunciando como
  experimento activo, y quitarla es una decisión que no toca a esta tarea.
- **Sin `loading.tsx` propio para `/miembros/comercios/[id]`.** Hoy el respaldo de
  carga de la ficha es el `loading.tsx` de `(portal)`, que dibuja el esqueleto del
  catálogo. Si la navegación tarda lo bastante como para mostrarlo, la transición
  degrada al fundido de raíz: la pieza no encuentra pareja dentro de un esqueleto.
  No es una regresión —ya era así— pero ahora tiene una consecuencia visible.
  Merece su propia tarea, no arreglarse de paso.
- **Sin prueba automatizada.** `transicionComercio` es pura y cae en la zona de
  `qa-tester`; la transición en sí solo se verifica a mano.

---

## Corrección del orquestador — el mecanismo era inerte · 14/09/2026

La implementación original usaba `<ViewTransition>` del React canary que Next
vendoriza. Pasaba `tsc`, `eslint`, las 218 pruebas y `next build`. **Y no
animaba nada.**

### Cómo se descubrió

Instrumentando `document.startViewTransition` en el navegador y navegando del
catálogo a una ficha: **el contador se quedó en 0**. Ni una llamada.

### La causa, verificada en `node_modules`

- `grep` sobre `next/dist`: `viewTransition` aparece **solo** en
  `server/config-schema.js:315` y `server/config-shared.js:238` (el default).
  **Ningún módulo del router lo lee.** La opción es inerte en 16.2.11.
- El React vendorizado sí tiene las piezas: `19.3.0-canary-3f0b9e61`, exporta
  `ViewTransition` como símbolo, y su `react-dom-client.production.js` contiene
  `startViewTransition`. Lo que falta es quien las conecte.
- El React *instalado* es 19.2.4 y no exporta `ViewTransition`; de ahí que
  hiciera falta un `react-canary.d.ts` solo para que tipara. Ese archivo se
  borra con el mecanismo.

Es el mismo modo de fallo que la norma ya documenta para
`animate(callback, [desde, hasta])` en motion 12: no lanza, no avisa,
simplemente no ocurre.

### Lo que se conserva del trabajo original

**El dictamen del bloque A entero**, que es la parte de criterio y sigue siendo
correcta, y los nombres que genera `transicionComercio()`. Solo cambia el
mecanismo que los dispara.

### El mecanismo nuevo

- El `view-transition-name` lo escriben los elementos que ya existían —la placa
  (`ComercioLogo nombreTransicion`) y el bloque de títulos— con `style`. **Sin
  envoltorio**: `.cabecera` es flex y `.hero` es una rejilla de dos columnas, así
  que un `<div>` intermedio habría sacado a los hijos del contenedor que les da
  su sitio. Fue el primer intento y estaba mal.
- `TransicionesDeRuta` (`src/components/ui/transiciones-ruta.tsx`): **uno por
  portal**, montado en `(portal)/layout.tsx`, con un único escuchador delegado en
  captura. Envolver cada tarjeta habría hidratado hasta cien raíces.
- El callback devuelve una promesa que se resuelve cuando `usePathname` cambia,
  porque `router.push` no espera al pintado. Con plazo máximo de 1200 ms: sin él,
  una navegación fallida dejaría la página congelada bajo la instantánea vieja.
- Respeta ctrl/cmd/shift/alt-clic, `target="_blank"`, `download` y otros
  orígenes. Sin `startViewTransition` en el navegador (Safari, Firefox), navega
  como siempre.

### Verificado en navegador

- `startViewTransition` **se llama**: contador = 1 al pulsar una tarjeta.
- El catálogo monta **17 nombres y cero duplicados** (raíz + 8 comercios × 2).
  El carrusel y las estanterías no los llevan, como exige el dictamen.
- La ficha monta los dos nombres del comercio correcto.

### Lo que NO se pudo verificar aquí, y por qué

La animación en sí. El Chrome de esta máquina reporta
`document.visibilityState === 'hidden'` **incluso con `document.hasFocus()`
verdadero**, y la especificación aborta toda View Transition en ese estado:
`t.ready` rechaza con `Transition was aborted because of invalid state`.

Es la misma causa de fondo que la nota de `CLAUDE.md` sobre los tres
diagnósticos falsos al medir transiciones aquí. **Queda pendiente de mirar en un
navegador de verdad**, junto con: la vuelta, el movimiento reducido, el enlace
directo sin pantalla previa, y el comportamiento en gama media.
