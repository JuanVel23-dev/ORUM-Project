/*
  MOVER LAS FOTOS DE SOCIO A RUTAS CON CLAVE  ·  una sola vez (1/10/2026)

  Auditoría de seguridad: las fotos antiguas viven en `miembros/{id}/foto.{ext}`,
  una ruta adivinable. Este script las mueve a `miembros/{id}/{clave}/foto.{ext}`
  y actualiza `miembros.foto_url`, igual que hace la subida nueva.

  Por defecto es un ENSAYO: solo imprime qué haría. Para aplicar:

      node scripts/mover-fotos-socios.mjs --aplicar

  Usa la `service_role` de `.env.local` (salta RLS): corre solo en tu máquina,
  nunca se importa desde la aplicación. Es idempotente: una foto que ya tiene
  clave se omite, y si se interrumpe puede volver a ejecutarse.

  Orden de cada foto: primero MOVER el archivo, y solo si salió bien actualizar
  la fila. Si el movimiento falla no se toca la base y la foto antigua sigue
  funcionando.
*/
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'avatares'
const aplicar = process.argv.includes('--aplicar')

// .env.local mínimo: sin dependencias extra.
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const clave = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !clave) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const admin = createClient(url, clave, { auth: { persistSession: false } })

const marca = `/storage/v1/object/public/${BUCKET}/`
const ANTIGUA = /^miembros\/(\d+)\/foto\.(png|jpg|webp)$/

const { data: miembros, error } = await admin
  .from('miembros')
  .select('id, foto_url')
  .not('foto_url', 'is', null)
if (error) {
  console.error('No se pudo leer miembros:', error.message)
  process.exit(1)
}

let movidas = 0
for (const m of miembros) {
  const i = m.foto_url.indexOf(marca)
  if (i === -1) {
    console.log(`miembro ${m.id}: foto externa, se omite`)
    continue
  }
  const ruta = decodeURIComponent(m.foto_url.slice(i + marca.length).split('?')[0])
  const f = ANTIGUA.exec(ruta)
  if (!f) {
    console.log(`miembro ${m.id}: ya tiene clave (${ruta}), se omite`)
    continue
  }

  const nueva = `miembros/${m.id}/${randomUUID().replace(/-/g, '')}/foto.${f[2]}`
  console.log(`miembro ${m.id}: ${ruta}  →  ${nueva}`)
  if (!aplicar) continue

  const { error: errMover } = await admin.storage.from(BUCKET).move(ruta, nueva)
  if (errMover) {
    console.error(`  ✗ no se pudo mover: ${errMover.message} (la fila NO se tocó)`)
    continue
  }

  const publica = admin.storage.from(BUCKET).getPublicUrl(nueva).data.publicUrl
  const { error: errFila } = await admin
    .from('miembros')
    .update({ foto_url: `${publica}?v=${Date.now()}` })
    .eq('id', m.id)
  if (errFila) {
    console.error(`  ✗ movida, pero no se pudo actualizar la fila: ${errFila.message}`)
    console.error(`    Arreglo manual: foto_url = ${publica}`)
    continue
  }
  movidas++
  console.log('  ✓ listo')
}

console.log(aplicar ? `\n${movidas} foto(s) movida(s).` : '\nEnsayo: no se cambió nada. Añade --aplicar para ejecutar.')
