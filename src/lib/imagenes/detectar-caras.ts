import type { FaceDetector } from '@mediapipe/tasks-vision'
import type { ResultadoCaras } from './derechos'

/*
  DETECCIÓN DE CARAS  ·  solo en el navegador

  La foto NO sale del dispositivo: el modelo y el WASM se sirven desde
  `/mediapipe` (nuestro propio sitio), no desde un CDN. Se carga con
  `import()` dinámico y solo al primer uso, para que el resto del portal no
  pague ese peso.

  Esto es una barrera de comodidad, NO de seguridad: corre en el cliente y se
  salta. Y JAMÁS debe bloquear a un socio por un fallo técnico, así que
  cualquier problema —navegador antiguo, WASM que no carga, tiempo agotado—
  devuelve `no_disponible` y la subida continúa.
*/

const TIEMPO_MAXIMO_MS = 8000

let detector: Promise<FaceDetector> | null = null

async function crearDetector(): Promise<FaceDetector> {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  return FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: '/mediapipe/blaze_face_short_range.tflite' },
    runningMode: 'IMAGE',
    minDetectionConfidence: 0.5,
  })
}

export async function contarCaras(imagen: HTMLImageElement): Promise<ResultadoCaras> {
  const fallo: ResultadoCaras = { estado: 'no_disponible' }
  let reloj: ReturnType<typeof setTimeout> | undefined

  const trabajo = (async (): Promise<ResultadoCaras> => {
    detector ??= crearDetector()
    const d = await detector
    return { estado: 'disponible', caras: d.detect(imagen).detections.length }
  })()

  try {
    return await Promise.race([
      trabajo,
      new Promise<ResultadoCaras>((resolver) => {
        reloj = setTimeout(() => resolver(fallo), TIEMPO_MAXIMO_MS)
      }),
    ])
  } catch (err) {
    // Se suelta el detector en caché: si falló al crearse, el próximo intento reintenta.
    detector = null
    console.error('[detectar-caras] no se pudo comprobar la foto:', err)
    return fallo
  } finally {
    clearTimeout(reloj)
  }
}
