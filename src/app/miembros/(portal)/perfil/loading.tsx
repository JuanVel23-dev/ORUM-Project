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
  que la silueta no pueda desviarse.

  26/09/2026 · ACTUALIZADO A LA Z2: el carnet ya no vive en cacao, así que el
  esqueleto ya no necesita pintar su superficie de chocolate — `Skeleton`
  resuelve `--surface-hueco` del tema activo sin que nadie tenga que
  decírselo, y el tema activo aquí es simplemente el claro. Y la silueta
  cambió de un eje vertical a una fila (`.fila`): el esqueleto reserva las
  mismas cuatro cajas, una al lado de otra, del mismo tamaño que sus
  Skeleton reales — así el carnet no salta al llegar.

  No lleva animación de entrada: el carnet aparece cuando llega el carnet, no
  cuando llega su hueco. `Skeleton` sí se exime de la regla global de
  movimiento reducido, porque un esqueleto congelado parece contenido roto y
  no contenido cargando.
*/

export default function Loading() {
  return (
    <div className={styles.pantalla}>
      <div className={styles.encabezado}>
        <Skeleton width="min(220px, 60%)" height="28px" radius="var(--radius-sm)" />
        <Skeleton width="min(260px, 80%)" height="14px" />
      </div>

      <Card padding="none" variant="brand" principal className={styles.carnet}>
        <div className={styles.carnetInterior}>
          <div className={styles.emisor}>
            <Skeleton width="72px" height="13px" />
            <Skeleton width="104px" height="11px" />
          </div>

          <div className={styles.fila}>
            {/* La foto: mismo cuadro que `--foto-lado` reserva en la página
                real, así el esqueleto no salta al llegar el retrato. */}
            <Skeleton width="96px" height="96px" radius="var(--radius-full)" />

            <div className={styles.identidad}>
              <Skeleton width="min(280px, 90%)" height="34px" radius="var(--radius-sm)" />
              <Skeleton width="140px" height="16px" />
              <Skeleton width="110px" height="22px" radius="var(--radius-full)" />
            </div>

            <div className={styles.datos}>
              <div className={styles.bloque}>
                <Skeleton width="120px" height="11px" />
                <Skeleton width="150px" height="22px" />
              </div>
              <div className={styles.bloque}>
                <Skeleton width="90px" height="11px" />
                <Skeleton width="130px" height="16px" />
              </div>
            </div>

            {/*
              148px = `--qr-max` que ya fija `.qr` en la página real. Reservar
              el cuadro exacto es lo que evita que el resto del carnet salte
              cuando el QR aparece.
            */}
            <Skeleton width="148px" height="148px" radius="var(--radius-lg)" />
          </div>
        </div>
      </Card>

      <div className={styles.como}>
        <Skeleton width="128px" height="20px" />
        <Stack gap={5}>
          <Skeleton width="100%" height="15px" />
          <Skeleton width="92%" height="15px" />
          <Skeleton width="84%" height="15px" />
        </Stack>
      </div>
    </div>
  )
}
