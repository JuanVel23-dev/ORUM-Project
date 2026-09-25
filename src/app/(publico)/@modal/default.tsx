/*
  Lo que ocupa la ranura `@modal` cuando no hay nada abierto.

  Sin este archivo Next no sabe qué renderizar en la ranura al llegar a una
  ruta que no la usa —la landing, `/aliados`— y falla con un 404 que parece un
  bug de rutas y no lo es.
*/
export default function SinModal() {
  return null
}
