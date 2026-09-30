import { AdornoEstrella } from '@/components/ui/marca/marca'
import estilos from './titulo-seccion.module.css'

/*
  EL TÍTULO DE SECCIÓN DEL PORTAL PÚBLICO, para quien lo quiera  ·  29/09/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «todos los títulos deben tener diseño igual que el
  portal inicial; además se ven muy pequeños para ser título». Es la misma
  receta que `.tituloSeccion` de `(publico)/escaparate.module.css`: Playfair
  Display en el peldaño `hero-2` (32 → 48px), la estrella del cliente al
  lado y la ÚLTIMA palabra en cursiva dorada —«Tus *favoritos*», «Todos los
  *comercios*»—.

  La palabra en cursiva se calcula aquí y no la escribe cada llamada: así el
  acento cae siempre en el mismo sitio y nadie tiene que acordarse de él.
  El `<em>` es real: la cursiva es el portador del énfasis y el oro se suma
  encima, nunca al revés.

  Sobre la franja negra, `adorno="plata"` (CLAUDE.md → «sobre negro, plata»):
  el acento ya se vuelve oro claro solo, porque la franja remapea `--brand`.
*/

type Props = {
  texto: string
  /** Nivel del encabezado. Un `h1` por pantalla. */
  como?: 'h1' | 'h2'
  id?: string
  /** La estrella al lado del título: dorada, plata, o ninguna. */
  adorno?: 'oro' | 'plata' | null
  className?: string
}

export function TituloSeccion({ texto, como = 'h2', id, adorno = 'oro', className }: Props) {
  const Etiqueta = como
  const corte = texto.lastIndexOf(' ')
  const cuerpo = corte === -1 ? '' : texto.slice(0, corte + 1)
  const acento = corte === -1 ? texto : texto.slice(corte + 1)

  return (
    <Etiqueta id={id} className={[estilos.titulo, className].filter(Boolean).join(' ')}>
      {adorno && <AdornoEstrella tono={adorno} />}
      {cuerpo}
      <em className={estilos.acento}>{acento}</em>
    </Etiqueta>
  )
}
