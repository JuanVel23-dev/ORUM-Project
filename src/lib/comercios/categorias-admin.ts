import type { createAdminClient } from '@/lib/supabase/admin'

export type CategoriaConSubcategorias = {
  id: number
  nombre: string
  subcategorias: { id: number; nombre: string }[]
}

/**
 * Las categorías con sus subcategorías anidadas, para los formularios del
 * panel: el desplegable de subcategoría depende de la categoría elegida.
 */
export async function cargarCategoriasConSubcategorias(
  admin: ReturnType<typeof createAdminClient>,
): Promise<CategoriaConSubcategorias[]> {
  const [{ data: categorias }, { data: subcategorias }] = await Promise.all([
    admin.from('categorias').select('id, nombre').order('nombre'),
    admin.from('subcategorias').select('id, subcategoria, categoria_id').order('subcategoria'),
  ])
  return (categorias ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    subcategorias: (subcategorias ?? [])
      .filter((s) => s.categoria_id === c.id)
      .map((s) => ({ id: s.id, nombre: s.subcategoria.trim() })),
  }))
}
