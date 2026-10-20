'use client'

import type { MouseEvent } from 'react'
import { Check } from 'lucide-react'
import { IconoCategoria } from '@/components/ui/icono-categoria'
import estilos from './subcategorias-directorio.module.css'

/*
  LAS SUBCATEGORÍAS  ·  afinan la categoría elegida (20/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «se agregaron más, y son categorías y
  subcategorías; necesito ajustar el diseño para eso». Las subcategorías NO
  van en la tira de círculos —con 25 más la tira dejaría de leerse—: aparecen
  DEBAJO, en una fila de píldoras, solo para las categorías elegidas que las
  tienen. Elegir «Gastronomía» abre sus subcategorías; tocar «Pizzerías» deja
  solo las pizzerías; «Todo» vuelve a la categoría entera.

    · Cada píldora lleva SU icono (ninguno se repite: `iconos-categoria.ts`)
      y su nombre. Son píldoras, no tarjetas: sin sombra.
    · La elegida se dice con el filo dorado, el peso, la marca ✓ y, al
      lector, «(elegida)»; nunca con un relleno.
    · Como las categorías, son ENLACES con su `href` de respaldo y el toque
      lo resuelve el directorio al instante (`onElegir`).
    · En el teléfono la fila se desliza de lado; en pantallas anchas, se
      reparte en varias líneas.
*/

export type OpcionSubcategoria = {
  id: number
  nombre: string
  href: string
  activa: boolean
}

export type GrupoSubcategorias = {
  categoriaId: number
  categoria: string
  opciones: OpcionSubcategoria[]
  /** El enlace de «Todo»: la categoría sin afinar. */
  hrefTodo: string
}

type Props = {
  grupos: GrupoSubcategorias[]
  /** Enciende o apaga una subcategoría. */
  onElegir: (id: number) => void
  /** «Todo»: quita las subcategorías elegidas de esa categoría. */
  onTodo: (categoriaId: number) => void
}

function clicNormal(e: MouseEvent) {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
}

export function SubcategoriasDirectorio({ grupos, onElegir, onTodo }: Props) {
  if (grupos.length === 0) return null
  return (
    <div className={estilos.subcategorias}>
      {grupos.map((g) => {
        const ninguna = g.opciones.every((o) => !o.activa)
        return (
          <nav key={g.categoriaId} className={estilos.grupo} aria-label={`Subcategorías de ${g.categoria}`}>
            <span className={estilos.titulo} aria-hidden="true">
              {g.categoria}
            </span>
            <ul className={estilos.fila}>
              <li>
                <a
                  href={g.hrefTodo}
                  className={estilos.pildora}
                  data-activa={ninguna || undefined}
                  onClick={(e) => {
                    if (!clicNormal(e)) return
                    e.preventDefault()
                    onTodo(g.categoriaId)
                  }}
                >
                  Todo
                  <span className="sr-only">
                    {' '}
                    {g.categoria}
                    {ninguna && ' (elegida)'}
                  </span>
                </a>
              </li>
              {g.opciones.map((o) => (
                <li key={o.id}>
                  <a
                    href={o.href}
                    className={estilos.pildora}
                    data-activa={o.activa || undefined}
                    onClick={(e) => {
                      if (!clicNormal(e)) return
                      e.preventDefault()
                      onElegir(o.id)
                    }}
                  >
                    <span className={estilos.icono} aria-hidden="true">
                      <IconoCategoria nombre={o.nombre} size={15} />
                    </span>
                    {o.nombre}
                    {o.activa && (
                      <>
                        <Check className={estilos.marca} size={14} strokeWidth={3} aria-hidden="true" />
                        <span className="sr-only"> (elegida)</span>
                      </>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )
      })}
    </div>
  )
}
