import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Cliente de Supabase para usar en Client Components (navegador).
 * Usa la anon key, protegida por las políticas RLS de la base de datos.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
