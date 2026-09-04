'use client'

import { useEffect, useState, type FocusEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, InputButton } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { estilosAuth } from '@/components/ui/pantalla-auth'
import { createClient } from '@/lib/supabase/client'

type Estado = 'verificando' | 'listo' | 'invalido' | 'guardando'

/** A dónde entra el usuario una vez activada la cuenta. */
const DESTINO_POR_ROL: Record<string, string> = {
  staff: '/admin',
  comercio: '/comercios',
}

/**
 * A dónde se le manda cuando el enlace ya no sirve.
 *
 * Un enlace caducado sin salida es un callejón, y esta pantalla lo era: un
 * aviso rojo y nada más. No hay ninguna acción que el usuario pueda ejecutar
 * aquí que resuelva el problema, así que la salida es un enlace secundario y
 * NO una acción principal: un botón grande que no arregla nada es peor que
 * ninguno.
 */
const LOGIN_POR_ROL: Record<string, string> = {
  staff: '/login',
  comercio: '/comercios/login',
}

type Errores = {
  password?: string
  confirmar?: string
  global?: string
}

export function ActivarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rol = searchParams.get('rol') ?? ''
  const destino = DESTINO_POR_ROL[rol] ?? '/miembros'
  const login = LOGIN_POR_ROL[rol] ?? '/miembros/login'

  const [estado, setEstado] = useState<Estado>('verificando')
  const [errores, setErrores] = useState<Errores>({})
  const [verPassword, setVerPassword] = useState(false)

  // Chequeo único al montar (no una suscripción a store externo): confirma que
  // el enlace de invitación dejó una sesión válida antes de mostrar el formulario.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setEstado(data.session ? 'listo' : 'invalido')
    })
  }, [])

  /*
    Los dos errores de contraseña son de CLIENTE y aquí sí sabemos cuál campo
    falló, así que el mensaje va AL CAMPO —`Field` ya lo cablea con
    `aria-describedby` y `aria-invalid`— en vez de al banner global. En los
    accesos por credenciales se queda el banner porque el servidor devuelve una
    frase y no dice qué campo la causó.
  */
  async function activar(formData: FormData) {
    const nueva = String(formData.get('password') ?? '')
    const repetida = String(formData.get('confirmar') ?? '')

    if (nueva.length < 8) {
      setErrores({ password: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }
    if (nueva !== repetida) {
      setErrores({ confirmar: 'Las contraseñas no coinciden.' })
      return
    }

    setErrores({})
    setEstado('guardando')

    const supabase = createClient()
    const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva })
    if (errUpdate) {
      setEstado('listo')
      setErrores({ global: 'No se pudo activar la cuenta. Vuelve a intentarlo.' })
      return
    }

    router.push(destino)
  }

  /*
    La confirmación se revisa AL SALIR del campo, no solo al enviar.

    Con el teclado abierto en una pantalla de 667px, un error que aparece al
    enviar empuja el botón fuera de la vista justo cuando el usuario lo está
    buscando. Al validar en el blur, el desplazamiento ocurre mientras todavía
    mira ese campo. No se llama a `scrollIntoView`: mover la vista bajo los
    dedos de quien escribe es peor que un desplazamiento voluntario.
  */
  function revisarConfirmacion(evento: FocusEvent<HTMLInputElement>) {
    const repetida = evento.currentTarget.value
    const formulario = evento.currentTarget.form
    if (!formulario || !repetida) return

    const nueva = String(new FormData(formulario).get('password') ?? '')
    setErrores((previos) => ({
      ...previos,
      confirmar: nueva === repetida ? undefined : 'Las contraseñas no coinciden.',
    }))
  }

  /*
    Antes era un `<p>Verificando el enlace…</p>` suelto, el estado más pobre de
    las seis pantallas. Ahora reserva la altura del formulario al que va a
    sustituir para que la tarjeta no salte al resolverse, y se anuncia: sin
    `role="status"` un lector de pantalla no dice nada mientras se comprueba.
  */
  if (estado === 'verificando') {
    return (
      <div className={estilosAuth.cargando} role="status" aria-live="polite">
        <Spinner size="md" label={null} />
        <p>Comprobando tu enlace…</p>
      </div>
    )
  }

  if (estado === 'invalido') {
    return (
      // `pila`, no `formulario`: la sacudida es para un envío fallido. Este
      // enlace llega ya roto y sacudir al aterrizar regaña al usuario por algo
      // que no hizo.
      <div className={estilosAuth.pila}>
        <Alert tone="danger" className={estilosAuth.alerta}>
          Este enlace no es válido o ya expiró. Pide uno nuevo a quien te invitó y
          vuelve a intentarlo.
        </Alert>

        <Button href={login} variant="secondary" size="lg" fullWidth>
          Ir a iniciar sesión
        </Button>
      </div>
    )
  }

  return (
    <form action={activar} className={estilosAuth.formulario} noValidate>
      {/*
        La sacudida la dispara el CSS con `:has(.alerta)`. NO se pone `key` en
        el <form>: eso lo remontaría y borraría lo ya tecleado.
      */}
      {errores.global && (
        <Alert key={errores.global} tone="danger" className={estilosAuth.alerta}>
          {errores.global}
        </Alert>
      )}

      <Field
        label="Elige tu contraseña"
        help="Mínimo 8 caracteres."
        error={errores.password ?? null}
      >
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

      <Field label="Confirma tu contraseña" error={errores.confirmar ?? null}>
        <Input
          name="confirmar"
          type={verPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          /*
            Con la submisión implícita, el usuario NUNCA necesita alcanzar el
            botón: envía desde el teclado. Es el arreglo real al botón que
            queda bajo el teclado en 667px, y cuesta un atributo.
          */
          enterKeyHint="done"
          onBlur={revisarConfirmacion}
        />
      </Field>

      <Button
        type="submit"
        variant="brand"
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
