import { describe, it, expect } from 'vitest'
import {
  generarNumeroMembresia,
  calcularFechaFin,
  calcularFechaInicioRenovacion,
  derivarEstadoMembresia,
  venceProximamente,
} from './membresias'

describe('generarNumeroMembresia', () => {
  it('produce 8 dígitos: 4 secuenciales + 4 aleatorios', () => {
    const n = generarNumeroMembresia(42, () => 7318)
    expect(n).toBe('00427318')
  })

  it('rellena la parte aleatoria con ceros a la izquierda', () => {
    const n = generarNumeroMembresia(1, () => 5)
    expect(n).toBe('00010005')
  })

  it('mantiene 8 dígitos cuando la secuencia tiene 4 cifras', () => {
    const n = generarNumeroMembresia(9999, () => 1234)
    expect(n).toBe('99991234')
  })
})

describe('calcularFechaFin', () => {
  it('suma meses en un caso simple', () => {
    expect(calcularFechaFin('2026-07-22', 1)).toBe('2026-08-22')
  })

  it('suma 12 meses (un año)', () => {
    expect(calcularFechaFin('2026-07-22', 12)).toBe('2027-07-22')
  })

  it('ajusta al último día cuando el mes destino es más corto', () => {
    expect(calcularFechaFin('2026-01-31', 1)).toBe('2026-02-28')
  })
})

describe('calcularFechaInicioRenovacion', () => {
  it('empieza el día siguiente al fin si la vigente aún no vence', () => {
    expect(calcularFechaInicioRenovacion('2026-07-22', '2026-08-10')).toBe('2026-08-11')
  })

  it('empieza hoy si la vigente ya venció', () => {
    expect(calcularFechaInicioRenovacion('2026-07-22', '2026-07-01')).toBe('2026-07-22')
  })

  it('empieza hoy si no hay membresía anterior', () => {
    expect(calcularFechaInicioRenovacion('2026-07-22', null)).toBe('2026-07-22')
  })
})

describe('derivarEstadoMembresia', () => {
  const HOY = '2026-08-06'

  it('activa con fecha futura => activa, con los días que quedan', () => {
    expect(derivarEstadoMembresia('activa', '2026-09-05', HOY)).toEqual({
      activa: true,
      diasRestantes: 30,
    })
  })

  it('vence HOY => sigue activa (el día pagado cuenta entero)', () => {
    expect(derivarEstadoMembresia('activa', HOY, HOY)).toEqual({
      activa: true,
      diasRestantes: 0,
    })
  })

  it('activa en BD pero con fecha pasada => inactiva por vencida', () => {
    // El caso que motiva esta función: nada cambia la columna al vencer, así
    // que sin derivar mostraríamos "Activa" a quien no paga desde mayo.
    expect(derivarEstadoMembresia('activa', '2026-05-01', HOY)).toEqual({
      activa: false,
      motivo: 'vencida',
    })
  })

  it('venció ayer => inactiva', () => {
    expect(derivarEstadoMembresia('activa', '2026-08-05', HOY)).toEqual({
      activa: false,
      motivo: 'vencida',
    })
  })

  it('cancelada manda aunque le queden días pagados', () => {
    expect(derivarEstadoMembresia('cancelada', '2026-12-31', HOY)).toEqual({
      activa: false,
      motivo: 'cancelada',
    })
  })

  it('suspendida manda aunque le queden días pagados', () => {
    expect(derivarEstadoMembresia('suspendida', '2026-12-31', HOY)).toEqual({
      activa: false,
      motivo: 'suspendida',
    })
  })

  it('vencida en BD se respeta', () => {
    expect(derivarEstadoMembresia('vencida', '2026-05-01', HOY)).toEqual({
      activa: false,
      motivo: 'vencida',
    })
  })

  it('cruza el cambio de año sin desviarse', () => {
    expect(derivarEstadoMembresia('activa', '2027-01-05', '2026-12-31')).toEqual({
      activa: true,
      diasRestantes: 5,
    })
  })

  it('cuenta bien sobre un 29 de febrero bisiesto', () => {
    expect(derivarEstadoMembresia('activa', '2028-03-01', '2028-02-28')).toEqual({
      activa: true,
      diasRestantes: 2,
    })
  })
})

describe('venceProximamente', () => {
  it('avisa dentro del umbral', () => {
    expect(venceProximamente({ activa: true, diasRestantes: 12 })).toBe(true)
  })

  it('no avisa si aún falta mucho', () => {
    expect(venceProximamente({ activa: true, diasRestantes: 90 })).toBe(false)
  })

  it('el umbral es inclusivo', () => {
    expect(venceProximamente({ activa: true, diasRestantes: 30 })).toBe(true)
  })

  it('nunca avisa sobre una membresía inactiva', () => {
    expect(venceProximamente({ activa: false, motivo: 'vencida' })).toBe(false)
  })

  it('admite un umbral propio', () => {
    expect(venceProximamente({ activa: true, diasRestantes: 12 }, 7)).toBe(false)
  })
})

