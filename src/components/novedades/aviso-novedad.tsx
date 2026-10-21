import Link from 'next/link'
import { ArrowRight, Megaphone } from 'lucide-react'
import { AdornoEstrella } from '@/components/ui/marca/marca'
import { formatearFechaNovedad, formatearFechaNovedadCorta } from '@/lib/anuncios/fecha'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import { CerrarAviso } from './cerrar-aviso'
import styles from './aviso-novedad.module.css'

/*
  EL AVISO DE LA ÚLTIMA NOVEDAD, EN LA PORTADA  ·  21/10/2026
  ---------------------------------------------------------------------------
  Seis vueltas el mismo día, todas del propietario:

    1. «El fondo negro no me agrada»: tarjeta BLANCA con su sombra.
    2. «Le doy a "Ver más" y no me lleva a ningún lado; quita el "Ver más"
       y que funcione al darle clic; no se debe poder quitar»: la tarjeta
       ENTERA es el `<a>` (sin enlace estirado ni nada encima), sin X.
    3. «No me gusta que aparezca la imagen, y el icono de la fecha o el ">"
       están muy cerca del borde; lo veo demasiado pequeño y casi no
       impacta; que aparezca desde el inicio del texto»: SIN miniatura, con
       aire generoso, el título en el serif de la marca y un megáfono grande
       en su aro dorado. Y lleva a `/novedades` ARRIBA, no al ancla: la
       página abre con su titular y la novedad más reciente es la primera.
    4. «Añádele la opción para quitar, pero al recargar debe volver a
       aparecer»: una X encima (`CerrarAviso`) que lo quita solo mientras
       la página siga abierta.
    5. «La estrella se ve mal puesta; no quiero degradado, que sea blanco
       con las sombras»: la estrella pasa al lado del título (como en los
       títulos de sección) y la tarjeta es blanca, sin resplandor.
    6. «En el celular ocupa demasiado; redúcelo también en los demás
       dispositivos, al fin y al cabo es un anuncio»: COMPACTO en todos los
       tamaños —una franja baja, una línea de texto—, con la fecha corta y
       sin flecha en el teléfono.

  La tarjeta se pinta en el servidor; solo la X es de cliente.

  ⚠️ NINGÚN NOMBRE CON «anuncio» NI «banner» en lo que llega al navegador:
  los bloqueadores de publicidad los ocultan o anulan. Ver `CLAUDE.md`.
*/
export function AvisoNovedad({
  novedad,
  href = '/novedades',
}: {
  novedad: AnuncioResumen | null
  /** A dónde lleva: `/novedades` en la fachada, `/miembros/novedades` en el portal del socio. */
  href?: string
}) {
  if (!novedad) return null

  return (
    <CerrarAviso>
      <Link href={href} className={styles.aviso} aria-label={`Novedad: ${novedad.titulo}. Ver novedades.`}>
        {/* El megáfono, en su aro dorado. */}
        <span className={styles.icono} aria-hidden="true">
          <Megaphone size={22} />
        </span>

        <span className={styles.textos}>
          <span className={styles.meta}>
            <span className={styles.etiqueta}>Novedad</span>
            {/* Larga en escritorio; corta en el teléfono, para que quepa en la línea. */}
            <time dateTime={novedad.createdAt}>
              <span className={styles.fechaLarga}>{formatearFechaNovedad(novedad.createdAt)}</span>
              <span className={styles.fechaCorta}>{formatearFechaNovedadCorta(novedad.createdAt)}</span>
            </time>
          </span>
          {/* La estrella de ORUM AL LADO del título, como en todos los de la marca. */}
          <span className={styles.titulo}>
            <AdornoEstrella />
            {novedad.titulo}
          </span>
          <span className={styles.extracto}>{novedad.cuerpo}</span>
        </span>

        {/* La flecha dice «se abre»: la tarjeta entera es el botón. */}
        <span className={styles.flecha} aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </Link>
    </CerrarAviso>
  )
}
