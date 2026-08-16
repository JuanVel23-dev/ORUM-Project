import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

export type RolCorreo = 'miembro' | 'staff'

export type InputCorreoBienvenida = {
  nombre: string
  correo: string
  password: string
  rol: RolCorreo
  urlBase: string
}

type CuerpoCorreo = {
  asunto: string
  html: string
  texto: string
}

export function construirCorreoBienvenida(input: InputCorreoBienvenida): CuerpoCorreo {
  const rutaLogin = input.rol === 'miembro' ? '/miembros/login' : '/login'
  const urlLogin = `${input.urlBase}${rutaLogin}`
  const asunto = 'Bienvenido a ORUM — tus datos de acceso'

  const html = `
    <p>Hola ${input.nombre},</p>
    <p>Se creó tu cuenta en ORUM. Estos son tus datos de acceso:</p>
    <ul>
      <li><strong>Correo:</strong> ${input.correo}</li>
      <li><strong>Contraseña:</strong> ${input.password}</li>
    </ul>
    <p><a href="${urlLogin}">Iniciar sesión</a></p>
  `.trim()

  const texto = [
    `Hola ${input.nombre},`,
    '',
    'Se creó tu cuenta en ORUM. Estos son tus datos de acceso:',
    '',
    `Correo: ${input.correo}`,
    `Contraseña: ${input.password}`,
    '',
    `Inicia sesión aquí: ${urlLogin}`,
  ].join('\n')

  return { asunto, html, texto }
}

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY ?? '' })

export async function enviarCorreoBienvenida(
  input: Omit<InputCorreoBienvenida, 'urlBase'>,
): Promise<void> {
  const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { asunto, html, texto } = construirCorreoBienvenida({ ...input, urlBase })

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
    console.error('No se pudo enviar el correo de bienvenida:', err)
  }
}