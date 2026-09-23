import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/feedback'
import { Stack } from '@/components/ui/layout'
import { SkeletonPageHeader } from '@/components/ui/skeletons'

/**
 * Esqueleto de la Herramienta de Comercios.
 *
 * NO existía. `page.tsx` es un Server Component que espera a tres consultas
 * (sucursales, promociones, tipos de beneficio) antes de pintar una sola letra,
 * así que en una conexión de caja —las del punto de venta suelen ser la peor
 * red del local— el cajero veía la pantalla anterior congelada sin ninguna
 * señal de que algo estaba pasando, y volvía a tocar.
 *
 * Replica el layout REAL de reposo: cabecera de página y una tarjeta con un
 * botón de ancho completo. Un esqueleto que no se parece a lo que llega
 * después desplaza el contenido al resolverse, y ese salto se percibe peor que
 * no haber puesto nada.
 *
 * Los rellenos usan `--surface-hueco`, que es uno de los dos únicos sitios del
 * sistema donde el relleno sigue siendo información: perfilar un esqueleto
 * dibujaría el contorno exacto de un contenido que todavía no ha llegado.
 * `Skeleton` ya trae `data-motion-esencial`, así que su pulso sobrevive a
 * `prefers-reduced-motion` — un esqueleto congelado deja de informar de que
 * algo ocurre.
 */
export default function Loading() {
  return (
    <>
      <SkeletonPageHeader conAccion={false} />

      <Card padding="lg">
        <Stack gap={5} align="center">
          {/* El botón único de reposo: «Escanear código QR». */}
          <Skeleton width="100%" height="52px" radius="var(--radius-sm)" />
          {/* La salida en texto, centrada bajo él como en la pantalla real. */}
          <Skeleton width="min(220px, 70%)" height="14px" />
        </Stack>
      </Card>
    </>
  )
}
