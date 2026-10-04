'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Heart } from 'lucide-react'
import { toque } from '@/lib/shared/haptica'
import { alternarFavorito } from '@/app/miembros/(portal)/actions'
import estilos from './favoritos.module.css'

/*
  FAVORITOS DEL SOCIO  ·  el corazón del directorio (30/09/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «darle corazón a los comercios favoritos… con una
  animación si lo pulso», y un filtro para ver solo los favoritos.

  La base ya estaba (`favoritos`, con RLS por socio) y la acción también
  (`alternarFavorito`: el `miembro_id` sale de la sesión, nunca del cliente,
  y recibe el estado DESEADO, así que es idempotente). Esto recupera el
  corazón del catálogo anterior (commit 77f750d) para el directorio nuevo.

  ESTADO ÚNICO PARA TODA LA PANTALLA (`ProveedorFavoritos`): el mismo
  comercio no puede verse marcado en un sitio y vacío en otro. OPTIMISTA: el
  corazón se llena en el mismo instante del toque; si el servidor falla, se
  vacía y SE DICE — revertir en silencio deja al socio creyendo que guardó.

  EL CORAZÓN NO ESTÁ DENTRO DEL ENLACE de la tarjeta: es su hermano, montado
  encima con `position: absolute`. Un `<button>` dentro de un `<a>` es
  marcado inválido y, sin JavaScript aún hidratado, el toque navegaría.
*/

type ContextoFavoritos = {
  /** Los favoritos de ahora mismo (optimistas incluidos). */
  ids: ReadonlySet<number>
  esFavorito: (comercioId: number) => boolean
  alternar: (comercioId: number) => void
  enCurso: (comercioId: number) => boolean
  fallo: (comercioId: number) => string | null
  /** Cuántas veces se ha MARCADO en esta visita: cada una repite el latido. */
  latidos: (comercioId: number) => number
}

const Contexto = createContext<ContextoFavoritos | null>(null)

