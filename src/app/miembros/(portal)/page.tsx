import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { obtenerDirectorioPublico } from '@/lib/publico/datos-publicos'
import { DirectorioComercios } from '@/components/comercios/directorio-comercios'

export const metadata = { title: 'Comercios y beneficios · ORUM' }

/*
  EL INICIO DEL SOCIO  ·  el directorio de `/explorar` (29/09/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «quiero que sea igual [a /explorar]; vamos a
  quitar todos los apartados existentes para que sea igual». Se retiraron
  novedades, favoritos, más recientes, el top del club y el catálogo propio:
  el Inicio es el MISMO componente que el directorio público
  (`DirectorioComercios`), con dos diferencias que hacen al socio:

    · el beneficio de cada comercio se LEE (en la fachada va desenfocado);
    · cada tarjeta lleva a la ficha del socio (`/miembros/comercios/[id]`).

  Los datos son los del directorio público (`obtenerDirectorioPublico`): la
  misma lista de comercios activos, con su beneficio destacado. Nada de lo
  que se muestra aquí es privado del socio.
*/
export default async function MiembrosHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireMiembroVigente()

  const [crudos, directorio] = await Promise.all([searchParams, obtenerDirectorioPublico()])

  return (
    <DirectorioComercios
      base="/miembros"
      crudos={crudos}
      directorio={directorio}
      bajada="Descubre todos los comercios aliados de ORUM y disfruta tus beneficios con tu carnet."
      socio
    />
  )
}
