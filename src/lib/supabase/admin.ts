import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Cliente de Supabase con la clave `service_role`.
 *
 * ⚠️ SOLO se puede usar en el servidor (Server Actions / Route Handlers).
 * La `service_role key` ignora las políticas RLS y tiene acceso total, por eso
 * NUNCA debe llegar al navegador: no importes este archivo desde un Client
 * Component (los que llevan 'use client'). Solo desde Server Actions o Route
 * Handlers.
 *
 * Se usa, sobre todo, para la Admin API de Auth (crear usuarios, cambiar
 * contraseñas, desactivar accesos) que no está disponible con la anon key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
