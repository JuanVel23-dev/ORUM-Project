import { describe, it, expect } from 'vitest'
import { construirCorreoBienvenida } from './correo'

describe('construirCorreoBienvenida', () => {
  const base = {
    nombre: 'Ana Ruiz',
    correo: 'ana@example.com',
    password: 'Tr0p!c4lFruta',
    urlBase: 'https://orum.example.com',
  }

  it('arma el asunto fijo', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.asunto).toBe('Bienvenido a ORUM — tus datos de acceso')
  })

  it('incluye el correo y la contraseña en el html y el texto', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.html).toContain('ana@example.com')
    expect(correo.html).toContain('Tr0p!c4lFruta')
    expect(correo.texto).toContain('ana@example.com')
    expect(correo.texto).toContain('Tr0p!c4lFruta')
  })

  it('saluda por nombre', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.html).toContain('Hola Ana Ruiz')
    expect(correo.texto).toContain('Hola Ana Ruiz')
  })

  it('enlaza a /miembros/login cuando rol es miembro', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'miembro' })
    expect(correo.html).toContain('https://orum.example.com/miembros/login')
    expect(correo.texto).toContain('https://orum.example.com/miembros/login')
  })

  it('enlaza a /login cuando rol es staff', () => {
    const correo = construirCorreoBienvenida({ ...base, rol: 'staff' })
    expect(correo.html).toContain('https://orum.example.com/login')
    expect(correo.texto).toContain('https://orum.example.com/login')
  })
})