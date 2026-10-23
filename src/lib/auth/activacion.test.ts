import { describe, it, expect } from 'vitest'
import {
  construirEnlaceActivacion,
  cuentaPendienteDeActivar,
  puedeReenviarActivacion,
  rolActivacionDe,
  textosActivacion,
} from './activacion'

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

describe('cuentaPendienteDeActivar', () => {
  it('sin correo confirmado, está pendiente', () => {
    expect(cuentaPendienteDeActivar({ email_confirmed_at: null })).toBe(true)
    expect(cuentaPendienteDeActivar({})).toBe(true)
  })

  it('con correo confirmado, ya está activada', () => {
    expect(cuentaPendienteDeActivar({ email_confirmed_at: '2026-10-20T15:00:00Z' })).toBe(false)
  })

  it('sin usuario no hay nada que reenviar', () => {
    expect(cuentaPendienteDeActivar(null)).toBe(false)
    expect(cuentaPendienteDeActivar(undefined)).toBe(false)
  })
})

describe('rolActivacionDe', () => {
  it('traduce el rol de la cuenta al del enlace', () => {
    expect(rolActivacionDe('miembro')).toBe('miembro')
    expect(rolActivacionDe('comercio')).toBe('comercio')
    expect(rolActivacionDe('empleado')).toBe('staff')
    expect(rolActivacionDe('super_admin')).toBe('staff')
    expect(rolActivacionDe('otro')).toBeNull()
  })
})

describe('puedeReenviarActivacion', () => {
  it('el administrador puede con cualquier cuenta conocida', () => {
    for (const rol of ['miembro', 'comercio', 'empleado', 'super_admin']) {
      expect(puedeReenviarActivacion('super_admin', rol)).toBe(true)
    }
    expect(puedeReenviarActivacion('super_admin', 'otro')).toBe(false)
  })

  it('el empleado solo con miembros', () => {
    expect(puedeReenviarActivacion('empleado', 'miembro')).toBe(true)
    expect(puedeReenviarActivacion('empleado', 'comercio')).toBe(false)
    expect(puedeReenviarActivacion('empleado', 'empleado')).toBe(false)
  })

  it('miembros y comercios no pueden', () => {
    expect(puedeReenviarActivacion('miembro', 'miembro')).toBe(false)
    expect(puedeReenviarActivacion('comercio', 'comercio')).toBe(false)
  })
})
