import { describe, it, expect } from 'vitest'
import {
  construirCorreoInvitacion,
  construirCorreoSolicitudAliado,
  type InputCorreoSolicitudAliado,
} from './correo'

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

describe('construirCorreoSolicitudAliado', () => {
  const base: InputCorreoSolicitudAliado = {
    nombreComercio: 'Casa Duarte',
    nombreContacto: 'María Duarte',
    cargo: 'Propietaria',
    telefono: '3001234567',
    correo: 'contacto@casaduarte.com',
    ciudad: 'Bogotá',
    direccion: 'Cra 15 #93-47',
    categoria: 'Gastronomía',
    descripcion: 'Cocina de autor con productos del mercado local.',
    enlace: 'https://instagram.com/casaduarte',
  }

  it('pone el nombre del comercio en el asunto, sin escapar', () => {
    const correo = construirCorreoSolicitudAliado({
      ...base,
      nombreComercio: 'Café & Co',
    })
    expect(correo.asunto).toBe('Nueva solicitud de comercio aliado — Café & Co')
  })

  it('incluye todos los datos en las dos versiones del cuerpo', () => {
    const correo = construirCorreoSolicitudAliado(base)
    for (const valor of Object.values(base)) {
      expect(correo.texto).toContain(valor)
      expect(correo.html).toContain(valor)
    }
  })

  it('omite las filas de los campos opcionales vacíos', () => {
    const correo = construirCorreoSolicitudAliado({
      ...base,
      cargo: '',
      direccion: '',
      enlace: '',
    })
    expect(correo.html).not.toContain('Cargo')
    expect(correo.texto).not.toContain('Dirección')
    expect(correo.texto).not.toContain('Enlace')
    // Lo obligatorio sigue estando.
    expect(correo.texto).toContain('Comercio: Casa Duarte')
  })

  it('escapa CADA dato del formulario en el html', () => {
    const correo = construirCorreoSolicitudAliado({
      ...base,
      nombreContacto: '<script>alert(1)</script>',
      descripcion: 'Ofrecemos <b>de todo</b> & más',
      enlace: 'https://x.com/"onmouseover="alert(1)',
    })
    expect(correo.html).not.toContain('<script>')
    expect(correo.html).toContain('&lt;script&gt;')
    expect(correo.html).toContain('&amp; más')
    expect(correo.html).not.toContain('"onmouseover="')
  })

  it('deja el texto plano sin escapar: no lo interpreta ningún motor de html', () => {
    const correo = construirCorreoSolicitudAliado({
      ...base,
      descripcion: 'Ofrecemos <b>de todo</b> & más',
    })
    expect(correo.texto).toContain('Ofrecemos <b>de todo</b> & más')
  })
})
