'use client'

/*
  Estado de instalabilidad de la PWA.

  `beforeinstallprompt` lo dispara Chrome UNA sola vez y muy temprano, a
  menudo antes de que monte cualquier componente. Por eso el oyente se
  registra al importar el módulo y guarda el evento en una variable de módulo:
  si se registrara dentro de un efecto, se perdería.

  Se expone como store externo para leerlo con `useSyncExternalStore`, sin
  desajustes de hidratación ni renders en cascada.
*/

/** Evento no estándar de Chrome; TypeScript no lo declara. */
type EventoInstalacion = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let diferido: EventoInstalacion | null = null
const oyentes = new Set<() => void>()

function avisar() {
  for (const oyente of oyentes) oyente()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Sin esto Chrome muestra su propio banner, que no podemos ni situar ni
    // traducir. Se pospone para ofrecerlo en el momento que decidamos.
    e.preventDefault()
    diferido = e as EventoInstalacion
    avisar()
  })

  window.addEventListener('appinstalled', () => {
    diferido = null
    avisar()
  })
}

export function suscribirInstalable(alCambiar: () => void) {
  oyentes.add(alCambiar)
  return () => oyentes.delete(alCambiar)
}

export function leerInstalable(): EventoInstalacion | null {
  return diferido
}

export function leerInstalableEnServidor(): null {
  return null
}

/**
 * Lanza el diálogo nativo de instalación.
 * @returns `true` si el usuario aceptó.
 */
export async function lanzarInstalacion(): Promise<boolean> {
  if (!diferido) return false

  await diferido.prompt()
  const { outcome } = await diferido.userChoice

  // El evento solo sirve una vez: Chrome no lo vuelve a entregar.
  diferido = null
  avisar()

  return outcome === 'accepted'
}

/** ¿La app ya se está ejecutando instalada, fuera del navegador? */
export function esStandalone(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS no soporta `display-mode` y usa esta propiedad propia.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * ¿Es Safari en iOS?
 *
 * Importa porque Safari **no** dispara `beforeinstallprompt`: allí la
 * instalación es manual y hay que enseñar el gesto.
 */
export function esSafariEnIOS(): boolean {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ se identifica como Mac; se distingue por el táctil.
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)

  // Chrome, Firefox y Edge en iOS usan WebKit pero no permiten instalar.
  const otroNavegador = /crios|fxios|edgios|opios/i.test(ua)

  return iOS && !otroNavegador
}
