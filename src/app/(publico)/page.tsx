import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Cifra } from '@/components/ui/cifra'
import { getPerfilActual } from '@/lib/auth/auth'
import {
  obtenerInstanteServidor,
  obtenerVitrinaPublica,
  obtenerWhatsappSoporte,
  type ComercioVitrina,
} from '@/lib/publico/datos-publicos'
import { obtenerPortadasPublicas } from './_datos/portadas-publicas'
import { AliadosOverlayTrigger } from './_components/aliados-overlay-trigger'
import { ComoFunciona } from './_components/como-funciona'
import { CtaSocio } from './_components/cta-socio'
import { HeroPublico } from './_components/hero-publico'
import { Revelar } from './_components/revelar'
import { VitrinaPublica } from './_components/vitrina-publica'
import escaparate from './escaparate.module.css'
import estilos from './landing.module.css'

export const metadata: Metadata = {
  title: 'ORUM · Tu carnet para vivir la ciudad distinto',
  description:
    'Club de beneficios por membresía. Un solo carnet y decenas de comercios aliados en gastronomía, salud y belleza.',
  openGraph: {
    title: 'ORUM · Tu carnet para vivir la ciudad distinto',
    description:
      'Club de beneficios por membresía. Un solo carnet y decenas de comercios aliados.',
    type: 'website',
  },
}

/**
 * LA LANDING, y por qué vive en la raíz.
 *
 * La raíz fue primero a `/admin`, con el comentario «por ahora el proyecto solo
 * tiene el Portal Administrativo». Dejó de ser cierto y nadie cambió el
 * destino: un socio que escribía el dominio aterrizaba en el acceso
 * administrativo con `?error=sin_permiso`, que se lee como «no eres bienvenido»
 * y no como «esta no es tu puerta». Se corrigió mandándola a `/miembros`.
 *
 * Ahora falla por el otro lado. Quien escribe el dominio a secas es, la mayoría
 * de las veces, alguien que TODAVÍA NO ES SOCIO —de eso va tener una landing— y
 * mandarlo a un portal que le exige credenciales que no tiene es el mismo error
 * de antes con otro destino. Así que la raíz deja de redirigir y pasa a ser la
 * fachada pública.
 *
 * Lo que NO cambia: el socio sigue entrando por `/miembros`, quien trabaja en el
 * club por `/admin` o `/comercios`, y el `start_url` de la aplicación instalable
 * sigue siendo `/miembros` (`manifest.ts`). A quien ya tiene la PWA en su
 * teléfono esto no le mueve nada.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * EL RITMO TONAL DE LA PÁGINA (v4, franjas a ancho completo)
 *
 *   Héroe .............. CACAO        ← la única superficie donde el oro grande
 *                                       es legible: 7,83:1 (sobre crema, 1,99:1)
 *   Así funciona ....... CREMA HONDA  ← relleno sin texto tenue ni tarjetas
 *   Vitrina ............ CREMA
 *   El club en números . PAPEL
 *   Hazte socio hoy .... CACAO        ← el cierre ceremonial, con el CTA en oro
 *   ¿Tienes un negocio? PAPEL         ← subordinada, no compite
 *   Pie ................ CREMA        (lo pone `pie-publico.module.css`)
 *
 * Ninguna sección queda en el mismo tono que su vecina. Lo que separa las
 * secciones es el campo de color, no una línea: es lo que hace Agence Cartier
 * sin una sola sombra en toda su página.
 */
export const dynamic = 'force-dynamic'

