'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useField } from './field'
import { DropdownMenu, MenuItem } from './menu'
import styles from './select-menu.module.css'

/*
  UN DESPLEGABLE CON DISEÑO  ·  04/10/2026
  ---------------------------------------------------------------------------
  Encargo del propietario, sobre la sucursal de la venta en la caja: «ponle
  diseño a la lista desplegable». El `<select>` del sistema pinta SU lista —en
  Windows, un recuadro gris con la selección en azul— y esa lista no se puede
  vestir con CSS.

  Esto es el mismo control con la lista del sitio: el campo se ve como
  cualquier otro (`Input`, `Select`) y lo que se despliega es el `DropdownMenu`
  que ya usan «Ciudad» y «Ordenar» en el directorio — la superficie flotante,
  la entrada escalonada, el check en la elegida.

  QUÉ ES Y QUÉ NO:

    · Es un BOTÓN que abre un menú de opciones excluyentes (`menuitemradio`),
      no un `<select>` disfrazado. El valor viaja en un `<input type="hidden">`
      con el `name` que se le pase, así que el formulario lo envía igual.
    · NO valida solo: un campo oculto no admite `required`. Quien lo use
      comprueba el valor al enviar y le pasa el error al `Field` (en el
      panel, `useValidacion` lo hace: el campo oculto avisa con `input`).
    · Desde el rediseño del panel (15/10/2026: «las listas desplegables no
      tienen diseño») es TAMBIÉN el desplegable de todos los formularios de
      administración. `Select` queda para donde no haya otro remedio.

  Va DENTRO de un `Field`, que le da el `id` (para que la etiqueta lo enfoque
  al pulsarla) y la descripción (ayuda y error).

  EL NOMBRE ACCESIBLE lo lleva `aria-label`, con la etiqueta y lo elegido
  («Sucursal: Sede Centro»). Sin él, el nombre de un botón asociado a un
  `<label>` es solo la etiqueta, y el lector no diría qué hay elegido.
*/

export type OpcionSelectMenu = { value: string; label: string }

type Props = {
  /** Nombre con el que viaja en el formulario. */
  name: string
  /** El texto del `Field` que lo envuelve: forma parte del nombre accesible. */
  etiqueta: string
  opciones: OpcionSelectMenu[]
  /**
   * El `value` elegido; cadena vacía si aún no hay ninguno. Sin `value`, el
   * control guarda su propio estado y arranca en `defaultValue` (así lo usan
   * los formularios del panel, como un `<select>` cualquiera).
   */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Lo que se lee cuando no hay nada elegido. */
  placeholder?: string
}

export function SelectMenu({
  name,
  etiqueta,
  opciones,
  value: controlado,
  defaultValue = '',
  onChange,
  placeholder = 'Selecciona una opción',
}: Props) {
  const { id, describedBy, invalid } = useField()
  const [propio, setPropio] = useState(defaultValue)
  const value = controlado ?? propio
  const elegida = opciones.find((o) => o.value === value)
  const oculto = useRef<HTMLInputElement>(null)
  const montado = useRef(false)

  /*
    Al cambiar, el campo oculto avisa con un `input` que BURBUJEA: así el
    formulario que lo contiene se entera como con cualquier otro control (la
    validación del panel quita el aviso en cuanto se elige algo). No al montar.
  */
  useEffect(() => {
    if (!montado.current) {
      montado.current = true
      return
    }
    oculto.current?.dispatchEvent(new Event('input', { bubbles: true }))
  }, [value])

  function elegir(nuevo: string) {
    if (controlado === undefined) setPropio(nuevo)
    onChange?.(nuevo)
  }

  return (
    <span className={styles.envoltorio} data-campo="">
      <input ref={oculto} type="hidden" name={name} value={value} />

      <DropdownMenu
        align="start"
        igualarAncho
        trigger={
          <button
            type="button"
            id={id || undefined}
            className={styles.control}
            aria-haspopup="menu"
            aria-label={`${etiqueta}: ${elegida?.label ?? placeholder}`}
            aria-describedby={describedBy}
            data-invalido={invalid || undefined}
          >
            <span className={elegida ? styles.valor : styles.placeholder}>
              {elegida?.label ?? placeholder}
            </span>
            <ChevronDown className={styles.flecha} aria-hidden="true" />
          </button>
        }
      >
        {/* Desplaza por dentro si son muchas: el menú no tiene tope de alto. */}
        <div className={styles.lista} data-barra="" data-desvanece="">
          {opciones.map((o) => (
            <MenuItem key={o.value} selected={o.value === value} onSelect={() => elegir(o.value)}>
              {o.label}
            </MenuItem>
          ))}
        </div>
      </DropdownMenu>
    </span>
  )
}
