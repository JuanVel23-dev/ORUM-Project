import { BarChart3, Filter } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  rangoUltimosDias,
  agruparMembresiasPorEmpleado,
  agruparVentasPorComercio,
  agruparVentasPorMiembroYComercio,
  type ResumenComercio,
  type ResumenEmpleado,
  type ResumenUsoMiembro,
} from '@/lib/metricas/metricas'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cifra } from '@/components/ui/cifra'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/input'
import { Grid, PageHeader, Section, Stack } from '@/components/ui/layout'
import styles from './metricas.module.css'

export const metadata = { title: 'Métricas · ORUM' }

/** Pesos colombianos sin decimales: aquí nadie cobra centavos. */
const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** 'YYYY-MM-DD' → texto legible, sin que el parseo se desplace un día por UTC. */
function fechaLegible(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return FECHA_LARGA.format(new Date(Date.UTC(a, m - 1, d)))
}

const COL_EMPLEADO: ReadonlyArray<Column<ResumenEmpleado>> = [
  { key: 'nombre', header: 'Empleado', primary: true, cell: (r) => r.nombre },
  { key: 'cantidad', header: 'Vendidas', numeric: true, width: '120px', cell: (r) => r.cantidad },
  {
    key: 'monto',
    header: 'Monto total',
    numeric: true,
    width: '160px',
    cell: (r) => <span className={styles.monto}>{PESOS.format(r.monto)}</span>,
  },
]

const COL_COMERCIO: ReadonlyArray<Column<ResumenComercio>> = [
  { key: 'nombre', header: 'Comercio', primary: true, cell: (r) => r.nombre },
  { key: 'cantidad', header: 'Ventas', numeric: true, width: '110px', cell: (r) => r.cantidad },
  {
    key: 'monto',
    header: 'Monto total',
    numeric: true,
    width: '160px',
    cell: (r) => <span className={styles.monto}>{PESOS.format(r.montoTotal)}</span>,
  },
  {
    key: 'descuento',
    header: 'Ahorro entregado',
    numeric: true,
    width: '170px',
    cell: (r) => <span className={styles.monto}>{PESOS.format(r.descuentoTotal)}</span>,
  },
]

