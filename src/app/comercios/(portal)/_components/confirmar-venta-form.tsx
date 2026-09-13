'use client'

import { useActionState, useId, useMemo, useState } from 'react'
import { Check, Receipt, RotateCcw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
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

/*
  Los montos viajan como cadena de dígitos y el servidor los lee con `Number()`.
  Cualquier separador o signo que se cuele daría `NaN` y la venta se rechazaría
  con un error que el cajero no sabría corregir, así que se filtra al teclear.
*/
const soloDigitos = (valor: string) => valor.replace(/\D+/g, '')

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
  const [valorCompra, setValorCompra] = useState('0')
  const [descuentoManual, setDescuentoManual] = useState('0')

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

  if (state.ok) {
    return (
      <Card padding="lg">
        <div className={styles.exito}>
          <span className={styles.exitoIcono} aria-hidden="true">
            <Check size={28} strokeWidth={2.5} />
          </span>

          <div>
            <p className={styles.exitoTitulo}>Venta registrada</p>
            <p className={styles.exitoNota}>
              Quedó anotada a nombre del miembro {numeroMembresia}.
            </p>
          </div>

          {/* La cola sigue: el camino de vuelta tiene que ser un solo toque. */}
          <Button onClick={onExito} size="lg" icon={<RotateCcw size={17} />}>
            Verificar otro miembro
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

        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <div className={styles.campos}>
          <div className={styles.anchoCompleto}>
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
          {sucursales.length > 1 ? (
            <div className={styles.anchoCompleto}>
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
            </div>
          ) : (
            <input type="hidden" name="sucursal_id" value={sucursales[0]?.id ?? ''} />
          )}

          <Field label="Valor de la compra">
            <Input
              name="valor_compra"
              /*
                `text` con `inputMode="numeric"`, no `type="number"`: en Android
                el teclado de `number` trae `+`, `-` y coma —ninguno vale aquí,
                son pesos enteros— y los spinners nativos son un blanco de toque
                parásito para quien maneja el móvil de pie y con una mano. El
                saneado deja solo dígitos, que es lo que el servidor parsea con
                `Number()`.
              */
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              numeric
              value={valorCompra}
              onChange={(e) => setValorCompra(soloDigitos(e.target.value))}
              required
            />
          </Field>

          {editable ? (
            <Field label="Descuento" help="Escribe cuánto se descontó.">
              <Input
                name="valor_descuento"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                numeric
                value={descuentoManual}
                onChange={(e) => setDescuentoManual(soloDigitos(e.target.value))}
              />
            </Field>
          ) : (
            /*
              Cuando lo calcula la promoción esto NO es un campo: era un
              `readOnly` que seguía siendo enfocable, así que el cajero lo
              tocaba, se abría el teclado numérico sin poder escribir nada y
              tapaba el total justo cuando hay que leerlo en voz alta. Ahora es
              un dato mostrado —y un `hidden` que lo lleva en el envío—.
              `<output>` se anuncia solo al cambiar de promoción.
            */
            <div className={styles.campoLeido}>
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

        <Button type="submit" size="lg" fullWidth loading={pending} icon={<Receipt size={17} />}>
          Registrar venta
        </Button>
      </form>
    </Card>
  )
}
