import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/feedback'
import { Grid, Stack } from '@/components/ui/layout'
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

/** La misma silueta que `ComercioCard`: foto 4:3 arriba y, debajo, placa + textos. */
function TarjetaComercio() {
  return (
    <Card padding="none" className={tarjeta.superficie}>
      <div className={tarjeta.cubierta}>
        <Skeleton width="100%" height="100%" radius="0" />
      </div>
      <div className={tarjeta.tarjeta}>
        {/* La placa REAL es un círculo de 72px: el mismo diámetro aquí. */}
        <Skeleton width="72px" height="72px" radius="var(--radius-full)" />
        <Stack gap={1}>
          <Skeleton width="140px" height="18px" />
          <Skeleton width="110px" height="12px" />
          <Skeleton width="96px" height="12px" />
        </Stack>
      </div>
    </Card>
  )
}

export default function Loading() {
  return (
    <div>
      {/* Anunciado por el `role="status"`; el dibujo se oculta al lector para
          que no lea una retahíla de cajas vacías. */}
      <p role="status" className="sr-only">
        Cargando los comercios…
      </p>

      <div aria-hidden="true" className={estilos.pagina}>
        {/*
          EL HÉROE NEGRO SÍ SE DIBUJA, con sus clases reales: es lo primero
          que se ve en Inicio y va pegado a la cabecera negra. Sin él, la
          cabecera quedaría flotando sobre crema hasta que llegaran los datos,
          y el salto al negro se vería justo donde el socio está mirando.
        */}
        <section className={estilos.heroInicio} data-theme="dark">
          <div className={estilos.heroContenido}>
            <Skeleton width="120px" height="12px" />
            <Skeleton width="min(420px, 80%)" height="44px" radius="var(--radius-sm)" />
            <Skeleton width="min(460px, 90%)" height="16px" />
            <Skeleton width="min(480px, 100%)" height="52px" radius="var(--radius-full)" />
          </div>
        </section>

        {/*
          Las secciones curadas NO se dibujan: dependen de si hay favoritos,
          novedades o un top, y un esqueleto que promete una forma que luego
          no llega produce el salto que este archivo existe para evitar.
        */}
        <div className={estilos.rejilla}>
          <div className={estilos.panelFiltros}>
            <Skeleton width="180px" height="44px" radius="var(--radius-full)" />
            <Skeleton width="150px" height="44px" radius="var(--radius-full)" />
          </div>

          <Skeleton width="220px" height="28px" />

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
