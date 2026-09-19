import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
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

export type InputCorreoRecuperacion = { urlRecuperacion: string }

export function construirCorreoRecuperacion(input: InputCorreoRecuperacion): CuerpoCorreo {
  const asunto = 'Restablece tu contraseña en ORUM'

  const html = `
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña en ORUM. Elige una
    nueva con este enlace de un solo uso:</p>
    <p><a href="${input.urlRecuperacion}">Restablecer mi contraseña</a></p>
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

let transporte: Transporter | null = null

function obtenerTransporte(config: ConfigSmtp): Transporter {
  transporte ??= nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.usuario, pass: config.password },
  })
  return transporte
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
