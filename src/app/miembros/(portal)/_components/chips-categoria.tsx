import Link from 'next/link'
import { Check } from 'lucide-react'
import { CarrilPista } from '@/components/ui/carril'
import styles from './chips-categoria.module.css'

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
    <nav aria-label="Categorías">
      <CarrilPista columnas="auto">
        <Chip href={hrefCon(paramsBase)} activo={activaId === null}>
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
  children,
}: {
  href: string
  activo: boolean
  children: string
}) {
  return (
    <Link
      href={href}
      className={[styles.chip, activo && styles.activo].filter(Boolean).join(' ')}
      aria-current={activo ? 'true' : undefined}
    >
      {/* El check es el portador que sobrevive a la ceguera al color; el
          relleno es refuerzo, no la señal. */}
      {activo && <Check size={13} aria-hidden />}
      {children}
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
