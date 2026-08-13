// src/app/comercios/(portal)/_components/verificacion-tool.tsx
'use client'

import { useState } from 'react'
import { BuscarMiembroForm } from './buscar-miembro-form'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

type Sucursal = { id: number; nombre: string | null }
type Promocion = { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }

/**
 * Envuelve `BuscarMiembroForm` con una `key` que se incrementa después de cada
 * venta registrada, para remontarlo con estado limpio (nuevo número, sin
 * resultado previo) sin recargar la página.
 */
export function VerificacionTool({
  sucursales,
  promociones,
}: {
  sucursales: Sucursal[]
  promociones: Promocion[]
}) {
  const [resetKey, setResetKey] = useState(0)

  return (
    <BuscarMiembroForm
      key={resetKey}
      sucursales={sucursales}
      promociones={promociones}
      onNuevaVerificacion={() => setResetKey((k) => k + 1)}
    />
  )
}
