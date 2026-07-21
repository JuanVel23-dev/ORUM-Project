'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editarUsuario, type EditarUsuarioState } from '../../actions'

const estadoInicial: EditarUsuarioState = {}

type Props = {
  perfilId: string
  esComercio: boolean
  email: string
  empleado: { nombres: string; apellidos: string; cedula: string | null; telefono: string | null } | null
  comercio: { nombre: string; descripcion: string | null } | null
}

export function EditarForm({ perfilId, esComercio, email, empleado, comercio }: Props) {
  const [state, formAction, pending] = useActionState(editarUsuario, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      <input type="hidden" name="perfil_id" value={perfilId} />
      <input type="hidden" name="tipo" value={esComercio ? 'comercio' : 'empleado'} />
      <input type="hidden" name="email_original" value={email} />

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo de acceso
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="orum-input"
          defaultValue={email}
          required
        />
      </div>

      {esComercio ? (
        <>
          <div className="orum-field">
            <label className="orum-label" htmlFor="comercio_nombre">
              Nombre del comercio
            </label>
            <input
              id="comercio_nombre"
              name="comercio_nombre"
              className="orum-input"
              defaultValue={comercio?.nombre ?? ''}
              required
            />
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="descripcion">
              Descripción
            </label>
            <input
              id="descripcion"
              name="descripcion"
              className="orum-input"
              defaultValue={comercio?.descripcion ?? ''}
            />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="orum-field" style={{ flex: 1 }}>
              <label className="orum-label" htmlFor="nombres">
                Nombres
              </label>
              <input
                id="nombres"
                name="nombres"
                className="orum-input"
                defaultValue={empleado?.nombres ?? ''}
                required
              />
            </div>
            <div className="orum-field" style={{ flex: 1 }}>
              <label className="orum-label" htmlFor="apellidos">
                Apellidos
              </label>
              <input
                id="apellidos"
                name="apellidos"
                className="orum-input"
                defaultValue={empleado?.apellidos ?? ''}
                required
              />
            </div>
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="cedula">
              Cédula
            </label>
            <input
              id="cedula"
              name="cedula"
              className="orum-input"
              defaultValue={empleado?.cedula ?? ''}
              required
            />
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="telefono">
              Teléfono (opcional)
            </label>
            <input
              id="telefono"
              name="telefono"
              className="orum-input"
              defaultValue={empleado?.telefono ?? ''}
            />
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link href="/admin/usuarios" className="orum-button orum-button--secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
