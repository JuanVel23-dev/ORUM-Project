'use client'

import { useRef, useState, useTransition } from 'react'
import { PenLine, Star, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Overlay } from '@/components/ui/overlay'
import { borrarMiResena } from '@/app/miembros/(portal)/comercios/resenas-actions'
import { FORMULARIO_RESENA_ID, FormularioResena } from './formulario-resena'
import { TarjetaResena } from './tarjeta-resena'
import estilos from './seccion-resenas.module.css'

/*
  LO DEL SOCIO EN LA SECCIÓN DE RESEÑAS  ·  cliente
  ---------------------------------------------------------------------------
  El botón «Escribir reseña» / «Editar mi reseña» (solo si `puedeResenar`),
  la tarjeta propia destacada con «Borrar», las dos ventanas y una región
  `role="status"` que dice en voz alta (y a la vista) qué pasó: la ventana se
  cierra al guardar y, sin ese aviso, un lector de pantalla no se enteraría
  de que la reseña quedó publicada.

  «Borrar» se ofrece aunque `puedeResenar` sea falso: el socio con la
  membresía vencida puede quitar la suya (spec).

  ── Por qué la confirmación no lleva `title` ────────────────────────────────
  `Modal` nombra su título con un id fijo (`modal-titulo`) y las dos ventanas
  viven montadas a la vez (un `<dialog>` cerrado sigue en el DOM): con dos
  títulos, la confirmación se habría llamado como la ventana del formulario.
  Lleva `ariaLabel` y pinta su pregunta dentro.
*/

type ResenaPropia = {
  estrellas: number
  mensaje: string | null
  fecha: string
  respuestaComercio: string | null
  respuestaAdmin: string | null
}

type Props = {
  comercioId: number
  comercioNombre?: string
  puedeResenar: boolean
  resena: ResenaPropia | null
}

export function MiResena({ comercioId, comercioNombre, puedeResenar, resena }: Props) {
  const [abierto, setAbierto] = useState(false)
  /** Cada apertura monta el formulario de nuevo: arranca de lo guardado. */
  const [vez, setVez] = useState(0)
  const [guardando, setGuardando] = useState(false)

  const [confirmando, setConfirmando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null)
  const [borrando, iniciarBorrado] = useTransition()

  const [aviso, setAviso] = useState('')
  const zonaRef = useRef<HTMLDivElement>(null)
  const enfocarAlCerrar = useRef(false)

  const editando = resena !== null

  function abrir() {
    setAviso('')
    setVez((n) => n + 1)
    setAbierto(true)
  }

  function alGuardar() {
    setAbierto(false)
    setAviso(editando ? 'Tu reseña quedó actualizada.' : 'Tu reseña quedó publicada. ¡Gracias!')
  }

  function enfocarTrasCerrar() {
    if (!enfocarAlCerrar.current) return
    enfocarAlCerrar.current = false
    const zona = zonaRef.current
    ;(zona?.querySelector<HTMLElement>('[data-resenar]') ?? zona)?.focus()
  }

  function borrar() {
    const datos = new FormData()
    datos.set('comercio_id', String(comercioId))
    setErrorBorrar(null)
    iniciarBorrado(async () => {
      try {
        const r = await borrarMiResena({}, datos)
        if (!r) return
        if (r.error) {
          setErrorBorrar(r.error)
          return
        }
        /* El botón «Borrar» desaparece con la tarjeta y el navegador, al
           cerrar la ventana, devolvería el foco a un botón que ya no está.
           Se lleva al botón de escribir (o a esta zona) cuando la ventana
           YA cerró: ver `enfocarTrasCerrar`. */
        enfocarAlCerrar.current = true
        setConfirmando(false)
        setAviso('Borraste tu reseña.')
      } catch {
        setErrorBorrar('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.')
      }
    })
  }

  if (!puedeResenar && !resena && !aviso) return null

  return (
    <div className={estilos.mia} ref={zonaRef} tabIndex={-1}>
      {/* Siempre montado, también el `role="status"`: una región viva que
          nace ya con su texto no se anuncia. Vacío, el CSS lo saca del flujo
          sin quitarlo del árbol de accesibilidad. */}
      <div className={estilos.acciones}>
        {puedeResenar && (
          <Button
            data-resenar=""
            variant={editando ? 'secondary' : 'primary'}
            icon={editando ? <PenLine size={16} /> : <Star size={16} />}
            onClick={abrir}
          >
            {editando ? 'Editar mi reseña' : 'Escribir reseña'}
          </Button>
        )}
        <p className={estilos.aviso} role="status">
          {aviso}
        </p>
      </div>

      {resena && (
        <div className={estilos.propia}>
          <div className={estilos.propiaCabeza}>
            <p className={estilos.propiaEtiqueta}>Tu reseña</p>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={15} />}
              onClick={() => {
                setErrorBorrar(null)
                setConfirmando(true)
              }}
            >
              Borrar
            </Button>
          </div>
          <TarjetaResena autor="Tú" {...resena} />
        </div>
      )}

      {puedeResenar && (
        <Overlay
          open={abierto}
          onClose={() => setAbierto(false)}
          title={editando ? 'Editar tu reseña' : 'Escribe tu reseña'}
          description={
            comercioNombre
              ? `Cuéntales a otros socios cómo te fue en ${comercioNombre}.`
              : 'Cuéntales a otros socios cómo te fue.'
          }
          width="520px"
          detent="large"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAbierto(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" form={FORMULARIO_RESENA_ID} loading={guardando}>
                {editando ? 'Guardar cambios' : 'Publicar reseña'}
              </Button>
            </>
          }
        >
          <FormularioResena
            key={vez}
            comercioId={comercioId}
            inicial={resena ? { estrellas: resena.estrellas, mensaje: resena.mensaje } : null}
            onGuardada={alGuardar}
            onPendiente={setGuardando}
          />
        </Overlay>
      )}

      {/* Siempre montada: al borrar, la tarjeta desaparece con la respuesta
          del servidor y la ventana tiene que poder cerrarse animada. */}
      <Modal
        open={confirmando}
        onClose={() => {
          if (!borrando) setConfirmando(false)
        }}
        ariaLabel="¿Borrar tu reseña?"
        onClosed={enfocarTrasCerrar}
        width="420px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmando(false)} disabled={borrando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={borrar} loading={borrando}>
              Borrar reseña
            </Button>
          </>
        }
      >
        <div className={estilos.confirmar}>
          <p className={estilos.confirmarTitulo}>¿Borrar tu reseña?</p>
          <p className={estilos.confirmarTexto}>
            Se borran tus estrellas, tu mensaje y las respuestas que tenga. Podrás escribir otra
            después.
          </p>
          {errorBorrar && <Alert tone="danger">{errorBorrar}</Alert>}
        </div>
      </Modal>
    </div>
  )
}
