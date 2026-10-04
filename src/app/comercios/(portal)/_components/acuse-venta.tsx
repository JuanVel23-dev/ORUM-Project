'use client'

import type { CSSProperties } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CifraAnimada } from '@/components/ui/cifra-animada'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import styles from './acuse-venta.module.css'

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/*
  EL ACUSE DE LA VENTA  ·  la animación de pagar (04/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «una animación de pagar, cuando se registre una
  venta. Algo muy impresionante».

  La ventana blanca del formulario se vuelve NEGRO Y ORO, que es donde el oro
  brillante de la marca puede lucir (sobre claro está prohibido). En orden, y
  en algo más de segundo y medio:

    1. EL TELÓN. Un círculo negro nace donde estaba el botón de cobrar —abajo,
       en el centro— y crece hasta cubrir la ventana: lo que llega sale de lo
       que se tocó (regla 4 de «Movimiento»: anclado al origen).
    2. EL SELLO. Un disco de oro cae con el rebote de lo que se gana, y la ✓
       se dibuja dentro de izquierda a derecha.
    3. LAS ONDAS Y LAS ESTRELLAS. Dos anillos se abren desde el sello y un
       puñado de estrellas de cuatro puntas —la de ORUM— sale disparado y se
       apaga. Oro y plata.
    4. EL MONTO sube de cero a lo cobrado, en el serif de display y en oro.

  POR QUÉ ESTO SÍ, cuando la regla cero dice que lo frecuente no se anima:
  es un encargo expreso, y es el único momento de la caja que es un final
  feliz. Y se cuidó lo que la regla protege:

    · NO HACE ESPERAR. «Verificar otro socio» está montado, enfocado y
      pulsable desde el primer fotograma: con teclado, un Enter sigue la cola
      aunque la animación vaya por la mitad.
    · Todo es `transform` y `opacity` (la ✓ se «dibuja» con dos traslaciones
      opuestas, no animando el trazo): corre en el compositor, también en el
      teléfono de gama media de una caja.
    · Con movimiento reducido no viaja nada: el recorte global deja cada pieza
      en su estado final —el acuse negro, el sello puesto, la cifra escrita— y
      las estrellas no llegan a verse.

  Las estrellas van en una TABLA FIJA y no con `Math.random()`: un render no
  puede ser impuro, y un estallido que cae siempre igual de bien es mejor que
  uno que a veces sale cojo.
*/

type Estrella = {
  /** Hacia dónde sale, en grados (0 = derecha, −90 = arriba). */
  angulo: number
  /** Hasta dónde llega, en px. */
  distancia: number
  /** Lado, en px. */
  talla: number
  /** Cuánto espera tras el estallido, en ms. */
  retardo: number
  tono: 'oro' | 'oroClaro' | 'oroHondo' | 'plata'
}

const ESTRELLAS: Estrella[] = [
  { angulo: -90, distancia: 124, talla: 14, retardo: 0, tono: 'oro' },
  { angulo: -62, distancia: 152, talla: 10, retardo: 40, tono: 'oroClaro' },
  { angulo: -32, distancia: 132, talla: 16, retardo: 20, tono: 'oroHondo' },
  { angulo: 0, distancia: 164, talla: 9, retardo: 60, tono: 'oro' },
  { angulo: 28, distancia: 122, talla: 12, retardo: 30, tono: 'plata' },
  { angulo: 62, distancia: 104, talla: 8, retardo: 80, tono: 'oroClaro' },
  { angulo: 118, distancia: 104, talla: 10, retardo: 50, tono: 'oroHondo' },
  { angulo: 152, distancia: 126, talla: 14, retardo: 10, tono: 'oro' },
  { angulo: 180, distancia: 166, talla: 9, retardo: 70, tono: 'plata' },
  { angulo: -150, distancia: 136, talla: 16, retardo: 25, tono: 'oroClaro' },
  { angulo: -120, distancia: 156, talla: 10, retardo: 55, tono: 'oroHondo' },
  { angulo: -105, distancia: 92, talla: 7, retardo: 90, tono: 'plata' },
  { angulo: -75, distancia: 96, talla: 8, retardo: 100, tono: 'oro' },
  { angulo: -15, distancia: 100, talla: 7, retardo: 110, tono: 'plata' },
  /* El rescoldo: tres destellos cortos junto al sello, cuando las demás ya
     se están apagando. */
  { angulo: -40, distancia: 60, talla: 10, retardo: 360, tono: 'oroClaro' },
  { angulo: 200, distancia: 56, talla: 8, retardo: 460, tono: 'plata' },
  { angulo: 80, distancia: 54, talla: 7, retardo: 540, tono: 'oro' },
]

