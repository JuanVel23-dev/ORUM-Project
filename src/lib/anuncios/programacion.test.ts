import { describe, expect, it } from 'vitest'
import {
  describirProgramacion,
  estadoNovedad,
  faltanColumnasDeProgramacion,
  vigentesAhora,
  instanteBogota,
  partesBogota,
  revisarProgramacion,
} from './programacion'

describe('instanteBogota y partesBogota', () => {
  it('la hora escrita es la de Bogotá (UTC−5)', () => {
    expect(instanteBogota('2026-11-14', '08:00')).toBe('2026-11-14T13:00:00.000Z')
    expect(instanteBogota('2026-11-14', '21:30')).toBe('2026-11-15T02:30:00.000Z')
  })

  it('rechaza fechas y horas que no existen', () => {
    expect(instanteBogota('2026-02-30', '08:00')).toBeNull()
    expect(instanteBogota('2026-11-14', '24:00')).toBeNull()
    expect(instanteBogota('', '08:00')).toBeNull()
    expect(instanteBogota('2026-11-14', '')).toBeNull()
  })

  it('vuelve a los campos con la fecha y la hora de Bogotá', () => {
    expect(partesBogota('2026-11-15T02:30:00.000Z')).toEqual({ fecha: '2026-11-14', hora: '21:30' })
    expect(partesBogota(null)).toEqual({ fecha: '', hora: '' })
  })
})

describe('estadoNovedad', () => {
  const ahora = new Date('2026-11-14T15:00:00Z')
  const base = { activo: true, desde: null, hasta: null }

  it('sin fechas está publicada; retirada manda sobre todo', () => {
    expect(estadoNovedad(base, ahora)).toBe('publicada')
    expect(estadoNovedad({ ...base, activo: false, desde: '2030-01-01T00:00:00Z' }, ahora)).toBe('retirada')
  })

  it('programada antes de su inicio, finalizada al llegar su fin', () => {
    expect(estadoNovedad({ ...base, desde: '2026-11-14T16:00:00Z' }, ahora)).toBe('programada')
    expect(estadoNovedad({ ...base, desde: '2026-11-14T14:00:00Z' }, ahora)).toBe('publicada')
    expect(estadoNovedad({ ...base, hasta: '2026-11-14T15:00:00Z' }, ahora)).toBe('finalizada')
    expect(estadoNovedad({ ...base, hasta: '2026-11-14T15:01:00Z' }, ahora)).toBe('publicada')
  })
})

describe('describirProgramacion y revisarProgramacion', () => {
  it('describe la ventana en palabras, o nada si no tiene', () => {
    expect(describirProgramacion('2026-11-14T13:00:00Z', '2026-11-20T23:00:00Z')).toMatch(/^Del 14 .* al 20 /)
    expect(describirProgramacion('2026-11-14T13:00:00Z', null)).toMatch(/^Desde el 14/)
    expect(describirProgramacion(null, '2026-11-20T23:00:00Z')).toMatch(/^Hasta el 20/)
    expect(describirProgramacion(null, null)).toBeNull()
  })

  it('el fin después del inicio y todavía por llegar', () => {
    const ahora = new Date('2026-11-10T00:00:00Z')
    expect(revisarProgramacion('2026-11-14T13:00:00Z', '2026-11-14T12:00:00Z', ahora)).toMatch(/después del inicio/)
    expect(revisarProgramacion(null, '2026-11-01T00:00:00Z', ahora)).toMatch(/ya pasó/)
    expect(revisarProgramacion('2026-11-14T13:00:00Z', '2026-11-20T13:00:00Z', ahora)).toBeNull()
  })
})

describe('vigentesAhora', () => {
  const ahora = new Date('2026-11-14T15:00:00Z')
  it('solo las que están en su ventana, por cuándo salieron', () => {
    const filas = [
      { id: 1, desde: null, hasta: null, creada: '2026-11-10T00:00:00Z' },
      { id: 2, desde: '2026-11-14T13:00:00Z', hasta: null, creada: '2026-11-01T00:00:00Z' },
      { id: 3, desde: '2026-11-20T00:00:00Z', hasta: null, creada: '2026-11-12T00:00:00Z' },
      { id: 4, desde: null, hasta: '2026-11-13T00:00:00Z', creada: '2026-11-11T00:00:00Z' },
    ]
    expect(vigentesAhora(filas, ahora).map((f) => f.id)).toEqual([2, 1])
  })

  it('reconoce el error de columnas que aún no existen', () => {
    expect(faltanColumnasDeProgramacion({ code: '42703', message: 'column anuncios.publicar_desde does not exist' })).toBe(true)
    expect(faltanColumnasDeProgramacion({ code: '23505', message: 'duplicate' })).toBe(false)
    expect(faltanColumnasDeProgramacion(null)).toBe(false)
  })
})
