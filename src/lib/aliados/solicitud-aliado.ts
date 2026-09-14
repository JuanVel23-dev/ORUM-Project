/*
  SOLICITUD DE COMERCIO ALIADO  ·  el núcleo puro
  ---------------------------------------------------------------------------
  Todo lo que este archivo exporta es una función sin efectos: entra texto,
  sale texto o un veredicto. Esa es la condición para poder probarlo —la norma
  del proyecto es «pruebas automatizadas solo de funciones puras»— y es también
  la razón de que la validación NO viva dentro de la Server Action: allí
  dependería de `FormData`, de variables de entorno y de MailerSend, y dejaría
  de ser verificable.

  Se usa desde LOS DOS LADOS a propósito:
    · el formulario (cliente) lo llama al salir de un campo, para avisar antes
      de que el visitante pulse enviar;
    · la Server Action lo vuelve a llamar con los mismos datos, porque la
      comprobación del navegador es una cortesía, no una barrera: cualquiera
      puede enviar el `POST` a mano.

  Nada aquí importa `server-only` ni `next/*`: si lo hiciera, el formulario no
  podría reutilizarlo y acabaríamos con dos reglas de validación que se
  desincronizan a la primera corrección.
*/

/** Los diez campos del formulario, en el orden en que se piden. */
export const CAMPOS_SOLICITUD = [
  'nombreComercio',
  'nombreContacto',
  'cargo',
  'telefono',
  'correo',
  'ciudad',
  'direccion',
  'categoria',
  'descripcion',
  'enlace',
] as const

export type CampoSolicitud = (typeof CAMPOS_SOLICITUD)[number]

/** Lo que llega del formulario: diez cadenas, ninguna de confianza. */
export type EntradaSolicitudAliado = Record<CampoSolicitud, string>

/** Lo mismo, ya recortado y normalizado. Solo existe si la validación pasó. */
export type SolicitudAliado = EntradaSolicitudAliado

export type ErroresSolicitud = Partial<Record<CampoSolicitud, string>>

export type ResultadoValidacion =
  | { ok: true; datos: SolicitudAliado }
  | { ok: false; errores: ErroresSolicitud }

/*
  Listas FIJAS, no leídas de `ciudades` / `categorias`.

  Quien rellena esto es un comercio que TODAVÍA NO EXISTE en el sistema: el
  valor no es una referencia a ningún `id`, es información para la persona que
  lea el correo. Leer esas tablas exigiría además lectura sin sesión, que es
  justo la dependencia de backend que esta pieza no quiere tener (SPEC §3.3).
*/
export const CIUDADES_ALIADO = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Otra',
] as const

export const CATEGORIAS_ALIADO = [
  'Gastronomía',
  'Salud y bienestar',
  'Belleza',
  'Moda',
  'Entretenimiento',
  'Servicios profesionales',
  'Otra',
] as const

/** Tope duro de la descripción. Pasarlo bloquea el envío. */
export const MAX_DESCRIPCION = 280

/** A partir de aquí el contador cambia de tono, sin bloquear nada todavía. */
export const AVISO_DESCRIPCION = 260

/**
 * Segundos mínimos entre que el formulario se pinta y llega el envío.
 *
 * Un humano no rellena diez campos en menos de tres segundos; un programa sí.
 * Es la mitad de la protección anti-spam (la otra es el campo trampa) y no
 * necesita ninguna dependencia. Deliberadamente bajo: el coste de un falso
 * positivo —una solicitud legítima rechazada— es mucho mayor que el de dejar
 * pasar algún envío automático que una persona leerá y descartará.
 */
export const SEGUNDOS_MINIMOS = 3

/** Copy de error por campo. Vive junto al validador para no duplicarlo en la UI. */
export const ERRORES: Record<CampoSolicitud, string> = {
  nombreComercio: 'Escribe el nombre de tu negocio.',
  nombreContacto: 'Escribe tu nombre.',
  cargo: '',
  telefono: 'Escribe un teléfono válido, de 7 a 10 dígitos.',
  correo: 'Escribe un correo electrónico válido.',
  ciudad: 'Selecciona una ciudad.',
  direccion: '',
  categoria: 'Selecciona una categoría.',
  descripcion: 'Cuéntanos brevemente qué ofrece tu negocio.',
  enlace: 'Escribe un enlace válido.',
}

/** Mensaje propio: el vacío y el «demasiado largo» no son el mismo problema. */
export const ERROR_DESCRIPCION_LARGA = `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`

/**
 * Solo dígitos, tras quitar `+`, espacios, guiones y paréntesis.
 *
 * Es el mismo criterio con el que `WhatsAppButton` limpia el número antes de
 * armar el enlace: si aquí se aceptara algo que allí no funciona, el teléfono
 * llegaría al correo en una forma con la que nadie puede escribir.
 */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** 7–10 dígitos: fijo nacional corto por abajo, celular colombiano por arriba. */
export function telefonoValido(valor: string): boolean {
  const digitos = soloDigitos(valor)
  return digitos.length >= 7 && digitos.length <= 10
}

/*
  Comprobación de correo DELIBERADAMENTE laxa.

  Validar direcciones con una expresión regular estricta rechaza direcciones
  legítimas —las reglas reales del RFC 5322 no caben en una— y el castigo de un
  falso negativo aquí es perder un comercio aliado. Se comprueba la forma
  mínima que hace que un correo pueda entregarse: algo, arroba y dominio con al
  menos un punto. El resto lo dice el rebote.
*/
const FORMA_CORREO = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function correoValido(valor: string): boolean {
  const limpio = valor.trim()
  return limpio.length <= 254 && FORMA_CORREO.test(limpio)
}

