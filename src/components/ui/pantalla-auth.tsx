import styles from './pantalla-auth.module.css'

/**
 * Clases compartidas por los formularios de acceso, que son componentes
 * cliente y viven DENTRO de `PantallaAcceso` (la pantalla oscura
 * `PantallaAuth` se retiró el 03/10/2026; el nombre del módulo se conserva
 * para no tocar los seis formularios que lo importan).
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
