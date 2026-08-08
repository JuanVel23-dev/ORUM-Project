import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora/bitacora'
import { RenovarForm } from './_components/renovar-form'
import { Badge, DataTable, EmptyState, PageHeader } from '@/components/ui'

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

  const [{ data: membresias }, { data: planes }, { data: ciudad }, { data: eventos }] = await Promise.all([
    admin.from('membresias')
      .select('id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado, plan_id')
      .eq('miembro_id', miembroId)
      .order('fecha_inicio', { ascending: false }),
    admin.from('planes_membresia').select('id, nombre, precio').eq('activo', true).is('deleted_at', null).order('nombre'),
    miembro.ciudad_id
      ? admin.from('ciudades').select('nombre').eq('id', miembro.ciudad_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('bitacora_actividad')
      .select('id, actor_id, accion, datos_anteriores, datos_nuevos, fecha_hora')
      .eq('entidad', 'miembro')
      .eq('entidad_id', miembroId)
      .order('fecha_hora', { ascending: false }),
  ])

  const nombrePlan = new Map((planes ?? []).map((p) => [p.id, p.nombre]))

  const actorIds = Array.from(
    new Set((eventos ?? []).map((e) => e.actor_id).filter((idActor): idActor is string => !!idActor)),
  )
  const correoActor = new Map<string, string>()
  await Promise.all(
    actorIds.map(async (idActor) => {
      const { data } = await admin.auth.admin.getUserById(idActor)
      correoActor.set(idActor, data.user?.email ?? '—')
    }),
  )

  // Correo de Auth (informativo), como en la gestión de usuarios.
  let correo = '—'
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div>
      <PageHeader
        title={`${miembro.nombres} ${miembro.apellidos}`.trim()}
        action={{ href: `/admin/miembros/${miembro.id}/editar`, label: 'Editar datos', variant: 'secondary' }}
      />

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Número de membresía:</strong> <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{miembro.numero_membresia}</span></p>
        <p><strong>Cédula:</strong> {miembro.cedula}</p>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Teléfono:</strong> {miembro.telefono ?? '—'}</p>
        <p><strong>Dirección:</strong> {miembro.direccion ?? '—'}</p>
        <p><strong>Ciudad:</strong> {ciudad?.nombre ?? '—'}</p>
      </div>

      <PageHeader as="h2" title="Historial de membresías" />
      {!membresias || membresias.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Este miembro no tiene membresías registradas.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
          <thead>
            <tr><th>Plan</th><th>Tipo</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Precio</th></tr>
          </thead>
          <tbody>
            {membresias.map((m) => (
              <tr key={m.id}>
                <td>{nombrePlan.get(m.plan_id) ?? `Plan #${m.plan_id}`}</td>
                <td>{m.tipo}</td>
                <td>
                  <Badge tone={m.estado === 'activa' ? 'on' : 'off'}>{m.estado}</Badge>
                </td>
                <td>{m.fecha_inicio}</td>
                <td>{m.fecha_fin}</td>
                <td>${m.precio_pagado.toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <PageHeader as="h2" title="Historial de actividad" />
      {!eventos || eventos.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Aún no hay eventos registrados para este miembro.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
          <thead>
            <tr><th>Fecha</th><th>Acción</th><th>Detalle</th><th>Registrado por</th></tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.fecha_hora).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                <td><Badge tone="on">{e.accion}</Badge></td>
                <td>{resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos)}</td>
                <td className="orum-muted">{e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <RenovarForm miembroId={miembro.id} planes={planes ?? []} />
    </div>
  )
}
