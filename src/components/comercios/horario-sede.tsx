'use client'

import { useSyncExternalStore } from 'react'
import { diaDeSemanaISO } from '@/lib/comercios/dias-promocion'
import { esFestivoColombia } from '@/lib/comercios/festivos-colombia'
import {
  ahoraEnBogota,
  estadoAhora,
  resumenHorario,
  textoEstado,
  textoGrupo,
  textoJornada,
  type HorarioSucursal,
} from '@/lib/comercios/horario'
import estilos from './horario-sede.module.css'

/*
  El horario de una sede en la ficha, con el estado «Abierto ahora».

  Es de CLIENTE a propósito: las fichas salen de caché (`updateTag('publico')`)
  y un «abierto ahora» calculado en el servidor se quedaría viejo. El servidor
  pinta la semana tal cual; ya en el navegador se añaden la línea de estado y
  el día de hoy en negrita. `getServerSnapshot` devuelve `null`, así que no
  hay desajuste de hidratación ni parpadeo del estado.
*/

function suscribirAlMinuto(avisar: () => void) {
  const id = setInterval(avisar, 60_000)
  return () => clearInterval(id)
}

/** El minuto actual: estable dentro del minuto, así React solo repinta al cambiar. */
const minutoActual = () => Math.floor(Date.now() / 60_000)
const enServidor = () => null

export function HorarioSede({ horario }: { horario: HorarioSucursal }) {
  const minuto = useSyncExternalStore(suscribirAlMinuto, minutoActual, enServidor)
  if (horario.length === 0) return null

  const { grupos, festivos } = resumenHorario(horario)

  const instante = minuto === null ? null : new Date(minuto * 60_000)
  const estado = instante ? estadoAhora(horario, instante) : null
  const hoy = instante ? ahoraEnBogota(instante).fecha : null
  const hoyEsFestivo = hoy !== null && festivos !== null && esFestivoColombia(hoy)
  const diaHoy = hoy !== null ? diaDeSemanaISO(hoy) : null

  return (
    <div className={estilos.horario}>
      {estado && estado.tipo !== 'sin_horario' && (
        <p className={estilos.estado} data-tipo={estado.tipo}>
          <span className={estilos.punto} aria-hidden="true" />
          {textoEstado(estado)}
        </p>
      )}
      <ul className={estilos.lista} aria-label="Horario de atención">
        {grupos.map((g) => {
          const esHoy = !hoyEsFestivo && diaHoy !== null && g.dias.includes(diaHoy)
          return (
            <li key={g.dias[0]} className={estilos.item} data-hoy={esHoy ? 'true' : undefined}>
              {textoGrupo(g)}
              {esHoy && <span className="sr-only"> (hoy)</span>}
            </li>
          )
        })}
        {festivos && (
          <li className={estilos.item} data-hoy={hoyEsFestivo ? 'true' : undefined}>
            Festivos · {textoJornada(festivos)}
            {hoyEsFestivo && <span className="sr-only"> (hoy)</span>}
          </li>
        )}
      </ul>
    </div>
  )
}
