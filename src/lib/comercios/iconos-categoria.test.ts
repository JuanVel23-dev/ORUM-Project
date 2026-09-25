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
    ['Heladería', 'heladeria'],
    ['Ropa', 'moda'],
    ['Spa', 'spa'],
    ['Uñas', 'unas'],
    ['Maquillaje', 'maquillaje'],
    ['Estilista', 'estilista'],
    ['Masajes', 'masajes'],
    ['Fotografía', 'fotografia'],
    ['Alimentos saludables', 'saludable'],
    ['Veterinaria', 'mascotas'],
    ['Salud', 'salud'],
    ['Deporte', 'deporte'],
    ['Otros', 'otros'],
  ] as const)('%s → %s', (nombre, clave) => {
    expect(claveIconoCategoria(nombre)).toBe(clave)
  })

  it('ningún icono se repite entre las quince categorías del cliente', () => {
    const categorias = [
      'Restaurante', 'Café', 'Heladería', 'Ropa', 'Spa', 'Uñas', 'Maquillaje', 'Estilista',
      'Masajes', 'Fotografía', 'Alimentos saludables', 'Veterinaria', 'Salud', 'Deporte', 'Otros',
    ]
    const claves = categorias.map(claveIconoCategoria)
    expect(new Set(claves).size).toBe(categorias.length)
  })

  it('una categoría desconocida cae en el respaldo, no en «Otros»', () => {
    expect(claveIconoCategoria('Artesanías')).toBe('generico')
    expect(claveIconoCategoria('otros servicios')).toBe('servicios')
  })

  it('nunca devuelve vacío', () => {
    expect(claveIconoCategoria(null)).toBe('generico')
    expect(claveIconoCategoria('   ')).toBe('generico')
  })
})
