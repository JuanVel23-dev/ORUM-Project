import { SkeletonPageHeader, SkeletonTabla } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <>
      {/* Sin acción en la cabecera: aquí no hay botón de «crear», la subida
          vive dentro de cada bloque. Un esqueleto que promete un botón que
          después no aparece es un salto de layout con aviso previo. */}
      <SkeletonPageHeader conAccion={false} />
      <SkeletonTabla filas={4} />
    </>
  )
}
