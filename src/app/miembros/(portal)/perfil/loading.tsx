import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/feedback'
import { Stack } from '@/components/ui/layout'
import { SkeletonPageHeader } from '@/components/ui/skeletons'
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
  que la silueta no pueda desviarse: filo dorado, datos a la izquierda y QR a
  la derecha, que bajo 620px del contenedor pasa a columna centrada.
*/

/** Etiqueta en versalitas + su valor, la unidad que se repite en el carnet. */
function Dato({ ancho }: { ancho: string }) {
  return (
    <div className={styles.dato}>
      <Skeleton width="128px" height="12px" />
      <Skeleton width={ancho} height="22px" />
    </div>
  )
}

export default function Loading() {
  return (
    <>
      <SkeletonPageHeader conAccion={false} />

      <Card padding="lg" className={styles.carnet}>
        <div className={styles.cuerpo}>
          <div className={styles.datos}>
            <Stack gap={1}>
              <Skeleton width="min(240px, 70%)" height="28px" />
              <Skeleton width="112px" height="13px" />
            </Stack>

            <Dato ancho="180px" />
            <Dato ancho="164px" />
            <Dato ancho="200px" />
          </div>

          <div className={styles.qr}>
            {/*
              232px = los 200px del SVG más el `--space-4` de relleno del marco
              a cada lado. Reservar el cuadro exacto es lo que evita que el
              resto del carnet salte cuando el QR aparece.
            */}
            <Skeleton width="232px" height="232px" radius="var(--radius-md)" />
            <Skeleton width="176px" height="14px" />
          </div>
        </div>
      </Card>
    </>
  )
}
