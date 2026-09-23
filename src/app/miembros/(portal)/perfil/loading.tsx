import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/feedback'
import { Stack } from '@/components/ui/layout'
import styles from './perfil.module.css'

/*
  Estado de carga del carnet.

  Existe por separado del esqueleto del catálogo por una razón concreta de
  Next: al navegar a `/miembros/perfil` la frontera de suspense que se usa es
  la MÁS CERCANA. Sin este archivo se caería al `loading.tsx` de `(portal)`, y
  el socio vería la rejilla de tarjetas del catálogo dibujándose donde va a
  aparecer su carnet. Un esqueleto que no coincide con el resultado produce un
  salto peor que no tener ninguno.

  Reutiliza `perfil.module.css` —las mismas clases que la página real— para que
  la silueta no pueda desviarse. Con Z1 esa silueta cambió: el wordmark y la
  foto arriba, el nombre a ancho completo, y el QR con su número dentro del
  bloque de credencial. El esqueleto la sigue.

  LA SUPERFICIE SE PINTA YA EN CACAO, con las mismas clases. Un esqueleto
  blanco que un instante después se vuelve chocolate es un destello en la cara
  del socio; y como el ámbito de tema reasigna también `--surface-hueco`, las
  barras del esqueleto salen en el tono del cacao sin que `Skeleton` sepa nada.

  No lleva animación de entrada: el carnet aparece cuando llega el carnet, no
  cuando llega su hueco. `Skeleton` sí se exime de la regla global de
  movimiento reducido (`data-motion-esencial`), porque un esqueleto congelado
  parece contenido roto y no contenido cargando.
*/

export default function Loading() {
  return (
    <div className={styles.pantalla}>
      <div className={styles.encabezado}>
        <Skeleton width="min(220px, 60%)" height="28px" radius="var(--radius-sm)" />
        <Skeleton width="min(260px, 80%)" height="14px" />
      </div>

      <div className={styles.columnas}>
        <div>
          <Card padding="none" variant="brand" principal className={styles.carnet}>
            <div className={styles.carnetInterior}>
              {/* Wordmark y tipo a la izquierda, el cuadro de la foto a la
                  derecha. Reserva el hueco de la FOTO aunque el socio no tenga
                  ninguna: el respaldo de iniciales ocupa exactamente el mismo
                  cuadro de 88px, así que la reserva vale para los dos casos y
                  el carnet no salta al llegar. */}
              <div className={styles.cabecera}>
                <div className={styles.emisor}>
                  <Skeleton width="72px" height="13px" />
                  <Skeleton width="104px" height="11px" />
                </div>
                <Skeleton width="88px" height="88px" radius="var(--radius-md)" />
              </div>

              <div className={styles.identidad}>
                {/* El nombre en el peldaño `hero`: 32px en móvil, 48 en
                    escritorio. Se reserva el caso alto. */}
                <Skeleton width="min(320px, 92%)" height="44px" radius="var(--radius-sm)" />
                <Skeleton width="132px" height="18px" />
              </div>

              <div className={styles.credencial}>
                {/*
                  224px = los 160px del SVG más los 32px de zona de silencio a
                  cada lado. Reservar el cuadro EXACTO es lo que evita que el
                  resto del carnet salte cuando el QR aparece: es el bloque más
                  grande de la pantalla y todo lo demás cuelga debajo.
                */}
                <Skeleton width="224px" height="224px" radius="var(--radius-lg)" />
                <div className={styles.bloque}>
                  <Skeleton width="148px" height="12px" />
                  <Skeleton width="180px" height="24px" />
                </div>
              </div>

              <div className={styles.pie}>
                <Skeleton width="96px" height="24px" radius="var(--radius-full)" />
                <Skeleton width="160px" height="16px" />
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.como}>
          <Skeleton width="128px" height="20px" />
          <Stack gap={3}>
            <Skeleton width="100%" height="15px" />
            <Skeleton width="92%" height="15px" />
            <Skeleton width="84%" height="15px" />
          </Stack>
        </div>
      </div>
    </div>
  )
}