export default async function LandingPublica() {
  /*
    Las lecturas van en paralelo: son independientes y encadenarlas con `await`
    seguidos sumaría sus latencias en el camino más caliente del sitio.
    `cache()` ya evita que el layout y esta página consulten dos veces el número
    de soporte dentro de la misma petición.
  */
  const [vitrina, soporte, perfil, abiertoEn, portadas] = await Promise.all([
    obtenerVitrinaPublica(),
    obtenerWhatsappSoporte(),
    getPerfilActual(),
    obtenerInstanteServidor(),
    obtenerPortadasPublicas(),
  ])

  /*
    LA FOTO DEL LOCAL SE INYECTA AQUÍ, en un solo sitio.

    `obtenerVitrinaPublica` devuelve `portadaUrl: null` en duro —su comentario
    dice que la columna no existe, y eso dejó de ser cierto—, pero ese archivo
    está fuera del alcance de esta tanda. Se compone aquí para que el héroe y la
    vitrina reciban el modelo YA COMPLETO y ninguno de los dos tenga que saber
    de dónde salió la fotografía. Ver `_datos/portadas-publicas.ts`.
  */
  const comercios: ComercioVitrina[] = vitrina.comercios.map((comercio) => ({
    ...comercio,
    portadaUrl: portadas.get(comercio.id) ?? null,
  }))

  const hayVitrina = comercios.length > 0

  /*
    HAY CIFRAS O NO HAY SECCIÓN.

    «0 comercios aliados en 0 ciudades» es peor que no decir nada: convierte el
    vacío de una base recién montada en una afirmación sobre el club. Se exige
    al menos un comercio; el contador de ciudades puede ser 0 sin que eso mienta
    (un comercio sin sucursales cargadas), y en ese caso solo se pinta la cifra
    que sí tiene contenido.
  */
  const hayCifras = vitrina.totalComercios > 0

  return (
    <>
      {/*
        EL SOCIO CON SESIÓN ABIERTA QUE LLEGA A `/`.

        No se le redirige: la landing es información pública y un socio tiene
        tanto derecho a leerla como cualquiera —puede estar enseñándosela a un
        amigo—. Pero tampoco se le deja buscar la entrada, así que se le tiende
        un puente al principio de la página. Solo para el rol `miembro`: quien
        trabaja en el club entra por otra puerta y ya la tiene guardada.

        Va ANTES de la primera franja a propósito: `escaparate.franja:first-child`
        se come el relleno superior del `<main>` para que el cacao empiece pegado
        a la cabecera, y cuando este puente existe esa banda de papel sí tiene
        contenido y debe conservarse.
      */}
      {perfil?.rolCodigo === 'miembro' && (
        <Link href="/miembros" className={estilos.puente}>
          <span>Ya eres socio. Ir a mi portal</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}

      <HeroPublico soporte={soporte} comercios={comercios} hayVitrina={hayVitrina} />

      {/*
        «Cómo funciona» ANTES que la vitrina, y no al revés.

        La tentación es abrir con los comercios, que es lo bonito. Pero el deseo
        sin mecanismo no convierte: quien no sabe todavía qué es ORUM mira una
        fila de logotipos y no entiende qué tiene que ver con él. Primero se
        entiende el club, después se desea lo que ofrece.
      */}
      <ComoFunciona />

      <VitrinaPublica comercios={comercios} />

      {hayCifras && (
        <section
          className={[escaparate.franja, escaparate.tonoPapel, estilos.cifras].join(
            ' ',
          )}
          aria-labelledby="cifras-club"
        >
          <Revelar modo="contenedor">
            <h2 id="cifras-club" className={escaparate.tituloSeccion}>
              El club, en números
            </h2>

            <div className={estilos.rejillaCifras}>
              <Card padding="lg" className={estilos.tarjetaCifra}>
                {/*
                  `size="display"` es el peldaño `--t-hero-cifra`: Fraunces a
                  52px con `tabular-nums` obligatorio. Está prohibido en
                  Administración y en la Herramienta de Comercios —son pantallas
                  de trabajo— y habilitado justo aquí, que es el escaparate.
                */}
                <Cifra
                  size="display"
                  etiqueta="Comercios aliados"
                  valor={vitrina.totalComercios.toLocaleString('es-CO')}
                  nota="Y creciendo cada mes"
                />
              </Card>

              {vitrina.totalCiudades > 0 && (
                <Card padding="lg" className={estilos.tarjetaCifra}>
                  <Cifra
                    size="display"
                    etiqueta={vitrina.totalCiudades === 1 ? 'Ciudad' : 'Ciudades'}
                    valor={vitrina.totalCiudades.toLocaleString('es-CO')}
                    nota="Con al menos una sede activa"
                  />
                </Card>
              )}
            </div>
          </Revelar>
        </section>
      )}

      {/*
        EL CIERRE. Repite el CTA del héroe a propósito: quien llega hasta aquí
        lleva varias pantallas de desplazamiento y el botón de arriba ya no
        existe para él. Pedirle que suba a buscarlo es perder la conversión que
        acabas de ganar.

        Y vuelve al CACAO, que es lo que cierra la página con el mismo material
        con el que la abrió — entrada y salida por el mismo camino. Ya no es una
        tarjeta centrada con borde: una tarjeta gigante de ancho de columna se
        lee como un aviso; una franja, como un final.
      */}
      <section
        className={[
          escaparate.franja,
          escaparate.tonoCacao,
          estilos.cierre,
          estilos.franjaCierre,
        ].join(' ')}
      >
        <Revelar className={estilos.bloqueCierre}>
          <h2 className={[escaparate.tituloSeccion, estilos.tituloCierre].join(' ')}>
            Hazte socio hoy
          </h2>
          <p className={estilos.textoCierre}>
            Escríbenos por WhatsApp y te contamos los planes, los precios y cómo
            recibir tu carnet.
          </p>

          <div className={estilos.accionesCierre}>
            <CtaSocio soporte={soporte} size="lg" />
          </div>
        </Revelar>
      </section>

      {/*
        LA PUERTA DEL COMERCIO, subordinada y al final.

        Es una audiencia minoritaria —la landing la escribe para el socio— pero
        es la de mayor valor por cabeza, así que tiene su propio bloque en vez de
        un enlace perdido en el pie. Secundaria en peso visual, nunca compitiendo
        con «Hazte socio»: de ahí que vuelva a papel justo después del cacao.
      */}
      <section className={[escaparate.franja, escaparate.tonoPapel].join(' ')}>
        <Revelar className={estilos.aliados}>
          <div>
            <h2 className={estilos.tituloAliados}>¿Tienes un negocio?</h2>
            <p className={estilos.textoAliados}>
              Los socios de ORUM buscan dónde comer, cuidarse y consentirse. Súmate
              al club y llega a ellos.
            </p>
          </div>

          {/*
            `Date.now()` del SERVIDOR: el reloj del visitante puede ir mal y la
            comprobación anti-robot necesita un reloj del que fiarse.
          */}
          <AliadosOverlayTrigger abiertoEn={abiertoEn} soporte={soporte} />
        </Revelar>
      </section>
    </>
  )
}
