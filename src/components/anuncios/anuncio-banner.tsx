'use client'

import Link from 'next/link'
import { Megaphone, X } from 'lucide-react'
import { Section } from '@/components/ui/layout'
import { Button } from '@/components/ui/button'
import { usePreferenciaLocal } from '@/components/use-preferencia-local'
import { useHidratado } from '@/components/use-hidratado'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import styles from './anuncio-banner.module.css'

/*
  FRANJA DE ANUNCIO EN LA PORTADA DE CADA PORTAL.

  `<Section tono="cacao">` y no la franja de ancho completo de la landing
  (`escaparate.module.css`): esa es un mecanismo propio de `(publico)/page.tsx`
  con su regla `.franja:first-child`. `Section` es la superficie tonal
  GENÉRICA del sistema (`layout.module.css`), sin sangrado a los bordes ni
  reglas de primer hijo — así este componente no interfiere con esa CSS por
  compartir un nombre de clase parecido: son dos módulos distintos.

  Se cierra guardando `anuncio-cerrado-{id}` en localStorage. La clave lleva
  el ID: un anuncio nuevo (id distinto) vuelve a aparecer aunque el socio
  haya cerrado el anterior, sin backend ni tabla de lecturas.
*/
export function AnuncioBanner({
  anuncio,
  hrefHistorial,
}: {
  anuncio: AnuncioResumen | null
  /** `/novedades` en el Portal Público, `/miembros/novedades` en el de Miembros. */
  hrefHistorial: string
}) {
  const [cerrado, cerrar] = usePreferenciaLocal(
    anuncio ? `anuncio-cerrado-${anuncio.id}` : 'anuncio-cerrado-ninguno',
    false,
  )
  const hidratado = useHidratado()

  /*
    Sin `hidratado`, el snapshot de servidor de `usePreferenciaLocal` (siempre
    `false`) pintaría el banner en cada carga y lo haría desaparecer justo
    después de hidratar para quien ya lo había cerrado — parpadeo y salto de
    layout en las dos páginas más visitadas. Se espera a que el cliente
    confirme AMBAS cosas: que hay anuncio y que no fue cerrado.
  */
  if (!hidratado || !anuncio || cerrado) return null

  return (
    <Section tono="cacao" className={styles.banner}>
      <div className={styles.fila}>
        <Megaphone className={styles.icono} size={20} aria-hidden="true" />

        <div className={styles.textos}>
          <p className={styles.titulo}>{anuncio.titulo}</p>
          <p className={styles.extracto}>{anuncio.cuerpo}</p>
        </div>

        <Link href={hrefHistorial} className={styles.verMas}>
          Ver más
        </Link>

        <Button
          iconOnly
          variant="ghost"
          size="sm"
          aria-label="Cerrar aviso"
          className={styles.cerrar}
          onClick={() => cerrar(true)}
        >
          <X size={16} aria-hidden="true" />
        </Button>
      </div>
    </Section>
  )
}
