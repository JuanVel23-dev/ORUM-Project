import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Cliente de Supabase para usar en el servidor:
 * Server Components, Route Handlers (src/app/api/.../route.ts) y Server Actions.
 * Lee y escribe la sesión mediante cookies.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se llamó desde un Server Component (no puede escribir cookies).
            // Se puede ignorar si hay un middleware refrescando la sesión.
          }
        },
      },
    }
  )
}
