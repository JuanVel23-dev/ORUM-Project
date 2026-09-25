'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { Agitar } from '@/components/ui/agitar'
import { Button } from '@/components/ui/button'
import { IconoCategoria } from '@/components/ui/icono-categoria'
import { Overlay } from '@/components/ui/overlay'
import estilos from './categorias-directorio.module.css'

/*
  LAS CATEGORÍAS DEL DIRECTORIO  ·  un botón que abre una ventana con todas
  ---------------------------------------------------------------------------
  Encargo del propietario: las quince categorías ya no ocupan el panel antes
  de los comercios. Hay un botón «Categorías», junto a Ciudad y Ordenar, y al
  tocarlo se abre una ventana con todas: diálogo centrado en escritorio, hoja
  inferior en móvil (el `Overlay` del sistema decide).

  CADA CATEGORÍA TIEMBLA AL TOCARLA, con `Agitar` —el acento de «seleccionado»
  del sistema, corto y sin repetición para que no se lea como error—. Se agita
  en el MISMO instante del toque, no cuando vuelve el servidor: `pendiente`
  guarda la que se acaba de tocar mientras la navegación viaja. Como manda la
  regla de `Agitar`, no tiembla al montar ni al apagarse.

  Las opciones siguen siendo ENLACES (el filtro vive en la URL: se comparte y
  sobrevive a un refresco). La ventana NO se cierra sola al elegir: el
  visitante ve el temblor y la selección, y cierra con «Ver comercios», que
  ya dice cuántos hay.

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
  const [pendiente, setPendiente] = useState<number | null | undefined>(undefined)

  const activa = opciones.find((o) => o.activa)

  const lista = (
    <ul className={estilos.rejilla}>
      {opciones.map((o) => (
        <li key={o.id ?? 'todas'}>
          <Link
            href={o.href}
            scroll={false}
            className={estilos.opcion}
            aria-current={o.activa ? 'true' : undefined}
            onClick={() => setPendiente(o.id)}
          >
            {/* El temblor va en el GLIFO, dentro del círculo, y no en el
                círculo: `Agitar` se aplica al icono, nunca a la superficie. */}
            <span className={estilos.icono} aria-hidden="true">
              <Agitar activo={o.activa || pendiente === o.id}>
                {o.id === null ? (
                  <LayoutGrid size={20} aria-hidden="true" />
                ) : (
                  <IconoCategoria nombre={o.nombre} size={20} />
                )}
              </Agitar>
            </span>
            <span className={estilos.nombre}>{o.nombre}</span>
          </Link>
        </li>
      ))}
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
          Categorías: {activa?.nombre ?? 'Todas'}
        </span>
        <ChevronDown size={14} aria-hidden="true" className={estilos.chevron} />
      </button>

      <Overlay
        open={abierta}
        onClose={() => setAbierta(false)}
        title="Categorías"
        description="Toca una para ver solo esos comercios."
        detent="large"
        width="640px"
        footer={
          <Button variant="brand" pildora fullWidth onClick={() => setAbierta(false)}>
            {total === 1 ? 'Ver 1 comercio' : `Ver ${total} comercios`}
          </Button>
        }
      >
        <nav aria-label="Categorías">{lista}</nav>
      </Overlay>
    </>
  )
}
