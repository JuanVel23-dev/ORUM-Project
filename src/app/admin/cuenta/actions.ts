'use server'

import { createClient } from '@/lib/supabase/server'

export type PasswordState = { error?: string; ok?: boolean }

/**
 * Cambia la contraseña del usuario actualmente autenticado.
 * Usa la sesión (cliente servidor con cookies), no el cliente admin.
 */
export async function cambiarPassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const nueva = String(formData.get('password') ?? '')
  const confirmar = String(formData.get('confirmar') ?? '')

  if (nueva.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (nueva !== confirmar) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) {
    return { error: `No se pudo cambiar la contraseña: ${error.message}` }
  }

  return { ok: true }
}
