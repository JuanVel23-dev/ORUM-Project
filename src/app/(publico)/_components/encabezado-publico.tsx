import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ANCLAS, HREF_UNETE } from './anclas'
import { MenuMovilPublico } from './menu-movil-publico'
import escaparate from '../escaparate.module.css'
import estilos from './encabezado-publico.module.css'

/*
  LA CABECERA DE QUIEN TODAVÍA NO HA DECIDIDO ENTRAR
  ---------------------------------------------------------------------------
  Distinta a propósito de la del Portal de Miembros. Aquella sirve a alguien
  que YA entró —wordmark, dos pestañas y avatar de sesión—; esta sirve a
  alguien que no sabe qué es ORUM.

  MONTADA SOBRE LA FOTO, Y FIJA (guía de marca v6). Negra arriba y fundida a
  transparente hacia abajo: sobre el héroe se lee como parte de la fotografía,
  y al bajar por las franjas crema el texto nunca se pierde, porque la banda
  donde vive la tipografía es prácticamente opaca (≥ 82 % de negro). Es la
  corrección de la primera versión, que era transparente de arriba abajo y
  desaparecía sobre el crema.

  Server Component. Lo único que se hidrata es el menú de móvil, que necesita
  estado para abrir su hoja.
*/
export function EncabezadoPublico() {
  return (
    <header className={estilos.cabecera}>
      {/* El destello ✦ es decorativo —el nombre de la marca ya está en el
          texto—, así que va `aria-hidden` y no parte el enlace en dos palabras
          para un lector de pantalla. */}
      <Link href="/" className={estilos.marca}>
        <span className={estilos.destello} aria-hidden="true">
          ✦
        </span>
        ORUM
      </Link>

      <nav
        className={[estilos.nav, escaparate.sobreFoto].join(' ')}
        aria-label="Secciones de la página">
        {ANCLAS.map((ancla) => (
          <Link key={ancla.href} href={ancla.href} className={estilos.enlace}>
            {ancla.texto}
          </Link>
        ))}
      </nav>

      <div className={estilos.acciones}>
        {/*
          En escritorio, las dos puertas a la vista: quien ya es socio no debe
          leer una landing entera para encontrar su acceso, y quien no lo es
          tiene «Únete» a un clic de los planes. En móvil las dos viven dentro
          de la hoja del menú.
        */}
        <span className={[estilos.soloEscritorio, escaparate.sobreFoto].join(' ')}>
          <Button href="/miembros/login" variant="ghost" size="sm">
            Iniciar sesión
          </Button>
          <Button href={HREF_UNETE} variant="secondary" size="sm" pildora>
            Únete
          </Button>
        </span>
        <MenuMovilPublico />
      </div>
    </header>
  )
}
