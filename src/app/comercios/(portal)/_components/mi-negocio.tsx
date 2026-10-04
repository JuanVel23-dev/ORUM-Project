'use client'

import {
  createContext,
  useContext,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { ArrowLeft, ImagePlus, Pencil, Store, Trash2, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { ConfirmDialog, Modal } from '@/components/ui/modal'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import {
  EditorEncuadre,
  useImagenElegida,
  type OpcionesEncuadre,
} from '@/components/imagenes/editor-encuadre'
import {
  TOPE_FOTOS_NEGOCIO,
  cuposLibres,
  fotosUsadas,
  type FotoNegocio,
} from '@/lib/comercios/fotos-negocio'
import { ESTADO_SUBIDA_INICIAL } from '@/lib/imagenes/estado'
import { guardarMiFotoNegocio, guardarMiLogo, quitarMiFotoNegocio } from '../imagenes-actions'
import styles from './mi-negocio.module.css'

/*
  MI NEGOCIO  ·  el comercio cambia su logotipo y sus fotos (04/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «que pueda cambiar el logo y también las
  fotografías que se verían del negocio; máximo 8; y que pueda ajustarlas,
  como la fotografía de miembros».

  UNA VENTANA ENCIMA, no una página: se abre desde la cabecera, se cambia una
  imagen y se cierra. La caja de detrás no se mueve («un formulario no
  navega»). Tiene dos vistas, que se intercambian dentro de la misma ventana:

    · LA REJILLA: el logotipo y las fotos tal como están, con «cambiar» y
      «quitar» en cada una, y el hueco para añadir mientras queden cupos.
    · EL AJUSTE: al elegir una imagen se abre el editor (`EditorEncuadre`)
      para encuadrarla antes de subirla. El logotipo, en un círculo en el que
      puede verse entero; las fotos, en 16:9, que es como salen en la ficha.

  LAS OCHO FOTOS: la primera es la PORTADA (la foto grande de la ficha y la
  del directorio) y las demás, la galería. El tope cuenta las dos
  (`lib/comercios/fotos-negocio.ts`), y el servidor lo vuelve a comprobar.

  TRES PIEZAS, y no una, por lo mismo que el carnet del socio: un `<dialog>`
  hereda las propiedades personalizadas de sus ancestros del DOM. Montada
  dentro de la cabecera negra, la ventana saldría con sus tokens oscuros; así
  que el botón vive en la cabecera, la ventana fuera, y comparten el estado
  por contexto.

    · `ProveedorNegocio` — envuelve el portal y guarda si está abierta.
    · `BotonNegocio`     — el disparador, en la cabecera.
    · `VentanaNegocio`   — el diálogo, fuera de la cabecera.

  Las acciones se llaman DIRECTAMENTE (dentro de una transición) y no con
  `useActionState`: aquí hay tres acciones y dos vistas, y lo que hace falta
  es saber cuándo terminó ESTA subida para volver a la rejilla. Al terminar,
  la acción revalida el layout y los datos nuevos llegan por las props.
*/

/* El logotipo: un círculo, y puede verse ENTERO (un logotipo apaisado no se
   puede «cubrir» sin cortarle las letras). 640 px sobran para una placa que
   se ve como mucho a 144. */
const OPCIONES_LOGO: OpcionesEncuadre = {
  proporcion: 1,
  forma: 'circulo',
  permiteContener: true,
  circular: true,
  anchoSalida: 640,
  pesoMaximo: 700 * 1024,
}

/* Las fotos: 16:9, que es la proporción de la portada en la ficha. Todas
   iguales, para que cualquiera pueda ser portada. 1600 px se ven nítidas a
   pantalla completa en el visor; 700 KB quedan por debajo del megabyte que
   admite el bucket y del que admite el cuerpo de una server action. */
const OPCIONES_FOTO: OpcionesEncuadre = {
  proporcion: 9 / 16,
  forma: 'rectangulo',
  anchoSalida: 1600,
  pesoMaximo: 700 * 1024,
}

/** Qué imagen se está cambiando. */
type Objetivo =
  | { tipo: 'logo' }
  | { tipo: 'portada' }
  /** Con `fotoId`, se sustituye esa pieza; sin él, se añade una. */
  | { tipo: 'galeria'; fotoId: number | null }

export type DatosNegocio = {
  nombre: string
  logoUrl: string | null
  portadaUrl: string | null
  galeria: FotoNegocio[]
}

/* ==========================================================================
   EL ESTADO COMPARTIDO
   ========================================================================== */

type Estado = { abierta: boolean; abrir: () => void; cerrar: () => void }

const ContextoNegocio = createContext<Estado | null>(null)

export function ProveedorNegocio({ children }: { children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)
  const estado: Estado = {
    abierta,
    abrir: () => setAbierta(true),
    cerrar: () => setAbierta(false),
  }
  return <ContextoNegocio.Provider value={estado}>{children}</ContextoNegocio.Provider>
}

function useNegocio(): Estado {
  const estado = useContext(ContextoNegocio)
  if (!estado) throw new Error('BotonNegocio y VentanaNegocio van dentro de ProveedorNegocio')
  return estado
}

/** El disparador, en la cabecera. En un teléfono estrecho queda solo el icono. */
export function BotonNegocio({ claseTexto }: { claseTexto?: string }) {
  const { abrir } = useNegocio()

  return (
    <Button
      variant="secondary"
      size="sm"
      pildora
      icon={<Store size={15} aria-hidden="true" />}
      onClick={abrir}
      aria-haspopup="dialog"
      aria-label="Mi negocio: logotipo y fotos"
    >
      <span className={claseTexto}>Mi negocio</span>
    </Button>
  )
}

/* ==========================================================================
   LA VENTANA
   ========================================================================== */

/* El foco inicial, en la X: la ventana desplaza por dentro, Chrome hace
   enfocables los contenedores con desplazamiento, y `showModal()` le daría el
   foco a la tarjeta entera. El atributo `autofocus` le dice a quién dárselo
   (la prop `autoFocus` de React no sirve: enfoca al montar, con el diálogo
   todavía cerrado). */
const enfocarAlAbrir = (nodo: HTMLButtonElement | null) => {
  nodo?.setAttribute('autofocus', '')
}

export function VentanaNegocio({ datos }: { datos: DatosNegocio }) {
  const { abierta, cerrar } = useNegocio()
  const { nombre, logoUrl, portadaUrl, galeria } = datos

  const { imagen, abriendo, error: errorImagen, elegir, soltar } = useImagenElegida()
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null)
  const [porQuitar, setPorQuitar] = useState<Objetivo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, enTransicion] = useTransition()
  const entrada = useRef<HTMLInputElement>(null)

  const usadas = fotosUsadas(portadaUrl, galeria.length)
  const cupos = cuposLibres(portadaUrl, galeria.length)
  const ajustando = imagen !== null && objetivo !== null
  const esLogo = objetivo?.tipo === 'logo'

  /** Abre el selector de archivos para ESA imagen. */
  function pedir(nuevo: Objetivo) {
    setError(null)
    setObjetivo(nuevo)
    entrada.current?.click()
  }

  /** Vuelve a la rejilla sin guardar. */
  function dejarDeAjustar() {
    soltar()
    setObjetivo(null)
    setError(null)
  }

  function cerrarVentana() {
    // Con una subida en curso no se cierra: la respuesta llegaría a una
    // ventana que ya no está, y no se sabría si la imagen quedó guardada.
    if (ocupado) return
    dejarDeAjustar()
    cerrar()
  }

  /** Sube la imagen ya encuadrada a donde diga el objetivo. */
  function subir(archivo: File) {
    if (!objetivo) return
    const destino = objetivo
    const datosForm = new FormData()
    datosForm.set('archivo', archivo)
    if (destino.tipo !== 'logo') {
      datosForm.set('destino', destino.tipo)
      if (destino.tipo === 'galeria' && destino.fotoId !== null) {
        datosForm.set('foto_id', String(destino.fotoId))
      }
    }

    setError(null)
    enTransicion(async () => {
      const resultado =
        destino.tipo === 'logo'
          ? await guardarMiLogo(ESTADO_SUBIDA_INICIAL, datosForm)
          : await guardarMiFotoNegocio(ESTADO_SUBIDA_INICIAL, datosForm)

      if (resultado.ok) {
        // De vuelta a la rejilla: la acción ya revalidó, y la imagen nueva
        // llega por las props.
        soltar()
        setObjetivo(null)
      } else {
        setError(resultado.error ?? 'No se pudo guardar la imagen. Inténtalo de nuevo.')
      }
    })
  }

  function quitar() {
    const destino = porQuitar
    if (!destino || destino.tipo === 'logo') return
    const datosForm = new FormData()
    datosForm.set('destino', destino.tipo)
    if (destino.tipo === 'galeria' && destino.fotoId !== null) {
      datosForm.set('foto_id', String(destino.fotoId))
    }

    setError(null)
    enTransicion(async () => {
      const resultado = await quitarMiFotoNegocio(ESTADO_SUBIDA_INICIAL, datosForm)
      setPorQuitar(null)
      if (!resultado.ok) {
        setError(resultado.error ?? 'No se pudo quitar la foto. Inténtalo de nuevo.')
      }
    })
  }

  const titulo = !ajustando ? 'Mi negocio' : esLogo ? 'Ajusta tu logotipo' : 'Ajusta tu foto'

  return (
    <Modal
      open={abierta}
      onClose={cerrarVentana}
      ariaLabel={titulo}
      width="720px"
      desnudo
      /* Con una imagen a medio encuadrar, un toque en el velo no la pierde. */
      cerrarAlPulsarFuera={!ajustando}
    >
      <article className={styles.ventana}>
        <header className={styles.cabeza}>
          {ajustando && (
            <button
              type="button"
              className={styles.volver}
              onClick={dejarDeAjustar}
              disabled={ocupado}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver
            </button>
          )}
          <TituloSeccion como="h2" tamano="bloque" texto={titulo} className={styles.titulo} />
          <button
            ref={enfocarAlAbrir}
            type="button"
            className={styles.cerrar}
            onClick={cerrarVentana}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {/* El selector real, oculto: lo abren los botones de cada imagen.
            `accept` amplio a propósito: cualquier imagen que el navegador sepa
            abrir se convierte a JPEG al guardar. */}
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            elegir(e.target.files?.[0])
            // Elegir dos veces el mismo archivo tiene que volver a disparar.
            e.target.value = ''
          }}
        />

        {ajustando ? (
          /* ── EL AJUSTE ──────────────────────────────────────────────── */
          <div key="ajuste" className={styles.cuerpo}>
            <p className={styles.bajada}>
              {esLogo
                ? 'Arrastra para centrarlo y aléjalo hasta que se vea entero. Así saldrá en el círculo.'
                : 'Arrastra para encuadrar y acerca con la barra. Así se verá en tu ficha.'}
            </p>

            {/* `key` con la imagen: «Elegir otra» arranca el encuadre de cero. */}
            <EditorEncuadre
              key={imagen.url}
              imagen={imagen}
              opciones={esLogo ? OPCIONES_LOGO : OPCIONES_FOTO}
              textoGuardar={esLogo ? 'Guardar logotipo' : 'Guardar foto'}
              guardando={ocupado}
              error={error ?? errorImagen}
              onGuardar={subir}
              onElegirOtra={() => entrada.current?.click()}
            />
          </div>
        ) : (
          /* ── LA REJILLA ─────────────────────────────────────────────── */
          <div key="rejilla" className={styles.cuerpo}>
            <p className={styles.bajada}>
              Así se ve tu comercio en ORUM, en el directorio y en tu ficha. Cada imagen se ajusta
              antes de guardarla, y el cambio se publica al momento.
            </p>

            {(error ?? errorImagen) && (
              <Alert key={error ?? errorImagen} tone="danger">
                {error ?? errorImagen}
              </Alert>
            )}

            {/* ── El logotipo ── */}
            <section className={styles.bloque} aria-labelledby="negocio-logo">
              <h3 id="negocio-logo" className={styles.subtitulo}>
                Logotipo
              </h3>
              <div className={styles.filaLogo}>
                <ComercioLogo logoUrl={logoUrl} nombre={nombre} className={styles.logo} />
                <div className={styles.logoTextos}>
                  <p className={styles.nota}>
                    Se ve dentro de un círculo. Una imagen cuadrada es la que mejor queda.
                  </p>
                  <Button
                    variant="secondary"
                    pildora
                    loading={abriendo && esLogo}
                    disabled={ocupado}
                    icon={<Pencil size={15} aria-hidden="true" />}
                    onClick={() => pedir({ tipo: 'logo' })}
                  >
                    {logoUrl ? 'Cambiar logotipo' : 'Añadir logotipo'}
                  </Button>
                </div>
              </div>
            </section>

            {/* ── Las fotos ── */}
            <section className={styles.bloque} aria-labelledby="negocio-fotos">
              <div className={styles.filaTitulo}>
                <h3 id="negocio-fotos" className={styles.subtitulo}>
                  Fotos
                </h3>
                {/* El recuento, en texto: el tope no se adivina por los huecos. */}
                <p className={styles.recuento}>
                  {usadas} de {TOPE_FOTOS_NEGOCIO}
                </p>
              </div>

              <ul className={styles.rejilla}>
                {/* La portada: siempre la primera, esté o no. */}
                <li>
                  {portadaUrl ? (
                    <Teja
                      url={portadaUrl}
                      nombre="la portada"
                      insignia="Portada"
                      bloqueada={ocupado}
                      onCambiar={() => pedir({ tipo: 'portada' })}
                      onQuitar={() => setPorQuitar({ tipo: 'portada' })}
                    />
                  ) : (
                    <Hueco
                      texto="Añadir portada"
                      deshabilitado={ocupado || cupos === 0}
                      onClick={() => pedir({ tipo: 'portada' })}
                    />
                  )}
                </li>

                {galeria.map((foto, i) => (
                  <li key={foto.id}>
                    <Teja
                      url={foto.url}
                      nombre={`la foto ${i + 2}`}
                      bloqueada={ocupado}
                      onCambiar={() => pedir({ tipo: 'galeria', fotoId: foto.id })}
                      onQuitar={() => setPorQuitar({ tipo: 'galeria', fotoId: foto.id })}
                    />
                  </li>
                ))}

                {/* Un solo hueco para añadir, mientras queden cupos. Si la
                    portada está vacía, el cupo se ofrece primero a ella. */}
                {cupos > (portadaUrl ? 0 : 1) && (
                  <li>
                    <Hueco
                      texto="Añadir foto"
                      deshabilitado={ocupado}
                      onClick={() => pedir({ tipo: 'galeria', fotoId: null })}
                    />
                  </li>
                )}
              </ul>

              <p className={styles.nota}>
                La primera es la portada: la foto grande de tu ficha y la que sale en el directorio.
                {cupos === 0 && ` Ya tienes las ${TOPE_FOTOS_NEGOCIO}: quita una para añadir otra.`}
              </p>
            </section>
          </div>
        )}
      </article>

      {/* Quitar borra el archivo: no se puede deshacer, así que se confirma. */}
      <ConfirmDialog
        open={porQuitar !== null}
        onClose={() => setPorQuitar(null)}
        onConfirm={quitar}
        title={porQuitar?.tipo === 'portada' ? '¿Quitar la portada?' : '¿Quitar esta foto?'}
        description="Dejará de verse en tu ficha y en el directorio. No se puede deshacer, pero puedes subir otra cuando quieras."
        confirmLabel="Quitar"
        destructive
        loading={ocupado}
      />
    </Modal>
  )
}

