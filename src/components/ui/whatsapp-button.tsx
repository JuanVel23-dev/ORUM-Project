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
      icon={<MessageCircle size={16} />}
    >
      {children}
    </Button>
  )
}
