'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/shell/app-shell'
import { Badge, StatusBadge, VenceEn } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Grid, PageHeader, Section, Stack } from '@/components/ui/layout'
import { SegmentedControl } from '@/components/ui/segmented'
import type { MiembroEncontrado } from '@/lib/miembros/buscar-miembros'
import type { RolCodigo } from '@/lib/supabase/database.types'

/*
  Vista previa del app shell con datos falsos.

  Existe porque el shell real vive en `/admin`, que exige sesión de Supabase:
  sin credenciales no habría forma de revisar la navegación, el indicador
  activo, la barra inferior ni la paleta. Es la misma razón por la que existe
  `/dev/ui`, y por eso el shell recibe sus datos por props en vez de leerlos
  él mismo.
*/

const MIEMBROS_FALSOS: MiembroEncontrado[] = [
  {
    id: 1,
    numeroMembresia: '00184472',
    nombre: 'María Fernanda Ospina',
    cedula: '1020304050',
    plan: 'Oro',
    estado: { activa: true, diasRestantes: 190 },
  },
  {
    id: 2,
    numeroMembresia: '00190038',
    nombre: 'Carlos Andrés Betancur',
    cedula: '1098765432',
    plan: 'Oro',
    estado: { activa: true, diasRestantes: 12 },
  },
  {
    id: 3,
    numeroMembresia: '00201155',
    nombre: 'Juliana del Pilar Rojas',
    cedula: '1122334455',
    plan: 'Base',
    estado: { activa: false, motivo: 'vencida' },
  },
]

async function buscarFalso(termino: string): Promise<MiembroEncontrado[]> {
  // Retardo para poder ver el estado de carga de la paleta.
  await new Promise((r) => setTimeout(r, 260))
  const t = termino.toLowerCase()
  return MIEMBROS_FALSOS.filter(
    (m) =>
      m.nombre.toLowerCase().includes(t) ||
      m.numeroMembresia.includes(t) ||
      m.cedula.includes(t),
  )
}

export function ShellPreview() {
  const [rol, setRol] = useState<RolCodigo>('super_admin')

  return (
    <AppShell
      // `key` fuerza el remontaje al cambiar de rol, para que la navegación
      // se reconstruya con los destinos correctos.
      key={rol}
      user={{
        nombre: rol === 'super_admin' ? 'Daniel Bulla' : 'Ana Restrepo',
        email: rol === 'super_admin' ? 'daniel@orum.co' : 'ana@orum.co',
        rolNombre: rol === 'super_admin' ? 'Super administrador' : 'Empleado',
        rolCodigo: rol,
      }}
      cerrarSesion={() => {}}
      buscar={buscarFalso}
    >
      <PageHeader
        title="Vista previa del shell"
        description="Datos falsos. Cambia el rol para ver cómo se adaptan la barra lateral y la barra inferior, y pulsa Ctrl+K para la paleta de comandos."
        actions={<Button icon={<Plus size={16} />}>Registrar miembro</Button>}
      />

      <Stack gap={7}>
        <Section title="Rol simulado">
          <SegmentedControl
            options={[
              { value: 'super_admin', label: 'Super administrador' },
              { value: 'empleado', label: 'Empleado' },
            ]}
            value={rol}
            onChange={setRol}
            ariaLabel="Rol simulado"
            size="md"
          />
        </Section>

        <Section title="Qué revisar aquí">
          <Grid min="260px">
            <Card>
              <Stack gap={2}>
                <Badge tone="gold" size="sm">
                  Navegación
                </Badge>
                <p className="muted">
                  Estrecha la ventana por debajo de 1024px para ver el rail de iconos, y
                  por debajo de 768px para la barra inferior en la zona del pulgar.
                </p>
              </Stack>
            </Card>

            <Card>
              <Stack gap={2}>
                <Badge tone="gold" size="sm">
                  Indicador activo
                </Badge>
                <p className="muted">
                  Navega entre secciones: el fondo del destino activo se desliza de uno a
                  otro en vez de parpadear.
                </p>
              </Stack>
            </Card>

            <Card>
              <Stack gap={2}>
                <Badge tone="gold" size="sm">
                  Paleta ⌘K
                </Badge>
                <p className="muted">
                  Busca «maría», «juliana» o «0018». El estado de la membresía se ve en el
                  propio resultado, sin abrir la ficha.
                </p>
              </Stack>
            </Card>
          </Grid>
        </Section>

        <Section title="Contenido de ejemplo">
          <Grid min="280px">
            {MIEMBROS_FALSOS.map((m) => (
              <Card key={m.id} padding="none">
                <CardHeader
                  title={m.nombre}
                  subtitle={`Nº ${m.numeroMembresia} · CC ${m.cedula}`}
                />
                <CardBody>
                  <Stack direction="row" gap={2} align="center" wrap>
                    {m.estado && <StatusBadge estado={m.estado} />}
                    {m.estado && <VenceEn estado={m.estado} />}
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Section>
      </Stack>
    </AppShell>
  )
}
