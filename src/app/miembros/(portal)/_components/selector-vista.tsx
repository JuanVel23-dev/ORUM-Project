import Link from 'next/link'
import { Clock3, Heart, LayoutGrid, Repeat2, type LucideIcon } from 'lucide-react'
import { CarrilPista } from '@/components/ui/carril'
import { VISTAS, VISTA_POR_DEFECTO, type Vista } from '@/lib/miembros/vistas-catalogo'
import estilos from './selector-vista.module.css'
import { Agitar } from '@/components/ui/agitar'

/*
  EJE 1 · LA VISTA  ·  encargos nº 10 y nº 11
  ---------------------------------------------------------------------------
  QUÉ conjunto se mira y en qué orden. La jerarquía, y el porqué, están
  argumentados en `src/lib/miembros/vistas-catalogo.ts`: aquí solo se pinta.

  POR QUÉ NO COMPARTE FILA CON LAS CATEGORÍAS, que es lo que el encargo pedía
  vigilar: son preguntas distintas. "Tus favoritos" y "Comida" se pueden querer
  A LA VEZ; "Más recientes" y "Los que más usas", no. Puestos en la misma fila,
  el socio no tendría forma de saber cuáles se excluyen y cuáles se suman, y lo
  descubriría a base de tocar.

  Y NO SE DISTINGUEN SOLO POR LA POSICIÓN. Las dos filas hablan lenguajes
  visuales distintos:

    · VISTA (esta)  — pestañas. Activo = SUBRAYADO, sin relleno.
    · CATEGORÍA     — chips. Activo = relleno de tinta.

  Dos filas de chips idénticos, una encima de otra, se leen como una sola lista
  partida en dos renglones. Con dos tratamientos, la subordinación se ve antes
  de leer una palabra.

  SON ENLACES, NO BOTONES. Un toque, cero pulsaciones de "Filtrar", estado en la
  URL, funciona sin JavaScript y sobrevive a un refresco — la convención del
  repositorio para todo filtro. Y es lo que hace que, al cerrarse el overlay de
  la ficha, el socio vuelva exactamente a la vista que tenía.

  SERVER COMPONENT. La selección la resuelve la navegación; la agitación, CSS.
  Cero bytes en el cliente.
*/

type OpcionVista = {
  vista: Vista
  etiqueta: string
  icono: LucideIcon
  /** Para el lector de pantalla: dice qué CONJUNTO es, no cómo se ve. */
  descripcion: string
}

const OPCIONES: Record<Vista, OpcionVista> = {
  todo: {
    vista: 'todo',
    etiqueta: 'Todo el club',
    icono: LayoutGrid,
    descripcion: 'Todos los comercios, por orden alfabético',
  },
  recientes: {
    vista: 'recientes',
    etiqueta: 'Más recientes',
    icono: Clock3,
    descripcion: 'Los últimos aliados que se sumaron, primero',
  },
  usados: {
    vista: 'usados',
    etiqueta: 'Los que más usas',
    icono: Repeat2,
    descripcion: 'Los comercios donde más has usado tu membresía',
  },
  favoritos: {
    vista: 'favoritos',
    etiqueta: 'Tus favoritos',
    icono: Heart,
    descripcion: 'Los comercios que has marcado con el corazón',
  },
}

export function SelectorVista({
  activa,
  /**
   * El resto de parámetros vivos de la URL —búsqueda, marca, ciudad,
   * categoría—, ya normalizados. Cambiar de vista NO puede borrar lo que el
   * socio acababa de escribir ni la categoría que acababa de tocar: la vista es
   * el eje de arriba, y el de abajo sobrevive.
   */
  paramsBase,
}: {
  activa: Vista
  paramsBase: Record<string, string>
}) {
  return (
    /*
      `<nav>` con nombre, igual que la fila de categorías. Son enlaces de
      navegación dentro de la misma página, y el nombre es lo que permite
      saltar directamente aquí con un lector de pantalla.
    */
    <nav aria-label="Qué comercios ver" className={estilos.barra}>
      <CarrilPista columnas="auto">
        {VISTAS.map((v) => {
          const opcion = OPCIONES[v]
          const esActiva = v === activa
          const Icono = opcion.icono

          return (
            <Link
              key={v}
              href={hrefVista(paramsBase, v)}
              className={[estilos.pestana, esActiva && estilos.activa]
                .filter(Boolean)
                .join(' ')}
              /*
                `aria-current="true"`, NUNCA solo el subrayado. El subrayado y el
                color son para el ojo; esto es para todo lo demás.
              */
              aria-current={esActiva ? 'true' : undefined}
              title={opcion.descripcion}
            >
              {/*
                El icono se agita al quedar seleccionado, vía `<Agitar>`.

                La copia local anterior encendía `animation` con solo estar la
                clase puesta, y estas pestañas navegan con `<Link>`: al recargar
                con una vista ya elegida el icono llegaba con la clase y se
                agitaba al montar, en cada carga. `Agitar` siembra su estado con
                `activo` y solo reacciona a la transición hacia encendido.

                Bajo `prefers-reduced-motion` se retira entera y el estado sigue
                dicho por el subrayado, el peso y `aria-current`.
              */}
              <Agitar activo={esActiva} className={estilos.icono}>
                <Icono size={15} aria-hidden="true" />
              </Agitar>
              {/* ICONO + TEXTO, siempre. Nunca icono solo. */}
              <span className={estilos.etiqueta}>{opcion.etiqueta}</span>
            </Link>
          )
        })}
      </CarrilPista>
    </nav>
  )
}

/**
 * La URL de una vista, conservando el resto de filtros.
 *
 * `todo` NO escribe el parámetro: es el defecto, y un `?ver=todo` colgando de
 * la URL que el socio comparte por WhatsApp es ruido que no dice nada. Es la
 * misma decisión que ya toma `urlDelCatalogo` con los filtros vacíos.
 */
export function hrefVista(base: Record<string, string>, vista: Vista): string {
  const params = new URLSearchParams(base)
  params.delete('ver')
  if (vista !== VISTA_POR_DEFECTO) params.set('ver', vista)

  const consulta = params.toString()
  return consulta ? `/miembros?${consulta}` : '/miembros'
}
