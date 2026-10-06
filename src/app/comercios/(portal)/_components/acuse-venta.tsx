'use client'

import type { CSSProperties } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EstrellaOrum, LogoOrum } from '@/components/ui/marca/marca'
import styles from './acuse-venta.module.css'

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Miles con punto, sin símbolo: lo que rueda en el monto. */
const MILES = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/*
  EL ACUSE DE LA VENTA  ·  el recibo (04/10/2026, cuarta pasada)
  ---------------------------------------------------------------------------
  Encargo del propietario, tras ver las dos primeras (negro y oro con
  estrellas; luego la misma sobre blanco): «no me gusta el diseño ni la
  animación; busca referencias de animaciones de pago de 2026 e impleméntalo.
  Debe ser elegante».

  LO QUE DICEN LAS REFERENCIAS, y de dónde sale cada decisión:

    · CONTENCIÓN ANTES QUE ADORNO. Las guías de pantallas de pago coinciden:
      una marca de verificación ligera, el monto grande y claro, a quién y la
      referencia, y nada de animaciones pesadas ni largas — «el alma de una
      pantalla de éxito es la confianza». Fuera el estallido de estrellas, el
      disco de oro macizo, la ola de color y el halo.
    · LA ✓ DE TRAZO FINO que se dibuja dentro de un anillo que se cierra: la
      firma de Apple Pay, y lo que hoy se lee como «pago hecho» sin leer.
    · EL MONTO QUE RUEDA, dígito a dígito, como un odómetro (el patrón de
      NumberFlow, que es hoy el estándar para un número que cambia). Antes
      «contaba» de cero al total: cuarenta cifras por segundo que el ojo no
      lee. Aquí cada columna gira y se asienta, de izquierda a derecha.
    · EL RECIBO. Los datos van en renglones —socio, membresía, hora, y la
      compra y el descuento cuando lo hay— bajo una línea de corte, como un
      tiquete: es lo que el cajero necesita para reclamar, puesto en su sitio.

  EL DISEÑO: una tarjeta blanca, entera. Arriba, el logotipo de ORUM en oro,
  la marca y el monto en el serif de display. Abajo, los renglones bajo una
  línea de corte. Un solo oro, de línea; nada relleno salvo el botón.

  LO QUE CAMBIÓ CON LA CUARTA PASADA, a la vista de la tercera («quiero que
  no me tenga que desplazar para abajo, que ocupe la pantalla y se vea todo;
  no me gusta el color de abajo; añade las estrellas de ORUM y anímalas para
  que tenga más dinamismo»):

    · CABE EN LA VENTANA. Las medidas verticales siguen al alto de la ventana
      (`dvh`, en el CSS): en un portátil bajo el recibo se aprieta en vez de
      obligar a bajar hasta el botón.
    · EL TALÓN YA NO ES CREMA: va sobre el mismo blanco.
    · LAS ESTRELLAS DE ORUM vuelven, pero no como estallido: una constelación
      a los lados de la marca. Salen del centro cuando el anillo se cierra y
      se quedan titilando, cada una a su ritmo. Es la imagen de la estrella
      del cliente (`EstrellaOrum`), la misma de la «O» del logotipo.

  LO QUE NO CAMBIA de las versiones anteriores, porque es lo que protege a la
  caja:

    · NO HACE ESPERAR. «Verificar otro socio» está montado, enfocado y
      pulsable desde el primer fotograma: con teclado, un Enter sigue la cola
      aunque la animación vaya por la mitad.
    · Todo es `transform` y `opacity`. El anillo se cierra con dos medias
      lunas que giran y la ✓ se dibuja con dos traslaciones opuestas: nada
      anima el trazo de un SVG.
    · Con movimiento reducido no viaja nada: cada pieza queda en su estado
      final —el anillo cerrado, la ✓ puesta, el monto escrito—.
*/

/** Los diez dígitos, dos veces: cada columna da una vuelta entera y se para. */
const TIRA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

