'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from './theme-script'
import { useHidratado } from '../use-hidratado'

/*
  El tema no es estado de React: es un store externo (localStorage + matchMedia
  + el atributo del <html>). Por eso se lee con `useSyncExternalStore` en vez de
  con useState + useEffect. Así no hay setState en efectos, no hay renders en
  cascada, y la hidratación queda bien definida con su snapshot de servidor.
*/

const MEDIA_DARK = '(prefers-color-scheme: dark)'
const EVENTO_CAMBIO = 'orum:theme-change'

function esModoValido(valor: string | null): valor is ThemeMode {
  return valor === 'system' || valor === 'light' || valor === 'dark'
}

/* --- Store 1: la preferencia guardada por el usuario --------------------- */

function suscribirModo(alCambiar: () => void) {
  window.addEventListener(EVENTO_CAMBIO, alCambiar)
  // `storage` mantiene el tema sincronizado entre pestañas abiertas.
  window.addEventListener('storage', alCambiar)
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, alCambiar)
    window.removeEventListener('storage', alCambiar)
  }
}

function leerModo(): ThemeMode {
  try {
    const guardado = localStorage.getItem(THEME_STORAGE_KEY)
    return esModoValido(guardado) ? guardado : 'system'
  } catch {
    // localStorage puede fallar en modo privado o con cookies bloqueadas.
    return 'system'
  }
}

const leerModoEnServidor = (): ThemeMode => 'system'

/* --- Store 2: la preferencia del sistema operativo ----------------------- */

function suscribirSistema(alCambiar: () => void) {
  const mq = window.matchMedia(MEDIA_DARK)
  mq.addEventListener('change', alCambiar)
  return () => mq.removeEventListener('change', alCambiar)
}

const leerSistema = (): ResolvedTheme =>
  window.matchMedia(MEDIA_DARK).matches ? 'dark' : 'light'

const leerSistemaEnServidor = (): ResolvedTheme => 'light'

/* ------------------------------------------------------------------------ */

type ThemeContextValue = {
  /** Preferencia elegida: system | light | dark. */
  mode: ThemeMode
  /** Tema realmente pintado, ya resuelto. */
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  /** false durante el render del servidor y la hidratación. */
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(suscribirModo, leerModo, leerModoEnServidor)
  const sistema = useSyncExternalStore(
    suscribirSistema,
    leerSistema,
    leerSistemaEnServidor,
  )
  // Lo usa el conmutador para no animar el indicador desde una posición
  // equivocada mientras aún no se conoce la preferencia guardada.
  const mounted = useHidratado()

  const resolved: ResolvedTheme = mode === 'system' ? sistema : mode

  // Único efecto, y del tipo que corresponde: sincronizar un sistema externo
  // (el DOM) con el estado actual. El script anti-flash ya dejó el atributo
  // puesto en la carga inicial; esto lo mantiene al día en los cambios.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  const setMode = useCallback((siguiente: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, siguiente)
    } catch {
      // Sin persistencia el tema sigue funcionando durante esta sesión.
    }
    // Notifica a los suscriptores de este mismo documento: el evento
    // `storage` solo lo reciben las OTRAS pestañas.
    window.dispatchEvent(new Event(EVENTO_CAMBIO))
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  }
  return ctx
}
