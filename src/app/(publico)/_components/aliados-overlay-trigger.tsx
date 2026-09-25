'use client'

import { useState, type MouseEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button, type ButtonVariant } from '@/components/ui/button'
import { Overlay } from '@/components/ui/overlay'
import escaparate from '@/app/(publico)/escaparate.module.css'
import { FormularioAliado } from '@/app/(publico)/aliados/_components/formulario-aliado'

/*
  «POSTULAR MI NEGOCIO»  ·  el formulario se abre encima, sin navegar
  ---------------------------------------------------------------------------
  En el marcado esto es un `<Link href="/aliados">` REAL —lo renderiza `Button`
  cuando recibe `href`—, y eso es lo que lo hace funcionar sin JavaScript, ser
  indexable y tener URL propia para compartir. Este componente solo intercepta
  el clic cuando SÍ hay JavaScript.

  POR QUÉ NO UNA RUTA INTERCEPTADA (`@modal`), que es el patrón del panel: esa
  ranura existe para no perder el contexto de una LISTA DE TRABAJO. Aquí no hay
  lista detrás que perder —es una landing de una sola pantalla de scroll—, así
  que inventar una ranura de rutas paralelas nueva para un único formulario
  público sería maquinaria sin trabajo que hacer. Estado local y basta, el mismo
  razonamiento que ya evitó un overlay para «Más filtros» en el catálogo.

  Y LA PÁGINA `/aliados` NO ES UNA ALTERNATIVA, ES EL RESPALDO OBLIGATORIO: sin
  ella, un enlace compartido por WhatsApp, un resultado de buscador o un
  visitante sin JavaScript no tendrían manera de llegar al formulario.

  El formulario es EL MISMO COMPONENTE en las dos superficies, importado de la
  ruta que lo aloja. Dos copias se desincronizan a la primera corrección.
*/

type Props = {
  /**
   * Instante del reloj del SERVIDOR en que se pintó la landing. Viaja al
   * formulario para la comprobación anti-robot: el reloj del visitante puede
   * ir mal, el del servidor es el único con el que se puede comparar.
   */
  abiertoEn: number
  soporte: string | null
  /**
   * `secondary` sobre crema (la landing); `brand` sobre la banda negra del
   * directorio, donde el ámbito `sobreFoto` lo pinta en oro pálido.
   */
  variant?: Extract<ButtonVariant, 'secondary' | 'brand'>
  /**
   * Clase para el BOTÓN, no para un envoltorio: el diálogo se monta junto a
   * él, y un envoltorio que remapeara tokens se los pasaría al formulario.
   */
  className?: string
}

export function AliadosOverlayTrigger({
  abiertoEn,
  soporte,
  variant = 'secondary',
  className,
}: Props) {
  const [abierto, setAbierto] = useState(false)

  const interceptar = (e: MouseEvent<HTMLAnchorElement>) => {
    /*
      Se respetan las formas de abrir en otra pestaña: ctrl/cmd+clic, clic con
      la rueda, shift+clic. Quien las usa quiere una pestaña nueva, y robársela
      para abrir un diálogo es exactamente el tipo de captura que hace que la
      gente deje de confiar en los enlaces.
    */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

    e.preventDefault()
    setAbierto(true)
  }

  return (
    <>
      <Button
        href="/aliados"
        variant={variant}
        size="lg"
        pildora
        className={className}
        onClick={interceptar}
      >
        Quiero ser aliado
        <ArrowRight size={16} aria-hidden="true" className={escaparate.flecha} />
      </Button>

      {/*
        `detent="large"`: el formulario tiene diez campos y en `medium` habría
        que desplazar de inmediato. Aquí sí conviene la pantalla completa,
        porque rellenarlo es la única tarea del momento.

        Cerrar devuelve a la landing exactamente donde estaba: el botón no
        navegó, así que no hay nada que restaurar.
      */}
      <Overlay
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Alía tu negocio con ORUM"
        description="Cuéntanos de tu negocio y te contactamos para evaluar la alianza."
        width="560px"
        detent="large"
      >
        <FormularioAliado
          superficie="overlay"
          abiertoEn={abiertoEn}
          soporte={soporte}
          onCerrar={() => setAbierto(false)}
        />
      </Overlay>
    </>
  )
}
