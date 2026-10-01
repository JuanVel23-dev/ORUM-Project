'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useField } from '@/components/ui/field'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import controles from '@/components/ui/input.module.css'
import estilos from './selector-opciones.module.css'

/*
  EL DESPLEGABLE DEL FORMULARIO DE ALIADOS  ·  29/09/2026
  --------------------------------------------------------------------------
  Encargo del propietario: la lista que se abre «no tiene diseño» —la del
  `<select>` nativo la dibuja el sistema y no admite estilo— y el campo tiene
  que verse como los demás, sin color ni iconos.

  Así que el CONTROL es el mismo campo que `Input` (misma clase `.control`:
  filo, radio, hover y foco idénticos) y la LISTA es el menú del sistema
  (`DropdownMenu`): superficie flotante con sombra, entrada animada, teclado
  con flechas/Inicio/Fin y la opción elegida con check y fondo dorado. Es el
  mismo menú que ya usan los filtros de Ciudad y Ordenar del directorio.

  El valor viaja en un `<input type="hidden">` con el `name` del campo, así
  que la server action lo recibe exactamente igual que recibía el `<select>`.
*/

type Props = {
  name: string
  /** El nombre del campo, para que el lector anuncie «Ciudad: Tuluá». */
  etiqueta: string
  opciones: readonly string[]
  /** Texto mientras no se ha elegido nada. */
  invitacion: string
  defaultValue?: string
}

export function SelectorOpciones({ name, etiqueta, opciones, invitacion, defaultValue }: Props) {
  const { id, describedBy, invalid } = useField()
  const [valor, setValor] = useState(defaultValue ?? '')

  return (
    <div className={estilos.selector}>
      <input type="hidden" name={name} value={valor} />

      <DropdownMenu
        align="start"
        trigger={
          <button
            type="button"
            id={id || undefined}
            aria-label={`${etiqueta}: ${valor || 'sin elegir'}`}
            /* Sin `aria-invalid`: un `button` no lo admite. El error llega
               igual al lector por `aria-describedby`, que apunta al mensaje
               del `Field`; el filo rojo lo pone `.invalido`. */
            aria-describedby={describedBy}
            className={[controles.control, estilos.disparador, invalid && estilos.invalido]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={valor ? estilos.valor : estilos.invitacion}>{valor || invitacion}</span>
            <ChevronDown size={16} aria-hidden="true" className={estilos.flecha} />
          </button>
        }
      >
        {opciones.map((opcion) => (
          <MenuItem key={opcion} selected={opcion === valor} onSelect={() => setValor(opcion)}>
            {opcion}
          </MenuItem>
        ))}
      </DropdownMenu>
    </div>
  )
}
