'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import styles from './_components/verificar.module.css'

/**
 * Frontera de error de la Herramienta de Comercios.
 *
 * No existía: una excepción no controlada en `page.tsx` dejaba al cajero en la
 * pantalla genérica de Next —sin wordmark, sin salida reconocible— en mitad de
 * una venta y con el cliente delante.
 *
 * Sigue el patrón de `src/app/miembros/error.tsx` con dos diferencias, y las
 * dos vienen de quién está mirando:
 *
 * 1. **Una sola salida: reintentar.** Miembros ofrece además «volver al
 *    catálogo» porque allí hay otro sitio donde seguir; aquí el portal tiene un
 *    único destino, así que un segundo botón solo sería una decisión más que
 *    tomar de pie en la caja.
 * 2. **No pone su propio marco.** Esta frontera vive DENTRO de `(portal)`, así
 *    que el layout —cabecera, banner con el nombre del comercio, `<main>` con
 *    su relleno— sigue montado. La de Miembros sí lo pone porque sustituye al
 *    suyo. Lo único suyo es la tarjeta, la misma de la herramienta, que monta
 *    sobre el canto del banner.
 */
export default function ComerciosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Rastro para depurar. Al cajero nunca se le enseña el stack.
    console.error('[comercios] error no controlado:', error)
  }, [error])

  return (
    <div className={`${styles.tarjeta} ${styles.aviso}`}>
      <ErrorState
        title="No pudimos cargar la herramienta"
        description="Puede ser algo pasajero de la conexión. Vuelve a intentarlo; si sigue igual, escribe al administrador del club."
        // `digest` identifica el error en los registros del servidor sin
        // revelar nada interno.
        detail={error.digest ? `Referencia: ${error.digest}` : undefined}
        actions={
          <Button onClick={reset} variant="brand" size="lg" pildora icon={<RotateCcw size={17} />}>
            Reintentar
          </Button>
        }
      />
    </div>
  )
}
