import Form from 'next/form'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpDown, ChevronDown, Heart, LayoutGrid, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { EmptyState } from '@/components/ui/feedback'
import fotoMarca from '@/components/ui/marca/foto-hero.webp'
import type { CatalogoPublico } from '@/lib/publico/datos-publicos'
import {
  alternarCategoria,
  filtrarFavoritos,
  ETIQUETAS_ORDEN,
  filtrarDirectorio,
  hayFiltros,
  hrefDirectorio,
  leerFiltrosDirectorio,
  type OrdenDirectorio,
} from '@/lib/publico/directorio'
import { ENTRADA, REVELAR, retardoEntrada, revelarEscalonado } from '@/lib/shared/revelado'
import escaparate from '@/app/(publico)/escaparate.module.css'
import { CategoriasDirectorio } from './categorias-directorio'
import { BotonFavorito, ProveedorFavoritos } from './favoritos'
import { TarjetaDirectorio } from './tarjeta-directorio'
import estilos from './directorio-comercios.module.css'

/*
  EL DIRECTORIO DE COMERCIOS  ·  el de `/explorar`, compartido (29/09/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: el Inicio del Portal de Miembros tiene que ser
  IGUAL que `/explorar`. Para que lo sea por construcción y no por copia, el
  directorio vive aquí y lo montan las dos páginas:

    · `/explorar` (Portal Público): beneficios desenfocados, la ficha se abre
      encima (ruta interceptada).
    · `/miembros` (`socio`): beneficios legibles, la ficha del socio.

  Banner con la foto de marca y la búsqueda, panel con el recuento y los
  filtros (Categorías, Ciudad, Ordenar) y la rejilla de tarjetas.

  LOS FILTROS VIVEN EN LA URL: las categorías son enlaces, la ciudad y el
  orden son opciones de menú que navegan y la búsqueda es un
  `<form method="get">` a `base`. Todo funciona sin JavaScript salvo abrir
  los menús, se comparte por WhatsApp tal cual y sobrevive a un refresco.
  Filtrar ocurre en el servidor sobre la lista ya cargada
  (`filtrarDirectorio`, función pura y probada).

  La franja del banner es de `escaparate.module.css` (la fachada): sube por
  detrás de la cabecera fija de las dos páginas.
*/

const ORDENES: OrdenDirectorio[] = ['az', 'za']

type Props = {
  /** Ruta donde vive: `/explorar` o `/miembros`. La usan la búsqueda y los filtros. */
  base: string
  /** Los `searchParams` de la página, tal cual. */
  crudos: Record<string, string | string[] | undefined>
  directorio: CatalogoPublico
  /** El titular del banner. «Comercios» en la fachada. */
  titulo?: string
  /** La frase bajo el titular. */
  bajada: string
  /** Portal de Miembros: beneficio legible y ficha del socio. */
  socio?: boolean
  /**
   * Los favoritos del socio (ids de comercio), leídos en el servidor. Con
   * ellos aparecen el corazón de cada tarjeta y el filtro «Favoritos». Sin
   * ellos (la fachada pública), ni lo uno ni lo otro.
   */
  favoritos?: number[]
}

