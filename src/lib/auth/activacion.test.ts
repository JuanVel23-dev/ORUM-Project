import { describe, it, expect } from 'vitest'
import { construirUrlActivacion, interpretarEnlaceActivacion, textosActivacion } from './activacion'

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

describe('interpretarEnlaceActivacion', () => {
  it('detecta un error en el hash', () => {
    const r = interpretarEnlaceActivacion('#error=access_denied&error_description=algo', '')
    expect(r.tipo).toBe('error')
  })

  it('mapea otp_expired a un mensaje de enlace expirado', () => {
    const r = interpretarEnlaceActivacion('#error=access_denied&error_code=otp_expired', '')
    expect(r).toEqual({
      tipo: 'error',
      mensaje: 'Este enlace ya expiró o ya se usó. Pide uno nuevo.',
    })
  })

  it('el error gana aunque haya access_token', () => {
    expect(interpretarEnlaceActivacion('#access_token=x&error=e', '').tipo).toBe('error')
  })

  it('acepta access_token en el hash', () => {
    expect(interpretarEnlaceActivacion('#access_token=abc&type=recovery', '')).toEqual({
      tipo: 'con-credenciales',
    })
  })

  it('acepta ?code= (PKCE)', () => {
    expect(interpretarEnlaceActivacion('', '?code=abc&rol=miembro')).toEqual({
      tipo: 'con-credenciales',
    })
  })

  it('sin hash ni code no hay credenciales', () => {
    expect(interpretarEnlaceActivacion('', '')).toEqual({ tipo: 'sin-credenciales' })
    expect(interpretarEnlaceActivacion('', '?rol=miembro&modo=recuperar')).toEqual({
      tipo: 'sin-credenciales',
    })
  })
})
