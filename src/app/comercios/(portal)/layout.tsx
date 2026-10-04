import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { obtenerMiComercio } from '@/lib/comercios/comercio-sesion'
import { obtenerWhatsappSoporte } from '@/lib/publico/datos-publicos'
import { ENTRADA, retardoEntrada } from '@/lib/shared/revelado'
import { Button } from '@/components/ui/button'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import fotoMarca from '@/components/ui/marca/foto-hero.webp'
import { AdornoEstrella, LogoOrum } from '@/components/ui/marca/marca'
import { PieSitio } from '@/components/pie/pie-sitio'
import { AvisoInstalar } from '@/components/pwa/instalar-movil'
import { WhatsAppFlotante } from '@/components/ui/whatsapp-flotante'
import escaparate from '@/app/(publico)/escaparate.module.css'
import cromo from '@/app/miembros/(portal)/portal.module.css'
import { cerrarSesionComercio } from '../login/actions'
import styles from './portal.module.css'

export const metadata = { title: 'Portal de Comercios · ORUM' }

const MENSAJE_SOPORTE = 'Hola, necesito ayuda con la herramienta de comercios de ORUM.'

/*
  EL CROMO DE LA HERRAMIENTA DE COMERCIOS  ·  el del Portal Público (04/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «vamos a rediseñar comercios; utiliza el estilo
  del portal inicial y miembros, sus reglas, colores y estilo».

  Hasta hoy era una herramienta gris: cabecera de material con el wordmark
  escrito a mano, un avatar con menú (correo, tema, salir) y una columna de
  560 px sobre crema. Ahora es la tercera cara de la misma fachada:

    · LA CABECERA es la del Portal de Miembros, literalmente: se importan sus
      clases (`cromo`), no se copian. Fija, negra fundida a transparente,
      con el logotipo en plata y «Cerrar sesión» en píldora — un submit real,
      que funciona sin JavaScript. En una caja, poder salir siempre importa.
    · EL BANNER es el del directorio: la foto de marca a sangre bajo un velo
      negro. Dice QUIÉN opera la caja —el logotipo y el nombre del comercio,
      que es el `h1`—, lo que importa cuando una cadena tiene varias sedes y
      cada una entra con su cuenta. Vive AQUÍ y no en la página porque el
      portal tiene un solo destino: así el esqueleto de carga y la frontera
      de error se pintan debajo de él y nada salta al resolverse.
    · EL CONTENIDO va en tarjetas blancas MONTADAS sobre el canto del banner,
      como «Así es como te unes» sobre el héroe de la portada.
    · EL PIE es el del sitio, con el soporte por WhatsApp.
    · WHATSAPP FLOTANTE E INSTALAR, como en el Portal de Miembros (encargo
      del mismo día: «añade la opción de WhatsApp y la de descargar; los
      comercios pueden también descargar este portal»). El botón de instalar
      solo aparece en celulares y donde instalar es posible; el pie lleva el
      mismo icono también en computador. Lo que se instala desde aquí es la
      aplicación del COMERCIO: `comercios/layout.tsx` enlaza un manifiesto
      propio que abre en `/comercios`, no en la puerta del socio.

  SIEMPRE EN CLARO (`data-theme="light"`), como la fachada y el Portal de
  Miembros: con el teléfono en modo oscuro las franjas claras salían negras.
  El selector de tema que vivía en el menú del avatar se retiró con el menú.
*/
export default async function ComerciosLayout({ children }: { children: ReactNode }) {
  /* En paralelo: son independientes. `obtenerMiComercio` exige el rol. */
  const [comercio, soporte] = await Promise.all([obtenerMiComercio(), obtenerWhatsappSoporte()])

  return (
    <div className={[cromo.portal, styles.portal].join(' ')} data-theme="light">
      <header className={cromo.cabecera} data-theme="dark">
        <Link href="/comercios" className={cromo.marca} aria-label="ORUM, ir al inicio de la herramienta">
          {/* Sobre la cabecera negra, plata (CLAUDE.md → «sobre negro, plata»). */}
          <LogoOrum variante="plata" className={cromo.logo} preload />
        </Link>

        {/* `sobreFoto`: el ámbito con el que la píldora de contorno se lee
            sobre negro, el mismo de las cabeceras pública y de miembros. */}
        <div className={[cromo.acciones, escaparate.sobreFoto].join(' ')}>
          <form action={cerrarSesionComercio}>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              pildora
              icon={<LogOut size={15} aria-hidden="true" />}
              aria-label="Cerrar sesión"
            >
              {/* En un teléfono estrecho queda solo el icono: el nombre
                  accesible lo sigue diciendo `aria-label`. */}
              <span className={cromo.textoCerrar}>Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </header>

      {/* ── EL BANNER: quién opera la caja ─────────────────────────────── */}
      <section className={styles.banner} aria-labelledby="titulo-comercio">
        {/* La misma foto de marca que la portada, el directorio y las puertas
            de acceso. Decorativa (`alt=""`). */}
        <Image
          className={styles.bannerFoto}
          src={fotoMarca}
          alt=""
          fill
          sizes="100vw"
          quality={80}
          placeholder="blur"
          preload
        />
        <div className={styles.bannerVelo} aria-hidden="true" />

        <div className={styles.bannerContenido}>
          {comercio && (
            <ComercioLogo
              logoUrl={comercio.logoUrl}
              nombre={comercio.nombre}
              className={[styles.bannerLogo, ENTRADA].join(' ')}
            />
          )}

          <div className={styles.bannerTextos}>
            <p className={[styles.insignia, ENTRADA].join(' ')} style={retardoEntrada(1)}>
              <AdornoEstrella tono="plata" />
              Comercio aliado
            </p>
            <h1
              id="titulo-comercio"
              className={[styles.titulo, ENTRADA].join(' ')}
              style={retardoEntrada(2)}
            >
              {comercio?.nombre ?? 'Herramienta de comercios'}
            </h1>
            <p className={[styles.bajada, ENTRADA].join(' ')} style={retardoEntrada(3)}>
              Verifica el carnet de cada socio y registra sus compras en segundos.
            </p>
          </div>
        </div>
      </section>

      <main className={styles.main}>{children}</main>

      <PieSitio soporte={soporte} mensajeSoporte={MENSAJE_SOPORTE} instalar />

      {/* El atajo al soporte, fijo en la esquina: en la caja, la ayuda tiene
          que estar a un toque. Sin número configurado no se pinta. */}
      <WhatsAppFlotante telefono={soporte} mensaje={MENSAJE_SOPORTE} />

      {/* La invitación a instalar la app, encima del de WhatsApp: solo en
          celulares, y solo mientras no esté ya instalada. */}
      <AvisoInstalar />
    </div>
  )
}
