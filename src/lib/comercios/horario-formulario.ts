import { normalizarHora, validarHorario, type DiaHorario, type HorarioSucursal } from './horario'

/**
 * El editor del panel manda el horario como JSON en un campo oculto
 * (`horario`). Vacío o `[]` es «sin horario cargado».
 */
export function leerHorarioDelFormulario(
  json: string,
): { ok: true; horario: HorarioSucursal } | { ok: false; error: string } {
  const texto = json.trim()
  if (texto === '' || texto === '[]') return { ok: true, horario: [] }

  let crudo: unknown
  try {
    crudo = JSON.parse(texto)
  } catch {
    return { ok: false, error: 'No se pudo leer el horario. Vuelve a intentarlo.' }
  }
  if (!Array.isArray(crudo)) {
    return { ok: false, error: 'No se pudo leer el horario. Vuelve a intentarlo.' }
  }

  const horario: DiaHorario[] = []
  for (const item of crudo) {
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: 'No se pudo leer el horario. Vuelve a intentarlo.' }
    }
    const f = item as Record<string, unknown>
    const horas: (string | null)[] = []
    for (const campo of ['abre', 'cierra', 'almuerzoDesde', 'almuerzoHasta']) {
      const v = f[campo]
      /* Solo `null` es «sin hora». Un texto vacío es una hora BORRADA en un
         día abierto: aceptarla guardaría como «cerrado» lo que la pantalla
         mostraba abierto. */
      if (v === null || v === undefined) {
        horas.push(null)
        continue
      }
      const hora = typeof v === 'string' ? normalizarHora(v) : null
      if (hora === null) {
        return { ok: false, error: 'Hay una hora del horario mal escrita. Usa el formato 09:00.' }
      }
      horas.push(hora)
    }
    horario.push({
      dia: Number(f.dia),
      abre: horas[0],
      cierra: horas[1],
      almuerzoDesde: horas[2],
      almuerzoHasta: horas[3],
    })
  }

  const error = validarHorario(horario)
  return error ? { ok: false, error } : { ok: true, horario }
}

/** Las filas en la forma que espera `reemplazar_horario_sucursal`. */
export function aFilasRpc(horario: HorarioSucursal) {
  return horario.map((f) => ({
    dia: f.dia,
    abre: f.abre,
    cierra: f.cierra,
    almuerzo_desde: f.almuerzoDesde,
    almuerzo_hasta: f.almuerzoHasta,
  }))
}
