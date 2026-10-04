import type { Metadata } from 'next'
import { INDEXAR_CATALOGO } from '@/lib/publico/sitio'
import {
  obtenerDirectorioPublico,
  obtenerInstanteServidor,
  obtenerWhatsappSoporte,
} from '@/lib/publico/datos-publicos'
import { REVELAR, REVELAR_DER, REVELAR_IZQ } from '@/lib/shared/revelado'
import { DirectorioComercios } from '@/components/comercios/directorio-comercios'
import { AliadosOverlayTrigger } from '../_components/aliados-overlay-trigger'
import estilos from '@/components/comercios/directorio-comercios.module.css'

export const metadata: Metadata = {
  alternates: { canonical: '/explorar' },
  // Catálogo con datos de prueba: ver `INDEXAR_CATALOGO` en `lib/publico/sitio.ts`.
  robots: INDEXAR_CATALOGO ? { index: true, follow: true } : { index: false, follow: false },
  title: 'Comercios aliados · ORUM',
  description:
    'Descubre todos los comercios aliados de ORUM por categoría y ciudad, y comienza a disfrutar tus beneficios.',
  openGraph: {
    title: 'Comercios aliados de ORUM',
    description: 'Descubre todos los comercios aliados de ORUM por categoría y ciudad.',
    type: 'website',
  },
}

/*
  EL DIRECTORIO PÚBLICO  ·  «Ver todos los comercios»
  ---------------------------------------------------------------------------
  `/explorar` y no `/comercios`: esa ruta ya es la Herramienta de Comercios.

  LOS FILTROS VIVEN EN LA URL, que es la convención del repositorio: las
  categorías son enlaces, la ciudad y el orden son opciones de menú que
  navegan, y la búsqueda es un `<form method="get">`. Todo funciona sin
  JavaScript salvo abrir los dos menús desplegables, se comparte por
  WhatsApp tal cual y sobrevive a un refresco.

  Filtrar ocurre sobre la lista ya cargada (`filtrarDirectorio`, función pura
  y probada), desde el 03/10/2026 en el navegador: aplicar un filtro ya no
  viaja al servidor.

  La ficha de cada comercio se abre ENCIMA (`@modal/(.)explorar/[id]`), y por
  enlace directo a pantalla completa.

  Renderizado en cada petición: los comercios y el WhatsApp los cambia un
  administrador y tienen que verse al momento.
*/
export const dynamic = 'force-dynamic'


export default async function ExplorarPage() {
  /* Los filtros de la URL los lee el directorio en el cliente
     (`DirectorioInteractivo`); aquí ya no hacen falta. */
  const [directorio, soporte, abiertoEn] = await Promise.all([
    obtenerDirectorioPublico(),
    obtenerWhatsappSoporte(),
    obtenerInstanteServidor(),
  ])

  return (
    <>
      <DirectorioComercios
        base="/explorar"
        directorio={directorio}
        bajada="Descubre todos los comercios aliados de ORUM y comienza a disfrutar tus beneficios."
      />

      {/* ── ¿TIENES UN COMERCIO? ────────────────────────────────────────── */}
      <section
        className={[estilos.bandaAliados, REVELAR].join(' ')}
        aria-labelledby="titulo-ser-aliado"
      >
        <div className={REVELAR_IZQ}>
          <h2 id="titulo-ser-aliado" className={estilos.bandaTitulo}>
            ¿Tienes un comercio y quieres ser parte?
          </h2>
          <p className={estilos.bandaTexto}>
            Únete a nuestra red de aliados y lleva tu negocio al siguiente nivel.
          </p>
        </div>
        {/* El oro pálido va en la clase del BOTÓN y no en un envoltorio: el
            diálogo del formulario se monta junto al botón, y un envoltorio con
            los tokens remapeados le pasaría el tema oscuro al formulario. */}
        <div className={REVELAR_DER}>
          <AliadosOverlayTrigger
            abiertoEn={abiertoEn}
            soporte={soporte}
            variant="brand"
            className={estilos.botonOro}
          />
        </div>
      </section>
    </>
  )
}
