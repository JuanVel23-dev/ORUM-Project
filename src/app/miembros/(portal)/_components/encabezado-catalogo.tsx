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
      {/* En minúsculas en el marcado y en versalitas por CSS: escrito
          "TU MEMBRESÍA" hay lectores que lo deletrean letra a letra. */}
      <p className={styles.overline}>Tu membresía</p>
      <h1 className={styles.titulo}>Beneficios del club</h1>
      <p className={styles.lede}>
        Muestra tu carnet en la caja y el comercio aplica tu beneficio.
      </p>
    </header>
  )
}
