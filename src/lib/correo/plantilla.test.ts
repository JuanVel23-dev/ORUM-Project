import { describe, it, expect } from 'vitest'
import { construirCorreoSolicitudAliado, construirCorreoInvitacion } from './correo'
import { envolverCorreo, escaparConSaltos, urlBaseSitio } from './plantilla'

describe('urlBaseSitio', () => {
  it('usa NEXT_PUBLIC_SITE_URL y quita la barra final', () => {
    expect(urlBaseSitio({ NEXT_PUBLIC_SITE_URL: 'https://cluborum.com/' })).toBe('https://cluborum.com')
  })

  it('cae al dominio de producción si falta o está vacía', () => {
    expect(urlBaseSitio({})).toBe('https://cluborum.com')
    expect(urlBaseSitio({ NEXT_PUBLIC_SITE_URL: '   ' })).toBe('https://cluborum.com')
  })
})

describe('escaparConSaltos', () => {
  it('convierte los saltos de línea en <br> y escapa el resto', () => {
    expect(escaparConSaltos('a <b>\r\nc & d\ne')).toBe('a &lt;b&gt;<br>c &amp; d<br>e')
  })
})

describe('envolverCorreo', () => {
  const base = {
    titulo: 'Hola <mundo>',
    preheader: 'Vista previa & más',
    cuerpoHtml: '<p>cuerpo</p>',
    urlBase: 'https://cluborum.com',
  }

  it('produce un documento completo con idioma, charset y viewport', () => {
    const html = envolverCorreo(base)
    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain('name="viewport"')
  })

  it('apunta el logo a una URL absoluta y deja un alt legible', () => {
    const html = envolverCorreo(base)
    expect(html).toContain('src="https://cluborum.com/correo/orum-plata.png"')
    expect(html).toContain('alt="ORUM"')
  })

  it('escapa el titular y el preheader que recibe como texto', () => {
    const html = envolverCorreo(base)
    expect(html).toContain('Hola &lt;mundo&gt;')
    expect(html).not.toContain('<mundo>')
    expect(html).toContain('Vista previa &amp; más')
  })

  it('el botón lleva la URL escapada y la repite como enlace de respaldo', () => {
    const url = 'https://cluborum.com/x?a=1&b="2"'
    const html = envolverCorreo({ ...base, boton: { texto: 'Ir', url } })
    const href = 'https://cluborum.com/x?a=1&amp;b=&quot;2&quot;'
    expect(html.split(`href="${href}"`)).toHaveLength(3) // botón + respaldo
    expect(html).toContain(`>${href}</a>`)
  })

  it('sin botón no pinta botón ni enlace de respaldo', () => {
    expect(envolverCorreo(base)).not.toContain('copia y pega')
  })
})

describe('correos construidos con la plantilla', () => {
  it('la solicitud conserva los saltos de línea de la descripción', () => {
    const correo = construirCorreoSolicitudAliado({
      nombreComercio: 'Casa Duarte',
      nombreContacto: 'María',
      cargo: '',
      telefono: '3001234567',
      correo: 'm@casaduarte.com',
      ciudad: 'Bogotá',
      direccion: '',
      categoria: 'Gastronomía',
      descripcion: 'Primera línea\nSegunda línea',
      enlace: '',
    })
    expect(correo.html).toContain('Primera línea<br>Segunda línea')
  })

  it('la invitación trae el botón con la URL', () => {
    const correo = construirCorreoInvitacion({
      nombre: 'Ana',
      correo: 'a@b.co',
      urlInvitacion: 'https://cluborum.com/activar-cuenta?token=abc',
    })
    expect(correo.html).toContain('Activar mi cuenta')
    expect(correo.html).toContain('href="https://cluborum.com/activar-cuenta?token=abc"')
  })
})
