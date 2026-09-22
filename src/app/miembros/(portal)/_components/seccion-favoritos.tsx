import { Heart } from 'lucide-react'
import { CintaRotativa } from './cinta-rotativa'
import { ComercioCardCompacta, type ComercioListado } from './comercio-card'
import estilos from './seccion-favoritos.module.css'

/*
  «TUS FAVORITOS»  ·  encargo nº 3
  ---------------------------------------------------------------------------
  ES LA ÚNICA SECCIÓN DEL CATÁLOGO QUE SE PINTA VACÍA, y es una excepción
  argumentada a la regla de los vacíos.

  Todas las demás —la portada, las estanterías, el top del club— desaparecen
  cuando no tienen contenido: sus elementos están igualmente en la rejilla, así
  que un encabezado sobre un hueco solo restaría espacio al primer pantallazo.

  Esta no puede: **favoritos no existe hasta que alguien lo estrena.** Si la
  sección solo apareciera cuando ya hay favoritos, nadie descubriría que el
  corazón de las tarjetas guarda algo en alguna parte, y la función estaría
  construida y muerta. El vacío aquí no informa de una ausencia: enseña un
  mecanismo.

  De ahí que el vacío no sea un `EmptyState` de página entera —que gritaría
  demasiado para algo que no ha fallado— sino una franja de una línea que dice
  qué hacer y con qué gesto.

  Server Component. Los corazones de dentro son los únicos clientes.
*/

export function SeccionFavoritos({
  favoritos,
  volver = null,
}: {
  favoritos: ComercioListado[]
  volver?: string | null
}) {
  if (favoritos.length === 0) {
    return (
      <section className={estilos.invitacion} aria-labelledby="favoritos-vacio">
        {/*
          `h2`: el mismo nivel que las estanterías y que "Todos los comercios".
          La jerarquía del documento no cambia porque la sección esté vacía.
        */}
        <h2 id="favoritos-vacio" className={estilos.titulo}>
          <Heart size={16} aria-hidden="true" className={estilos.corazon} />
          Tus favoritos
        </h2>

        {/*
          El copy nombra el GESTO y el SITIO —el corazón, la esquina de la
          tarjeta—, no la funcionalidad. "Aún no tienes favoritos" describe un
          hueco; esto enseña a salir de él.
        */}
        <p className={estilos.texto}>
          Toca el corazón de cualquier comercio para tenerlo siempre a mano. Los que
          marques aparecerán aquí.
        </p>
      </section>
    )
  }

  return (
    <CintaRotativa
              titulo="Tus favoritos"
              apoyo="Los comercios que marcaste con el corazón"
              items={favoritos.map((c) => (
                <ComercioCardCompacta key={c.id} comercio={c} volver={volver} />
              ))}
            />
  )
}
