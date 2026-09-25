import { CalendarDays, Heart, Search, Sparkles } from 'lucide-react'
import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './valores-orum.module.css'

/*
  DESCUBRE · DISFRUTA · APOYA · EXPERIENCIAS
  ---------------------------------------------------------------------------
  Los cuatro verbos de la guía de marca, debajo de «Qué es ORUM»: lo que el
  club es, dicho en lo que el socio HACE con él.

  Anillo de oro fino y nada de relleno ni sombra: son emblemas, no objetos
  que se puedan tocar, y la sombra es para lo que el dedo puede levantar.
  Las divisiones verticales son hairlines DENTRO de una misma banda
  (`--border-subtle`), no bordes de superficie.

  Es una lista —cuatro piezas del mismo tipo—, así que va en `<ul>`.
*/

const VALORES = [
  {
    titulo: 'Descubre',
    Icono: Search,
    texto: 'Encuentra lugares que quizá todavía no conoces.',
  },
  {
    titulo: 'Disfruta',
    Icono: Sparkles,
    texto: 'Accede a beneficios exclusivos como miembro ORUM.',
  },
  {
    titulo: 'Apoya',
    Icono: Heart,
    texto: 'Cada vez que eliges un comercio local, contribuyes al crecimiento de tu ciudad.',
  },
  {
    titulo: 'Experiencias',
    Icono: CalendarDays,
    texto: 'Eventos, actividades y oportunidades especiales para miembros.',
  },
] as const

export function ValoresOrum() {
  return (
    <section
      className={[escaparate.franja, escaparate.tonoPapel, estilos.seccion].join(' ')}
      aria-label="Lo que ORUM te da"
    >
      <Revelar>
        <ul className={estilos.lista}>
          {VALORES.map(({ titulo, Icono, texto }) => (
            <li key={titulo} className={estilos.valor}>
              <span className={estilos.anillo} aria-hidden="true">
                <Icono size={24} strokeWidth={1.8} />
              </span>
              <h3 className={estilos.titulo}>{titulo}</h3>
              <p className={estilos.texto}>{texto}</p>
            </li>
          ))}
        </ul>
      </Revelar>
    </section>
  )
}
