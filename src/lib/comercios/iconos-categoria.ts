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
  | 'heladeria'
  | 'spa'
  | 'unas'
  | 'maquillaje'
  | 'estilista'
  | 'masajes'
  | 'otros'
  // Desde el 20/10/2026: categorías y subcategorías nuevas del cliente.
  | 'ninos'
  | 'contenedores'
  | 'restaurante'
  | 'hamburguesa'
  | 'pizza'
  | 'alitas'
  | 'comidaRapida'
  | 'desayuno'
  | 'almuerzo'
  | 'mexicano'
  | 'cafeteria'
  | 'bar'
  | 'mujer'
  | 'asesoriaImagen'
  | 'barberia'
  | 'cejas'
  | 'hospedaje'
  | 'agenciaViajes'
  | 'fotografo'
  | 'eventos'
  | 'pilates'
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
    .replace(/\s+/g, ' ')
    .trim()
}

/*
  LAS CATEGORÍAS Y SUBCATEGORÍAS DE HOY, UNA A UNA (20/10/2026: «quiero que
  cada icono sea alusivo a su categoría, no quiero nada repetido»). Con 11
  categorías y 25 subcategorías las palabras clave ya no bastaban: casi todo
  Gastronomía caía en el mismo cubierto, y «Alimentos y Despensa» y
  «Containers» en la misma etiqueta genérica. Por eso las que existen se
  nombran AQUÍ, por su nombre exacto (normalizado), y la prueba comprueba que
  ninguna clave se repite. Las palabras clave de abajo quedan para las que se
  creen mañana: una categoría nueva sale con un icono alusivo aunque nadie la
  haya añadido aquí — pero puede coincidir con otra; al crearla, se añade.
*/
const EXACTOS: Readonly<Record<string, ClaveIconoCategoria>> = {
  // Categorías
  gastronomia: 'comida',
  'moda y estilo': 'moda',
  belleza: 'belleza',
  'viajes y escapadas': 'viajes',
  'fotografia y eventos': 'fotografia',
  'alimentos y despensa': 'mercado',
  'salud y bienestar': 'salud',
  'ninos y diversion': 'ninos',
  'deporte y fitness': 'deporte',
  containers: 'contenedores',
  otros: 'otros',
  // Gastronomía
  restaurantes: 'restaurante',
  hamburguesas: 'hamburguesa',
  pizzerias: 'pizza',
  alitas: 'alitas',
  'comida rapida': 'comidaRapida',
  'desayunos y brunch': 'desayuno',
  almuerzos: 'almuerzo',
  mexicano: 'mexicano',
  cafes: 'cafe',
  cafeterias: 'cafeteria',
  heladerias: 'heladeria',
  'bares y gastrobares': 'bar',
  // Moda y Estilo
  mujer: 'mujer',
  'asesoria de imagen': 'asesoriaImagen',
  // Belleza
  unas: 'unas',
  peluqueria: 'estilista',
  barberia: 'barberia',
  maquillaje: 'maquillaje',
  'cejas y pestanas': 'cejas',
  'masajes reductores': 'masajes',
  // Viajes y Escapadas
  hospedaje: 'hospedaje',
  'agencias de viaje': 'agenciaViajes',
  // Fotografía y Eventos
  fotografia: 'fotografo',
  'salon de eventos': 'eventos',
  // Deporte y Fitness
  pilates: 'pilates',
}

/** Los nombres con icono propio. La prueba los recorre para comprobar que no se repite ninguno. */
export const NOMBRES_CON_ICONO_PROPIO: readonly string[] = Object.keys(EXACTOS)

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
  /*
    UN ICONO POR CATEGORÍA DEL CLIENTE (encargo del 25/09): Heladería salía con
    la taza de Café, y Spa, Uñas, Maquillaje, Estilista y Masajes compartían
    los mismos destellos de «belleza». Cada una tiene ahora su clave, y van
    ANTES que las genéricas (`cafe`, `belleza`) para ganarles.
  */
  ['contenedores', ['container', 'contenedor']],
  ['ninos', ['nino', 'infantil', 'juguet', 'bebe']],
  ['eventos', ['salon de evento', 'banquete', 'boda', 'fiesta']],
  ['agenciaViajes', ['agencia de viaje', 'agencias de viaje', 'tour']],
  ['hospedaje', ['hospedaje', 'hotel', 'hostal', 'glamping', 'cabana']],
  ['pilates', ['pilates']],
  ['cejas', ['ceja', 'pestan', 'lifting']],
  ['barberia', ['barber']],
  ['asesoriaImagen', ['asesoria de imagen', 'imagen personal', 'personal shopper']],
  ['heladeria', ['heladeri', 'helado', 'gelato', 'paleteri']],
  ['hamburguesa', ['hamburgues', 'burger']],
  ['pizza', ['pizz']],
  ['alitas', ['alita', 'wings']],
  ['comidaRapida', ['comida rapida', 'perro caliente', 'hot dog', 'salchipapa']],
  ['desayuno', ['desayuno', 'brunch']],
  ['almuerzo', ['almuerzo', 'corrientazo', 'menu del dia']],
  ['mexicano', ['mexican', 'taco', 'burrito']],
  ['bar', ['gastrobar', 'bares', 'coctel', 'cerveceri', 'licores']],
  ['cafeteria', ['cafeteri', 'panader', 'reposter', 'pasteler', 'postre']],
  ['unas', ['unas', 'manicur', 'pedicur', 'nail']],
  ['maquillaje', ['maquillaje', 'makeup', 'cosmet']],
  ['estilista', ['estilista', 'peluquer', 'barber', 'corte de cabello']],
  ['masajes', ['masaje', 'masoterap', 'quiromasaj']],
  ['spa', ['spa']],
  ['cafe', ['cafe']],
  ['restaurante', ['restaurante', 'asader', 'parrilla', 'sushi', 'cocina']],
  ['comida', ['comida', 'gastronom']],
  [
    'mercado',
    ['despensa', 'supermercado', 'mercado', 'abarrote', 'tienda de barrio', 'fruver', 'licorer', 'alimento'],
  ],
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
    ['belleza', 'estetic'],
  ],
  ['deporte', ['deporte', 'gimnasio', 'gym', 'fitness', 'crossfit', 'yoga', 'entrenamiento']],
  ['mujer', ['mujer', 'dama', 'femenin']],
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

  /* «Otros» es el cajón de sastre: su propio glifo («…»), distinto del
     respaldo genérico de una categoría que no se reconoce. Comparación
     exacta: como subcadena, «otro» casaría dentro de otras palabras. */
  if (/^otr[oa]s?$/.test(limpio)) return 'otros'

  // Las de hoy, por su nombre exacto: cada una con el suyo, sin repetir.
  const exacta = EXACTOS[limpio]
  if (exacta) return exacta

  for (const [clave, palabras] of REGLAS) {
    if (palabras.some((p) => limpio.includes(p))) return clave
  }

  return CLAVE_GENERICA
}
