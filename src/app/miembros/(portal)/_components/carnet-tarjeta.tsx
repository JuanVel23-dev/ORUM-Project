import { iniciales } from '@/components/ui/avatar'
import { StatusBadge, VenceEn } from '@/components/ui/badge'
import { Copiar } from '@/components/ui/copiar'
import { LogoOrum, MonogramaOrum } from '@/components/ui/marca/marca'
import { QrCode } from '@/components/ui/qr-code'
import type { DatosCarnet } from '@/lib/miembros/datos-carnet'
import estilos from './carnet-tarjeta.module.css'

/*
  EL CARNET COMO TARJETA  ·  rediseño del 30/09/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «rediseña ese carnet, no me gusta». La versión
  anterior era una columna larga —logo, foto, nombre, datos, QR, uno debajo
  de otro— que dentro de la ventana obligaba a desplazarse para verlo
  entero. Un carnet es un OBJETO, y se lee de un vistazo.

  Ahora tiene la proporción de una tarjeta de verdad (ID-1, 85,6 × 54 mm →
  1,586:1) y cabe entera en la ventana:

    · Arriba, el emisor: el logotipo DORADO (la tarjeta es blanca → «sobre
      blanco, oro») y «Carnet de socio».
    · En medio, quién es: la foto en su aro dorado, el nombre en Playfair, el
      plan y el estado (disco lleno / anillo hueco + texto, nunca color solo).
    · Abajo, los datos que se dictan en la caja —número y vigencia— y el QR
      pequeño, que «Ampliar» pone en grande.

  Blanca y sin trazo, como pidió el propietario en la Z2; la separa del
  fondo la sombra, y la firma de la marca es un monograma dorado muy tenue
  al fondo, a sangre, que no compite con ningún dato.

  El QR va negro sobre blanco en los dos temas: invertirlo rompe el escaneo
  en algunos lectores, delante del cajero.
*/
export function CarnetTarjeta({
  nombre,
  plan,
  numeroMembresia,
  estado,
  vigencia,
  fotoUrl,
}: DatosCarnet) {
  return (
    <article className={estilos.tarjeta} aria-label={`Carnet de socio de ${nombre}`}>
      {/* La firma de la marca, a sangre y casi transparente. */}
      <MonogramaOrum className={estilos.marcaAgua} />

      <header className={estilos.emisor}>
        <LogoOrum variante="dorado" className={estilos.logo} />
        <p className={estilos.tipo}>Carnet de socio</p>
      </header>

      <div className={estilos.identidad}>
        {/* `aria-hidden`: el nombre está al lado. `alt` vacío: una URL muerta
            con texto arrastraría el glifo de imagen rota. */}
        <span className={estilos.foto} aria-hidden="true">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
            <img src={fotoUrl} alt="" className={estilos.fotoImagen} decoding="async" />
          ) : (
            <span className={estilos.iniciales}>{iniciales(nombre)}</span>
          )}
        </span>

        <div className={estilos.quien}>
          <p className={estilos.nombre}>{nombre}</p>
          <p className={estilos.plan}>{plan}</p>
          {/* Derivado con `derivarEstadoMembresia`, nunca `membresias.estado`. */}
          <span className={estilos.estado}>
            <StatusBadge estado={estado} size="sm" />
            <VenceEn estado={estado} />
          </span>
        </div>
      </div>

      <div className={estilos.pie}>
        <dl className={estilos.datos}>
          <div className={estilos.dato}>
            <dt className={estilos.etiqueta}>Número</dt>
            <dd className={estilos.numero}>
              <Copiar valor={numeroMembresia} label="Copiar número de membresía" />
            </dd>
          </div>
          <div className={estilos.dato}>
            <dt className={estilos.etiqueta}>Vigente hasta</dt>
            <dd className={estilos.vigencia}>{vigencia}</dd>
          </div>
        </dl>

        {/* `data-motion-esencial`: el QR nunca se queda a medio camino de una
            transformación; es lo que se escanea. */}
        <div className={estilos.qr} data-motion-esencial>
          <QrCode
            value={numeroMembresia}
            size={256}
            className={estilos.qrMarco}
            label={`Código de la membresía ${numeroMembresia} de ${nombre}`}
          />
        </div>
      </div>
    </article>
  )
}
