'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  CreditCard,
  KeyRound,
  Megaphone,
  ScrollText,
  Search,
  Store,
  UserPlus,
  Users,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { buscarMiembrosAction } from '@/app/admin/actions'
import { StatusBadge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { MiembroEncontrado } from '@/lib/miembros/buscar-miembros'
import type { RolCodigo } from '@/lib/supabase/database.types'
import styles from './command-palette.module.css'

/*
  Paleta de comandos.

  Existe para bajar el coste de los flujos que se repiten cien veces al día:
  consultar el estado de un miembro pasa de 3 pasos (navegar → buscar → abrir
  ficha) a uno solo, porque el resultado YA muestra el estado. Vender una
  membresía pasa de 3 navegaciones a un atajo desde cualquier pantalla.
*/

/** El evento con el que cualquier pantalla pide abrir la paleta. */
const EVENTO_ABRIR = 'orum:abrir-paleta'

/**
 * Abre la paleta desde fuera del shell (un atajo de la portada, por ejemplo).
 * Un evento y no un contexto: así lo puede llamar un componente de cliente
 * suelto dentro de una página de servidor, sin envolverla.
 */
export function abrirPaleta() {
  window.dispatchEvent(new Event(EVENTO_ABRIR))
}

/** ¿El foco está donde se escribe? Ahí «/» es un carácter, no un atajo. */
function escribiendo(destino: EventTarget | null): boolean {
  if (!(destino instanceof HTMLElement)) return false
  return (
    destino.isContentEditable ||
    destino instanceof HTMLInputElement ||
    destino instanceof HTMLTextAreaElement ||
    destino instanceof HTMLSelectElement
  )
}

/**
 * Los atajos de la paleta, en toda la aplicación:
 *   · ⌘K / Ctrl+K, desde cualquier sitio (también desde un campo).
 *   · «/», el atajo de buscar de casi toda herramienta de trabajo, solo
 *     cuando no se está escribiendo.
 *   · El evento `abrirPaleta()`.
 */
export function useAtajoPaleta(abrir: () => void) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        abrir()
        return
      }
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.defaultPrevented &&
        !escribiendo(e.target) &&
        // Con un diálogo abierto, «/» es suyo (o no es de nadie).
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault()
        abrir()
      }
    }
    window.addEventListener('keydown', alPulsar)
    window.addEventListener(EVENTO_ABRIR, abrir)
    return () => {
      window.removeEventListener('keydown', alPulsar)
      window.removeEventListener(EVENTO_ABRIR, abrir)
    }
  }, [abrir])
}

type Accion = {
  id: string
  label: string
  hint?: string
  icon: LucideIcon
  href: string
  soloSuperAdmin?: boolean
}

const ACCIONES: Accion[] = [
  {
    id: 'nuevo-miembro',
    label: 'Registrar miembro y vender membresía',
    hint: 'Flujo completo',
    icon: UserPlus,
    href: '/admin/miembros/nuevo',
  },
  { id: 'miembros', label: 'Ver miembros', icon: Users, href: '/admin/miembros' },
  {
    id: 'comercios',
    label: 'Ver comercios',
    icon: Store,
    href: '/admin/comercios',
    soloSuperAdmin: true,
  },
  {
    id: 'nuevo-comercio',
    label: 'Nuevo comercio aliado',
    icon: Store,
    href: '/admin/comercios/nuevo',
    soloSuperAdmin: true,
  },
  {
    id: 'metricas',
    label: 'Ver métricas',
    icon: BarChart3,
    href: '/admin/metricas',
    soloSuperAdmin: true,
  },
  {
    id: 'bitacora',
    label: 'Ver bitácora',
    hint: 'Quién hizo qué',
    icon: ScrollText,
    href: '/admin/bitacora',
    soloSuperAdmin: true,
  },
  {
    id: 'planes',
    label: 'Ver planes de membresía',
    icon: CreditCard,
    href: '/admin/planes',
    soloSuperAdmin: true,
  },
  {
    id: 'nuevo-plan',
    label: 'Nuevo plan de membresía',
    icon: CreditCard,
    href: '/admin/planes/nuevo',
    soloSuperAdmin: true,
  },
  {
    id: 'usuarios',
    label: 'Ver usuarios',
    icon: UserCog,
    href: '/admin/usuarios',
    soloSuperAdmin: true,
  },
  {
    id: 'nuevo-usuario',
    label: 'Nuevo usuario del panel',
    icon: UserCog,
    href: '/admin/usuarios/nuevo',
    soloSuperAdmin: true,
  },
  {
    id: 'novedades',
    label: 'Ver novedades',
    icon: Megaphone,
    href: '/admin/anuncios',
    soloSuperAdmin: true,
  },
  {
    id: 'nueva-novedad',
    label: 'Publicar una novedad',
    icon: Megaphone,
    href: '/admin/anuncios/nuevo',
    soloSuperAdmin: true,
  },
  {
    id: 'password',
    label: 'Cambiar mi contraseña',
    icon: KeyRound,
    href: '/admin/cuenta/password',
  },
]

