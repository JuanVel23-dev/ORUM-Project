'use client'

import { useState, type ReactNode } from 'react'
import styles from './agitar.module.css'

/**
 * Qué se mueve.
 *
 * - `giro` (por defecto): el contenido bascula unos grados. Es el correcto
 *   para un icono con forma reconocible —un embudo, una etiqueta, una
 *   estrella—, porque el giro se lee como que el objeto reacciona.
 * - `lateral`: desvío horizontal mínimo. Para lo que no puede girar sin
 *   parecer torcido: un contador, un número, un texto corto.
 */
export type AgitarEje = 'giro' | 'lateral'

type AgitarProps = {
  /**
   * El estado que dispara el acento.
   *
   * Se agita UNA vez en cada transición `false → true`, y NUNCA en el sentido
   * contrario ni en el primer render. Es una prop de estado, no un evento:
   * pásale el mismo booleano que ya usas para pintar el filtro como
   * seleccionado y no hace falta nada más.
   */
  activo?: boolean
  eje?: AgitarEje
  children: ReactNode
  className?: string
}

/**
 * EL ACENTO DE LA SELECCIÓN.
 *
 * Envuelve un icono y lo agita una vez, muy brevemente, cuando pasa a estar
 * seleccionado. Está pensado para la barra de filtros, pero no sabe nada de
 * filtros: sirve para cualquier encendido que merezca un acento.
 *
 * ── CÓMO SE USA ───────────────────────────────────────────────────────────
 *
 *   import { Agitar } from '@/components/ui/agitar'
 *
 *   <button type="button" aria-pressed={activo} onClick={alternar}>
 *     <Agitar activo={activo}>
 *       <Filter size={16} aria-hidden="true" />
 *     </Agitar>
 *     Con promoción
 *   </button>
 *
 * Y nada más: no hay que disparar, ni reiniciar, ni limpiar un temporizador.
 * Se le da el mismo booleano con el que ya se decide el aspecto de
 * seleccionado.
 *
 * ── LAS DOS DECISIONES QUE SOSTIENEN ESTA PIEZA ───────────────────────────
 *
 * 1. UNA AGITACIÓN SE LEE COMO ERROR, y hay que desactivar esa lectura.
 *
 *    En casi todas las interfaces del mundo un temblor significa «contraseña
 *    incorrecta»: es el gesto del rechazo. Para que aquí signifique
 *    «seleccionado» tiene que ser lo contrario de aquello en las tres
 *    variables que el ojo usa para clasificarlo:
 *
 *      · MUY CORTA ..... 240 ms los cuatro golpes (`--dur-agitar`). El temblor
 *                        de error dura medio segundo o más.
 *      · POCA AMPLITUD . 6° de giro, o 2px de desvío, decreciendo en cada
 *                        golpe. El de error recorre 8-10px en ambos sentidos.
 *      · SIN REPETICIÓN  Una sola vuelta, nunca `infinite`. Una oscilación que
 *                        se sostiene ES una vibración, y una vibración es una
 *                        alarma.
 *
 *    Si alguien alarga, engorda o repite esto, deja de decir «lo tienes» y
 *    pasa a decir «algo falló», y el socio irá a buscar el error.
 *
 * 2. ESTO CHOCA CON «ANIMACIONES DELICADAS Y SUAVES», que viene del mismo
 *    encargo, y la resolución es de jerarquía, no de compromiso:
 *
 *    **Todo lo continuo es suave; el único gesto seco del sistema es el acento
 *    puntual de la selección.**
 *
 *    Lo que responde a un dedo mientras el dedo está ahí —hundir al pulsar,
 *    levantar al apuntar, abrir una hoja, mover una tarjeta— es suave por
 *    obligación: entrada rápida, salida decelerada (`--ease-out`), resortes
 *    sin rebote. Esa es la sustancia del sistema y no admite excepciones.
 *
 *    La agitación no pertenece a esa familia: no acompaña un gesto, CELEBRA UN
 *    RESULTADO, y ocurre una vez y se acaba. Un acento seco sobre un fondo
 *    suave se nota; el mismo acento sobre un fondo igual de seco desaparece en
 *    el ruido. Es decir: la agitación funciona PORQUE todo lo demás es suave.
 *
 *    De ahí las dos fronteras, que no son negociables:
 *      · Se aplica al ICONO, nunca a la superficie que lo contiene. Un chip
 *        entero temblando sacude el texto y se lee como fallo de maquetación.
 *      · Se aplica al ENCENDER, nunca al apagar. Apagar un filtro no celebra
 *        nada.
 *
 * ── ACCESIBILIDAD ─────────────────────────────────────────────────────────
 *
 * `prefers-reduced-motion` la retira ENTERA, y es la excepción consciente a la
 * regla del proyecto de «equivalente no vestibular, no ausencia»: una
 * oscilación de alta frecuencia y baja amplitud es movimiento vestibular puro,
 * y no existe versión de eso que no maree. Lo que la sustituye ya está en
 * pantalla — el color, el relleno y el texto del estado seleccionado.
 *
 * CONSECUENCIA DIRECTA, Y ES UNA OBLIGACIÓN DEL CONSUMIDOR: `Agitar` NO puede
 * ser el único portador de la selección. Ni comunica nada a un lector de
 * pantalla, ni existe con movimiento reducido, ni lo ve quien llegó a la
 * pantalla con el filtro ya puesto. El estado se declara con `aria-pressed`
 * (o `aria-current`) y se ve con color + texto, siempre. Esto solo lo celebra.
 *
 * ── RENDIMIENTO ───────────────────────────────────────────────────────────
 *
 * Es `'use client'` porque necesita recordar el valor anterior de `activo`
 * para no agitarse en el primer render —un temblor en cada carga de página es
 * ruido, y con CSS puro no hay forma de distinguir «montó encendido» de «se
 * acaba de encender»—. `children` se pasa como ranura, así que un Server
 * Component puede usarlo sin arrastrar su contenido al cliente.
 *
 * Aun así: es UNA raíz de hidratación por instancia. Va bien en una barra de
 * filtros (media docena). NO se pone en cada fila de un catálogo de cien
 * tarjetas — esa pantalla tiene el rendimiento como regla nº2.
 */
export function Agitar({ activo = false, eje = 'giro', children, className }: AgitarProps) {
  /*
    Ajustar estado durante el render al cambiar una prop: el patrón que React
    documenta para justo esto, y la razón de que aquí NO haya `useEffect`.

    `previo` recuerda el último valor visto. Si `activo` cambió, se actualiza y
    se enciende el acento SOLO cuando el cambio fue hacia arriba. React
    descarta el render en curso y vuelve a ejecutar el componente de inmediato,
    antes de pintar: no hay parpadeo ni un fotograma intermedio.

    Y el estado inicial se siembra con `activo`, que es lo que garantiza que
    montar con el filtro ya puesto NO agite nada.
  */
  const [previo, setPrevio] = useState(activo)
  const [agitado, setAgitado] = useState(false)

  if (previo !== activo) {
    setPrevio(activo)
    setAgitado(activo)
  }

  return (
    <span
      className={[styles.agitar, className].filter(Boolean).join(' ')}
      /*
        El disparo es un cambio de atributo, y la animación vive en la hoja.
        No hay temporizador que limpiar: la animación se reproduce una vez
        porque la regla CSS acaba de empezar a aplicarse, y termina sola.
      */
      data-agitado={agitado ? 'si' : undefined}
      data-eje={eje}
    >
      {children}
    </span>
  )
}
