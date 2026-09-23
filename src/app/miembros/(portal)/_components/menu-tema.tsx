'use client'

import { useId, type ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { MenuItem, MenuLabel } from '@/components/ui/menu'
import { useTheme } from '@/components/theme/theme-provider'
import type { ThemeMode } from '@/components/theme/theme-constantes'

/*
  El conmutador de tema DEL PORTAL, en forma de tres filas de menú.

  No se reutiliza `ThemeToggle` —que es un `SegmentedControl`— y la razón no es
  estética, está verificada:

  1. `SegmentedControl` renderiza `<input type="radio">` dentro de un
     `role="radiogroup"` (`segmented.tsx:56,70`). Este menú vive DENTRO de
     `<form action={cerrarSesionMiembro}>`, así que con el foco en un radio la
     tecla Enter dispara la submisión implícita del formulario: pulsar Enter
     sobre "Claro" CERRABA LA SESIÓN.
  2. `DropdownMenu` mueve el foco entre elementos con rol de opción de menú, y
     un `<input type="radio">` no lo es: las flechas se lo saltaban.

  `MenuItem` sin `submit` renderiza `<button type="button">`, que dentro de un
  formulario no envía nada. Con `selected` pasa a `menuitemradio`, que es
  exactamente lo que es: una elección excluyente dentro de un menú.

  Es el único componente de cliente que gana el cromo, y se paga UNA vez por
  pantalla —no por fila, como costaría en el catálogo—.
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
    snapshot de servidor; el menú está cerrado en ese instante, así que el
    check no salta a la vista de nadie. Cambiar de tema no recarga: el store
    notifica y el provider estampa `data-theme` en <html>.
  */
  const { mode, setMode } = useTheme()
  const idEtiqueta = useId()

  return (
    /* `group` con su encabezado real: el lector anuncia "Tema, Claro, marcado".
       Un `aria-label` suelto diría lo mismo hasta que alguien cambiase el texto
       visible y se olvidase del otro. */
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
