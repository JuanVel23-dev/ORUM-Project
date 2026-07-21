import { PasswordForm } from './password-form'

export const metadata = { title: 'Mi contraseña · ORUM' }

export default function CambiarPasswordPage() {
  // La protección la aplica el layout de /admin.
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        Mi contraseña
      </h1>
      <p className="orum-muted" style={{ marginBottom: '1.25rem' }}>
        Cambia tu contraseña de acceso. Deberás usar la nueva la próxima vez que inicies sesión.
      </p>
      <PasswordForm />
    </div>
  )
}
