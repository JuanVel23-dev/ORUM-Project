'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented'
import { useTheme } from './theme-provider'
import type { ThemeMode } from './theme-script'

const ICONO = { width: 15, height: 15 } as const

const OPCIONES: ReadonlyArray<SegmentedOption<ThemeMode>> = [
  { value: 'system', label: 'Auto', icon: <Monitor {...ICONO} aria-hidden /> },
  { value: 'light', label: 'Claro', icon: <Sun {...ICONO} aria-hidden /> },
  { value: 'dark', label: 'Oscuro', icon: <Moon {...ICONO} aria-hidden /> },
]

/**
 * Selector de tema de tres posiciones.
 *
 * `Auto` es un estado real —seguir al sistema—, no la ausencia de elección.
 * Por eso es un control segmentado y no un interruptor.
 */
export function ThemeToggle({ compactOnMobile = true }: { compactOnMobile?: boolean }) {
  const { mode, setMode, mounted } = useTheme()

  return (
    <SegmentedControl
      options={OPCIONES}
      value={mode}
      onChange={setMode}
      ariaLabel="Tema de la interfaz"
      compactOnMobile={compactOnMobile}
      // Durante la hidratación aún no se conoce la preferencia guardada:
      // mostrar el indicador lo haría saltar de posición al resolverse.
      indicatorHidden={!mounted}
    />
  )
}
