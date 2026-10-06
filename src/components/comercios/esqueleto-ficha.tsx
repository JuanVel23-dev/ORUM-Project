import { Skeleton, SkeletonText } from '@/components/ui/feedback'
import estilos from './ficha-comercio.module.css'

/*
  LA SILUETA DE LA FICHA  ·  lo que se ve mientras llegan sus datos
  ---------------------------------------------------------------------------
  Bug del 03/10/2026: «se demora en abrir». La ficha del socio comprueba la
  sesión y hace varias lecturas; mientras tanto no se pintaba NADA, y el
  toque parecía no haber hecho efecto. Ahora la ventana se abre en el acto
  con esta silueta —la misma disposición que `FichaComercio`: portada, logo
  en el canto, nombre, dirección, beneficio— y se rellena al llegar.

  Va en el esqueleto de carga del sistema (`Skeleton`, que es de lo poco
  donde el relleno es información) y con las mismas clases de la ficha, para
  que al llegar el contenido nada salte de sitio.
*/
export function EsqueletoFicha() {
  return (
    <div className={[estilos.ficha, estilos.enOverlay].join(' ')} aria-busy="true">
      <p role="status" className="sr-only">
        Cargando la ficha del comercio…
      </p>

      <div aria-hidden="true">
        <div className={estilos.portada}>
          <Skeleton width="100%" height="100%" radius="var(--radius-md)" />
        </div>

        <div className={estilos.cuerpo}>
          <Skeleton width="60%" height="1.75rem" />
          <Skeleton width="35%" height="0.875rem" />
          <SkeletonText lines={3} />
          <Skeleton width="100%" height="5rem" radius="var(--radius-md)" />
          <Skeleton width="100%" height="3rem" radius="var(--radius-full)" />
        </div>
      </div>
    </div>
  )
}
