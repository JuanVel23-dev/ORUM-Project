import type { createAdminClient } from '@/lib/supabase/admin'
import { MAX_CATEGORIAS_COMERCIO, type FilaCategoriaComercio } from './categorias-comercio'

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

type FilaGuardada = { comercio_id: number; categoria_id: number; subcategoria_id: number | null }

/** Las categorías de UN comercio, en el orden en que se guardaron. */
export async function cargarFilasCategoria(
  admin: ReturnType<typeof createAdminClient>,
  comercioId: number,
): Promise<FilaCategoriaComercio[]> {
  const { data } = await admin
    .from('comercio_categorias')
    .select('categoria_id, subcategoria_id')
    .eq('comercio_id', comercioId)
    .order('orden')
    .limit(MAX_CATEGORIAS_COMERCIO)
  return (data ?? []).map((f) => ({ categoriaId: f.categoria_id, subcategoriaId: f.subcategoria_id }))
}

/**
 * Las categorías de TODOS los comercios, agrupadas por comercio y en orden.
 * PostgREST corta cada respuesta en 1000 filas: se pide por páginas.
 */
export async function cargarFilasCategoriaDeTodos(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<number, FilaCategoriaComercio[]>> {
  const porComercio = new Map<number, FilaCategoriaComercio[]>()
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data } = await admin
      .from('comercio_categorias')
      .select('comercio_id, categoria_id, subcategoria_id')
      .order('comercio_id')
      .order('orden')
      .range(desde, desde + PAGINA - 1)
    const filas = (data ?? []) as FilaGuardada[]
    for (const f of filas) {
      const lista = porComercio.get(f.comercio_id) ?? []
      lista.push({ categoriaId: f.categoria_id, subcategoriaId: f.subcategoria_id })
      porComercio.set(f.comercio_id, lista)
    }
    if (filas.length < PAGINA) return porComercio
  }
}
