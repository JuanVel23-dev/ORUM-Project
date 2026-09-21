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
import { interpretarEnlaceActivacion, MENSAJE_ENLACE_INVALIDO, textosActivacion } from '@/lib/auth/activacion'

type Estado = 'verificando' | 'listo' | 'invalido' | 'guardando'

const DESTINO_POR_ROL: Record<string, string> = {
  staff: '/admin',
  comercio: '/comercios',
}

export function ActivarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destino = DESTINO_POR_ROL[searchParams.get('rol') ?? ''] ?? '/miembros'
  const textos = textosActivacion(searchParams.get('modo') ?? undefined)

  const [estado, setEstado] = useState<Estado>('verificando')
  const [error, setError] = useState('')
  const [mensajeInvalido, setMensajeInvalido] = useState(MENSAJE_ENLACE_INVALIDO)
  const [verPassword, setVerPassword] = useState(false)

  // Chequeo único al montar (no una suscripción a store externo): confirma que
  // el enlace de invitación dejó una sesión válida antes de mostrar el formulario.
  // La URL se lee ANTES de crear el cliente: supabase-js consume y limpia el hash
  // al inicializar. Solo una URL con credenciales prueba algo; una sesión previa
  // del navegador, por sí sola, no.
  useEffect(() => {
    const enlace = interpretarEnlaceActivacion(window.location.hash, window.location.search)
    const resolver: Promise<{ estado: Estado; mensaje?: string }> =
      enlace.tipo === 'con-credenciales'
        ? createClient()
            .auth.getSession()
            .then(({ data }) => ({ estado: data.session ? 'listo' : 'invalido' }))
        : Promise.resolve({
            estado: 'invalido',
            mensaje: enlace.tipo === 'error' ? enlace.mensaje : undefined,
          })
    resolver.then((r) => {
      if (r.mensaje) setMensajeInvalido(r.mensaje)
      setEstado(r.estado)
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
