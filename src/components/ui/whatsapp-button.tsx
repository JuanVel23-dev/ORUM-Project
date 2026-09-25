import type { ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button, type ButtonSize, type ButtonVariant } from './button'

/** Deja solo dígitos: wa.me rechaza espacios, guiones y paréntesis. */
function limpiarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '')
}

type WhatsAppButtonProps = {
  telefono: string
  mensaje?: string
  variant?: ButtonVariant
  size?: ButtonSize
  /** Radio completo, como las acciones de la fachada pública. */
  pildora?: boolean
  fullWidth?: boolean
  className?: string
  /**
   * Icono delante del texto. Por defecto la burbuja de chat; `null` lo
   * retira, para cuando el diseño pide solo el texto (el «Adquirir →» de los
   * planes de la fachada, que ya dice a dónde lleva con su flecha).
   */
  icon?: ReactNode
  /**
   * Nombre accesible cuando el texto visible se repite en la pantalla (dos
   * «Adquirir» seguidos). Debe CONTENER el texto visible (WCAG 2.5.3).
   */
  ariaLabel?: string
  children?: ReactNode
}

/**
 * Enlace a WhatsApp con el mensaje ya redactado.
 *
 * Va en `secondary`, no en `primary`: es una salida de emergencia, y si
 * compitiera visualmente con la acción principal de la pantalla el usuario
 * pediría ayuda antes de intentar resolverlo solo.
 */
export function WhatsAppButton({
  telefono,
  mensaje,
  variant = 'secondary',
  size = 'md',
  pildora = false,
  fullWidth = false,
  className,
  icon = <MessageCircle size={16} />,
  ariaLabel,
  children = 'Soporte por WhatsApp',
}: WhatsAppButtonProps) {
  const numero = limpiarTelefono(telefono)
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''

  return (
    <Button
      href={`https://wa.me/${numero}${texto}`}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      size={size}
      pildora={pildora}
      fullWidth={fullWidth}
      className={className}
      icon={icon ?? undefined}
      aria-label={ariaLabel}
    >
      {children}
    </Button>
  )
}
