import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { escaparHtml } from '../shared/html'

export type InputCorreoInvitacion = {
  nombre: string
  correo: string
  urlInvitacion: string
}

type CuerpoCorreo = {
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
