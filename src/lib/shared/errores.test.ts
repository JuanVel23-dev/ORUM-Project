import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mensajeDeError } from './errores'

describe('mensajeDeError', () => {
  let registro: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    registro = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => registro.mockRestore())

  it('no filtra el mensaje de un error de base de datos', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "miembros_cedula_key"',
    }
    const texto = mensajeDeError('No se pudo registrar el miembro', error)

    expect(texto).toBe('No se pudo registrar el miembro.')
    expect(texto).not.toMatch(/duplicate|constraint|miembros_cedula_key/i)
  })

  it('manda el detalle al log del servidor', () => {
    const error = { code: '42703', message: 'column "x" does not exist' }
    mensajeDeError('No se pudo guardar', error)

    expect(registro).toHaveBeenCalledWith('[bd] No se pudo guardar', error)
  })

  it('conserva el mensaje que el proyecto escribe a propósito (P0001)', () => {
    const texto = mensajeDeError('No se pudo registrar la venta', {
      code: 'P0001',
      message: 'La promocion ya no esta vigente',
    })

    expect(texto).toBe('No se pudo registrar la venta: La promocion ya no esta vigente.')
  })

  it('no duplica el punto si el prefijo o el mensaje ya lo traen', () => {
    expect(mensajeDeError('No se pudo guardar.', { code: '23505' })).toBe('No se pudo guardar.')
    expect(
      mensajeDeError('No se pudo vender', { code: 'P0001', message: 'Sucursal invalida.' }),
    ).toBe('No se pudo vender: Sucursal invalida.')
  })

  it('añade el sufijo detrás de una frase cerrada', () => {
    const texto = mensajeDeError(
      'La foto se subió pero no se pudo guardar',
      { code: 'XX000', message: 'interno' },
      'Se conserva la anterior.',
    )

    expect(texto).toBe('La foto se subió pero no se pudo guardar. Se conserva la anterior.')
  })

  it('aguanta un error ausente o sin mensaje', () => {
    expect(mensajeDeError('No se pudo crear el plan', null)).toBe('No se pudo crear el plan.')
    expect(mensajeDeError('No se pudo crear el plan', undefined)).toBe('No se pudo crear el plan.')
    expect(mensajeDeError('No se pudo crear el plan', { code: 'P0001' })).toBe(
      'No se pudo crear el plan.',
    )
  })
})
