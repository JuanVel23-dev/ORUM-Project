/*
  SIEMBRA DE COMERCIOS REALES  ·  uso único, lo ejecuta el equipo de desarrollo

    node scripts/sembrar-comercios.mjs "C:/Users/danie/Pictures/LogosComerciosORUM"

  Qué hace, en este orden:
    1. BORRADO SUAVE de los comercios activos actuales (`deleted_at` + `activo:
       false`), y de sus promociones y sedes. Suave y no `DELETE`: es el patrón
       de toda la base, y una venta histórica que apunte a un comercio borrado
       sigue siendo consultable. Las cuentas de acceso de esos comercios NO se
       tocan: borrar un usuario de Auth es irreversible.
    2. Asegura la ciudad «Tuluá».
    3. Por cada carpeta: crea el comercio, sube el logo, usa el primer recurso
       como portada y el resto como galería, y crea una sede y una promoción de
       ejemplo (dirección ficticia, promoción pendiente de confirmar).

  Subir archivos a Storage no es una operación de SQL, así que esto no puede
  ser un `.sql` para el editor de Supabase. Usa la `service_role` de
  `.env.local` y replica la convención de `src/lib/imagenes/` (rutas, tipos,
  límite de 1 MB, `upsert`, caché de un año y URL con marca de versión): el
  resultado es idéntico a que un administrador subiera cada imagen a mano.
  No importa aquellos módulos porque llevan `import 'server-only'`, que solo
  resuelve dentro de Next.

  Idempotente en lo que importa: si se vuelve a correr, borra (suave) lo que
  sembró la vez anterior y lo vuelve a crear.
*/
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RAIZ = process.argv[2]
if (!RAIZ) {
  console.error('Uso: node scripts/sembrar-comercios.mjs <carpeta de comercios>')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/* ── Convención de src/lib/imagenes/ ──────────────────────────────────────── */
const BUCKET = 'imagenes-comercios'
const LIMITE = 1_048_576
const CACHE_UN_ANO = '31536000'

/** Tipo REAL por la firma de bytes, no por la extensión del nombre. */
function tipoPorFirma(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ['image/png', 'png']
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ['image/jpeg', 'jpg']
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return ['image/webp', 'webp']
  return null
}

function claveGaleria(ahora, aleatorio) {
  const sufijo = Math.floor(aleatorio * 1_679_616).toString(36).padStart(4, '0')
  return `${ahora.toString(36)}-${sufijo}`
}

const saltados = []

async function subir(rutaArchivo, destino) {
  const bytes = readFileSync(rutaArchivo)
  if (bytes.length === 0) return saltados.push(`${rutaArchivo} (vacío)`), null
  if (bytes.length > LIMITE) return saltados.push(`${rutaArchivo} (supera 1 MB)`), null
  const tipo = tipoPorFirma(bytes)
  if (!tipo) return saltados.push(`${rutaArchivo} (formato no admitido)`), null

  const ruta = destino(tipo[1])
  const { error } = await db.storage.from(BUCKET).upload(ruta, bytes, {
    upsert: true,
    contentType: tipo[0],
    cacheControl: CACHE_UN_ANO,
  })
  if (error) throw new Error(`Subida fallida ${ruta}: ${error.message}`)
  const { data } = db.storage.from(BUCKET).getPublicUrl(ruta)
  return `${data.publicUrl}?v=${Date.now()}`
}

/* ── Los cinco comercios ──────────────────────────────────────────────────── */
/*
  Nombre tomado del ARCHIVO del logo, que es más fiable que el de la carpeta
  (parece un código interno). Direcciones ficticias: se reemplazan desde el
  panel cuando el comercio confirme la real.
*/
const COMERCIOS = [
  { carpeta: 'BienEstar', nombre: 'BienEstar', direccion: 'Calle 27 # 24-18' },
  { carpeta: 'Casta', nombre: 'Casta', direccion: 'Carrera 26 # 30-45' },
  { carpeta: 'GREECO', nombre: 'Greco', direccion: 'Calle 29 # 22-10' },
  { carpeta: 'MundoAlitas', nombre: 'Mundo Alitas', direccion: 'Carrera 30 # 27-62' },
  { carpeta: 'PAYAS', nombre: 'Los Payas', direccion: 'Calle 32 # 25-07' },
]

const hoy = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const finPromo = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 6, hoy.getUTCDate()))
const ahora = new Date().toISOString()

