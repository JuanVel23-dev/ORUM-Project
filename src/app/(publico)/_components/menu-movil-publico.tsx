'use client'

import { useState, type MouseEvent } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronRight,
  Compass,
  Crown,
  Handshake,
  Home,
  LogIn,
  Menu,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { pedirFormularioAliados } from './aliados-overlay-trigger'
import { ANCLAS, HREF_UNETE } from './anclas'
import escaparate from '../escaparate.module.css'
import estilos from './menu-movil-publico.module.css'

/*
  EL MENÚ DE MÓVIL  ·  la única pieza hidratada del cromo público
  ---------------------------------------------------------------------------
  `Sheet` y no `Overlay`: aquí no hay cara de escritorio que servir. El botón
  que la abre está oculto a partir de 900px, donde las mismas entradas ya viven
  en la cabecera como texto.

  REDISEÑO DEL 05/10/2026 («arregla el diseño de este apartado; que sea más
  intuitivo»). Eran nueve filas de texto iguales, una tras otra: no se
  distinguía una sección de la página de una acción, «Comercios» y «Ver todos
  los comercios» parecían lo mismo, y media hoja quedaba vacía. Ahora dice
  qué es cada cosa por su FORMA, en tres bloques:

    1. «EN ESTA PÁGINA»: las cinco secciones de la portada, cada una con su
       icono y una flecha. Son anclas: bajan a su sitio.
    2. EL DIRECTORIO, aparte y destacado: no es una sección, es otra página.
       Lleva una línea que lo explica. Una tarjeta BLANCA con sombra: se
       probó negra y el propietario no la quiso («no me gusta que tenga el
       fondo negro»).
    3. LAS ACCIONES, abajo, en la zona del pulgar y como BOTONES: «Únete a
       ORUM» en el oro de la marca (`--gold-500`, el de los accesos; el
       `--gold-600` de serie se veía «muy oscuro»), «Iniciar sesión» de
       contorno, y debajo la puerta de los negocios.

  «ALÍATE CON ORUM» ABRE EL FORMULARIO ENCIMA, igual que el botón «Quiero ser
  aliado» de la página («debería ser igual que darle al botón»): se lo pide
  por evento al disparador que ya vive en la portada y en el directorio. Si
  en la página no hay ninguno, el enlace navega a `/aliados`, su respaldo.

  Las secciones VIAJAN hasta su sitio (`DesplazamientoSuave`, en el layout).

  Lleva DOS entradas más que la cabecera de escritorio —el directorio y
  «¿Tienes un negocio?»—: en un menú que ya está abierto encima de todo,
  obligar a cerrarlo y bajar hasta el pie para encontrarlas sería un clic de
  castigo.
*/

/** El icono de cada sección, por su ancla. Decorativo: el nombre va al lado. */
const ICONOS: Record<string, LucideIcon> = {
  '/#inicio': Home,
  '/#nosotros': Users,
  '/#comercios': Store,
  '/#membresias': Crown,
  '/#proposito': Sparkles,
}

export function MenuMovilPublico() {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  /* Abre el formulario encima si la página tiene uno; si no, deja navegar. */
  const alAliarse = (e: MouseEvent<HTMLAnchorElement>) => {
    cerrar()
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (pedirFormularioAliados()) e.preventDefault()
  }

  return (
    <div className={estilos.soloMovil}>
      {/* El ámbito oscuro va en el envoltorio del BOTÓN, no en la raíz: la
          hoja es hermana suya y debe conservar los tokens del tema. */}
      <span className={escaparate.sobreFoto}>
        <Button
          variant="ghost"
          size="md"
          iconOnly
          aria-label="Abrir menú"
          aria-expanded={abierto}
          onClick={() => setAbierto(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </Button>
      </span>

      <Sheet open={abierto} onClose={cerrar} title="Menú" detent="large">
        <div className={estilos.menu}>
          <nav aria-labelledby="menu-secciones">
            <p id="menu-secciones" className={estilos.rotulo}>
              En esta página
            </p>
            <ul className={estilos.lista}>
              {ANCLAS.map((ancla) => {
                const Icono = ICONOS[ancla.href] ?? Compass
                return (
                  <li key={ancla.href}>
                    <Link href={ancla.href} className={estilos.fila} onClick={cerrar}>
                      <span className={estilos.filaIcono} aria-hidden="true">
                        <Icono size={18} />
                      </span>
                      <span className={estilos.filaTexto}>{ancla.texto}</span>
                      <ChevronRight size={17} aria-hidden="true" className={estilos.filaFlecha} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* El directorio: otra PÁGINA, no una sección. Por eso va aparte y
              dice lo que hay dentro. */}
          <Link href="/explorar" className={estilos.destacado} onClick={cerrar}>
            <span className={estilos.destacadoIcono} aria-hidden="true">
              <Compass size={20} />
            </span>
            <span className={estilos.destacadoTextos}>
              <span className={estilos.destacadoTitulo}>Ver todos los comercios</span>
              <span className={estilos.destacadoBajada}>
                El directorio completo, con sus beneficios
              </span>
            </span>
            <ArrowRight size={18} aria-hidden="true" className={estilos.destacadoFlecha} />
          </Link>

          {/* Las acciones, como botones: lo que se HACE, no adonde se va. */}
          <div className={estilos.acciones}>
            <Button
              href={HREF_UNETE}
              variant="brand"
              size="lg"
              pildora
              fullWidth
              icon={<Crown size={17} aria-hidden="true" />}
              onClick={cerrar}
            >
              Únete a ORUM
            </Button>
            <Button
              href="/miembros/login"
              variant="secondary"
              size="lg"
              pildora
              fullWidth
              icon={<LogIn size={17} aria-hidden="true" />}
              onClick={cerrar}
            >
              Iniciar sesión
            </Button>

            <Link href="/aliados" className={estilos.negocio} onClick={alAliarse}>
              <Handshake size={17} aria-hidden="true" />
              ¿Tienes un negocio? <strong>Alíate con ORUM</strong>
            </Link>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
