import { redirect } from 'next/navigation'

/**
 * Raíz del sitio. Por ahora el proyecto solo tiene el Portal Administrativo,
 * así que enviamos al panel: si no hay sesión válida, el panel redirige al
 * login automáticamente.
 */
export default function Home() {
  redirect('/admin')
}
