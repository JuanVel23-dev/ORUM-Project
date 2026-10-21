'use client'

import { useActionState, useEffect, useRef, useState, type DragEvent } from 'react'
import { Crop, ImagePlus, Megaphone, RefreshCw, Save, Trash2, Undo2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/toggle'
import { ResumenErrores, useValidacion } from '@/components/ui/validacion'
import {
  EditorEncuadre,
  useImagenElegida,
  type OpcionesEncuadre,
} from '@/components/imagenes/editor-encuadre'
import { largo, obligatorio } from '@/lib/validacion/reglas'
import { useCerrarCuando, useCerrarOverlay } from '@/components/shell/overlay-ruta'
import { crearAnuncio, editarAnuncio, type AnuncioState } from '../actions'
import formStyles from '@/styles/formulario.module.css'
import styles from './anuncio-form.module.css'

export type AnuncioInicial = {
  id: number
  titulo: string
  cuerpo: string
  imagenUrl: string | null
  mostrarPublico: boolean
  mostrarMiembros: boolean
}

const estadoInicial: AnuncioState = {}

const TITULO_MAXIMO = 120
const CUERPO_MAXIMO = 600

const REGLAS = {
  titulo: [obligatorio('Escribe el título de la novedad.'), largo(4, TITULO_MAXIMO, 'El título')],
  cuerpo: [obligatorio('Escribe el texto de la novedad.'), largo(10, CUERPO_MAXIMO, 'El texto')],
}

const ETIQUETAS: Record<string, string> = { titulo: 'Título', cuerpo: 'Texto' }

/* 16:9, la proporción con la que se ve en la portada y en `/novedades`. Las
   mismas opciones que las fotos de un comercio. */
const OPCIONES_IMAGEN: OpcionesEncuadre = {
  proporcion: 9 / 16,
  forma: 'rectangulo',
  anchoSalida: 1600,
  pesoMaximo: 700 * 1024,
}

/** La imagen que quedará al guardar. */
type Imagen =
  | { tipo: 'actual'; url: string }
  | { tipo: 'nueva'; archivo: File; url: string }
  | { tipo: 'ninguna' }

/*
  LA NOVEDAD, EN UNA SOLA VENTANA (21/10/2026: «editar novedad está feo y
  complicado, y no me permite borrar la imagen»). Antes eran dos formularios
  —los textos con su «Guardar» y, debajo, la imagen con su «Subir imagen»—, y
  la imagen no se podía quitar. Ahora:

    · LA IMAGEN, ARRIBA, como se verá (16:9). Vacía, es un recuadro donde se
      suelta un archivo o se elige. Con imagen: «Ajustar», «Cambiar» y
      «Quitar». Elegir o ajustar abre el editor de encuadre de siempre
      (`EditorEncuadre`) como un PASO de esta misma ventana: «Cancelar» y
      Escape vuelven al formulario sin perder lo escrito.
    · Los textos con su recuento, y dónde se muestra con dos interruptores.
    · UN SOLO «Guardar», que lleva todo: textos, imagen nueva (ya encuadrada
      en el navegador) u orden de quitar la que había. Nada se sube ni se
      borra hasta guardar; «Quitar» se puede deshacer antes.
*/
export function AnuncioForm({ anuncio }: { anuncio?: AnuncioInicial }) {
  const editando = Boolean(anuncio)
  const [state, formAction, pending] = useActionState(
    editando ? editarAnuncio : crearAnuncio,
    estadoInicial,
  )
  const cerrar = useCerrarOverlay()
  useCerrarCuando(state.ok)
  const v = useValidacion(REGLAS)

  const inicial: Imagen = anuncio?.imagenUrl ? { tipo: 'actual', url: anuncio.imagenUrl } : { tipo: 'ninguna' }
  const [imagen, setImagen] = useState<Imagen>(inicial)
  const quitada = inicial.tipo === 'actual' && imagen.tipo === 'ninguna'

  const editor = useImagenElegida()
  const selector = useRef<HTMLInputElement>(null)
  const adjunto = useRef<HTMLInputElement>(null)
  const [encima, setEncima] = useState(false)
  const [largoTitulo, setLargoTitulo] = useState((anuncio?.titulo ?? '').length)
  const [largoCuerpo, setLargoCuerpo] = useState((anuncio?.cuerpo ?? '').length)

  const ajustando = editor.imagen !== null

  // La vista previa de una imagen nueva vive en memoria: se suelta al cambiarla.
  useEffect(() => {
    if (imagen.tipo !== 'nueva') return
    return () => URL.revokeObjectURL(imagen.url)
  }, [imagen])

  /*
    El archivo encuadrado viaja en un campo de archivo OCULTO del propio
    formulario (se le asigna con `DataTransfer`): así el envío sigue siendo el
    del `<form>`, con su `FormData`, y la acción del servidor lo recibe como
    cualquier subida.
  */
  useEffect(() => {
    const campo = adjunto.current
    if (!campo) return
    const datos = new DataTransfer()
    if (imagen.tipo === 'nueva') datos.items.add(imagen.archivo)
    campo.files = datos.files
  }, [imagen])

  // Escape en el editor vuelve al formulario en vez de cerrar la ventana.
  useEffect(() => {
    if (!ajustando) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      editor.soltar()
    }
    window.addEventListener('keydown', alPulsar, true)
    return () => window.removeEventListener('keydown', alPulsar, true)
  }, [ajustando, editor])

  function elegirArchivo() {
    selector.current?.click()
  }

  /** Abre en el editor la imagen que se ve ahora (la publicada o la recién elegida). */
  function ajustar() {
    if (imagen.tipo !== 'ninguna') void editor.abrirActual(imagen.url)
  }

  function usar(archivo: File) {
    setImagen({ tipo: 'nueva', archivo, url: URL.createObjectURL(archivo) })
    editor.soltar()
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault()
    setEncima(false)
    const archivo = e.dataTransfer.files?.[0]
    if (archivo) editor.elegir(archivo)
  }

  const urlVista = imagen.tipo === 'ninguna' ? null : imagen.url

  return (
    <>
      {/* El selector real, oculto: lo abren el recuadro, «Cambiar» y «Elegir otra». */}
      <input
        ref={selector}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          editor.elegir(e.target.files?.[0])
          // Elegir dos veces el mismo archivo tiene que volver a disparar.
          e.target.value = ''
        }}
      />

      {ajustando && editor.imagen && (
        <div className={styles.paso}>
          <p className={styles.pasoTitulo}>Ajusta la imagen</p>
          <p className={styles.pasoAyuda}>
            Así se verá en la portada y en Novedades. Arrástrala y acércala hasta que quede como quieres.
          </p>
          {/* `key` con la imagen: «Elegir otra» arranca el encuadre de cero. */}
          <EditorEncuadre
            key={editor.imagen.url}
            imagen={editor.imagen}
            opciones={OPCIONES_IMAGEN}
            textoGuardar="Usar esta imagen"
            guardando={false}
            error={editor.error}
            onGuardar={usar}
            onElegirOtra={elegirArchivo}
            onCancelar={editor.soltar}
          />
        </div>
      )}

      <form
        action={formAction}
        className={[formStyles.formulario, styles.formulario].join(' ')}
        hidden={ajustando}
        {...v.propsFormulario}
      >
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <ResumenErrores errores={v.errores} etiquetas={ETIQUETAS} ir={v.ir} />

        {anuncio && <input type="hidden" name="id" value={anuncio.id} />}
        <input ref={adjunto} type="file" name="archivo" hidden />
        {quitada && <input type="hidden" name="quitar_imagen" value="1" />}

        {/* ── LA IMAGEN ─────────────────────────────────────────────────── */}
        <section className={styles.bloqueImagen} aria-labelledby="titulo-imagen-novedad">
          <div className={styles.cabezaImagen}>
            <span id="titulo-imagen-novedad" className={styles.etiqueta}>
              Imagen
              <span className={styles.opcional}>opcional</span>
            </span>
            {quitada && (
              <span className={styles.avisoQuitada} role="status">
                Se quitará al guardar
                <button type="button" className={styles.deshacer} onClick={() => setImagen(inicial)}>
                  <Undo2 size={14} aria-hidden="true" />
                  Deshacer
                </button>
              </span>
            )}
          </div>

          {urlVista ? (
            <figure className={styles.vista}>
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local o URL de Storage */}
              <img src={urlVista} alt="" className={styles.vistaImagen} />
              <figcaption className={styles.vistaAcciones}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Crop size={15} />}
                  onClick={ajustar}
                  loading={editor.abriendo}
                >
                  Ajustar
                </Button>
                <Button type="button" variant="secondary" size="sm" icon={<RefreshCw size={15} />} onClick={elegirArchivo}>
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Trash2 size={15} />}
                  onClick={() => setImagen({ tipo: 'ninguna' })}
                >
                  Quitar
                </Button>
              </figcaption>
            </figure>
          ) : (
            <button
              type="button"
              className={styles.soltar}
              data-encima={encima || undefined}
              onClick={elegirArchivo}
              onDragOver={(e) => {
                e.preventDefault()
                setEncima(true)
              }}
              onDragLeave={() => setEncima(false)}
              onDrop={alSoltar}
            >
              <span className={styles.soltarIcono} aria-hidden="true">
                <ImagePlus size={22} />
              </span>
              <span className={styles.soltarTitulo}>Añade una imagen</span>
              <span className={styles.soltarAyuda}>
                Arrástrala aquí o elige un archivo. Luego la ajustas al formato de la portada.
              </span>
            </button>
          )}
          {editor.error && !ajustando && (
            <p className={styles.errorImagen} role="alert">
              {editor.error}
            </p>
          )}
        </section>

        {/* ── LOS TEXTOS ────────────────────────────────────────────────── */}
        <Field
          label="Título"
          help={`Lo primero que se lee. ${largoTitulo} / ${TITULO_MAXIMO}`}
          error={v.error('titulo')}
        >
          <Input
            name="titulo"
            defaultValue={anuncio?.titulo}
            maxLength={TITULO_MAXIMO}
            required
            autoFocus={!editando}
            placeholder="Ej.: Llega el 2x1 de los martes"
            onChange={(e) => setLargoTitulo(e.target.value.length)}
          />
        </Field>

        <Field label="Texto" help={`${largoCuerpo} / ${CUERPO_MAXIMO}`} error={v.error('cuerpo')}>
          <Textarea
            name="cuerpo"
            defaultValue={anuncio?.cuerpo}
            maxLength={CUERPO_MAXIMO}
            rows={5}
            required
            placeholder="Cuéntalo como se lo contarías a un socio."
            onChange={(e) => setLargoCuerpo(e.target.value.length)}
          />
        </Field>

        {/* ── DÓNDE SE MUESTRA ──────────────────────────────────────────── */}
        <fieldset className={styles.grupo}>
          <legend className={styles.etiqueta}>Dónde se muestra</legend>
          <div className={styles.portales}>
            <Switch
              name="mostrar_publico"
              value="true"
              label="Portal público"
              description="La ve cualquier visitante."
              defaultChecked={anuncio ? anuncio.mostrarPublico : true}
            />
            <Switch
              name="mostrar_miembros"
              value="true"
              label="Portal de miembros"
              description="La ven los socios."
              defaultChecked={anuncio ? anuncio.mostrarMiembros : true}
            />
          </div>
        </fieldset>

        <div className={formStyles.acciones}>
          <Button
            type="submit"
            loading={pending}
            icon={editando ? <Save size={16} /> : <Megaphone size={16} />}
          >
            {editando ? 'Guardar cambios' : 'Publicar novedad'}
          </Button>
          <Button type="button" variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