/** Milisegundos de espera antes de consultar. Por encima se nota el retardo. */
const DEBOUNCE_MS = 150

type Props = {
  open: boolean
  onClose: () => void
  rol: RolCodigo
  /**
   * Fuente de resultados. Por defecto la server action del portal
   * administrativo; se inyecta otra en la vista previa de `/dev/shell` y,
   * más adelante, en el Portal de Miembros.
   */
  buscar?: (termino: string) => Promise<MiembroEncontrado[]>
}

export function CommandPalette({
  open,
  onClose,
  rol,
  buscar = buscarMiembrosAction,
}: Props) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const [consulta, setConsulta] = useState('')
  const [miembros, setMiembros] = useState<MiembroEncontrado[]>([])
  const [seleccion, setSeleccion] = useState(0)
  const [buscando, iniciarBusqueda] = useTransition()

  const acciones = useMemo(() => {
    const permitidas = ACCIONES.filter(
      (a) => !a.soloSuperAdmin || rol === 'super_admin',
    )
    const termino = consulta.trim().toLowerCase()
    if (!termino) return permitidas
    return permitidas.filter((a) => a.label.toLowerCase().includes(termino))
  }, [consulta, rol])

  // Con menos de dos caracteres no se muestran miembros. Se DERIVA en el
  // render en lugar de vaciar el estado desde un efecto: así no hay renders
  // en cascada y el resultado anterior sigue en memoria si se vuelve a él.
  const termino = consulta.trim()
  const miembrosVisibles = useMemo(
    // La referencia debe ser estable: si no, el array vacío sería nuevo en
    // cada render y recalcularía `entradas` continuamente.
    () => (termino.length >= 2 ? miembros : []),
    [termino, miembros],
  )

  // Lista plana: el índice de selección recorre acciones y miembros por igual.
  const entradas = useMemo(
    () => [
      ...acciones.map((a) => ({ tipo: 'accion' as const, accion: a })),
      ...miembrosVisibles.map((m) => ({ tipo: 'miembro' as const, miembro: m })),
    ],
    [acciones, miembrosVisibles],
  )

  // Abrir y cerrar el <dialog>, que aporta focus trap y Escape.
  useEffect(() => {
    const dialogo = dialogRef.current
    if (!dialogo) return

    if (open && !dialogo.open) {
      dialogo.showModal()
    } else if (!open && dialogo.open) {
      dialogo.close()
      setConsulta('')
      setMiembros([])
      setSeleccion(0)
    }
  }, [open])

  // Búsqueda con retardo: sin él, cada tecla dispara una consulta.
  useEffect(() => {
    if (!open || termino.length < 2) return

    const temporizador = setTimeout(() => {
      iniciarBusqueda(async () => {
        const encontrados = await buscar(termino)
        setMiembros(encontrados)
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(temporizador)
  }, [termino, open, buscar])

  const irA = (href: string) => {
    onClose()
    router.push(href)
  }

  const activarSeleccion = () => {
    const entrada = entradas[seleccion]
    if (!entrada) return
    irA(
      entrada.tipo === 'accion'
        ? entrada.accion.href
        : `/admin/miembros/${entrada.miembro.id}`,
    )
  }

  const alPulsarTecla = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSeleccion((s) => (entradas.length === 0 ? 0 : (s + 1) % entradas.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSeleccion((s) =>
        entradas.length === 0 ? 0 : (s - 1 + entradas.length) % entradas.length,
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activarSeleccion()
    }
  }

  // Mantener a la vista la opción seleccionada al navegar con flechas.
  useEffect(() => {
    listaRef.current
      ?.querySelector<HTMLElement>('[data-seleccionada="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [seleccion])

  const sinResultados = entradas.length === 0 && !buscando && termino.length >= 2

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onCancel={(e) => {
        // Solo el suyo: en React burbujea el `cancel` de lo que haya dentro
        // (ver `modal.tsx`).
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      aria-label="Buscar y ejecutar acciones"
    >
      <div className={styles.contenido} onKeyDown={alPulsarTecla}>
        <div className={styles.campo}>
          <Search className={styles.campoIcono} aria-hidden="true" />
          <input
            className={styles.entrada}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value)
              setSeleccion(0)
            }}
            placeholder="Buscar miembro por número, cédula o nombre…"
            aria-label="Buscar"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.atajo}>ESC</span>
        </div>

        <div className={styles.lista} data-barra="" data-desvanece="" ref={listaRef} role="listbox" aria-label="Resultados">
          {acciones.length > 0 && <div className={styles.grupoTitulo}>Acciones</div>}

          {acciones.map((accion, i) => (
            <button
              key={accion.id}
              type="button"
              role="option"
              aria-selected={seleccion === i}
              data-seleccionada={seleccion === i}
              className={styles.opcion}
              onMouseMove={() => setSeleccion(i)}
              onClick={() => irA(accion.href)}
            >
              <accion.icon className={styles.opcionIcono} aria-hidden="true" />
              <span className={styles.opcionTextos}>
                <span className={styles.opcionTitulo}>{accion.label}</span>
                {accion.hint && <span className={styles.opcionMeta}>{accion.hint}</span>}
              </span>
            </button>
          ))}

          {buscando && (
            <div className={styles.cargando}>
              <Spinner size="sm" label={null} />
              Buscando miembros…
            </div>
          )}

          {miembrosVisibles.length > 0 && (
            <div className={styles.grupoTitulo}>Miembros</div>
          )}

          {miembrosVisibles.map((miembro, i) => {
            const indice = acciones.length + i
            return (
              <button
                key={miembro.id}
                type="button"
                role="option"
                aria-selected={seleccion === indice}
                data-seleccionada={seleccion === indice}
                className={styles.opcion}
                onMouseMove={() => setSeleccion(indice)}
                onClick={() => irA(`/admin/miembros/${miembro.id}`)}
              >
                <Users className={styles.opcionIcono} aria-hidden="true" />
                <span className={styles.opcionTextos}>
                  <span className={styles.opcionTitulo}>{miembro.nombre}</span>
                  <span className={styles.opcionMeta}>
                    Nº {miembro.numeroMembresia} · CC {miembro.cedula}
                  </span>
                </span>

                {/* El estado se ve AQUÍ: consultar si alguien está al día no
                    debería obligar a abrir su ficha. */}
                <span className={styles.opcionDerecha}>
                  {miembro.estado && <StatusBadge estado={miembro.estado} size="sm" />}
                </span>
              </button>
            )
          })}

          {sinResultados && (
            <p className={styles.vacio}>
              Sin resultados para «{consulta.trim()}».
            </p>
          )}
        </div>

        <div className={styles.pie}>
          <span>↑↓ moverse</span>
          <span>↵ abrir</span>
          <span>ESC cerrar</span>
        </div>
      </div>
    </dialog>
  )
}
