'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, LayoutGrid } from 'lucide-react'
import { Agitar } from '@/components/ui/agitar'
import { Button } from '@/components/ui/button'
import { IconoCategoria } from '@/components/ui/icono-categoria'
import { Overlay } from '@/components/ui/overlay'
import estilos from './categorias-directorio.module.css'

/*
  LAS CATEGORÍAS  ·  un botón que abre una ventana con todas
  ---------------------------------------------------------------------------
  Nació en el directorio del Portal Público (encargo del propietario: las
  quince categorías ya no ocupan el panel antes de los comercios) y se
  compartió con el catálogo del Portal de Miembros, que hasta entonces filtraba
  con una fila de chips en línea — dos lenguajes distintos para la misma
  tarea. Vive en `src/components/comercios/` y no en la ruta del público
  porque ahora lo consumen los dos: `CLAUDE.md` reserva las rutas para lo que
  solo usa esa ruta.

  Hay un botón «Categorías», junto a Ciudad y Ordenar (o solo), y al tocarlo se
  abre una ventana con todas: diálogo centrado en escritorio, hoja inferior en
  móvil (el `Overlay` del sistema decide).

  ES SEGURO EN LOS DOS TEMAS a propósito, a diferencia de la mayoría de lo que
  vive bajo `(publico)`: el Portal Público fuerza claro, pero el Portal de
  Miembros sostiene los dos. Por eso el glifo seleccionado y el filo del
  disparador usan `--text` y `--border-subtle` — semánticos que SÍ cambian de
  valor por tema — y no `--tinta-1`, que es un primitivo fijo y oscuro: en
  oscuro habría pintado un glifo negro sobre negro y un filo invisible.

  CADA CATEGORÍA TIEMBLA AL TOCARLA, con `Agitar` —el acento de «seleccionado»
  del sistema, corto y sin repetición para que no se lea como error—. Se agita
  en el MISMO instante del toque, no cuando vuelve el servidor: `pendiente`
  guarda la que se acaba de tocar mientras la navegación viaja. Como manda la
  regla de `Agitar`, no tiembla al montar ni al apagarse.

  Las opciones siguen siendo ENLACES (el filtro vive en la URL: se comparte y
  sobrevive a un refresco). La ventana NO se cierra sola al elegir: el
  visitante ve el temblor y la selección, y cierra con «Ver comercios», que
  ya dice cuántos hay.

  VARIAS A LA VEZ (30/09/2026, encargo del propietario). Cada categoría se
  enciende y se apaga sola, con una marca de verificación en su círculo;
  «Todas» limpia la selección. Para que el toque responda al instante y no
  cuando vuelve el servidor, la selección se refleja de forma OPTIMISTA en
  `optimista`, que se descarta en cuanto llegan las opciones nuevas.

  Los `href` llegan calculados del servidor (`hrefDirectorio`), así que este
  componente no conoce la forma de la URL.
*/

export type OpcionCategoria = {
  /** `null` = «Todas». */
  id: number | null
  nombre: string
  href: string
  activa: boolean
}

type Props = {
  opciones: OpcionCategoria[]
  /** Cuántos comercios muestra la rejilla con los filtros actuales. */
  total: number
}

export function CategoriasDirectorio({ opciones, total }: Props) {
  const [abierta, setAbierta] = useState(false)
  /* La selección optimista, atada a las opciones sobre las que se calculó:
     cuando el servidor devuelve opciones nuevas, deja de valer sola. */
  const [optimista, setOptimista] = useState<{
    base: OpcionCategoria[]
    ids: Set<number | null>
  } | null>(null)

  const vigente = optimista?.base === opciones ? optimista.ids : null
  const estaActiva = (o: OpcionCategoria) => (vigente ? vigente.has(o.id) : o.activa)

  function alTocar(o: OpcionCategoria) {
    const actuales = new Set(opciones.filter(estaActiva).map((x) => x.id))
    let ids: Set<number | null>
    if (o.id === null) {
      ids = new Set([null])
    } else {
      actuales.delete(null)
      if (actuales.has(o.id)) actuales.delete(o.id)
      else actuales.add(o.id)
      ids = actuales.size > 0 ? actuales : new Set([null])
    }
    setOptimista({ base: opciones, ids })
  }

  const elegidas = opciones.filter((o) => o.id !== null && estaActiva(o))
  const resumen =
    elegidas.length === 0 ? 'Todas' : elegidas.length === 1 ? elegidas[0].nombre : `${elegidas.length}`

  const lista = (
    <ul className={estilos.rejilla}>
      {opciones.map((o) => {
        const activa = estaActiva(o)
        return (
          <li key={o.id ?? 'todas'}>
            <Link
              href={o.href}
              scroll={false}
              className={estilos.opcion}
              data-activa={activa || undefined}
              onClick={() => alTocar(o)}
            >
              {/* El temblor va en el GLIFO, dentro del círculo, y no en el
                  círculo: `Agitar` se aplica al icono, nunca a la superficie. */}
              <span className={estilos.icono} aria-hidden="true">
                <Agitar activo={activa}>
                  {o.id === null ? (
                    <LayoutGrid size={20} aria-hidden="true" />
                  ) : (
                    <IconoCategoria nombre={o.nombre} size={20} />
                  )}
                </Agitar>
                {/* La marca de «elegida»: con varias a la vez, el anillo solo
                    no basta para contarlas de un vistazo. */}
                {activa && o.id !== null && (
                  <span className={estilos.marca}>
                    <Check size={11} strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className={estilos.nombre}>{o.nombre}</span>
              {/* El estado, dicho con palabras al lector de pantalla. */}
              {activa && <span className="sr-only"> (elegida)</span>}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <button
        type="button"
        className={estilos.disparador}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        onClick={() => setAbierta(true)}
      >
        <span className={estilos.disparadorIcono} aria-hidden="true">
          <LayoutGrid size={13} />
        </span>
        <span className={estilos.disparadorTexto}>
          Categorías: {resumen}
        </span>
        <ChevronDown size={14} aria-hidden="true" className={estilos.chevron} />
      </button>

      <Overlay
        open={abierta}
        onClose={() => setAbierta(false)}
        title="Categorías"
        description="Toca una o varias para ver esos comercios."
        detent="large"
        width="640px"
        footer={
          <Button
            variant="secondary"
            pildora
            fullWidth
            className={estilos.botonVer}
            onClick={() => setAbierta(false)}
          >
            {total === 1 ? 'Ver 1 comercio' : `Ver ${total} comercios`}
          </Button>
        }
      >
        <nav aria-label="Categorías">{lista}</nav>
      </Overlay>
    </>
  )
}
