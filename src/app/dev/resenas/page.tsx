import { notFound } from 'next/navigation'
import { FichaComercio } from '@/components/comercios/ficha-comercio'
import { SeccionResenas, type ResenaSocio } from '@/components/resenas/seccion-resenas'
import portal from '@/app/miembros/(portal)/portal.module.css'
import estilos from './resenas.module.css'

export const metadata = {
  title: 'Vista previa de reseñas · ORUM',
}

/**
 * Las reseñas de la ficha del socio con datos FALSOS, solo en desarrollo.
 *
 * La ficha real exige un socio con membresía vigente y una compra en el
 * comercio; aquí se monta sin base ni sesión para revisar los estados:
 * `?caso=vacio`, `?caso=sin-boton`, `?caso=nueva` o, por defecto, con reseñas
 * y la propia. Los botones abren las ventanas de verdad; enviar llama a la
 * acción real, que sin sesión de socio redirige al acceso.
 */

const DIA = 24 * 60 * 60 * 1000
const hace = (dias: number) => new Date(Date.now() - dias * DIA).toISOString()

const OTRAS: ResenaSocio[] = [
  {
    id: 3,
    estrellas: 5,
    mensaje: 'Muy buena atención y el descuento se aplicó sin problema. Volveré.',
    autor: 'María G.',
    creadaEn: hace(2),
    respuestaComercio: '¡Gracias, María! Te esperamos pronto.',
    respuestaAdmin: null,
    esMia: false,
  },
  {
    id: 2,
    estrellas: 3,
    mensaje:
      'El lugar es bonito pero tardaron en atender un sábado al mediodía.\nEl café, excelente.',
    autor: 'Andrés P.',
    creadaEn: hace(9),
    respuestaComercio: 'Gracias por contarnos. Reforzamos el equipo los fines de semana.',
    respuestaAdmin: 'Hablamos con el comercio y ya lo están resolviendo.',
    esMia: false,
  },
  {
    id: 1,
    estrellas: 4,
    mensaje: null,
    autor: 'Lucía R.',
    creadaEn: hace(30),
    respuestaComercio: null,
    respuestaAdmin: null,
    esMia: false,
  },
]

const MIA: ResenaSocio = {
  id: 4,
  estrellas: 4,
  mensaje: 'Buen beneficio. La sede del centro es la más cómoda.',
  autor: 'Tú',
  creadaEn: hace(1),
  respuestaComercio: 'Gracias por elegirnos.',
  respuestaAdmin: null,
  esMia: true,
}

function caso(nombre: string | undefined) {
  switch (nombre) {
    case 'vacio':
      return { resenas: [], mia: null, puede: true, total: 0, promedio: null }
    case 'sin-boton':
      return { resenas: OTRAS, mia: null, puede: false, total: 3, promedio: 4 }
    case 'nueva':
      return { resenas: OTRAS, mia: null, puede: true, total: 3, promedio: 4 }
    default:
      return { resenas: [MIA, ...OTRAS], mia: MIA, puede: true, total: 4, promedio: 4 }
  }
}

export default async function DevResenasPage({
  searchParams,
}: {
  searchParams: Promise<{ caso?: string }>
}) {
  if (process.env.NODE_ENV === 'production') notFound()

  const c = caso((await searchParams).caso)

  return (
    <div className={`${portal.portal} ${estilos.marco}`} data-theme="light">
      <FichaComercio
        nombre="Café de prueba"
        detalle="Restaurantes · Bogotá"
        logoUrl={null}
        portadaUrl={null}
        sedes={[]}
        descripcion="Un comercio inventado para revisar las reseñas sin base de datos."
        fotos={[]}
        beneficio={<p>Beneficio de ejemplo</p>}
        resenas={
          <SeccionResenas
            comercioId={999999}
            comercioNombre="Café de prueba"
            resumen={{ disponible: true, total: c.total, promedio: c.promedio }}
            resenas={c.resenas}
            puedeResenar={c.puede}
            miResena={c.mia}
          />
        }
      />
    </div>
  )
}
