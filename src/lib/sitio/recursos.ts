/*
  RECURSOS DEL SITIO  ·  lo puro

  Todo lo de este archivo es función pura o constante: entra un descriptor,
  sale un veredicto. Sin red, sin Supabase, sin `File`. Es la norma del
  proyecto para lo que se prueba de forma automatizada, y es lo que permite
  que la validación del enlace se compruebe en `recursos.test.ts` sin montar
  nada.

  Este módulo NO lleva `server-only`: lo importan el gestor del panel (que es
  Server Component), las acciones de servidor y el componente de cliente que
  rota la imagen del héroe.
*/

import type { UbicacionRecurso } from '@/lib/supabase/database.types'

/* ==========================================================================
   UN RECURSO, TAL Y COMO LO VE EL VISITANTE
   --------------------------------------------------------------------------
   El tipo vive AQUÍ y no junto a la consulta que lo produce, por la misma
   razón que `EstadoSubida` vive en `imagenes/estado.ts` y no dentro de la
   acción: lo consume también un componente de cliente —`PortadaHeroe`, que
   rota la imagen de la portada—, y `datos-sitio.ts` lleva `server-only`.

   Hoy `import type` se borra al compilar y el `server-only` no llega a
   saltar, así que aquello compilaba. Pero es una trampa cargada: el día que
   alguien necesite de ese módulo un valor y no un tipo, el error no dirá
   «has cruzado la frontera», dirá que la clave de servicio acabó en el
   bundle del navegador. Mejor que la frontera no se pueda cruzar por
   descuido.

   Nótese lo que NO lleva: `creado_por` es el uuid de quien lo subió, o sea
   una persona, y no sale de la base. Ver `datos-sitio.ts`.
   ========================================================================== */

export type RecursoPublico = {
  id: number
  titulo: string
  /** Texto alternativo. `null` = decorativa. */
  descripcion: string | null
  url: string
  enlaceUrl: string | null
}

/* ==========================================================================
   LAS CUATRO UBICACIONES
   ========================================================================== */

/**
 * El orden es el del panel, y es deliberado: primero lo que se publica solo
 * (héroe, promociones) y después la biblioteca (logos, otros). Quien abre la
 * pantalla viene casi siempre a cambiar un cartel, no a buscar un logotipo.
 */
export const UBICACIONES_RECURSO = ['heroe', 'promo', 'logo', 'general'] as const

export function esUbicacionRecurso(valor: string): valor is UbicacionRecurso {
  return (UBICACIONES_RECURSO as readonly string[]).includes(valor)
}

type DescriptorUbicacion = {
  /** Encabezado del bloque en el panel. */
  titulo: string
  /** Qué hace esa ubicación, en una frase. Va bajo el encabezado. */
  nota: string
  /**
   * ¿Esta ubicación se pinta sola en la página pública?
   *
   * `heroe` y `promo` sí: el interruptor de visibilidad decide qué ve el
   * visitante. `logo` y `general` son BIBLIOTECA —se suben para tener la
   * dirección a mano— y ahí el interruptor no gobierna ninguna pantalla.
   * Decirlo en el tipo evita que el panel prometa una publicación que no
   * ocurre en ninguna parte.
   */
  sePublica: boolean
  /** Forma de la vista previa en el gestor. */
  forma: 'cuadrada' | 'apaisada'
}

export const DESCRIPTOR_UBICACION: Record<UbicacionRecurso, DescriptorUbicacion> = {
  heroe: {
    titulo: 'Imagen principal',
    nota: 'La fotografía grande de la portada. Si dejas varias visibles, se van alternando solas cada pocos segundos; si no hay ninguna, la portada muestra el collage de comercios aliados.',
    sePublica: true,
    forma: 'apaisada',
  },
  promo: {
    titulo: 'Promociones',
    nota: 'Los carteles del apartado de promociones de la página de inicio, junto a la misión y la visión. Solo se ven los que dejes marcados.',
    sePublica: true,
    forma: 'apaisada',
  },
  logo: {
    titulo: 'Logos de ORUM',
    nota: 'Los logotipos del club. No se publican solos: viven aquí para tenerlos a mano y copiar su dirección cuando haga falta.',
    sePublica: false,
    forma: 'cuadrada',
  },
  general: {
    titulo: 'Otros recursos',
    nota: 'Cualquier otra imagen de la página web. Tampoco se publica sola.',
    sePublica: false,
    forma: 'cuadrada',
  },
}

/* ==========================================================================
   EL ENLACE DE UN CARTEL
   --------------------------------------------------------------------------
   Un cartel de promoción puede llevar a algún sitio, y ese «algún sitio» lo
   escribe una persona en un campo de texto. Es superficie de inyección: un
   `javascript:alert(1)` en un `href` se ejecuta al hacer clic, y un
   `//evil.com` se lee como ruta relativa y termina siendo un redirector
   abierto con la marca de ORUM delante.

   Por eso la lista es BLANCA y corta:

     · `https://…`  — un destino externo, siempre cifrado. `http://` queda
       fuera: un cartel del club no manda a nadie a texto plano.
     · `/…`         — una ruta interna, y que NO empiece por `//`.

   Cualquier otra cosa se rechaza con un mensaje que dice qué escribir. Vacío
   es válido y significa «el cartel no lleva a ningún sitio».
   ========================================================================== */

export type VeredictoEnlace =
  | { ok: true; enlace: string | null }
  | { ok: false; error: string }

export function validarEnlaceRecurso(valor: string | null | undefined): VeredictoEnlace {
  const texto = (valor ?? '').trim()
  if (texto === '') return { ok: true, enlace: null }

  // `//evil.com` es una URL protocol-relative: el navegador la resuelve como
  // `https://evil.com`, no como una ruta de este sitio. Se descarta antes que
  // nada porque supera la comprobación ingenua de «empieza por /».
  if (texto.startsWith('//')) {
    return {
      ok: false,
      error: 'Ese enlace sale del sitio. Escríbelo completo, empezando por https://',
    }
  }

  if (texto.startsWith('/')) return { ok: true, enlace: texto }

  if (/^https:\/\/[^/\s]+/i.test(texto)) return { ok: true, enlace: texto }

  return {
    ok: false,
    error:
      'El enlace debe empezar por https:// si va a otra web, o por / si es una página de ORUM. Déjalo vacío si el cartel no lleva a ningún sitio.',
  }
}

/* ==========================================================================
   LA ROTACIÓN DEL HÉROE
   ========================================================================== */

/**
 * Cuánto dura cada imagen del héroe en pantalla.
 *
 * Seis segundos, y el número tiene motivo por los dos lados. Por abajo: menos
 * de cinco y quien está leyendo el titular percibe el cambio como una
 * interrupción, porque el movimiento periférico gana siempre a la lectura.
 * Por arriba: más de ocho y quien llega a la página nunca llega a ver la
 * segunda, con lo que poner varias no sirve de nada.
 *
 * No sale de `tokens.css` a propósito: no es una duración de animación —de
 * esas manda el token— sino cuánto se queda quieta una imagen, que es una
 * decisión de contenido.
 */
export const MS_POR_IMAGEN_HEROE = 6000

/**
 * El índice siguiente del carrusel. Trivial, y por eso mismo está aquí:
 * escrito en línea dentro del `setInterval` se convierte en `(i + 1) % 0`
 * —`NaN`— el día que la lista llegue vacía, y un `NaN` como índice pinta
 * `undefined` sin avisar.
 */
export function siguienteIndice(actual: number, total: number): number {
  if (!Number.isInteger(total) || total < 1) return 0
  return (actual + 1) % total
}
