import styles from './comercio-logo.module.css'

export type ComercioLogoVariante = 'tarjeta' | 'hero' | 'portada'

type ComercioLogoProps = {
  logoUrl: string | null
  nombre: string
  /**
   * `tarjeta` (72px) es la del catálogo; `hero` (144px) la de la ficha;
   * `portada` es la del carrusel de destacados, que mide en `cqi` porque la
   * cubierta que la contiene es responsiva (exige `container-type: inline-size`
   * en esa cubierta; sin contenedor ancestro, `cqi` mide el viewport pequeño).
   *
   * Es una prop y NO un `className` que el consumidor traiga de su propio
   * módulo: `.hero` sobrescribe `--placa-logo-w` y el radio de `.placa`, y las
   * dos reglas tienen que resolverse por el orden de ESTA hoja. Con dos hojas
   * distintas el ganador lo decidiría el orden en que Next las inyecte, que
   * cambia entre desarrollo y producción.
   */
  variante?: ComercioLogoVariante
  className?: string
}

/**
 * El logotipo de un comercio aliado, dentro de su placa.
 *
 * LA PLACA ES LO QUE HACE COLECCIÓN. Con `object-fit: contain` un logotipo 1:1
 * y uno 4:1 acaban con tamaños ópticos distintos, y eso es geometría, no un
 * defecto que se pueda pintar. Lo que los une es el marco: mismo tamaño, mismo
 * relleno, mismo filo, mismo fondo y mismo radio para todos.
 *
 * EL RESPALDO NO ES UN ICONO GENÉRICO: es la inicial del comercio, igual que
 * `Avatar` hace con las personas. Un catálogo donde la mitad de las tarjetas
 * muestran el mismo icono de tienda se lee como incompleto; con la inicial,
 * cada tarjeta sigue siendo distinguible de un vistazo.
 *
 * ── El respaldo ante un `logo_url` muerto · D9, CERRADO ───────────────────
 *
 * Un `logo_url` muerto pintaba el icono de imagen rota, que destruye
 * exactamente la confianza que el catálogo busca. Los dos remedios evidentes
 * se excluyen entre sí: si el `<img>` es transparente para dejar ver una
 * inicial pintada detrás, un logo transparente legítimo la deja ver entre sus
 * trazos; y si lleva fondo opaco para taparla, una imagen rota también la tapa
 * y queda una placa vacía. El servidor no puede distinguir "cargó" de "falló",
 * y no hay selector de CSS para eso.
 *
 * Durante T12 el `alt` de este `<img>` ERA la inicial, con su tipografía
 * aplicada al propio elemento, para que el navegador pintase el alternativo ya
 * estilado. Se apuntó un riesgo y quedó abierto: Chrome puede pintar un glifo
 * de rotura JUNTO al texto alternativo cuando el `<img>` tiene dimensiones
 * explícitas —y este las tiene, 100 % de una placa dimensionada—.
 *
 * **Se cierra tomando el camino 2 de `T4 §4.5`: `alt=""`.** Un `<img>` con
 * `alt` vacío que falla no pinta texto alternativo NI glifo de rotura en
 * ningún navegador: es lo que la especificación dice de una imagen decorativa
 * que no está disponible. El peor caso pasa a ser **placa vacía**, que T4
 * aceptó explícitamente —"feo, nunca icono de rotura"—.
 *
 * Por qué se cierra así y no verificando el camino 1: la verificación exige
 * abrir Chrome, Firefox y Safari, y esta máquina no puede; mientras el riesgo
 * estaba abierto, el carrusel de portada lo heredaba multiplicado por seis, con
 * la placa a tamaño de cubierta, en la primera pantalla que ve el socio. Ante
 * la duda se elige el mecanismo cuyo peor caso está acotado y es conocido,
 * frente al que puede producir justo lo único que no se acepta.
 *
 * Lo que NO se pierde: la inicial sigue siendo el respaldo cuando no hay
 * logotipo que resolver (`logoUrl === null`), que es el caso que la cadena
 * comercio → marca deja abierto y el frecuente de los dos.
 *
 * Y el camino 3 —pasar a cliente con `onError`— sigue descartado: el catálogo
 * pinta hasta 100 placas, o sea ~100 raíces de hidratación en la pantalla cuya
 * regla nº2 es el rendimiento.
 *
 * La placa entera va `aria-hidden`, así que el lector no anuncia nada de aquí:
 * el nombre del comercio está siempre visible al lado.
 *
 * El tamaño sale de `--placa-logo-w` y la altura la deriva `--placa-logo-ratio`:
 * no hay `style={{ width, height }}`. Las otras dos escalas —el hero de la ficha
 * de comercio, 144px, y la portada del carrusel, responsiva— se piden con
 * `variante`, que sobrescribe ese token desde este mismo módulo CSS.
 */
export function ComercioLogo({
  logoUrl,
  nombre,
  variante = 'tarjeta',
  className,
}: ComercioLogoProps) {
  const inicial = nombre.trim().charAt(0).toUpperCase()
  const clases = [styles.placa, variante !== 'tarjeta' && styles[variante], className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={clases} aria-hidden="true">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
        <img
          src={logoUrl}
          /* D9: vacío a propósito. Ver el bloque de arriba — un `alt` con texto
             puede arrastrar el glifo de rotura de Chrome, y eso es lo único
             que no se acepta. */
          alt=""
          className={styles.imagen}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={styles.inicial}>{inicial}</span>
      )}
    </span>
  )
}
