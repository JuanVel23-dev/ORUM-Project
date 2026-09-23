import { describe, it, expect } from 'vitest'
import { escaparHtml } from '../shared/html'
import {
  construirCorreoInvitacion,
  construirCorreoRecuperacion,
  construirCorreoSolicitudAliado,
  leerConfigSmtp,
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
    expect(correo.html).toContain(escaparHtml(base.urlInvitacion))
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

describe('construirCorreoRecuperacion', () => {
  const url = 'https://orum.example.com/auth/v1/verify?token=abc&type=recovery'

  it('arma el asunto fijo', () => {
    expect(construirCorreoRecuperacion({ urlRecuperacion: url }).asunto).toBe(
      'Restablece tu contraseña en ORUM',
    )
  })

  it('incluye el enlace en html y texto plano', () => {
    const correo = construirCorreoRecuperacion({ urlRecuperacion: url })
    expect(correo.html).toContain(escaparHtml(url))
    expect(correo.texto).toContain(url)
  })

  it('avisa que se ignore si no lo pidió el usuario', () => {
    const correo = construirCorreoRecuperacion({ urlRecuperacion: url })
    expect(correo.html).toMatch(/ignorarlo/i)
    expect(correo.texto).toMatch(/ignorarlo/i)
  })
})

describe('escape de URLs en href', () => {
  const url = 'https://orum.example.com/verify?token=a&type=recovery&x="y"'

  it('escapa & y comillas en el href del html y deja el texto crudo (recuperación)', () => {
    const correo = construirCorreoRecuperacion({ urlRecuperacion: url })
    expect(correo.html).toContain(`href="${escaparHtml(url)}"`)
    expect(correo.html).toContain('&amp;type=recovery')
    expect(correo.texto).toContain(url)
  })

  it('escapa & y comillas en el href del html y deja el texto crudo (invitación)', () => {
    const correo = construirCorreoInvitacion({ nombre: 'Ana', correo: 'a@b.co', urlInvitacion: url })
    expect(correo.html).toContain(`href="${escaparHtml(url)}"`)
    expect(correo.texto).toContain(url)
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
