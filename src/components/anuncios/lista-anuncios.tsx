import { Megaphone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/feedback'
import { Stack } from '@/components/ui/layout'
import { formatearFechaNovedad } from '@/lib/anuncios/fecha'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import styles from './lista-anuncios.module.css'

export function ListaAnuncios({ anuncios }: { anuncios: AnuncioResumen[] }) {
  if (anuncios.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone size={22} />}
        title="Todavía no hay novedades"
        description="Cuando el club anuncie algo, aparecerá aquí."
      />
    )
  }

  return (
    <Stack gap={5}>
      {anuncios.map((anuncio) => (
        <Card key={anuncio.id} padding="lg">
          {anuncio.imagenUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa de Storage, no un asset local
            <img
              src={anuncio.imagenUrl}
              alt=""
              className={styles.imagen}
              loading="lazy"
              decoding="async"
            />
          )}
          <p className={styles.fecha}>{formatearFechaNovedad(anuncio.createdAt)}</p>
          <h2 className={styles.titulo}>{anuncio.titulo}</h2>
          <p className={styles.cuerpo}>{anuncio.cuerpo}</p>
        </Card>
      ))}
    </Stack>
  )
}
