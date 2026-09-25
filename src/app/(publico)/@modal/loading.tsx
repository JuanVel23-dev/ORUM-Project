/*
  La ranura necesita SU PROPIO `loading.tsx`.

  Sin él Next cae al `loading.tsx` más cercano y dibujaría su esqueleto dentro
  del hueco del overlay. Aquí no se dibuja nada: el overlay se anima al
  abrirse, y la página de detrás sigue visible, que es justo lo que conserva.
*/
export default function CargandoModal() {
  return null
}
