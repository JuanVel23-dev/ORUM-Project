'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, InputButton } from '@/components/ui/input'
import { estilosAuth } from '@/components/ui/pantalla-auth'
import { createClient } from '@/lib/supabase/client'
import { MENSAJE_ENLACE_INVALIDO, MENSAJE_ENLACE_VENCIDO, textosActivacion } from '@/lib/auth/activacion'

type Estado = 'listo' | 'invalido' | 'guardando'

const DESTINO_POR_ROL: Record<string, string> = {
  staff: '/admin',
  comercio: '/comercios',
}

export function ActivarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destino = DESTINO_POR_ROL[searchParams.get('rol') ?? ''] ?? '/miembros'
  const textos = textosActivacion(searchParams.get('modo') ?? undefined)
  const tokenHash = searchParams.get('token_hash')
  const tipo = searchParams.get('type')

  const [estado, setEstado] = useState<Estado>(tokenHash && tipo ? 'listo' : 'invalido')
  const [error, setError] = useState('')
  const [mensajeInvalido, setMensajeInvalido] = useState(MENSAJE_ENLACE_INVALIDO)
  const [verPassword, setVerPassword] = useState(false)

  async function activar(formData: FormData) {
    const nueva = String(formData.get('password') ?? '')
    const repetida = String(formData.get('confirmar') ?? '')

    if (nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== repetida) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!tokenHash || !tipo) {
      setEstado('invalido')
      return
    }

    setEstado('guardando')
    setError('')

    const supabase = createClient()

    // El token se canjea justo aquí, al enviar el formulario — nunca al
    // cargar la página. Así un GET pasivo (un escaneo automático de enlaces,
    // el propio Gmail revisando el correo) no lo gasta antes de que la
    // persona lo use de verdad.
    const { error: errVerify } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tipo as 'invite' | 'recovery',
    })
    if (errVerify) {
      setMensajeInvalido(errVerify.code === 'otp_expired' ? MENSAJE_ENLACE_VENCIDO : MENSAJE_ENLACE_INVALIDO)
      setEstado('invalido')
      return
    }

    const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva })
    if (errUpdate) {
      setEstado('listo')
      setError('No se pudo activar la cuenta. Intenta de nuevo.')
      return
    }

    router.push(destino)
  }

  if (estado === 'invalido') {
    return (
      <Alert tone="danger" className={estilosAuth.alerta}>
        {mensajeInvalido}
      </Alert>
    )
  }

  return (
    <form action={activar} className={estilosAuth.formulario} noValidate>
      {error && (
        <Alert key={error} tone="danger" className={estilosAuth.alerta}>
          {error}
        </Alert>
      )}

      <Field label={textos.etiquetaPassword} help="Mínimo 8 caracteres.">
        <Input
          name="password"
          type={verPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          autoFocus
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

      <Field label="Confirma tu contraseña">
        <Input
          name="confirmar"
          type={verPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={estado === 'guardando'}
        icon={<ShieldCheck size={17} />}
      >
        {textos.boton}
      </Button>
    </form>
  )
}
