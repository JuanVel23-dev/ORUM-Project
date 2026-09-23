import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { escaparHtml } from '../shared/html'

export type InputCorreoInvitacion = {
  nombre: string
  correo: string
  urlInvitacion: string
}

export type CuerpoCorreo = {
  asunto: string
  html: string
  texto: string
}

export function construirCorreoInvitacion(input: InputCorreoInvitacion): CuerpoCorreo {
  const nombre = escaparHtml(input.nombre)
  const correo = escaparHtml(input.correo)
  const asunto = 'Bienvenido a ORUM — activa tu cuenta'

  const html = `
    <p>Hola ${nombre},</p>
    <p>Se creó tu cuenta en ORUM (${correo}). Activa el acceso y elige tu propia
    contraseña con este enlace de un solo uso:</p>
    <p><a href="${escaparHtml(input.urlInvitacion)}">Activar mi cuenta</a></p>
    <p>Si no esperabas este correo, puedes ignorarlo.</p>
  `.trim()

  const texto = [
    `Hola ${input.nombre},`,
    '',
    `Se creó tu cuenta en ORUM (${input.correo}). Activa el acceso y elige tu propia`,
    'contraseña con este enlace de un solo uso:',
    '',
    input.urlInvitacion,
    '',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n')

  return { asunto, html, texto }
}

export type InputCorreoRecuperacion = { urlRecuperacion: string }

export function construirCorreoRecuperacion(input: InputCorreoRecuperacion): CuerpoCorreo {
  const asunto = 'Restablece tu contraseña en ORUM'

  const html = `
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña en ORUM. Elige una
    nueva con este enlace de un solo uso:</p>
    <p><a href="${escaparHtml(input.urlRecuperacion)}">Restablecer mi contraseña</a></p>
    <p>Si no fuiste tú, puedes ignorarlo: tu contraseña actual sigue funcionando.</p>
  `.trim()

  const texto = [
    'Hola,',
    '',
    'Recibimos una solicitud para restablecer tu contraseña en ORUM. Elige una',
    'nueva con este enlace de un solo uso:',
    '',
    input.urlRecuperacion,
    '',
    'Si no fuiste tú, puedes ignorarlo: tu contraseña actual sigue funcionando.',
  ].join('\n')

  return { asunto, html, texto }
}

export type ConfigSmtp = { usuario: string; password: string; remitente: string }

/**
 * Lee la configuración SMTP del entorno. Devuelve `null` si falta cualquier
 * variable: el envío es best-effort y una ausencia no debe romper el flujo.
 * La contraseña de aplicación de Google se muestra en bloques separados por
 * espacios ("abcd efgh …"); se quitan para que funcione pegada tal cual.
 */
export function leerConfigSmtp(env: Record<string, string | undefined>): ConfigSmtp | null {
  const usuario = env.GMAIL_SMTP_USER?.trim()
  const password = env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s+/g, '')
  const remitente = env.GMAIL_FROM_EMAIL?.trim()
  if (!usuario || !password || !remitente) return null
  return { usuario, password, remitente }
}

export type InputCorreo = {
  para: string
  nombre: string
  asunto: string
  html: string
  texto: string
}

let cache: { clave: string; transporte: Transporter } | null = null

/** El transporte se reutiliza mientras la configuración no cambie. */
function obtenerTransporte(config: ConfigSmtp): Transporter {
  const clave = `${config.usuario}:${config.password}:${config.remitente}`
  if (cache?.clave !== clave) {
    cache = {
      clave,
      transporte: nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: config.usuario, pass: config.password },
      }),
    }
  }
  return cache.transporte
}

/** Envía un correo transaccional por SMTP de Gmail. Nunca lanza: registra y sigue. */
export async function enviarCorreo(input: InputCorreo): Promise<void> {
  const config = leerConfigSmtp(process.env)
  if (!config) {
    console.error('Correo no enviado: faltan variables GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD / GMAIL_FROM_EMAIL.')
    return
  }

  try {
    await obtenerTransporte(config).sendMail({
      from: { name: 'ORUM', address: config.remitente },
      to: { name: input.nombre, address: input.para },
      subject: input.asunto,
      html: input.html,
      text: input.texto,
    })
  } catch (err) {
    console.error('No se pudo enviar el correo:', err)
  }
}

export async function enviarCorreoInvitacion(input: InputCorreoInvitacion): Promise<void> {
  const { asunto, html, texto } = construirCorreoInvitacion(input)
  await enviarCorreo({ para: input.correo, nombre: input.nombre, asunto, html, texto })
}

export async function enviarCorreoRecuperacion(input: {
  correo: string
  urlRecuperacion: string
}): Promise<void> {
  const { asunto, html, texto } = construirCorreoRecuperacion({
    urlRecuperacion: input.urlRecuperacion,
  })
  await enviarCorreo({ para: input.correo, nombre: input.correo, asunto, html, texto })
}

