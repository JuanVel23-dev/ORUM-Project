'use client'

import { useId, type ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { MenuItem, MenuLabel } from '@/components/ui/menu'
import { useTheme } from '@/components/theme/theme-provider'
import type { ThemeMode } from '@/components/theme/theme-constantes'

/*
  EL TEMA, DENTRO DEL MENÚ DE LA CUENTA.

  Antes vivía suelto en la cabecera como `ThemeToggle`: dos objetivos táctiles
  compitiendo por el poco ancho que deja el nombre del comercio, y uno de ellos
  —el tema— se toca una vez en la vida. Bajarlo al menú deja la cabecera con un
  solo control y devuelve ese ancho al nombre, que es lo que dice QUIÉN está
  operando la caja.

  NO se reutiliza `ThemeToggle` aquí, y la razón está verificada en el Portal de
  Miembros (`miembros/(portal)/_components/menu-tema.tsx`):

  1. `SegmentedControl` renderiza `<input type="radio">`. Este menú vive DENTRO
     de `<form action={cerrarSesionComercio}>`, así que con el foco en un radio
     la tecla Enter dispara la submisión implícita: pulsar Enter sobre «Claro»
     CERRARÍA LA SESIÓN en mitad de una venta.
  2. `DropdownMenu` mueve el foco entre elementos con rol de opción de menú, y
     un radio no lo es: las flechas se lo saltarían.

  ⚠️ DUPLICADO CONSCIENTE, y con fecha de caducidad. Este archivo es gemelo del
  de Miembros. Lo correcto —y lo que pide la spec (§10.2)— es que `MenuTema`
  suba a `src/components/theme/`, junto a `theme-provider` y `theme-toggle`,
  ahora que lo usan dos portales. Ese movimiento obliga a editar el layout del
  Portal de Miembros, que está fuera del alcance de esta tanda (Z3) y en manos
  de otro agente. Cuando se libere: mover el de Miembros a
  `src/components/theme/menu-tema.tsx`, apuntar los dos portales ahí y BORRAR
  este archivo.
*/

const ICONO = 16

const OPCIONES: ReadonlyArray<{
  value: ThemeMode
  label: string
  icon: ReactNode
}> = [
  { value: 'system', label: 'Automático', icon: <Monitor size={ICONO} /> },
  { value: 'light', label: 'Claro', icon: <Sun size={ICONO} /> },
  { value: 'dark', label: 'Oscuro', icon: <Moon size={ICONO} /> },
]

export function MenuTema() {
  /*
    `mode` sale de `useSyncExternalStore` (localStorage + matchMedia), nunca de
    `useState` + `useEffect`. Durante la hidratación vale 'system', que es el
    snapshot de servidor; el menú está cerrado en ese instante, así que el check
    no salta a la vista de nadie.
  */
  const { mode, setMode } = useTheme()
  const idEtiqueta = useId()

  return (
    /* `group` con encabezado real: el lector anuncia «Tema, Claro, marcado». */
    <div role="group" aria-labelledby={idEtiqueta}>
      <MenuLabel id={idEtiqueta}>Tema</MenuLabel>

      {OPCIONES.map(({ value, label, icon }) => (
        <MenuItem
          key={value}
          icon={icon}
          selected={mode === value}
          onSelect={() => setMode(value)}
        >
          {label}
        </MenuItem>
      ))}
    </div>
  )
}
