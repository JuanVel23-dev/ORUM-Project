'use client'

import { useActionState } from 'react'
import { Store } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copiar } from '@/components/ui/copiar'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { crearComercio, type CrearComercioState } from '../actions'
import styles from '@/styles/formulario.module.css'

type Opcion = { id: number; nombre: string }

const estadoInicial: CrearComercioState = {}

export function ComercioForm({
  marcas,
  categorias,
}: {
  marcas: Opcion[]
  categorias: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(crearComercio, estadoInicial)

  if (state.ok && state.email) {
    return <Credenciales estado={state} />
  }

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <Stack gap={5}>
          <Field
            label="Correo electrónico"
            help="Será el usuario con el que el comercio inicia sesión en su herramienta."
          >
            <Input name="correo" type="email" autoComplete="email" required autoFocus />
          </Field>

          <Field label="Nombre del comercio">
            <Input name="nombre" required />
          </Field>

          <Field label="Descripción" optional>
            <Input name="descripcion" />
          </Field>

          <div className={styles.pareja}>
            <Field label="Marca" optional>
              <Select name="marca_id" defaultValue="">
                <option value="">Sin marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Categoría" optional>
              <Select name="categoria_id" defaultValue="">
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
            <Input name="logo_url" type="url" placeholder="https://…" />
          </Field>

          <p className={styles.nota}>
            Al guardar se envía un correo con un enlace de un solo uso para activar
            el acceso.
          </p>
        </Stack>

        <div className={styles.acciones}>
          <Button type="submit" loading={pending} icon={<Store size={16} />}>
            Crear comercio
          </Button>
          <Button href="/admin/comercios" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}

function Credenciales({ estado }: { estado: CrearComercioState }) {
  return (
    <>
      <div className={styles.credenciales}>
        <Alert tone="success" title="Comercio creado" />

        <Alert tone="success" title="Correo de activación enviado">
          Se envió un enlace de un solo uso a {estado.email} para que el comercio
          elija su propia contraseña.
        </Alert>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Correo de acceso</span>
          <Copiar valor={estado.email ?? ''} label="Copiar correo">
            <span className={styles.credencialValor}>{estado.email}</span>
          </Copiar>
        </div>

        <div className={styles.acciones}>
          <Button href="/admin/comercios">Ir a la lista</Button>
          <Button href="/admin/comercios/nuevo" variant="secondary">
            Crear otro
          </Button>
        </div>
      </div>
    </>
  )
}
