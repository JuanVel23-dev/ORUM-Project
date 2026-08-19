'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, InputButton } from '@/components/ui/input'
import { estilosAuth } from '@/components/ui/pantalla-auth'
import { iniciarSesionMiembro, type LoginMiembroState } from '../actions'

const estadoInicial: LoginMiembroState = {}

export function LoginMiembroForm({ mensajeInicial }: { mensajeInicial?: string }) {
  const [state, formAction, pending] = useActionState(iniciarSesionMiembro, estadoInicial)
  const [verPassword, setVerPassword] = useState(false)

  const error = state.error ?? mensajeInicial

  return (
    <form action={formAction} className={estilosAuth.formulario} noValidate>
      {/*
        Igual que en el acceso de administración: la sacudida la dispara el CSS
        con `:has(.alerta)`. Sin `key` en el <form>, para no remontarlo y
        borrar el número ya tecleado tras cada fallo.
      */}
      {error && (
        <Alert key={error} tone="danger" className={estilosAuth.alerta}>
          {error}
        </Alert>
      )}

      <Field label="Número de membresía">
        <Input
          name="numero_membresia"
          type="text"
          /* Teclado numérico en móvil, pero `type="text"`: el número puede
             llevar ceros a la izquierda y `type="number"` los descarta. */
          inputMode="numeric"
          autoComplete="username"
          placeholder="00012345"
          required
          autoFocus
        />
      </Field>

      <Field label="Contraseña">
        <Input
          name="password"
          type={verPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          endAdornment={
            <InputButton
              label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVerPassword((v) => !v)}
            >
              {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </InputButton>
          }
        />
      </Field>

      <Button type="submit" size="lg" fullWidth loading={pending} icon={<LogIn size={17} />}>
        Iniciar sesión
      </Button>
    </form>
  )
}
