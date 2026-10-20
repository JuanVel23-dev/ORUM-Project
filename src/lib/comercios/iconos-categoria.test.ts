import { describe, it, expect } from 'vitest'
import { claveIconoCategoria, NOMBRES_CON_ICONO_PROPIO } from './iconos-categoria'

/*
  Las categorías y subcategorías que tiene hoy la base (20/10/2026), tal como
  las escribió el administrador —con mayúsculas, tildes y algún espacio de
  más—. Ninguna puede caer en un glifo que diga otra cosa, y ninguna puede
  repetir el de otra.
*/
const CATEGORIAS = [
  ['Gastronomía', 'comida'],
  ['Moda y Estilo', 'moda'],
  ['Belleza', 'belleza'],
  ['Viajes y Escapadas', 'viajes'],
  ['Fotografía y Eventos', 'fotografia'],
  ['Alimentos y Despensa', 'mercado'],
  ['Salud y Bienestar', 'salud'],
  ['Niños y Diversión', 'ninos'],
  ['Deporte y Fitness', 'deporte'],
  ['Containers', 'contenedores'],
  ['Otros', 'otros'],
] as const

const SUBCATEGORIAS = [
  ['Restaurantes', 'restaurante'],
  ['Hamburguesas', 'hamburguesa'],
  ['Pizzerías', 'pizza'],
  ['Alitas', 'alitas'],
  ['Comida rápida', 'comidaRapida'],
  ['Desayunos y brunch', 'desayuno'],
  ['Almuerzos', 'almuerzo'],
  ['Mexicano', 'mexicano'],
  ['Cafés', 'cafe'],
  ['Cafeterías ', 'cafeteria'],
  ['Heladerías', 'heladeria'],
  ['Bares y gastrobares', 'bar'],
  ['Mujer', 'mujer'],
  ['Asesoría de imagen', 'asesoriaImagen'],
  ['Uñas', 'unas'],
  ['Peluquería', 'estilista'],
  ['Barbería', 'barberia'],
  ['Maquillaje', 'maquillaje'],
  ['Cejas y Pestañas', 'cejas'],
  ['Masajes reductores', 'masajes'],
  ['Hospedaje', 'hospedaje'],
  ['Agencias de Viaje', 'agenciaViajes'],
  ['Fotografía', 'fotografo'],
  ['Salón de eventos', 'eventos'],
  ['Pilates', 'pilates'],
] as const

describe('claveIconoCategoria · las categorías y subcategorías de hoy', () => {
  it.each([...CATEGORIAS, ...SUBCATEGORIAS])('%s → %s', (nombre, clave) => {
    expect(claveIconoCategoria(nombre)).toBe(clave)
  })

  it('ningún icono se repite entre las 36', () => {
    const claves = [...CATEGORIAS, ...SUBCATEGORIAS].map(([n]) => claveIconoCategoria(n))
    expect(new Set(claves).size).toBe(claves.length)
  })

  it('ningún nombre con icono propio comparte clave con otro, ni cae en el genérico', () => {
    const claves = NOMBRES_CON_ICONO_PROPIO.map(claveIconoCategoria)
    expect(new Set(claves).size).toBe(claves.length)
    expect(claves).not.toContain('generico')
  })
})

describe('claveIconoCategoria · nombres nuevos, por palabras clave', () => {
  it.each([
    ['Heladería', 'heladeria'],
    ['Spa', 'spa'],
    ['Veterinaria', 'mascotas'],
    ['Alimentos saludables', 'saludable'],
    ['Salud', 'salud'],
    ['Panadería', 'cafeteria'],
    ['Asadero', 'restaurante'],
    ['Hamburguesería', 'hamburguesa'],
    ['Barbería clásica', 'barberia'],
    ['Hotel boutique', 'hospedaje'],
    ['Ropa', 'moda'],
    ['Gimnasio', 'deporte'],
  ] as const)('%s → %s', (nombre, clave) => {
    expect(claveIconoCategoria(nombre)).toBe(clave)
  })

  it('espacios de más no cambian el icono', () => {
    expect(claveIconoCategoria('  Salón   de eventos ')).toBe('eventos')
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
