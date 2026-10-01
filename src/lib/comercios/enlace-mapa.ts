/*
  EL ENLACE A GOOGLE MAPS DE UNA DIRECCIÓN  ·  función pura

  Encargo del propietario (30/09/2026): tocar la dirección de una sede en la
  ficha lleva a Maps. Se usa la URL universal de búsqueda
  (`/maps/search/?api=1`): en el teléfono la abre la app de Google Maps y en
  el escritorio, el navegador. Sin clave de API ni coordenadas: la base solo
  guarda la dirección en texto.

  Se añade la ciudad y «Colombia»: una «Calle 27 # 24-18» a secas existe en
  medio país, y sin contexto Maps elige la que le queda más cerca a quien
  busca, no la del comercio.
*/
export function enlaceMapa(direccion: string, ciudad?: string | null): string {
  const partes = [direccion.trim(), ciudad?.trim(), 'Colombia'].filter(Boolean)
  const consulta = encodeURIComponent(partes.join(', '))
  return `https://www.google.com/maps/search/?api=1&query=${consulta}`
}
