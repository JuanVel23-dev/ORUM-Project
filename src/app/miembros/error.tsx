'use client'

import { useEffect } from 'react'
import { RotateCcw, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/feedback'
import styles from './error.module.css'

/**
 * Frontera de error del Portal de Miembros.
 *
 * Cubre cualquier fallo no controlado de las pantallas del socio y del acceso.
 * Sigue el patrón de `src/app/admin/error.tsx`, con dos diferencias:
 *
 * 1. El copy no habla de "pantalla" ni de "administrador": el socio no sabe
 *    —ni tiene por qué— qué es un panel.
 * 2. Pone su propio marco. Esta frontera sustituye al layout del portal, así
 *    que cuando salta no hay cabecera, ni barra inferior, ni el `<main>` que
 *    da el relleno: sin `.marco` el mensaje saldría pegado al borde de la
 *    ventana.
 *
 * Las dos salidas son reales: `reset()` reintenta el render sin recargar ni
 * perder la sesión, y el enlace devuelve al catálogo, que es el sitio donde el
 * socio siempre puede seguir haciendo algo.
 */
export default function MiembrosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Rastro para depurar. Al socio nunca se le enseña el stack.
    console.error('[miembros] error no controlado:', error)
  }, [error])

  return (
    <div className={styles.marco}>
      <div className={styles.contenido}>
        <Card padding="none">
          <ErrorState
            title="No pudimos cargar tus beneficios"
            description="Puede ser algo pasajero de la conexión. Vuelve a intentarlo; si sigue igual, escríbenos por WhatsApp y lo resolvemos."
            // `digest` identifica el error en los registros del servidor sin
            // revelar nada interno.
            detail={error.digest ? `Referencia: ${error.digest}` : undefined}
            actions={
              <>
                <Button onClick={reset} icon={<RotateCcw size={16} />}>
                  Reintentar
                </Button>
                <Button href="/miembros" variant="secondary" icon={<Store size={16} />}>
                  Volver al catálogo
                </Button>
              </>
            }
          />
        </Card>
      </div>
    </div>
  )
}
