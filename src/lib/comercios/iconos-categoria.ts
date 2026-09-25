/**
 * Qué icono le toca a cada categoría del catálogo.
 *
 * El encargo pide que **el icono signifique algo**: una categoría de comida no
 * puede llevar el mismo glifo que una de salud. Pero `categorias` no tiene
 * columna de icono —lo confirma `database.types.ts`— así que el único dato
 * disponible es el **nombre**, que lo escribe una persona desde el panel de
 * administración y por tanto no es un enumerado: llega con tildes, en plural,
 * en singular y con palabras de más.
 *
 * De ahí la forma de esto: **coincidencia por palabra clave sobre el nombre
 * normalizado**, no un diccionario `nombre → icono`. Un diccionario exacto
 * fallaría con "Restaurantes" si la clave fuera "Restaurante", y el fallo sería
 * silencioso: un hueco donde debería haber un icono.
 *
 * NUNCA devuelve `null`. La prohibición es explícita en el encargo: si nada
 * casa, sale el respaldo genérico. Un icono de más es ruido; un hueco es un
 * defecto de maquetación que además desalinea la fila entera.
 *
 * Función pura, sin JSX y sin importar `lucide-react`: así se puede probar sin
 * montar React, y el mapeo clave → componente vive en el único sitio que
 * necesita el paquete (`components/ui/icono-categoria.tsx`).
 */

/**
 * Las claves de icono que el catálogo sabe dibujar.
 *
 * Es una unión cerrada a propósito: el componente que la consume tiene un
 * `Record<ClaveIconoCategoria, LucideIcon>` y TypeScript falla la compilación
 * si alguien añade una clave aquí y olvida su glifo. Es la única garantía de
 * que no vuelva a aparecer un hueco.
 */
export type ClaveIconoCategoria =
  | 'comida'
  | 'cafe'
  | 'mercado'
  | 'salud'
  | 'belleza'
  | 'deporte'
  | 'moda'
  | 'viajes'
  | 'educacion'
  | 'tecnologia'
  | 'vehiculos'
  | 'mascotas'
  | 'ocio'
  | 'hogar'
  | 'servicios'
  | 'fotografia'
  | 'saludable'
  | 'generico'

/** El respaldo. Se usa cuando ninguna palabra clave casa, y también con nombre vacío. */
export const CLAVE_GENERICA: ClaveIconoCategoria = 'generico'

/**
 * Minúsculas y sin tildes, para que "Salud y Belleza" y "salud" casen igual.
 *
 * `NFD` separa la letra de su diacrítico y el rango U+0300..U+036F borra el
 * diacrítico suelto. La enye SOBREVIVE a propósito —se descompone en `n` + tilde
 * y se queda en `n`—, que es justo lo que queremos para comparar palabras.
 */
export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/*
  EL ORDEN DE ESTA LISTA ES SIGNIFICATIVO: gana la primera que case.

  Por eso "cafe" va ANTES que "comida" —una cafetería es más específica que un
  restaurante— y "veterinaria" antes que "salud", que si no se llevaría a las
  mascotas al icono del médico. Reordenar esta lista cambia lo que ve el socio.
*/
const REGLAS: ReadonlyArray<readonly [ClaveIconoCategoria, readonly string[]]> = [
  ['mascotas', ['mascota', 'veterinar', 'canino', 'felino', 'pet']],
  /*
    «Alimentos saludables» ANTES que salud y que mercado: el nombre contiene
    «salud» y, sin esta regla, una tienda de comida sana salía con el
    fonendoscopio del médico.
  */
  ['saludable', ['saludable', 'organic', 'vegan', 'vegetarian', 'natural']],
  ['fotografia', ['fotograf', 'foto']],
  ['cafe', ['cafe', 'cafeter', 'panader', 'reposter', 'pasteler', 'heladeri', 'postre']],
  [
    'comida',
    [
      'comida',
      'restaurante',
      'gastronom',
      'pizz',
      'hamburgues',
      'sushi',
      'asader',
      'parrilla',
      'bar',
      'cerveceri',
      'cocina',
      'almuerzo',
    ],
  ],
  ['mercado', ['supermercado', 'mercado', 'abarrote', 'tienda de barrio', 'fruver', 'licorer']],
  [
    'salud',
    [
      'salud',
      'medic',
      'farmac',
      'drogueri',
      'dental',
      'odontolog',
      'optic',
      'laboratorio',
      'clinic',
      'psicolog',
      'nutricion',
      'fisioterap',
    ],
  ],
  [
    'belleza',
    [
      'belleza',
      'estetic',
      'spa',
      'peluquer',
      'barber',
      'unas',
      'manicur',
      'maquillaje',
      'estilista',
      'masaje',
    ],
  ],
  ['deporte', ['deporte', 'gimnasio', 'gym', 'fitness', 'crossfit', 'yoga', 'entrenamiento']],
  ['moda', ['moda', 'ropa', 'calzado', 'zapat', 'boutique', 'vestuario', 'accesorio', 'joyer']],
  ['viajes', ['viaje', 'turismo', 'hotel', 'hospedaje', 'hostal', 'agencia de viaje', 'vuelo']],
  ['educacion', ['educacion', 'academia', 'curso', 'colegio', 'universidad', 'instituto', 'idioma']],
  [
    'tecnologia',
    ['tecnolog', 'electronic', 'electrodomest', 'computo', 'computador', 'celular', 'software'],
  ],
  ['vehiculos', ['vehiculo', 'automotriz', 'automotor', 'taller', 'llanta', 'lavadero', 'moto', 'carro']],
  ['ocio', ['entretenimiento', 'ocio', 'cine', 'teatro', 'evento', 'juego', 'diversion', 'parque']],
  ['hogar', ['hogar', 'mueble', 'ferreter', 'construc', 'decoracion', 'jardin', 'remodelacion']],
  [
    'servicios',
    ['servicio', 'profesional', 'legal', 'abogad', 'contab', 'seguro', 'financ', 'inmobiliar', 'asesor'],
  ],
]

/**
 * La clave de icono de una categoría, por su nombre. Nunca falla y nunca
 * devuelve vacío.
 */
export function claveIconoCategoria(nombre: string | null | undefined): ClaveIconoCategoria {
  if (!nombre) return CLAVE_GENERICA

  const limpio = normalizarNombre(nombre)
  if (!limpio) return CLAVE_GENERICA

  for (const [clave, palabras] of REGLAS) {
    if (palabras.some((p) => limpio.includes(p))) return clave
  }

  return CLAVE_GENERICA
}
