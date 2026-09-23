'use server'

import {
  CAMPO_ABIERTO_EN,
  CAMPO_TRAMPA,
  pareceAutomatico,
  validarSolicitudAliado,
  type CampoSolicitud,
  type EntradaSolicitudAliado,
  type SolicitudAliadoState,
} from '@/lib/aliados/solicitud-aliado'
import { enviarCorreoSolicitudAliado } from '@/lib/correo/correo'

function leer(formData: FormData, campo: CampoSolicitud): string {
  return String(formData.get(campo) ?? '')
}

function leerEntrada(formData: FormData): EntradaSolicitudAliado {
  return {
    nombreComercio: leer(formData, 'nombreComercio'),
    nombreContacto: leer(formData, 'nombreContacto'),
    cargo: leer(formData, 'cargo'),
    telefono: leer(formData, 'telefono'),
    correo: leer(formData, 'correo'),
    ciudad: leer(formData, 'ciudad'),
    direccion: leer(formData, 'direccion'),
    categoria: leer(formData, 'categoria'),
    descripcion: leer(formData, 'descripcion'),
    enlace: leer(formData, 'enlace'),
  }
}

/**
 * Recibe la solicitud de un comercio que quiere aliarse y la envía por correo.
 *
 * NO ES «BEST-EFFORT», y esa es la diferencia deliberada con
 * `enviarCorreoInvitacion`: aquel se traga los fallos porque el registro del
 * miembro ya se completó y el correo es un extra. Aquí el correo ES la
 * solicitud — si se pierde en silencio, se pierde un comercio aliado y nadie
 * se entera nunca. Por eso `enviarCorreoSolicitudAliado` lanza y esto devuelve
 * el error a la pantalla, con la salida por WhatsApp que pinta el formulario.
 */
export async function enviarSolicitudAliado(
  _previo: SolicitudAliadoState,
  formData: FormData,
): Promise<SolicitudAliadoState> {
  const valores = leerEntrada(formData)

  const trampa = String(formData.get(CAMPO_TRAMPA) ?? '')

  /*
    El campo trampa relleno solo puede ser obra de un programa: ninguna persona
    lo ve ni puede enfocarlo. Se responde «ok» sin enviar nada. Decirle al
    robot que lo detectamos solo le enseña a esquivarlo la próxima vez.
  */
  if (trampa.trim() !== '') return { ok: true }

  const crudoAbiertoEn = Number(formData.get(CAMPO_ABIERTO_EN))
  const abiertoEn = Number.isFinite(crudoAbiertoEn) ? crudoAbiertoEn : null

  /*
    La otra mitad —haber tardado menos del mínimo— SÍ se cuenta como error
    visible, no como éxito falso. Es la rama que un humano podría pisar (una
    pestaña restaurada, un autocompletado agresivo), y devolverle «enviado»
    cuando no se envió nada es justo la pérdida silenciosa que este formulario
    no puede permitirse.
  */
  if (pareceAutomatico('', abiertoEn, Date.now())) {
    return {
      error: 'No pudimos verificar el envío. Espera un momento e inténtalo otra vez.',
      valores,
    }
  }

  /*
    Se valida EN SERVIDOR aunque el navegador ya haya validado: el `FormData`
    lo puede componer cualquiera a mano, y el `<select>` no limita nada fuera
    del navegador.
  */
  const resultado = validarSolicitudAliado(valores)
  if (!resultado.ok) return { errores: resultado.errores, valores }

  try {
    await enviarCorreoSolicitudAliado(resultado.datos)
  } catch (err) {
    console.error('[aliados] falló el envío de la solicitud', err)
    return {
      error:
        'No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.',
      valores,
    }
  }

  return { ok: true }
}
