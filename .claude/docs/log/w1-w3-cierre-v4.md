# W1 y W3 · cierre de la tanda v4 — 15/09/2026

> Las dos tandas **murieron por límite de sesión a mitad de la edición del CSS**
> («Now the CSS», «Now the verification module CSS»). Ninguna llegó a escribir
> su propio registro. Esto es lo que quedó en el árbol, verificado a posteriori.

## Estado: verde

```
tsc --noEmit              exit 0
eslint .                  exit 0
vitest run                20 archivos · 249 pruebas
next build                compilado correctamente
```

Y la comprobación que ninguna de las cuatro hace —la que importa cuando un
agente cae entrando al CSS—: **clases citadas desde el TSX que nadie llegó a
escribir**. `estilos.loQueSea` sale `undefined`, el `className` se queda con la
cadena literal `"undefined"` dentro y no pasa nada; compila, tipa y pasa lint.
Se barrió `src/` entero cruzando cada `import x from './y.module.css'` con las
clases realmente definidas en su hoja: **sin clases huérfanas**. Las dos cayeron
después de dejar el par TSX/CSS coherente, no antes.

## W1 · carnet y ficha

- `ficha.module.css` +350 · `page.tsx` +138 · `comercio-card.module.css` +80.
- Ritmo tonal de la ficha: papel (hero) → crema (beneficios) → **cacao** (carnet)
  → papel (fotos, sedes), sobre `<Section tono>`.
- El ámbito de cacao remapea de verdad, que era la trampa nº 2: además de los
  tokens de texto invierte `--action-fg` a `--cacao-bg` (papel sobre cacao,
  16,24:1) y sube el foco a `--cacao-brand`, porque el `--cacao-edge` que deja
  `Section` se queda en 4,63:1.
- `--text-3` colapsado en `--text-2`, igual que en el catálogo: sus ratios están
  medidos contra el FONDO de la franja y el texto tenue vive en las tarjetas,
  que son más claras.
- **Punto 7 del encargo, resuelto y con un matiz que no se pidió**: la sección de
  fotos aparece si hay galería *o* si no hay ninguna imagen — así el «todavía no
  hay fotos» no contradice a una portada ya visible arriba.

## W3 · Herramienta de Comercios

- `portal.module.css` +73 · `verificar.module.css` +96 · `loading.tsx` (nuevo).
- El esqueleto **no existía**: `page.tsx` espera tres consultas antes de pintar
  una letra, y en la red de una caja el cajero veía la pantalla anterior
  congelada y volvía a tocar.

## Lo que NO hacía falta hacer

El «hueco en escritorio» del brief de W3 **ya estaba cerrado** en `eec031f`:

- La rejilla, por Z3 — el hueco no era de la rejilla sino de su ÚLTIMA FILA, y
  se resolvió pasando los hijos a `flex` con techo a media columna.
- Las estanterías, con `--carril-tarjeta-w` adaptándose por tramos hasta 320px.

## Añadido al cerrar: `.filoBanda`

El héroe llevaba `.filoInferior` y **el cierre de la landing no llevaba filo
alguno**, estando emparedado entre dos franjas de papel. En claro da igual —el
salto papel→cacao es evidente—, pero **en tema oscuro el cacao `#2b1a15` contra
el fondo raíz `#14100e` da 1,15:1 medido** y la franja se disuelve. `.filoBanda`
pone el filo dorado arriba y abajo, como `box-shadow` para que no mida.

## Pendiente de MIRAR (sigue sin navegador)

1. La franja de cacao del cierre, que nunca se ha pintado con sus clases buenas.
2. Las dos franjas de cacao **en tema oscuro**, ahora con `.filoBanda`.
3. El ritmo tonal de la ficha de comercio completo, de una pasada.
4. El esqueleto de Comercios contra la pantalla real: un esqueleto que no se
   parece a lo que llega desplaza el contenido al resolverse.
