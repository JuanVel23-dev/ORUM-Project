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
} from '@/lib/publico/datos-publicos'
import { AliadosOverlayTrigger } from './_components/aliados-overlay-trigger'
import { ComoFunciona } from './_components/como-funciona'
import { CtaSocio } from './_components/cta-socio'
import { HeroPublico } from './_components/hero-publico'
import { VitrinaPublica } from './_components/vitrina-publica'
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
 */
export default async function LandingPublica() {
  /*
    Las tres lecturas van en paralelo: son independientes y encadenarlas con
    tres `await` seguidos sumaría sus latencias en el camino más caliente del
    sitio. `cache()` ya evita que el layout y esta página consulten dos veces el
    número de soporte dentro de la misma petición.
  */
  const [vitrina, soporte, perfil, abiertoEn] = await Promise.all([
    obtenerVitrinaPublica(),
    obtenerWhatsappSoporte(),
    getPerfilActual(),
    obtenerInstanteServidor(),
  ])

  const hayVitrina = vitrina.comercios.length > 0

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
      */}
      {perfil?.rolCodigo === 'miembro' && (
        <Link href="/miembros" className={estilos.puente}>
          <span>Ya eres socio. Ir a mi portal</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}

      <HeroPublico
        soporte={soporte}
        comercios={vitrina.comercios}
        hayVitrina={hayVitrina}
      />

      {/*
        «Cómo funciona» ANTES que la vitrina, y no al revés.

        La tentación es abrir con los comercios, que es lo bonito. Pero el deseo
        sin mecanismo no convierte: quien no sabe todavía qué es ORUM mira una
        fila de logotipos y no entiende qué tiene que ver con él. Primero se
        entiende el club, después se desea lo que ofrece.
      */}
      <ComoFunciona />

      <VitrinaPublica comercios={vitrina.comercios} />

      {hayCifras && (
        <section className={estilos.cifras} aria-labelledby="cifras-club">
          <h2 id="cifras-club" className={estilos.tituloSeccion}>
            El club, en números
          </h2>

          <div className={estilos.rejillaCifras}>
            <Card padding="lg">
              <Cifra
                etiqueta="Comercios aliados"
                valor={vitrina.totalComercios.toLocaleString('es-CO')}
                nota="Y creciendo cada mes"
              />
            </Card>

            {vitrina.totalCiudades > 0 && (
              <Card padding="lg">
                <Cifra
                  etiqueta={vitrina.totalCiudades === 1 ? 'Ciudad' : 'Ciudades'}
                  valor={vitrina.totalCiudades.toLocaleString('es-CO')}
                  nota="Con al menos una sede activa"
                />
              </Card>
            )}
          </div>
        </section>
      )}

      {/*
        EL CIERRE. Repite el CTA del héroe a propósito: quien llega hasta aquí
        lleva varias pantallas de desplazamiento y el botón de arriba ya no
        existe para él. Pedirle que suba a buscarlo es perder la conversión que
        acabas de ganar.
      */}
      <section className={estilos.cierre}>
        <h2 className={estilos.tituloCierre}>Hazte socio hoy</h2>
        <p className={estilos.textoCierre}>
          Escríbenos por WhatsApp y te contamos los planes, los precios y cómo
          recibir tu carnet.
        </p>

        <div className={estilos.accionesCierre}>
          <CtaSocio soporte={soporte} size="lg" />
        </div>
      </section>

      {/*
        LA PUERTA DEL COMERCIO, subordinada y al final.

        Es una audiencia minoritaria —la landing la escribe para el socio— pero
        es la de mayor valor por cabeza, así que tiene su propio bloque en vez de
        un enlace perdido en el pie. Secundaria en peso visual, nunca compitiendo
        con «Hazte socio».
      */}
      <section className={estilos.aliados}>
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
      </section>
    </>
  )
}