const COL_USO: ReadonlyArray<Column<ResumenUsoMiembro>> = [
  { key: 'miembro', header: 'Miembro', primary: true, cell: (r) => r.miembroNombre },
  { key: 'comercio', header: 'Comercio', cell: (r) => r.comercioNombre },
  { key: 'veces', header: 'Veces usada', numeric: true, width: '140px', cell: (r) => r.veces },
]

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  await requireRol('super_admin')
  const { desde: desdeParam, hasta: hastaParam } = await searchParams
  const defecto = rangoUltimosDias(30)
  const desde = desdeParam || defecto.desde
  const hasta = hastaParam || defecto.hasta

  const admin = createAdminClient()

  const [
    { count: miembrosNuevosCount },
    { data: membresiasVendidas },
    { data: empleados },
    { data: ventas },
    { data: sucursales },
    { data: comercios },
    { data: miembros },
  ] = await Promise.all([
    admin
      .from('miembros')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('fecha_registro', `${desde} 00:00:00`)
      .lte('fecha_registro', `${hasta} 23:59:59`),
    admin
      .from('membresias')
      .select('vendido_por, precio_pagado')
      .gte('fecha_inicio', desde)
      .lte('fecha_inicio', hasta),
    admin.from('empleados').select('id, nombres, apellidos').is('deleted_at', null),
    admin
      .from('ventas')
      .select('sucursal_id, miembro_id, valor_final, valor_descuento')
      .gte('fecha_hora', `${desde} 00:00:00`)
      .lte('fecha_hora', `${hasta} 23:59:59`),
    admin.from('sucursales').select('id, comercio_id'),
    admin.from('comercios').select('id, nombre'),
    admin.from('miembros').select('id, nombres, apellidos').is('deleted_at', null),
  ])

  const porEmpleado = agruparMembresiasPorEmpleado(membresiasVendidas ?? [], empleados ?? [])
  const porComercio = agruparVentasPorComercio(ventas ?? [], sucursales ?? [], comercios ?? [])
  const porMiembroComercio = agruparVentasPorMiembroYComercio(
    ventas ?? [],
    sucursales ?? [],
    comercios ?? [],
    miembros ?? [],
  )

  /*
    Los totales se derivan de lo ya agrupado en lugar de pedir otra consulta:
    misma cifra por construcción, y una consulta menos por carga de página.
  */
  const ingresoMembresias = porEmpleado.reduce((s, r) => s + r.monto, 0)
  const membresiasVendidasCount = porEmpleado.reduce((s, r) => s + r.cantidad, 0)
  const ahorroEntregado = porComercio.reduce((s, r) => s + r.descuentoTotal, 0)

  /** Atajos: mismo destino que el formulario, un clic en vez de dos fechas. */
  const atajos = [7, 30, 90].map((dias) => {
    const r = rangoUltimosDias(dias)
    return {
      dias,
      href: `/admin/metricas?desde=${r.desde}&hasta=${r.hasta}`,
      activo: desde === r.desde && hasta === r.hasta,
    }
  })

  return (
    <>
      <PageHeader
        title="Métricas"
        description="Cómo se comportó el club en un periodo: cuánto se vendió, quién lo vendió y cuánto ahorro recibieron los miembros."
      />

      <form method="get" className={styles.filtros}>
        <div className={styles.campo}>
          <label className={styles.etiqueta} htmlFor="m-desde">
            Desde
          </label>
          <Input id="m-desde" type="date" name="desde" defaultValue={desde} />
        </div>

        <div className={styles.campo}>
          <label className={styles.etiqueta} htmlFor="m-hasta">
            Hasta
          </label>
          <Input id="m-hasta" type="date" name="hasta" defaultValue={hasta} />
        </div>

        <Button type="submit" variant="secondary" icon={<Filter size={16} />}>
          Aplicar
        </Button>
      </form>

      <div className={styles.atajos}>
        {atajos.map((a) => (
          <Button
            key={a.dias}
            href={a.href}
            size="sm"
            variant={a.activo ? 'secondary' : 'ghost'}
            aria-current={a.activo ? 'page' : undefined}
          >
            Últimos {a.dias} días
          </Button>
        ))}
      </div>

      <p className={styles.periodo}>
        Del {fechaLegible(desde)} al {fechaLegible(hasta)}
      </p>

      <Stack gap={7}>
        <Grid min="190px">
          <Card>
            <Cifra
              etiqueta="Miembros nuevos"
              valor={(miembrosNuevosCount ?? 0).toLocaleString('es-CO')}
              size="sm"
            />
          </Card>
          <Card>
            <Cifra
              etiqueta="Membresías vendidas"
              valor={membresiasVendidasCount.toLocaleString('es-CO')}
              size="sm"
            />
          </Card>
          <Card>
            <Cifra
              etiqueta="Ingreso por membresías"
              valor={PESOS.format(ingresoMembresias)}
              size="sm"
            />
          </Card>
          <Card>
            <Cifra
              etiqueta="Ahorro entregado"
              valor={PESOS.format(ahorroEntregado)}
              nota="Lo que los miembros dejaron de pagar"
              size="sm"
            />
          </Card>
        </Grid>

        <Section title="Membresías vendidas por empleado">
          <DataList
            caption="Membresías vendidas por empleado en el periodo"
            items={porEmpleado}
            columns={COL_EMPLEADO}
            getKey={(r) => r.empleadoId ?? 'super_admin'}
            empty={
              <EmptyState
                icon={<BarChart3 size={24} />}
                title="Sin ventas en el periodo"
                description="No se vendió ninguna membresía entre las fechas seleccionadas."
              />
            }
          />
        </Section>

        <Section title="Ventas por comercio">
          <DataList
            caption="Ventas registradas por comercio aliado en el periodo"
            items={porComercio}
            columns={COL_COMERCIO}
            getKey={(r) => r.comercioId}
            empty={
              <EmptyState
                icon={<BarChart3 size={24} />}
                title="Sin ventas registradas"
                description="Ningún comercio aliado registró ventas entre las fechas seleccionadas."
              />
            }
          />
        </Section>

        <Section title="Uso de la membresía">
          <DataList
            caption="Veces que cada miembro usó su membresía en cada comercio (20 primeros)"
            items={porMiembroComercio}
            columns={COL_USO}
            getKey={(r) => `${r.miembroId}-${r.comercioId}`}
            empty={
              <EmptyState
                icon={<BarChart3 size={24} />}
                title="Sin uso registrado"
                description="Todavía no hay ventas que atribuir a ningún miembro en este periodo."
              />
            }
          />
        </Section>
      </Stack>
    </>
  )
}
