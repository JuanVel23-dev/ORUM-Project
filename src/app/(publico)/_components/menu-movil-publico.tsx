'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { ANCLAS } from './anclas'
import estilos from './menu-movil-publico.module.css'

/*
  EL MENÚ DE MÓVIL  ·  la única pieza hidratada del cromo público
  ---------------------------------------------------------------------------
  `Sheet` y no `Overlay`: aquí no hay cara de escritorio que servir. El botón
  que la abre está oculto a partir de 768px, donde las mismas entradas ya viven
  en la cabecera como texto; montar además la rama de `Modal` sería pagar
  `useMediaQuery` para un diálogo que nunca se abre.

  `detent="medium"`: son cuatro filas, caben de sobra, y dejar ver la landing
  por debajo recuerda que el menú es un desvío y no un destino.

  Lleva UNA entrada más que la cabecera de escritorio —«¿Tienes un negocio?
  Alíate»—: es el corolario de `CLAUDE.md` sobre sacar cosas de la barra. En un
  menú que ya está abierto encima de todo, obligar a cerrarlo y desplazar hasta
  el final de la página para encontrar esa acción sería un clic de castigo.
*/
export function MenuMovilPublico() {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  return (
    <div className={estilos.soloMovil}>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Abrir menú"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
      >
        <Menu size={20} aria-hidden="true" />
      </Button>

      <Sheet open={abierto} onClose={cerrar} title="ORUM" detent="medium">
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

          <Link href="/miembros/login" className={estilos.fila} onClick={cerrar}>
            Iniciar sesión
          </Link>

          <Link href="/aliados" className={estilos.fila} onClick={cerrar}>
            ¿Tienes un negocio? Alíate
          </Link>
        </nav>
      </Sheet>
    </div>
  )
}
