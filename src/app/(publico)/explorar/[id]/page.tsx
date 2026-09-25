import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Lock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { obtenerFichaPublica, obtenerWhatsappSoporte } from '@/lib/publico/datos-publicos'
import estilos from './ficha-publica.module.css'

/*
  LA FICHA PÚBLICA DE UN COMERCIO — el MISMO componente en dos superficies
  ---------------------------------------------------------------------------
  Desde el directorio o desde «Comercios destacados» se abre ENCIMA, en la
  ranura `@modal` del layout público (`enOverlay`). Por enlace directo —un
  WhatsApp, un buscador, recargar— se pinta a pantalla completa. Es el mismo
  patrón que la ficha del portal de miembros, y por la misma razón: dos
  copias se desincronizan a la primera corrección.

  Es la ficha de QUIEN NO ES SOCIO: foto, dirección, descripción, galería y
  el beneficio desenfocado con la invitación a iniciar sesión. Nada que exija
  sesión ni nada que identifique a una persona (ver `datos-publicos.ts`).

  Server Component. El único cliente es el envoltorio del overlay, que vive
  en la ranura y no aquí.
*/

/** Id numérico de la URL, o `null`. Entrada no confiable: llega de la ruta. */
function idOnulo(valor: string): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numero = idOnulo(id)
  const ficha = numero ? await obtenerFichaPublica(numero) : null
  /* El mismo título para los tres casos fatales: no se filtra por la pestaña
     lo que la página calla. */
  return {
    title: ficha ? `${ficha.nombre} · Comercio aliado de ORUM` : 'Comercio no disponible · ORUM',
    description: ficha?.descripcion ?? undefined,
  }
}

export const dynamic = 'force-dynamic'

/** Cuántas fotos de la galería entran en la ficha. */
const TOPE_GALERIA = 6

export default async function FichaPublicaPage({
  params,
  enOverlay = false,
}: {
  params: Promise<{ id: string }>
  enOverlay?: boolean
}) {
  const { id } = await params
  const numero = idOnulo(id)
  if (numero === null) notFound()

  const [ficha, soporte] = await Promise.all([
    obtenerFichaPublica(numero),
    obtenerWhatsappSoporte(),
  ])
  if (!ficha) notFound()

  const detalle = [ficha.categoriaNombre, ficha.ciudades.join(', ')].filter(Boolean).join(' · ')
  const sedesConDireccion = ficha.sedes.filter((s) => s.direccion)

  return (
    <article className={[estilos.ficha, enOverlay && estilos.enOverlay].filter(Boolean).join(' ')}>
      {!enOverlay && (
        <Link href="/explorar" className={estilos.volver}>
          <ChevronLeft size={16} aria-hidden="true" />
          Ver todos los comercios
        </Link>
      )}

      <div className={estilos.portada}>
        {ficha.portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
          <img src={ficha.portadaUrl} alt="" className={estilos.portadaFoto} />
        ) : (
          <span className={estilos.portadaVacia} aria-hidden="true" />
        )}
        <span className={estilos.logo}>
          <ComercioLogo logoUrl={ficha.logoUrl} nombre={ficha.nombre} />
        </span>
      </div>

      <div className={estilos.cuerpo}>
        <header>
          <h1 className={estilos.nombre}>{ficha.nombre}</h1>
          {detalle && <p className={estilos.detalle}>{detalle}</p>}
        </header>

        {sedesConDireccion.length > 0 && (
          <ul className={estilos.sedes} aria-label="Direcciones">
            {sedesConDireccion.map((s) => (
              <li key={s.id} className={estilos.sede}>
                <MapPin size={15} aria-hidden="true" className={estilos.sedeIcono} />
                <span>
                  {s.direccion}
                  {s.ciudadNombre && `, ${s.ciudadNombre}`}
                  {/* El nombre de la sede solo si hay varias: con una sola,
                      «Sede principal» no le dice nada a nadie. */}
                  {sedesConDireccion.length > 1 && s.nombre && (
                    <span className={estilos.sedeNombre}> · {s.nombre}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {ficha.descripcion && <p className={estilos.descripcion}>{ficha.descripcion}</p>}

        {ficha.fotos.length > 0 && (
          <ul className={estilos.galeria} aria-label="Fotos del comercio">
            {ficha.fotos.slice(0, TOPE_GALERIA).map((foto) => (
              <li key={foto.url} className={estilos.galeriaCelda}>
                {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local */}
                <img src={foto.url} alt={foto.alt} className={estilos.galeriaFoto} loading="lazy" />
              </li>
            ))}
          </ul>
        )}

        {/*
          EL BENEFICIO, DESENFOCADO. Se ve que existe y no se lee sin ser
          socio: encargo del cliente. El lector de pantalla recibe la misma
          información que el vidente —«exclusivo para socios»—, no el texto
          que el vidente tampoco puede leer.
        */}
        <div className={estilos.beneficio}>
          <div className={estilos.beneficioTextos}>
            <p className={estilos.beneficioEtiqueta}>Tu beneficio ORUM</p>
            {ficha.beneficios.length > 0 ? (
              <>
                <p className={estilos.beneficioValor} aria-hidden="true">
                  {ficha.beneficios.join(' · ')}
                </p>
                <p className="sr-only">Beneficio exclusivo para socios.</p>
              </>
            ) : (
              <p className={estilos.beneficioPronto}>Pronto con beneficio para socios.</p>
            )}
          </div>
          <Button href="/miembros/login" variant="ghost" size="sm" icon={<Lock size={14} />}>
            Inicia sesión para verlo
          </Button>
        </div>

        {soporte && (
          <WhatsAppButton
            telefono={soporte}
            mensaje={`Hola, quiero saber más de ${ficha.nombre} en ORUM.`}
            variant="brand"
            size="lg"
            pildora
            fullWidth
            className={estilos.botonOro}
          >
            Preguntar por WhatsApp
          </WhatsAppButton>
        )}
      </div>
    </article>
  )
}
