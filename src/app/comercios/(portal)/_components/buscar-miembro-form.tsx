'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Camera, Search, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { Spinner } from '@/components/ui/spinner'
import { error as vibrarError, toque } from '@/lib/shared/haptica'
import { buscarMiembro, type BuscarMiembroState } from '../actions'
import { ResultadoMiembro } from './resultado-miembro'
import { ConfirmarVentaForm } from './confirmar-venta-form'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './verificar.module.css'

type Sucursal = { id: number; nombre: string | null }
type Promocion = {
  id: number
  titulo: string
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

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

const estadoInicial: BuscarMiembroState = {}

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

export function BuscarMiembroForm({
  sucursales,
  promociones,
  onNuevaVerificacion,
}: {
  sucursales: Sucursal[]
  promociones: Promocion[]
  onNuevaVerificacion: () => void
}) {
  const [state, formAction, pending] = useActionState(buscarMiembro, estadoInicial)
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

  useEffect(() => {
    if (peticionEnvio === 0) return
    formRef.current?.requestSubmit()
  }, [peticionEnvio])

  /*
    Háptica de «no» (`haptica.ts`, regla de causalidad: en el evento que la
    causa). Se dispara en dos veredictos distintos y suena igual a propósito:
    para el cajero, «no encontrado» y «no vigente» significan lo mismo —no se
    aplica el beneficio—. El «sí» no vibra: esa señal se reserva entera para la
    venta registrada, que es el final feliz de verdad.
  */
  useEffect(() => {
    if (state.error) vibrarError()
  }, [state.error])

  useEffect(() => {
    if (state.miembro && !state.miembro.vigente) vibrarError()
  }, [state.miembro])

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
    <Stack gap={5}>
      <Card padding="lg">
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
                <Button variant="secondary" onClick={escribirNumero}>
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
              <Button
                type="button"
                size="lg"
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
                  size="lg"
                  loading={pending}
                  fullWidth
                  icon={<Search size={17} />}
                >
                  {pending ? 'Verificando…' : 'Buscar'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>

      {/*
        El veredicto es un MENSAJE DE ESTADO (WCAG 4.1.3): aparece sin que el
        foco se mueva, así que sin región en vivo un cajero con lector de
        pantalla no se entera de si la membresía vale — tendría que ir a
        buscarlo. La región se monta VACÍA desde el primer render: si naciera
        junto con el resultado, el lector no la habría registrado todavía y no
        anunciaría nada. `aria-atomic` hace que se lea el veredicto entero
        —nombre, número y estado—, no solo el trozo que cambió.
      */}
      <div aria-live="polite" aria-atomic="true">
        {state.miembro && <ResultadoMiembro miembro={state.miembro} />}
      </div>

      {/* La venta solo se ofrece si hay derecho a beneficio. Queda FUERA de la
          región en vivo: anunciar el formulario entero al abrirse sepultaría
          el veredicto, que es lo único que hay que oír. */}
      {state.miembro?.vigente && (
        <ConfirmarVentaForm
          miembroId={state.miembro.id}
          membresiaId={state.miembro.membresiaId}
          numeroMembresia={state.miembro.numeroMembresia}
          metodo={state.metodo ?? 'numero'}
          sucursales={sucursales}
          promociones={promociones}
          onExito={onNuevaVerificacion}
        />
      )}
    </Stack>
  )
}
