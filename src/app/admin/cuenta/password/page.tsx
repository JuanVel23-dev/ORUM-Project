import { PageHeader } from '@/components/ui/layout'
import { PasswordForm } from './password-form'

export const metadata = { title: 'Mi contraseña · ORUM' }

export default function CambiarPasswordPage() {
  // La protección la aplica el layout de /admin.
  return (
    <>
      <PageHeader
        title="Mi contraseña"
        description="Cambia tu contraseña de acceso. Deberás usar la nueva la próxima vez que inicies sesión."
      />
      <PasswordForm />
    </>
  )
}
