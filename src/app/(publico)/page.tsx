import type { Metadata } from 'next'
import { getPerfilActual } from '@/lib/auth/auth'
import {
  obtenerInstanteServidor,
  obtenerPlanesPublicos,
  obtenerVitrinaPublica,
  obtenerWhatsappSoporte,
} from '@/lib/publico/datos-publicos'
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { AnuncioBanner } from '@/components/anuncios/anuncio-banner'
import { AliadosOverlayTrigger } from './_components/aliados-overlay-trigger'
import { ComerciosDestacados } from './_components/comercios-destacados'
import { ComoFunciona } from './_components/como-funciona'
import { CtaSocio } from './_components/cta-socio'
import { HeroPublico } from './_components/hero-publico'
import { MembresiasPublicas } from './_components/membresias-publicas'
import { QueEsOrum } from './_components/que-es-orum'
import { Revelar } from './_components/revelar'
import { REVELAR, REVELAR_DER, REVELAR_IZQ, revelarEscalonado } from './_components/revelado'
import { ValoresOrum } from './_components/valores-orum'
import escaparate from './escaparate.module.css'
import estilos from './landing.module.css'

export const metadata: Metadata = {
  title: 'ORUM · Descubre lo mejor de tu ciudad',
  description:
    'Club de beneficios por membresía. Una red de valor que conecta personas con los mejores comercios y experiencias locales.',
  openGraph: {
    title: 'ORUM · Descubre lo mejor de tu ciudad',
    description:
      'Una red de valor que conecta personas con los mejores comercios y experiencias locales.',
    type: 'website',
  },
}

/**
 * LA LANDING, y por qué vive en la raíz.
 *
 * Quien escribe el dominio a secas es, la mayoría de las veces, alguien que
 * TODAVÍA NO ES SOCIO —de eso va tener una landing—. El socio sigue entrando
 * por `/miembros`, quien trabaja en el club por `/admin` o `/comercios`, y el
 * `start_url` de la aplicación instalable sigue siendo `/miembros`
 * (`manifest.ts`).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * EL ORDEN DE LA PÁGINA (guía de marca v6)
 *
 *   Héroe ........................ NEGRO (foto)  ← «Descubre lo mejor de tu ciudad»
 *   Así es como te unes .......... tarjeta sobre el filo del héroe
 *   Qué es ORUM .................. CREMA         ← texto + carrusel de fotos reales
 *   Descubre · Disfruta · … ...... CREMA         ← los cuatro verbos del club
 *   Comercios destacados ......... NEGRO         ← cinco reales + «Ver todos»
 *   Elige tu membresía ........... CREMA         ← precios de la base, con ahorro calculado
 *   Hazte socio hoy .............. NEGRO         ← el cierre, con el WhatsApp
 *   ¿Tienes un negocio? .......... CREMA
 *   Pie .......................... NEGRO         (lo pone el layout)
 *
 * Crema y negro alternan: lo que separa las secciones es el campo de color,
 * no una línea. Las dos crema seguidas (Qué es ORUM y los verbos) son una
 * misma idea contada dos veces —qué es y qué hace—, y no llevan corte.
 */
export const dynamic = 'force-dynamic'

export default async function LandingPublica() {
  /*
    Las lecturas van en paralelo: son independientes y encadenarlas con
    `await` seguidos sumaría sus latencias en el camino más caliente del
    sitio. `cache()` evita que el layout y esta página consulten dos veces el
    número de soporte dentro de la misma petición.
  */
  const [vitrina, planes, soporte, perfil, abiertoEn, anuncios] = await Promise.all([
    obtenerVitrinaPublica(),
    obtenerPlanesPublicos(),
    obtenerWhatsappSoporte(),
    getPerfilActual(),
    obtenerInstanteServidor(),
    obtenerAnunciosVisibles(createAdminClient(), 'publico'),
  ])

  return (
    <>
      <HeroPublico esSocio={perfil?.rolCodigo === 'miembro'} />

      <ComoFunciona />

      {/*
        EL ANUNCIO DEL CLUB, después de la tarjeta de pasos y no justo tras el
        héroe: esa tarjeta se monta sobre el filo de la foto, y una franja en
        medio la dejaría flotando sobre el anuncio en vez de sobre la foto.
      */}
      <AnuncioBanner anuncio={anuncios[0] ?? null} hrefHistorial="/novedades" />

      <QueEsOrum fotos={vitrina.fotos} />

      <ValoresOrum />

      <ComerciosDestacados comercios={vitrina.destacados} />

      <MembresiasPublicas
        planes={planes}
        soporte={soporte}
        totalComercios={vitrina.totalComercios}
      />

      {/*
        EL CIERRE. Repite la invitación a propósito: quien llega hasta aquí
        lleva varias pantallas de desplazamiento y lo de arriba ya no existe
        para él. Y vuelve al negro con el que se abrió la página.
      */}
      <section
        className={[
          escaparate.franja,
          escaparate.tonoCacao,
          escaparate.filoBanda,
          estilos.franjaCierre,
        ].join(' ')}
        aria-labelledby="titulo-cierre"
      >
        <Revelar className={estilos.bloqueCierre}>
          <span className={[estilos.destelloCierre, REVELAR].join(' ')} aria-hidden="true">
            ✦
          </span>
          <h2
            id="titulo-cierre"
            className={[escaparate.tituloSeccion, estilos.tituloCierre, revelarEscalonado(1)].join(
              ' ',
            )}
          >
            Hazte socio <em className={estilos.acentoCierre}>hoy</em>
          </h2>
          <p className={[estilos.textoCierre, revelarEscalonado(2)].join(' ')}>
            Escríbenos por WhatsApp y te contamos los planes, los precios y cómo recibir tu
            carnet.
          </p>

          <div className={[estilos.accionesCierre, escaparate.sobreFoto, REVELAR].join(' ')}>
            <CtaSocio soporte={soporte} size="lg" avisarSinNumero />
          </div>
        </Revelar>
      </section>

      {/*
        LA PUERTA DEL COMERCIO, subordinada y al final. Es una audiencia
        minoritaria pero la de mayor valor por cabeza, así que tiene su propio
        bloque en vez de un enlace perdido en el pie.
      */}
      <section className={[escaparate.franja, escaparate.tonoPapel].join(' ')}>
        <Revelar className={estilos.aliados}>
          <div className={REVELAR_IZQ}>
            <h2 className={estilos.tituloAliados}>¿Tienes un negocio?</h2>
            <p className={estilos.textoAliados}>
              Los socios de ORUM buscan dónde comer, cuidarse y consentirse. Súmate al club y
              llega a ellos.
            </p>
          </div>

          {/* `Date.now()` del SERVIDOR: el reloj del visitante puede ir mal y
              la comprobación anti-robot necesita un reloj del que fiarse. */}
          {/* El revelado en un envoltorio: el botón se levanta al apuntarlo, y
              el diálogo que abre no hereda nada de aquí (se pinta en la capa
              superior). */}
          <div className={REVELAR_DER}>
            <AliadosOverlayTrigger
              abiertoEn={abiertoEn}
              soporte={soporte}
              className={estilos.botonAliado}
            />
          </div>
        </Revelar>
      </section>
    </>
  )
}
