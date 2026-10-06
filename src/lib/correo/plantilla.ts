import { escaparHtml } from '../shared/html'

/* ==========================================================================
   PLANTILLA DE CORREO  ·  la envoltura común de todos los correos de ORUM
   --------------------------------------------------------------------------
   Un correo NO es una página web, y casi nada de lo que hace buena una página
   sirve aquí:

   - No puede leer `var(--…)`: los colores van como hex literales, copiados de
     `src/styles/tokens.css`. Es la misma excepción que ya tiene `QrCode`.
     Si la paleta cambia, hay que repasar esta tabla a mano.
   - Los estilos van EN LÍNEA: Gmail descarta o recorta `<style>` según el caso.
   - La maquetación va en `<table>`: Outlook (motor de Word) ignora `flex` y
     `grid`, y trata mal los `padding` de un `<a>`.
   - Las fuentes web no cargan de forma fiable: se nombra la de marca y se deja
     un respaldo seguro detrás.
   - Las imágenes se piden por URL absoluta y muchos clientes las bloquean
     hasta que el usuario lo permite. Por eso el `alt` del logo está vestido
     (dorado, con tracking): si la imagen no llega, la cabecera sigue
     diciendo «ORUM» y no queda un hueco negro.
   - Todo dato interpolado pasa por `escaparHtml` ANTES de entrar aquí; esta
     plantilla solo escapa lo que ella misma recibe como texto (`titulo`,
     `preheader`, `boton`, `urlRespaldo`). `cuerpoHtml` y `pieHtml` llegan ya
     construidos y no se vuelven a tocar.
   ========================================================================== */

/** Paleta de marca para correo. Origen: `tokens.css` (v6 · negro, crema y oro). */
const COLOR = {
  negro: '#0A0A0C', //     --cacao-bg · la franja de la cabecera
  crema: '#FAF6EC', //     --w-0 · la tarjeta
  hondo: '#F5EFDF', //     --w-100 · el fondo que rodea la tarjeta
  tinta: '#201B15', //     --tinta-1 · texto y texto del botón
  tinta2: '#5A5044', //    --tinta-2 · texto secundario
  oro: '#AE8118', //       --gold-600 · relleno del botón (4,84:1 con --tinta-1)
  oroTexto: '#886712', //  --gold-700 · enlaces sobre crema (4,87:1)
  oroDisplay: '#EDC85F', // --gold-400 · filete sobre negro
  oroClaro: '#F3DC9E', //  --gold-300 · texto dorado sobre negro (el alt del logo)
} as const

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const SANS = "Montserrat, Arial, Helvetica, sans-serif"

const URL_BASE_RESPALDO = 'https://cluborum.com'

/**
 * Base pública del sitio, sin barra final. Sale de `NEXT_PUBLIC_SITE_URL`, la
 * misma variable que usan los enlaces de los correos; con respaldo al dominio
 * de producción para que el logo no apunte a un `undefined/…` si falta.
 */
export function urlBaseSitio(env: Record<string, string | undefined> = process.env): string {
  const valor = env.NEXT_PUBLIC_SITE_URL?.trim()
  return (valor || URL_BASE_RESPALDO).replace(/\/+$/, '')
}

/** Escapa y conserva los saltos de línea del texto que escribió una persona. */
export function escaparConSaltos(valor: string): string {
  return escaparHtml(valor).replace(/\r?\n/g, '<br>')
}

/** Un párrafo con el estilo de cuerpo. Recibe HTML ya escapado. */
export function parrafo(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:24px;color:${COLOR.tinta};">${html}</p>`
}

/** Un párrafo secundario (nota al pie del cuerpo). Recibe HTML ya escapado. */
export function parrafoSecundario(html: string): string {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:13px;line-height:20px;color:${COLOR.tinta2};">${html}</p>`
}

export type InputPlantilla = {
  /** `<title>` del documento y titular visible. Texto plano: se escapa aquí. */
  titulo: string
  /** El texto gris que la bandeja de entrada enseña junto al asunto. */
  preheader: string
  /** HTML ya escapado: los párrafos del correo. */
  cuerpoHtml: string
  /** La acción única del correo. Se pinta como botón y como enlace de respaldo. */
  boton?: { texto: string; url: string }
  /** HTML ya escapado que va DESPUÉS del botón: avisos, «si no fuiste tú…». */
  cierreHtml?: string
  /** HTML ya escapado para el pie. Por defecto, el aviso de correo automático. */
  pieHtml?: string
  /** Para probar sin tocar el entorno. */
  urlBase?: string
}

const PIE_POR_DEFECTO = 'Recibes este correo porque se usó tu dirección en ORUM. Es un mensaje automático: no hace falta que respondas.'

function botonHtml(texto: string, url: string): string {
  const href = escaparHtml(url)
  /*
    «A prueba de Outlook»: el color de relleno va en la CELDA (`bgcolor` + estilo)
    y el `<a>` ocupa toda ella con `display:block`. Outlook ignora el padding de
    un `<a>` suelto, y un botón hecho solo con eso sale del tamaño del texto.
    Alto de 48px: por encima del objetivo táctil de 44px.
  */
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" bgcolor="${COLOR.oro}" style="background:${COLOR.oro};border-radius:6px;">
          <a href="${href}" target="_blank" style="display:block;padding:14px 32px;font-family:${SANS};font-size:15px;font-weight:700;line-height:20px;color:${COLOR.tinta};text-decoration:none;">${escaparHtml(texto)}</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-family:${SANS};font-size:12px;line-height:18px;color:${COLOR.tinta2};">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:18px;word-break:break-all;"><a href="${href}" target="_blank" style="color:${COLOR.oroTexto};">${href}</a></p>`
}

/** Envuelve el contenido en el documento completo, con cabecera y pie de marca. */
export function envolverCorreo(input: InputPlantilla): string {
  const base = input.urlBase ?? urlBaseSitio()
  const titulo = escaparHtml(input.titulo)
  const logo = `${base}/correo/orum-plata.png`

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.hondo};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escaparHtml(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.hondo}" style="background:${COLOR.hondo};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" bgcolor="${COLOR.negro}" style="background:${COLOR.negro};padding:28px 24px;border-bottom:3px solid ${COLOR.oroDisplay};border-radius:8px 8px 0 0;">
            <img src="${escaparHtml(logo)}" alt="ORUM" width="160" height="42" style="display:block;margin:0 auto;border:0;outline:none;height:auto;max-width:160px;font-family:${SERIF};font-size:28px;line-height:42px;letter-spacing:8px;color:${COLOR.oroClaro};">
          </td>
        </tr>
        <tr>
          <td bgcolor="${COLOR.crema}" style="background:${COLOR.crema};padding:36px 32px 20px;">
            <h1 style="margin:0 0 20px;font-family:${SERIF};font-size:26px;line-height:32px;font-weight:600;color:${COLOR.tinta};">${titulo}</h1>
            ${input.cuerpoHtml}
            ${input.boton ? botonHtml(input.boton.texto, input.boton.url) : ''}
            ${input.cierreHtml ?? ''}
          </td>
        </tr>
        <tr>
          <td bgcolor="${COLOR.crema}" style="background:${COLOR.crema};padding:0 32px 28px;border-radius:0 0 8px 8px;">
            <p style="margin:0;padding-top:16px;border-top:1px solid ${COLOR.hondo};font-family:${SANS};font-size:12px;line-height:18px;color:${COLOR.tinta2};">${input.pieHtml ?? PIE_POR_DEFECTO}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
