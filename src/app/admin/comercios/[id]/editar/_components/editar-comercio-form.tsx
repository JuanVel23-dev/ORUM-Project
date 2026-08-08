'use client'

import { useActionState } from 'react'
import { editarComercio, type EditarComercioState } from '../../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type ComercioInicial = {
  id: number
  perfil_id: string | null
  nombre: string
  descripcion: string | null
  marca_id: number | null
  categoria_id: number | null
  logo_url: string | null
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
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="id" value={comercio.id} />
      <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={comercio.correo} />

      <Field label="Correo electrónico" htmlFor="correo">
        <input
          id="correo"
          name="correo"
          type="email"
          className="orum-input"
          defaultValue={comercio.correo === '—' ? '' : comercio.correo}
        />
      </Field>

      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={comercio.nombre} />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={comercio.descripcion ?? ''} />
      </Field>

      <Row>
        <Field label="Marca (opcional)" htmlFor="marca_id" flex>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue={comercio.marca_id ?? ''}>
            <option value="">— Sin marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría (opcional)" htmlFor="categoria_id" flex>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue={comercio.categoria_id ?? ''}>
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="URL del logo (opcional)" htmlFor="logo_url">
        <input id="logo_url" name="logo_url" className="orum-input" defaultValue={comercio.logo_url ?? ''} placeholder="https://…" />
      </Field>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <LinkButton href={`/admin/comercios/${comercio.id}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
