'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { Check, ImagePlus, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ZOOM_MAX, type Encuadre } from '@/lib/imagenes/encuadre'
import {
  encuadreInicialEnMarco,
  escalaCubrir,
  girarEnMarco,
  limitarEnMarco,
  zoomEnMarco,
  zoomMinimo,
  type Marco,
} from '@/lib/imagenes/marco'
import estilos from './editor-encuadre.module.css'

/*
  EL EDITOR DE ENCUADRE  ·  ajustar una imagen antes de subirla (04/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario, al dar al comercio su logotipo y sus fotos: «añade
  la funcionalidad de ajustar todas estas fotografías, como la fotografía de
  miembros».

  Es el mismo gesto que «Mi foto» del socio (`perfil/foto/editor-foto.tsx`)
  —arrastrar para encuadrar; acercar con la barra, la rueda o pellizcando;
  girar de 90 en 90—, sacado a una pieza que sirve para CUALQUIER marco:

    · un CÍRCULO en el que la imagen puede verse entera, con aire (el
      logotipo: `permiteContener`), y
    · un RECTÁNGULO 16:9 que la imagen siempre cubre (las fotos del negocio).

  El editor del socio NO se tocó: lleva su material negro y plata, la
  detección de caras y la declaración de derechos, que aquí no aplican (las
  fotos de un comercio quedan fuera de esa regla). Lo que comparten es la
  geometría, y la de aquí es `lib/imagenes/marco.ts`, probada aparte.

  DOS PIEZAS:

    · `useImagenElegida` — abre el archivo que elige la persona y lo deja
      listo (o dice por qué no pudo).
    · `EditorEncuadre`  — el escenario, los controles y «Guardar». Al
      guardar pinta el recorte en un `canvas` y entrega un JPEG ligero: eso
      es lo que permite aceptar la foto de un teléfono tal cual (5 MB,
      4000 px) y subir unos pocos cientos de KB ya encuadrados. El servidor
      vuelve a validar tipo y peso: esto es comodidad, no seguridad.

  No sabe a dónde va la imagen: quien lo usa recibe el archivo en `onGuardar`
  y decide.
*/

/** Tope de la imagen de ORIGEN: una foto de teléfono cabe con mucho margen. */
const MAX_ORIGEN = 25 * 1024 * 1024
/** Calidades que se prueban hasta caber en el límite de salida. */
const CALIDADES = [0.88, 0.8, 0.72, 0.62, 0.5]
const ERROR_ACTUAL =
  'No pudimos abrir la imagen actual para editarla. Inténtalo de nuevo, o elige un archivo para reemplazarla.'

export type ImagenElegida = {
  url: string
  ancho: number
  alto: number
  imagen: HTMLImageElement
  /** Es la imagen ya publicada, abierta para retocarla (no un archivo nuevo). */
  existente: boolean
}

export type OpcionesEncuadre = Marco & {
  /** La forma del marco: es lo que se ve; la geometría la da `proporcion`. */
  forma: 'circulo' | 'rectangulo'
  /** Ancho del archivo que se sube, en px. El alto sale de la proporción. */
  anchoSalida: number
  /**
   * Peso máximo del archivo que se entrega, en bytes. Por debajo del límite
   * del bucket Y del megabyte que admite el cuerpo de una server action.
   */
  pesoMaximo: number
}

/* ==========================================================================
   ELEGIR LA IMAGEN
   ========================================================================== */

/**
 * Abre la imagen que se va a encuadrar: un archivo que elige la persona
 * (`elegir`) o la que ya está publicada (`abrirActual`). Devuelve la imagen
 * lista, y cómo soltarla. El `object URL` retiene la imagen en memoria hasta
 * que se revoca: se suelta al cambiar de imagen y al desmontar.
 *
 * CADA APERTURA LLEVA SU TURNO. Abrir es asíncrono (decodificar; y para la
 * actual, además, descargarla), y mientras tanto pueden pasar cosas: elegir
 * otra, volver a la rejilla, cerrar la ventana. Una apertura que termina
 * cuando ya no es la vigente se descarta. Sin el turno, una descarga lenta
 * abría el editor DESPUÉS de haber cerrado la ventana, con la imagen de antes.
 */
