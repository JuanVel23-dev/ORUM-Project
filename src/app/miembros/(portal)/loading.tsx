import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/feedback'
import { Grid, Stack } from '@/components/ui/layout'
import { CarruselDestacadosEsqueleto } from './_components/carrusel-destacados'
import estilos from './_components/catalogo.module.css'
import tarjeta from './_components/comercio-card.module.css'

/*
  Estado de carga del catálogo.

  Sin este archivo la secuencia que percibía el socio al tocar una pestaña era
  toque → nada → salto: no había fase intermedia que suavizar, faltaba el
  estado entero.

  El esqueleto REPLICA el layout real, y para que no pueda desviarse toma las
  clases de los propios componentes que sustituye —`catalogo.module.css` y
  `comercio-card.module.css`— en vez de recrear su geometría a mano. Si mañana
  cambia el espaciado de la tarjeta, cambia también aquí.

  `Skeleton` ya lleva `data-motion-esencial`, así que el barrido sigue vivo con
  `prefers-reduced-motion`: un esqueleto congelado parece contenido roto.
*/

/*
  UN SOLO CAMPO, no tres.

  Antes se dibujaban dos desplegables más la búsqueda, que era la forma de
  entonces. Hoy "Comercio" no existe —lo sustituye la propia búsqueda—,
  "Categoría" subió a los chips, y "Marca"/"Ciudad" viven dentro de un
  `<details>` cerrado que solo se renderiza con dos o más opciones: con los
  diccionarios de hoy no se renderiza ninguno. Un esqueleto que dibuja campos
  que luego no llegan produce exactamente el salto que este archivo existe para
  evitar.

  Los chips tampoco se dibujan: la fila no reserva hueco cuando no hay
  categorías, así que reservarlo aquí volvería a desplazar la rejilla al
  resolverse.
*/

/** La misma silueta que `ComercioCard`: logo + títulos, texto y el bloque inferior. */
function TarjetaComercio() {
  return (
    <Card>
      <div className={tarjeta.tarjeta}>
        <div className={tarjeta.cabecera}>
          {/* La placa REAL, y desde el 14/09/2026 es un CÍRCULO: mismo
              diámetro y mismo radio que `ComercioLogo`. Antes decía
              `* 2 / 3` —la proporción rectangular de entonces— y al volverse
              circular el esqueleto prometía una forma que ya no llegaba: el
              relevo saltaba justo donde el ojo está mirando. */}
          <Skeleton
            width="var(--placa-logo-w)"
            height="var(--placa-logo-w)"
            radius="var(--radius-full)"
          />
          <Stack gap={1}>
            <Skeleton width="140px" height="20px" />
            <Skeleton width="88px" height="14px" />
          </Stack>
        </div>

        <Stack gap={1}>
          <Skeleton height="15px" />
          <Skeleton width="72%" height="15px" />
        </Stack>

        {/* `.sinBeneficio` aporta el `margin-top: auto` y la divisoria: es lo
            que mantiene el bloque a la misma altura en todas las tarjetas, y
            hoy es además el estado más frecuente del catálogo. */}
        <div className={tarjeta.sinBeneficio}>
          <Skeleton width="96px" height="14px" />
        </div>
      </div>
    </Card>
  )
}

export default function Loading() {
  return (
    <div className={estilos.pagina}>
      {/* Anunciado por el `role="status"`; el dibujo se oculta al lector para
          que no lea una retahíla de cajas vacías. */}
      <p role="status" className="sr-only">
        Cargando los comercios…
      </p>

      <div aria-hidden="true" className={estilos.pagina}>
        <Stack gap={1}>
          <Skeleton width="96px" height="13px" />
          <Skeleton width="220px" height="30px" />
          <Skeleton width="80%" height="18px" />
        </Stack>

        <Stack gap={2}>
          <Skeleton width="64px" height="13px" />
          <Skeleton height="44px" radius="var(--radius-sm)" />
        </Stack>

        {/*
          LA PORTADA SÍ SE DIBUJA, y es la excepción argumentada a la regla de
          arriba —no dibujar lo que luego no llega—.

          Este archivo no recibe props, así que no puede saber si habrá filtros
          y por tanto si el carrusel se renderizará. Se dibuja siempre porque la
          entrada SIN filtros es la dominante: es la pestaña "Inicio", el
          destino de la PWA y el de cada toque de la barra de navegación. No
          dibujarlo haría saltar el caso dominante para evitar un salto en el
          caso raro.

          Y con filtros el desplazamiento es barato: lo que se mueve al
          resolverse es la rejilla, mientras la búsqueda —donde está mirando
          quien filtra— se queda quieta, porque el carrusel va debajo de ella.

          La silueta la pone el propio componente, con sus clases reales.
        */}
        <CarruselDestacadosEsqueleto />

        <div className={estilos.rejilla}>
          <Skeleton width="180px" height="24px" />

          {/* Mismo `min` que la rejilla real: idénticas columnas a idéntico ancho. */}
          <Grid min="290px">
            {Array.from({ length: 6 }, (_, i) => (
              <TarjetaComercio key={i} />
            ))}
          </Grid>
        </div>
      </div>
    </div>
  )
}
