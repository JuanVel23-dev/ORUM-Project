/**
 * Etiqueta del badge de alcance en la lista de administración.
 *
 * `false, false` no debería llegar aquí — la acción de crear/editar exige al
 * menos un portal marcado — pero una fila creada fuera de la app (o un dato
 * viejo) no puede reventar la tabla: se etiqueta explícitamente en vez de
 * pintar un hueco.
 */
export function etiquetaAlcance(mostrarPublico: boolean, mostrarMiembros: boolean): string {
  if (mostrarPublico && mostrarMiembros) return 'Público y miembros'
  if (mostrarPublico) return 'Solo público'
  if (mostrarMiembros) return 'Solo miembros'
  return 'Sin publicar'
}
