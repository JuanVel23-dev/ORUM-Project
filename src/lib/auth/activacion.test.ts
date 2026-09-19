import { describe, it, expect } from 'vitest'
import { construirUrlActivacion, textosActivacion } from './activacion'

describe('construirUrlActivacion', () => {
  it('arma la URL de invitación sin parámetro modo', () => {
    expect(construirUrlActivacion('https://orum.example.com', 'miembro')).toBe(
      'https://orum.example.com/activar-cuenta?rol=miembro',
    )
  })

  it('añade modo=recuperar solo en recuperación', () => {
    expect(construirUrlActivacion('https://orum.example.com', 'comercio', 'recuperar')).toBe(
      'https://orum.example.com/activar-cuenta?rol=comercio&modo=recuperar',
    )
  })

  it('tolera barras finales en la base', () => {
    expect(construirUrlActivacion('https://orum.example.com//', 'staff')).toBe(
      'https://orum.example.com/activar-cuenta?rol=staff',
    )
  })
})

describe('textosActivacion', () => {
  it('usa el copy de invitación por defecto y ante valores desconocidos', () => {
    for (const modo of [undefined, '', 'otro']) {
      expect(textosActivacion(modo)).toEqual({
        subtitulo: 'Activa tu cuenta',
        etiquetaPassword: 'Elige tu contraseña',
        boton: 'Activar cuenta',
      })
    }
  })

  it('usa el copy de recuperación con modo=recuperar', () => {
    expect(textosActivacion('recuperar')).toEqual({
      subtitulo: 'Restablece tu contraseña',
      etiquetaPassword: 'Elige tu nueva contraseña',
      boton: 'Guardar contraseña',
    })
  })
})
