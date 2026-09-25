/** Una novedad tal como la consumen el banner y el historial. */
export type AnuncioResumen = {
  id: number
  titulo: string
  cuerpo: string
  imagenUrl: string | null
  createdAt: string
}
