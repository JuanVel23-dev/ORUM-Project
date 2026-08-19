import Link from 'next/link'
import {
  ChevronRight,
  CreditCard,
  KeyRound,
  Store,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cifra } from '@/components/ui/cifra'
import { Grid, PageHeader, Section, Stack } from '@/components/ui/layout'
import styles from './inicio.module.css'

export const metadata = { title: 'Inicio · ORUM' }

/** Fecha de hoy en 'YYYY-MM-DD', el formato de las columnas `date`. */
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Cifras del panel.
 *
 * Se consultan con `count: 'exact', head: true`: la base de datos devuelve
 * solo el número, sin traer ninguna fila.
 *
 * "Membresías vigentes" filtra por `estado = 'activa'` **y** `fecha_fin >= hoy`,
 * la misma regla que aplica `derivarEstadoMembresia`. Contar solo por `estado`
 * daría un número inflado, porque esa columna no se actualiza al vencer.
 */
async function obtenerCifras() {
  const admin = createAdminClient()
  const hoy = hoyISO()

  const [miembros, vigentes, comercios] = await Promise.all([
    admin
      .from('miembros')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    admin
      .from('membresias')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activa')
      .gte('fecha_fin', hoy),
    admin
      .from('comercios')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)
      .is('deleted_at', null),
  ])

  return {
    miembros: miembros.count ?? 0,
    vigentes: vigentes.count ?? 0,
    comercios: comercios.count ?? 0,
  }
}

export default async function AdminInicioPage() {
  const perfil = await requireRol('super_admin', 'empleado')
  const esSuperAdmin = perfil.rolCodigo === 'super_admin'

  const cifras = await obtenerCifras()

  return (
    <>
      <PageHeader
        title="Panel de ORUM"
        description={`Sesión iniciada como ${perfil.rolNombre.toLowerCase()}.`}
      />

      <Stack gap={7}>
        {/*
          El flujo estrella, siempre a un clic. Para un empleado es lo que hace
          todo el día; para el administrador, la acción más frecuente.
        */}
        <Card variant="brand" padding="lg" className={styles.destacado}>
          <div className={styles.destacadoCuerpo}>
            <div className={styles.destacadoTextos}>
              <h2 className={styles.destacadoTitulo}>Registrar cliente y vender membresía</h2>
              <p className={styles.destacadoDescripcion}>
                Crea el cliente, su cuenta de acceso y su primera membresía en un solo
                flujo. La contraseña se genera automáticamente y se muestra una única vez.
              </p>
            </div>

            <Button href="/admin/miembros/nuevo" size="lg" icon={<UserPlus size={17} />}>
              Empezar
            </Button>
          </div>
        </Card>

        <Section title="Estado del club">
          <Grid min="200px">
            <Card>
              <Cifra
                etiqueta="Miembros registrados"
                valor={cifras.miembros.toLocaleString('es-CO')}
              />
            </Card>

            <Card>
              <Cifra
                etiqueta="Membresías vigentes"
                valor={cifras.vigentes.toLocaleString('es-CO')}
                nota="Al día de hoy"
              />
            </Card>

            <Card>
              <Cifra
                etiqueta="Comercios activos"
                valor={cifras.comercios.toLocaleString('es-CO')}
              />
            </Card>
          </Grid>
        </Section>

        <Section title="Accesos">
          <Grid min="280px">
            <Acceso
              href="/admin/miembros"
              icon={<Users />}
              titulo="Miembros"
              descripcion="Buscar, consultar estado y renovar"
            />

            {esSuperAdmin && (
              <>
                <Acceso
                  href="/admin/comercios"
                  icon={<Store />}
                  titulo="Comercios aliados"
                  descripcion="Sucursales y promociones"
                />
                <Acceso
                  href="/admin/planes"
                  icon={<CreditCard />}
                  titulo="Planes de membresía"
                  descripcion="Precios y vigencias"
                />
                <Acceso
                  href="/admin/usuarios"
                  icon={<UserCog />}
                  titulo="Usuarios"
                  descripcion="Empleados y administradores"
                />
              </>
            )}

            <Acceso
              href="/admin/cuenta/password"
              icon={<KeyRound />}
              titulo="Mi contraseña"
              descripcion="Cambiar la clave de acceso"
            />
          </Grid>
        </Section>
      </Stack>
    </>
  )
}

function Acceso({
  href,
  icon,
  titulo,
  descripcion,
}: {
  href: string
  icon: React.ReactNode
  titulo: string
  descripcion: string
}) {
  return (
    <Link href={href} className={styles.acceso}>
      <span className={styles.accesoIcono}>{icon}</span>
      <span className={styles.accesoTextos}>
        <span className={styles.accesoTitulo}>{titulo}</span>
        <span className={styles.accesoDescripcion}>{descripcion}</span>
      </span>
      <ChevronRight size={17} className={styles.flecha} />
    </Link>
  )
}
