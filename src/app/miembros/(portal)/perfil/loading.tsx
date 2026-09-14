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

  Reutiliza `perfil.module.css` —las mismas clases que la página real— para
  que la silueta no pueda desviarse: una sola columna, ancho fijo de carnet,
  QR arriba y «Cómo usarlo» al lado en escritorio.

  Antes de M3 este archivo dibujaba la forma ANTERIOR (datos a la izquierda,
  QR a la derecha, dos columnas bajo 620px). Se corrigió aquí, no en la
  página: la forma que manda es la de §6.3.

  No lleva el envoltorio de aparición: el carnet aparece cuando llega el
  carnet, no cuando llega su hueco. `Skeleton` ya se exime de la regla global
  de movimiento reducido (`data-motion-esencial`), porque un esqueleto
  congelado parece contenido roto y no contenido cargando.
*/

export default function Loading() {
  return (
    <div className={styles.pantalla}>
      <div className={styles.encabezado}>
        <Skeleton width="min(220px, 60%)" height="28px" radius="var(--radius-sm)" />
        <Skeleton width="min(260px, 80%)" height="14px" />
      </div>

      <div className={styles.columnas}>
        <Card padding="lg" variant="brand" principal className={styles.carnet}>
          <Stack gap={5}>
            <Stack gap={5}>
              <Skeleton width="62px" height="12px" />
              <Stack gap={1}>
                <Skeleton width="min(240px, 70%)" height="28px" />
                <Skeleton width="112px" height="18px" />
              </Stack>
            </Stack>

            {/*
              224px = los 160px del SVG más los 32px de zona de silencio a cada
              lado. Reservar el cuadro EXACTO es lo que evita que el resto del
              carnet salte cuando el QR aparece: es el bloque más grande de la
              pantalla y todo lo demás cuelga debajo.
            */}
            <div className={styles.qr}>
              <Skeleton width="224px" height="224px" radius="var(--radius-md)" />
            </div>

            <div className={styles.bloque}>
              <Skeleton width="148px" height="12px" />
              <Skeleton width="180px" height="24px" />
            </div>

            <div className={styles.bloque}>
              <Skeleton width="96px" height="24px" radius="var(--radius-full)" />
              <Skeleton width="200px" height="16px" />
            </div>
          </Stack>
        </Card>

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
