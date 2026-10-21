'use client'

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { MessageSquareText, PenLine, Reply, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { EstrellasLectura } from '@/components/ui/estrellas-lectura'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/input'
import { Overlay } from '@/components/ui/overlay'
import { ResumenErrores, useValidacion } from '@/components/ui/validacion'
import { TarjetaResena } from '@/components/resenas/tarjeta-resena'
import { fechaResena } from '@/lib/resenas/acciones'
import { MENSAJE_MAXIMO, formatearPromedio, revisarRespuesta } from '@/lib/resenas/resenas'
import type { ResenaGestion } from '@/lib/resenas/mapeo'
import { quitarMiRespuesta, responderResena } from '../resenas-actions'
import verificar from './verificar.module.css'
import estilos from './resenas-comercio.module.css'

/*
  LAS RESEÑAS EN LA CAJA  ·  el comercio las lee y responde
  ---------------------------------------------------------------------------
  Una tarjeta más de la página (`.tarjeta` de verificar.module.css). Reutiliza
  `TarjetaResena` del socio: aquí con el nombre COMPLETO del autor, sin
  «tuya», y con los controles de respuesta en `acciones`. No hay botón de
  borrar la reseña: el comercio no puede.

  El formulario va en un overlay, con las reglas del servidor
  (`revisarRespuesta`) envueltas para `useValidacion`. Se envía con `onSubmit`
  y no con `<form action>`, igual que el del socio: React resetearía el
  formulario tras la acción y el comercio perdería lo escrito si falla. Se
  monta de nuevo en cada apertura (`key`).
*/

const FORMULARIO_ID = 'formulario-respuesta'

const REGLAS = {
  respuesta: [
    (v: string) => {
      const r = revisarRespuesta(v)
      return r.ok ? null : r.error
    },
  ],
}
const ETIQUETAS: Record<string, string> = { respuesta: 'Tu respuesta' }

type Props = {
  total: number
  promedio: number | null
  resenas: ResenaGestion[]
}

export function ResenasComercio({ total, promedio, resenas }: Props) {
  const [abierto, setAbierto] = useState(false)
  /** La reseña a la que responde la ventana; sigue ahí mientras se anima su salida. */
  const [activa, setActiva] = useState<ResenaGestion | null>(null)
  const [vez, setVez] = useState(0)
  const [guardando, setGuardando] = useState(false)

  const [quitandoId, setQuitandoId] = useState<number | null>(null)
  const [, iniciarQuitar] = useTransition()
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const zonaRef = useRef<HTMLDivElement>(null)
  const enfocarZona = useRef(false)

  /* Tras «Quitar» el botón desaparece y el foco caería al `body`. Se espera a
     que el aviso YA esté pintado: con la zona aún vacía, `focus()` no hace
     nada (y antes se llamaba en el mismo tick del `setAviso`). */
  useEffect(() => {
    if (aviso && enfocarZona.current) {
      enfocarZona.current = false
      zonaRef.current?.focus()
    }
  }, [aviso])

  function abrir(r: ResenaGestion) {
    setAviso('')
    setErrorQuitar(null)
    setActiva(r)
    setVez((n) => n + 1)
    setAbierto(true)
  }

  function alGuardar() {
    setAbierto(false)
    setAviso(
      activa?.respuestaComercio
        ? 'Tu respuesta quedó actualizada.'
        : 'Tu respuesta quedó publicada.',
    )
  }

  function quitar(r: ResenaGestion) {
    const datos = new FormData()
    datos.set('resena_id', String(r.id))
    setAviso('')
    setErrorQuitar(null)
    setQuitandoId(r.id)
    iniciarQuitar(async () => {
      try {
        const res = await quitarMiRespuesta({}, datos)
        if (res.error) setErrorQuitar(res.error)
        else {
          enfocarZona.current = true
          setAviso('Quitaste tu respuesta.')
        }
      } catch {
        setErrorQuitar('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        setQuitandoId(null)
      }
    })
  }

  return (
    <section className={verificar.tarjeta} aria-labelledby="titulo-resenas">
      <header className={estilos.cabecera}>
        <h2 id="titulo-resenas" className={estilos.titulo}>
          Reseñas de tus clientes
        </h2>
        {total > 0 && (
          <p className={estilos.resumen}>
            <EstrellasLectura valor={promedio} tamano="md" />
            <span className={estilos.promedio} aria-hidden="true">
              {formatearPromedio(promedio)}
            </span>
            <span className={estilos.conteo}>
              {total === 1 ? '1 reseña' : `${total} reseñas`}
            </span>
          </p>
        )}
      </header>

      <div ref={zonaRef} tabIndex={-1} className={estilos.zona}>
        <p className={estilos.aviso} role="status">
          {aviso}
        </p>
        {errorQuitar && <Alert tone="danger">{errorQuitar}</Alert>}
      </div>

      {resenas.length > 0 ? (
        <>
          <ul className={estilos.lista}>
            {resenas.map((r) => (
              <li key={r.id} className={estilos.item}>
                <TarjetaResena
                  autor={r.autor}
                  estrellas={r.estrellas}
                  mensaje={r.mensaje}
                  fecha={fechaResena(r.creadaEn)}
                  respuestaComercio={r.respuestaComercio}
                  respuestaAdmin={r.respuestaAdmin}
                  acciones={
                    <div className={estilos.acciones}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={r.respuestaComercio ? <PenLine size={15} /> : <Reply size={15} />}
                        onClick={() => abrir(r)}
                        disabled={quitandoId === r.id}
                      >
                        {r.respuestaComercio ? 'Editar respuesta' : 'Responder'}
                      </Button>
                      {r.respuestaComercio && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={15} />}
                          onClick={() => quitar(r)}
                          loading={quitandoId === r.id}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
          {total > resenas.length && (
            <p className={estilos.nota}>
              Mostramos las {resenas.length} más recientes de {total}.
            </p>
          )}
        </>
      ) : (
        <EmptyState
          icon={<MessageSquareText aria-hidden="true" />}
          title="Aún no tienes reseñas"
          description="Cuando un socio califique tu comercio, lo verás aquí y podrás responderle."
        />
      )}

      <Overlay
        open={abierto}
        onClose={() => setAbierto(false)}
        title={activa?.respuestaComercio ? 'Editar tu respuesta' : 'Responder reseña'}
        description={activa ? `Respondes a ${activa.autor}. La verán todos los socios.` : undefined}
        width="520px"
        detent="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" form={FORMULARIO_ID} loading={guardando}>
              Publicar respuesta
            </Button>
          </>
        }
      >
        {activa && (
          <FormularioRespuesta
            key={vez}
            resena={activa}
            onGuardada={alGuardar}
            onPendiente={setGuardando}
          />
        )}
      </Overlay>
    </section>
  )
}

function FormularioRespuesta({
  resena,
  onGuardada,
  onPendiente,
}: {
  resena: ResenaGestion
  onGuardada: () => void
  onPendiente: (p: boolean) => void
}) {
  const v = useValidacion(REGLAS)
  const [error, setError] = useState<string | null>(null)
  const [largo, setLargo] = useState(resena.respuestaComercio?.length ?? 0)
  const [, iniciar] = useTransition()

  function alEnviar(e: FormEvent<HTMLFormElement>) {
    v.propsFormulario.onSubmit(e)
    if (e.defaultPrevented) return
    e.preventDefault()

    const datos = new FormData(e.currentTarget)
    setError(null)
    onPendiente(true)
    iniciar(async () => {
      try {
        const r = await responderResena({}, datos)
        if (r.ok) onGuardada()
        else setError(r.error ?? 'No pudimos guardar tu respuesta. Inténtalo de nuevo.')
      } catch {
        setError('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        onPendiente(false)
      }
    })
  }

  return (
    <form
      id={FORMULARIO_ID}
      className={estilos.formulario}
      {...v.propsFormulario}
      onSubmit={alEnviar}
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <ResumenErrores errores={v.errores} etiquetas={ETIQUETAS} ir={v.ir} />

      <input type="hidden" name="resena_id" value={resena.id} />

      <blockquote className={estilos.cita}>
        <EstrellasLectura valor={resena.estrellas} />
        {resena.mensaje && <p>{resena.mensaje}</p>}
      </blockquote>

      <Field
        label="Tu respuesta"
        help={`${largo} de ${MENSAJE_MAXIMO} caracteres. Sin enlaces.`}
        error={v.error('respuesta')}
      >
        <Textarea
          name="respuesta"
          rows={5}
          defaultValue={resena.respuestaComercio ?? ''}
          placeholder="Agradece, aclara o cuéntale cómo lo resolverás."
          onChange={(e) => setLargo(e.target.value.length)}
        />
      </Field>
    </form>
  )
}
