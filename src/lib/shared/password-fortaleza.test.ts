import { describe, expect, it } from 'vitest'
import { LONGITUD_MINIMA, evaluarFortaleza } from './password-fortaleza'

describe('evaluarFortaleza', () => {
  it('una contraseña vacía no dice nada todavía', () => {
    const r = evaluarFortaleza('')
    expect(r.nivel).toBe('vacia')
    expect(r.mensaje).toBe('')
    expect(r.cumpleMinimo).toBe(false)
  })

  it('por debajo del mínimo dice cuántos caracteres faltan', () => {
    const r = evaluarFortaleza('Ab3$')
    expect(r.cumpleMinimo).toBe(false)
    expect(r.mensaje).toBe(`Faltan ${LONGITUD_MINIMA - 4} caracteres.`)
  })

  it('singulariza cuando falta un solo carácter', () => {
    const r = evaluarFortaleza('Abc3$xy')
    expect(r.mensaje).toBe('Faltan 1 carácter.')
  })

  it('justo en el mínimo ya cumple, aunque no sea sólida', () => {
    const r = evaluarFortaleza('Abc3$xyz')
    expect(r.cumpleMinimo).toBe(true)
    expect(r.nivel).not.toBe('excelente')
  })

  it('penaliza longitud justa con un solo tipo de carácter', () => {
    const r = evaluarFortaleza('abcdefghij')
    expect(r.puntuacion).toBe(1)
    expect(r.nivel).toBe('debil')
  })

  it('una frase larga y sencilla puntúa alto: la longitud pesa más', () => {
    const r = evaluarFortaleza('caballocorrectobateriagrapa')
    expect(r.puntuacion).toBeGreaterThanOrEqual(3)
  })

  it('larga y variada llega a excelente', () => {
    const r = evaluarFortaleza('Orum2026$Membresias!')
    expect(r.nivel).toBe('excelente')
    expect(r.puntuacion).toBe(4)
    expect(r.mensaje).toBe('Contraseña sólida.')
  })

  it('sugiere alargar antes que añadir símbolos si es corta', () => {
    const r = evaluarFortaleza('Abcd3fgh')
    expect(r.mensaje).toBe('Alárgala a 12 caracteres o más.')
  })

  it('con longitud suficiente sugiere lo que falta', () => {
    const r = evaluarFortaleza('abcdefghijklm')
    expect(r.mensaje).toContain('una mayúscula')
    expect(r.mensaje).toContain('un número')
    expect(r.mensaje).toContain('un símbolo')
  })

  it('nunca supera la puntuación máxima', () => {
    const r = evaluarFortaleza('Orum2026$MembresiasClubBeneficios!!')
    expect(r.puntuacion).toBeLessThanOrEqual(4)
  })
})