/* ==========================================================================
   SOLICITUD DE COMERCIO ALIADO  ·  el correo que SÍ puede fallar en alto
   --------------------------------------------------------------------------
   Hermano de `construirCorreoInvitacion` y con su misma forma —entra un
   objeto plano, sale `{ asunto, html, texto }`, sin tocar la red— pero con dos
   diferencias que importan:

   1. EL DESTINATARIO ES INTERNO. La invitación va al socio nuevo; esto va al
      buzón de ORUM. Por eso no reutiliza `enviarCorreoInvitacion`: se invierten
      remitente y destinatario, y el `Reply-To` pasa a ser el comercio, para
      que responder desde el cliente de correo escriba a quien postuló.

   2. NO ES «BEST-EFFORT». `enviarCorreoInvitacion` se traga el fallo con un
      `console.error` porque el registro del miembro ya está hecho y el correo
      es un extra. Aquí el correo ES la solicitud: si se pierde, se pierde el
      comercio aliado y nadie se entera —no hay tabla donde mirar (B3 de la
      spec)—. Así que `enviarCorreoSolicitudAliado` LANZA, y quien la llama
      tiene la obligación de enseñarle el fallo al visitante.

   Todo dato del formulario pasa por `escaparHtml` antes de entrar en el
   cuerpo HTML: es texto escrito por un desconocido, sin sesión, sin límite de
   intentos, y acaba en el cliente de correo de una persona de ORUM.
   ========================================================================== */

export type InputCorreoSolicitudAliado = {
  nombreComercio: string
  nombreContacto: string
  cargo: string
  telefono: string
  correo: string
  ciudad: string
  direccion: string
  categoria: string
  descripcion: string
  /** Ya normalizado con protocolo por `normalizarEnlace`. Puede ir vacío. */
  enlace: string
}

/** Las filas del correo, en el orden en que se leen. Vacío = no se pinta. */
function filasSolicitud(input: InputCorreoSolicitudAliado): Array<[string, string]> {
  return [
    ['Comercio', input.nombreComercio],
    ['Contacto', input.nombreContacto],
    ['Cargo', input.cargo],
    ['Teléfono', input.telefono],
    ['Correo', input.correo],
    ['Ciudad', input.ciudad],
    ['Dirección', input.direccion],
    ['Categoría', input.categoria],
    ['Enlace', input.enlace],
  ].filter(([, valor]) => valor.trim() !== '') as Array<[string, string]>
}

export function construirCorreoSolicitudAliado(
  input: InputCorreoSolicitudAliado,
): CuerpoCorreo {
  /*
    El asunto va SIN escapar, y no es un descuido: es una cabecera de texto
    plano, no HTML. Escaparlo mostraría «Casa &amp; Duarte» en la bandeja de
    entrada, que es un error visible, mientras que el riesgo que `escaparHtml`
    cubre —inyectar marcado— no existe fuera del cuerpo HTML.
  */
  const asunto = `Nueva solicitud de comercio aliado — ${input.nombreComercio}`

  const filas = filasSolicitud(input)

  const filasHtml = filas
    .map(
      ([etiqueta, valor]) =>
        `<tr><td><strong>${escaparHtml(etiqueta)}</strong></td><td>${escaparHtml(valor)}</td></tr>`,
    )
    .join('')

  const html = `
    <p>Llegó una postulación desde la página pública de ORUM.</p>
    <table>${filasHtml}</table>
    <p><strong>Qué ofrece</strong><br>${escaparHtml(input.descripcion)}</p>
    <p>Responde a este correo para escribirle directamente a quien postuló.</p>
  `.trim()

  const texto = [
    'Llegó una postulación desde la página pública de ORUM.',
    '',
    ...filas.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`),
    '',
    'Qué ofrece:',
    input.descripcion,
    '',
    'Responde a este correo para escribirle directamente a quien postuló.',
  ].join('\n')

  return { asunto, html, texto }
}

/**
 * Envía la solicitud al buzón interno por SMTP. **Lanza** si no puede.
 *
 * A diferencia de `enviarCorreo`, que registra el fallo y sigue, esto lanza a
 * propósito: si la solicitud no sale, el formulario tiene que decírselo al
 * comercio para que reintente o escriba por WhatsApp. No hay tabla donde
 * quede guardada, así que un fallo silencioso la perdería sin rastro.
 *
 * El destinatario sale de `SOLICITUDES_EMAIL`, con respaldo al remitente
 * (`GMAIL_FROM_EMAIL`), que siempre existe si el correo está configurado.
 *
 * Migrado de MailerSend al transporte SMTP de Gmail al fusionar `main`, que
 * retiró MailerSend del proyecto.
 */
export async function enviarCorreoSolicitudAliado(
  input: InputCorreoSolicitudAliado,
): Promise<void> {
  const config = leerConfigSmtp(process.env)
  if (!config) {
    throw new Error(
      'Correo sin configurar: falta GMAIL_SMTP_USER, GMAIL_SMTP_APP_PASSWORD o GMAIL_FROM_EMAIL.',
    )
  }
  const destinatario = process.env.SOLICITUDES_EMAIL?.trim() || config.remitente

  const { asunto, html, texto } = construirCorreoSolicitudAliado(input)

  await obtenerTransporte(config).sendMail({
    from: { name: 'ORUM', address: config.remitente },
    to: { name: 'Solicitudes ORUM', address: destinatario },
    /* Responder desde el cliente de correo escribe al comercio, no a ORUM. */
    replyTo: { name: input.nombreContacto, address: input.correo },
    subject: asunto,
    html,
    text: texto,
  })
}
