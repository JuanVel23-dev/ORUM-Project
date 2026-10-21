import { notFound } from 'next/navigation'
import { ResenasComercio } from '@/app/comercios/(portal)/_components/resenas-comercio'
import type { ResenaGestion } from '@/lib/resenas/mapeo'
import portal from '@/app/miembros/(portal)/portal.module.css'
import verificar from '@/app/comercios/(portal)/_components/verificar.module.css'

export const metadata = { title: 'Vista previa de reseñas del comercio · ORUM' }

/**
 * Las reseñas de la caja con datos FALSOS, solo en desarrollo. `?caso=vacio`
 * para el estado sin reseñas. Enviar llama a la acción real, que sin sesión de
 * comercio contesta con un error y no escribe nada.
 */

const DIA = 24 * 60 * 60 * 1000
const hace = (dias: number) => new Date(Date.now() - dias * DIA).toISOString()

const RESENAS: ResenaGestion[] = [
  {
    id: 3,
    estrellas: 5,
    mensaje: 'Muy buena atención y el descuento se aplicó sin problema. Volveré.',
    autor: 'María Fernanda Gómez',
    creadaEn: hace(2),
    respuestaComercio: null,
    respuestaComercioAt: null,
    respuestaAdmin: null,
    respuestaAdminAt: null,
  },
  {
    id: 2,
    estrellas: 3,
    mensaje: 'El lugar es bonito pero tardaron en atender un sábado.\nEl café, excelente.',
    autor: 'Andrés Pérez Rojas',
    creadaEn: hace(9),
    respuestaComercio: 'Gracias por contarnos. Reforzamos el equipo los fines de semana.',
    respuestaComercioAt: hace(8),
    respuestaAdmin: 'Hablamos con el comercio y ya lo están resolviendo.',
    respuestaAdminAt: hace(7),
  },
  {
    id: 1,
    estrellas: 4,
    mensaje: null,
    autor: 'Lucía Ramírez',
    creadaEn: hace(30),
    respuestaComercio: null,
    respuestaComercioAt: null,
    respuestaAdmin: null,
    respuestaAdminAt: null,
  },
]

export default async function DevResenasComercioPage({
  searchParams,
}: {
  searchParams: Promise<{ caso?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()
  const vacio = (await searchParams).caso === 'vacio'

  return (
    <div className={portal.portal} data-theme="light" style={{ padding: 24, minHeight: '100dvh' }}>
      <div className={verificar.resenas}>
        <ResenasComercio
          total={vacio ? 0 : 23}
          promedio={vacio ? null : 4}
          resenas={vacio ? [] : RESENAS}
        />
      </div>
    </div>
  )
}
