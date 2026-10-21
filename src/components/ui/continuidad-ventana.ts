/*
  LA VENTANA DE CARGA Y LA DEL FORMULARIO SON LA MISMA VENTANA (21/10/2026)
  ---------------------------------------------------------------------------
  Encargo: «siempre que abro un formulario o una ventana, la animación está
  mal: lo abre, hace como si cargara, se cierra y lo vuelve a abrir».

  Un formulario del panel se abre como ruta interceptada. Mientras llegan sus
  datos, el `loading.tsx` del grupo pinta `OverlayCargando` —una ventana con
  la silueta del formulario—, y cuando llegan, React RETIRA esa ventana y
  MONTA la del formulario (`OverlayRuta`). Son dos `<dialog>` distintos: el
  primero desaparecía de golpe y el segundo repetía la entrada entera —escala,
  fundido y el fondo oscureciéndose otra vez—. Se veía abrir, cerrar y abrir.

  Aquí se cuenta si hay una ventana de carga en pantalla (o si acaba de
  irse). La ventana que la sustituye lo pregunta AL MONTARSE y, si es así,
  aparece ya en su sitio: sin entrada, sin fundido del fondo. Lo que se ve es
  una sola ventana a la que le llega el contenido.

  Estado de módulo a propósito: las dos ventanas no comparten árbol (una es
  el `fallback` de un `Suspense` y la otra su contenido), y lo único que hay
  que saber es «¿había una ventana abierta hace un instante?».
*/

/** Ventanas de carga montadas ahora mismo. */
let montadas = 0
/** Cuándo se retiró la última (ms de `performance.now()`). */
let retiradaEn = Number.NEGATIVE_INFINITY

/**
 * Un margen holgado: entre que el `Suspense` retira la ventana de carga y
 * monta la del formulario pasa un mismo `commit`, no un cuarto de segundo.
 * Pasado esto, una ventana nueva es OTRA apertura y entra con su animación.
 */
const MARGEN_MS = 250

/** Lo llama la ventana de carga al montarse; devuelve lo que hay que hacer al irse. */
export function registrarVentanaDeCarga(): () => void {
  montadas += 1
  return () => {
    montadas -= 1
    retiradaEn = performance.now()
  }
}

/** ¿La ventana que se monta ahora sustituye a una de carga que ya estaba abierta? */
export function sustituyeVentanaDeCarga(): boolean {
  if (typeof window === 'undefined') return false
  return montadas > 0 || performance.now() - retiradaEn < MARGEN_MS
}
