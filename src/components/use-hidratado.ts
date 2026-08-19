'use client'

import { useSyncExternalStore } from 'react'

/*
  Distingue el render del servidor del del cliente SIN provocar un desajuste
  de hidratación.

  La tentación es escribir `if (typeof window === 'undefined') return null`,
  pero eso hace que servidor y cliente rendericen árboles distintos en el mismo
  paso y React aborta la hidratación de esa rama. Con `useSyncExternalStore`
  el snapshot de servidor (`false`) coincide con el primer render del cliente,
  y React vuelve a renderizar de forma ordenada al hidratar.

  Tampoco necesita `useState` + `useEffect`, que dispararía renders en cascada.
*/

const sinSuscripcion = () => () => {}
const enCliente = () => true
const enServidor = () => false

/** `false` en el servidor y en el primer render; `true` una vez hidratado. */
export function useHidratado(): boolean {
  return useSyncExternalStore(sinSuscripcion, enCliente, enServidor)
}
