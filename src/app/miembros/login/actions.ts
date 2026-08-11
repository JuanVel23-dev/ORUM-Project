'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerfilActual } from '@/lib/auth/auth'
import { resolverCorreoPorNumeroMembresia } from '@/lib/miembros/auth-miembro'

export type LoginMiembroState = { error?: string }

/**
 * Inicia sesión con número de membresía + contraseña (RF-06). El número se
 * resuelve al correo real por debajo; nunca se pide el correo directamente.
 */
export async function iniciarSesionMiembro(
  _prevState: LoginMiembroState,
  formData: FormData,
): Promise<LoginMiembroState> {
  const numeroMembresia = String(formData.get('numero_membresia') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!numeroMembresia || !password) {
    return { error: 'Ingresa tu número de membresía y tu contraseña.' }
  }

  const correo = await resolverCorreoPorNumeroMembresia(numeroMembresia)
  if (!correo) {
    return { error: 'Número de membresía o contraseña incorrectos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password })
  if (error) {
    return { error: 'Número de membresía o contraseña incorrectos.' }
  }

  const perfil = await getPerfilActual()
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está inactiva. Contacta a soporte.' }
  }

  if (perfil.rolCodigo !== 'miembro') {
    await supabase.auth.signOut()
    return { error: 'Este acceso es exclusivo para miembros.' }
  }

  redirect('/miembros')
}

/** Cierra la sesión actual y vuelve al login de miembros. */
export async function cerrarSesionMiembro() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/miembros/login')
}
