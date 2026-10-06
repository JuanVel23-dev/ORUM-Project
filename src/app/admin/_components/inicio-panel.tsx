import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  KeyRound,
  Megaphone,
  Store,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import { BotonPaleta } from '@/components/shell/atajos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cifra } from '@/components/ui/cifra'
import { Grid, PageHeader, Section, Stack } from '@/components/ui/layout'
import styles from '../inicio.module.css'

/*
  LA PORTADA DEL PANEL  ·  rediseño del 04/10/2026
  ---------------------------------------------------------------------------
  Una pantalla de trabajo, no un recibimiento: lo que se hace cien veces al
  día arriba y a un clic, el estado del club en cuatro cifras, y los atajos
  a lo que se crea. La navegación NO se repite aquí: está entera en la barra
  de opciones.

  Sin animaciones de entrada: es la pantalla que más se abre (regla cero de
  «Movimiento»: lo frecuente no anima).
*/

/** Días hacia delante en los que una membresía cuenta como «por vencer». */
export const DIAS_POR_VENCER = 30

export type CifrasPanel = {
  miembros: number
  vigentes: number
  porVencer: number
  comercios: number
}

export function InicioPanel({
  esSuperAdmin,
  cifras,
  bajada,
}: {
  esSuperAdmin: boolean
  cifras: CifrasPanel
  /** El saludo, la fecha y el rol: los calcula la página, en la zona del negocio. */
  bajada: string
}) {
  const numero = (n: number) => n.toLocaleString('es-CO')

  return (
    <>
      <PageHeader
        title="Panel de ORUM"
        description={bajada}
      />

      <Stack gap={8}>
        {/*
          El flujo estrella y la búsqueda, siempre a un clic. Para un empleado
          es lo que hace todo el día; para el administrador, lo más frecuente.
          La única tarjeta principal de la pantalla.
        */}
        <Card principal padding="lg" className={styles.destacado}>
          <div className={styles.destacadoCuerpo}>
            <div className={styles.destacadoTextos}>
              <p className={styles.rotulo}>Lo de todos los días</p>
              <h2 className={styles.destacadoTitulo}>Registrar cliente y vender membresía</h2>
              <p className={styles.destacadoDescripcion}>
                Crea el cliente, su cuenta de acceso y su primera membresía en un solo flujo. Se
                le envía un correo para que active su acceso.
              </p>
            </div>

            <div className={styles.destacadoAcciones}>
              <Button
                href="/admin/miembros/nuevo"
                variant="brand"
                size="lg"
                icon={<UserPlus size={17} aria-hidden="true" />}
              >
                Empezar
              </Button>
              <BotonPaleta claseTecla={styles.tecla}>Buscar un miembro</BotonPaleta>
            </div>
          </div>
        </Card>

        <Section title="Estado del club">
          <Grid min="200px">
            <Card>
              <Cifra etiqueta="Miembros registrados" valor={numero(cifras.miembros)} />
            </Card>
            <Card>
              <Cifra
                etiqueta="Membresías vigentes"
                valor={numero(cifras.vigentes)}
                nota="Al día de hoy"
              />
            </Card>
            <Card>
              <Cifra
                etiqueta="Por vencer"
                valor={numero(cifras.porVencer)}
                nota={`En los próximos ${DIAS_POR_VENCER} días`}
              />
            </Card>
            <Card>
              <Cifra etiqueta="Comercios activos" valor={numero(cifras.comercios)} />
            </Card>
          </Grid>
        </Section>

        <Section title="Atajos">
          <Grid min="260px">
            <Atajo
              href="/admin/miembros"
              icono={<Users />}
              titulo="Miembros"
              descripcion="Buscar, consultar el estado y renovar"
            />

            {esSuperAdmin && (
              <>
                <Atajo
                  href="/admin/comercios/nuevo"
                  icono={<Store />}
                  titulo="Nuevo comercio aliado"
                  descripcion="Con sus sucursales y promociones"
                />
                <Atajo
                  href="/admin/anuncios/nuevo"
                  icono={<Megaphone />}
                  titulo="Publicar una novedad"
                  descripcion="La ven los socios en su portal"
                />
                <Atajo
                  href="/admin/metricas"
                  icono={<BarChart3 />}
                  titulo="Métricas"
                  descripcion="Ventas, redenciones y comercios"
                />
                <Atajo
                  href="/admin/planes/nuevo"
                  icono={<CreditCard />}
                  titulo="Nuevo plan"
                  descripcion="Precio y vigencia de una membresía"
                />
                <Atajo
                  href="/admin/usuarios/nuevo"
                  icono={<UserCog />}
                  titulo="Nuevo usuario del panel"
                  descripcion="Empleados y administradores"
                />
              </>
            )}

            <Atajo
              href="/admin/cuenta/password"
              icono={<KeyRound />}
              titulo="Mi contraseña"
              descripcion="Cambiar la clave de acceso"
            />
          </Grid>
        </Section>
      </Stack>
    </>
  )
}

/** Un atajo: una tarjeta que se levanta al apuntarla y lleva a un sitio. */
function Atajo({
  href,
  icono,
  titulo,
  descripcion,
}: {
  href: string
  icono: React.ReactNode
  titulo: string
  descripcion: string
}) {
  return (
    <Link href={href} className={styles.atajo}>
      <span className={styles.atajoIcono} aria-hidden="true">
        {icono}
      </span>
      <span className={styles.atajoTextos}>
        <span className={styles.atajoTitulo}>{titulo}</span>
        <span className={styles.atajoDescripcion}>{descripcion}</span>
      </span>
      <ArrowRight size={17} aria-hidden="true" className={styles.atajoFlecha} />
    </Link>
  )
}
