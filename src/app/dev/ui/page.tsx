import { notFound } from 'next/navigation'
import { Gallery } from './gallery'

export const metadata = {
  title: 'Sistema de diseño · ORUM',
}

/**
 * Galería del sistema de diseño.
 *
 * Es la herramienta de diseño del proyecto: sustituye a los mockups estáticos,
 * porque un mockup no puede mostrar si una hoja se deja agarrar a mitad de
 * vuelo, que es justo lo que hay que evaluar aquí.
 *
 * Solo existe en desarrollo. Se prefirió esto a protegerla con
 * `requireRol('super_admin')` por dos razones: se abre sin fricción mientras se
 * itera, y en producción no existe la ruta en absoluto, así que no hay
 * superficie que proteger.
 */
export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <Gallery />
}