/*
  LA CONSTELACIÓN. Dónde queda cada estrella respecto al centro de la marca
  (px), cuánto mide y a qué ritmo titila (0–3: de más vivo a más pausado).
  Solo a los lados: ninguna sube al logotipo ni baja al monto. Tabla fija y
  no `Math.random()`: un render no puede ser impuro, y una constelación que
  cae siempre igual de bien es mejor que una que a veces sale coja.
*/
const ESTRELLAS = [
  { dx: -60, dy: -20, talla: 18, ritmo: 0 },
  { dx: 62, dy: -24, talla: 13, ritmo: 1 },
  { dx: -96, dy: 8, talla: 11, ritmo: 2 },
  { dx: 98, dy: -6, talla: 20, ritmo: 3 },
  { dx: -128, dy: -16, talla: 15, ritmo: 1 },
  { dx: 132, dy: 16, talla: 11, ritmo: 0 },
  { dx: -84, dy: 28, talla: 9, ritmo: 3 },
  { dx: 86, dy: 26, talla: 9, ritmo: 2 },
  { dx: -154, dy: 12, talla: 9, ritmo: 2 },
  { dx: 156, dy: -12, talla: 9, ritmo: 1 },
]

/** El retardo de entrada de una pieza, como variable: lo único que admite `style`. */
const tras = (ms: number) => ({ '--retardo': `${ms}ms` }) as CSSProperties

/**
 * EL MONTO QUE RUEDA. Cada dígito es una columna de un carácter de alto con
 * la tira de los diez dígitos dentro; la tira se desplaza hasta el suyo. Los
 * puntos de millar no ruedan. Decorativo: el valor lo dice el texto de estado.
 */
