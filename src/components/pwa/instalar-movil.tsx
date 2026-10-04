'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useMediaQuery } from '@/components/use-media-query'
import { lanzarInstalacion } from './instalable'
import { GuiaInstalacionAndroid, GuiaInstalacionIOS, useInstalacion } from './instalar-app'
import estilos from './instalar-movil.module.css'

/*
  INSTALAR ORUM COMO APLICACIÓN  ·  fachada pública y portal de miembros
  ---------------------------------------------------------------------------
  Encargo del propietario (03/10/2026): «que se pueda descargar y ver como
  una aplicación en el celular; un botón de descarga que detecte cuando está
  en móvil».

  La base ya existía —manifiesto (`app/manifest.ts`, que abre en `/miembros`
  a pantalla completa), iconos y service worker— pero la invitación a
  instalar solo vivía en el panel de administración. Aquí están las dos
  entradas de los portales del cliente:

    · `AvisoInstalar`  — un botón redondo con el icono de descarga, encima
      del de WhatsApp, SOLO EN CELULARES.
    · `EnlaceInstalar` — la entrada del pie, también en computador.

  NO HAY UN SOLO «BOTÓN DE DESCARGA» POSIBLE, porque cada sistema instala a
  su manera (`modoInstalacion`):
    · Android con Chrome/Edge/Samsung: el navegador presta su diálogo nativo
      y el botón lo lanza.
    · iPhone/iPad: Apple no deja instalar desde un botón; se enseña el gesto
      (Compartir → Añadir a pantalla de inicio).
    · Android sin diálogo (Firefox, o Chrome tras descartarlo): se enseña el
      menú ⋮ del navegador.
    · Ya instalada: no se ofrece nada.

  Las guías se montan envueltas en `data-theme="light"`: un `<dialog>` hereda
  los tokens de sus ancestros del DOM, y dentro del pie negro saldría oscuro.
*/

/** Lo que hace el botón en este dispositivo, y las guías que puede abrir. */
function useAccionInstalar() {
  const { modo } = useInstalacion()
  const [guia, setGuia] = useState<'ios' | 'android' | null>(null)

  const instalar = () => {
    if (modo === 'prompt') void lanzarInstalacion()
    else if (modo === 'ios') setGuia('ios')
    else if (modo === 'guia') setGuia('android')
  }

  const guias = (
    <div className={estilos.guias} data-theme="light">
      <GuiaInstalacionIOS abierta={guia === 'ios'} onCerrar={() => setGuia(null)} />
      <GuiaInstalacionAndroid abierta={guia === 'android'} onCerrar={() => setGuia(null)} />
    </div>
  )

  return { modo, instalar, guias }
}

/**
 * El botón flotante: un círculo con el icono de descarga, ENCIMA del de
 * WhatsApp (encargo del 03/10/2026: «un icono de descarga encima de
 * WhatsApp y ya» — la tarjeta con texto que hubo antes sobraba).
 *
 * Solo en celulares (`pointer: coarse` y pantalla estrecha): en un
 * computador la entrada del pie sigue ahí para quien la quiera. Y solo donde
 * instalar es posible: con la app ya instalada, desaparece.
 */
export function AvisoInstalar() {
  const { modo, instalar, guias } = useAccionInstalar()
  const enCelular = useMediaQuery('(pointer: coarse) and (max-width: 900px)')

  if (!modo) return null

  return (
    <>
      {enCelular && (
        <button
          type="button"
          className={estilos.flotante}
          onClick={instalar}
          aria-label="Instalar la aplicación de ORUM"
        >
          <Download size={24} aria-hidden="true" />
        </button>
      )}
      {guias}
    </>
  )
}

/** La entrada permanente del pie, con el aspecto del enlace que le pasen. */
export function EnlaceInstalar({ className }: { className?: string }) {
  const { modo, instalar, guias } = useAccionInstalar()

  if (!modo) return null

  return (
    <>
      <button type="button" className={[estilos.enlace, className].filter(Boolean).join(' ')} onClick={instalar}>
        <Download size={16} aria-hidden="true" />
        Instalar la app
      </button>
      {guias}
    </>
  )
}
