'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { editarComercio, type EditarComercioState } from '../../../actions'
import styles from '@/styles/formulario.module.css'

type Opcion = { id: number; nombre: string }

type ComercioInicial = {
  id: number
  perfil_id: string | null
  nombre: string
  descripcion: string | null
  marca_id: number | null
  categoria_id: number | null
  logo_url: string | null
  /** Correo real de Auth, o cadena vacía si no tiene cuenta. */
  correo: string
}

const estadoInicial: EditarComercioState = {}

export function EditarComercioForm({
  comercio,
  marcas,
  categorias,
}: {
  comercio: ComercioInicial
  marcas: Opcion[]
  categorias: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(editarComercio, estadoInicial)

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <input type="hidden" name="id" value={comercio.id} />
        <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
        <input type="hidden" name="correo_original" value={comercio.correo} />

        <Stack gap={5}>
          <Field
            label="Correo electrónico"
            help="Cambiarlo también cambia su usuario de acceso."
          >
            <Input
              name="correo"
              type="email"
              defaultValue={comercio.correo}
              autoComplete="email"
            />
          </Field>

          <Field label="Nombre">
            <Input name="nombre" defaultValue={comercio.nombre} required autoFocus />
          </Field>

          <Field label="Descripción" optional>
            <Input name="descripcion" defaultValue={comercio.descripcion ?? ''} />
          </Field>

          <div className={styles.pareja}>
            <Field label="Marca" optional>
              <Select name="marca_id" defaultValue={comercio.marca_id ?? ''}>
                <option value="">Sin marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Categoría" optional>
              <Select name="categoria_id" defaultValue={comercio.categoria_id ?? ''}>
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="URL del logo" optional>
            <Input
              name="logo_url"
              type="url"
              defaultValue={comercio.logo_url ?? ''}
              placeholder="https://…"
            />
          </Field>
        </Stack>

        <div className={styles.acciones}>
          <Button type="submit" loading={pending} icon={<Save size={16} />}>
            Guardar cambios
          </Button>
          <Button href={`/admin/comercios/${comercio.id}`} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