function check(res, que) {
  if (res.error) throw new Error(`${que}: ${res.error.message}`)
  return res.data
}

/* 1 · Borrado suave de lo actual ─────────────────────────────────────────── */
const actuales = check(
  await db.from('comercios').select('id, nombre').is('deleted_at', null),
  'leer comercios',
)
console.log(`Comercios activos antes: ${actuales.length}`)
if (actuales.length) {
  const ids = actuales.map((c) => c.id)
  check(await db.from('promociones').update({ deleted_at: ahora, activo: false }).in('comercio_id', ids).is('deleted_at', null), 'borrar promociones')
  check(await db.from('sucursales').update({ deleted_at: ahora, activo: false }).in('comercio_id', ids).is('deleted_at', null), 'borrar sucursales')
  check(await db.from('comercios').update({ deleted_at: ahora, activo: false }).in('id', ids), 'borrar comercios')
  console.log(`Borrado suave: ${actuales.map((c) => c.nombre).join(', ')}`)
}

/* 2 · Tuluá ──────────────────────────────────────────────────────────────── */
let tulua = check(await db.from('ciudades').select('id').eq('nombre', 'Tuluá').maybeSingle(), 'leer Tuluá')
if (!tulua) {
  tulua = check(
    await db.from('ciudades').insert({ nombre: 'Tuluá', departamento: 'Valle del Cauca' }).select('id').single(),
    'crear Tuluá',
  )
  console.log('Ciudad creada: Tuluá')
}

const porcentaje = check(
  await db.from('tipos_beneficio').select('id').eq('codigo', 'porcentaje').single(),
  'leer tipo porcentaje',
)

/* 3 · Los comercios ──────────────────────────────────────────────────────── */
const resumen = []
for (const c of COMERCIOS) {
  const dir = join(RAIZ, c.carpeta)
  const archivos = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile())
  const logo = archivos.find((f) => /logo/i.test(f)) ?? archivos.find((f) => !/^recurso/i.test(f))
  const recursos = archivos
    .filter((f) => /^recurso\d+/i.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))

  const comercio = check(
    await db.from('comercios').insert({ nombre: c.nombre, activo: true, perfil_id: null }).select('id').single(),
    `crear ${c.nombre}`,
  )
  const id = comercio.id

  const logoUrl = logo ? await subir(join(dir, logo), (ext) => `comercios/${id}/logo.${ext}`) : null

  // El primer recurso que suba bien es la portada; el resto, galería.
  let portadaUrl = null
  const galeria = []
  for (const r of recursos) {
    if (!portadaUrl) {
      const intento = await subir(join(dir, r), (ext) => `comercios/${id}/portada.${ext}`)
      // Un archivo inservible no se reintenta como galería: ya quedó anotado.
      portadaUrl = intento
      continue
    }
    const url = await subir(join(dir, r), (ext) => `comercios/${id}/galeria/${claveGaleria(Date.now(), Math.random())}.${ext}`)
    if (url) galeria.push(url)
  }

  check(await db.from('comercios').update({ logo_url: logoUrl, portada_url: portadaUrl }).eq('id', id), `urls ${c.nombre}`)
  if (galeria.length) {
    check(
      await db.from('comercio_imagenes').insert(galeria.map((url, i) => ({ comercio_id: id, url, orden: i }))),
      `galería ${c.nombre}`,
    )
  }

  check(
    await db.from('sucursales').insert({
      comercio_id: id,
      ciudad_id: tulua.id,
      nombre: 'Sede principal',
      direccion: `${c.direccion}, Tuluá`,
      activo: true,
    }),
    `sede ${c.nombre}`,
  )

  check(
    await db.from('promociones').insert({
      comercio_id: id,
      tipo_beneficio_id: porcentaje.id,
      titulo: '10% en tu consumo',
      descripcion: 'Promoción de ejemplo, pendiente de confirmar con el comercio.',
      valor: 10,
      fecha_inicio: iso(hoy),
      fecha_fin: iso(finPromo),
      activo: true,
    }),
    `promoción ${c.nombre}`,
  )

  resumen.push({ id, nombre: c.nombre, logo: !!logoUrl, portada: !!portadaUrl, galeria: galeria.length })
}

console.table(resumen)
if (saltados.length) console.log('Saltados:\n  ' + saltados.join('\n  '))
