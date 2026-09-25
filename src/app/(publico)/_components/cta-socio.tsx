import { Alert } from '@/components/ui/alert'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'

/*
  LA ACCIÓN PRIMARIA DE TODA LA LANDING  ·  una decisión, dos posiciones
  ---------------------------------------------------------------------------
  Vive en el cierre «Hazte socio hoy». El héroe ya no lo lleva: su acción
  principal baja a los planes, porque quien llega todavía no sabe el precio y
  mandarlo a un chat antes de verlo es pedirle que pregunte lo que la página
  ya podía decirle. Aquí, al final, ya lo sabe.

  VA EN ORO (`variant="brand"`), Y ANTES NO PODÍA.

  La versión anterior de este archivo iba en tinta y lo argumentaba: la norma
  habilitaba el relleno dorado «en el Portal de Miembros y las seis pantallas
  de acceso», y el Portal Público no era ninguna de las dos cosas. La licencia
  creativa del 14/09/2026 levantó el presupuesto del oro y la dirección v4
  define el par: relleno `--action-gold` con texto `--action-gold-fg`.

  Medido de nuevo al aplicar esta tanda, con el método WCAG 2.1 y por TEMA,
  que es como se comprueba 1.4.11:

    TEMA CLARO   relleno `--gold-600` + texto `--tinta-1`
      texto sobre relleno ................................ 4,84:1  ok 1.4.3
      filo contra papel / crema / crema honda ... 3,51 / 3,36 / 3,11  ok 1.4.11
      filo contra la franja de cacao ..................... 4,63:1  ok 1.4.11

    TEMA OSCURO  relleno `--gold-500` + texto `--tinta-1`
      texto sobre relleno ................................ 6,71:1  ok 1.4.3
      filo contra cacao / fondo / tarjeta ....... 6,43 / 7,30 / 6,62  ok 1.4.11

  Vive sobre la franja negra, dentro del ámbito `sobreFoto`, que lo pasa al
  oro pálido de la guía (`--gold-300` con texto en tinta, 12,6:1).

  EL PRESUPUESTO. La v4 avisa de que un CTA de ancho completo a 44-52px ronda
  el 6-8 % del viewport móvil por sí solo. La licencia levantó el tope del 5 %,
  así que deja de ser un límite; sigue siendo la razón por la que el ancla
  secundaria de al lado es un enlace de texto y no un segundo botón.
*/

type Props = {
  /** `configuracion.whatsapp_soporte`. `null` si la fila falta o está vacía. */
  soporte: string | null
  size?: 'md' | 'lg'
  /**
   * Solo el héroe lo pide. Sin número configurado, en desarrollo se pinta un
   * aviso en su lugar; en producción no se pinta NADA (ver abajo).
   */
  avisarSinNumero?: boolean
}

const MENSAJE = 'Hola, quiero hacerme socio de ORUM. ¿Cómo empiezo?'

export function CtaSocio({ soporte, size = 'md', avisarSinNumero = false }: Props) {
  /*
    SIN NÚMERO DE WHATSAPP (SPEC §5.2).

    `configuracion.whatsapp_soporte` se trata como dato obligatorio del
    lanzamiento, no como algo que pueda faltar en producción. Pero un clon
    recién hecho no lo tiene, y la landing entera no puede caerse por eso.

    La resolución: el CTA no se degrada a un enlace roto ni a un botón
    deshabilitado —las dos cosas son peores que su ausencia—, simplemente no se
    pinta, y el resto de la página sigue siendo válida y navegable. En
    desarrollo, además, se grita: un aviso visible y un `console.error`, para
    que el hueco no pase inadvertido hasta producción.
  */
  if (!soporte) {
    if (process.env.NODE_ENV === 'production') return null

    // Se ejecuta en el servidor, así que sale por la consola de `next dev`.
    console.error(
      '[ORUM] Falta `configuracion.whatsapp_soporte`: el CTA de alta no se está pintando.',
    )

    if (!avisarSinNumero) return null

    return (
      <Alert tone="warning" title="Falta el WhatsApp de soporte">
        Carga la clave <code>whatsapp_soporte</code> en la tabla{' '}
        <code>configuracion</code>. Este aviso solo aparece en desarrollo; en
        producción el botón simplemente no se pinta.
      </Alert>
    )
  }

  return (
    <WhatsAppButton telefono={soporte} mensaje={MENSAJE} variant="brand" size={size} pildora>
      Escríbenos por WhatsApp
    </WhatsAppButton>
  )
}
