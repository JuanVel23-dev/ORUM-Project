'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

/*
  Preferencia booleana de interfaz persistida en localStorage.

  Igual que el tema, se trata como un store EXTERNO y se lee con
  `useSyncExternalStore`: el snapshot de servidor coincide con el primer render
  del cliente, así que no hay desajuste de hidratación, y no hace falta
  `useState` + `useEffect` (que además dispararía renders en cascada).
*/

export function usePreferenciaLocal(
  clave: string,
  porDefecto = false,
): [boolean, (valor: boolean) => void] {
  const evento = `orum:pref:${clave}`

  const suscribir = useCallback(
    (alCambiar: () => void) => {
      window.addEventListener(evento, alCambiar)
      // Mantiene la preferencia sincronizada entre pestañas abiertas.
      window.addEventListener('storage', alCambiar)
      return () => {
        window.removeEventListener(evento, alCambiar)
        window.removeEventListener('storage', alCambiar)
      }
    },
    [evento],
  )

  const leer = useCallback(() => {
    try {
      const guardado = localStorage.getItem(clave)
      return guardado === null ? porDefecto : guardado === 'true'
    } catch {
      // Modo privado o cookies bloqueadas: se usa el valor por defecto.
      return porDefecto
    }
  }, [clave, porDefecto])

  // En el servidor siempre el valor por defecto: es lo que se renderiza.
  const leerEnServidor = useCallback(() => porDefecto, [porDefecto])

  const valor = useSyncExternalStore(suscribir, leer, leerEnServidor)

  const establecer = useCallback(
    (siguiente: boolean) => {
      try {
        localStorage.setItem(clave, String(siguiente))
      } catch {
        // Sin persistencia sigue funcionando durante esta sesión.
      }
      // `storage` solo llega a las OTRAS pestañas; este evento avisa a esta.
      window.dispatchEvent(new Event(evento))
    },
    [clave, evento],
  )

  return useMemo(() => [valor, establecer], [valor, establecer])
}
