/*
  LA LISTA DE MIEMBROS DEL PANEL  ·  filtrar, contar, ordenar y paginar (puro)
  ---------------------------------------------------------------------------
  Rediseño del panel (15/10/2026): la lista de miembros lleva pestañas por
  estado con su recuento, un filtro de plan, orden y páginas. Aquí vive lo
  que decide QUÉ filas salen; la carga está en `cargar-listado.ts`.

  El estado sale SIEMPRE de `derivarEstadoMembresia` (nunca de la columna
  `estado` en crudo): las filas ya llegan con él derivado.
*/

import type { EstadoDerivado } from './membresias'

/** Días por delante en los que una vigente cuenta como «vence pronto». */
export const DIAS_VENCE_PRONTO = 30

/** Filas por página. */
export { FILAS_POR_PAGINA } from '../shared/paginacion'

export type FilaMiembro = {
  id: number
  numeroMembresia: string
  nombre: string
  cedula: string
  telefono: string | null
  fotoUrl: string | null
  plan: string | null
  planId: number | null
  estado: EstadoDerivado | null
  /** 'YYYY-MM-DD' de la membresía más reciente, o `null`. */
  fechaFin: string | null
}

export type PestanaEstado = 'todos' | 'vigentes' | 'pronto' | 'vencidas' | 'sin'
export type OrdenMiembros = 'recientes' | 'nombre' | 'vencimiento'

export const PESTANAS: readonly PestanaEstado[] = ['todos', 'vigentes', 'pronto', 'vencidas', 'sin']
export const ORDENES: readonly OrdenMiembros[] = ['recientes', 'nombre', 'vencimiento']

/** Lee un parámetro de la URL como pestaña; lo desconocido es «todos». */
export function leerPestana(valor: string | undefined): PestanaEstado {
  return (PESTANAS as readonly string[]).includes(valor ?? '') ? (valor as PestanaEstado) : 'todos'
}

export function leerOrden(valor: string | undefined): OrdenMiembros {
  return (ORDENES as readonly string[]).includes(valor ?? '') ? (valor as OrdenMiembros) : 'recientes'
}

export function leerPagina(valor: string | undefined): number {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : 1
}

/** ¿En qué pestañas cae una fila? Una vigente que vence pronto está en las dos. */
export function enPestana(fila: FilaMiembro, pestana: PestanaEstado): boolean {
  const e = fila.estado
  switch (pestana) {
    case 'todos':
      return true
    case 'vigentes':
      return !!e && e.activa
    case 'pronto':
      return !!e && e.activa && e.diasRestantes <= DIAS_VENCE_PRONTO
    case 'vencidas':
      return !!e && !e.activa
    case 'sin':
      return !e
  }
}

export function contarPorPestana(filas: readonly FilaMiembro[]): Record<PestanaEstado, number> {
  const cuenta = { todos: 0, vigentes: 0, pronto: 0, vencidas: 0, sin: 0 }
  for (const f of filas) {
    for (const p of PESTANAS) if (enPestana(f, p)) cuenta[p] += 1
  }
  return cuenta
}

/** Minúsculas y sin tildes. */
function plano(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Cada palabra de la búsqueda tiene que estar en el nombre, la cédula, el número o el teléfono. */
export function coincide(fila: FilaMiembro, busqueda: string): boolean {
  const palabras = plano(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return true
  const texto = plano(`${fila.nombre} ${fila.cedula} ${fila.numeroMembresia} ${fila.telefono ?? ''}`)
  return palabras.every((p) => texto.includes(p))
}

export type FiltrosMiembros = {
  pestana: PestanaEstado
  busqueda: string
  /** `null` = todos los planes. */
  planId: number | null
}

export function filtrar(filas: readonly FilaMiembro[], f: FiltrosMiembros): FilaMiembro[] {
  return filas.filter(
    (fila) =>
      enPestana(fila, f.pestana) &&
      (f.planId === null || fila.planId === f.planId) &&
      coincide(fila, f.busqueda),
  )
}

/** Ordena sin tocar la lista original. */
export function ordenar(filas: readonly FilaMiembro[], orden: OrdenMiembros): FilaMiembro[] {
  const copia = [...filas]
  if (orden === 'nombre') {
    copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  } else if (orden === 'vencimiento') {
    // Primero lo que vence antes; sin membresía, al final.
    copia.sort((a, b) => {
      if (!a.fechaFin) return b.fechaFin ? 1 : 0
      if (!b.fechaFin) return -1
      return a.fechaFin.localeCompare(b.fechaFin)
    })
  } else {
    copia.sort((a, b) => b.id - a.id)
  }
  return copia
}

/* Paginar es de cualquier lista: vive en `lib/shared/paginacion.ts`. */
export { paginar, paginasVisibles, type Pagina } from '../shared/paginacion'