export function useImagenElegida() {
  const [imagen, setImagen] = useState<ImagenElegida | null>(null)
  const [abriendo, setAbriendo] = useState(false)
  const [fallo, setFallo] = useState<{ mensaje: string; deLaActual: boolean } | null>(null)
  const turno = useRef(0)

  // Al desmontar, lo que siga en vuelo ya no es de nadie.
  useEffect(() => {
    return () => {
      turno.current += 1
    }
  }, [])

  useEffect(() => {
    if (!imagen) return
    return () => URL.revokeObjectURL(imagen.url)
  }, [imagen])

  /** Decodifica una imagen ya en memoria y la deja lista, si sigue siendo su turno. */
  function decodificar(fuente: Blob, miTurno: number, existente: boolean) {
    const url = URL.createObjectURL(fuente)
    const nodo = new Image()
    nodo.decoding = 'async'
    nodo.onload = () => {
      if (turno.current !== miTurno) {
        URL.revokeObjectURL(url)
        return
      }
      setAbriendo(false)
      setImagen({
        url,
        ancho: nodo.naturalWidth,
        alto: nodo.naturalHeight,
        imagen: nodo,
        existente,
      })
    }
    nodo.onerror = () => {
      URL.revokeObjectURL(url)
      if (turno.current !== miTurno) return
      setAbriendo(false)
      setFallo(
        existente
          ? { mensaje: ERROR_ACTUAL, deLaActual: true }
          : {
              mensaje: 'No pudimos abrir esa imagen. Prueba con una foto JPG o PNG.',
              deLaActual: false,
            },
      )
    }
    nodo.src = url
  }

  /** Un archivo que elige la persona. */
  function elegir(archivo: File | undefined) {
    setFallo(null)
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setFallo({
        mensaje: 'Ese archivo no es una imagen. Elige una foto JPG, PNG o WebP.',
        deLaActual: false,
      })
      return
    }
    if (archivo.size > MAX_ORIGEN) {
      setFallo({ mensaje: 'Esa imagen pesa más de 25 MB. Elige una más liviana.', deLaActual: false })
      return
    }
    const miTurno = ++turno.current
    setAbriendo(true)
    decodificar(archivo, miTurno, false)
  }

  /**
   * La imagen YA PUBLICADA, para retocarla. Se descarga como datos y no se
   * pinta desde su URL: una imagen de otro origen «contamina» el `canvas`, y
   * entonces no se podría exportar el recorte. El bucket de Storage responde
   * con `Access-Control-Allow-Origin: *`; una URL externa sin CORS fallaría,
   * y para ese caso queda elegir un archivo.
   */
  async function abrirActual(direccion: string) {
    setFallo(null)
    const miTurno = ++turno.current
    setAbriendo(true)
    try {
      const respuesta = await fetch(direccion)
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
      const datos = await respuesta.blob()
      if (turno.current !== miTurno) return
      decodificar(datos, miTurno, true)
    } catch {
      if (turno.current !== miTurno) return
      setAbriendo(false)
      setFallo({ mensaje: ERROR_ACTUAL, deLaActual: true })
    }
  }

  /** Suelta la imagen y anula lo que estuviera abriéndose. */
  function soltar() {
    turno.current += 1
    setAbriendo(false)
    setImagen(null)
  }

  return {
    imagen,
    abriendo,
    error: fallo?.mensaje ?? null,
    /** El fallo fue al abrir la imagen publicada: se ofrece elegir un archivo. */
    falloLaActual: fallo?.deLaActual ?? false,
    elegir,
    abrirActual,
    soltar,
  }
}

/* ==========================================================================
   EXPORTAR EL RECORTE
   ========================================================================== */

/** Pinta el recorte en un `canvas` y lo entrega como JPEG dentro del peso. */
async function exportar(
  f: ImagenElegida,
  e: Encuadre,
  opciones: OpcionesEncuadre,
): Promise<Blob> {
  // Si a pleno tamaño no cabe ni con la calidad más baja, se reduce un paso.
  for (const reduccion of [1, 0.8, 0.64]) {
    const ancho = Math.round(opciones.anchoSalida * reduccion)
    const alto = Math.round(ancho * opciones.proporcion)

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new Error('sin canvas')

    // Un PNG con transparencia saldría con fondo NEGRO en JPEG, y un logotipo
    // alejado deja hueco alrededor. Es un dato del archivo, no un color de
    // interfaz: blanco, que es el fondo sobre el que se enseña un logotipo.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ancho, alto)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // La misma cuenta que el CSS del escenario, en píxeles de salida: el
    // ancho del marco es la unidad, también para el desplazamiento vertical.
    const escala = escalaCubrir(f.ancho, f.alto, e.giro, opciones.proporcion) * e.zoom * ancho
    ctx.translate(ancho / 2 + e.x * ancho, alto / 2 + e.y * ancho)
    ctx.rotate((e.giro * Math.PI) / 180)
    ctx.scale(escala, escala)
    ctx.drawImage(f.imagen, -f.ancho / 2, -f.alto / 2, f.ancho, f.alto)

    for (const calidad of CALIDADES) {
      const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', calidad))
      if (blob && blob.size <= opciones.pesoMaximo) return blob
    }
  }
  throw new Error('demasiado pesada')
}

/* ==========================================================================
   EL EDITOR
   ========================================================================== */

