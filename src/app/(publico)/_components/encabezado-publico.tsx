import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MenuMovilPublico } from './menu-movil-publico'
import estilos from './encabezado-publico.module.css'

/*
  LA CABECERA DE QUIEN TODAVÍA NO HA DECIDIDO ENTRAR
  ---------------------------------------------------------------------------
  Distinta a propósito de la del Portal de Miembros. Aquella sirve a alguien
  que YA entró —wordmark, dos pestañas y avatar de sesión—; esta sirve a
  alguien que no sabe qué es ORUM.

  NO LLEVA AVATAR, y no por falta de espacio: nadie tiene sesión activa en esta
  pantalla. Si la tuviera y fuera socio, la landing ya lo habría redirigido a
  `/miembros` antes de pintar nada.

  Server Component. Lo único que se hidrata es el menú de móvil, que necesita
  estado para abrir su hoja.
*/

/**
 * Las anclas van con ruta absoluta (`/#…`) y no solo con `#…`.
 *
 * Esta cabecera la comparten la landing y `/aliados`. Con `#como-funciona` a
 * secas, pulsarla desde `/aliados` no haría nada: ahí esa sección no existe.
 * Con `/#como-funciona`, Next navega a la landing y luego desplaza; dentro de
 * la propia landing se comporta como un ancla normal, sin recargar.
 */
export const ANCLAS = [
  { href: '/#como-funciona', texto: 'Cómo funciona' },
  { href: '/#comercios-aliados', texto: 'Comercios aliados' },
] as const

export function EncabezadoPublico() {
  return (
    <header className={estilos.cabecera}>
      {/* El wordmark es el único oro sólido del cromo, y es MARCA, no acción:
          enlaza a la propia landing, no a ningún catálogo. */}
      <Link href="/" className={estilos.marca}>
        ORUM
      </Link>

      <nav className={estilos.nav} aria-label="Secciones de la página">
        {ANCLAS.map((ancla) => (
          <Link key={ancla.href} href={ancla.href} className={estilos.enlace}>
            {ancla.texto}
          </Link>
        ))}
      </nav>

      <div className={estilos.acciones}>
        {/*
          Acción terciaria: quien ya es socio no debe leer una landing entera
          para encontrar su acceso, pero tampoco puede competir con el CTA del
          héroe. De ahí `ghost`.
        */}
        <span className={estilos.soloEscritorio}>
          <Button href="/miembros/login" variant="ghost" size="sm">
            Iniciar sesión
          </Button>
        </span>

        <MenuMovilPublico />
      </div>
    </header>
  )
}
