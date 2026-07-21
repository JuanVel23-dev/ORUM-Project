'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerfilActual } from '@/lib/auth'

export type LoginState = { error?: string }

/**
 * Inicia sesión con correo + contraseña.
 *
 * En esta fase solo pueden entrar los roles `super_admin` y `empleado`
 * (el portal administrativo). Si el usuario existe pero no tiene acceso o su
 * perfil está inactivo, se cierra la sesión y se muestra un mensaje.
 */
export async function iniciarSesion(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Ingresa tu correo y tu contraseña.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // Validar que tenga un perfil activo con rol permitido para este portal.
  const perfil = await getPerfilActual()

  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta está inactiva o no tiene un perfil válido. Contacta al administrador.',
    }
  }

  if (perfil.rolCodigo !== 'super_admin' && perfil.rolCodigo !== 'empleado') {
    await supabase.auth.signOut()
    return { error: 'Esta cuenta no tiene acceso al portal administrativo.' }
  }

  // redirect() lanza internamente; debe ir fuera de cualquier try/catch.
  redirect('/admin')
}

/**
 * Cierra la sesión actual y vuelve al login.
 */
export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
