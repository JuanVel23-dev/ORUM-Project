'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { MessageSquareText, PenLine, Reply, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { EstrellasLectura } from '@/components/ui/estrellas-lectura'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/modal'
import { Overlay } from '@/components/ui/overlay'
import { ResumenErrores, useValidacion } from '@/components/ui/validacion'
import { TarjetaResena } from '@/components/resenas/tarjeta-resena'
import { fechaResena } from '@/lib/resenas/acciones'
import { MENSAJE_MAXIMO, formatearPromedio, revisarRespuesta } from '@/lib/resenas/resenas'
import type { ResenaGestion } from '@/lib/resenas/mapeo'
import { eliminarResena, quitarRespuestaAdmin, responderComoAdmin } from '../../resenas-actions'
import estilos from './resenas-admin.module.css'

/*
  LAS RESEÑAS EN LA FICHA DEL COMERCIO  ·  moderación del super administrador
  ---------------------------------------------------------------------------
  Misma pieza que la caja del comercio (`ResenasComercio`) pero con el nombre
  completo, la respuesta del comercio SOLO LECTURA, la de ORUM editable y un
  «Eliminar» que borra para siempre (por eso pasa por una confirmación).
  El formulario va en un overlay con `useValidacion` y se envía con
  `onSubmit` + `key` por apertura, como el del comercio: no perder lo escrito
  si el servidor rechaza.
*/

const FORMULARIO_ID = 'formulario-respuesta-orum'

const REGLAS = {
  respuesta: [
    (v: string) => {
      const r = revisarRespuesta(v)
      return r.ok ? null : r.error
    },
  ],
}
const ETIQUETAS: Record<string, string> = { respuesta: 'Respuesta de ORUM' }

type Props = {
  comercioId: number
  total: number
  promedio: number | null
  resenas: ResenaGestion[]
}

export function ResenasAdmin({ comercioId, total, promedio, resenas }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [activa, setActiva] = useState<ResenaGestion | null>(null)
  const [vez, setVez] = useState(0)
  const [guardando, setGuardando] = useState(false)

  const [ocupadaId, setOcupadaId] = useState<number | null>(null)
  const [porEliminar, setPorEliminar] = useState<ResenaGestion | null>(null)
  const [, iniciar] = useTransition()
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const zonaRef = useRef<HTMLDivElement>(null)

  function abrir(r: ResenaGestion) {
    setAviso('')
    setErrorAccion(null)
    setActiva(r)
    setVez((n) => n + 1)
    setAbierto(true)
  }

  function alGuardar() {
    setAbierto(false)
    setAviso(
      activa?.respuestaAdmin
        ? 'La respuesta de ORUM quedó actualizada.'
        : 'La respuesta de ORUM quedó publicada.',
    )
  }

  function ejecutar(
    r: ResenaGestion,
    accion: typeof quitarRespuestaAdmin,
    exito: string,
    alTerminar?: () => void,
  ) {
    const datos = new FormData()
    datos.set('resena_id', String(r.id))
    datos.set('comercio_id', String(comercioId))
    setAviso('')
    setErrorAccion(null)
    setOcupadaId(r.id)
    iniciar(async () => {
      try {
        const res = await accion({}, datos)
        if (res.error) setErrorAccion(res.error)
        else {
          setAviso(exito)
          zonaRef.current?.focus()
        }
      } catch {
        setErrorAccion('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        setOcupadaId(null)
        alTerminar?.()
      }
    })
  }

  return (
    <div>
      <header className={estilos.cabecera}>
        <h2 id="titulo-resenas" className={estilos.titulo}>
          Reseñas
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
        {errorAccion && <Alert tone="danger">{errorAccion}</Alert>}
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
                        icon={r.respuestaAdmin ? <PenLine size={15} /> : <Reply size={15} />}
                        onClick={() => abrir(r)}
                        disabled={ocupadaId === r.id}
                      >
                        {r.respuestaAdmin ? 'Editar respuesta de ORUM' : 'Responder como ORUM'}
                      </Button>
                      {r.respuestaAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            ejecutar(r, quitarRespuestaAdmin, 'Quitaste la respuesta de ORUM.')
                          }
                          disabled={ocupadaId === r.id}
                        >
                          Quitar respuesta
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={15} />}
                        onClick={() => setPorEliminar(r)}
                        disabled={ocupadaId === r.id}
                      >
                        Eliminar
                      </Button>
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={<MessageSquareText aria-hidden="true" />}
          title="Este comercio aún no tiene reseñas"
          description="Cuando un socio califique este comercio, lo verás aquí y podrás moderarlo."
        />
      )}

      <Overlay
        open={abierto}
        onClose={() => setAbierto(false)}
        title={activa?.respuestaAdmin ? 'Editar respuesta de ORUM' : 'Responder como ORUM'}
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
            comercioId={comercioId}
            resena={activa}
            onGuardada={alGuardar}
            onPendiente={setGuardando}
          />
        )}
      </Overlay>

      {/* Borra la reseña de la base: no se puede deshacer, así que se confirma. */}
      <ConfirmDialog
        open={porEliminar !== null}
        onClose={() => setPorEliminar(null)}
        onConfirm={() => {
          if (porEliminar)
            ejecutar(porEliminar, eliminarResena, 'La reseña se eliminó.', () =>
              setPorEliminar(null),
            )
        }}
        title="¿Eliminar esta reseña?"
        description={
          porEliminar
            ? `Se borrará para siempre la reseña de ${porEliminar.autor}, con las respuestas que tenga. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar para siempre"
        destructive
        loading={ocupadaId !== null && porEliminar !== null && ocupadaId === porEliminar.id}
      />
    </div>
  )
}

function FormularioRespuesta({
  comercioId,
  resena,
  onGuardada,
  onPendiente,
}: {
  comercioId: number
  resena: ResenaGestion
  onGuardada: () => void
  onPendiente: (p: boolean) => void
}) {
  const v = useValidacion(REGLAS)
  const [error, setError] = useState<string | null>(null)
  const [largo, setLargo] = useState(resena.respuestaAdmin?.length ?? 0)
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
        const r = await responderComoAdmin({}, datos)
        if (r.ok) onGuardada()
        else setError(r.error ?? 'No pudimos guardar la respuesta. Inténtalo de nuevo.')
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
      <input type="hidden" name="comercio_id" value={comercioId} />

      <blockquote className={estilos.cita}>
        <EstrellasLectura valor={resena.estrellas} />
        {resena.mensaje && <p>{resena.mensaje}</p>}
      </blockquote>

      <Field
        label="Respuesta de ORUM"
        help={`${largo} de ${MENSAJE_MAXIMO} caracteres. Sin enlaces.`}
        error={v.error('respuesta')}
      >
        <Textarea
          name="respuesta"
          rows={5}
          defaultValue={resena.respuestaAdmin ?? ''}
          placeholder="Aclara, agradece o explica qué hará ORUM."
          onChange={(e) => setLargo(e.target.value.length)}
        />
      </Field>
    </form>
  )
}
