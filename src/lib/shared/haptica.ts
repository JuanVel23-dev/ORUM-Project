'use client'

/*
  Retroalimentación háptica.

  Tres reglas, de "Designing Audio-Haptic Experiences":

  1. CAUSALIDAD — se dispara en el evento que la causa (el estado cambia, el
     valor se copia), no antes ni "por si acaso".
  2. ARMONÍA — en el mismo fotograma que el cambio visual. Un desfase entre lo
     que se ve y lo que se siente destruye la ilusión.
  3. UTILIDAD — solo en momentos con significado. Vibrar en todo enseña a la
     gente a ignorar la vibración, y entonces deja de servir para nada.

  SOPORTE: `navigator.vibrate` existe en Android/Chrome. **Safari en iOS no lo
  implementa**, así que en iPhone esto no hace nada. Es una mejora progresiva:
  si no está, no pasa nada y no hay que comprobarlo en cada sitio.
*/

function vibrar(patron: number | number[]): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

  try {
    navigator.vibrate(patron)
  } catch {
    // Algunos navegadores lanzan si el documento no está activo.
  }
}

/** Confirmación breve: algo se copió, algo se activó. */
export function toque(): void {
  vibrar(10)
}

/** Una acción terminó bien. Dos pulsos cortos se leen como "listo". */
export function exito(): void {
  vibrar([12, 60, 12])
}

/** Algo falló. Un pulso más largo, distinguible del de éxito. */
export function error(): void {
  vibrar([40, 40, 40])
}
