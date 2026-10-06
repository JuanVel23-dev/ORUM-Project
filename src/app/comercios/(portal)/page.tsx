import { createClient } from '@/lib/supabase/server'
import { Store, TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/ui/feedback'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { obtenerMiComercio } from '@/lib/comercios/comercio-sesion'
import { formatearBeneficioCorto } from '@/lib/comercios/beneficios-formato'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { obtenerWhatsappSoporte } from '@/lib/publico/datos-publicos'
import { hoyISO } from '@/lib/shared/fecha'
import { ENTRADA, retardoEntrada } from '@/lib/shared/revelado'
import { VerificacionTool } from './_components/verificacion-tool'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './_components/verificar.module.css'

export const metadata = { title: 'Verificar membresía · ORUM Comercios' }

/** Lo que llega escrito al WhatsApp de soporte desde la ayuda de la caja. */
const MENSAJE_SOPORTE = 'Hola, necesito ayuda con la herramienta de comercios de ORUM.'

/*
  LA CAJA  ·  rediseño del 04/10/2026, con el estilo del Portal Público
  ---------------------------------------------------------------------------
  El `h1` y la foto los pone el layout (el banner con el nombre del comercio).
  Aquí van las tarjetas que montan sobre su canto:

    · LA HERRAMIENTA, a la izquierda: verificar el carnet → el veredicto →
      registrar la venta. Sigue siendo un solo recorrido, de arriba abajo.
    · A la derecha (debajo en el teléfono), LAS PROMOCIONES VIGENTES del
      comercio: lo que el cajero puede aplicar hoy, a la vista antes de tener
      que abrir el selector. Son los mismos datos que ya se cargaban para el
      formulario de venta; no cuestan una consulta más. Y la ayuda por
      WhatsApp, que sustituye al «escribe al administrador» sin enlace.

  En escritorio las dos columnas son lo que da estructura a la pantalla
  ancha; antes era una columna de 560 px en mitad de un campo crema.

  LA ENTRADA (`ENTRADA`) va en los ENVOLTORIOS de esta página, que no se
  remontan: el formulario sí lo hace tras cada venta, y animarlo ahí sería
  repetir la entrada decenas de veces al día (regla cero de frecuencia).
*/
export default async function ComerciosHomePage() {
  const comercio = await obtenerMiComercio()

  if (!comercio) {
    return (
      <div className={[styles.tarjeta, styles.aviso, ENTRADA].join(' ')} style={retardoEntrada(2)}>
        <EmptyState
          icon={<TriangleAlert size={24} />}
          title="Cuenta sin comercio asociado"
          description="Esta cuenta no está vinculada a ningún comercio. Escribe al administrador del club para que la conecte."
        />
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: sucursales }, { data: promocionesRaw }, { data: tipos }, soporteCrudo] =
    await Promise.all([
      supabase
        .from('sucursales')
        .select('id, nombre')
        .eq('comercio_id', comercio.id)
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')
        .limit(50),
      supabase
        .from('promociones')
        .select('id, titulo, tipo_beneficio_id, valor, activo, fecha_inicio, fecha_fin')
        .eq('comercio_id', comercio.id)
        .eq('activo', true)
        .is('deleted_at', null)
        .limit(50),
      supabase.from('tipos_beneficio').select('id, codigo').limit(10),
      obtenerWhatsappSoporte(),
    ])

  if (!sucursales || sucursales.length === 0) {
    return (
      <div className={[styles.tarjeta, styles.aviso, ENTRADA].join(' ')} style={retardoEntrada(2)}>
        <EmptyState
          icon={<Store size={24} />}
          title="Sin sucursales activas"
          description="Una venta se registra siempre contra una sucursal, y este comercio no tiene ninguna activa. Escribe al administrador del club."
        />
      </div>
    )
  }

  const codigoPorTipoId = new Map((tipos ?? []).map((t) => [t.id, t.codigo as TipoBeneficioCodigo]))
  const hoy = hoyISO()
  const promociones = (promocionesRaw ?? [])
    .filter(
      (p) =>
        esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy) &&
        codigoPorTipoId.has(p.tipo_beneficio_id),
    )
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      tipoCodigo: codigoPorTipoId.get(p.tipo_beneficio_id)!,
      valor: p.valor,
    }))

  /* Solo dígitos: `wa.me` rechaza espacios, guiones y paréntesis. */
  const soporte = (soporteCrudo ?? '').replace(/\D/g, '')

  return (
    <div className={styles.cuerpo}>
      {/* ── LA HERRAMIENTA ─────────────────────────────────────────────── */}
      <div className={[styles.herramienta, ENTRADA].join(' ')} style={retardoEntrada(2)}>
        <VerificacionTool sucursales={sucursales} promociones={promociones} />
      </div>

      {/* ── LO QUE SE PUEDE APLICAR HOY, Y LA AYUDA ───────────────────── */}
      <aside className={[styles.lateral, ENTRADA].join(' ')} style={retardoEntrada(4)}>
        <section className={styles.tarjeta} aria-labelledby="titulo-promociones">
          <TituloSeccion
            id="titulo-promociones"
            como="h2"
            tamano="bloque"
            texto="Tus promociones"
          />

          {promociones.length > 0 ? (
            <ul className={styles.promociones}>
              {promociones.map((p) => (
                <li key={p.id} className={styles.promocion}>
                  {/* La cifra corta de las tarjetas del directorio («10%»,
                      «2x1»): el título de al lado ya dice el resto. */}
                  <span className={styles.promocionValor}>
                    {formatearBeneficioCorto(p.tipoCodigo, p.valor)}
                  </span>
                  <span className={styles.promocionTitulo}>{p.titulo}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.sinPromociones}>
              Hoy no tienes promociones vigentes. La venta se registra igual, sin descuento.
            </p>
          )}
        </section>

        <p className={styles.ayuda}>
          ¿Necesitas ayuda con una venta?{' '}
          {soporte ? (
            <a
              href={`https://wa.me/${soporte}?text=${encodeURIComponent(MENSAJE_SOPORTE)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escríbenos por WhatsApp
            </a>
          ) : (
            'Escribe al administrador del club.'
          )}
        </p>
      </aside>
    </div>
  )
}
