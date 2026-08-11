import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth'
import { LoginForm } from './login-form'
import styles from './login.module.css'

export const metadata = {
  title: 'Iniciar sesión · ORUM',
}

const MENSAJES: Record<string, string> = {
  sin_permiso: 'Tu cuenta no tiene permiso para acceder a esa sección.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // Si ya inició sesión y tiene acceso, no mostramos el login.
  const perfil = await getPerfilActual()
  if (
    perfil &&
    perfil.activo &&
    (perfil.rolCodigo === 'super_admin' || perfil.rolCodigo === 'empleado')
  ) {
    redirect('/admin')
  }

  const { error } = await searchParams
  const mensajeInicial = error ? MENSAJES[error] : undefined

  return (
    // `data-theme="dark"` en el contenedor, no en <html>: redeclara los tokens
    // para todo este subárbol sin tocar la preferencia del usuario, que sigue
    // vigente en cuanto entra al panel.
    <div className={styles.pantalla} data-theme="dark">
      <div className={styles.tarjeta}>
        <header className={styles.cabecera}>
          <span className={styles.wordmark}>ORUM</span>
          <span className={styles.subtitulo}>Portal de Administración</span>
        </header>

        <LoginForm mensajeInicial={mensajeInicial} />

        <p className={styles.pie}>
          ¿Problemas para entrar? Contacta al administrador del club.
        </p>
      </div>
    </div>
  )
}
