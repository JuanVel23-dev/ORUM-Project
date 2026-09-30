'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import Link from 'next/link'
import { Camera, Check, ImagePlus, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCerrarCuando, useCerrarOverlay } from '@/components/shell/overlay-ruta'
import { guardarMiFoto } from '@/app/miembros/(portal)/perfil/imagenes-actions'
import { ESTADO_SUBIDA_INICIAL } from '@/lib/imagenes/estado'
import { LIMITE_AVATARES } from '@/lib/imagenes/validacion'
import {
  ENCUADRE_INICIAL,
  ZOOM_MAX,
  ZOOM_MIN,
  conZoom,
  escalaBase,
  girar,
  limitarEncuadre,
  type Encuadre,
} from '@/lib/imagenes/encuadre'
import estilos from './editor-foto.module.css'

/*
  MI FOTO  ·  el editor del socio (30/09/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: rediseñar la ventana y que, al subir una foto, la
  persona pueda «modificar el tamaño, ajustar, todo lo necesario para que
  esté conforme».

  El mismo material que el carnet —negro con plata, la X dentro—, porque es
  la foto DEL carnet. Dos vistas:

    · Reposo: la foto actual en su aro de plata y «Elegir una foto» (o
      arrastrarla hasta la ventana).
    · Ajuste: la imagen bajo un círculo, con el resto atenuado. Se arrastra
      para encuadrar; se acerca con la barra, la rueda o pellizcando; se gira
      de 90 en 90. El círculo NUNCA queda con hueco (`limitarEncuadre`).

  Al guardar, el recorte se pinta en un `canvas` de 640 px y se sube como
  JPEG. Eso es lo que permite aceptar la foto de un teléfono tal cual (5 MB,
  4000 px, incluso HEIC donde el navegador la abre): lo que viaja son
  ~100 KB ya encuadrados, por debajo del límite de 512 KB del bucket. El
  servidor vuelve a validar tipo y peso: esto es comodidad, no seguridad.

  La acción NO recibe el id del miembro: lo deriva de la sesión.
*/

/** Lado del JPEG que se sube: nítido en el carnet a 96 px con pantalla 3x y de sobra. */
const LADO_SALIDA = 640
/** Tope de la imagen de ORIGEN: una foto de teléfono cabe con mucho margen. */
const MAX_ORIGEN = 25 * 1024 * 1024
/** Calidades que se prueban hasta caber en el límite del bucket. */
const CALIDADES = [0.9, 0.82, 0.74, 0.65]

type Fuente = { url: string; ancho: number; alto: number; imagen: HTMLImageElement }

type Props = {
  nombre: string
  fotoUrl: string | null
  /** A pantalla completa (enlace directo): título `h1` y la X vuelve al portal. */
  enPagina?: boolean
}

