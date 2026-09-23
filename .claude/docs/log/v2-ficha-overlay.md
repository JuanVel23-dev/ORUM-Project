# Log · V2 · La ficha se abre encima, y gana sus fotos

> Encargos nº 1 y nº 7. Lo hizo el orquestador: los agentes cayeron al tope de
> sesión sin escribir nada.

## A · La ficha, en overlay

Ruta interceptada, no estado local. Da tres cosas gratis: el botón atrás cierra,
un enlace directo abre la pantalla completa, y el catálogo de detrás conserva
scroll y filtros porque nunca se desmontó.

- **Una sola ranura `@modal`, en `(portal)/layout.tsx`.** Es la lección del
  panel de administración: con una ranura por sección, el mismo destino se abría
  encima o navegaba entero según de dónde vinieras, porque una ruta interceptada
  solo intercepta si el layout que declara su ranura ya está montado.
- `@modal/default.tsx` y `@modal/loading.tsx`, los dos devolviendo `null`. Sin
  `default` Next da 404 en las rutas que no usan la ranura; sin `loading` cae al
  de la sección y dibuja el catálogo entero dentro del hueco del modal.
- **El contenido es EL MISMO componente** de la página real, importado con alias.
  No hay dos copias de 456 líneas que puedan desincronizarse: solo cambia
  `enOverlay`, que retira la barra de vuelta y los nombres de transición.
- Cerrar es `router.back()`, nunca `router.push`: `push` apilaría una entrada y
  el gesto atrás devolvería a la ficha recién cerrada — el bucle clásico.

### La colisión con las transiciones compartidas, y cómo se resolvió

Con la ficha encima, **el catálogo sigue montado detrás**. Los dos
`view-transition-name` del comercio estarían vivos por duplicado en el mismo
documento, y eso **anula la transición entera en silencio**.

Decisión: **en overlay no se emiten los nombres**, y el par catálogo ↔ ficha
queda retirado de `esParAprobado()`. Ese movimiento lo hace ahora el propio
overlay, naciendo de la tarjeta. El mecanismo de M5 se conserva entero y probado
—el dictamen de qué pares merecen transición sigue valiendo— pero hoy no tiene
ningún par que servir.

## B · Las fotos (encargo nº 7)

Carril horizontal con anclaje, no rejilla: en el teléfono una rejilla obliga a
desplazar la página entera para ver la tercera foto, y no dice que haya más.

El **estado vacío es parte del encargo**, no un respaldo: «Todavía no hay fotos ·
Este aliado aún no ha compartido imágenes de su local». Un hueco mudo deja al
socio creyendo que la pantalla se rompió.

`descripcion` vacía ⇒ `alt=""`, decorativa. Nunca el nombre del archivo ni el del
comercio: repetiría por cada foto lo que el `h1` ya dijo.

### El 404 que me costó el descuido

Añadí `portada_url` a la consulta de `cargarComercio` — la que decide si el
comercio EXISTE. Esa columna llega con una migración **que no está aplicada**,
así que PostgREST devolvía error, `data` quedaba en `null` y la ficha entera caía
en `notFound()`. **Una columna que falta se convertía en «este comercio no
existe».**

Arreglado aislándola: la portada y la galería viven en consultas aparte, donde el
peor caso es no tener foto. Es exactamente la tolerancia que sí había previsto
para `comercio_imagenes` y no apliqué a `portada_url`.

## C · Limpieza

`ficha.module.css` no tenía `--border-strong`; la v2 residual estaba en otros
archivos. Se añadió `.enOverlay`, con menos ritmo vertical que `.pagina`: una
hoja tiene menos alto útil y el aire de sobra se convierte en desplazamiento.

## Verificado en navegador

| Camino | Resultado |
|---|---|
| Tarjeta del catálogo | `dialog[open]` **sí**, catálogo **sigue montado** detrás, sección de fotos con su copy vacío |
| Enlace directo a `/miembros/comercios/6` | Página completa, **sin** diálogo, barra de vuelta presente |

## Pendiente

El gesto de arrastre hacia abajo para cerrar en móvil lo aporta `Sheet`, que ya
lo trae. **No se ha probado en un dispositivo real**, y el Chrome de esta máquina
reporta el documento como oculto, así que las animaciones no se pueden juzgar
aquí.
