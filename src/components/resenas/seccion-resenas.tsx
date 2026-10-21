import { MessageSquareText } from 'lucide-react'
import { EmptyState } from '@/components/ui/feedback'
import { EstrellasLectura } from '@/components/ui/estrellas-lectura'
import { fechaResena } from '@/lib/resenas/acciones'
import { formatearPromedio, type ResenaVista } from '@/lib/resenas/resenas'
import { MiResena } from './mi-resena'
import { TarjetaResena } from './tarjeta-resena'
import estilos from './seccion-resenas.module.css'

/*
  LAS RESEÑAS EN LA FICHA DEL SOCIO
  ---------------------------------------------------------------------------
  Server Component: el resumen y la lista se pintan en el servidor. Lo único
  de cliente es `MiResena` —el botón «Escribir / Editar mi reseña», la
  tarjeta propia con «Borrar» y sus dos ventanas—.

  Solo la monta el Portal de Miembros (la ficha pública no la pinta: las
  reseñas son para socios). Si las reseñas no están disponibles —tabla aún
  sin crear, comercio fuera del club, error de lectura— la sección entera
  desaparece: la ficha no enseña un bloque roto.

  La reseña propia NO se repite en la lista: va arriba, destacada, en su
  tarjeta con las acciones.
*/

export type ResenaSocio = ResenaVista & { esMia: boolean }

type Props = {
  comercioId: number
  /** Para la descripción de la ventana («… cómo te fue en Café X»). */
  comercioNombre?: string
  resumen: { disponible: boolean; total: number; promedio: number | null }
  resenas: ResenaSocio[]
  /** Pista de la base (`puedo_resenar`): compra previa y membresía vigente. */
  puedeResenar: boolean
  miResena: ResenaSocio | null
}

export function SeccionResenas({
  comercioId,
  comercioNombre,
  resumen,
  resenas,
  puedeResenar,
  miResena,
}: Props) {
  if (!resumen.disponible) return null

  const otras = resenas.filter((r) => !r.esMia)
  const mostradas = otras.length + (miResena ? 1 : 0)
  const hayMas = resumen.total > mostradas

  return (
    <section className={estilos.seccion} aria-labelledby="resenas-titulo">
      <header className={estilos.cabecera}>
        <h2 id="resenas-titulo" className={estilos.titulo}>
          Reseñas
        </h2>
        {resumen.total > 0 && (
          <p className={estilos.resumen}>
            <EstrellasLectura valor={resumen.promedio} tamano="md" />
            {/* El número ya lo dice el nombre accesible de las estrellas. */}
            <span className={estilos.promedio} aria-hidden="true">
              {formatearPromedio(resumen.promedio)}
            </span>
            <span className={estilos.conteo}>
              {resumen.total === 1 ? '1 reseña' : `${resumen.total} reseñas`}
            </span>
          </p>
        )}
      </header>

      <MiResena
        comercioId={comercioId}
        comercioNombre={comercioNombre}
        puedeResenar={puedeResenar}
        resena={
          miResena
            ? {
                estrellas: miResena.estrellas,
                mensaje: miResena.mensaje,
                fecha: fechaResena(miResena.creadaEn),
                respuestaComercio: miResena.respuestaComercio,
                respuestaAdmin: miResena.respuestaAdmin,
              }
            : null
        }
      />

      {otras.length > 0 ? (
        <ul className={estilos.lista} aria-label="Reseñas de otros socios">
          {otras.map((r) => (
            <li key={r.id} className={estilos.item}>
              <TarjetaResena
                autor={r.autor}
                estrellas={r.estrellas}
                mensaje={r.mensaje}
                fecha={fechaResena(r.creadaEn)}
                respuestaComercio={r.respuestaComercio}
                respuestaAdmin={r.respuestaAdmin}
              />
            </li>
          ))}
        </ul>
      ) : (
        !miResena && (
          <EmptyState
            className={estilos.vacio}
            icon={<MessageSquareText aria-hidden="true" />}
            title="Sin reseñas todavía"
            description={
              puedeResenar
                ? 'Sé el primero en contar cómo te fue.'
                : 'Cuando los socios califiquen este comercio, lo verás aquí.'
            }
          />
        )
      )}

      {hayMas && (
        <p className={estilos.nota}>Se muestran las {mostradas} reseñas más recientes.</p>
      )}
    </section>
  )
}