/**
 * Antepone `https://` si falta.
 *
 * A quien escribe `instagram.com/tunegocio` no se le pide que sepa qué es un
 * protocolo (SPEC §9). Sin esto, el enlace del correo se resolvería como ruta
 * relativa dentro del cliente de correo y no llevaría a ninguna parte.
 */
export function normalizarEnlace(valor: string): string {
  const limpio = valor.trim()
  if (limpio === '') return ''
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`
}

/** Vacío es válido: el enlace es opcional. Si hay algo, tiene que ser una URL con dominio. */
export function enlaceValido(valor: string): boolean {
  const limpio = valor.trim()
  if (limpio === '') return true

  try {
    const url = new URL(normalizarEnlace(limpio))
    // `https://taller` parsea sin error y no lleva a ningún sitio: exige punto.
    return url.hostname.includes('.') && !url.hostname.endsWith('.')
  } catch {
    return false
  }
}

/** Recorta las diez cadenas y normaliza el enlace. No juzga: solo limpia. */
function normalizar(entrada: EntradaSolicitudAliado): SolicitudAliado {
  const limpio = {} as SolicitudAliado
  for (const campo of CAMPOS_SOLICITUD) {
    limpio[campo] = (entrada[campo] ?? '').trim()
  }
  limpio.enlace = normalizarEnlace(limpio.enlace)
  return limpio
}

/**
 * El veredicto completo, campo a campo.
 *
 * Devuelve TODOS los errores a la vez, no el primero: un formulario que
 * descubre un problema nuevo en cada envío se rellena tres veces.
 *
 * El orden de las claves de `errores` sigue el de `CAMPOS_SOLICITUD`, que es el
 * orden visual — así el formulario puede enfocar «el primer campo con error»
 * sin tener que conocer la maquetación.
 */
export function validarSolicitudAliado(
  entrada: EntradaSolicitudAliado,
): ResultadoValidacion {
  const datos = normalizar(entrada)
  const errores: ErroresSolicitud = {}

  if (datos.nombreComercio === '') errores.nombreComercio = ERRORES.nombreComercio
  if (datos.nombreContacto === '') errores.nombreContacto = ERRORES.nombreContacto
  if (!telefonoValido(datos.telefono)) errores.telefono = ERRORES.telefono
  if (!correoValido(datos.correo)) errores.correo = ERRORES.correo

  /*
    La lista fija se comprueba TAMBIÉN contra su contenido, no solo contra el
    vacío: el `<select>` del navegador limita las opciones, pero la Server
    Action recibe un `FormData` que cualquiera puede componer a mano.
  */
  if (!CIUDADES_ALIADO.includes(datos.ciudad as (typeof CIUDADES_ALIADO)[number])) {
    errores.ciudad = ERRORES.ciudad
  }
  if (
    !CATEGORIAS_ALIADO.includes(datos.categoria as (typeof CATEGORIAS_ALIADO)[number])
  ) {
    errores.categoria = ERRORES.categoria
  }

  if (datos.descripcion === '') {
    errores.descripcion = ERRORES.descripcion
  } else if (datos.descripcion.length > MAX_DESCRIPCION) {
    errores.descripcion = ERROR_DESCRIPCION_LARGA
  }

  if (!enlaceValido(datos.enlace)) errores.enlace = ERRORES.enlace

  const hayError = CAMPOS_SOLICITUD.some((campo) => errores[campo])
  return hayError ? { ok: false, errores } : { ok: true, datos }
}

/**
 * La mitad automática de la protección anti-spam.
 *
 * `trampa` es el campo que ninguna persona ve ni puede enfocar; si trae algo,
 * lo rellenó un programa. `abiertoEn` es el instante —de reloj del SERVIDOR,
 * nunca del cliente, que puede ir mal— en que se pintó el formulario.
 *
 * Devuelve `true` cuando el envío parece automático. Un `abiertoEn` ausente o
 * ilegible se trata como sospechoso: el formulario legítimo siempre lo lleva.
 */
export function pareceAutomatico(
  trampa: string,
  abiertoEn: number | null,
  ahora: number,
): boolean {
  if (trampa.trim() !== '') return true
  if (abiertoEn === null || !Number.isFinite(abiertoEn)) return true
  return ahora - abiertoEn < SEGUNDOS_MINIMOS * 1000
}

/**
 * Estado del formulario de comercio aliado.
 *
 * Vive aquí y no junto a la Server Action porque un fichero `'use server'` solo
 * puede exportar funciones asíncronas: cualquier constante o tipo que se declare
 * allí se descarta al empaquetar, y el módulo acaba sin exportaciones —un fallo
 * que no aparece en `tsc` ni en el linter, solo al construir.
 *
 * `valores` viaja de vuelta a propósito: un comercio que rellena diez campos y
 * los ve desaparecer tras un error no vuelve a rellenarlos. Como el formulario
 * no está controlado, esta copia es lo único que permite repintarlo.
 */
export type SolicitudAliadoState = {
  ok?: boolean
  /** Fallo que NO es de un campo concreto: envío caído, configuración ausente. */
  error?: string
  errores?: ErroresSolicitud
  valores?: EntradaSolicitudAliado
}

/** Nombre del campo trampa. Suena plausible para un robot y no existe para nadie más. */
export const CAMPO_TRAMPA = 'confirmacion_web'

/** Nombre del campo con el instante de pintado, en milisegundos del servidor. */
export const CAMPO_ABIERTO_EN = 'abierto_en'
