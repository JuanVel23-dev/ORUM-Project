import { describe, it, expect } from 'vitest'
import { claveIconoCategoria } from './iconos-categoria'

/*
  Las quince categorías que entregó el cliente para el directorio público.
  Ninguna puede caer en un glifo que diga otra cosa.
*/
describe('claveIconoCategoria · categorías del cliente', () => {
  it.each([
    ['Restaurante', 'comida'],
    ['Café', 'cafe'],
    ['Heladería', 'cafe'],
    ['Ropa', 'moda'],
    ['Spa', 'belleza'],
    ['Uñas', 'belleza'],
    ['Maquillaje', 'belleza'],
    ['Estilista', 'belleza'],
    ['Masajes', 'belleza'],
    ['Fotografía', 'fotografia'],
    ['Alimentos saludables', 'saludable'],
    ['Veterinaria', 'mascotas'],
    ['Salud', 'salud'],
    ['Deporte', 'deporte'],
    ['Otros', 'generico'],
  ] as const)('%s → %s', (nombre, clave) => {
    expect(claveIconoCategoria(nombre)).toBe(clave)
  })

  it('nunca devuelve vacío', () => {
    expect(claveIconoCategoria(null)).toBe('generico')
    expect(claveIconoCategoria('   ')).toBe('generico')
  })
})
