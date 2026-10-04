'use client'

import { useId, useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { formatearBeneficio, formatearBeneficioCorto } from '@/lib/comercios/beneficios-formato'
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
import type { RegistrarVentaState } from '../actions'
import type { MetodoRegistroVenta, TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './verificar.module.css'

type Sucursal = { id: number; nombre: string | null }
type Promocion = {
  id: number
  titulo: string
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Separador de miles para lo que se está tecleando: `45000` → `45.000`. */
const MILES = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/*
  Los montos viajan como cadena de dígitos y el servidor los lee con `Number()`.
  Cualquier separador o signo que se cuele daría `NaN` y la venta se rechazaría
  con un error que el cajero no sabría corregir, así que se filtra al teclear.
*/
const soloDigitos = (valor: string) => valor.replace(/\D+/g, '')

/** Tope de nueve dígitos: mil millones de pesos en una compra es un dedo pegado. */
const MAX_DIGITOS = 9

/**
 * Hasta cuántas promociones se enseñan como opciones de un toque. Con más, la
 * lista empujaría el total fuera de la ventana: se vuelve al desplegable.
 */
const MAX_OPCIONES = 6

const enPesos = (digitos: string) => (digitos === '' ? '' : MILES.format(Number(digitos)))

/*
  EL FORMULARIO DE VENTA  ·  dentro de la ventana del veredicto (04/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «mejora el diseño del formulario». Tres cambios, y
  los tres salen de cómo se usa esto: de pie, con una mano y el cliente
  delante.

    1. LA PROMOCIÓN SE ELIGE DE UN TOQUE. Era un desplegable: abrir, buscar,
       elegir. Ahora cada promoción vigente es una opción a la vista, con su
       cifra («10%», «2x1») en grande. Es un grupo de radios de verdad: se
       recorre con las flechas y viaja en el envío sin JavaScript de por medio.
    2. EL DESCUENTO YA NO SE DISFRAZA DE CAMPO. Había un recuadro punteado con
       forma de campo que no se podía tocar. Lo que calcula la promoción es un
       RENGLÓN del recibo, no un control.
    3. EL PIE ES UN RECIBO: compra, descuento y total a cobrar, con el total
       en el serif de display. Es el número que se dice en voz alta.

  El estado de la venta (`state`, `formAction`, `pending`) lo pone la ventana:
  al registrarse, ella cambia entera al acuse y este formulario se desmonta.
*/
export function ConfirmarVentaForm({
  miembroId,
  membresiaId,
  numeroMembresia,
  metodo,
  sucursales,
  promociones,
  state,
  formAction,
  pending,
}: {
  miembroId: number
  membresiaId: number | null
  numeroMembresia: string
  metodo: MetodoRegistroVenta
  sucursales: Sucursal[]
  promociones: Promocion[]
  state: RegistrarVentaState
  formAction: (datos: FormData) => void
  pending: boolean
}) {
  const idTitulo = useId()
  const [promocionId, setPromocionId] = useState('')
  /*
    Vacíos, no `'0'`. Un cero de partida obliga a borrarlo antes de teclear —y
    si no se borra, el importe sale multiplicado por diez—. Lo que se ve cuando
    no hay nada escrito es el marcador de posición.
  */
  const [valorCompra, setValorCompra] = useState('')
  const [descuentoManual, setDescuentoManual] = useState('')

  const promocionSeleccionada = promociones.find((p) => String(p.id) === promocionId) ?? null

  // Porcentaje y monto fijo se calculan solos; 2x1 y regalo los tasa el cajero.
  const calculoAutomatico =
    promocionSeleccionada?.tipoCodigo === 'porcentaje' ||
    promocionSeleccionada?.tipoCodigo === 'monto_fijo'
  const descuentoAMano = promocionSeleccionada !== null && !calculoAutomatico

  const valorDescuento = useMemo(() => {
    if (!promocionSeleccionada) return 0
    if (calculoAutomatico) {
      return calcularDescuento(
        promocionSeleccionada.tipoCodigo as 'porcentaje' | 'monto_fijo',
        promocionSeleccionada.valor ?? 0,
        Number(valorCompra) || 0,
      )
    }
    return Number(descuentoManual) || 0
  }, [promocionSeleccionada, calculoAutomatico, valorCompra, descuentoManual])

  const compra = Number(valorCompra) || 0
  const valorFinal = calcularValorFinal(compra, valorDescuento)
  const hayImporte = compra > 0

  const haySelectorSucursal = sucursales.length > 1
  const promocionesComoOpciones = promociones.length > 0 && promociones.length <= MAX_OPCIONES

  return (
    <form action={formAction} className={styles.formularioVenta} aria-labelledby={idTitulo}>
      <input type="hidden" name="miembro_id" value={miembroId} />
      <input type="hidden" name="membresia_id" value={membresiaId ?? ''} />
      <input type="hidden" name="numero_membresia" value={numeroMembresia} />
      <input type="hidden" name="metodo_registro" value={metodo} />
      {/* Lo que viaja es SIEMPRE este: la cifra tecleada en los tipos que tasa
          el cajero, o la que calcula la promoción. El servidor la recalcula
          de todos modos y no confía en ella. */}
      <input type="hidden" name="valor_descuento" value={valorDescuento} />
      {/* Con una sola sucursal no hay nada que elegir: se manda oculta. */}
      {!haySelectorSucursal && (
        <input type="hidden" name="sucursal_id" value={sucursales[0]?.id ?? ''} />
      )}

      <TituloSeccion id={idTitulo} como="h2" tamano="bloque" texto="Registrar venta" />

      {/* `key` con el propio mensaje: sin él, dos fallos idénticos seguidos no
          se vuelven a anunciar al lector de pantalla. */}
      {state.error && (
        <Alert key={state.error} tone="danger">
          {state.error}
        </Alert>
      )}

      {/*
        EL IMPORTE VA PRIMERO. Es el único dato que el cajero tiene que teclear
        y el que decide el total; la promoción y la sucursal son elecciones de
        lista. `styles.importe` va en el ENVOLTORIO, no en el `Input`: ver el
        porqué de la especificidad en `verificar.module.css`.
      */}
      <div className={styles.importe}>
        <Field label="Valor de la compra">
          <Input
            /*
              El campo VISIBLE no se envía: lleva los puntos de millar para que
              el cajero vea de un vistazo si se le fue un cero. Lo que viaja son
              los dígitos limpios del `hidden` de abajo —el servidor los parsea
              con `Number()` y cualquier separador daría `NaN`—.

              `text` con `inputMode="numeric"`, no `type="number"`: en Android
              el teclado de `number` trae `+`, `-` y coma —ninguno vale aquí,
              son pesos enteros— y los spinners nativos son un blanco de toque
              parásito para quien maneja el móvil de pie y con una mano.

              `enterKeyHint="done"`: con el teclado abierto, el total y el botón
              quedan debajo; la propia tecla de retorno lo cierra.
            */
            type="text"
            inputMode="numeric"
            pattern="[0-9.]*"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="0"
            numeric
            value={enPesos(valorCompra)}
            onChange={(e) => setValorCompra(soloDigitos(e.target.value).slice(0, MAX_DIGITOS))}
            required
          />
        </Field>
        <input type="hidden" name="valor_compra" value={valorCompra || '0'} />
      </div>

      {/* ── LA PROMOCIÓN ─────────────────────────────────────────────────── */}
      {promocionesComoOpciones ? (
        <fieldset className={styles.opciones}>
          <legend className={styles.leyenda}>Promoción</legend>

          <label className={`${styles.opcion} ${styles.opcionSin}`}>
            <input
              type="radio"
              name="promocion_id"
              value=""
              className="sr-only"
              checked={promocionId === ''}
              onChange={() => setPromocionId('')}
            />
            <span className={styles.opcionTitulo}>Sin promoción</span>
            <span className={styles.opcionRadio} aria-hidden="true" />
          </label>

          {promociones.map((p) => (
            <label key={p.id} className={styles.opcion}>
              <input
                type="radio"
                name="promocion_id"
                value={p.id}
                className="sr-only"
                checked={promocionId === String(p.id)}
                onChange={() => setPromocionId(String(p.id))}
              />
              {/* La cifra corta del directorio («10%», «2x1»): el título de
                  al lado dice el resto. */}
              <span className={styles.opcionValor}>
                {formatearBeneficioCorto(p.tipoCodigo, p.valor)}
              </span>
              <span className={styles.opcionTitulo}>{p.titulo}</span>
              <span className={styles.opcionRadio} aria-hidden="true" />
            </label>
          ))}
        </fieldset>
      ) : promociones.length > 0 ? (
        /* Muchas promociones: el desplegable de siempre, que no empuja el
           total fuera de la ventana. */
        <Field label="Promoción">
          <Select
            name="promocion_id"
            value={promocionId}
            onChange={(e) => setPromocionId(e.target.value)}
          >
            <option value="">Sin promoción</option>
            {promociones.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} — {formatearBeneficio(p.tipoCodigo, p.valor)}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        /* Sin promociones vigentes no hay nada que elegir. */
        <input type="hidden" name="promocion_id" value="" />
      )}

      {/* 2x1 y regalo no se pueden calcular: los tasa el cajero. */}
      {descuentoAMano && (
        <Field label="Descuento" help="Escribe cuánto se descontó con esta promoción.">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9.]*"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="0"
            numeric
            value={enPesos(descuentoManual)}
            onChange={(e) => setDescuentoManual(soloDigitos(e.target.value).slice(0, MAX_DIGITOS))}
          />
        </Field>
      )}

      {haySelectorSucursal && (
        <Field label="Sucursal">
          <Select name="sucursal_id" required defaultValue="">
            <option value="" disabled>
              Selecciona una sucursal
            </option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre ?? `Sucursal ${s.id}`}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/*
        EL PIE, PEGADO ABAJO: el total y el botón de cobrar se quedan a la
        vista aunque la lista de promociones sea larga o la ventana baja. Los
        campos desplazan entre el veredicto (arriba) y esto (abajo).

        EL RECIBO. La compra y el descuento solo aparecen cuando hay descuento:
        sin él, repetir el importe dos veces no informa de nada. `<output>` se
        anuncia solo al cambiar el total.
      */}
      <div className={styles.pieVenta}>
      <dl className={styles.resumen}>
        {valorDescuento > 0 && (
          <>
            <div className={styles.resumenFila}>
              <dt>Compra</dt>
              <dd>{PESOS.format(compra)}</dd>
            </div>
            <div className={`${styles.resumenFila} ${styles.resumenDescuento}`}>
              <dt>
                Descuento
                {promocionSeleccionada &&
                  ` · ${formatearBeneficioCorto(promocionSeleccionada.tipoCodigo, promocionSeleccionada.valor)}`}
              </dt>
              <dd>−{PESOS.format(valorDescuento)}</dd>
            </div>
          </>
        )}
        <div className={styles.resumenTotal}>
          <dt>Total a cobrar</dt>
          <dd>
            <output>{PESOS.format(valorFinal)}</output>
          </dd>
        </div>
      </dl>

      {/*
        EL BOTÓN DICE EL NÚMERO. Es la última lectura del importe antes de algo
        que no se puede deshacer, y es gratis: el cajero ya está mirando el
        botón que va a tocar. Con el importe en cero se queda en «Registrar
        venta» — repetir «Cobrar $0» no informa de nada.
      */}
      <Button
        type="submit"
        variant="brand"
        size="lg"
        pildora
        fullWidth
        loading={pending}
        icon={<Receipt size={17} />}
      >
        {hayImporte ? `Cobrar ${PESOS.format(valorFinal)}` : 'Registrar venta'}
      </Button>
      </div>
    </form>
  )
}
