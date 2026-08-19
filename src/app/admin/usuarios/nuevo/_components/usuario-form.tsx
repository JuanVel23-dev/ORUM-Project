'use client'

import { useActionState, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copiar } from '@/components/ui/copiar'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { SegmentedControl } from '@/components/ui/segmented'
import { crearUsuario, type CrearUsuarioState } from '../../actions'
import styles from '@/styles/formulario.module.css'

const estadoInicial: CrearUsuarioState = {}

type Tipo = 'empleado' | 'super_admin'

export function UsuarioForm() {
  const [state, formAction, pending] = useActionState(crearUsuario, estadoInicial)
  const [tipo, setTipo] = useState<Tipo>('empleado')

  if (state.ok && state.password) {
    return <Credenciales estado={state} />
  }

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        {/* El tipo de usuario es una decisión de permisos: se elige entre dos
            opciones visibles a la vez, no escondidas en un desplegable. */}
        <Field label="Tipo de usuario">
          <input type="hidden" name="tipo" value={tipo} />
          <SegmentedControl
            options={[
              { value: 'empleado', label: 'Empleado' },
              { value: 'super_admin', label: 'Administrador' },
            ]}
            value={tipo}
            onChange={setTipo}
            ariaLabel="Tipo de usuario"
            size="md"
          />
        </Field>

        {tipo === 'super_admin' && (
          <Alert tone="warning" title="Acceso completo">
            Un administrador puede crear otros usuarios, gestionar comercios y cambiar los
            planes de membresía.
          </Alert>
        )}

        <Stack gap={5}>
          <Field
            label="Correo electrónico"
            help="Será su usuario para iniciar sesión en el panel."
          >
            <Input name="email" type="email" autoComplete="email" required autoFocus />
          </Field>

          <div className={styles.pareja}>
            <Field label="Nombres">
              <Input name="nombres" autoComplete="given-name" required />
            </Field>
            <Field label="Apellidos">
              <Input name="apellidos" autoComplete="family-name" required />
            </Field>
          </div>

          <div className={styles.pareja}>
            <Field label="Cédula" help="Sin puntos ni espacios.">
              <Input name="cedula" numeric inputMode="numeric" required />
            </Field>
            <Field label="Teléfono" optional>
              <Input name="telefono" type="tel" numeric inputMode="tel" />
            </Field>
          </div>

          <p className={styles.nota}>
            Al guardar se genera una contraseña segura. Se mostrará una sola vez en la
            siguiente pantalla.
          </p>
        </Stack>

        <div className={styles.acciones}>
          <Button type="submit" loading={pending} icon={<UserPlus size={16} />}>
            Crear usuario
          </Button>
          <Button href="/admin/usuarios" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}

function Credenciales({ estado }: { estado: CrearUsuarioState }) {
  return (
    <>
      <div className={styles.credenciales}>
        <Alert tone="success" title="Usuario creado" />

        <Alert tone="warning" title="Comparte estos datos ahora">
          La contraseña no se vuelve a mostrar. El usuario podrá cambiarla desde su cuenta.
        </Alert>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Correo de acceso</span>
          <Copiar valor={estado.email ?? ''} label="Copiar correo">
            <span className={styles.credencialValor}>{estado.email}</span>
          </Copiar>
        </div>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Contraseña temporal</span>
          <Copiar valor={estado.password ?? ''} label="Copiar contraseña temporal">
            <span className={styles.credencialValor}>{estado.password}</span>
          </Copiar>
        </div>

        <div className={styles.acciones}>
          <Button href="/admin/usuarios">Ir a la lista</Button>
          <Button href="/admin/usuarios/nuevo" variant="secondary">
            Crear otro
          </Button>
        </div>
      </div>
    </>
  )
}
