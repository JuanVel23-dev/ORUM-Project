import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './comercios-destacados.module.css'

/*
  COMERCIOS DESTACADOS  ·  la franja negra de la guía de marca
  ---------------------------------------------------------------------------
  Cinco comercios reales en tarjetas de retrato —foto a sangre, degradado
  negro abajo, y el logotipo en su placa circular junto al nombre—. Cada una
  abre la ficha del comercio ENCIMA de la landing (ruta interceptada de
  `(publico)/@modal`); por enlace directo, la ficha a pantalla completa.

  «Ver todos los comercios» lleva al directorio (`/explorar`): es la única
  lista exhaustiva. Por eso en móvil esta fila puede deslizarse sin romper la
  regla de «nada alcanzable solo deslizando»: todo lo que hay aquí está
  también allí.

  EL DESVANECIDO DEL BORDE DERECHO (móvil) le dice al visitante que la fila
  sigue sin necesidad de una barra de desplazamiento, que la guía retiró.

  Sin comercios no hay sección: una franja negra con un titular y nada debajo
  anuncia un club vacío.
*/

export function ComerciosDestacados({ comercios }: { comercios: ComercioVitrina[] }) {
  if (comercios.length === 0) return null

  return (
    <section
      id="comercios"
      className={[escaparate.franja, escaparate.tonoCacao, estilos.seccion].join(' ')}
      aria-labelledby="titulo-destacados"
    >
      <Revelar>
        <div className={estilos.cabecera}>
          <div>
            <h2 id="titulo-destacados" className={estilos.titulo}>
              Comercios destacados
            </h2>
            <p className={estilos.apoyo}>
              Lugares seleccionados para que vivas experiencias únicas.
            </p>
          </div>
          {/* Dos envoltorios: el ámbito oscuro y, dentro, el remapeo a oro
              pálido. En el mismo elemento empatarían en especificidad. */}
          <span className={escaparate.sobreFoto}>
            <span className={estilos.verTodos}>
              <Button href="/explorar" variant="secondary" pildora>
                Ver todos los comercios
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </span>
          </span>
        </div>
      </Revelar>

      <div className={estilos.marco}>
        <ul className={estilos.fila}>
          {comercios.map((c) => (
            <li key={c.id} className={estilos.celda}>
              <Link href={`/explorar/${c.id}`} className={estilos.tarjeta} scroll={false}>
                {c.portadaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
                  <img
                    className={estilos.foto}
                    src={c.portadaUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className={estilos.sinFoto} aria-hidden="true" />
                )}
                <span className={estilos.degradado} aria-hidden="true" />

                <span className={estilos.pie}>
                  <ComercioLogo logoUrl={c.logoUrl} nombre={c.nombre} />
                  <span className={estilos.textos}>
                    <span className={estilos.nombre}>{c.nombre}</span>
                    {c.categoriaNombre && (
                      <span className={estilos.categoria}>{c.categoriaNombre}</span>
                    )}
                    <span className={estilos.ver}>
                      Ver beneficios <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <span className={estilos.desvanecido} aria-hidden="true" />
      </div>
    </section>
  )
}