export function DirectorioComercios({
  base,
  crudos,
  directorio,
  titulo = 'Comercios',
  bajada,
  socio = false,
  favoritos,
}: Props) {
  const filtros = leerFiltrosDirectorio(crudos)
  const conFavoritos = favoritos !== undefined
  /* Los favoritos se combinan con Y con los demás filtros; en la fachada
     (sin favoritos) `?favoritos=1` no tiene efecto. */
  const soloFavoritos = conFavoritos && filtros.soloFavoritos
  const filtrados = filtrarDirectorio(directorio.comercios, filtros)
  const comercios = soloFavoritos ? filtrarFavoritos(filtrados, favoritos) : filtrados

  /* La ciudad elegida puede no existir ya (un enlace viejo): se muestra
     «Todas» en vez de un id suelto, y el filtro no casa con nada. */
  const ciudadActual = directorio.ciudades.find((c) => c.id === filtros.ciudadId)

  const contenido = (
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
            {titulo}
          </h1>
          <p className={[estilos.bajada, ENTRADA].join(' ')} style={retardoEntrada(2)}>
            {bajada}
          </p>

          {/*
            La búsqueda es un GET a esta misma ruta. Los demás filtros viajan
            en campos ocultos: buscar no puede borrar la categoría o la ciudad
            que el visitante ya había elegido.

            `Form` de Next y no `<form>` (30/09/2026, «cuando ponga un filtro
            no me envíe al principio de la página»): navega en el cliente sin
            recargar y, con `scroll={false}`, deja la página donde estaba.
            Sin JavaScript sigue siendo un GET normal.
          */}
          <Form
            className={[estilos.buscador, ENTRADA].join(' ')}
            style={retardoEntrada(3)}
            action={base}
            scroll={false}
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
            {filtros.categoriaIds.length > 0 && (
              <input type="hidden" name="categoria_id" value={filtros.categoriaIds.join(',')} />
            )}
            {filtros.ciudadId !== null && (
              <input type="hidden" name="ciudad_id" value={filtros.ciudadId} />
            )}
            {filtros.orden !== 'az' && <input type="hidden" name="orden" value={filtros.orden} />}
            {soloFavoritos && <input type="hidden" name="favoritos" value="1" />}
            <button type="submit" className={estilos.botonBuscar} aria-label="Buscar">
              <Search size={18} aria-hidden="true" />
            </button>
          </Form>
        </div>
      </section>

      {/* ── CATEGORÍAS + CIUDAD + ORDEN ─────────────────────────────────── */}
      <section
        id="comercios"
        className={[estilos.panel, REVELAR].join(' ')}
        aria-label="Filtros del directorio"
      >
        <div className={estilos.herramientas}>
          <p className={estilos.recuento} aria-live="polite">
            {comercios.length === 1 ? '1 comercio' : `${comercios.length} comercios`}
          </p>

          <div className={estilos.menus}>
            {/* «Favoritos»: un interruptor, no un menú. Enciende y apaga
                el filtro con el mismo toque; lleva el corazón relleno y rojo
                cuando está puesto. Solo el socio tiene favoritos. */}
            {conFavoritos && (
              <Link
                href={hrefDirectorio(filtros, { soloFavoritos: !soloFavoritos }, base)}
                scroll={false}
                className={[estilos.disparador, estilos.favoritos].join(' ')}
                data-activo={soloFavoritos || undefined}
              >
                <span className={estilos.disparadorIcono} aria-hidden="true">
                  <Heart size={13} fill={soloFavoritos ? 'currentColor' : 'none'} />
                </span>
                Favoritos
                {soloFavoritos && <span className="sr-only"> (filtro activo)</span>}
              </Link>
            )}
            {directorio.categorias.length > 0 && (
              <CategoriasDirectorio
                total={comercios.length}
                opciones={[
                  {
                    id: null,
                    nombre: 'Todas',
                    href: hrefDirectorio(filtros, { categoriaIds: [] }, base),
                    activa: filtros.categoriaIds.length === 0,
                  },
                  ...directorio.categorias.map((c) => ({
                    id: c.id,
                    nombre: c.nombre,
                    /* VARIAS a la vez (30/09/2026): cada una se enciende y se
                       apaga sola, con el mismo dedo y en el mismo sitio, sin
                       tocar las demás. «Todas» limpia la selección. */
                    href: hrefDirectorio(
                      filtros,
                      { categoriaIds: alternarCategoria(filtros.categoriaIds, c.id) },
                      base,
                    ),
                    activa: filtros.categoriaIds.includes(c.id),
                  })),
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
                  href={hrefDirectorio(filtros, { ciudadId: null }, base)}
                  scroll={false}
                  selected={!ciudadActual}
                >
                  Todas
                </MenuItem>
                {directorio.ciudades.map((c) => (
                  <MenuItem
                    key={c.id}
                    href={hrefDirectorio(filtros, { ciudadId: c.id }, base)}
                    scroll={false}
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
                  href={hrefDirectorio(filtros, { orden }, base)}
                  scroll={false}
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
              <li key={c.id} className={[estilos.celda, revelarEscalonado(i)].join(' ')}>
                <TarjetaDirectorio comercio={c} socio={socio} />
                {/* Hermano del enlace, no hijo: ver `favoritos.tsx`. */}
                {conFavoritos && (
                  <BotonFavorito comercioId={c.id} nombre={c.nombre} className={estilos.corazon} />
                )}
              </li>
            ))}
          </ul>
        ) : soloFavoritos && favoritos.length === 0 ? (
          <EmptyState
            title="Aún no tienes favoritos"
            description="Toca el corazón de un comercio para guardarlo aquí y encontrarlo de un vistazo."
            icon={<Heart aria-hidden="true" />}
            actions={
              <Button
                href={hrefDirectorio(filtros, { soloFavoritos: false }, base)}
                variant="secondary"
                pildora
              >
                Ver todos los comercios
              </Button>
            }
          />
        ) : hayFiltros(filtros) ? (
          <EmptyState
            title="Ningún comercio coincide"
            description="Prueba con otra categoría, otra ciudad u otra búsqueda."
            icon={<Search aria-hidden="true" />}
            actions={
              /* Al panel de filtros, no al principio de la página. */
              <Button href={`${base}#comercios`} variant="secondary" pildora>
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
    </>
  )

  /* El estado del corazón es UNO para toda la pantalla. El proveedor recibe
     el árbol por `children`: todo sigue renderizándose en el servidor. */
  return conFavoritos ? (
    <ProveedorFavoritos inicial={favoritos}>{contenido}</ProveedorFavoritos>
  ) : (
    contenido
  )
}
