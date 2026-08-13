'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerfilActual } from '@/lib/auth/auth'

export type LoginComercioState = { error?: string }

/** Inicia sesión de un comercio con correo + contraseña (RF-20). */
export async function iniciarSesionComercio(
  _prevState: LoginComercioState,
  formData: FormData,
): Promise<LoginComercioState> {
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

  const perfil = await getPerfilActual()
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está inactiva. Contacta al administrador.' }
  }

  if (perfil.rolCodigo !== 'comercio') {
    await supabase.auth.signOut()
    return { error: 'Este acceso es exclusivo para comercios.' }
  }

  redirect('/comercios')
}

/** Cierra la sesión actual y vuelve al login de comercios. */
export async function cerrarSesionComercio() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/comercios/login')
}
