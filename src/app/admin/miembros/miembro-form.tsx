'use client'

import { useActionState, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copiar } from '@/components/ui/copiar'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Divider, Section, Stack } from '@/components/ui/layout'
import { registrarMiembro, type RegistrarMiembroState } from './actions'
import styles from './formulario.module.css'

type Opcion = { id: number; nombre: string }
type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RegistrarMiembroState = {}

export function MiembroForm({
  ciudades,
  planes,
}: {
  ciudades: Opcion[]
  planes: PlanOpcion[]
  /**
   * Sin tarjeta contenedora. Dentro de un overlay la superficie ya la pone el
   * propio overlay: envolver otra vez daría una tarjeta sobre otra.
   */
}) {
  const [state, formAction, pending] = useActionState(registrarMiembro, estadoInicial)
  const [precio, setPrecio] = useState(planes[0] ? String(planes[0].precio) : '')

  const sinPlanes = planes.length === 0

  // Registro completado: la pantalla cambia por entero a entregar credenciales.
  if (state.ok && state.numero && state.password) {
    return <Credenciales estado={state} />
  }


  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        {sinPlanes && (
          <Alert tone="warning" title="No hay planes activos">
            Activa al menos un plan de membresía antes de registrar un miembro.
          </Alert>
        )}

        <Section title="Datos del cliente">
          <Stack gap={5}>
            <div className={styles.pareja}>
              <Field label="Nombres">
                <Input name="nombres" autoComplete="given-name" required autoFocus />
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

            <Field
              label="Correo electrónico"
              help="Será su usuario de acceso al portal de miembros."
            >
              <Input name="correo" type="email" autoComplete="email" required />
            </Field>

            <div className={styles.pareja}>
              <Field label="Ciudad" optional>
                <Select name="ciudad_id" defaultValue="">
                  <option value="">Sin ciudad</option>
                  {ciudades.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Dirección" optional>
                <Input name="direccion" autoComplete="street-address" />
              </Field>
            </div>
          </Stack>
        </Section>

        <Divider />

        <Section title="Primera membresía">
          <Stack gap={5}>
            <div className={styles.pareja}>
              <Field label="Plan">
                <Select
                  name="plan_id"
                  required
                  defaultValue={planes[0]?.id ?? ''}
                  disabled={sinPlanes}
                  onChange={(e) => {
                    const plan = planes.find((p) => p.id === Number(e.target.value))
                    if (plan) setPrecio(String(plan.precio))
                  }}
                >
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {p.precio.toLocaleString('es-CO')}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Precio pagado" help="Ajústalo si hubo un descuento.">
                <Input
                  name="precio_pagado"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  numeric
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  disabled={sinPlanes}
                />
              </Field>
            </div>

            <p className={styles.nota}>
              Al guardar se generan el número de membresía y una contraseña segura. Se
              mostrarán una sola vez en la siguiente pantalla.
            </p>
          </Stack>
        </Section>

        <div className={styles.acciones}>
          <Button
            type="submit"
            loading={pending}
            disabled={sinPlanes}
            icon={<UserPlus size={16} />}
          >
            Registrar miembro
          </Button>

          <Button href="/admin/miembros" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}

/* ========================================================================== */

function Credenciales({ estado }: { estado: RegistrarMiembroState }) {
  return (
    <>
      <div className={styles.credenciales}>
        <Alert tone="success" title={`${estado.nombre} quedó registrado`} />

        <Alert tone="warning" title="Entrega estos datos ahora">
          La contraseña no se vuelve a mostrar. Si se pierde, habrá que generar una
          nueva.
        </Alert>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Número de membresía</span>
          <Copiar valor={estado.numero!} label="Copiar número de membresía">
            <span className={styles.credencialValor}>{estado.numero}</span>
          </Copiar>
        </div>

        <div className={styles.credencial}>
          <span className={styles.credencialEtiqueta}>Contraseña temporal</span>
          <Copiar valor={estado.password!} label="Copiar contraseña temporal">
            <span className={styles.credencialValor}>{estado.password}</span>
          </Copiar>
        </div>

        <div className={styles.acciones}>
          <Button href="/admin/miembros">Ir a la lista</Button>
          <Button href="/admin/miembros/nuevo" variant="secondary">
            Registrar otro
          </Button>
        </div>
      </div>
    </>
  )
}
