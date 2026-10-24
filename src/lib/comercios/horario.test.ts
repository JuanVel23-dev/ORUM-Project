import { describe, expect, it } from 'vitest'
import {
  DIA_FESTIVOS,
  estadoAhora,
  formatearHora,
  normalizarHora,
  resumenHorario,
  textoGrupo,
  validarHorario,
  type DiaHorario,
  type HorarioSucursal,
} from './horario'

const dia = (
  n: number,
  abre: string | null,
  cierra: string | null,
  almuerzo: [string, string] | null = null,
): DiaHorario => ({
  dia: n,
  abre,
  cierra,
  almuerzoDesde: almuerzo?.[0] ?? null,
  almuerzoHasta: almuerzo?.[1] ?? null,
})

/** Un instante a partir de la hora de pared de Bogotá (UTC−5). */
const bogota = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00-05:00`)

/** Lunes a viernes 09:00–18:00 con almuerzo 12:00–13:00. */
const SEMANA: HorarioSucursal = [1, 2, 3, 4, 5].map((n) => dia(n, '09:00', '18:00', ['12:00', '13:00']))

describe('normalizarHora', () => {
  it('quita los segundos que devuelve la base', () => {
    expect(normalizarHora('08:00:00')).toBe('08:00')
  })
  it('rechaza lo que no es una hora', () => {
    expect(normalizarHora('x')).toBeNull()
    expect(normalizarHora('25:00')).toBeNull()
    expect(normalizarHora(null)).toBeNull()
  })
})

describe('formatearHora', () => {
  it('pasa a 12 horas con a. m. / p. m.', () => {
    expect(formatearHora('09:00')).toBe('9:00 a. m.')
    expect(formatearHora('12:00')).toBe('12:00 p. m.')
    expect(formatearHora('00:00')).toBe('12:00 a. m.')
    expect(formatearHora('23:59')).toBe('11:59 p. m.')
  })
})

describe('validarHorario', () => {
  it('acepta una jornada con almuerzo dentro', () => {
    expect(validarHorario([dia(1, '09:00', '18:00', ['12:00', '13:00'])])).toBeNull()
  })
  it('acepta cierre pasada la medianoche y 24 horas', () => {
    expect(validarHorario([dia(5, '22:00', '02:00')])).toBeNull()
    expect(validarHorario([dia(6, '00:00', '23:59')])).toBeNull()
  })
  it('acepta un día cerrado y el de festivos', () => {
    expect(validarHorario([dia(7, null, null), dia(DIA_FESTIVOS, '10:00', '16:00')])).toBeNull()
  })
  it('rechaza un almuerzo con una sola hora', () => {
    const fila: DiaHorario = { ...dia(1, '09:00', '18:00'), almuerzoDesde: '12:00' }
    expect(validarHorario([fila])).toMatch(/almuerzo/i)
  })
  it('rechaza un almuerzo en un día cerrado', () => {
    expect(validarHorario([dia(1, null, null, ['12:00', '13:00'])])).toMatch(/almuerzo/i)
  })
  it('rechaza un almuerzo fuera de la jornada', () => {
    expect(validarHorario([dia(1, '09:00', '18:00', ['08:00', '10:00'])])).toMatch(/almuerzo/i)
    expect(validarHorario([dia(1, '09:00', '18:00', ['17:30', '19:00'])])).toMatch(/almuerzo/i)
  })
  it('rechaza abrir y cerrar a la misma hora', () => {
    expect(validarHorario([dia(1, '09:00', '09:00')])).not.toBeNull()
  })
  it('rechaza una sola de las dos horas de la jornada', () => {
    expect(validarHorario([dia(1, '09:00', null)])).not.toBeNull()
  })
  it('rechaza una hora mal formada', () => {
    expect(validarHorario([dia(1, '25:00', '18:00')])).not.toBeNull()
  })
  it('rechaza un día fuera de 1–8 o repetido', () => {
    expect(validarHorario([dia(9, '09:00', '18:00')])).not.toBeNull()
    expect(validarHorario([dia(1, '09:00', '18:00'), dia(1, '10:00', '17:00')])).not.toBeNull()
  })
})

describe('estadoAhora', () => {
  it('sin filas no hay horario', () => {
    expect(estadoAhora([], bogota('2026-10-26', '10:00'))).toEqual({
      tipo: 'sin_horario',
      proximo: null,
    })
  })

  it('lunes 10:00 está abierto hasta el almuerzo', () => {
    expect(estadoAhora(SEMANA, bogota('2026-10-26', '10:00'))).toEqual({
      tipo: 'abierto',
      proximo: { cuando: 'hoy', hora: '12:00' },
    })
  })

  it('lunes 12:30 está en pausa de almuerzo', () => {
    expect(estadoAhora(SEMANA, bogota('2026-10-26', '12:30'))).toEqual({
      tipo: 'almuerzo',
      proximo: { cuando: 'hoy', hora: '13:00' },
    })
  })

  it('lunes 19:00 está cerrado y abre mañana', () => {
    expect(estadoAhora(SEMANA, bogota('2026-10-26', '19:00'))).toEqual({
      tipo: 'cerrado',
      proximo: { cuando: 'manana', hora: '09:00' },
    })
  })

  it('el sábado cerrado dice que abre el lunes', () => {
    expect(estadoAhora(SEMANA, bogota('2026-10-24', '10:00'))).toEqual({
      tipo: 'cerrado',
      proximo: { cuando: 1, hora: '09:00' },
    })
  })

  it('el cierre pasada la medianoche cuenta para el día siguiente', () => {
    const bar = [dia(1, '22:00', '02:00')]
    expect(estadoAhora(bar, bogota('2026-10-27', '01:00'))).toEqual({
      tipo: 'abierto',
      proximo: { cuando: 'hoy', hora: '02:00' },
    })
    expect(estadoAhora(bar, bogota('2026-10-27', '03:00')).tipo).toBe('cerrado')
  })

  it('el día y la hora salen de Bogotá, no de UTC', () => {
    // 03:00Z del 24 de octubre es viernes 23, 22:00 en Bogotá.
    const viernes = [dia(5, '18:00', '23:00')]
    expect(estadoAhora(viernes, new Date('2026-10-24T03:00:00Z')).tipo).toBe('abierto')
  })

  it('un festivo manda la fila de festivos sobre la del día', () => {
    const conFestivos = [...SEMANA, dia(DIA_FESTIVOS, '10:00', '16:00')]
    // Lunes 18 de mayo de 2026 es festivo: a las 17:00 el lunes normal estaría abierto.
    expect(estadoAhora(conFestivos, bogota('2026-05-18', '17:00')).tipo).toBe('cerrado')
    expect(estadoAhora(conFestivos, bogota('2026-05-18', '11:00')).tipo).toBe('abierto')
  })

  it('un festivo con la fila de festivos cerrada no abre', () => {
    const cerradoFestivos = [...SEMANA, dia(DIA_FESTIVOS, null, null)]
    expect(estadoAhora(cerradoFestivos, bogota('2026-05-18', '10:00')).tipo).toBe('cerrado')
  })

  it('sin fila de festivos, el festivo se rige por su día de la semana', () => {
    expect(estadoAhora(SEMANA, bogota('2026-05-18', '10:00')).tipo).toBe('abierto')
  })
})

describe('resumenHorario', () => {
  it('junta los días consecutivos iguales', () => {
    const { grupos, festivos } = resumenHorario(SEMANA)
    expect(grupos).toHaveLength(1)
    expect(grupos[0].dias).toEqual([1, 2, 3, 4, 5])
    expect(festivos).toBeNull()
  })

  it('separa el sábado distinto y deja fuera el domingo sin fila', () => {
    const { grupos } = resumenHorario([...SEMANA, dia(6, '10:00', '14:00')])
    expect(grupos.map((g) => g.dias)).toEqual([[1, 2, 3, 4, 5], [6]])
  })

  it('no junta días iguales separados por un día distinto', () => {
    const { grupos } = resumenHorario([
      dia(1, '09:00', '18:00'),
      dia(2, '10:00', '14:00'),
      dia(3, '09:00', '18:00'),
    ])
    expect(grupos.map((g) => g.dias)).toEqual([[1], [2], [3]])
  })

  it('devuelve aparte la fila de festivos', () => {
    const { festivos } = resumenHorario([...SEMANA, dia(DIA_FESTIVOS, null, null)])
    expect(festivos?.dia).toBe(DIA_FESTIVOS)
  })
})

describe('textoGrupo', () => {
  it('dice el rango de días, la jornada y el almuerzo', () => {
    const { grupos } = resumenHorario(SEMANA)
    expect(textoGrupo(grupos[0])).toBe(
      'Lun–vie · 9:00 a. m. – 6:00 p. m. · Almuerzo 12:00 p. m. – 1:00 p. m.',
    )
  })

  it('un día cerrado dice Cerrado', () => {
    const { grupos } = resumenHorario([dia(6, null, null)])
    expect(textoGrupo(grupos[0])).toBe('Sáb · Cerrado')
  })
})
