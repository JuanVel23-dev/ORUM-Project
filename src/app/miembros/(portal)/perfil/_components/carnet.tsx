import { iniciales } from '@/components/ui/avatar'
import { StatusBadge, VenceEn } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Copiar } from '@/components/ui/copiar'
import { QrCode } from '@/components/ui/qr-code'
import type { EstadoDerivado } from '@/lib/miembros/membresias'
import estilos from '../perfil.module.css'

/*
  EL CARNET  ·  el objeto, sin la pantalla que lo rodea
  --------------------------------------------------------------------------
  Se extrajo de `page.tsx` porque ahora se pinta DOS veces: en la página y,
  ampliado, dentro del `<Overlay>` que abre `CarnetAmpliable`. Dos copias
  escritas a mano se habrían separado al primer retoque.

  Server Component. Lo único de cliente que entra aquí es `Copiar`, que trae
  su propia directiva. Se puede pasar como prop a un componente de cliente
  —eso hace `page.tsx`— porque quien crea el elemento sigue siendo el
  servidor.

  LA COMPOSICIÓN, que es lo que cambió en esta tanda: UN SOLO EJE VERTICAL.
  Wordmark, foto, nombre, plan, estado, número, vigencia y QR, todo centrado
  sobre la misma línea, como un carnet de verdad. Antes la foto estaba en la
  esquina del pasaporte y el nombre corría a ancho completo desde la
  izquierda: se leía como una ficha de datos, no como una credencial.

  Y LA JERARQUÍA LA MANDA LA FOTO, no el nombre. El nombre baja del peldaño
  `hero-2` (32–48px) al `display-2` (28–36px) —sigue en Fraunces y sigue por
  encima del suelo de 28px que la dirección le pone al serif— y la foto sube
  de 88px cuadrados a 128px circulares. En un carnet físico lo que identifica
  a un metro de distancia es la cara.
*/

export type VarianteCarnet = 'pagina' | 'ampliado'

type Props = {
  nombre: string
  /** Nombre del plan ya resuelto. `planes_membresia` sostiene varios. */
  plan: string
  numeroMembresia: string
  /** Ya derivado con `derivarEstadoMembresia`, nunca `membresias.estado`. */
  estado: EstadoDerivado
  /** `fecha_fin` ya formateada en UTC por quien la leyó de la base. */
  vigencia: string
  fotoUrl: string | null
  /**
   * `ampliado` sube la foto y el QR y afloja el relleno. No cambia el objeto:
   * es el mismo carnet más cerca.
   */
  variante?: VarianteCarnet
}

export function Carnet({
  nombre,
  plan,
  numeroMembresia,
  estado,
  vigencia,
  fotoUrl,
  variante = 'pagina',
}: Props) {
  const esAmpliado = variante === 'ampliado'

  return (
    /*
      `padding="none"`: el relleno lo pone `.carnetInterior`, que es además
      quien se eleva por encima del halo dorado.

      `variant="brand"` aporta el hairline superior de su `::before`; el filo
      dorado del contorno lo sube el módulo, porque sobre chocolate el
      `--brand-edge` al 45 % de la primitiva no se ve.
    */
    <Card
      padding="none"
      variant="brand"
      principal
      className={[estilos.carnet, esAmpliado && estilos.ampliado].filter(Boolean).join(' ')}
    >
      <div className={estilos.carnetInterior}>
        <header className={estilos.emisor}>
          {/* Una credencial sin el nombre de quien la emite no parece una
              credencial. */}
          <p className={estilos.wordmark}>ORUM</p>
          <p className={estilos.tipo}>Carnet de socio</p>
        </header>

        {/*
          LA FOTO. `aria-hidden` porque el nombre está justo debajo: sin esto
          el lector anuncia «Daniel Bulla» dos veces, que es el mismo motivo
          por el que `Avatar` tiene `decorativo`.

          `<img>` y no `next/image`: `next.config.ts` no declara `images` y la
          URL es externa —Storage o el servidor de quien la subiera—. `alt`
          vacío a propósito: una URL muerta con `alt` con texto puede
          arrastrar el glifo de imagen rota de Chrome, y eso no se enseña en
          una caja.
        */}
        <span className={estilos.foto} aria-hidden="true">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
            <img
              src={fotoUrl}
              alt=""
              className={estilos.fotoImagen}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={estilos.fotoIniciales}>{iniciales(nombre)}</span>
          )}
        </span>

        <div className={estilos.identidad}>
          <p className={estilos.nombre}>{nombre}</p>
          {/* `planes_membresia` sostiene varios planes: mostrar el nombre es
              correcto. Sin plan, un respaldo genérico — un hueco ahí
              parecería un carnet roto. */}
          <p className={estilos.plan}>{plan}</p>

          {/*
            El estado lo pinta `StatusBadge` a partir de
            `derivarEstadoMembresia`, NUNCA de `membresias.estado` en crudo:
            esa columna tiene default `'activa'` y nada la actualiza al
            vencer. Y la diferencia entre activa e inactiva es de FORMA
            —disco lleno frente a anillo hueco— además de color.
          */}
          <span className={estilos.estadoFila}>
            <StatusBadge estado={estado} />
            <VenceEn estado={estado} />
          </span>
        </div>

        <div className={estilos.datos}>
          <div className={estilos.bloque}>
            <span className={estilos.etiqueta}>Número de membresía</span>
            <span className={estilos.numero}>
              <Copiar valor={numeroMembresia} label="Copiar número de membresía" />
            </span>
          </div>

          <div className={estilos.bloque}>
            <span className={estilos.etiqueta}>Vigente hasta</span>
            <span className={estilos.vigencia}>{vigencia}</span>
          </div>
        </div>

        {/*
          `data-motion-esencial`: pase lo que pase con las preferencias de
          movimiento, el QR no puede quedarse a medio camino de una
          transformación. Es lo que se escanea delante del cajero.

          Va en el envoltorio del QR y NO en el bloque entero: la exención
          alcanza a todos los descendientes, y colgándola de más arriba el
          botón de copiar se quedaría con su encogido de pulsación activo
          justo para quien pidió no tener movimiento.
        */}
        <div className={estilos.qr} data-motion-esencial>
          <QrCode
            value={numeroMembresia}
            /*
              El `size` solo fija el `viewBox` y el tamaño intrínseco: quien
              manda es el ancho en CSS (`.qr` + `.qrMarco svg`), que escala el
              SVG con la tarjeta. Así el QR ampliado no necesita otro
              componente ni otro cálculo de zona de silencio.
            */
            size={256}
            className={estilos.qrMarco}
            label={`Código de la membresía ${numeroMembresia} de ${nombre}`}
          />
        </div>
      </div>
    </Card>
  )
}
