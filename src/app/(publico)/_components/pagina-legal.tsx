import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import escaparate from '../escaparate.module.css'
import estilos from './pagina-legal.module.css'

/**
 * El armazón compartido de `/terminos` y `/privacidad`: mismo encabezado
 * ceremonial que usa `/aliados` y una `Card` con el cuerpo. Vive en
 * `_components/` porque lo comparten dos rutas hermanas del mismo grupo, no
 * una sola — cada página solo aporta su propio contenido como `children`.
 */
export function PaginaLegal({
  titulo,
  actualizado,
  children,
}: {
  titulo: string
  /** Ya formateada en español, p. ej. «26 de septiembre de 2026». */
  actualizado: string
  children: ReactNode
}) {
  return (
    <div className={estilos.pagina}>
      <header className={estilos.encabezado}>
        <h1 className={`${escaparate.tituloSeccion} ${estilos.titulo}`}>{titulo}</h1>
        <p className={estilos.actualizado}>Última actualización: {actualizado}</p>
      </header>

      <Card padding="lg">
        <div className={estilos.articulo}>{children}</div>
      </Card>
    </div>
  )
}
