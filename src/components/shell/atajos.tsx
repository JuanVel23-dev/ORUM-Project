'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { abrirPaleta } from './command-palette'

/*
  LOS ATAJOS DE TECLADO, A LA VISTA  ·  rediseño del panel (04/10/2026)
  ---------------------------------------------------------------------------
  «Conservando la comodidad para trabajar y los atajos para agilidad». Un
  atajo que no se ve no se aprende: el buscador de la cabecera y el de la
  portada enseñan la tecla.
*/

/*
  ¿Mac? Para enseñar «⌘ K» o «Ctrl K». Es estado EXTERNO (el sistema), así que
  va con `useSyncExternalStore` y no con `useState` + `useEffect`; en el
  servidor dice «Ctrl», y el cliente lo corrige al hidratar sin aviso.
*/
const sinSuscripcion = () => () => {}

export function useEsMac(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  )
}

/** La combinación que abre la paleta, como una tecla: «⌘ K» o «Ctrl K». */
export function TeclaPaleta({ className }: { className?: string }) {
  const esMac = useEsMac()
  return (
    <kbd className={className} aria-hidden="true">
      {esMac ? '⌘' : 'Ctrl'} K
    </kbd>
  )
}

/**
 * Un botón que abre la paleta desde cualquier página (de servidor incluida):
 * dispara el evento que escucha el shell.
 */
export function BotonPaleta({
  children,
  claseTecla,
  className,
}: {
  children: ReactNode
  /** La clase de la tecla del atajo, que pinta quien lo usa. */
  claseTecla?: string
  className?: string
}) {
  return (
    <Button
      variant="secondary"
      size="lg"
      icon={<Search size={17} aria-hidden="true" />}
      onClick={abrirPaleta}
      aria-keyshortcuts="Control+K Meta+K /"
      className={className}
    >
      {children}
      <TeclaPaleta className={claseTecla} />
    </Button>
  )
}
