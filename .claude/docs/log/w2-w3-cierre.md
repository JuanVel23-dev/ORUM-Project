# Log · Cierre de W2 y W3 por el orquestador · 14/09/2026

Las dos tandas cayeron al tope de sesión a media faena, con casi todo escrito.
Lo que faltaba y se completó aquí:

## `construirVacio()` en el catálogo — donde murió W2

Era lo único que impedía compilar. El vacío no es uno, son seis, y cada vista
falla por un motivo distinto:

- **Favoritos vacío** no es «sin resultados»: el socio no ha buscado nada, es que
  todavía no ha marcado ninguno. Por eso las vistas se comprueban ANTES que los
  filtros — al revés, se le culparía a su búsqueda de algo que no hizo.
- **«Los que más usas» vacío** significa que aún no ha usado la membresía, y el
  copy tiene que decir qué hacer para que se llene.
- Los tres casos de filtros (solo texto, solo categoría, combinación) ya estaban.

Cada uno con su icono: un corazón dice «favoritos» antes de que se lea la primera
palabra.

## El esqueleto de carga contra el logo circular

`(portal)/loading.tsx` dibujaba la placa con `* 2 / 3` —la proporción
rectangular de antes— así que al volverse circular el logo, el esqueleto
prometía una forma que ya no llegaba y el relevo saltaba justo donde el ojo
está mirando.

## Verificado en navegador, contra la base real

| Qué | Resultado |
|---|---|
| Selector de vistas | Cuatro ejes con icono, el activo subrayado |
| Logos circulares | Sí, en tarjeta y en carril |
| Corazón de favorito | `aria-pressed` false → true, etiqueta cambia a «Quitar … de tus favoritos» |
| **Persistencia** | Sobrevive a recargar: se guardó en `favoritos` de verdad |
| Sección «Tus favoritos» | Pasa de vacía a con contenido |
| Sombras | Visibles sobre papel blanco sin borde |
| Top 10 del club | **No se pinta**, y es correcto: el script `20260914140000_top_descuentos.sql` todavía no se ha aplicado. La sección tolera la ausencia y el catálogo sigue entero |

## Pendiente

- Aplicar `20260914140000_top_descuentos.sql` para que aparezca el top 10.
- Mirar en dispositivo real las animaciones: el Chrome de esta máquina reporta el
  documento como oculto y ahí no se pueden juzgar.
- El repaso de escritorio (encargo nº 5), a la espera de que el propietario diga
  qué pantallas le chirrían.
