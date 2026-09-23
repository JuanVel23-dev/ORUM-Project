import type { ReactNode } from 'react'
import styles from './pantalla-auth.module.css'

/**
 * Clases compartidas por los formularios de acceso, que son componentes
 * cliente y viven DENTRO de `PantallaAuth`.
 *
 * `formulario` incluye la sacudida al fallar, que se dispara con `:has(.alerta)`
 * — por eso ambas clases tienen que salir del MISMO módulo CSS: si el aviso
 * llevara la clase de otro módulo, el selector nunca casaría y la sacudida
 * dejaría de ocurrir sin que nada lo delatara.
 *
 * `pila` es la misma columna SIN la sacudida, para los estados que no son un
 * envío fallido: el enlace de activación caducado llega ya roto, y sacudir al
 * aterrizar sería regañar al usuario por algo que no hizo.
 *
 * `cargando` reserva la altura del formulario al que sustituye, para que la
 * tarjeta no salte al resolverse.
 */
export const estilosAuth = {
  formulario: styles.formulario,
  pila: styles.pila,
  cargando: styles.cargando,
  alerta: styles.alerta,
  enlace: styles.enlace,
} as const

type PantallaAuthProps = {
  /**
   * El `<h1>` de la pantalla: qué puerta es esta. Antes era un `<span>` y
   * estas pantallas no tenían NINGÚN encabezado — un fallo de accesibilidad,
   * no una preferencia.
   */
  titular: string
  /**
   * Una línea que dice con qué se entra. Resuelve la duda de «¿me pide el
   * correo o el número?» antes de que el usuario toque el campo.
   */
  apoyo?: string
  /**
   * Texto de ayuda bajo la tarjeta, y FUERA de ella: no forma parte de la
   * tarea, así que no debe compartir su superficie. Sobre el fondo se lee como
   * una nota al pie; dentro competía con los campos.
   */
  pie?: ReactNode
  children: ReactNode
}

/**
 * Envoltura de las SEIS pantallas de acceso: fondo oscuro con halo dorado,
 * tarjeta de material con filo de luz y wordmark.
 *
 * Las comparten administración, comercios, miembros y la activación de cuenta.
 * Son puertas al mismo club: si una tuviera dirección de arte propia, parecería
 * otra empresa. Por eso cambian siempre a la vez.
 *
 * Lo único que varía entre ellas es el `titular`, el `apoyo` y los campos.
 */
export function PantallaAuth({ titular, apoyo, pie, children }: PantallaAuthProps) {
  return (
    <div className={styles.pantalla} data-theme="dark">
      {/*
        El marco existe para que el pie quede FUERA de la tarjeta conservando
        su misma anchura. `.pantalla` centra un solo bloque; sin él, tarjeta y
        pie serían dos elementos centrados por separado y el pie se alinearía
        con el viewport, no con la tarjeta.
      */}
      <div className={styles.marco}>
        <div className={styles.tarjeta}>
          <header className={styles.cabecera}>
            <span className={styles.wordmark}>ORUM</span>
            <h1 className={styles.titular}>{titular}</h1>
            {apoyo && <p className={styles.apoyo}>{apoyo}</p>}
          </header>

          {children}
        </div>

        {pie && <p className={styles.pie}>{pie}</p>}
      </div>
    </div>
  )
}
