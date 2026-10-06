'use client'

import { useEffect, useId, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Camera, Search, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { toque } from '@/lib/shared/haptica'
import type { BuscarMiembroState } from '../actions'
import styles from './verificar.module.css'

/*
  El escáner pesa medio mega: trae su propio detector de códigos de barras
  para los navegadores que no lo llevan de serie. Cargarlo con la página
  significaría descargarlo SIEMPRE, incluso cuando el cajero teclea el número
  —que es lo que hará cuando el carnet esté rayado o la cámara sucia—.

  Con `dynamic` viaja solo al pulsar "Escanear código QR". `ssr: false` porque
  necesita `navigator.mediaDevices`, que no existe en el servidor.
*/
const EscanerQr = dynamic(() => import('./escaner-qr').then((m) => m.EscanerQr), {
  ssr: false,
  loading: () => (
    <p className={styles.cargandoEscaner}>
      <Spinner size="sm" /> Abriendo la cámara…
    </p>
  ),
})

/** Los dígitos del carnet. Ocho, sin separadores y con los ceros de delante. */
const LARGO_NUMERO = 8

const soloDigitos = (valor: string) => valor.replace(/\D+/g, '')

/**
 * Qué se ve en la tarjeta de búsqueda.
 *
 * Es UN estado y no tres banderas sueltas a propósito: las tres vistas son
 * excluyentes, y con banderas independientes existían combinaciones imposibles
 * —cámara abierta y campo enfocado a la vez— que había que impedir a mano.
 */
type Vista = 'reposo' | 'numero' | 'camara'

/**
 * La tarjeta de buscar: escanear o teclear el número.
 *
 * Solo BUSCA. El estado de la búsqueda (`useActionState`) vive en
 * `VerificacionTool`, que es quien abre la ventana del veredicto con el
 * resultado: esta tarjeta se remonta al cerrar la ventana para volver al
 * reposo, y si el estado viviera aquí se perdería con ella a mitad de la
 * animación de salida.
 */
export function BuscarMiembroForm({
  state,
  formAction,
  pending,
}: {
  state: BuscarMiembroState
  formAction: (datos: FormData) => void
  pending: boolean
}) {
  const [vista, setVista] = useState<Vista>('reposo')
  const [numero, setNumero] = useState('')
  const [metodo, setMetodo] = useState<'qr' | 'numero'>('numero')
  const [falloCamara, setFalloCamara] = useState<string | null>(null)
  /*
    `autoFocus` REAL, y solo aquí. Ponerlo al cargar la página dispara el
    teclado de Android sobre la pantalla de reposo y tapa el botón de escanear
    (audit-movil #3). Nacido de un toque explícito del cajero es justo lo
    contrario: el teclado es lo que acaba de pedir.
  */
  const [enfocarCampo, setEnfocarCampo] = useState(false)

  /*
    EL AUTO-ENVÍO, SIN CARRERA CON EL RENDER.

    Un contador y no un booleano: dos escaneos seguidos del mismo carnet tienen
    que disparar dos búsquedas, y un booleano ya puesto no vuelve a cambiar.
    Y se envía desde un efecto —no desde el manejador— porque el `FormData` se
    lee del DOM: si se enviara en el mismo evento que actualiza `numero` y
    `metodo`, viajaría el valor ANTERIOR. Es la misma trampa de siempre, aquí
    con consecuencias caras: registrar la venta como «número» cuando se escaneó.
  */
  const [peticionEnvio, setPeticionEnvio] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (peticionEnvio === 0) return
    formRef.current?.requestSubmit()
  }, [peticionEnvio])

  function escribirNumero() {
    setFalloCamara(null)
    setEnfocarCampo(true)
    setVista('numero')
  }

  function abrirCamara() {
    setFalloCamara(null)
    setEnfocarCampo(false)
    setVista('camara')
  }

  return (
    /* La tarjeta PRINCIPAL de la pantalla: por aquí empieza todo. */
      <section className={`${styles.tarjeta} ${styles.principal}`} aria-labelledby={idTitulo}>
        <header className={styles.cabeceraTarjeta}>
          <TituloSeccion id={idTitulo} como="h2" tamano="bloque" texto="Verificar membresía" />
          {/* Nombra las dos vías sin enseñar todavía ninguna: en reposo solo
              se ve el botón de escanear, y saber que existe la alternativa
              antes de necesitarla evita el «y si el carnet está rayado». */}
          <p className={styles.lede}>Escanea el carnet del socio o escribe su número.</p>
        </header>

        <form ref={formRef} action={formAction} className={styles.paso}>
          {/* `key` con el propio mensaje: si el cajero reintenta y falla con
              EXACTAMENTE el mismo error, React reutilizaría el nodo y el lector
              de pantalla no volvería a anunciarlo. Remontarlo lo re-anuncia. */}
          {state.error && (
            <Alert key={state.error} tone="danger">
              {state.error}
            </Alert>
          )}

          {falloCamara && (
            <Alert
              key={falloCamara}
              tone="warning"
              actions={
                <Button variant="secondary" pildora onClick={escribirNumero}>
                  Escribir el número
                </Button>
              }
            >
              {falloCamara}
            </Alert>
          )}

          {/* El método viaja aparte del número: es el que se guarda en la venta
              y tiene que decir cómo se leyó DE VERDAD el carnet. */}
          <input type="hidden" name="metodo" value={metodo} />

          {vista === 'reposo' && (
            <>
              {/*
                UNA SOLA DECISIÓN EN PANTALLA. El carnet lleva QR, así que
                escanear es el camino de la inmensa mayoría de las ventas: va
                solo, grande y primero. La otra vía existe siempre, pero como
                texto — dos botones grandes compitiendo obligan a elegir, y
                elegir de pie con el cliente delante cuesta segundos.
              */}
              {/* La acción del portal, en píldora dorada: el botón de la fachada. */}
              <Button
                type="button"
                variant="brand"
                size="lg"
                pildora
                fullWidth
                onClick={abrirCamara}
                icon={<Camera size={19} />}
              >
                Escanear código QR
              </Button>

              <p className={styles.salida}>
                ¿No puedes escanear?{' '}
                <button type="button" className={styles.enlaceTexto} onClick={escribirNumero}>
                  Escribe el número
                </button>
              </p>
            </>
          )}

          {vista === 'camara' && (
            <>
              <EscanerQr
                onDetectado={(valor) => {
                  /*
                    DETECTAR ES BUSCAR. El paso de «Verificar» desaparece: en
                    cuanto hay código, se busca. La vibración va en el mismo
                    fotograma que la detección para que el cajero sepa que
                    «agarró» el carnet sin tener que mirar todavía la pantalla.
                  */
                  toque()
                  setNumero(valor.trim())
                  setMetodo('qr')
                  setEnfocarCampo(false)
                  setVista('numero')
                  setPeticionEnvio((n) => n + 1)
                }}
                onFallo={(mensaje) => {
                  setFalloCamara(mensaje)
                  setVista('reposo')
                }}
                onEscribirNumero={escribirNumero}
              />

              <Button
                type="button"
                variant="secondary"
                size="lg"
                pildora
                fullWidth
                onClick={() => setVista('reposo')}
                icon={<X size={17} />}
              >
                Cerrar cámara
              </Button>
            </>
          )}

          {vista === 'numero' && (
            <>
              <Field
                label="Número de membresía"
                /*
                  WCAG 3.2.2 pide anunciar ANTES el cambio de contexto que
                  provoca un cambio de valor. El campo se busca solo al octavo
                  dígito, así que hay que decirlo antes de que ocurra, no
                  después.
                */
                help="Está bajo el código del carnet. Se busca solo al completar los 8 dígitos."
              >
                <Input
                  name="numero_membresia"
                  /* `text`, no `number`: el número lleva ceros a la izquierda y
                     `type="number"` los descarta. `inputMode` da el teclado
                     numérico en el móvil, que es donde se usa esto. */
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder="00012345"
                  maxLength={LARGO_NUMERO}
                  value={numero}
                  autoFocus={enfocarCampo}
                  onChange={(e) => {
                    const digitos = soloDigitos(e.target.value).slice(0, LARGO_NUMERO)
                    setNumero(digitos)
                    // Teclear a mano invalida un escaneo previo: el método que
                    // se registra debe ser el que de verdad se usó.
                    setMetodo('numero')
                    if (digitos.length === LARGO_NUMERO) setPeticionEnvio((n) => n + 1)
                  }}
                  required
                  // Cifras tabulares: se coteja dígito a dígito contra el carnet.
                  numeric
                />
              </Field>

              <div className={styles.acciones}>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  pildora
                  onClick={abrirCamara}
                  icon={<Camera size={17} />}
                >
                  Escanear
                </Button>

                {/*
                  El botón NO desaparece cuando el campo se envía solo. Un
                  teclado externo, un pegado desde otra aplicación o un lector
                  de pantalla necesitan la vía explícita, y WCAG 3.2.2 la exige.
                */}
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  pildora
                  loading={pending}
                  icon={<Search size={17} />}
                >
                  {pending ? 'Verificando…' : 'Buscar'}
                </Button>
              </div>
            </>
          )}
        </form>
      </section>
  )
}
