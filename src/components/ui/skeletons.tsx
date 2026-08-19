import { Card } from './card'
import { Grid, Stack } from './layout'
import { Skeleton } from './feedback'
import styles from './skeletons.module.css'

/*
  Esqueletos de página.

  Cada uno replica el LAYOUT REAL de la pantalla que sustituye. Un esqueleto
  que no se parece a lo que llega después desplaza el contenido al resolverse,
  y eso se percibe peor que no haber puesto nada.
*/

export function SkeletonPageHeader({ conAccion = true }: { conAccion?: boolean }) {
  return (
    <div className={styles.cabecera}>
      <div className={styles.cabeceraTextos}>
        <Skeleton width="min(280px, 60%)" height="30px" radius="var(--radius-sm)" />
        <Skeleton width="min(440px, 90%)" height="15px" />
      </div>
      {conAccion && <Skeleton width="150px" height="44px" radius="var(--radius-sm)" />}
    </div>
  )
}

/** Filas con el mismo alto que las reales, para que no haya salto al llegar. */
export function SkeletonTabla({ filas = 6 }: { filas?: number }) {
  return (
    <Card padding="none">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={styles.fila}>
          <Skeleton width="28px" height="28px" radius="var(--radius-full)" />
          <Skeleton width="26%" height="14px" />
          <Skeleton width="16%" height="14px" />
          <Skeleton width="14%" height="20px" radius="var(--radius-full)" />
          <Skeleton width="18%" height="20px" radius="var(--radius-full)" />
        </div>
      ))}
    </Card>
  )
}

export function SkeletonBuscador() {
  return (
    <div className={styles.buscador}>
      <Skeleton width="min(460px, 100%)" height="44px" radius="var(--radius-sm)" />
      <Skeleton width="96px" height="44px" radius="var(--radius-sm)" />
    </div>
  )
}

export function SkeletonCifras({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <Grid min="200px">
      {Array.from({ length: cantidad }, (_, i) => (
        <Card key={i}>
          <Stack gap={3}>
            <Skeleton width="55%" height="12px" />
            <Skeleton width="40%" height="34px" radius="var(--radius-sm)" />
          </Stack>
        </Card>
      ))}
    </Grid>
  )
}

export function SkeletonAccesos({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <Grid min="280px">
      {Array.from({ length: cantidad }, (_, i) => (
        <Card key={i}>
          <div className={styles.acceso}>
            <Skeleton width="40px" height="40px" radius="var(--radius-sm)" />
            <div className={styles.accesoTextos}>
              <Skeleton width="55%" height="14px" />
              <Skeleton width="80%" height="11px" />
            </div>
          </div>
        </Card>
      ))}
    </Grid>
  )
}
