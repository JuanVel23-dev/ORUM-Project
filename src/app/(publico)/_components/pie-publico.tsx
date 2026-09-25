import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import estilos from './pie-publico.module.css'

/*
  EL PIE  ·  el único sitio del producto donde conviven las tres puertas
  ---------------------------------------------------------------------------
  Ningún otro portal tiene pie: el shell de administración y el del portal de
  miembros terminan en su barra de navegación. Este lo necesita porque es la
  única pantalla pública, y las otras tres asumen que ya sabes cuál es tu
  puerta.

  SON ENLACES DE TEXTO, NO BOTONES. Tres salidas de igual peso para tres
  audiencias distintas que ya saben lo que buscan: competir por atención con
  `Button` sería tratarlas como conversión, y son navegación.

  El pie NO imita a `PantallaAuth` ni la reemplaza — las tres pantallas de
  acceso siguen siendo su propio umbral oscuro con halo dorado. El único
  acoplamiento real es el nombre del destino, que se repite literal («Portal de
  Miembros», «Herramienta de comercios», «Administración») para que el visitante
  reconozca a dónde va antes de hacer clic.
*/

const PUERTAS = [
  { href: '/miembros/login', texto: 'Soy socio', destino: 'Portal de Miembros' },
  {
    href: '/comercios/login',
    texto: 'Tengo un comercio',
    destino: 'Herramienta de comercios',
  },
  { href: '/login', texto: 'Administro ORUM', destino: 'Administración' },
] as const

const MENSAJE_SOPORTE = 'Hola, quiero saber más sobre el club de beneficios ORUM.'

/** Deja solo dígitos: wa.me rechaza espacios, guiones y paréntesis. */
function limpiarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '')
}

export function PiePublico({ soporte }: { soporte: string | null }) {
  return (
    <footer className={estilos.pie}>
      <div className={estilos.contenido}>
        <p className={estilos.marca}>
          <span className={estilos.destello} aria-hidden="true">
            ✦
          </span>
          ORUM
        </p>

        <nav className={estilos.puertas} aria-label="Accesos a los portales">
          {PUERTAS.map((puerta) => (
            <Link key={puerta.href} href={puerta.href} className={estilos.puerta}>
              <span className={estilos.puertaTexto}>{puerta.texto}</span>
              <span className={estilos.puertaDestino}>{puerta.destino}</span>
            </Link>
          ))}
        </nav>

        {/*
          Sin número configurado no se pinta un enlace roto ni un botón muerto:
          la fila desaparece y el resto del pie sigue en pie (SPEC §5.2). No se
          usa `WhatsAppButton` aquí a propósito — ese componente es un `Button`,
          y en este pie todo es enlace de texto por la razón de arriba.
        */}
        {soporte && (
          <a
            className={estilos.soporte}
            href={`https://wa.me/${limpiarTelefono(soporte)}?text=${encodeURIComponent(MENSAJE_SOPORTE)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Soporte por WhatsApp
          </a>
        )}
      </div>

      <p className={estilos.derechos}>
        © {new Date().getFullYear()} ORUM · Apoya lo local, te da más.
      </p>
    </footer>
  )
}
