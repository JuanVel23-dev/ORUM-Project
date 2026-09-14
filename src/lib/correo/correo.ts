import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
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
    <p><a href="${input.urlInvitacion}">Activar mi cuenta</a></p>
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

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY ?? '' })

export async function enviarCorreoInvitacion(input: InputCorreoInvitacion): Promise<void> {
  const { asunto, html, texto } = construirCorreoInvitacion(input)

  try {
    const remitente = new Sender(process.env.MAILERSEND_FROM_EMAIL ?? '', 'ORUM')
    const destinatarios = [new Recipient(input.correo, input.nombre)]

    const emailParams = new EmailParams()
      .setFrom(remitente)
      .setTo(destinatarios)
      .setSubject(asunto)
      .setHtml(html)
      .setText(texto)

    await mailerSend.email.send(emailParams)
  } catch (err) {
    console.error('No se pudo enviar el correo de invitación:', err)
  }
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
 * Envía la solicitud al buzón interno. **Lanza** si no puede.
 *
 * El destinatario sale de `SOLICITUDES_EMAIL`, con respaldo a
 * `MAILERSEND_FROM_EMAIL` —el remitente verificado, que siempre existe si el
 * correo está configurado—, para que un despliegue que olvide la variable
 * nueva siga entregando en vez de perder solicitudes.
 */
export async function enviarCorreoSolicitudAliado(
  input: InputCorreoSolicitudAliado,
): Promise<void> {
  const remitenteEmail = process.env.MAILERSEND_FROM_EMAIL ?? ''
  const destinatarioEmail = process.env.SOLICITUDES_EMAIL || remitenteEmail

  if (!process.env.MAILERSEND_API_KEY || !remitenteEmail || !destinatarioEmail) {
    throw new Error(
      'Correo sin configurar: falta MAILERSEND_API_KEY, MAILERSEND_FROM_EMAIL o SOLICITUDES_EMAIL.',
    )
  }

  const { asunto, html, texto } = construirCorreoSolicitudAliado(input)

  const emailParams = new EmailParams()
    .setFrom(new Sender(remitenteEmail, 'ORUM'))
    .setTo([new Recipient(destinatarioEmail, 'Solicitudes ORUM')])
    /* Responder en el cliente de correo escribe al comercio, no a ORUM. */
    .setReplyTo(new Recipient(input.correo, input.nombreContacto))
    .setSubject(asunto)
    .setHtml(html)
    .setText(texto)

  const respuesta = await mailerSend.email.send(emailParams)

  /*
    El SDK lanza ante un 4xx/5xx, pero lanza un objeto plano, no un `Error`, y
    hay rutas en las que resuelve con un estado que no es de éxito. Se
    comprueba explícitamente: un `202 Accepted` es la respuesta normal de
    MailerSend, y cualquier cosa fuera del rango 2xx se trata como fallo.
  */
  const estado = respuesta?.statusCode ?? 0
  if (estado < 200 || estado >= 300) {
    throw new Error(`MailerSend respondió ${estado} al enviar la solicitud de aliado.`)
  }
}
