import { describe, it, expect } from 'vitest'
import { construirCorreoInvitacion, leerConfigSmtp } from './correo'

describe('construirCorreoInvitacion', () => {
  const base = {
    nombre: 'Ana Ruiz',
    correo: 'ana@example.com',
    urlInvitacion: 'https://orum.example.com/activar-cuenta?token=abc123',
  }

  it('arma el asunto fijo', () => {
    const correo = construirCorreoInvitacion(base)
    expect(correo.asunto).toBe('Bienvenido a ORUM — activa tu cuenta')
  })

  it('incluye el enlace de invitación y ninguna contraseña', () => {
    const correo = construirCorreoInvitacion(base)
    expect(correo.html).toContain(base.urlInvitacion)
    expect(correo.texto).toContain(base.urlInvitacion)
    expect(correo.html).not.toMatch(/contraseña:\s*\S/i)
  })

  it('saluda por nombre', () => {
    const correo = construirCorreoInvitacion(base)
    expect(correo.html).toContain('Hola Ana Ruiz')
    expect(correo.texto).toContain('Hola Ana Ruiz')
  })

  it('escapa nombre y correo en el html pero no en el texto plano', () => {
    const correo = construirCorreoInvitacion({
      ...base,
      nombre: 'Juan <img src=x onerror=alert(1)>',
    })
    expect(correo.html).not.toContain('<img')
    expect(correo.html).toContain('&lt;img')
    expect(correo.texto).toContain('Juan <img src=x onerror=alert(1)>')
  })
})

describe('leerConfigSmtp', () => {
  const env = {
    GMAIL_SMTP_USER: 'admin@orum.example.com',
    GMAIL_SMTP_APP_PASSWORD: 'abcd efgh ijkl mnop',
    GMAIL_FROM_EMAIL: 'no-reply@orum.example.com',
  }

  it('devuelve la configuración cuando están las tres variables', () => {
    expect(leerConfigSmtp(env)).toEqual({
      usuario: 'admin@orum.example.com',
      password: 'abcdefghijklmnop',
      remitente: 'no-reply@orum.example.com',
    })
  })

  it('quita los espacios de la contraseña de aplicación (Google la muestra en bloques)', () => {
    expect(leerConfigSmtp(env)?.password).toBe('abcdefghijklmnop')
  })

  it.each(['GMAIL_SMTP_USER', 'GMAIL_SMTP_APP_PASSWORD', 'GMAIL_FROM_EMAIL'])(
    'devuelve null si falta %s',
    (clave) => {
      expect(leerConfigSmtp({ ...env, [clave]: undefined })).toBeNull()
      expect(leerConfigSmtp({ ...env, [clave]: '   ' })).toBeNull()
    },
  )
})
