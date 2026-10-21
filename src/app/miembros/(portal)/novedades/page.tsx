import Link from 'next/link'
import { ArrowRight, Store } from 'lucide-react'
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { ListaNovedades } from '@/components/novedades/lista-novedades'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import estilos from '@/components/novedades/pagina-novedades.module.css'

export const metadata = { title: 'Novedades · ORUM' }

/*
  LAS NOVEDADES DEL SOCIO  ·  vuelve el 21/10/2026
  ---------------------------------------------------------------------------
  Se había retirado el 29/09 al convertir el Inicio en el directorio, y con
  ella el socio se quedó sin ver novedades («no lo veo en el portal de
  miembros»). Vuelve como la página pública de novedades —mismo diseño, la
  misma `ListaNovedades`—, pero con las que el panel marca para el Portal de
  Miembros (que pueden no ser públicas), leídas con la sesión del socio. Es
  a donde lleva el aviso del Inicio.
*/
export default async function NovedadesDelSocio() {
  await requireMiembroVigente()
  const supabase = await createClient()
  const novedades = await obtenerAnunciosVisibles(supabase, 'miembros')

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <p className={estilos.antetitulo}>El club, al día</p>
        <TituloSeccion como="h1" tamano="pagina" texto="Novedades de ORUM" />
        <p className={estilos.bajada}>
          Beneficios nuevos, aliados que llegan y lo que pasa en el club.
        </p>
      </header>

      <ListaNovedades anuncios={novedades} />

      <nav className={estilos.seguir} aria-label="Seguir explorando">
        <Link href="/miembros" className={estilos.acceso}>
          <span className={estilos.accesoIcono} aria-hidden="true">
            <Store size={20} />
          </span>
          <span className={estilos.accesoTextos}>
            <span className={estilos.accesoTitulo}>Vuelve a tus beneficios</span>
            <span className={estilos.accesoAyuda}>Los comercios donde usar tu membresía.</span>
          </span>
          <ArrowRight className={estilos.accesoFlecha} size={18} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  )
}
