'use client'

import { useActionState, useState } from 'react'
import { Save, Tag } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import {
  crearPromocion,
  editarPromocion,
  type PromocionState,
} from '../../promociones-actions'
import styles from '../../../miembros/formulario.module.css'

type TipoOpcion = { id: number; codigo: string; nombre: string }

type PromocionInicial = {
  id: number
  titulo: string
  descripcion: string | null
  tipo_beneficio_id: number
  valor: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
}

const estadoInicial: PromocionState = {}

/** Tipos donde el beneficio no se expresa con un número. */
const TIPOS_SIN_VALOR = new Set(['dos_por_uno', 'regalo'])

export function PromocionForm({
  comercioId,
  tipos,
  promocion,
}: {
  comercioId: number
  tipos: TipoOpcion[]
  promocion?: PromocionInicial
}) {
  const editando = Boolean(promocion)
  const [state, formAction, pending] = useActionState(
    editando ? editarPromocion : crearPromocion,
    estadoInicial,
  )

  const [tipoId, setTipoId] = useState(
    String(promocion?.tipo_beneficio_id ?? tipos[0]?.id ?? ''),
  )

  const tipoSeleccionado = tipos.find((t) => String(t.id) === tipoId)
  const esPorcentaje = tipoSeleccionado?.codigo === 'porcentaje'

  // El campo cambia de forma según el tipo: un 2x1 no tiene número que pedir,
  // y un porcentaje no se introduce igual que un monto en pesos.
  const requiereValor = tipoSeleccionado
    ? !TIPOS_SIN_VALOR.has(tipoSeleccionado.codigo)
    : true

  const sinTipos = tipos.length === 0

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        {sinTipos && (
          <Alert tone="warning" title="No hay tipos de beneficio">
            Siembra al menos un tipo de beneficio en la base de datos antes de crear
            promociones.
          </Alert>
        )}

        <input type="hidden" name="comercio_id" value={comercioId} />
        {promocion && <input type="hidden" name="id" value={promocion.id} />}

        <Stack gap={5}>
          <Field label="Título" help="Es lo que ve el miembro. Sé concreto.">
            <Input
              name="titulo"
              defaultValue={promocion?.titulo}
              required
              autoFocus
              placeholder="20% en toda la carta"
            />
          </Field>

          <Field label="Descripción" optional>
            <Input name="descripcion" defaultValue={promocion?.descripcion ?? ''} />
          </Field>

          <Field label="Tipo de beneficio">
            <Select
              name="tipo_beneficio_id"
              required
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              disabled={sinTipos}
            >
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          </Field>

          {requiereValor && (
            <Field
              label={esPorcentaje ? 'Porcentaje de descuento' : 'Monto del beneficio'}
              help={
                esPorcentaje
                  ? 'Entre 1 y 100.'
                  : 'En pesos colombianos, sin puntos ni símbolo.'
              }
            >
              <Input
                name="valor"
                type="number"
                min="0"
                max={esPorcentaje ? 100 : undefined}
                step="0.01"
                inputMode="decimal"
                numeric
                defaultValue={promocion?.valor ?? ''}
              />
            </Field>
          )}

          <div className={styles.pareja}>
            <Field label="Fecha de inicio" optional>
              <Input
                name="fecha_inicio"
                type="date"
                defaultValue={promocion?.fecha_inicio ?? ''}
              />
            </Field>

            <Field label="Fecha de fin" optional>
              <Input
                name="fecha_fin"
                type="date"
                defaultValue={promocion?.fecha_fin ?? ''}
              />
            </Field>
          </div>
        </Stack>

        <div className={styles.acciones}>
          <Button
            type="submit"
            loading={pending}
            disabled={sinTipos}
            icon={editando ? <Save size={16} /> : <Tag size={16} />}
          >
            {editando ? 'Guardar cambios' : 'Crear promoción'}
          </Button>
          <Button href={`/admin/comercios/${comercioId}`} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
