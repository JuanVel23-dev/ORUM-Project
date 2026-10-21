import { EstrellasLectura } from '@/components/ui/estrellas-lectura'
import estilos from './seccion-resenas.module.css'

/*
  UNA RESEÑA con sus respuestas debajo. Sin directiva: la pintan la lista
  (servidor) y la tarjeta propia (`MiResena`, cliente). Sin superficie: la
  pone quien la usa.
*/

type TarjetaProps = {
  autor: string
  estrellas: number
  mensaje: string | null
  fecha: string
  respuestaComercio: string | null
  respuestaAdmin: string | null
}

export function TarjetaResena({
  autor,
  estrellas,
  mensaje,
  fecha,
  respuestaComercio,
  respuestaAdmin,
}: TarjetaProps) {
  return (
    <article className={estilos.resena}>
      <div className={estilos.resenaCabeza}>
        <p className={estilos.autor}>{autor}</p>
        <EstrellasLectura valor={estrellas} />
        {fecha && <p className={estilos.fecha}>{fecha}</p>}
      </div>
      {mensaje && <p className={estilos.mensaje}>{mensaje}</p>}
      {respuestaComercio && (
        <Respuesta quien="Respuesta del comercio" texto={respuestaComercio} />
      )}
      {respuestaAdmin && <Respuesta quien="Respuesta de ORUM" texto={respuestaAdmin} />}
    </article>
  )
}

function Respuesta({ quien, texto }: { quien: string; texto: string }) {
  return (
    <div className={estilos.respuesta}>
      <p className={estilos.respuestaQuien}>{quien}</p>
      <p className={estilos.respuestaTexto}>{texto}</p>
    </div>
  )
}
