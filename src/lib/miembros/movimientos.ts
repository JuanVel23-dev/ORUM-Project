/*
  LOS MOVIMIENTOS DEL SOCIO  ·  funciones puras
  ---------------------------------------------------------------------------
  Un «movimiento» es una fila de `ventas` vista desde el socio: dónde usó su
  membresía, con qué beneficio y cuánto ahorró. Aquí vive solo lo que se puede
  probar sin base de datos; la consulta está en `datos-movimientos.ts`.

  LA SEGURIDAD NO VIVE AQUÍ: la da la RLS (`ventas_member_select`), que solo
  deja leer las filas del propio miembro. Nada de este archivo filtra por
  usuario, y nada debe: un filtro en código es una comprobación que alguien
  puede olvidar; la política no.

  Pero la RLS de las tablas UNIDAS es más estricta que la de `ventas`:
  `sucursales`, `comercios` y `promociones` solo son legibles para un socio si
  están activas y sin borrar. Un comercio que se desactivó deja su venta vieja
  sin nombre al unirla. Por eso los tres campos unidos son `null`-ables aquí, y
  la fila se conserva con un texto de respaldo: perder la fila del historial
  porque el comercio cerró sería peor que mostrarla sin nombre.
*/

export const LIMITE_INICIAL = 20
export const PASO_VER_MAS = 20
/** Techo duro: el límite llega de la URL y nadie debe poder pedir «todo». */
export const LIMITE_MAXIMO = 200

export const COMERCIO_NO_DISPONIBLE = 'Comercio no disponible'

/** La fila tal como la entrega PostgREST con los joins de `datos-movimientos`. */
export type VentaCruda = {
  id: number
  fecha_hora: string
  // `numeric` llega como número o como texto según el driver: se normaliza.
  valor_compra: number
  valor_descuento: number
  valor_final: number
  sucursales: {
    nombre: string
    comercios: { id: number; nombre: string; logo_url?: string | null } | null
  } | null
  promociones: { titulo: string } | null
}

export type Movimiento = {
  id: number
  fechaHora: string
  comercioId: number | null
  comercio: string
  /** El logotipo del comercio, o `null` (la placa pinta su inicial). */
  logoUrl: string | null
  sucursal: string | null
  promocion: string | null
  valorCompra: number
  ahorro: number
  valorFinal: number
}

/** `numeric` de Postgres → número; lo que no lo sea cuenta como 0, nunca NaN. */
function aNumero(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? n : 0
}

export function normalizarMovimiento(venta: VentaCruda): Movimiento {
  const comercio = venta.sucursales?.comercios ?? null

  return {
    id: venta.id,
    fechaHora: venta.fecha_hora,
    comercioId: comercio?.id ?? null,
    comercio: comercio?.nombre ?? COMERCIO_NO_DISPONIBLE,
    logoUrl: (comercio?.logo_url ?? '').trim() || null,
    sucursal: venta.sucursales?.nombre ?? null,
    promocion: venta.promociones?.titulo ?? null,
    valorCompra: aNumero(venta.valor_compra),
    ahorro: aNumero(venta.valor_descuento),
    valorFinal: aNumero(venta.valor_final),
  }
}

/**
 * Suma los descuentos. Se redondea a 2 decimales al final: 0,1 + 0,2 en coma
 * flotante da 0,30000000000000004 y eso acaba impreso en pantalla.
 */
export function sumarAhorro(filas: ReadonlyArray<{ valor_descuento: number }>): number {
  const total = filas.reduce((acc, f) => acc + aNumero(f.valor_descuento), 0)
  return Math.round(total * 100) / 100
}

/**
 * Cuántos movimientos pide la URL (`?mostrar=40`). Es entrada del usuario:
 * solo se acepta un entero dentro de [LIMITE_INICIAL, LIMITE_MAXIMO]; cualquier
 * otra cosa vuelve al inicial.
 */
export function limiteSolicitado(valor: string | string[] | undefined): number {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return LIMITE_INICIAL
  const n = Number(valor)
  if (n < LIMITE_INICIAL) return LIMITE_INICIAL
  return Math.min(n, LIMITE_MAXIMO)
}

/** Un mes del historial, con sus movimientos en el orden en que llegaron. */
export type MesDeMovimientos = {
  /** `YYYY-MM`, en la hora de Colombia. Sirve de `key` y para ordenar. */
  clave: string
  /** «Octubre de 2026». */
  titulo: string
  /** Lo ahorrado en los movimientos CARGADOS de ese mes. */
  ahorro: number
  movimientos: Movimiento[]
}

const PARTES_MES = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
})

const TITULO_MES = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  month: 'long',
  year: 'numeric',
})

/**
 * Agrupa los movimientos por mes, conservando el orden de entrada (la lista
 * llega de más reciente a más antiguo, y así salen los meses).
 *
 * El mes se decide en la hora de COLOMBIA: `fecha_hora` es `timestamptz`, y
 * una compra del 31 a las 8 p. m. ya es día 1 en UTC — leída en UTC caería
 * en el mes equivocado.
 */
export function agruparPorMes(movimientos: readonly Movimiento[]): MesDeMovimientos[] {
  const meses: MesDeMovimientos[] = []
  const porClave = new Map<string, MesDeMovimientos>()

  for (const m of movimientos) {
    const fecha = new Date(m.fechaHora)
    const partes = PARTES_MES.formatToParts(fecha)
    const anio = partes.find((p) => p.type === 'year')?.value ?? ''
    // `padStart`: en `es-CO` el mes de «2-digit» puede llegar como «9».
    const mes = (partes.find((p) => p.type === 'month')?.value ?? '').padStart(2, '0')
    const clave = `${anio}-${mes}`

    let grupo = porClave.get(clave)
    if (!grupo) {
      const titulo = TITULO_MES.format(fecha)
      grupo = {
        clave,
        titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
        ahorro: 0,
        movimientos: [],
      }
      porClave.set(clave, grupo)
      meses.push(grupo)
    }
    grupo.movimientos.push(m)
    grupo.ahorro = Math.round((grupo.ahorro + m.ahorro) * 100) / 100
  }

  return meses
}
