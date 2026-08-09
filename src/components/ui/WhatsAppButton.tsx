import type { ReactNode } from 'react'

function limpiarTelefono(telefono: string) {
  return telefono.replace(/[^\d]/g, '')
}

export function WhatsAppButton({
  telefono,
  mensaje,
  children = 'Soporte por WhatsApp',
}: {
  telefono: string
  mensaje?: string
  children?: ReactNode
}) {
  const numero = limpiarTelefono(telefono)
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  const href = `https://wa.me/${numero}${texto}`

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="orum-button orum-button--secondary">
      {children}
    </a>
  )
}
