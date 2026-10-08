import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
  Red de seguridad de la bitácora: toda escritura del panel sobre una tabla
  auditada tiene que declarar QUIÉN la hace (`updated_by`).

  Las acciones del servidor escriben con `service_role`, donde `auth.uid()` es
  nulo: sin `updated_by`, el trigger `fn_auditar` guarda el evento sin actor y la
  bitácora deja de poder responder «¿quién cambió esto?». Es un olvido que no
  falla en ningún sitio —la escritura funciona igual—, por eso se vigila aquí.

  Lee el código fuente como texto, a propósito: lo que se comprueba es que la
  llamada lo lleve, no su comportamiento.
*/

/** Las tablas con trigger `fn_capturar_actor` (columna `updated_by`). */
const TABLAS_AUDITADAS = [
  'comercios',
  'promociones',
  'membresias',
  'miembros',
  'perfiles',
  'empleados',
  'sucursales',
  'planes_membresia',
  'anuncios',
]

const RAIZ = join(__dirname, '..', '..', 'app')

function archivosActions(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) return archivosActions(ruta)
    return /actions\.ts$/.test(e.name) ? [ruta] : []
  })
}

/** Texto de los argumentos de la llamada cuyo `(` está en `abre` (con paréntesis balanceados). */
function argumentos(texto: string, abre: number): string {
  let nivel = 0
  for (let i = abre; i < texto.length; i++) {
    if (texto[i] === '(') nivel++
    else if (texto[i] === ')' && --nivel === 0) return texto.slice(abre, i + 1)
  }
  return texto.slice(abre)
}

type Escritura = { archivo: string; linea: number; tabla: string; operacion: string; argumentos: string }

function escrituras(): Escritura[] {
  const patron = new RegExp(
    `from\\('(${TABLAS_AUDITADAS.join('|')})'\\)\\s*\\.(insert|update|upsert)\\(`,
    'g',
  )
  const salida: Escritura[] = []
  for (const archivo of archivosActions(RAIZ)) {
    const texto = readFileSync(archivo, 'utf8')
    for (const m of texto.matchAll(patron)) {
      const abre = m.index! + m[0].length - 1
      salida.push({
        archivo: relative(RAIZ, archivo).split('\\').join('/'),
        linea: texto.slice(0, m.index).split('\n').length,
        tabla: m[1],
        operacion: m[2],
        argumentos: argumentos(texto, abre),
      })
    }
  }
  return salida
}

describe('actor en las escrituras sobre tablas auditadas', () => {
  const todas = escrituras()

  it('encuentra las escrituras (si no, el patrón dejó de casar y esta prueba no vigila nada)', () => {
    expect(todas.length).toBeGreaterThan(25)
  })

  it('cada una declara `updated_by`', () => {
    const sinActor = todas
      .filter((e) => !e.argumentos.includes('updated_by'))
      .map((e) => `${e.archivo}:${e.linea} · ${e.operacion} en ${e.tabla}`)

    expect(sinActor).toEqual([])
  })
})
