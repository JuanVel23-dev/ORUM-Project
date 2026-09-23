import { describe, it, expect } from 'vitest'
import { construirEnlaceActivacion, textosActivacion } from './activacion'

describe('construirEnlaceActivacion', () => {
  it('arma el enlace de invitación con token_hash y type', () => {
    expect(construirEnlaceActivacion('https://orum.example.com', 'miembro', 'hash123', 'invite')).toBe(
      'https://orum.example.com/activar-cuenta?rol=miembro&token_hash=hash123&type=invite',
    )
  })

  it('añade modo=recuperar solo en recuperación', () => {
    expect(
      construirEnlaceActivacion('https://orum.example.com', 'comercio', 'hash123', 'recovery', 'recuperar'),
    ).toBe(
      'https://orum.example.com/activar-cuenta?rol=comercio&modo=recuperar&token_hash=hash123&type=recovery',
    )
  })

  it('tolera barras finales en la base', () => {
    expect(construirEnlaceActivacion('https://orum.example.com//', 'staff', 'hash123', 'invite')).toBe(
      'https://orum.example.com/activar-cuenta?rol=staff&token_hash=hash123&type=invite',
    )
  })

  it('codifica el token_hash si trae caracteres especiales', () => {
    const url = construirEnlaceActivacion('https://orum.example.com', 'miembro', 'a+b/c', 'invite')
    expect(url).toBe('https://orum.example.com/activar-cuenta?rol=miembro&token_hash=a%2Bb%2Fc&type=invite')
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
