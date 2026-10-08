import 'server-only'

import { createClient } from '@supabase/supabase-js'

/*
  Comprueba una contraseña SIN tocar la sesión abierta.

  `signInWithPassword` con el cliente de cookies (`lib/supabase/server`) sustituiría
  la sesión del usuario por otra nueva. Aquí se usa un cliente efímero, sin
  almacenamiento, y la sesión que ese acierto crea se cierra enseguida: sin eso
  quedaría una sesión válida huérfana en Supabase por cada cambio de contraseña.
*/

/**
 * `true` si `password` es la contraseña vigente de `email`. Nunca lanza: ante un
 * fallo de red o de configuración responde `false`, que es el lado seguro para
 * una comprobación que precede a un cambio de credenciales.
 */
export async function verificarPasswordActual(email: string, password: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey || !email || !password) return false

  const cliente = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  try {
    const { data, error } = await cliente.auth.signInWithPassword({ email, password })
    if (error || !data.session) return false

    // Solo esa sesión efímera: la del usuario, en cookies, no se toca.
    await cliente.auth.signOut({ scope: 'local' }).catch(() => {})
    return true
  } catch (err) {
    console.error('[password-actual] no se pudo comprobar la contraseña', err)
    return false
  }
}