/** El destino de cada estrella, como variables: es lo único que admite `style`. */
function destino(e: Estrella): CSSProperties {
  const rad = (e.angulo * Math.PI) / 180
  return {
    '--dx': `${Math.round(Math.cos(rad) * e.distancia)}px`,
    '--dy': `${Math.round(Math.sin(rad) * e.distancia)}px`,
    '--talla': `${e.talla}px`,
    '--retardo': `${e.retardo}ms`,
    /* Alternan el sentido del giro: todas girando igual se lee como un
       ventilador, no como un estallido. */
    '--giro': `${e.angulo % 2 === 0 ? 160 : -140}deg`,
  } as CSSProperties
}

/** El retardo de entrada de cada línea de texto, como variable. */
const tras = (ms: number) => ({ '--retardo': `${ms}ms` }) as CSSProperties

export function AcuseVenta({
  valorFinal,
  nombre,
  numeroMembresia,
  hora,
  onCerrar,
}: {
  /** Lo que quedó GUARDADO: lo dice el servidor, no lo tecleado. */
  valorFinal: number
  nombre: string
  numeroMembresia: string
  /** La hora del recibo, ya formateada en Bogotá por el servidor. */
  hora: string | null
  onCerrar: () => void
}) {
  return (
    <article className={styles.acuse} data-theme="dark">
      {/* El telón: el blanco del formulario que se va y el negro que llega. */}
      <span className={styles.telon} aria-hidden="true" />

      <button
        type="button"
        className={`${styles.cerrar} ${styles.entra}`}
        style={tras(560)}
        onClick={onCerrar}
        aria-label="Cerrar"
      >
        <X size={20} aria-hidden="true" />
      </button>

      {/* ── LA ESCENA: halo, ondas, sello y estrellas. Toda decorativa. ── */}
      <div className={styles.escena} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.onda} />
        <span className={`${styles.onda} ${styles.ondaSegunda}`} />

        {ESTRELLAS.map((e, i) => (
          <span key={i} className={`${styles.estrella} ${styles[e.tono]}`} style={destino(e)} />
        ))}

        <span className={styles.sello}>
          {/* La ✓ se «dibuja» con dos traslaciones opuestas: la cortina entra
              desde la izquierda y el trazo, dentro, viaja al revés. El trazo
              no se mueve en pantalla; lo que avanza es la ventana por la que
              se ve. Solo `translate`: nada de animar el trazo del SVG. */}
          <span className={styles.marca}>
            <span className={styles.cortina}>
              <Check className={styles.trazo} size={44} strokeWidth={2.75} />
            </span>
          </span>
        </span>
      </div>

      {/*
        LO QUE OYE UN LECTOR DE PANTALLA: una frase, entera y quieta, con los
        tres datos para reclamar —monto, socio y hora—. Lo que se ve debajo es
        lo mismo repartido en líneas y con la cifra contando, así que va
        `aria-hidden`: una cifra que cambia cuarenta veces por segundo no se
        anuncia.
      */}
      <p className="sr-only" role="status">
        Venta registrada. Se cobraron {PESOS.format(valorFinal)} a {nombre}, número de membresía{' '}
        {numeroMembresia}
        {hora && `, a las ${hora}`}.
      </p>

      <div className={styles.textos}>
        <div className={styles.entra} style={tras(480)}>
          <TituloSeccion como="h2" tamano="bloque" variante="sobreNegro" texto="Venta registrada" />
        </div>

        <p className={`${styles.monto} ${styles.entra}`} style={tras(580)} aria-hidden="true">
          <span className={styles.moneda}>$</span>
          <CifraAnimada valor={valorFinal} duracion={0.9} retardo={0.62} />
        </p>

        {/*
          LOS TRES DATOS PARA RECLAMAR: monto, socio y hora. Un cajero que
          sospecha un error necesita con qué llamar al administrador: «me
          equivoqué en una venta de esta tarde» no localiza ninguna fila.
        */}
        <p className={`${styles.nota} ${styles.entra}`} style={tras(700)} aria-hidden="true">
          {nombre}
          <span className={styles.notaMeta}>
            N.º {numeroMembresia}
            {hora && ` · ${hora}`}
          </span>
        </p>

        {/*
          HONESTIDAD EN LUGAR DE UN BOTÓN QUE NO EXISTE. El contrato de datos
          no expone ninguna anulación de venta (`API-CONTRACT.md` §4), así que
          no se ofrece un «Deshacer» de mentira: se dice a quién acudir y con
          qué datos, que es lo único cierto que se puede dar.
        */}
        <p className={`${styles.aviso} ${styles.entra}`} style={tras(800)}>
          ¿Te equivocaste? Esta venta no se puede anular desde aquí: escribe al administrador
          con la hora y el número del socio.
        </p>
      </div>

      {/* La cola sigue: el camino de vuelta es un solo toque, y con teclado un
          solo Enter — el foco cae aquí al llegar el acuse, sin esperar a la
          animación. */}
      <div className={`${styles.accion} ${styles.entra}`} style={tras(220)}>
        <Button
          onClick={onCerrar}
          variant="brand"
          size="lg"
          pildora
          fullWidth
          autoFocus
          icon={<RotateCcw size={17} />}
        >
          Verificar otro socio
        </Button>
      </div>
    </article>
  )
}
