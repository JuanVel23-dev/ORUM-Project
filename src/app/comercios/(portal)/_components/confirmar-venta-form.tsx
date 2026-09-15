'use client'

import { useActionState, useEffect, useId, useMemo, useState } from 'react'
import { Check, Receipt, RotateCcw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
import { error as vibrarError, exito as vibrarExito } from '@/lib/shared/haptica'
import { registrarVenta, type RegistrarVentaState } from '../actions'
import type { MetodoRegistroVenta, TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './verificar.module.css'

type Sucursal = { id: number; nombre: string | null }
type Promocion = {
  id: number
  titulo: string
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

const estadoInicial: RegistrarVentaState = {}

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

const enPesos = (digitos: string) => (digitos === '' ? '' : MILES.format(Number(digitos)))

export function ConfirmarVentaForm({
  miembroId,
  membresiaId,
  numeroMembresia,
  metodo,
  sucursales,
  promociones,
  onExito,
}: {
  miembroId: number
  membresiaId: number | null
  numeroMembresia: string
  metodo: MetodoRegistroVenta
  sucursales: Sucursal[]
  promociones: Promocion[]
  onExito: () => void
}) {
  const [state, formAction, pending] = useActionState(registrarVenta, estadoInicial)
  const idDescuento = useId()
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
  const editable = promocionSeleccionada !== null && !calculoAutomatico

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

  const valorFinal = calcularValorFinal(Number(valorCompra) || 0, valorDescuento)
  const hayImporte = Number(valorCompra) > 0

  /*
    Con una sola sucursal no hay selector, y entonces la promoción se queda
    sola en su fila: ocupa el ancho entero en vez de dejar media fila hueca.
  */
  const haySelectorSucursal = sucursales.length > 1
  const clasePromocion = haySelectorSucursal ? undefined : styles.anchoCompleto

  /*
    LA HORA DEL ACUSE VIENE DEL SERVIDOR.

    Es la del recibo: el reloj del teléfono del cajero puede estar desajustado y
    el que vale es el del sistema que guardó la venta. Y de paso evita las dos
    trampas que tuvo este bloque antes: un `setState` dentro de un efecto
    —render en cascada, prohibido por la norma— y una `ref` leída durante el
    render, que tampoco es legal. Llegando con `state`, no hay nada que
    sincronizar.
  */
  const horaRegistro = state.hora ?? null

  /* La vibración sí es un efecto de verdad: toca una API del sistema. Solo en
     el flanco, al pasar a `ok`. */
  useEffect(() => {
    if (state.ok) vibrarExito()
  }, [state.ok])

  useEffect(() => {
    if (state.error) vibrarError()
  }, [state.error])

  if (state.ok) {
    return (
      <Card padding="lg">
        <div className={styles.exito} role="status">
          <span className={styles.exitoIcono} aria-hidden="true">
            <Check size={28} strokeWidth={2.5} />
          </span>

          <div className={styles.exitoTextos}>
            <p className={styles.exitoTitulo}>Venta registrada</p>

            {/*
              LOS TRES DATOS PARA RECLAMAR: monto, socio y hora. Antes el acuse
              decía solo el número del socio, y un cajero que sospechaba un
              error no tenía con qué llamar al administrador: «me equivoqué en
              una venta de esta tarde» no localiza ninguna fila.
            */}
            <p className={styles.exitoNota}>
              Se cobraron {PESOS.format(valorFinal)} al socio N.º {numeroMembresia}
              {horaRegistro && <>, a las {horaRegistro}</>}.
            </p>

            {/*
              HONESTIDAD EN LUGAR DE UN BOTÓN QUE NO EXISTE. El contrato de
              datos no expone ninguna anulación de venta (`API-CONTRACT.md` §4),
              así que no se ofrece un «Deshacer» de mentira: se dice a quién
              acudir y con qué datos, que es lo único cierto que se puede dar.
              Escalado como propuesta de backend.
            */}
            <p className={styles.exitoAviso}>
              ¿Te equivocaste? Esta venta no se puede anular desde aquí: escribe al
              administrador con la hora y el número del socio.
            </p>
          </div>

          {/* La cola sigue: el camino de vuelta tiene que ser un solo toque. */}
          <Button onClick={onExito} size="lg" fullWidth icon={<RotateCcw size={17} />}>
            Verificar otro socio
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg">
      <form action={formAction} className={styles.paso}>
        <input type="hidden" name="miembro_id" value={miembroId} />
        <input type="hidden" name="membresia_id" value={membresiaId ?? ''} />
        <input type="hidden" name="numero_membresia" value={numeroMembresia} />
        <input type="hidden" name="metodo_registro" value={metodo} />

        {/* Mismo motivo que en la búsqueda: sin `key`, dos fallos idénticos
            seguidos no se vuelven a anunciar al lector de pantalla. */}
        {state.error && (
          <Alert key={state.error} tone="danger">
            {state.error}
          </Alert>
        )}

        <div className={styles.campos}>
          {/*
            EL IMPORTE VA PRIMERO. Es el único dato que el cajero tiene que
            teclear y el que decide el total; la promoción y la sucursal son
            elecciones de lista que puede resolver después, o que no tiene que
            tocar en absoluto. Antes abría la pantalla el selector de promoción,
            que en la mayoría de las ventas se deja como está.
          */}
          <div className={styles.anchoCompleto}>
            <Field label="Valor de la compra">
              <Input
                /*
                  El campo VISIBLE no se envía: lleva los puntos de millar para
                  que el cajero vea de un vistazo si se le fue un cero. Lo que
                  viaja son los dígitos limpios del `hidden` de abajo —el
                  servidor los parsea con `Number()` y cualquier separador daría
                  `NaN`—. Presentación y dato, separados a propósito.

                  `text` con `inputMode="numeric"`, no `type="number"`: en
                  Android el teclado de `number` trae `+`, `-` y coma —ninguno
                  vale aquí, son pesos enteros— y los spinners nativos son un
                  blanco de toque parásito para quien maneja el móvil de pie y
                  con una mano.

                  `enterKeyHint="done"`: con el teclado abierto, el total y el
                  botón quedan debajo; la propia tecla de retorno lo cierra sin
                  tener que ir a buscar un botón que no se ve.
                */
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                enterKeyHint="done"
                autoComplete="off"
                placeholder="0"
                numeric
                className={styles.importe}
                value={enPesos(valorCompra)}
                onChange={(e) => setValorCompra(soloDigitos(e.target.value).slice(0, MAX_DIGITOS))}
                required
              />
            </Field>
            <input type="hidden" name="valor_compra" value={valorCompra || '0'} />
          </div>

          <div className={clasePromocion}>
            <Field label="Promoción aplicada">
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
          </div>

          {/* Con una sola sucursal no hay nada que elegir: se manda oculta. */}
          {haySelectorSucursal ? (
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
          ) : (
            <input type="hidden" name="sucursal_id" value={sucursales[0]?.id ?? ''} />
          )}

          {editable ? (
            <div className={styles.anchoCompleto}>
            <Field label="Descuento" help="Escribe cuánto se descontó.">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                enterKeyHint="done"
                autoComplete="off"
                placeholder="0"
                numeric
                value={enPesos(descuentoManual)}
                onChange={(e) =>
                  setDescuentoManual(soloDigitos(e.target.value).slice(0, MAX_DIGITOS))
                }
              />
              <input type="hidden" name="valor_descuento" value={descuentoManual || '0'} />
            </Field>
            </div>
          ) : (
            /*
              Cuando lo calcula la promoción esto NO es un campo: era un
              `readOnly` que seguía siendo enfocable, así que el cajero lo
              tocaba, se abría el teclado numérico sin poder escribir nada y
              tapaba el total justo cuando hay que leerlo en voz alta. Ahora es
              un dato mostrado —y un `hidden` que lo lleva en el envío—.
              `<output>` se anuncia solo al cambiar de promoción.
            */
            <div className={`${styles.campoLeido} ${styles.anchoCompleto}`}>
              <span className={styles.campoLeidoEtiqueta} id={idDescuento}>
                Descuento
              </span>
              <output className={styles.campoLeidoValor} aria-labelledby={idDescuento}>
                {PESOS.format(valorDescuento)}
              </output>
              <span className={styles.campoLeidoAyuda}>
                {calculoAutomatico ? 'Lo calcula la promoción.' : 'Elige una promoción primero.'}
              </span>
              <input type="hidden" name="valor_descuento" value={valorDescuento} />
            </div>
          )}
        </div>

        {/*
          Lo que se le cobra al cliente. Se separa de los campos que lo
          producen porque es el único número que se dice en voz alta.
        */}
        <div className={styles.total}>
          <div>
            <p className={styles.totalEtiqueta}>Valor final</p>
            {valorDescuento > 0 && (
              <p className={styles.ahorro}>Ahorra {PESOS.format(valorDescuento)}</p>
            )}
          </div>
          <span className={styles.totalValor}>{PESOS.format(valorFinal)}</span>
        </div>

        {/*
          EL BOTÓN DICE EL NÚMERO. Es la última lectura del importe antes de
          algo que no se puede deshacer, y es gratis: el cajero ya está mirando
          el botón que va a tocar. Con el importe en cero se queda en «Registrar
          venta» — repetir «Cobrar $0» no informa de nada.
        */}
        <Button type="submit" size="lg" fullWidth loading={pending} icon={<Receipt size={17} />}>
          {hayImporte ? `Cobrar ${PESOS.format(valorFinal)}` : 'Registrar venta'}
        </Button>
      </form>
    </Card>
  )
}
