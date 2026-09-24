'use client'

import { useActionState } from 'react'
import { Megaphone, Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/toggle'
import { Stack } from '@/components/ui/layout'
import { useCerrarCuando, useCerrarOverlay } from '@/components/shell/overlay-ruta'
import { crearAnuncio, editarAnuncio, type AnuncioState } from '../actions'
import formStyles from '@/styles/formulario.module.css'
import styles from './anuncio-form.module.css'

export type AnuncioInicial = {
  id: number
  titulo: string
  cuerpo: string
  mostrarPublico: boolean
  mostrarMiembros: boolean
}

const estadoInicial: AnuncioState = {}

export function AnuncioForm({ anuncio }: { anuncio?: AnuncioInicial }) {
  const editando = Boolean(anuncio)
  const [state, formAction, pending] = useActionState(
    editando ? editarAnuncio : crearAnuncio,
    estadoInicial,
  )
  const cerrar = useCerrarOverlay()
  useCerrarCuando(state.ok)

  return (
    <form action={formAction} className={formStyles.formulario} noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}

      {anuncio && <input type="hidden" name="id" value={anuncio.id} />}

      <Stack gap={5}>
        <Field label="Título" help="Lo primero que lee el socio en el aviso.">
          <Input
            name="titulo"
            defaultValue={anuncio?.titulo}
            maxLength={120}
            required
            autoFocus
          />
        </Field>

        <Field label="Cuerpo" help="El texto completo del aviso. Máximo 600 caracteres.">
          <Textarea
            name="cuerpo"
            defaultValue={anuncio?.cuerpo}
            maxLength={600}
            rows={5}
            required
          />
        </Field>

        {/*
          `<fieldset>`/`<legend>` y no `Field`: `Field` cablea un único
          control por `id` (`useField()`), y aquí hay DOS checkboxes
          independientes — usar `Field` dejaría la etiqueta apuntando a un
          control que no existe.
        */}
        <fieldset className={styles.grupo}>
          <legend className={styles.etiquetaGrupo}>Dónde se muestra</legend>
          <Stack gap={2}>
            <Checkbox
              name="mostrar_publico"
              value="true"
              label="Portal público"
              description="La ve cualquier visitante, incluso sin ser socio."
              defaultChecked={anuncio ? anuncio.mostrarPublico : true}
            />
            <Checkbox
              name="mostrar_miembros"
              value="true"
              label="Portal de miembros"
              description="La ven los socios con membresía vigente."
              defaultChecked={anuncio ? anuncio.mostrarMiembros : true}
            />
          </Stack>
        </fieldset>
      </Stack>

      <div className={formStyles.acciones}>
        <Button
          type="submit"
          loading={pending}
          icon={editando ? <Save size={16} /> : <Megaphone size={16} />}
        >
          {editando ? 'Guardar cambios' : 'Crear novedad'}
        </Button>
        <Button type="button" variant="secondary" onClick={cerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
