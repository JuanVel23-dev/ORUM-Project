'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { editarUsuario, type EditarUsuarioState } from '../../actions'
import styles from '../../../miembros/formulario.module.css'

const estadoInicial: EditarUsuarioState = {}

type Props = {
  perfilId: string
  email: string
  empleado: {
    nombres: string
    apellidos: string
    cedula: string | null
    telefono: string | null
  }
}

export function EditarForm({ perfilId, email, empleado }: Props) {
  const [state, formAction, pending] = useActionState(editarUsuario, estadoInicial)

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <input type="hidden" name="perfil_id" value={perfilId} />
        <input type="hidden" name="email_original" value={email} />

        <Stack gap={5}>
          <Field
            label="Correo de acceso"
            help="Cambiarlo también cambia el usuario con el que inicia sesión."
          >
            <Input
              name="email"
              type="email"
              defaultValue={email}
              autoComplete="email"
              required
              autoFocus
            />
          </Field>

          <div className={styles.pareja}>
            <Field label="Nombres">
              <Input
                name="nombres"
                defaultValue={empleado.nombres}
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label="Apellidos">
              <Input
                name="apellidos"
                defaultValue={empleado.apellidos}
                autoComplete="family-name"
                required
              />
            </Field>
          </div>

          <div className={styles.pareja}>
            <Field label="Cédula" help="Debe seguir siendo única.">
              <Input
                name="cedula"
                defaultValue={empleado.cedula ?? ''}
                numeric
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Teléfono" optional>
              <Input
                name="telefono"
                defaultValue={empleado.telefono ?? ''}
                type="tel"
                numeric
                inputMode="tel"
              />
            </Field>
          </div>
        </Stack>

        <div className={styles.acciones}>
          <Button type="submit" loading={pending} icon={<Save size={16} />}>
            Guardar cambios
          </Button>
          <Button href="/admin/usuarios" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
