import { describe, expect, it } from 'vitest'
import { aFilasRpc, leerHorarioDelFormulario } from './horario-formulario'

const fila = (dia: number, abre: string | null, cierra: string | null) => ({
  dia,
  abre,
  cierra,
  almuerzoDesde: null,
  almuerzoHasta: null,
})

describe('leerHorarioDelFormulario', () => {
  it('acepta un horario válido de cinco días', () => {
    const json = JSON.stringify([1, 2, 3, 4, 5].map((d) => fila(d, '09:00', '18:00')))
    const r = leerHorarioDelFormulario(json)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.horario).toHaveLength(5)
  })

  it('el campo vacío, ausente o [] es «sin horario»', () => {
    for (const v of ['', '[]', '   ']) {
      expect(leerHorarioDelFormulario(v)).toEqual({ ok: true, horario: [] })
    }
  })

  it('un JSON roto o que no es un arreglo es un error', () => {
    expect(leerHorarioDelFormulario('{no').ok).toBe(false)
    expect(leerHorarioDelFormulario('{"dia":1}').ok).toBe(false)
  })

  it('normaliza las horas que trae la base con segundos', () => {
    const r = leerHorarioDelFormulario(JSON.stringify([fila(1, '09:00:00', '18:00:00')]))
    expect(r).toEqual({ ok: true, horario: [fila(1, '09:00', '18:00')] })
  })

  it('una hora mal escrita es un error, no un null silencioso', () => {
    const r = leerHorarioDelFormulario(JSON.stringify([fila(1, '9am', '18:00')]))
    expect(r.ok).toBe(false)
  })

  it('un almuerzo fuera de la jornada devuelve el mensaje de validarHorario', () => {
    const r = leerHorarioDelFormulario(
      JSON.stringify([{ ...fila(1, '09:00', '18:00'), almuerzoDesde: '08:00', almuerzoHasta: '10:00' }]),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/almuerzo/i)
  })

  it('un día cerrado se conserva como cerrado', () => {
    const r = leerHorarioDelFormulario(JSON.stringify([fila(7, null, null)]))
    expect(r).toEqual({ ok: true, horario: [fila(7, null, null)] })
  })
})

describe('aFilasRpc', () => {
  it('pasa de camelCase al formato de la función SQL', () => {
    expect(
      aFilasRpc([{ ...fila(1, '09:00', '18:00'), almuerzoDesde: '12:00', almuerzoHasta: '13:00' }]),
    ).toEqual([
      { dia: 1, abre: '09:00', cierra: '18:00', almuerzo_desde: '12:00', almuerzo_hasta: '13:00' },
    ])
  })
})
