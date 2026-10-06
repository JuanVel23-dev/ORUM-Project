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

/*
  VALIDACIÓN EXIGENTE  ·  05/10/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «excepciones muy exigentes, ya que es el portal
  público; no quiero que pongan datos que no son». Hasta hoy bastaba con que
  los campos no estuvieran vacíos: «asdf» era un nombre, «1111111» un teléfono
  y «a@b.c» un correo.

  Lo que una función pura PUEDE comprobar es que el dato sea VEROSÍMIL —que
  tenga la forma de un nombre, de un teléfono colombiano, de un correo
  entregable—, no que sea verdadero. Eso lo sigue diciendo la llamada de quien
  lee la solicitud. Cada regla de aquí rechaza un tipo de relleno visto en
  formularios públicos: teclas al azar, un carácter repetido, enlaces o
  marcado metidos donde va un nombre, teléfonos de mentira, correos
  desechables.

  Cada campo tiene su función `revisar…`, que devuelve el MENSAJE de lo que
  falla (o `null`): el aviso dice qué corregir, no solo «inválido».
*/

/** Copy del error BASE por campo (vacío o sin elegir). Los demás motivos, abajo. */
export const ERRORES: Record<CampoSolicitud, string> = {
  nombreComercio: 'Escribe el nombre de tu negocio.',
  nombreContacto: 'Escribe tu nombre y tu apellido.',
  cargo: 'Escribe un cargo real, solo con letras (por ejemplo, «Propietaria»).',
  telefono:
    'Escribe un teléfono colombiano válido: un celular de 10 dígitos que empiece por 3, o un fijo con su indicativo (60…).',
  correo: 'Escribe un correo electrónico válido, como nombre@dominio.com.',
  ciudad: 'Selecciona una ciudad.',
  direccion: 'Escribe la dirección completa, con su número (por ejemplo, «Cra 15 # 93-47»).',
  categoria: 'Selecciona una categoría.',
  descripcion: 'Cuéntanos brevemente qué ofrece tu negocio.',
  enlace: 'Escribe un enlace válido, como instagram.com/tunegocio.',
}

/** Mensaje propio: el vacío y el «demasiado largo» no son el mismo problema. */
export const ERROR_DESCRIPCION_LARGA = `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres.`

/** La descripción tiene que decir algo: al menos esto. */
export const MIN_DESCRIPCION = 20
export const ERROR_DESCRIPCION_CORTA = `Cuéntanos un poco más: al menos ${MIN_DESCRIPCION} caracteres y unas cuantas palabras.`

export const ERROR_TEXTO_NO_VALIDO =
  'Esto no parece un dato real. Escríbelo sin símbolos, enlaces ni letras repetidas.'
export const ERROR_NOMBRE_COMERCIO =
  'Escribe el nombre real de tu negocio: de 2 a 80 caracteres, con letras.'
export const ERROR_NOMBRE_CONTACTO =
  'Escribe tu nombre y tu apellido, solo con letras.'
export const ERROR_CORREO_TEMPORAL =
  'Usa un correo permanente: no aceptamos correos temporales o desechables.'
export const ERROR_CORREO_DOMINIO =
  'Revisa el dominio del correo: parece mal escrito (¿gmail.com, hotmail.com…?).'
export const ERROR_DESCRIPCION_ENLACE =
  'No pongas enlaces aquí: para eso está el campo de sitio web o red social.'

/* --- Piezas comunes --------------------------------------------------------- */

/** Letras de cualquier alfabeto (con tildes y ñ). */
const LETRAS = /\p{L}/gu
const VOCAL = /[aeiouáéíóúüy]/i

function contarLetras(valor: string): number {
  return valor.match(LETRAS)?.length ?? 0
}

