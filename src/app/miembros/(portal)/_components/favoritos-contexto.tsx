'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { alternarFavorito } from '../actions'

/*
  EL ESTADO DE FAVORITOS ES UNO SOLO PARA TODA LA PANTALLA.
  ---------------------------------------------------------------------------
  Y esto no es arquitectura por gusto: un mismo comercio puede salir a la vez en
  la portada, en "Tus favoritos", en "Los que más usas", en una estantería y en
  la rejilla. Con estado local por botón, el socio llena un corazón y ve los
  otros cuatro seguir vacíos. Sería indistinguible de un fallo de guardado.

  Con un único store: se toca uno, se llenan los cinco en el mismo fotograma, y
  si el servidor falla se vacían los cinco a la vez.

  COSTE EN CLIENTE: casi cero. El proveedor recibe el árbol del catálogo por
  `children`, así que todo ese contenido SE SIGUE RENDERIZANDO EN EL SERVIDOR y
  no se hidrata. Lo único que viaja al navegador es este archivo y el botón.
  Es el patrón de "empujar `'use client'` lo más abajo posible" llevado al caso
  en que la pieza que necesita estado envuelve, pero no posee, lo de dentro.
*/

type ContextoFavoritos = {
  esFavorito: (comercioId: number) => boolean
  alternar: (comercioId: number) => void
  /** `true` mientras la ida y vuelta de ESE comercio está en curso. */
  enCurso: (comercioId: number) => boolean
  /** Mensaje del último fallo de ESE comercio, o `null`. Se limpia al reintentar. */
  fallo: (comercioId: number) => string | null
}

const Contexto = createContext<ContextoFavoritos | null>(null)

/**
 * Se usa desde el botón. Devuelve `null` si no hay proveedor en lugar de
 * lanzar: así una tarjeta reutilizada fuera del catálogo —la ficha, un futuro
 * buscador— se pinta sin corazón en vez de romper la pantalla entera.
 */
export function useFavoritos(): ContextoFavoritos | null {
  return useContext(Contexto)
}

export function FavoritosProvider({
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
  const [, startTransition] = useTransition()

  /*
    ESPEJO EN UN REF, y es necesario, no un atajo.

    Para saber si el toque MARCA o DESMARCA hay que leer el estado actual de
    forma síncrona, dentro del manejador. Hacerlo desde el actualizador de
    `setIds` no vale: React puede invocarlo más tarde y, en modo estricto, lo
    invoca DOS VECES — un "deseado" calculado ahí dentro sale invertido la mitad
    de las veces en desarrollo y el corazón se queda al revés.
  */
  const idsRef = useRef<Set<number>>(new Set(inicial))

  const aplicar = useCallback((siguiente: Set<number>) => {
    idsRef.current = siguiente
    setIds(siguiente)
  }, [])

  const alternar = useCallback(
    (comercioId: number) => {
      const deseado = !idsRef.current.has(comercioId)

      /*
        EL CAMBIO OPTIMISTA VA PRIMERO, en el mismo tick del gesto. Nada de
        esperar a la ida y vuelta: el encargo lo pide literalmente y es además
        la regla de la dirección de arte —responder ya, no cuando el servidor
        conteste—.
      */
      const siguiente = new Set(idsRef.current)
      if (deseado) siguiente.add(comercioId)
      else siguiente.delete(comercioId)
      aplicar(siguiente)

      setPendientes((previos) => new Set(previos).add(comercioId))
      setFallos((previos) => {
        if (!(comercioId in previos)) return previos
        const limpio = { ...previos }
        delete limpio[comercioId]
        return limpio
      })

      startTransition(async () => {
        const resultado = await alternarFavorito(comercioId, deseado)

        setPendientes((previos) => {
          const restantes = new Set(previos)
          restantes.delete(comercioId)
          return restantes
        })

        const confirmado = new Set(idsRef.current)

        if (resultado.ok) {
          /*
            Se reconcilia con lo que el servidor dice que quedó, no con lo que
            se supuso. Hoy coinciden siempre; el día que la acción decida algo
            distinto —un tope de favoritos, por ejemplo— la pantalla no mentirá.
          */
          if (resultado.favorito) confirmado.add(comercioId)
          else confirmado.delete(comercioId)
          aplicar(confirmado)
          return
        }

        /* Falló: se revierte y SE DICE. Revertir en silencio es peor que no
           revertir, porque el socio se queda creyendo que guardó. */
        if (deseado) confirmado.delete(comercioId)
        else confirmado.add(comercioId)
        aplicar(confirmado)
        setFallos((previos) => ({ ...previos, [comercioId]: resultado.mensaje }))
      })
    },
    [aplicar],
  )

  const valor = useMemo<ContextoFavoritos>(
    () => ({
      esFavorito: (id) => ids.has(id),
      alternar,
      enCurso: (id) => pendientes.has(id),
      fallo: (id) => fallos[id] ?? null,
    }),
    [ids, pendientes, fallos, alternar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
