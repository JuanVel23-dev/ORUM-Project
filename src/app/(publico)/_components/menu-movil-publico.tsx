'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { ANCLAS, HREF_UNETE } from './anclas'
import escaparate from '../escaparate.module.css'
import estilos from './menu-movil-publico.module.css'

/*
  EL MENÚ DE MÓVIL  ·  la única pieza hidratada del cromo público
  ---------------------------------------------------------------------------
  `Sheet` y no `Overlay`: aquí no hay cara de escritorio que servir. El botón
  que la abre está oculto a partir de 900px, donde las mismas entradas ya viven
  en la cabecera como texto; montar además la rama de `Modal` sería pagar
  `useMediaQuery` para un diálogo que nunca se abre.

  `detent="large"`: eran cuatro filas y cabían en `medium`; con las ocho de
  ahora (anclas, directorio, acceso, alta y alianza), a media altura habría
  que desplazar dentro de la hoja en un teléfono pequeño, y un menú que se
  desplaza esconde justo sus últimas entradas: las dos acciones.

  Lleva DOS entradas más que la cabecera de escritorio —«Ver todos los
  comercios» y «¿Tienes un negocio? Alíate»—: es el corolario de `CLAUDE.md`
  sobre sacar cosas de la barra. En un
  menú que ya está abierto encima de todo, obligar a cerrarlo y desplazar hasta
  el final de la página para encontrar esa acción sería un clic de castigo.
*/
export function MenuMovilPublico() {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

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

      <Sheet open={abierto} onClose={cerrar} title="ORUM" detent="large">
        <nav className={estilos.lista} aria-label="Menú">
          {ANCLAS.map((ancla) => (
            <Link
              key={ancla.href}
              href={ancla.href}
              className={estilos.fila}
              onClick={cerrar}
            >
              {ancla.texto}
            </Link>
          ))}

          <Link href="/explorar" className={estilos.fila} onClick={cerrar}>
            Ver todos los comercios
          </Link>
          <Link href="/miembros/login" className={estilos.fila} onClick={cerrar}>
            Iniciar sesión
          </Link>
          <Link
            href={HREF_UNETE}
            className={[estilos.fila, estilos.filaAccion].join(' ')}
            onClick={cerrar}
          >
            Únete a ORUM
          </Link>

          <Link href="/aliados" className={estilos.fila} onClick={cerrar}>
            ¿Tienes un negocio? Alíate
          </Link>
        </nav>
      </Sheet>
    </div>
  )
}
