import {
  CreditCard,
  Home,
  KeyRound,
  LayoutGrid,
  Search,
  Store,
  UserPlus,
  Users,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import type { RolCodigo } from '@/lib/supabase/database.types'

/*
  Fuente única de la navegación del portal administrativo.

  Los destinos se filtran por rol AQUÍ, pero eso es solo presentación: la
  autorización real sigue viviendo en `requireRol` dentro de cada página y en
  cada server action. Ocultar un enlace no protege nada.

  Los ítems se nombran por lo que CONTIENEN ("Miembros", "Comercios"), no con
  paraguas vagos: la especificidad hace la navegación predecible.
*/

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /**
   * Prefijo que marca este ítem como activo. Por defecto es `href`.
   * `/admin` necesita coincidencia exacta o estaría siempre activo.
   */
  match?: string
  exact?: boolean
}

export type NavGroup = {
  /** Encabezado del grupo. Se omite en el primero, que no necesita título. */
  label?: string
  items: NavItem[]
}

/** Destino de la barra inferior en móvil. */
export type TabItem =
  | ({ kind: 'link' } & NavItem)
  | { kind: 'search'; label: string; icon: LucideIcon }
  | { kind: 'more'; label: string; icon: LucideIcon }

const INICIO: NavItem = { href: '/admin', label: 'Inicio', icon: Home, exact: true }
const MIEMBROS: NavItem = { href: '/admin/miembros', label: 'Miembros', icon: Users }
const COMERCIOS: NavItem = { href: '/admin/comercios', label: 'Comercios', icon: Store }
const USUARIOS: NavItem = { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog }
const PLANES: NavItem = { href: '/admin/planes', label: 'Planes', icon: CreditCard }
const PASSWORD: NavItem = {
  href: '/admin/cuenta/password',
  label: 'Mi contraseña',
  icon: KeyRound,
}

/** Grupos de la barra lateral, según el rol. */
export function navegacionPara(rol: RolCodigo): NavGroup[] {
  if (rol === 'super_admin') {
    return [
      { items: [INICIO, MIEMBROS, COMERCIOS] },
      { label: 'Administración', items: [USUARIOS, PLANES] },
      { label: 'Cuenta', items: [PASSWORD] },
    ]
  }

  // Empleado: solo opera con miembros.
  return [
    { items: [INICIO, MIEMBROS] },
    { label: 'Cuenta', items: [PASSWORD] },
  ]
}

/**
 * Barra inferior de móvil. Máximo 5 destinos, en la zona del pulgar.
 *
 * Para el empleado, "Vender" apunta directo al flujo estrella —registrar
 * cliente y venderle la membresía—, que es lo que hace todo el día.
 */
export function tabsPara(rol: RolCodigo): TabItem[] {
  const buscar = { kind: 'search', label: 'Buscar', icon: Search } as const
  const mas = { kind: 'more', label: 'Más', icon: LayoutGrid } as const

  if (rol === 'super_admin') {
    return [
      { kind: 'link', ...INICIO },
      { kind: 'link', ...MIEMBROS },
      { kind: 'link', ...COMERCIOS },
      buscar,
      mas,
    ]
  }

  return [
    { kind: 'link', ...INICIO },
    { kind: 'link', ...MIEMBROS },
    buscar,
    {
      kind: 'link',
      href: '/admin/miembros/nuevo',
      label: 'Vender',
      icon: UserPlus,
    },
    mas,
  ]
}

/**
 * ¿Está activa esta ruta?
 *
 * Coincidencia por prefijo para que `/admin/miembros/123/editar` mantenga
 * "Miembros" resaltado, salvo cuando el ítem pide coincidencia exacta.
 */
export function esRutaActiva(item: NavItem, pathname: string): boolean {
  const base = item.match ?? item.href
  if (item.exact) return pathname === base
  return pathname === base || pathname.startsWith(`${base}/`)
}
