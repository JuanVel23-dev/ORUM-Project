'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { ResumenErrores, useValidacion } from '@/components/ui/validacion'
import { correo, largo, obligatorio } from '@/lib/validacion/reglas'
import { Stack } from '@/components/ui/layout'
import { Switch } from '@/components/ui/toggle'
import { useCerrarCuando, useCerrarOverlay } from '@/components/shell/overlay-ruta'
import { editarComercio, type EditarComercioState } from '../../../actions'
import styles from '@/styles/formulario.module.css'

type Opcion = { id: number; nombre: string }

type ComercioInicial = {
  id: number
  perfil_id: string | null
  nombre: string
  descripcion: string | null
  categoria_id: number | null
  indexable: boolean
  /** Correo real de Auth, o cadena vacía si no tiene cuenta. */
  correo: string
}

const estadoInicial: EditarComercioState = {}

/* El correo puede quedar vacío: un comercio sin cuenta de acceso. */
const REGLAS = {
  correo: [correo],
  nombre: [obligatorio('Escribe el nombre del comercio.'), largo(2, 80, 'El nombre')],
  descripcion: [largo(3, 280, 'La descripción')],
}

const ETIQUETAS: Record<string, string> = {
  correo: 'Correo electrónico',
  nombre: 'Nombre',
  descripcion: 'Descripción',
}

export function EditarComercioForm({
  comercio,
  categorias,
}: {
  comercio: ComercioInicial
  categorias: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(editarComercio, estadoInicial)
  const cerrar = useCerrarOverlay()
  useCerrarCuando(state.ok)
  const v = useValidacion(REGLAS)

  return (
    <>
      <form action={formAction} className={styles.formulario} {...v.propsFormulario}>
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <ResumenErrores errores={v.errores} etiquetas={ETIQUETAS} ir={v.ir} />

        <input type="hidden" name="id" value={comercio.id} />
        <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
        <input type="hidden" name="correo_original" value={comercio.correo} />

        <Stack gap={5}>
          <Field
            label="Correo electrónico"
            help="Cambiarlo también cambia su usuario de acceso."
            error={v.error('correo')}
          >
            <Input
              name="correo"
              type="email"
              defaultValue={comercio.correo}
              autoComplete="email"
            />
          </Field>

          <Field label="Nombre" error={v.error('nombre')}>
            <Input name="nombre" defaultValue={comercio.nombre} required autoFocus />
          </Field>

          <Field label="Descripción" optional error={v.error('descripcion')}>
            <Input name="descripcion" defaultValue={comercio.descripcion ?? ''} />
          </Field>

          <Field label="Categoría" optional>
            <SelectMenu
              name="categoria_id"
              etiqueta="Categoría"
              placeholder="Sin categoría"
              defaultValue={comercio.categoria_id ? String(comercio.categoria_id) : ''}
              opciones={[
                { value: '', label: 'Sin categoría' },
                ...categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
              ]}
            />
          </Field>

          <Switch
            name="indexable"
            defaultChecked={comercio.indexable}
            label="Aparecer en buscadores"
            description="Google y Bing podrán mostrar la ficha pública de este comercio. Apágalo mientras sean datos de prueba."
          />
        </Stack>

        <div className={styles.acciones}>
          <Button type="submit" loading={pending} icon={<Save size={16} />}>
            Guardar cambios
          </Button>
          <Button type="button" variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