/** Marcado, llaves o barras invertidas: nunca forman parte de un dato real. */
function tieneMarcado(valor: string): boolean {
  return /[<>{}[\]\\`|^~]/.test(valor)
}

/** Un enlace metido donde no va. */
function tieneEnlace(valor: string): boolean {
  return /https?:\/\/|www\./i.test(valor)
}

/** El mismo carácter cuatro veces seguidas («aaaa», «....»): relleno. */
function tieneRepeticion(valor: string, veces = 4): boolean {
  return new RegExp(`(.)\\1{${veces - 1},}`, 'u').test(valor)
}

/**
 * Teclas al azar: una palabra larga sin ninguna vocal («sdfghj»), o con cinco
 * consonantes seguidas («asdfgh»). Solo mira palabras de 5 letras o más, para
 * no tropezar con siglas ni abreviaturas («Cra», «SAS», «Ltda»).
 */
function pareceAlAzar(valor: string): boolean {
  const palabras = valor.split(/[^\p{L}]+/u).filter((p) => p.length >= 5)
  return palabras.some(
    (p) => !VOCAL.test(p) || /[^aeiouáéíóúüy\P{L}]{5,}/iu.test(p),
  )
}

/* --- Nombre del comercio ---------------------------------------------------- */

export function revisarNombreComercio(valor: string): string | null {
  const v = valor.trim()
  if (v === '') return ERRORES.nombreComercio
  if (v.length < 2 || v.length > 80 || contarLetras(v) < 2) return ERROR_NOMBRE_COMERCIO
  // Letras, números y la puntuación que de verdad lleva un nombre comercial.
  if (!/^[\p{L}\p{N} &'’.,\-+#/()°!¡]+$/u.test(v)) return ERROR_TEXTO_NO_VALIDO
  if (tieneMarcado(v) || tieneEnlace(v) || tieneRepeticion(v) || pareceAlAzar(v)) {
    return ERROR_TEXTO_NO_VALIDO
  }
  return null
}

/* --- Nombre de la persona y cargo ------------------------------------------- */

export function revisarNombreContacto(valor: string): string | null {
  const v = valor.trim().replace(/\s+/g, ' ')
  if (v === '') return ERRORES.nombreContacto
  // Solo letras, espacios, apóstrofo, punto y guion: un nombre no lleva cifras.
  if (v.length > 60 || !/^[\p{L}][\p{L} '’.-]*$/u.test(v)) return ERROR_NOMBRE_CONTACTO
  const palabras = v.split(' ').filter((p) => contarLetras(p) >= 2)
  // Nombre Y apellido: con una sola palabra no se sabe a quién llamar.
  if (palabras.length < 2) return ERROR_NOMBRE_CONTACTO
  if (palabras.some((p) => !VOCAL.test(p))) return ERROR_TEXTO_NO_VALIDO
  if (tieneRepeticion(v, 3) || pareceAlAzar(v)) return ERROR_TEXTO_NO_VALIDO
  return null
}

/** Opcional: vacío vale. Si hay algo, tiene que ser un cargo con letras. */
export function revisarCargo(valor: string): string | null {
  const v = valor.trim()
  if (v === '') return null
  if (v.length < 2 || v.length > 60 || contarLetras(v) < 2) return ERRORES.cargo
  if (!/^[\p{L}][\p{L} '’.,/&-]*$/u.test(v)) return ERRORES.cargo
  if (tieneRepeticion(v, 3) || pareceAlAzar(v)) return ERROR_TEXTO_NO_VALIDO
  return null
}

/* --- Teléfono ---------------------------------------------------------------- */

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

/** Los 10 dígitos nacionales: quita el indicativo `57` si viene («+57 300…»). */
export function telefonoNacional(valor: string): string {
  const digitos = soloDigitos(valor)
  return digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos
}

/**
 * Un teléfono COLOMBIANO de verdad: 10 dígitos, y o es un celular (empieza
 * por 3) o un fijo con su indicativo (60 + una cifra de zona + 7 dígitos).
 * Se rechazan los de mentira: un mismo dígito repetido («3000000000»,
 * «3111111111») y las escaleras («3123456789»).
 */
export function telefonoValido(valor: string): boolean {
  // Solo cifras y los separadores de siempre: letras en un teléfono, no.
  if (!/^[\d\s()+.-]+$/.test(valor.trim())) return false
  const n = telefonoNacional(valor)
  if (n.length !== 10) return false
  if (!/^3\d{9}$/.test(n) && !/^60[1-8]\d{7}$/.test(n)) return false
  // Siete o más veces el mismo dígito seguido.
  if (/(\d)\1{6,}/.test(n)) return false
  // Una escalera de siete: 1234567, 7654321.
  if (/1234567|2345678|3456789|9876543|8765432|7654321/.test(n)) return false
  return true
}

/* --- Correo ------------------------------------------------------------------ */

/*
  La forma de un correo ENTREGABLE: usuario con los caracteres habituales, que
  no empieza ni acaba en punto; dominio de etiquetas válidas; y una extensión
  de letras, de 2 a 24. Más estricta que la de antes («algo@algo.algo»), que
  aceptaba «a@b.c». No es el RFC 5322 entero —no cabe en una expresión— pero
  no rechaza ninguna dirección de las que usa un negocio.
*/
const FORMA_CORREO =
  /^[a-z0-9_%+-]+(?:\.[a-z0-9_%+-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i

/** Servicios de correo de usar y tirar: quien los usa no quiere que lo llamen. */
const DOMINIOS_DESECHABLES = new Set([
  'mailinator.com',
  'yopmail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'throwawaymail.com',
  'mohmal.com',
  'emailondeck.com',
  'moakt.com',
  'example.com',
  'example.org',
  'test.com',
])

/** Los tropiezos de dedo más comunes: el correo llegaría a ninguna parte. */
const DOMINIOS_MAL_ESCRITOS = new Set([
  'gmial.com',
  'gmai.com',
  'gmal.com',
  'gamil.com',
  'gnail.com',
  'gmail.co',
  'gmail.con',
  'gmail.cm',
  'gmail.om',
  'hotmial.com',
  'hotmal.com',
  'hotmai.com',
  'hotmail.con',
  'hotmail.co',
  'homail.com',
  'outlok.com',
  'outloo.com',
  'outlook.con',
  'yaho.com',
  'yahooo.com',
  'yahoo.con',
  'icloud.con',
])

export function revisarCorreo(valor: string): string | null {
  const v = valor.trim().toLowerCase()
  if (v === '' || v.length > 254 || !FORMA_CORREO.test(v)) return ERRORES.correo
  const [usuario, dominio] = v.split('@')
  if (usuario.length > 64) return ERRORES.correo
  if (DOMINIOS_MAL_ESCRITOS.has(dominio)) return ERROR_CORREO_DOMINIO
  if (DOMINIOS_DESECHABLES.has(dominio)) return ERROR_CORREO_TEMPORAL
  return null
}

export function correoValido(valor: string): boolean {
  return revisarCorreo(valor) === null
}

/* --- Dirección --------------------------------------------------------------- */

/** Opcional. Si hay algo, tiene que parecer una dirección: letras Y un número. */
export function revisarDireccion(valor: string): string | null {
  const v = valor.trim()
  if (v === '') return null
  if (v.length < 6 || v.length > 120) return ERRORES.direccion
  if (contarLetras(v) < 2 || !/\d/.test(v)) return ERRORES.direccion
  if (!/^[\p{L}\p{N} #°º.,\-/()'’]+$/u.test(v)) return ERROR_TEXTO_NO_VALIDO
  if (tieneEnlace(v) || tieneRepeticion(v, 5) || pareceAlAzar(v)) return ERROR_TEXTO_NO_VALIDO
  return null
}

/* --- Descripción ------------------------------------------------------------- */

export function revisarDescripcion(valor: string): string | null {
  const v = valor.trim()
  if (v === '') return ERRORES.descripcion
  if (v.length > MAX_DESCRIPCION) return ERROR_DESCRIPCION_LARGA
  const palabras = v.split(/\s+/).filter((p) => contarLetras(p) >= 2)
  if (v.length < MIN_DESCRIPCION || palabras.length < 4) return ERROR_DESCRIPCION_CORTA
  if (tieneMarcado(v)) return ERROR_TEXTO_NO_VALIDO
  if (tieneEnlace(v)) return ERROR_DESCRIPCION_ENLACE
  if (tieneRepeticion(v) || pareceAlAzar(v)) return ERROR_TEXTO_NO_VALIDO
  return null
}

/* --- Enlace ------------------------------------------------------------------ */

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

/**
 * Vacío es válido: el enlace es opcional. Si hay algo, tiene que ser una
 * dirección web pública: `http(s)`, un dominio con extensión de letras (no
 * una IP ni `localhost`), sin usuario ni contraseña incrustados y sin
 * espacios.
 */
export function enlaceValido(valor: string): boolean {
  const limpio = valor.trim()
  if (limpio === '') return true
  if (limpio.length > 200 || /\s/.test(limpio) || tieneMarcado(limpio)) return false

  try {
    const url = new URL(normalizarEnlace(limpio))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (url.username !== '' || url.password !== '') return false
    return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i.test(url.hostname)
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
  // Los espacios dobles de un nombre pegado no son parte del nombre.
  limpio.nombreComercio = limpio.nombreComercio.replace(/\s+/g, ' ')
  limpio.nombreContacto = limpio.nombreContacto.replace(/\s+/g, ' ')
  limpio.correo = limpio.correo.toLowerCase()
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
  const anotar = (campo: CampoSolicitud, motivo: string | null) => {
    if (motivo) errores[campo] = motivo
  }

  anotar('nombreComercio', revisarNombreComercio(datos.nombreComercio))
  anotar('nombreContacto', revisarNombreContacto(datos.nombreContacto))
  anotar('cargo', revisarCargo(datos.cargo))
  anotar('telefono', telefonoValido(datos.telefono) ? null : ERRORES.telefono)
  anotar('correo', revisarCorreo(datos.correo))

  /*
    La lista fija se comprueba TAMBIÉN contra su contenido, no solo contra el
    vacío: el `<select>` del navegador limita las opciones, pero la Server
    Action recibe un `FormData` que cualquiera puede componer a mano.
  */
  if (!CIUDADES_ALIADO.includes(datos.ciudad as (typeof CIUDADES_ALIADO)[number])) {
    errores.ciudad = ERRORES.ciudad
  }
  anotar('direccion', revisarDireccion(datos.direccion))
  if (
    !CATEGORIAS_ALIADO.includes(datos.categoria as (typeof CATEGORIAS_ALIADO)[number])
  ) {
    errores.categoria = ERRORES.categoria
  }

  anotar('descripcion', revisarDescripcion(datos.descripcion))
  anotar('enlace', enlaceValido(datos.enlace) ? null : ERRORES.enlace)

  // El teléfono viaja ya limpio: los 10 dígitos, que es lo que se marca.
  if (!errores.telefono) datos.telefono = telefonoNacional(datos.telefono)

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
  /**
   * Fallo que NO es de un campo concreto: envío caído, configuración ausente,
   * o no haber marcado la casilla de Términos y política de privacidad — esa
   * casilla no es un dato del comercio, así que no vive en `ErroresSolicitud`.
   */
  error?: string
  errores?: ErroresSolicitud
  valores?: EntradaSolicitudAliado
  /** Para repintar la casilla marcada tras un error de otro campo. */
  aceptaTerminos?: boolean
}

/** Nombre del campo trampa. Suena plausible para un robot y no existe para nadie más. */
export const CAMPO_TRAMPA = 'confirmacion_web'

/** Nombre del campo con el instante de pintado, en milisegundos del servidor. */
export const CAMPO_ABIERTO_EN = 'abierto_en'
