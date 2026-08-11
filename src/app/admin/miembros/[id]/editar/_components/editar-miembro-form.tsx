'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { editarMiembro, type EditarMiembroState } from '../../../actions'
import styles from '../../formulario.module.css'

type Opcion = { id: number; nombre: string }

type MiembroInicial = {
  id: number
  perfil_id: string | null
  nombres: string
  apellidos: string
  cedula: string
  telefono: string | null
  direccion: string | null
  ciudad_id: number | null
  /** Correo real de Auth, o cadena vacía si no tiene cuenta. */
  correo: string
}

const estadoInicial: EditarMiembroState = {}

export function EditarMiembroForm({
  miembro,
  ciudades,
}: {
  miembro: MiembroInicial
  ciudades: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(editarMiembro, estadoInicial)

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <input type="hidden" name="miembro_id" value={miembro.id} />
        <input type="hidden" name="perfil_id" value={miembro.perfil_id ?? ''} />
        <input type="hidden" name="correo_original" value={miembro.correo} />

        <Stack gap={5}>
          <div className={styles.pareja}>
            <Field label="Nombres">
              <Input
                name="nombres"
                defaultValue={miembro.nombres}
                autoComplete="given-name"
                required
                autoFocus
              />
            </Field>
            <Field label="Apellidos">
              <Input
                name="apellidos"
                defaultValue={miembro.apellidos}
                autoComplete="family-name"
                required
              />
            </Field>
          </div>

          <div className={styles.pareja}>
            <Field label="Cédula" help="Debe seguir siendo única.">
              <Input
                name="cedula"
                defaultValue={miembro.cedula}
                numeric
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Teléfono" optional>
              <Input
                name="telefono"
                defaultValue={miembro.telefono ?? ''}
                type="tel"
                numeric
                inputMode="tel"
              />
            </Field>
          </div>

          <Field
            label="Correo electrónico"
            help="Cambiarlo también cambia su usuario de acceso."
          >
            <Input
              name="correo"
              type="email"
              defaultValue={miembro.correo}
              autoComplete="email"
            />
          </Field>

          <div className={styles.pareja}>
            <Field label="Ciudad" optional>
              <Select name="ciudad_id" defaultValue={miembro.ciudad_id ?? ''}>
                <option value="">Sin ciudad</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dirección" optional>
              <Input
                name="direccion"
                defaultValue={miembro.direccion ?? ''}
                autoComplete="street-address"
              />
            </Field>
          </div>
        </Stack>

        <div className={styles.acciones}>
          <Button type="submit" loading={pending} icon={<Save size={16} />}>
            Guardar cambios
          </Button>
          <Button href={`/admin/miembros/${miembro.id}`} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
