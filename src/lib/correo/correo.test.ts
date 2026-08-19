import { describe, it, expect } from 'vitest'
import { construirCorreoInvitacion } from './correo'

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
