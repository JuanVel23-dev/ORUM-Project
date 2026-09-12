import styles from './comercio-logo.module.css'

export type ComercioLogoVariante = 'tarjeta' | 'hero'

type ComercioLogoProps = {
  logoUrl: string | null
  nombre: string
  /**
   * `tarjeta` (72px) es la del catálogo; `hero` (144px) la de la ficha.
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
 * ── Por qué el `alt` es la inicial y no el nombre ──────────────────────────
 *
 * Un `logo_url` muerto pintaba el icono de imagen rota, que destruye
 * exactamente la confianza que el catálogo busca. Los dos remedios evidentes
 * se excluyen entre sí: si el `<img>` es transparente para dejar ver una
 * inicial pintada detrás, un logo transparente legítimo la deja ver entre sus
 * trazos; y si lleva fondo opaco para taparla, una imagen rota también la tapa
 * y queda una placa vacía. El servidor no puede distinguir "cargó" de "falló",
 * y no hay selector de CSS para eso.
 *
 * La salida es el propio texto alternativo: el `alt` ES la inicial, y el
 * `<img>` lleva su tipografía, su color y su centrado. Cuando la imagen falla,
 * el navegador pinta el alternativo YA ESTILADO, en su sitio. Coste cero,
 * sigue siendo Server Component, cero JavaScript.
 *
 * La placa entera va `aria-hidden`, así que ese `alt` no llega al lector: el
 * nombre del comercio está siempre visible al lado y no se anuncia dos veces.
 *
 * PENDIENTE DE VERIFICAR EN NAVEGADOR (T12): Chrome puede pintar un glifo de
 * rotura JUNTO al texto alternativo cuando el `<img>` tiene dimensiones
 * explícitas. Si ocurre, se documenta cuál y se pasa al camino de fondo opaco,
 * cuyo peor caso es placa vacía —feo, nunca icono de rotura—.
 *
 * El tamaño sale de `--placa-logo-w` y la altura la deriva `--placa-logo-ratio`:
 * no hay `style={{ width, height }}`. La otra escala —el hero de la ficha de
 * comercio, 144px— se pide con `variante="hero"`, que sobrescribe ese token
 * desde este mismo módulo CSS.
 */
export function ComercioLogo({
  logoUrl,
  nombre,
  variante = 'tarjeta',
  className,
}: ComercioLogoProps) {
  const inicial = nombre.trim().charAt(0).toUpperCase()
  const clases = [styles.placa, variante === 'hero' && styles.hero, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={clases} aria-hidden="true">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
        <img
          src={logoUrl}
          alt={inicial}
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
