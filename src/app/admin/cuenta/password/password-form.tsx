'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input, InputButton } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import {
  LONGITUD_MINIMA,
  evaluarFortaleza,
  type NivelFortaleza,
} from '@/lib/password-fortaleza'
import { cambiarPassword, type PasswordState } from '../actions'
import styles from './password-form.module.css'

const estadoInicial: PasswordState = {}

const ETIQUETA_NIVEL: Record<NivelFortaleza, string> = {
  vacia: '',
  debil: 'Débil',
  aceptable: 'Aceptable',
  buena: 'Buena',
  excelente: 'Excelente',
}

const CLASE_NIVEL: Record<NivelFortaleza, string> = {
  vacia: '',
  debil: styles.nivelDebil,
  aceptable: styles.nivelAceptable,
  buena: styles.nivelBuena,
  excelente: styles.nivelExcelente,
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, estadoInicial)
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [ver, setVer] = useState(false)

  const fortaleza = evaluarFortaleza(password)

  // El éxito se anuncia con un toast y se limpian los campos: dejar la
  // contraseña escrita después de guardarla no aporta nada y la deja a la
  // vista de quien pase por detrás.
  const anunciado = useRef<PasswordState | null>(null)
  useEffect(() => {
    if (!state.ok || anunciado.current === state) return
    anunciado.current = state

    toast({
      tone: 'success',
      title: 'Contraseña actualizada',
      description: 'Úsala la próxima vez que inicies sesión.',
    })
    setPassword('')
    setConfirmar('')
  }, [state, toast])

  // Solo se avisa de que no coinciden cuando ya se escribió algo en el segundo
  // campo: marcarlo desde la primera tecla sería regañar por adelantado.
  const noCoinciden = confirmar.length > 0 && password !== confirmar

  return (
    <Card padding="lg" className={styles.tarjeta}>
      <form action={formAction} className={styles.formulario} noValidate>
        <Field
          label="Nueva contraseña"
          help={`Mínimo ${LONGITUD_MINIMA} caracteres.`}
          error={state.error}
        >
          <Input
            name="password"
            type={ver ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            endAdornment={
              <InputButton
                label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                onClick={() => setVer((v) => !v)}
              >
                {ver ? <EyeOff size={17} /> : <Eye size={17} />}
              </InputButton>
            }
          />
        </Field>

        {fortaleza.nivel !== 'vacia' && (
          <div className={`${styles.medidor} ${CLASE_NIVEL[fortaleza.nivel]}`}>
            <div className={styles.segmentos} aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={styles.segmento}
                  data-lleno={i < fortaleza.puntuacion}
                />
              ))}
            </div>

            <p className={styles.leyenda}>
              <span className={styles.nivel}>{ETIQUETA_NIVEL[fortaleza.nivel]}</span>
              {fortaleza.mensaje && (
                <span className={styles.consejo}>{fortaleza.mensaje}</span>
              )}
            </p>
          </div>
        )}

        <Field
          label="Confirmar nueva contraseña"
          error={noCoinciden ? 'Las contraseñas no coinciden.' : undefined}
        >
          <Input
            name="confirmar"
            type={ver ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            // El interruptor vive en el primer campo y afecta a los dos: dos
            // ojos independientes invitarían a dejar uno visible sin querer.
          />
        </Field>

        <div className={styles.acciones}>
          <Button
            type="submit"
            loading={pending}
            disabled={!fortaleza.cumpleMinimo || noCoinciden}
            icon={<ShieldCheck size={16} />}
          >
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Card>
  )
}
