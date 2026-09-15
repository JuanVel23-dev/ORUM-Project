import type { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { CarrilPista } from '@/components/ui/carril'
import { IconoCategoria } from './icono-categoria'
import styles from './chips-categoria.module.css'
import { Agitar } from '@/components/ui/agitar'

export type Categoria = { id: number; nombre: string }

/**
 * Mínimo de categorías —además de "Todas"— para que la fila valga la pena.
 * Con una sola, el chip es la rejilla entera: no filtra nada.
 */
const MINIMO_CHIPS = 2

/*
  LOS CHIPS SON ENLACES, NO CAMPOS DE UN FORMULARIO.

  `<Link href="?categoria_id=3">` es UN TOQUE y cero pulsaciones de "Filtrar",
  que es la regla nº1 de CLAUDE.md. Funciona sin JavaScript, queda en la URL,
  se comparte y sobrevive a un refresco, que es la convención de este
  repositorio para los filtros.

  Vive en `_components/` de la ruta y no en `src/components/ui/`: construye su
  `href` a partir de los `searchParams`, o sea que es lógica de ruta, no una
  primitiva del sistema.
*/

type ChipsCategoriaProps = {
  categorias: Categoria[]
  /** `null` = "Todas". */
  activaId: number | null
  /**
   * El resto de parámetros vivos de la URL (búsqueda, marca, ciudad), ya
   * normalizados. Cada chip los conserva y cambia SOLO `categoria_id`: si no,
   * elegir categoría borraría lo que el socio acababa de escribir.
   */
  paramsBase: Record<string, string>
}

export function ChipsCategoria({
  categorias,
  activaId,
  paramsBase,
}: ChipsCategoriaProps) {
  if (categorias.length < MINIMO_CHIPS) return null

  /*
    "Todas" primero y siempre; la activa en segunda posición; el resto,
    alfabético.

    Hoistar la activa es la única forma, sin código de cliente, de que no
    quede fuera de vista tras un refresco: no se puede desplazar la fila hasta
    ella. Y el resto es alfabético A PROPÓSITO: una fila que se reordena sola
    entre visitas destruye la memoria muscular.
  */
  const alfabeticas = [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const activa = alfabeticas.find((c) => c.id === activaId)
  const ordenadas = activa
    ? [activa, ...alfabeticas.filter((c) => c.id !== activa.id)]
    : alfabeticas

  return (
    /*
      El nombre del `<nav>` dice "Categorías" y no "Filtros": arriba hay OTRA
      fila de filtros —el selector de vista— y dos regiones llamadas igual
      dejarían al lector de pantalla sin forma de distinguirlas.
    */
    <nav aria-label="Categorías">
      <CarrilPista columnas="auto">
        <Chip
          href={hrefCon(paramsBase)}
          activo={activaId === null}
          /* "Todas" no es una categoría, así que no le toca glifo de categoría:
             lleva el mismo icono de rejilla que la vista "Todo el club", que es
             lo que significa. Pero icono lleva, como todos: un hueco en el
             primer chip desalinearía la fila entera. */
          icono={<LayoutGrid size={14} aria-hidden="true" />}
        >
          Todas
        </Chip>

        {ordenadas.map((c) => {
          const esActiva = c.id === activaId
          return (
            <Chip
              key={c.id}
              /* Tocar la categoría activa la APAGA: encender y apagar con el
                 mismo dedo, en el mismo sitio. */
              href={esActiva ? hrefCon(paramsBase) : hrefCon(paramsBase, c.id)}
              activo={esActiva}
              /*
                EL ICONO SIGNIFICA ALGO (encargo nº 10): sale del nombre de la
                categoría, y cuando ninguna palabra clave casa hay un respaldo
                genérico. Nunca un hueco — la regla está escrita en
                `iconos-categoria.ts`.
              */
              icono={<IconoCategoria nombre={c.nombre} />}
            >
              {c.nombre}
            </Chip>
          )
        })}
      </CarrilPista>
    </nav>
  )
}

function Chip({
  href,
  activo,
  icono,
  children,
}: {
  href: string
  activo: boolean
  icono: ReactNode
  children: string
}) {
  return (
    <Link
      href={href}
      className={[styles.chip, activo && styles.activo].filter(Boolean).join(' ')}
      aria-current={activo ? 'true' : undefined}
    >
      {/*
        EL ICONO ESTÁ SIEMPRE, activo o no.

        Antes solo aparecía un `Check` en el chip activo, y era el portador que
        sobrevivía a la ceguera al color. Ese papel pasa ahora al SUBRAYADO de la
        etiqueta (encargo nº 11), que hace lo mismo sin gastar el hueco del
        icono; y el hueco se gasta en algo que informa en los DOS estados: de
        qué tipo de comercio habla el chip.

        LA AGITACIÓN VA POR `<Agitar>`, no por una clase condicional.

        La copia local que había aquí aplicaba `animation` por el mero hecho de
        que la clase estuviera presente, y estos chips navegan con `<Link>`: en
        una recarga con el filtro YA puesto el servidor pinta el icono con la
        clase desde el primer fotograma y el navegador lo agita al montar. Es
        decir, temblaba en cada carga de página — justo lo que la regla prohíbe
        («no se agita al montar ni al apagarse»).

        `Agitar` siembra su estado con `activo`, así que montar encendido no
        agita nada y solo lo hace la transición apagado → encendido. Bajo
        `prefers-reduced-motion` se retira entera, y el estado lo siguen
        diciendo el subrayado, el relleno y `aria-current`.
      */}
      <Agitar activo={activo} className={styles.icono}>
        {icono}
      </Agitar>

      {/* ICONO + TEXTO, nunca icono solo. */}
      <span className={styles.etiqueta}>{children}</span>
    </Link>
  )
}

/** URL del catálogo con los parámetros dados y, si se pasa, una categoría. */
function hrefCon(base: Record<string, string>, categoriaId?: number): string {
  const params = new URLSearchParams(base)
  if (categoriaId !== undefined) params.set('categoria_id', String(categoriaId))
  const consulta = params.toString()
  return consulta ? `/miembros?${consulta}` : '/miembros'
}
