import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgePercent, Store } from 'lucide-react'
import { obtenerAnunciosPublicos } from '@/lib/publico/datos-publicos'
import { ListaNovedades } from '@/components/novedades/lista-novedades'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { HREF_UNETE } from '../_components/anclas'
import estilos from './novedades.module.css'

export const metadata: Metadata = {
  alternates: { canonical: '/novedades' },
  title: 'Novedades · ORUM',
  description: 'Beneficios nuevos y actualizaciones del club.',
}

export const dynamic = 'force-dynamic'

/*
  NOVEDADES  ·  rediseño del 21/10/2026 («se ve muy vacío»)
  ---------------------------------------------------------------------------
  Cabecera con el titular de la casa, la lista (`ListaNovedades`: la más
  reciente en grande y las anteriores en rejilla) y, al final, dos accesos
  para seguir: los comercios y las membresías. Todo a lo ancho de la
  fachada, no en una columna de 640px.
*/
export default async function NovedadesPublicas() {
  const anuncios = await obtenerAnunciosPublicos()

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <p className={estilos.antetitulo}>El club, al día</p>
        <TituloSeccion como="h1" tamano="pagina" texto="Novedades de ORUM" />
        <p className={estilos.bajada}>
          Beneficios nuevos, aliados que llegan y lo que pasa en el club.
        </p>
      </header>

      <ListaNovedades anuncios={anuncios} />

      <nav className={estilos.seguir} aria-label="Seguir explorando">
        <Link href="/explorar" className={estilos.acceso}>
          <span className={estilos.accesoIcono} aria-hidden="true">
            <Store size={20} />
          </span>
          <span className={estilos.accesoTextos}>
            <span className={estilos.accesoTitulo}>Explora los comercios aliados</span>
            <span className={estilos.accesoAyuda}>Dónde usar tus beneficios.</span>
          </span>
          <ArrowRight className={estilos.accesoFlecha} size={18} aria-hidden="true" />
        </Link>
        <Link href={HREF_UNETE} className={estilos.acceso}>
          <span className={estilos.accesoIcono} aria-hidden="true">
            <BadgePercent size={20} />
          </span>
          <span className={estilos.accesoTextos}>
            <span className={estilos.accesoTitulo}>Conoce las membresías</span>
            <span className={estilos.accesoAyuda}>Únete y empieza a ahorrar.</span>
          </span>
          <ArrowRight className={estilos.accesoFlecha} size={18} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  )
}
