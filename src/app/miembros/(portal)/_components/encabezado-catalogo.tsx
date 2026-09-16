import styles from './encabezado-catalogo.module.css'

/*
  El encabezado del catálogo no usa `PageHeader`.

  `PageHeader` es la cabecera del PANEL: título y descripción, con hueco para
  una acción a la derecha. Aquí hacen falta tres niveles de la rampa —overline,
  display y lede—, no dos, y no hay acción de pantalla. Ampliar `PageHeader`
  con un overline opcional para un único consumidor habría metido un concepto
  del portal dentro de una pieza que usan 20 pantallas del panel, y P1 dice que
  el panel debe verse idéntico después de este rediseño.

  Las clases se exportan para que el esqueleto de carga (`loading.tsx`) dibuje
  esta misma geometría en vez de recrearla a ojo.
*/

export const estilosEncabezado = styles

export function EncabezadoCatalogo() {
  return (
    <header className={styles.encabezado}>
      <div className={styles.textos}>
        {/* En minúsculas en el marcado y en versalitas por CSS: escrito
            "TU MEMBRESÍA" hay lectores que lo deletrean letra a letra. */}
        <p className={styles.overline}>Tu membresía</p>
        <h1 className={styles.titulo}>Beneficios del club</h1>
        <p className={styles.lede}>
          Muestra tu carnet en la caja y el comercio aplica tu beneficio.
        </p>
      </div>

      {/*
        EL EMBLEMA, y para qué está.

        Encargo del propietario: «poner animaciones o cosas en los espacios en
        blanco; por ejemplo alinear el título a la izquierda y a la derecha
        poner algo, imagen o animación, que sea agradable».

        Es DECORACIÓN declarada: `aria-hidden`, sin texto y sin significado. No
        dice ningún dato, así que no puede mentir ni quedarse obsoleto, y un
        lector de pantalla no lo anuncia.

        Y no es una imagen: son tres anillos y un monograma en SVG, unos 400
        bytes, que se pintan con los tokens del tema. Una fotografía habría que
        servirla, pesaría cien veces más, no se adaptaría al tema oscuro y
        habría que decidir de quién es. Esto se ve caro y no cuesta una
        petición.

        Solo gira `rotate` sobre un elemento ya compuesto: no toca maquetación
        y no dispara repintado. Bajo `prefers-reduced-motion` se queda quieto
        —el halo y el metal siguen ahí— porque un giro continuo en el borde del
        campo visual es exactamente el movimiento que marea.
      */}
      <div className={styles.emblema} aria-hidden="true">
        <svg viewBox="0 0 120 120" className={styles.anillos}>
          <circle className={styles.anilloExterior} cx="60" cy="60" r="54" />
          <circle className={styles.anilloMedio} cx="60" cy="60" r="41" />
          <circle className={styles.anilloInterior} cx="60" cy="60" r="28" />
        </svg>
        <span className={styles.monograma}>O</span>
      </div>
    </header>
  )
}