type Props = {
  imagen: ImagenElegida
  opciones: OpcionesEncuadre
  /** Lo que dice el botón principal: «Guardar logotipo», «Guardar foto». */
  textoGuardar: string
  /** La acción de quien lo usa está en curso (subiendo). */
  guardando: boolean
  /** El error que devuelva esa acción. */
  error?: string | null
  /** Recibe el archivo ya encuadrado, listo para un `FormData`. */
  onGuardar: (archivo: File) => void
  /** Abre el selector para cambiar de imagen sin salir del editor. */
  onElegirOtra: () => void
  /** Sale del editor sin guardar nada. */
  onCancelar: () => void
}

export function EditorEncuadre({
  imagen,
  opciones,
  textoGuardar,
  guardando,
  error,
  onGuardar,
  onElegirOtra,
  onCancelar,
}: Props) {
  const [encuadre, setEncuadre] = useState<Encuadre>(() =>
    encuadreInicialEnMarco(imagen.ancho, imagen.alto, opciones, imagen.existente),
  )
  /** Transición suave solo para lo que salta (girar, restablecer, botones ±). */
  const [suave, setSuave] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const escenario = useRef<HTMLDivElement>(null)
  const marco = useRef<HTMLDivElement>(null)
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const pellizco = useRef<{ distancia: number; zoom: number } | null>(null)

  const { ancho, alto } = imagen
  const minimo = zoomMinimo(ancho, alto, encuadre.giro, opciones)
  const ocupado = preparando || guardando

  /*
    La rueda acerca. Va con `addEventListener` y `passive: false` porque
    React registra `onWheel` como pasivo y no deja cancelar el desplazamiento
    de la ventana que hay por debajo.
  */
  useEffect(() => {
    const nodo = escenario.current
    if (!nodo) return
    const alGirarRueda = (e: WheelEvent) => {
      e.preventDefault()
      setSuave(false)
      setEncuadre((actual) =>
        zoomEnMarco(actual, actual.zoom * Math.exp(-e.deltaY * 0.0015), ancho, alto, opciones),
      )
    }
    nodo.addEventListener('wheel', alGirarRueda, { passive: false })
    return () => nodo.removeEventListener('wheel', alGirarRueda)
  }, [ancho, alto, opciones])

  /* --- Gestos: arrastrar con un dedo, pellizcar con dos ------------------- */

  function alApretar(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setSuave(false)
    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()]
      pellizco.current = { distancia: Math.hypot(a.x - b.x, a.y - b.y), zoom: encuadre.zoom }
    }
  }

  function alMover(e: PointerEvent<HTMLDivElement>) {
    const previo = punteros.current.get(e.pointerId)
    if (!previo) return
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (punteros.current.size >= 2 && pellizco.current) {
      const [a, b] = [...punteros.current.values()]
      const factor = Math.hypot(a.x - b.x, a.y - b.y) / pellizco.current.distancia
      const zoom = pellizco.current.zoom * factor
      setEncuadre((actual) => zoomEnMarco(actual, zoom, ancho, alto, opciones))
      return
    }

    // Seguimiento 1:1: el desplazamiento en píxeles, pasado a anchos de marco.
    const unidad = marco.current?.clientWidth || 1
    const dx = (e.clientX - previo.x) / unidad
    const dy = (e.clientY - previo.y) / unidad
    setEncuadre((actual) =>
      limitarEnMarco({ ...actual, x: actual.x + dx, y: actual.y + dy }, ancho, alto, opciones),
    )
  }

  function alSoltar(e: PointerEvent<HTMLDivElement>) {
    punteros.current.delete(e.pointerId)
    if (punteros.current.size < 2) pellizco.current = null
  }

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    const paso = e.shiftKey ? 0.1 : 0.02
    const mover: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, -paso],
      ArrowDown: [0, paso],
    }
    if (mover[e.key]) {
      e.preventDefault()
      const [dx, dy] = mover[e.key]
      setSuave(true)
      setEncuadre((a) => limitarEnMarco({ ...a, x: a.x + dx, y: a.y + dy }, ancho, alto, opciones))
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      acercar(1.2)
    } else if (e.key === '-') {
      e.preventDefault()
      acercar(1 / 1.2)
    }
  }

  /** Multiplica el zoom: un paso se nota igual de lejos que de cerca. */
  function acercar(factor: number) {
    setSuave(true)
    setEncuadre((a) => zoomEnMarco(a, a.zoom * factor, ancho, alto, opciones))
  }

  async function guardar() {
    if (ocupado) return
    setErrorLocal(null)
    setPreparando(true)
    try {
      const blob = await exportar(imagen, encuadre, opciones)
      onGuardar(new File([blob], 'imagen.jpg', { type: 'image/jpeg' }))
    } catch {
      setErrorLocal('No pudimos preparar la imagen. Inténtalo de nuevo.')
    } finally {
      setPreparando(false)
    }
  }

  /* --- Pintura -------------------------------------------------------------- */

  // Lo que coloca la imagen y dibuja el marco, como variables: inyectar
  // valores dinámicos es lo único que admite `style`.
  //
  // `escala` pasa de píxeles naturales a anchos de marco. El desplazamiento
  // se entrega en fracciones del tamaño de la PROPIA imagen (sin girar), que
  // es lo que entiende `translate` en %.
  const escala = escalaCubrir(ancho, alto, encuadre.giro, opciones.proporcion)
  const colocacion = {
    '--proporcion': opciones.proporcion,
    '--w': ancho * escala,
    '--lado-ancho': ancho,
    '--lado-alto': alto,
    '--tx': encuadre.x / (ancho * escala),
    '--ty': encuadre.y / (alto * escala),
    '--giro': `${encuadre.giro}deg`,
    '--zoom': encuadre.zoom,
  } as CSSProperties

  // La barra va en escala logarítmica: de lejos a cerca hay un factor 5–20, y
  // en lineal casi todo el recorrido serían los últimos aumentos.
  const aBarra = (zoom: number) => Math.log(zoom / minimo) / Math.log(ZOOM_MAX / minimo)
  const deBarra = (t: number) => minimo * Math.pow(ZOOM_MAX / minimo, t)
  const posicion = Math.min(1, Math.max(0, aBarra(encuadre.zoom)))

  const mensaje = errorLocal ?? error ?? null

  return (
    <div className={estilos.editor} style={colocacion}>
      {mensaje && (
        <Alert key={mensaje} tone="danger">
          {mensaje}
        </Alert>
      )}

      <div
        ref={escenario}
        className={estilos.escenario}
        data-forma={opciones.forma}
        role="group"
        aria-label="Encuadre de la imagen. Usa las flechas para moverla y + o − para acercarla."
        tabIndex={0}
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onKeyDown={alTeclear}
      >
        <div ref={marco} className={estilos.marco}>
          {/* eslint-disable-next-line @next/next/no-img-element -- object URL local, no un asset */}
          <img
            src={imagen.url}
            alt=""
            draggable={false}
            className={`${estilos.imagen} ${suave ? estilos.suave : ''}`}
          />
        </div>
        <div className={estilos.velo} aria-hidden="true" />
        <div className={estilos.filo} aria-hidden="true" />
      </div>

      <div className={estilos.controles}>
        <button
          type="button"
          className={estilos.icono}
          onClick={() => acercar(1 / 1.2)}
          disabled={encuadre.zoom <= minimo}
          aria-label="Alejar"
        >
          <ZoomOut size={18} aria-hidden="true" />
        </button>
        <input
          type="range"
          className={estilos.deslizador}
          min={0}
          max={1}
          step={0.005}
          value={posicion}
          aria-label="Acercar o alejar"
          aria-valuetext={`${Math.round(encuadre.zoom * 100)} %`}
          style={{ '--progreso': `${posicion * 100}%` } as CSSProperties}
          onChange={(e) => {
            setSuave(false)
            const zoom = deBarra(Number(e.target.value))
            setEncuadre((a) => zoomEnMarco(a, zoom, ancho, alto, opciones))
          }}
        />
        <button
          type="button"
          className={estilos.icono}
          onClick={() => acercar(1.2)}
          disabled={encuadre.zoom >= ZOOM_MAX}
          aria-label="Acercar"
        >
          <ZoomIn size={18} aria-hidden="true" />
        </button>
        <span className={estilos.separador} aria-hidden="true" />
        <button
          type="button"
          className={`${estilos.icono} ${estilos.girar}`}
          onClick={() => {
            setSuave(true)
            setEncuadre((a) => girarEnMarco(a, ancho, alto, opciones))
          }}
          aria-label="Girar a la derecha"
        >
          <RotateCw size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={estilos.icono}
          onClick={() => {
            setSuave(true)
            setEncuadre(encuadreInicialEnMarco(ancho, alto, opciones, imagen.existente))
          }}
          aria-label="Restablecer el encuadre"
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Las dos secundarias, como enlaces; la principal se lleva el resto
          de la fila y, en un teléfono, baja a la suya a todo lo ancho. */}
      <div className={estilos.acciones}>
        <button type="button" className={estilos.enlace} onClick={onElegirOtra} disabled={ocupado}>
          <ImagePlus size={16} aria-hidden="true" />
          Elegir otra
        </button>
        <button type="button" className={estilos.enlace} onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </button>
        <Button
          variant="brand"
          size="lg"
          pildora
          loading={ocupado}
          icon={<Check size={17} aria-hidden="true" />}
          onClick={guardar}
          className={estilos.principal}
        >
          {textoGuardar}
        </Button>
      </div>
    </div>
  )
}