/* ==========================================================================
   LAS PIEZAS DE LA REJILLA
   ========================================================================== */

/** Una foto ya subida, con sus dos acciones. */
function Teja({
  url,
  nombre,
  insignia,
  bloqueada,
  onCambiar,
  onQuitar,
}: {
  url: string
  /** Cómo se nombra en las acciones: «la portada», «la foto 3». */
  nombre: string
  insignia?: string
  bloqueada: boolean
  onCambiar: () => void
  onQuitar: () => void
}) {
  return (
    <div className={styles.teja}>
      {/* Decorativa: lo que es lo dicen la insignia y los nombres de los
          botones. `<img>` y no `next/image`: la URL es de Storage o externa. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local */}
      <img src={url} alt="" className={styles.tejaFoto} loading="lazy" decoding="async" />
      {insignia && <span className={styles.insignia}>{insignia}</span>}
      <div className={styles.tejaAcciones}>
        <button
          type="button"
          className={styles.tejaBoton}
          onClick={onCambiar}
          disabled={bloqueada}
          aria-label={`Cambiar ${nombre}`}
        >
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.tejaBoton}
          onClick={onQuitar}
          disabled={bloqueada}
          aria-label={`Quitar ${nombre}`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** El hueco para añadir una foto. */
function Hueco({
  texto,
  deshabilitado,
  onClick,
}: {
  texto: string
  deshabilitado: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={styles.hueco} onClick={onClick} disabled={deshabilitado}>
      <ImagePlus size={20} aria-hidden="true" />
      {texto}
    </button>
  )
}
