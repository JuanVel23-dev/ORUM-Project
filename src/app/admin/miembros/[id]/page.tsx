import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { RenovarForm } from './renovar-form'

export const metadata = { title: 'Ficha de miembro · ORUM' }

export default async function FichaMiembroPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin', 'empleado')
  const { id } = await params
  const miembroId = Number(id)

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('id, numero_membresia, nombres, apellidos, cedula, telefono, direccion, ciudad_id, perfil_id')
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) notFound()

  const [{ data: membresias }, { data: planes }, { data: ciudad }] = await Promise.all([
    admin.from('membresias')
      .select('id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado, plan_id')
      .eq('miembro_id', miembroId)
      .order('fecha_inicio', { ascending: false }),
    admin.from('planes_membresia').select('id, nombre, precio').eq('activo', true).is('deleted_at', null).order('nombre'),
    miembro.ciudad_id
      ? admin.from('ciudades').select('nombre').eq('id', miembro.ciudad_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const nombrePlan = new Map((planes ?? []).map((p) => [p.id, p.nombre]))
  // Correo de Auth (informativo), como en la gestión de usuarios.
  let correo = '—'
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{`${miembro.nombres} ${miembro.apellidos}`.trim()}</h1>
        <Link href={`/admin/miembros/${miembro.id}/editar`} className="orum-button orum-button--secondary">
          Editar datos
        </Link>
      </div>

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Número de membresía:</strong> <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{miembro.numero_membresia}</span></p>
        <p><strong>Cédula:</strong> {miembro.cedula}</p>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Teléfono:</strong> {miembro.telefono ?? '—'}</p>
        <p><strong>Dirección:</strong> {miembro.direccion ?? '—'}</p>
        <p><strong>Ciudad:</strong> {ciudad?.nombre ?? '—'}</p>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Historial de membresías</h2>
      {!membresias || membresias.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">Este miembro no tiene membresías registradas.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
            <thead>
              <tr><th>Plan</th><th>Tipo</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Precio</th></tr>
            </thead>
            <tbody>
              {membresias.map((m) => (
                <tr key={m.id}>
                  <td>{nombrePlan.get(m.plan_id) ?? `Plan #${m.plan_id}`}</td>
                  <td>{m.tipo}</td>
                  <td>
                    <span className={`orum-badge ${m.estado === 'activa' ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {m.estado}
                    </span>
                  </td>
                  <td>{m.fecha_inicio}</td>
                  <td>{m.fecha_fin}</td>
                  <td>${m.precio_pagado.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RenovarForm miembroId={miembro.id} planes={planes ?? []} />
    </div>
  )
}