export function EditorFoto({ nombre, fotoUrl, enPagina = false }: Props) {
  const [estado, accion, enviando] = useActionState(guardarMiFoto, ESTADO_SUBIDA_INICIAL)
  const cerrar = useCerrarOverlay()
  useCerrarCuando(estado.ok)

  const [fuente, setFuente] = useState<Fuente | null>(null)
  const [encuadre, setEncuadre] = useState<Encuadre>(ENCUADRE_INICIAL)
  /** Transición suave solo para lo que salta (girar, restablecer, botones ±). */
  const [suave, setSuave] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [soltando, setSoltando] = useState(false)

  const idArchivo = useId()
  const idTitulo = useId()
  const entrada = useRef<HTMLInputElement>(null)
  const escenario = useRef<HTMLDivElement>(null)
  const circulo = useRef<HTMLDivElement>(null)
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const pellizco = useRef<{ distancia: number; zoom: number } | null>(null)

  // Un object URL retiene el archivo en memoria hasta que se revoca: el
  // anterior se suelta al cambiar de fuente y el último al desmontar.
  useEffect(() => {
    if (!fuente) return
    return () => URL.revokeObjectURL(fuente.url)
  }, [fuente])

  /*
    La rueda acerca. Va con `addEventListener` y `passive: false` porque
    React registra `onWheel` como pasivo y no deja cancelar el desplazamiento
    de la página por debajo.
  */
  useEffect(() => {
    const nodo = escenario.current
    if (!nodo || !fuente) return
    const alGirarRueda = (e: WheelEvent) => {
      e.preventDefault()
      setSuave(false)
      setEncuadre((actual) =>
        conZoom(actual, actual.zoom * Math.exp(-e.deltaY * 0.0015), fuente.ancho, fuente.alto),
      )
    }
    nodo.addEventListener('wheel', alGirarRueda, { passive: false })
    return () => nodo.removeEventListener('wheel', alGirarRueda)
  }, [fuente])

  const error = errorLocal ?? estado.error ?? null
  const ocupado = preparando || enviando

  function cargar(archivo: File | undefined) {
    setErrorLocal(null)
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setErrorLocal('Ese archivo no es una imagen. Elige una foto JPG, PNG o WebP.')
      return
    }
    if (archivo.size > MAX_ORIGEN) {
      setErrorLocal('Esa imagen pesa más de 25 MB. Elige una más liviana.')
      return
    }

    const url = URL.createObjectURL(archivo)
    const imagen = new Image()
    imagen.decoding = 'async'
    imagen.onload = () => {
      setFuente({ url, ancho: imagen.naturalWidth, alto: imagen.naturalHeight, imagen })
      setEncuadre(ENCUADRE_INICIAL)
      setSuave(false)
    }
    imagen.onerror = () => {
      URL.revokeObjectURL(url)
      setErrorLocal('No pudimos abrir esa imagen. Prueba con una foto JPG o PNG.')
    }
    imagen.src = url
  }

  function elegir() {
    entrada.current?.click()
  }

  /* --- Gestos: arrastrar con un dedo, pellizcar con dos ------------------- */

  function alApretar(e: PointerEvent<HTMLDivElement>) {
    if (!fuente) return
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
    if (!previo || !fuente) return
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (punteros.current.size >= 2 && pellizco.current) {
      const [a, b] = [...punteros.current.values()]
      const factor = Math.hypot(a.x - b.x, a.y - b.y) / pellizco.current.distancia
      const zoom = pellizco.current.zoom * factor
      setEncuadre((actual) => conZoom(actual, zoom, fuente.ancho, fuente.alto))
      return
    }

    // Seguimiento 1:1: el desplazamiento en píxeles, pasado a diámetros.
    const diametro = circulo.current?.clientWidth || 1
    const dx = (e.clientX - previo.x) / diametro
    const dy = (e.clientY - previo.y) / diametro
    setEncuadre((actual) =>
      limitarEncuadre({ ...actual, x: actual.x + dx, y: actual.y + dy }, fuente.ancho, fuente.alto),
    )
  }

  function alSoltar(e: PointerEvent<HTMLDivElement>) {
    punteros.current.delete(e.pointerId)
    if (punteros.current.size < 2) pellizco.current = null
  }

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (!fuente) return
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
      setEncuadre((a) => limitarEncuadre({ ...a, x: a.x + dx, y: a.y + dy }, fuente.ancho, fuente.alto))
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      acercar(0.25)
    } else if (e.key === '-') {
      e.preventDefault()
      acercar(-0.25)
    }
  }

  function acercar(delta: number) {
    if (!fuente) return
    setSuave(true)
    setEncuadre((a) => conZoom(a, a.zoom + delta, fuente.ancho, fuente.alto))
  }

  /* --- Guardar: el recorte, a un JPEG de 640 px --------------------------- */

  async function exportar(f: Fuente, e: Encuadre): Promise<Blob> {
    const lienzo = document.createElement('canvas')
    lienzo.width = LADO_SALIDA
    lienzo.height = LADO_SALIDA
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new Error('sin canvas')

    // Un PNG con transparencia saldría con fondo NEGRO en JPEG. Es un dato
    // del archivo, no un color de interfaz: blanco, como el papel de un carnet.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, LADO_SALIDA, LADO_SALIDA)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // La misma cuenta que el CSS del escenario, en píxeles de salida.
    const escala = escalaBase(f.ancho, f.alto) * e.zoom * LADO_SALIDA
    ctx.translate(LADO_SALIDA / 2 + e.x * LADO_SALIDA, LADO_SALIDA / 2 + e.y * LADO_SALIDA)
    ctx.rotate((e.giro * Math.PI) / 180)
    ctx.scale(escala, escala)
    ctx.drawImage(f.imagen, -f.ancho / 2, -f.alto / 2, f.ancho, f.alto)

    for (const calidad of CALIDADES) {
      const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', calidad))
      if (blob && blob.size <= LIMITE_AVATARES) return blob
    }
    throw new Error('demasiado pesada')
  }

  async function guardar() {
    if (!fuente || ocupado) return
    setErrorLocal(null)
    setPreparando(true)
    try {
      const blob = await exportar(fuente, encuadre)
      const datos = new FormData()
      datos.set('archivo', new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
      startTransition(() => accion(datos))
    } catch {
      setErrorLocal('No pudimos preparar la foto. Inténtalo de nuevo.')
    } finally {
      setPreparando(false)
    }
  }

  /* --- Soltar un archivo sobre la ventana ---------------------------------- */

  const alArrastrarEncima = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    setSoltando(true)
  }

  const alSoltarArchivo = (e: React.DragEvent) => {
    e.preventDefault()
    setSoltando(false)
    cargar(e.dataTransfer.files?.[0])
  }

  /* --- Pintura -------------------------------------------------------------- */

  const Titulo = enPagina ? 'h1' : 'h2'
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?'
  const mostrada = estado.url ?? fotoUrl

  // Las variables que coloca la imagen: tamaño en diámetros del círculo y
  // desplazamiento en fracciones de su propio tamaño (lo que entiende
  // `translate` en %). Inyectar valores dinámicos por variable es lo único
  // que admite `style`.
  let colocacion: CSSProperties | undefined
  if (fuente) {
    const base = escalaBase(fuente.ancho, fuente.alto)
    const w = fuente.ancho * base
    const h = fuente.alto * base
    colocacion = {
      '--w': w,
      '--h': h,
      '--tx': encuadre.x / w,
      '--ty': encuadre.y / h,
      '--giro': `${encuadre.giro}deg`,
      '--zoom': encuadre.zoom,
    } as CSSProperties
  }
  const progreso = ((encuadre.zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100

  return (
    <section
      className={estilos.tarjeta}
      data-theme="dark"
      data-soltando={soltando || undefined}
      aria-labelledby={idTitulo}
      onDragOver={alArrastrarEncima}
      onDragLeave={() => setSoltando(false)}
      onDrop={alSoltarArchivo}
    >
      <div className={estilos.barra}>
        <Titulo id={idTitulo} className={estilos.titulo}>
          {fuente ? 'Ajusta tu foto' : 'Mi foto'}
        </Titulo>
        {enPagina ? (
          <Link href="/miembros" className={estilos.cerrar} aria-label="Volver al portal">
            <X size={20} aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" className={estilos.cerrar} onClick={cerrar} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <p className={estilos.bajada}>
        {fuente
          ? 'Arrastra para encuadrar tu cara en el círculo y acerca con la barra.'
          : 'La que aparece en tu carnet. Que se te vea bien la cara: en la caja la comparan contigo.'}
      </p>

      {/* El selector real, oculto: lo abren la foto y los botones. `accept`
          amplio a propósito: cualquier imagen que el navegador sepa abrir se
          convierte a JPEG al guardar. */}
      <input
        ref={entrada}
        id={idArchivo}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          cargar(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {estado.ok && enPagina && <Alert tone="success">Listo: tu carnet ya tiene la foto nueva.</Alert>}

      {fuente ? (
        <div key="ajuste" className={estilos.vista}>
          <div
            ref={escenario}
            className={estilos.escenario}
            role="group"
            aria-label="Encuadre de la foto. Usa las flechas para moverla y + o − para acercarla."
            tabIndex={0}
            onPointerDown={alApretar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            onKeyDown={alTeclear}
          >
            <div ref={circulo} className={estilos.circulo}>
              {/* eslint-disable-next-line @next/next/no-img-element -- object URL local, no un asset */}
              <img
                src={fuente.url}
                alt=""
                draggable={false}
                className={`${estilos.imagen} ${suave ? estilos.suave : ''}`}
                style={colocacion}
              />
            </div>
            <div className={estilos.mascara} aria-hidden="true" />
          </div>

          <div className={estilos.controles}>
            <button
              type="button"
              className={estilos.icono}
              onClick={() => acercar(-0.25)}
              disabled={encuadre.zoom <= ZOOM_MIN}
              aria-label="Alejar"
            >
              <ZoomOut size={18} aria-hidden="true" />
            </button>
            <input
              type="range"
              className={estilos.deslizador}
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={encuadre.zoom}
              aria-label="Acercar o alejar"
              aria-valuetext={`${Math.round(encuadre.zoom * 100)} %`}
              style={{ '--progreso': `${progreso}%` } as CSSProperties}
              onChange={(e) => {
                setSuave(false)
                setEncuadre((a) => conZoom(a, Number(e.target.value), fuente.ancho, fuente.alto))
              }}
            />
            <button
              type="button"
              className={estilos.icono}
              onClick={() => acercar(0.25)}
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
                setEncuadre((a) => girar(a, fuente.ancho, fuente.alto))
              }}
              aria-label="Girar a la derecha"
            >
              <RotateCw size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={estilos.secundarias}>
            <button type="button" className={estilos.enlace} onClick={elegir}>
              <ImagePlus size={16} aria-hidden="true" />
              Elegir otra
            </button>
            <button
              type="button"
              className={estilos.enlace}
              onClick={() => {
                setSuave(true)
                setEncuadre(ENCUADRE_INICIAL)
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Restablecer
            </button>
          </div>

          <Button
            variant="primary"
            pildora
            fullWidth
            loading={ocupado}
            icon={<Check size={16} aria-hidden="true" />}
            onClick={guardar}
          >
            Guardar foto
          </Button>
        </div>
      ) : (
        <div key="reposo" className={`${estilos.vista} ${estilos.reposo}`}>
          {/* La foto también elige: es lo primero que se toca. La etiqueta no
              es un control propio; el de teclado es el botón de debajo. */}
          <label htmlFor={idArchivo} className={estilos.actual}>
            <span className={estilos.recorte}>
              {mostrada ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
                <img src={mostrada} alt="" className={estilos.actualImagen} decoding="async" />
              ) : (
                <span className={estilos.inicial} aria-hidden="true">
                  {inicial}
                </span>
              )}
              <span className={estilos.velo} aria-hidden="true">
                <Camera size={20} />
                <span>Elegir foto</span>
              </span>
            </span>
          </label>

          <Button
            variant="primary"
            pildora
            icon={<ImagePlus size={16} aria-hidden="true" />}
            onClick={elegir}
          >
            Elegir una foto
          </Button>
          <p className={estilos.ayuda}>
            <span className={estilos.soloRaton}>O arrástrala hasta aquí. </span>
            Después la ajustas antes de guardar.
          </p>
        </div>
      )}
    </section>
  )
}
