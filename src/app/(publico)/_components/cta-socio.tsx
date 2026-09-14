import { Alert } from '@/components/ui/alert'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'

/*
  LA ACCIÓN PRIMARIA DE TODA LA LANDING  ·  una decisión, dos posiciones
  ---------------------------------------------------------------------------
  Aparece en el héroe y otra vez en el CTA final. No es redundancia: en una
  página que ya se desplazó varias pantallas, el botón del héroe quedó arriba y
  fuera de vista, y repetirlo abajo es la razón de ser de esa sección.

  VA EN TINTA (`variant="primary"`), NO EN ORO. `CLAUDE.md` habilita el relleno
  dorado de acción en «el Portal de Miembros y las seis pantallas de acceso»; el
  Portal Público no es ninguna de las dos cosas, y la versión anterior de la
  norma que citaba «el CTA comercial del Portal Público» fue retirada
  explícitamente. Aquí el oro se queda en el wordmark, en las píldoras de
  beneficio y en el anillo de foco.
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
    <WhatsAppButton telefono={soporte} mensaje={MENSAJE} variant="primary" size={size}>
      Quiero ser socio
    </WhatsAppButton>
  )
}
