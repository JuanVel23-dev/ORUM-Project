'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, InputButton } from '@/components/ui/input'
import { estilosAuth } from '@/components/ui/pantalla-auth'
import { createClient } from '@/lib/supabase/client'

type Estado = 'verificando' | 'listo' | 'invalido' | 'guardando'

export function ActivarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destino = searchParams.get('rol') === 'staff' ? '/admin' : '/miembros'

  const [estado, setEstado] = useState<Estado>('verificando')
  const [error, setError] = useState('')
  const [verPassword, setVerPassword] = useState(false)

  // Chequeo único al montar (no una suscripción a store externo): confirma que
  // el enlace de invitación dejó una sesión válida antes de mostrar el formulario.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setEstado(data.session ? 'listo' : 'invalido')
    })
  }, [])

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

    setEstado('guardando')
    setError('')

    const supabase = createClient()
    const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva })
    if (errUpdate) {
      setEstado('listo')
      setError('No se pudo activar la cuenta. Intenta de nuevo.')
      return
    }

    router.push(destino)
  }

  if (estado === 'verificando') {
    return <p className={estilosAuth.formulario}>Verificando el enlace…</p>
  }

  if (estado === 'invalido') {
    return (
      <Alert tone="danger" className={estilosAuth.alerta}>
        Este enlace no es válido o ya expiró. Pide que te envíen uno nuevo.
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

      <Field label="Elige tu contraseña" help="Mínimo 8 caracteres.">
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
        Activar cuenta
      </Button>
    </form>
  )
}
