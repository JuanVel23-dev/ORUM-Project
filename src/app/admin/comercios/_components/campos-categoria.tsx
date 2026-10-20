'use client'

import { useState } from 'react'
import { Field } from '@/components/ui/field'
import { SelectMenu } from '@/components/ui/select-menu'
import type { CategoriaConSubcategorias } from '@/lib/comercios/categorias-admin'
import styles from '@/styles/formulario.module.css'

type Props = {
  categorias: CategoriaConSubcategorias[]
  categoriaInicial?: number | null
  subcategoriaInicial?: number | null
}

/**
 * Categoría y subcategoría de un comercio, compartidas por «Crear» y «Editar».
 * La subcategoría depende de la categoría: al cambiar esta se reinicia, y si la
 * categoría no tiene subcategorías el campo sigue ahí, avisándolo.
 */
export function CamposCategoria({ categorias, categoriaInicial, subcategoriaInicial }: Props) {
  const [categoriaId, setCategoriaId] = useState(categoriaInicial ? String(categoriaInicial) : '')
  const subcategorias = categorias.find((c) => String(c.id) === categoriaId)?.subcategorias ?? []

  // Solo se conserva la inicial mientras siga siendo de la categoría elegida.
  const inicial =
    subcategoriaInicial && subcategorias.some((s) => s.id === subcategoriaInicial)
      ? String(subcategoriaInicial)
      : ''

  const ayuda = !categoriaId
    ? 'Elige primero una categoría.'
    : subcategorias.length === 0
      ? 'Esta categoría aún no tiene subcategorías.'
      : undefined

  return (
    <div className={styles.pareja}>
      <Field label="Categoría" optional>
        <SelectMenu
          name="categoria_id"
          etiqueta="Categoría"
          placeholder="Sin categoría"
          value={categoriaId}
          onChange={setCategoriaId}
          opciones={[
            { value: '', label: 'Sin categoría' },
            ...categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
          ]}
        />
      </Field>

      <Field label="Subcategoría" optional help={ayuda}>
        <SelectMenu
          key={categoriaId}
          name="subcategoria_id"
          etiqueta="Subcategoría"
          placeholder="Sin subcategoría"
          defaultValue={inicial}
          opciones={[
            { value: '', label: 'Sin subcategoría' },
            ...subcategorias.map((s) => ({ value: String(s.id), label: s.nombre })),
          ]}
        />
      </Field>
    </div>
  )
}
