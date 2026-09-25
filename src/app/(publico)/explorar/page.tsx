import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowUpDown, ChevronDown, LayoutGrid, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { EmptyState } from '@/components/ui/feedback'
import {
  obtenerDirectorioPublico,
  obtenerInstanteServidor,
  obtenerWhatsappSoporte,
} from '@/lib/publico/datos-publicos'
import {
  ETIQUETAS_ORDEN,
  filtrarDirectorio,
  hayFiltros,
  hrefDirectorio,
  leerFiltrosDirectorio,
  type OrdenDirectorio,
} from '@/lib/publico/directorio'
import { AliadosOverlayTrigger } from '../_components/aliados-overlay-trigger'
import fotoMarca from '../_components/hero-orum.webp'
import {
  ENTRADA,
  REVELAR,
  REVELAR_DER,
  REVELAR_IZQ,
  retardoEntrada,
  revelarEscalonado,
} from '../_components/revelado'
import escaparate from '../escaparate.module.css'
import { CategoriasDirectorio } from './_components/categorias-directorio'
import { TarjetaDirectorio } from './_components/tarjeta-directorio'
import estilos from './explorar.module.css'

export const metadata: Metadata = {
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

  Filtrar ocurre en el servidor sobre la lista ya cargada (`filtrarDirectorio`,
  función pura y probada): cuesta microsegundos y la consulta es una sola.

  La ficha de cada comercio se abre ENCIMA (`@modal/(.)explorar/[id]`), y por
  enlace directo a pantalla completa.

  Renderizado en cada petición: los comercios y el WhatsApp los cambia un
  administrador y tienen que verse al momento.
*/
export const dynamic = 'force-dynamic'

const ORDENES: OrdenDirectorio[] = ['az', 'za']

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [crudos, directorio, soporte, abiertoEn] = await Promise.all([
    searchParams,
    obtenerDirectorioPublico(),
    obtenerWhatsappSoporte(),
    obtenerInstanteServidor(),
  ])

  const filtros = leerFiltrosDirectorio(crudos)
  const comercios = filtrarDirectorio(directorio.comercios, filtros)

  /* La ciudad elegida puede no existir ya (un enlace viejo): se muestra
     «Todas» en vez de un id suelto, y el filtro no casa con nada. */
  const ciudadActual = directorio.ciudades.find((c) => c.id === filtros.ciudadId)

  return (
    <>
      {/* ── EL BANNER ───────────────────────────────────────────────────── */}
      <section
        className={[escaparate.franja, estilos.banner].join(' ')}
        aria-labelledby="titulo-directorio"
      >
        {/* La misma foto de marca que el héroe de la landing: la portada y el
            directorio son la misma fachada. Decorativa (`alt=""`). */}
        <Image
          className={estilos.bannerFoto}
          src={fotoMarca}
          alt=""
          fill
          sizes="100vw"
          quality={80}
          placeholder="blur"
          preload
        />
        <div className={estilos.bannerVelo} aria-hidden="true" />

        <div className={[estilos.bannerContenido, escaparate.sobreFoto].join(' ')}>
          <h1
            id="titulo-directorio"
            className={[estilos.titulo, ENTRADA].join(' ')}
            style={retardoEntrada(1)}
          >
            Comercios
          </h1>
          <p className={[estilos.bajada, ENTRADA].join(' ')} style={retardoEntrada(2)}>
            Descubre todos los comercios aliados de ORUM y comienza a disfrutar tus beneficios.
          </p>

          {/*
            La búsqueda es un GET a esta misma ruta. Los demás filtros viajan
            en campos ocultos: buscar no puede borrar la categoría o la ciudad
            que el visitante ya había elegido.
          */}
          <form
            className={[estilos.buscador, ENTRADA].join(' ')}
            style={retardoEntrada(3)}
            method="get"
            action="/explorar"
            role="search"
          >
            <label htmlFor="busqueda-directorio" className="sr-only">
              Buscar comercios
            </label>
            <input
              id="busqueda-directorio"
              className={estilos.campo}
              type="search"
              name="q"
              defaultValue={filtros.q}
              placeholder="Buscar por nombre, categoría o zona"
              autoComplete="off"
              enterKeyHint="search"
            />
            {filtros.categoriaId !== null && (
              <input type="hidden" name="categoria_id" value={filtros.categoriaId} />
            )}
            {filtros.ciudadId !== null && (
              <input type="hidden" name="ciudad_id" value={filtros.ciudadId} />
            )}
            {filtros.orden !== 'az' && <input type="hidden" name="orden" value={filtros.orden} />}
            <button type="submit" className={estilos.botonBuscar} aria-label="Buscar">
              <Search size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      {/* ── CATEGORÍAS + CIUDAD + ORDEN ─────────────────────────────────── */}
      <section className={[estilos.panel, REVELAR].join(' ')} aria-label="Filtros del directorio">
        <div className={estilos.herramientas}>
          <p className={estilos.recuento} aria-live="polite">
            {comercios.length === 1 ? '1 comercio' : `${comercios.length} comercios`}
          </p>

          <div className={estilos.menus}>
            {directorio.categorias.length > 0 && (
              <CategoriasDirectorio
                total={comercios.length}
                opciones={[
                  {
                    id: null,
                    nombre: 'Todas',
                    href: hrefDirectorio(filtros, { categoriaId: null }),
                    activa: filtros.categoriaId === null,
                  },
                  ...directorio.categorias.map((c) => {
                    const activa = c.id === filtros.categoriaId
                    return {
                      id: c.id,
                      nombre: c.nombre,
                      /* Tocar la categoría activa la apaga: encender y apagar con
                         el mismo dedo, en el mismo sitio. */
                      href: hrefDirectorio(filtros, { categoriaId: activa ? null : c.id }),
                      activa,
                    }
                  }),
                ]}
              />
            )}
            {/* Con una sola ciudad el menú sigue estando: es el filtro que el
                cliente pidió, y dice en qué ciudad está el club hoy. Sin
                ninguna sede cargada no hay nada que elegir y se retira. */}
            {directorio.ciudades.length > 0 && (
              <DropdownMenu
                align="end"
                trigger={
                  <button type="button" className={estilos.disparador}>
                    <span className={estilos.disparadorIcono} aria-hidden="true">
                      <MapPin size={13} />
                    </span>
                    Ciudad: {ciudadActual?.nombre ?? 'Todas'}
                    <ChevronDown size={14} aria-hidden="true" className={estilos.chevron} />
                  </button>
                }
              >
                <MenuItem
                  href={hrefDirectorio(filtros, { ciudadId: null })}
                  selected={!ciudadActual}
                >
                  Todas
                </MenuItem>
                {directorio.ciudades.map((c) => (
                  <MenuItem
                    key={c.id}
                    href={hrefDirectorio(filtros, { ciudadId: c.id })}
                    selected={c.id === ciudadActual?.id}
                  >
                    {c.nombre}
                  </MenuItem>
                ))}
              </DropdownMenu>
            )}

            <DropdownMenu
              align="end"
              trigger={
                <button type="button" className={estilos.disparador}>
                  <span className={estilos.disparadorIcono} aria-hidden="true">
                    <ArrowUpDown size={13} />
                  </span>
                  Ordenar: {ETIQUETAS_ORDEN[filtros.orden]}
                  <ChevronDown size={14} aria-hidden="true" className={estilos.chevron} />
                </button>
              }
            >
              {ORDENES.map((orden) => (
                <MenuItem
                  key={orden}
                  href={hrefDirectorio(filtros, { orden })}
                  selected={orden === filtros.orden}
                >
                  {orden === 'az' ? 'Nombre, de la A a la Z' : 'Nombre, de la Z a la A'}
                </MenuItem>
              ))}
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* ── LA REJILLA ──────────────────────────────────────────────────── */}
      <section className={estilos.resultados} aria-label="Comercios aliados">
        {comercios.length > 0 ? (
          <ul className={estilos.rejilla}>
            {comercios.map((c, i) => (
              /* En la celda y no en la tarjeta: la tarjeta se levanta al apuntarla. */
              <li key={c.id} className={revelarEscalonado(i)}>
                <TarjetaDirectorio comercio={c} />
              </li>
            ))}
          </ul>
        ) : hayFiltros(filtros) ? (
          <EmptyState
            title="Ningún comercio coincide"
            description="Prueba con otra categoría, otra ciudad u otra búsqueda."
            icon={<Search aria-hidden="true" />}
            actions={
              <Button href="/explorar" variant="secondary" pildora>
                Ver todos los comercios
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Pronto habrá comercios aquí"
            description="Estamos sumando los primeros aliados del club."
            icon={<LayoutGrid aria-hidden="true" />}
          />
        )}
      </section>

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