export function ProveedorFavoritos({
  /** Los ids que el servidor leyó de `favoritos` para este socio. */
  inicial,
  children,
}: {
  inicial: number[]
  children: ReactNode
}) {
  const [ids, setIds] = useState<ReadonlySet<number>>(() => new Set(inicial))
  const [pendientes, setPendientes] = useState<ReadonlySet<number>>(() => new Set<number>())
  const [fallos, setFallos] = useState<Readonly<Record<number, string>>>({})
  const [cuenta, setCuenta] = useState<Readonly<Record<number, number>>>({})
  const [, startTransition] = useTransition()

  /*
    Espejo en un ref: para saber si el toque MARCA o DESMARCA hay que leer el
    estado actual de forma síncrona. Calcularlo dentro del actualizador de
    `setIds` sale invertido en modo estricto, que lo invoca dos veces.
  */
  const idsRef = useRef<Set<number>>(new Set(inicial))

  const aplicar = useCallback((siguiente: Set<number>) => {
    idsRef.current = siguiente
    setIds(siguiente)
  }, [])

  const alternar = useCallback(
    (comercioId: number) => {
      const deseado = !idsRef.current.has(comercioId)

      // El cambio optimista va primero, en el mismo tick del gesto.
      const siguiente = new Set(idsRef.current)
      if (deseado) siguiente.add(comercioId)
      else siguiente.delete(comercioId)
      aplicar(siguiente)

      if (deseado) setCuenta((c) => ({ ...c, [comercioId]: (c[comercioId] ?? 0) + 1 }))
      setPendientes((p) => new Set(p).add(comercioId))
      setFallos((f) => {
        if (!(comercioId in f)) return f
        const limpio = { ...f }
        delete limpio[comercioId]
        return limpio
      })

      startTransition(async () => {
        const resultado = await alternarFavorito(comercioId, deseado)

        setPendientes((p) => {
          const restantes = new Set(p)
          restantes.delete(comercioId)
          return restantes
        })

        const confirmado = new Set(idsRef.current)
        if (resultado.ok) {
          // Se reconcilia con lo que el servidor dice que quedó.
          if (resultado.favorito) confirmado.add(comercioId)
          else confirmado.delete(comercioId)
          aplicar(confirmado)
          return
        }

        if (deseado) confirmado.delete(comercioId)
        else confirmado.add(comercioId)
        aplicar(confirmado)
        setFallos((f) => ({ ...f, [comercioId]: resultado.mensaje }))
      })
    },
    [aplicar],
  )

  const valor = useMemo<ContextoFavoritos>(
    () => ({
      ids,
      esFavorito: (id) => ids.has(id),
      alternar,
      enCurso: (id) => pendientes.has(id),
      fallo: (id) => fallos[id] ?? null,
      latidos: (id) => cuenta[id] ?? 0,
    }),
    [ids, pendientes, fallos, cuenta, alternar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** El estado de favoritos de la pantalla, o `null` fuera del proveedor (la fachada). */
export function useFavoritos(): ContextoFavoritos | null {
  return useContext(Contexto)
}

/** Los seis puntos del estallido, repartidos en círculo. */
const CHISPAS = [0, 60, 120, 180, 240, 300]

export function BotonFavorito({
  comercioId,
  nombre,
  className,
}: {
  comercioId: number
  /** Para la etiqueta: «Guardar Casa Duarte en tus favoritos». */
  nombre: string
  className?: string
}) {
  const favoritos = useContext(Contexto)
  // Sin proveedor no hay corazón: mejor una tarjeta sin acción que una rota.
  if (!favoritos) return null

  const marcado = favoritos.esFavorito(comercioId)
  const latidos = favoritos.latidos(comercioId)
  const fallo = favoritos.fallo(comercioId)
  /* El latido solo existe si ESTA visita lo marcó: los que ya venían
     marcados de la base no laten al pintar la página. */
  const latiendo = marcado && latidos > 0

  return (
    <span className={[estilos.marco, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={estilos.boton}
        /* Interruptor de dos estados sobre una acción: `aria-pressed`. La
           etiqueta dice qué hace el toque, no cómo está. */
        aria-pressed={marcado}
        aria-label={
          marcado ? `Quitar ${nombre} de tus favoritos` : `Guardar ${nombre} en tus favoritos`
        }
        data-marcado={marcado || undefined}
        data-en-curso={favoritos.enCurso(comercioId) || undefined}
        // Respuesta en `pointerdown` (háptica); el cambio, en `click`, que
        // también dispara el teclado.
        onPointerDown={() => toque()}
        onClick={(e) => {
          e.stopPropagation()
          favoritos.alternar(comercioId)
        }}
      >
        {/* `key`: cada vez que se marca, el dibujo se monta de nuevo y la
            animación vuelve a empezar desde cero. */}
        <span key={latidos} className={estilos.dibujo} data-latiendo={latiendo || undefined}>
          <Heart
            className={estilos.icono}
            aria-hidden="true"
            /* Contorno vacío frente a corazón sólido: la FORMA dice el
               estado, no solo el color. */
            fill={marcado ? 'currentColor' : 'none'}
            strokeWidth={marcado ? 1.75 : 2}
          />
          {latiendo && (
            <>
              <span className={estilos.anillo} aria-hidden="true" />
              {CHISPAS.map((angulo, i) => (
                <span
                  key={angulo}
                  className={estilos.chispa}
                  data-oro={i % 2 === 1 || undefined}
                  style={{ '--angulo': `${angulo}deg` } as CSSProperties}
                  aria-hidden="true"
                />
              ))}
            </>
          )}
        </span>
      </button>

      {/* El fallo se dice: a la vista, sin mover la tarjeta, y al lector. */}
      {fallo && (
        <span className={estilos.fallo} role="status">
          {fallo}
        </span>
      )}
    </span>
  )
}
