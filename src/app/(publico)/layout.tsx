import type { ReactNode } from 'react'
import { obtenerWhatsappSoporte } from '@/lib/publico/datos-publicos'
import { EncabezadoPublico } from './_components/encabezado-publico'
import { PiePublico } from './_components/pie-publico'
import estilos from './publico.module.css'

/*
  EL CROMO DEL CUARTO PORTAL
  ---------------------------------------------------------------------------
  `(publico)` es un grupo de rutas: no añade segmento, así que `/`, `/explorar`
  y `/aliados` quedan tal cual. Comparten un único layout porque son la misma fachada — si
  `/aliados` tuviera cromo propio, quien llega por un enlace compartido por
  WhatsApp no reconocería que sigue en ORUM.

  Es el único layout del producto SIN `requireRol`: los otros tres exigen
  sesión desde su primer byte y este no exige nada. De ahí que no herede ni la
  cabecera del portal de miembros (acoplada al avatar de sesión) ni el shell de
  administración.

  Es `async` porque lee el WhatsApp de soporte para el pie. Esa lectura —y la
  comprobación de sesión de la landing— hacen que estas rutas se rendericen en
  cada petición, que es la estrategia buscada y no un descuido: el número de
  soporte y la lista de aliados los cambia un administrador desde el panel y
  tienen que verse al momento, sin redesplegar. Dentro de una misma petición,
  `cache()` evita que layout y página consulten dos veces.
*/
/*
  LA RANURA `@modal` vive AQUÍ y solo aquí: la ficha pública de un comercio
  (`@modal/(.)explorar/[id]`) se abre encima tanto desde el directorio como
  desde «Comercios destacados» de la landing, y una ruta interceptada solo
  intercepta si el layout que declara su ranura ya está montado.
*/
export default async function PublicoLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) {
  const soporte = await obtenerWhatsappSoporte()

  return (
    /*
      `data-theme="light"`: LA FACHADA SIEMPRE EN LOS COLORES DE LA MARCA.
      Encargo del propietario: esta página la ven personas en todo tipo de
      dispositivos, y en uno con el modo oscuro puesto las franjas crema salían
      negras. El tema oscuro sigue existiendo en los portales con sesión; aquí
      no aplica. Mismo mecanismo que `PantallaAuth` usa para fijar el oscuro.
    */
    <div className={estilos.fachada} data-theme="light">
      <EncabezadoPublico />

      {/*
        `container-type: inline-size` + `container-name: contenido` viven aquí,
        igual que en el `<main>` del portal de miembros y en el `.main` del
        shell de administración. Todas las secciones de la landing preguntan
        por ESTE contenedor con `@container contenido (...)`, nunca por
        `@media`. Aquí no hay barra lateral y hoy el ancho útil coincide con el
        del viewport, pero escribir un `@media` «porque total coinciden» es el
        atajo que la norma prohíbe: dejaría de coincidir en cuanto una de estas
        secciones se reutilizara bajo otro cromo.
      */}
      <main className={estilos.main}>{children}</main>

      {modal}

      <PiePublico soporte={soporte} />
    </div>
  )
}
