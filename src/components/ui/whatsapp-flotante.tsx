import estilos from './whatsapp-flotante.module.css'

/*
  WHATSAPP FLOTANTE  ·  el atajo al soporte, siempre a mano
  --------------------------------------------------------------------------
  Encargo del propietario (29/09/2026): «un círculo en la parte inferior
  derecha que haga alusión a WhatsApp, que siempre esté ahí y que el usuario
  pueda tocar en cualquier momento». Y después: «más animación, más diseño
  como fondo, sombra; animación al pasar encima y al dar clic». Fijo en la
  esquina de la ventana; lo montan el Portal Público y el de Miembros.

  Server Component: es un enlace y nada más. Todo el movimiento es CSS (ver
  el módulo). Sin número configurado no se pinta —un botón que no lleva a
  ninguna parte es peor que no tener botón—.

  Es SOLO un icono, así que el nombre lo lleva `aria-label` («Escríbenos por
  WhatsApp»). La etiqueta visible que asoma al apuntar es `aria-hidden`: dice
  lo mismo y el lector la leería dos veces. Abre en otra pestaña: en
  escritorio lleva a WhatsApp Web y no se pierde la página.

  El color es `--whatsapp` (ver `tokens.css`): el verde del canal, oscurecido
  lo justo para que el glifo blanco cumpla 3:1.
*/

type Props = {
  /** El número de soporte tal y como está en `configuracion`; se limpia aquí. */
  telefono: string | null
  /** Lo que llega ya escrito en el chat. */
  mensaje: string
  /** Solo para que el portal que lo monta ajuste la altura a su propio cromo. */
  className?: string
}

export function WhatsAppFlotante({ telefono, mensaje, className }: Props) {
  const digitos = (telefono ?? '').replace(/\D/g, '')
  if (!digitos) return null

  return (
    <a
      href={`https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={[estilos.boton, className].filter(Boolean).join(' ')}
    >
      {/* Las ondas de llamada: dos pulsos al aparecer y se acabó. */}
      <span className={estilos.onda} aria-hidden="true" />
      <span className={`${estilos.onda} ${estilos.ondaSegunda}`} aria-hidden="true" />

      {/* El halo verde que se enciende al apuntar. */}
      <span className={estilos.halo} aria-hidden="true" />

      <span className={estilos.circulo}>
        {/* El glifo de WhatsApp: el bocadillo con el teléfono. */}
        <svg viewBox="0 0 24 24" className={estilos.glifo} aria-hidden="true" focusable="false">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
        </svg>
      </span>

      {/* La etiqueta que asoma a la izquierda al apuntar o enfocar. */}
      <span className={estilos.etiqueta} aria-hidden="true">
        Escríbenos
      </span>
    </a>
  )
}