function MontoRodante({ valor }: { valor: number }) {
  const caracteres = [...MILES.format(valor)]
  /* El orden de cada dígito entre los dígitos (sin contar los puntos): es lo
     que escalona las columnas de izquierda a derecha. */
  const ordenes = caracteres.map(
    (c, i) => caracteres.slice(0, i).filter((x) => x >= '0' && x <= '9').length,
  )

  return (
    <>
      {caracteres.map((c, i) =>
        c >= '0' && c <= '9' ? (
          <span key={i} className={styles.columna}>
            {/* La medida: el dígito final, invisible y en el flujo. Es lo que
                da el ancho a la columna, para que el monto quede con el
                espaciado natural de la tipografía y no con el de una tabla. */}
            <span className={styles.medida}>{c}</span>
            <span
              className={styles.tira}
              style={{ '--digito': Number(c), '--orden': ordenes[i] } as CSSProperties}
            >
              {TIRA.map((d, j) => (
                <span key={j} className={styles.digito}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className={styles.separador}>
            {c}
          </span>
        ),
      )}
    </>
  )
}

export function AcuseVenta({
  valorFinal,
  valorCompra,
  valorDescuento,
  nombre,
  numeroMembresia,
  hora,
  onCerrar,
}: {
  /** Lo que quedó GUARDADO: lo dice el servidor, no lo tecleado. */
  valorFinal: number
  valorCompra: number
  valorDescuento: number
  nombre: string
  numeroMembresia: string
  /** La hora del recibo, ya formateada en Bogotá por el servidor. */
  hora: string | null
  onCerrar: () => void
}) {
  const hayDescuento = valorDescuento > 0

  /* Los renglones del talón, en el orden de un recibo. La compra y el
     descuento solo aparecen si hubo descuento: sin él repetirían el total. */
  const renglones: { etiqueta: string; valor: string; acento?: boolean }[] = [
    { etiqueta: 'Socio', valor: nombre },
    { etiqueta: 'Membresía', valor: `N.º ${numeroMembresia}` },
    ...(hayDescuento
      ? [
          { etiqueta: 'Compra', valor: PESOS.format(valorCompra) },
          { etiqueta: 'Descuento', valor: `−${PESOS.format(valorDescuento)}`, acento: true },
        ]
      : []),
    ...(hora ? [{ etiqueta: 'Hora', valor: hora }] : []),
  ]

  return (
    <article className={styles.acuse}>
      <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
        <X size={20} aria-hidden="true" />
      </button>

      {/*
        LO QUE OYE UN LECTOR DE PANTALLA: una frase, entera y quieta, con los
        datos para reclamar —monto, socio y hora—. Lo que se ve es lo mismo
        repartido en la tarjeta y con el monto rodando, que no se anuncia.
      */}
      <p className="sr-only" role="status">
        Venta registrada. Se cobraron {PESOS.format(valorFinal)} a {nombre}, número de membresía{' '}
        {numeroMembresia}
        {hora && `, a las ${hora}`}.
      </p>

      {/* ── LA CABEZA: de quién es el recibo, que salió bien y cuánto. ── */}
      <div className={styles.cabeza}>
        {/* En oro, que es el que va sobre blanco. Su `alt` ya es «ORUM». */}
        <span className={styles.logo}>
          <LogoOrum variante="dorado" className={styles.logoImagen} />
        </span>

        {/* La marca: un anillo de trazo fino que se cierra y la ✓ que se
            dibuja dentro. Decorativa. */}
        <span className={styles.marca} aria-hidden="true">
          {/* Las estrellas de ORUM: salen del centro y se quedan titilando. */}
          {ESTRELLAS.map((e, i) => (
            <span
              key={i}
              className={styles.estrella}
              style={
                {
                  '--dx': `${e.dx}px`,
                  '--dy': `${e.dy}px`,
                  '--talla': `${e.talla}px`,
                  '--ritmo': e.ritmo,
                  '--orden': i,
                } as CSSProperties
              }
            >
              <EstrellaOrum className={styles.destello} />
            </span>
          ))}

          <span className={styles.eco} />
          <span className={`${styles.mitad} ${styles.mitadDerecha}`}>
            <span className={`${styles.arco} ${styles.arcoDerecho}`} />
          </span>
          <span className={`${styles.mitad} ${styles.mitadIzquierda}`}>
            <span className={`${styles.arco} ${styles.arcoIzquierdo}`} />
          </span>
          <span className={styles.visto}>
            <span className={styles.cortina}>
              <Check className={styles.trazo} size={30} strokeWidth={1.75} />
            </span>
          </span>
        </span>

        <h2 className={`${styles.etiqueta} ${styles.entra}`} style={tras(320)}>
          Venta registrada
        </h2>

        <p className={styles.monto} aria-hidden="true">
          <span className={`${styles.moneda} ${styles.entra}`} style={tras(380)}>
            $
          </span>
          <MontoRodante valor={valorFinal} />
        </p>
      </div>

      {/* ── EL TALÓN: los renglones del recibo, bajo la línea de corte. ── */}
      <div className={styles.talon}>
        {/*
          LOS DATOS PARA RECLAMAR. Un cajero que sospecha un error necesita
          con qué llamar al administrador: «me equivoqué en una venta de esta
          tarde» no localiza ninguna fila. `aria-hidden`: ya van en la frase
          de estado.
        */}
        <dl className={styles.renglones} aria-hidden="true">
          {renglones.map((r, i) => (
            <div
              key={r.etiqueta}
              className={`${styles.renglon} ${styles.entra}`}
              style={tras(620 + i * 60)}
            >
              <dt>{r.etiqueta}</dt>
              <dd className={r.acento ? styles.acento : undefined}>{r.valor}</dd>
            </div>
          ))}
        </dl>

        {/*
          HONESTIDAD EN LUGAR DE UN BOTÓN QUE NO EXISTE. El contrato de datos
          no expone ninguna anulación de venta (`API-CONTRACT.md` §4), así que
          no se ofrece un «Deshacer» de mentira: se dice a quién acudir y con
          qué datos, que es lo único cierto que se puede dar.
        */}
        <p className={`${styles.aviso} ${styles.entra}`} style={tras(620 + renglones.length * 60)}>
          ¿Te equivocaste? Esta venta no se puede anular desde aquí: escribe al administrador con la
          hora y el número del socio.
        </p>

        {/* La cola sigue: el camino de vuelta es un solo toque, y con teclado
            un solo Enter — el foco cae aquí al llegar el acuse, sin esperar a
            la animación. */}
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
