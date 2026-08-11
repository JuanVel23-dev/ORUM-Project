import { Suspense } from 'react'
import { requireRol } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'
import { AppShell } from '@/components/shell/app-shell'
import { RouteProgress } from '@/components/shell/route-progress'

export const metadata = {
  title: 'Panel · ORUM',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Solo super_admin y empleado entran al portal administrativo. El shell
  // filtra los destinos por rol, pero eso es presentación: la autorización
  // real la sigue haciendo `requireRol` aquí y en cada página y server action.
  const perfil = await requireRol('super_admin', 'empleado')

  return (
    <>
      {/*
        `useSearchParams` obliga a un límite de Suspense. La barra no pinta
        nada hasta que hay navegación, así que el fallback es vacío.
      */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>

      <AppShell
        user={{
          // Hasta que el perfil guarde nombre y apellido, el correo es lo
          // único identificable que hay para las iniciales del avatar.
          nombre: perfil.email ?? perfil.rolNombre,
          email: perfil.email,
          rolNombre: perfil.rolNombre,
          rolCodigo: perfil.rolCodigo,
        }}
        cerrarSesion={cerrarSesion}
      >
        {children}
      </AppShell>
    </>
  )
}
