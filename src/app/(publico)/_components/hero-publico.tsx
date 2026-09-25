import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HREF_UNETE } from './anclas'
import fotoHero from './hero-orum.webp'
import escaparate from '../escaparate.module.css'
import estilos from './hero-publico.module.css'

/*
  EL HÉROE  ·  la guía de marca del cliente, literal
  ---------------------------------------------------------------------------
  Fotografía oscura a sangre, velo horizontal para que el texto se lea, la
  cabecera montada encima y un titular en Playfair Display con el acento en
  cursiva de oro pálido. Dos acciones en píldora: el alta, en oro, y el
  directorio, en contorno.

  LA FOTOGRAFÍA ES DE LA MARCA, fija: la socia en el café con su tarjeta
  ORUM, entregada por el cliente. Antes salía la portada del primer comercio
  del catálogo, y eso ponía en la primera pantalla lo que cada comercio
  hubiera subido (una etiqueta de producto, por ejemplo). Las portadas de
  los comercios siguen en el carrusel de «Qué es ORUM» y en los destacados.

  Import estático con `next/image`: Next conoce su tamaño (no hay salto de
  maquetación), la sirve en el ancho que pide cada pantalla y trae un
  desenfoque de respaldo mientras carga. `preload` porque es la imagen más
  grande de la primera pantalla: el LCP.

  «Únete a ORUM» NO abre WhatsApp: baja a los planes. Quien llega a la
  portada todavía no sabe cuánto cuesta, y mandarlo a un chat antes de ver el
  precio es pedirle que pregunte lo que la página ya podía decirle.

  Server Component: cero JavaScript.
*/

type Props = {
  /** El visitante tiene sesión de socio: se le tiende el puente a su portal. */
  esSocio: boolean
}

export function HeroPublico({ esSocio }: Props) {
  return (
    <section
      id="inicio"
      className={[escaparate.franja, estilos.hero].join(' ')}
      aria-labelledby="titulo-hero"
    >
      {/*
        `alt=""`: la foto es ambiente, no información —el titular dice lo que
        hay que saber—, y describirla antes del `h1` desordenaría la lectura.
      */}
      <Image
        className={estilos.foto}
        src={fotoHero}
        alt=""
        fill
        sizes="100vw"
        quality={80}
        placeholder="blur"
        preload
      />
      <div className={estilos.velo} aria-hidden="true" />

      {/*
        El ornamento vertical de la guía: destello, lema, filo y punto. Solo
        en escritorio, donde hay margen derecho que ocupar; en móvil el lema
        viaja en la insignia de encima del titular. Decorativo, porque el
        mismo texto ya es legible en la insignia.
      */}
      <div className={estilos.ornamento} aria-hidden="true">
        <span className={estilos.ornamentoDestello}>✦</span>
        <span className={estilos.ornamentoTexto}>Apoya lo local. Te da más.</span>
        <span className={estilos.ornamentoFilo} />
        <span className={estilos.ornamentoPunto} />
      </div>

      <div className={[estilos.contenido, escaparate.sobreFoto].join(' ')}>
        {/*
          EL SOCIO CON SESIÓN ABIERTA QUE LLEGA A `/`.

          No se le redirige: la landing es información pública y puede estar
          enseñándosela a un amigo. Pero tampoco se le deja buscar la entrada.
          Vive DENTRO del héroe desde que la cabecera es fija: fuera de él
          quedaría tapado por ella.
        */}
        {esSocio && (
          <Link href="/miembros" className={estilos.puente}>
            Ya eres socio. Ir a mi portal
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}

        <p className={estilos.insignia}>
          <span aria-hidden="true">✦ </span>
          Apoya lo local · Te da más
        </p>

        <h1 id="titulo-hero" className={estilos.titular}>
          Descubre lo mejor <br className={estilos.salto} />
          de <em className={estilos.acento}>tu ciudad</em>
        </h1>

        <p className={estilos.lede}>
          Una red de valor que conecta personas con los mejores comercios y experiencias
          locales.
        </p>

        <div className={estilos.acciones}>
          <Button href={HREF_UNETE} variant="brand" size="lg" pildora>
            Únete a ORUM
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button
            href="/explorar"
            variant="secondary"
            size="lg"
            pildora
            icon={<Compass size={16} aria-hidden="true" className={estilos.iconoAncho} />}
          >
            Descubre comercios
          </Button>
        </div>
      </div>
    </section>
  )
}
