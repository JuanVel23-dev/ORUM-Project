# Log · Y1 · Franjas tonales y el vacío en escritorio · 14/09/2026

> Lo hizo el orquestador: las dos tandas cayeron al tope de sesión sin escribir
> una línea.

## Las franjas — «fondos que no sean solo blanco»

| Sección | Franja | Por qué |
|---|---|---|
| Encabezado, búsqueda, filtros | Papel | Es la herramienta: tiene que leerse sin ceremonia |
| **Favoritos + «Los que más usas»** | **Crema** | Las dos responden a «lo mío». Separarlas en dos campos de color las convertiría en dos temas; el tono las agrupa sin un encabezado que las englobe |
| **Top del club** | **Cacao** | Es la única sección ceremonial —lo que presume el club, no lo que el socio vino a buscar—. Y es la única condición bajo la que `--gold-400` es legible: 7,83:1 aquí, 1,99:1 sobre crema |
| Novedades, rejilla | Papel | Vuelve la herramienta |

**A ancho completo**, sangrando con `margin-inline: calc(50% - 50vw)`. Una franja
que respeta el margen se lee como una tarjeta gigante, no como una sección.

`overflow-x: clip` en `.portal`, **no `hidden`**: `50vw` incluye la barra de
desplazamiento y sin recorte hay ~15px de desbordamiento. `hidden` lo arreglaría
pero crea un contenedor de scroll y **rompe el `sticky` de la cabecera**; `clip`
recorta sin crear contenedor.

## Dos errores propios, encontrados mirando la pantalla

**1. Las clases se escribieron en el módulo equivocado.** Fueron a
`portal.module.css`, pero `page.tsx` importa `_components/catalogo.module.css`.
`estilos.franja` salía `undefined`, el `className` quedaba en `"undefined"` y
**no pasaba nada, sin un solo error**. Compilaba, tipaba y pasaba lint.

**2. El título del top salía tinta sobre chocolate.** Poner `color` en la franja
no basta: dentro caen componentes que resuelven sus PROPIOS tokens —`Carril` su
título, `Badge` su relleno— y todos apuntan a los semánticos del tema claro.

La franja pasa a ser un **ámbito de tema**: reasigna `--bg`, `--surface`,
`--text`, `--brand`, `--focus`… a sus equivalentes de cacao. Cualquier
componente que entre se adapta sin saber que está dentro, y el que se escriba
mañana también.

**3. Y un tercero que solo aparece midiendo lo renderizado:** `--cacao-fg-3`
está calculado contra el fondo de la franja, pero el texto tenue vive dentro de
las TARJETAS, que son más claras. Contra ellas caía a **4,02:1** y reprobaba AA.
Se colapsa el tercer nivel en el segundo: se pierde un escalón de jerarquía y se
gana que el texto se lea.

**Comprobado sobre lo renderizado: 24 textos medidos dentro de la franja oscura,
cero fallos de contraste.**

## El vacío en escritorio

El encabezado era tres líneas apiladas que ocupaban un tercio del alto y dejaban
dos tercios del ancho vacíos. Ahora es una rejilla `3fr / 2fr` a partir de 720px:
el titular manda y el lede se coloca a su derecha, alineado con la **base** del
titular —dos textos de tamaños muy distintos alineados arriba se ven
descolgados—.

El titular pasa al peldaño `hero` con **Fraunces**: es el cambio que más hace por
el «se ve caro» de la pantalla. Y el overline sube a `--gold-700`.

## Pendiente

- La rejilla de «Todos los comercios» y los carriles con pocos elementos siguen
  dejando hueco a la derecha en pantallas anchas.
- El carnet y la ficha, que iban en la tanda que cayó.
