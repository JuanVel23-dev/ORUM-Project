import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { derivarEstadoMembresia, type EstadoMembresia } from '@/lib/miembros/membresias'
import { Badge, StatusBadge, VenceEn } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copiar } from '@/components/ui/copiar'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader, Section, Stack } from '@/components/ui/layout'
import { RenovarForm } from './_components/renovar-form'
import styles from './ficha.module.css'

export const metadata = { title: 'Ficha de miembro · ORUM' }

/** Fecha 'YYYY-MM-DD' → '14 feb 2027'. */
function formatearFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatearPrecio(valor: number): string {
  return valor.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function FichaMiembroPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin', 'empleado')
  const { id } = await params
  const miembroId = Number(id)

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select(
      'id, numero_membresia, nombres, apellidos, cedula, telefono, direccion, ciudad_id, perfil_id',
    )
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!miembro) notFound()

  const [{ data: membresias }, { data: planes }, { data: ciudad }] = await Promise.all([
    admin
      .from('membresias')
      .select('id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado, plan_id')
      .eq('miembro_id', miembroId)
      .order('fecha_inicio', { ascending: false }),
    admin
      .from('planes_membresia')
      .select('id, nombre, precio')
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre'),
    miembro.ciudad_id
      ? admin.from('ciudades').select('nombre').eq('id', miembro.ciudad_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('bitacora_actividad')
      .select('id, actor_id, accion, datos_anteriores, datos_nuevos, fecha_hora')
      .eq('entidad', 'miembro')
      .eq('entidad_id', miembroId)
      .order('fecha_hora', { ascending: false }),
  ])

  // Los planes activos no bastan para nombrar el historial: una membresía
  // antigua puede apuntar a un plan ya desactivado.
  const idsPlanes = [...new Set((membresias ?? []).map((m) => m.plan_id))]
  const { data: planesHistoricos } = idsPlanes.length
    ? await admin.from('planes_membresia').select('id, nombre').in('id', idsPlanes)
    : { data: [] }

  const nombrePlan = new Map((planesHistoricos ?? []).map((p) => [p.id, p.nombre]))

  // Correo de Auth (informativo), como en la gestión de usuarios.
  let correo: string | null = null
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? null
  }

  const hoy = hoyISO()
  const historial = (membresias ?? []).map((m) => ({
    ...m,
    derivado: derivarEstadoMembresia(m.estado as EstadoMembresia, m.fecha_fin, hoy),
    plan: nombrePlan.get(m.plan_id) ?? `Plan #${m.plan_id}`,
  }))

  // La vigente es la primera activa del historial, que ya viene ordenado por
  // fecha de inicio descendente.
  const vigente = historial.find((m) => m.derivado.activa) ?? historial[0] ?? null
  const nombreCompleto = `${miembro.nombres} ${miembro.apellidos}`.trim()

  return (
    <>
      <PageHeader
        title={nombreCompleto}
        description={`Cédula ${miembro.cedula}`}
        actions={
          <Button
            href={`/admin/miembros/${miembro.id}/editar`}
            variant="secondary"
            icon={<Pencil size={16} />}
          >
            Editar datos
          </Button>
        }
      />

      <Stack gap={7}>
        <Card padding="lg">
          <div className={styles.estadoActual}>
            <div className={styles.estadoTextos}>
              <div className={styles.estadoBadges}>
                {vigente ? (
                  <>
                    <StatusBadge estado={vigente.derivado} />
                    <VenceEn estado={vigente.derivado} />
                  </>
                ) : (
                  <Badge tone="neutral">Sin membresía registrada</Badge>
                )}
              </div>

              {vigente && (
                <p className={styles.estadoNota}>
                  {vigente.derivado.activa
                    ? `Vigente hasta el ${formatearFecha(vigente.fecha_fin)}.`
                    : `La última membresía terminó el ${formatearFecha(vigente.fecha_fin)}.`}
                </p>
              )}
            </div>

            <div className={styles.dato}>
              <span className={styles.datoEtiqueta}>Nº de membresía</span>
              {/* Es lo que el comercio teclea y el payload del futuro QR:
                  copiarlo tiene que costar un clic. */}
              <Copiar
                valor={miembro.numero_membresia}
                label="Copiar número de membresía"
              />
            </div>
          </div>
        </Card>

        <Section title="Datos del miembro">
          <Card padding="lg">
            <div className={styles.datos}>
              <Dato etiqueta="Correo" valor={correo} />
              <Dato etiqueta="Teléfono" valor={miembro.telefono} />
              <Dato etiqueta="Ciudad" valor={ciudad?.nombre ?? null} />
              <Dato etiqueta="Dirección" valor={miembro.direccion} />
            </div>
          </Card>
        </Section>

        <Section title="Historial de membresías">
          <Card padding={historial.length === 0 ? 'none' : 'lg'}>
            {historial.length === 0 ? (
              <EmptyState
                title="Sin membresías"
                description="Este miembro todavía no tiene ninguna membresía registrada."
              />
            ) : (
              <ol className={styles.linea}>
                {historial.map((m) => (
                  <li key={m.id} className={styles.hito}>
                    <span
                      className={[
                        styles.punto,
                        m.derivado.activa && styles.puntoVigente,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-hidden="true"
                    />

                    <div className={styles.hitoCuerpo}>
                      <div className={styles.hitoCabecera}>
                        <span className={styles.hitoPlan}>{m.plan}</span>
                        <StatusBadge estado={m.derivado} size="sm" />
                        <Badge tone="neutral" size="sm">
                          {m.tipo}
                        </Badge>
                      </div>

                      <span className={styles.hitoFechas}>
                        {formatearFecha(m.fecha_inicio)} — {formatearFecha(m.fecha_fin)}
                      </span>

                      <div className={styles.hitoMeta}>
                        <span className={styles.precio}>
                          {formatearPrecio(m.precio_pagado)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </Section>

        <Section title="Renovar membresía">
          <RenovarForm miembroId={miembro.id} planes={planes ?? []} />
        </Section>
      </Stack>
    </>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className={styles.dato}>
      <span className={styles.datoEtiqueta}>{etiqueta}</span>
      <span className={[styles.datoValor, !valor && styles.datoVacio].filter(Boolean).join(' ')}>
        {valor ?? 'Sin registrar'}
      </span>
    </div>
  )
}
