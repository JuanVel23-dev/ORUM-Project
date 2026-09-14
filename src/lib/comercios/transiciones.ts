/**
 * Los nombres de transición de elemento compartido de un comercio.
 *
 * ── Por qué existe esta función y no dos literales ───────────────────────────
 *
 * Un `view-transition-name` solo sirve si las DOS pantallas escriben exactamente
 * el mismo nombre: el navegador empareja por cadena, y si una de las dos se
 * desvía una letra la transición no falla —simplemente no ocurre, en silencio—.
 * Es el mismo motivo por el que `hrefFicha` está exportada en vez de repetida.
 *
 * ── Por qué del `id` y NUNCA del índice de la lista ─────────────────────────
 *
 * El catálogo se filtra por categoría, por ciudad y por texto. Con el índice de
 * la rejilla, «la tercera tarjeta» sería un comercio distinto según el filtro
 * activo, y el par dejaría de casar justo cuando el socio ha filtrado, que es
 * cuando más sabe lo que está mirando.
 *
 * ── Por qué dos nombres y no uno ────────────────────────────────────────────
 *
 * La placa y el bloque de textos son dos cajas independientes que se mueven a
 * ritmos distintos: la placa crece de 72px a 144px y el texto se desplaza a la
 * derecha y sube de `--t-title-3` a `--t-title-1`. Un solo nombre sobre el
 * contenedor de ambas obligaría al navegador a interpolar una caja que contiene
 * cosas de proporciones distintas, y el resultado es el estirado que delata la
 * técnica.
 *
 * El prefijo `vt-` no es decorativo: `view-transition-name` es un espacio de
 * nombres GLOBAL del documento, sin ámbito de módulo CSS, así que se marca para
 * que una búsqueda lo encuentre entero.
 */
export function transicionComercio(id: number): { placa: string; titulos: string } {
  return {
    placa: `vt-comercio-${id}-placa`,
    titulos: `vt-comercio-${id}-titulos`,
  }
}

/*
  ── POR QUÉ EL MECANISMO ES MANUAL Y NO `<ViewTransition>` DE REACT ─────────

  La primera versión usaba `<ViewTransition>` del React canary que Next
  vendoriza. Compilaba, tipaba, pasaba lint y build — y era INERTE:
  instrumentando `document.startViewTransition` se comprueba que no se llama ni
  una vez al navegar.

  La causa está en Next, no en el código: `experimental.viewTransition` **no se
  consume en ninguna parte de Next 16.2.11**. Existe solo en `config-schema.js`
  y en el default de `config-shared.js`; ningún módulo del router lo lee. Las
  piezas de React están —el vendorizado es 19.3.0-canary, exporta
  `ViewTransition`, y su `react-dom` trae `startViewTransition` compilado—,
  pero nadie las conecta.

  Es el mismo modo de fallo que `animate(callback, [desde, hasta])` en motion
  12, que la norma ya documenta: no lanza, no avisa, simplemente no anima.

  Por eso aquí el nombre se escribe en el DOM con `style` —valor que sale del
  dato, y `view-transition-name` es un espacio de nombres global que un módulo
  CSS hashearía— y quien dispara la transición es `TransicionesDeRuta`, un
  único escuchador delegado montado en el layout del portal.

  ── LA REGLA QUE MÁS CARO SALE: un nombre, un elemento ──────────────────────

  Dos elementos con el MISMO nombre vivos en el MISMO documento rompen la
  transición entera, sin excepción y sin avisar: ni error, ni consola, ni
  respaldo. La pantalla simplemente cambia de golpe.

  Aquí es un riesgo real: un comercio puede salir a la vez en el carrusel de
  portada, en una estantería y en la rejilla. El nombre lo lleva SOLO la
  tarjeta de la rejilla —la única lista donde cada comercio aparece exactamente
  una vez—. Si añades una tercera lista de comercios, no le pongas nombre sin
  comprobar antes que no solapa con la rejilla.

  ── Qué merece transición y qué no ─────────────────────────────────────────

  Solo pares con CONTINUIDAD DE OBJETO: el mismo objeto persiste y se
  transforma. El dictamen está en `.claude/docs/log/m5-view-transitions.md`; el
  único par aprobado hoy es rejilla del catálogo ↔ ficha del comercio. Una
  transición sin continuidad real se lee como un error de la aplicación —el
  socio ve volar algo que no es lo mismo— y eso es peor que no tener ninguna.
*/
