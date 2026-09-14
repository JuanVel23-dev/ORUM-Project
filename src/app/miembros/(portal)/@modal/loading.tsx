/*
  La ranura necesita SU PROPIO `loading.tsx`.

  Sin él Next cae al `loading.tsx` de la sección y dibuja el esqueleto del
  catálogo entero dentro del hueco del modal — dos catálogos, uno encima del
  otro. Es un fallo ya visto en el panel de administración.

  Y aquí no se dibuja ningún esqueleto: el overlay se anima al abrirse y un
  esqueleto que aparece y desaparece en 200 ms es un parpadeo, no información.
  La página de detrás sigue visible, que es justo lo que el overlay conserva.
*/
export default function CargandoModal() {
  return null
}
