import { Check } from 'lucide-react'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { formatearPesos, type PlanPublico } from '@/lib/publico/planes'
import escaparate from '../escaparate.module.css'
import { CtaSocio } from './cta-socio'
import { Revelar } from './revelar'
import estilos from './membresias-publicas.module.css'

/*
  ELIGE TU MEMBRESÍA  ·  los planes reales, con su botón de adquirir
  ---------------------------------------------------------------------------
  Los precios salen de `planes_membresia` en cada petición: si el
  administrador cambia uno, la portada lo dice al momento, sin redesplegar.
  El ahorro del plan largo se CALCULA (`prepararPlanes`), no se escribe: el
  boceto decía «ahorra 2 meses» junto a unos precios con los que se
  ahorraban más de tres y medio.

  «Adquirir» abre WhatsApp con el plan ya escrito en el mensaje: la venta
  hoy la cierra una persona, y el mensaje le ahorra al socio explicar qué
  quiere y a quien atiende preguntar cuál de los dos.

  Las tarjetas son superficies levantadas: sombra, sin trazo. La del plan
  destacado sube un escalón (`--shadow-raised`) y lleva la etiqueta de su
  ahorro — la jerarquía la da la luz, no un color.
*/

type Props = {
  planes: PlanPublico[]
  soporte: string | null
  totalComercios: number
}

export function MembresiasPublicas({ planes, soporte, totalComercios }: Props) {
  const ventajas = [
    'Beneficio activo desde el primer día',
    totalComercios > 0
      ? `Válido en ${totalComercios === 1 ? 'el comercio aliado' : `los ${totalComercios.toLocaleString('es-CO')} comercios aliados`}`
      : 'Válido en todos los comercios aliados',
    'Sin cobros automáticos: pagas por WhatsApp y renuevas solo si quieres',
    'Incluye tarjeta física de la membresía',
  ]

  return (
    <section
      id="membresias"
      className={[escaparate.franja, escaparate.tonoPapel].join(' ')}
      aria-labelledby="titulo-membresias"
    >
      <Revelar>
        <div className={estilos.bloque}>
          <div className={estilos.texto}>
            <div>
              <h2 id="titulo-membresias" className={escaparate.tituloSeccion}>
                Elige tu <em className={escaparate.acento}>membresía</em>
              </h2>
              <p className={estilos.apoyo}>
                Un solo carnet, beneficio inmediato en todos los aliados.
              </p>
            </div>

            <ul className={estilos.ventajas}>
              {ventajas.map((v) => (
                <li key={v} className={estilos.ventaja}>
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" className={estilos.check} />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          {planes.length > 0 ? (
            <ul className={estilos.planes}>
              {planes.map((plan) => (
                <li
                  key={plan.id}
                  className={[estilos.plan, plan.destacado && estilos.destacado]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {plan.destacado && plan.ahorro !== null && (
                    <p className={estilos.etiqueta}>Ahorra {formatearPesos(plan.ahorro)}</p>
                  )}
                  <h3 className={estilos.nombre}>{plan.nombre}</h3>
                  <p className={estilos.precio}>
                    <span className={estilos.cifra}>{formatearPesos(plan.precio)}</span>
                    <span className={estilos.periodo}>/ {plan.periodo}</span>
                  </p>
                  <p className={estilos.descripcion}>{descripcionDe(plan)}</p>

                  {soporte && (
                    <span className={estilos.accion}>
                      <WhatsAppButton
                        telefono={soporte}
                        mensaje={`Hola, quiero adquirir el plan ${plan.nombre} de ORUM (${formatearPesos(plan.precio)} / ${plan.periodo}).`}
                        variant="secondary"
                        size="lg"
                        pildora
                        fullWidth
                      >
                        Adquirir {plan.nombre.toLowerCase()}
                      </WhatsAppButton>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            /* Sin planes activos en la base, la sección no inventa precios:
               remite a quien los sabe. */
            <div className={estilos.sinPlanes}>
              <p className={estilos.descripcion}>
                Escríbenos y te contamos los planes vigentes y sus precios.
              </p>
              <CtaSocio soporte={soporte} />
            </div>
          )}
        </div>
      </Revelar>
    </section>
  )
}

/**
 * La línea de apoyo de cada plan. Manda la descripción del administrador; si
 * no la hay, se deriva de los números —nunca una promesa que no salga de
 * ellos—.
 */
function descripcionDe(plan: PlanPublico): string {
  const propia = (plan.descripcion ?? '').trim()
  if (propia) return propia
  if (plan.duracionMeses === 1) return 'Ideal para probar el club sin compromiso.'
  if (plan.mensualEquivalente !== null) {
    return `Equivale a ${formatearPesos(plan.mensualEquivalente)} al mes.`
  }
  return 'Todo el club, por más tiempo.'
}
