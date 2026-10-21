import { describe, expect, it } from 'vitest'
import { gestionDeFila, nombreCompleto, vistaDeFilaRpc } from './mapeo'

describe('vistaDeFilaRpc', () => {
  it('pasa de snake_case a camelCase', () => {
    expect(
      vistaDeFilaRpc({
        id: 3,
        estrellas: 5,
        mensaje: null,
        autor: 'María G.',
        created_at: '2026-10-20T10:00:00Z',
        respuesta_comercio: 'Gracias',
        respuesta_admin: null,
        es_mia: true,
      }),
    ).toEqual({
      id: 3,
      estrellas: 5,
      mensaje: null,
      autor: 'María G.',
      creadaEn: '2026-10-20T10:00:00Z',
      respuestaComercio: 'Gracias',
      respuestaAdmin: null,
      esMia: true,
    })
  })
})

describe('nombreCompleto', () => {
  it('une nombres y apellidos sin espacios de más', () => {
    expect(nombreCompleto({ nombres: 'María  José', apellidos: ' García ' })).toBe(
      'María José García',
    )
  })
  it('usa un marcador si no hay socio o está vacío', () => {
    expect(nombreCompleto(null)).toBe('Socio')
    expect(nombreCompleto({ nombres: '', apellidos: '' })).toBe('Socio')
  })
})

describe('gestionDeFila', () => {
  it('lleva el nombre completo y las fechas de respuesta', () => {
    const r = gestionDeFila({
      id: 1,
      estrellas: 4,
      mensaje: 'Bien',
      created_at: 'a',
      respuesta_comercio: 'x',
      respuesta_comercio_at: 'b',
      respuesta_admin: null,
      respuesta_admin_at: null,
      miembros: { nombres: 'Ana', apellidos: 'Ruiz Peña' },
    })
    expect(r.autor).toBe('Ana Ruiz Peña')
    expect(r.respuestaComercioAt).toBe('b')
    expect(r.respuestaAdminAt).toBeNull()
    expect(r.creadaEn).toBe('a')
  })
})
