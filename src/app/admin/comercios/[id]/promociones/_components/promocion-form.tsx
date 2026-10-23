'use client'

import { useActionState, useState } from 'react'
import { Save, Tag } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/toggle'
import { SelectMenu } from '@/components/ui/select-menu'
import { ResumenErrores, useValidacion } from '@/components/ui/validacion'
import {
  fecha,
  largo,
  noAntesDe,
  obligatorio,
  porcentaje,
  precio,
  type Regla,
} from '@/lib/validacion/reglas'
import { Stack } from '@/components/ui/layout'
import { DIAS_SEMANA } from '@/lib/comercios/dias-promocion'
import { useCerrarCuando, useCerrarOverlay } from '@/components/shell/overlay-ruta'
import {
  crearPromocion,
  editarPromocion,
  type PromocionState,
} from '../../../promociones-actions'
import styles from '@/styles/formulario.module.css'

type TipoOpcion = { id: number; codigo: string; nombre: string }

type PromocionInicial = {
  id: number
  titulo: string
  descripcion: string | null
  tipo_beneficio_id: number
  valor: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
  dias_semana: number[] | null
}

const estadoInicial: PromocionState = {}

/** Tipos donde el beneficio no se expresa con un número. */
const TIPOS_SIN_VALOR = new Set(['dos_por_uno', 'regalo'])

const ETIQUETAS: Record<string, string> = {
  titulo: 'Título',
  descripcion: 'Descripción',
  tipo_beneficio_id: 'Tipo de beneficio',
  valor: 'Valor del beneficio',
  fecha_inicio: 'Fecha de inicio',
  fecha_fin: 'Fecha de fin',
}

/** Las reglas dependen del tipo elegido: el valor se pide como porcentaje, como monto o no se pide. */
function reglasPara(tipos: TipoOpcion[]) {
  const valor: Regla = (v, todos) => {
    const tipo = tipos.find((t) => String(t.id) === todos.tipo_beneficio_id)
    if (!tipo || TIPOS_SIN_VALOR.has(tipo.codigo)) return null
    if (v.trim() === '') {
      return tipo.codigo === 'porcentaje' ? 'Escribe el porcentaje de descuento.' : 'Escribe el monto del beneficio.'
    }
    return tipo.codigo === 'porcentaje' ? porcentaje(v, todos) : precio()(v, todos)
  }
  return {
    titulo: [obligatorio('Escribe el título de la promoción.'), largo(4, 80, 'El título')],
    descripcion: [largo(5, 280, 'La descripción')],
    tipo_beneficio_id: [obligatorio('Elige el tipo de beneficio.')],
    valor: [valor],
    fecha_inicio: [fecha],
    fecha_fin: [fecha, noAntesDe('fecha_inicio', 'La promoción no puede terminar antes de empezar.')],
  }
}

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
  const cerrar = useCerrarOverlay()
  useCerrarCuando(state.ok)

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
  const v = useValidacion(reglasPara(tipos))

  return (
    <>
      <form action={formAction} className={styles.formulario} {...v.propsFormulario}>
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <ResumenErrores errores={v.errores} etiquetas={ETIQUETAS} ir={v.ir} />

        {sinTipos && (
          <Alert tone="warning" title="No hay tipos de beneficio">
            Siembra al menos un tipo de beneficio en la base de datos antes de crear
            promociones.
          </Alert>
        )}

        <input type="hidden" name="comercio_id" value={comercioId} />
        {promocion && <input type="hidden" name="id" value={promocion.id} />}

        <Stack gap={5}>
          <Field label="Título" help="Es lo que ve el miembro. Sé concreto." error={v.error('titulo')}>
            <Input
              name="titulo"
              defaultValue={promocion?.titulo}
              required
              autoFocus
              placeholder="20% en toda la carta"
            />
          </Field>

          <Field label="Descripción" optional error={v.error('descripcion')}>
            <Input name="descripcion" defaultValue={promocion?.descripcion ?? ''} />
          </Field>

          <Field label="Tipo de beneficio" error={v.error('tipo_beneficio_id')}>
            <SelectMenu
              name="tipo_beneficio_id"
              etiqueta="Tipo de beneficio"
              value={tipoId}
              onChange={setTipoId}
              opciones={tipos.map((t) => ({ value: String(t.id), label: t.nombre }))}
            />
          </Field>

          {requiereValor && (
            <Field
              label={esPorcentaje ? 'Porcentaje de descuento' : 'Monto del beneficio'}
              help={esPorcentaje ? 'Entre 1 y 100.' : 'En pesos colombianos. Puedes escribirlo con puntos: 20.000.'}
              error={v.error('valor')}
            >
              <Input
                name="valor"
                inputMode="decimal"
                numeric
                defaultValue={promocion?.valor ?? ''}
              />
            </Field>
          )}

          <div className={styles.pareja}>
            <Field label="Fecha de inicio" optional error={v.error('fecha_inicio')}>
              <Input
                name="fecha_inicio"
                type="date"
                defaultValue={promocion?.fecha_inicio ?? ''}
              />
            </Field>

            <Field label="Fecha de fin" optional error={v.error('fecha_fin')}>
              <Input
                name="fecha_fin"
                type="date"
                defaultValue={promocion?.fecha_fin ?? ''}
              />
            </Field>
          </div>

          {/* Sin ninguno marcado vale todos los días. El cajero ve la promoción
              apagada, con el aviso, los días que no toca. */}
          <fieldset className={styles.grupoDias}>
            <legend className={styles.grupoDiasTitulo}>
              Días en que vale <span className={styles.grupoDiasOpcional}>(opcional)</span>
            </legend>
            <p className={styles.grupoDiasAyuda}>
              Si no marcas ninguno, la promoción vale todos los días. Se cuenta el día en Colombia.
            </p>
            <div className={styles.dias}>
              {DIAS_SEMANA.map((d) => (
                <Checkbox
                  key={d.numero}
                  name="dias_semana"
                  value={d.numero}
                  label={d.corto}
                  defaultChecked={promocion?.dias_semana?.includes(d.numero) ?? false}
                />
              ))}
            </div>
          </fieldset>
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
          <Button type="button" variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
