'use client'

import { useState, useSyncExternalStore } from 'react'
import { Download, Plus, Share, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuItem } from '@/components/ui/menu'
import { Sheet } from '@/components/ui/sheet'
import { useHidratado } from '@/components/use-hidratado'
import { usePreferenciaLocal } from '@/components/use-preferencia-local'
import {
  esSafariEnIOS,
  esStandalone,
  lanzarInstalacion,
  leerInstalable,
  leerInstalableEnServidor,
  suscribirInstalable,
} from './instalable'
import styles from './instalar-app.module.css'

/**
 * Invitación a instalar la app.
 *
 * Hay dos caminos completamente distintos:
 *
 * - **Android / Chrome:** existe `beforeinstallprompt` y se puede lanzar el
 *   diálogo nativo desde un botón nuestro.
 * - **iOS / Safari:** ese evento NO existe. La única forma de instalar es
 *   Compartir → Añadir a pantalla de inicio, así que hay que enseñar el gesto;
 *   sin explicarlo, en iPhone sencillamente nadie instala la app.
 *
 * En ambos casos el banner es descartable y la decisión se recuerda.
 */
/**
 * ¿Tiene sentido ofrecer la instalación aquí y ahora?
 *
 * Vive en un hook porque hay DOS entradas permanentes —el menú de la cuenta en
 * escritorio y la hoja "Más" en móvil— y la condición es delicada: depende de
 * la hidratación, del navegador y de si la app ya corre instalada. Duplicarla
 * es garantizar que las dos se desincronicen.
 */
function useInstalacion() {
  const hidratado = useHidratado()

  const promptDisponible = useSyncExternalStore(
    suscribirInstalable,
    leerInstalable,
    leerInstalableEnServidor,
  )

  // Antes de hidratar no se sabe nada del dispositivo: `esStandalone` y
  // `esSafariEnIOS` leen de `window` y en servidor devuelven `false`.
  if (!hidratado || esStandalone()) return { disponible: false, enIOS: false }

  const enIOS = esSafariEnIOS()

  // Sin prompt y fuera de iOS, el navegador sencillamente no permite instalar.
  return { disponible: promptDisponible !== null || enIOS, enIOS }
}

/**
 * Entrada permanente a la instalación, para el menú de la cuenta (escritorio).
 *
 * El banner superior se puede descartar, y una vez descartado no había forma
 * de volver a encontrar cómo instalar la app. Esto siempre está disponible.
 *
 * Se oculta solo cuando ya se está ejecutando instalada: ofrecer "instalar"
 * dentro de la app instalada no tendría sentido.
 */
export function BotonInstalar({
  /**
   * Igual que en `EntradaInstalar`: la guía NO puede vivir aquí dentro. El
   * `MenuItem` cierra el popover del menú al pulsarse, y un popover cerrado
   * oculta a sus descendientes — la guía se abriría invisible. Pasa en iPadOS,
   * que se identifica como iOS y sí ve la barra lateral.
   */
  onPedirGuiaIOS,
}: {
  onPedirGuiaIOS?: () => void
}) {
  const { disponible, enIOS } = useInstalacion()

  if (!disponible) return null

  return (
    <MenuItem
      icon={enIOS ? <Share size={16} /> : <Download size={16} />}
      onSelect={() => {
        if (enIOS) onPedirGuiaIOS?.()
        else void lanzarInstalacion()
      }}
    >
      Instalar en este dispositivo
    </MenuItem>
  )
}

/**
 * La misma entrada, con el aspecto de una fila de lista.
 *
 * Existe para la hoja "Más" del móvil, que es la ÚNICA puerta permanente a la
 * instalación en un teléfono: allí no hay menú del avatar —vive en el pie de
 * la barra lateral, oculta— y el banner es descartable. Sin esto, quien
 * cerraba el banner en su móvil se quedaba sin forma de instalar la app, que
 * es justo el dispositivo donde instalarla tiene sentido.
 *
 * Las clases llegan de fuera para que la fila sea indistinguible de las demás
 * de la hoja; este componente no sabe nada del shell.
 */
export function EntradaInstalar({
  className,
  iconClassName,
  onPedirGuiaIOS,
  onInstalar,
}: {
  className?: string
  iconClassName?: string
  /**
   * En iOS no hay diálogo nativo: hay que enseñar el gesto. Quien monte esta
   * entrada decide dónde vive la guía —ver `GuiaInstalacionIOS`— porque si se
   * renderizara aquí quedaría ANIDADA dentro de la hoja contenedora, y un
   * `<dialog>` cerrado es `display: none`: al cerrar la hoja para mostrar la
   * guía, la guía se ocultaría con ella.
   */
  onPedirGuiaIOS?: () => void
  /** Se llama tras lanzar la instalación, para cerrar la hoja contenedora. */
  onInstalar?: () => void
}) {
  const { disponible, enIOS } = useInstalacion()

  if (!disponible) return null

  const Icono = enIOS ? Share : Download

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (enIOS) {
          onPedirGuiaIOS?.()
        } else {
          void lanzarInstalacion()
          onInstalar?.()
        }
      }}
    >
      <Icono className={iconClassName} aria-hidden="true" />
      {enIOS ? 'Cómo instalar la app' : 'Instalar en este dispositivo'}
    </button>
  )
}

/**
 * Guía de instalación para iOS, controlada desde fuera.
 *
 * Se exporta para que el shell pueda montarla como HERMANA de la hoja "Más"
 * y no dentro de ella. Ver `EntradaInstalar` para el porqué.
 */
export function GuiaInstalacionIOS({
  abierta,
  onCerrar,
}: {
  abierta: boolean
  onCerrar: () => void
}) {
  return <GuiaIOS abierta={abierta} onCerrar={onCerrar} />
}

export function InstalarApp() {
  const { disponible, enIOS } = useInstalacion()
  const [descartado, setDescartado] = usePreferenciaLocal('orum-instalar-descartado')
  const [guiaAbierta, setGuiaAbierta] = useState(false)

  // El hook ya cubre hidratación, dispositivo y app instalada. Aquí solo se
  // añade lo propio del banner: que no se haya descartado. Pintarlo y
  // quitarlo después sería un parpadeo.
  if (!disponible || descartado) return null

  return (
    <>
      <div className={styles.banner}>
        <span className={styles.icono}>
          <Smartphone size={19} aria-hidden="true" />
        </span>

        <div className={styles.textos}>
          <span className={styles.titulo}>Instala ORUM en este dispositivo</span>
          <span className={styles.descripcion}>
            Se abre a pantalla completa, sin barra del navegador, y queda en tu pantalla
            de inicio.
          </span>
        </div>

        <div className={styles.acciones}>
          <Button
            size="sm"
            icon={enIOS ? <Share size={15} /> : <Download size={15} />}
            onClick={() => {
              if (enIOS) {
                setGuiaAbierta(true)
              } else {
                void lanzarInstalacion()
              }
            }}
          >
            {enIOS ? 'Cómo instalar' : 'Instalar'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            iconOnly
            aria-label="No mostrar más"
            onClick={() => setDescartado(true)}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      <GuiaIOS abierta={guiaAbierta} onCerrar={() => setGuiaAbierta(false)} />
    </>
  )
}

/**
 * Los tres pasos para instalar en iPhone.
 *
 * Safari no dispara `beforeinstallprompt`: allí no hay botón que valga y la
 * instalación es manual. Sin enseñar el gesto, en iPhone sencillamente nadie
 * instala la app.
 */
function GuiaIOS({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  return (
    <>
      <Sheet
        open={abierta}
        onClose={onCerrar}
        detent="medium"
        title="Añadir ORUM a tu iPhone"
        description="Safari no permite instalar con un botón, así que hay que hacerlo desde el menú de compartir."
        footer={
          <Button onClick={onCerrar} fullWidth>
            Entendido
          </Button>
        }
      >
        <ol className={styles.pasos}>
          <li className={styles.paso}>
            <span className={styles.pasoTexto}>
              Toca el botón de compartir
              <span className={styles.pasoIcono}>
                <Share size={17} aria-hidden="true" />
              </span>
              en la barra inferior de Safari.
            </span>
          </li>

          <li className={styles.paso}>
            <span className={styles.pasoTexto}>
              Desliza hacia abajo y elige{' '}
              <strong>Añadir a pantalla de inicio</strong>
              <span className={styles.pasoIcono}>
                <Plus size={17} aria-hidden="true" />
              </span>
              .
            </span>
          </li>

          <li className={styles.paso}>
            <span className={styles.pasoTexto}>
              Confirma con <strong>Añadir</strong>. El icono de ORUM aparecerá junto a tus
              demás aplicaciones.
            </span>
          </li>
        </ol>
      </Sheet>
    </>
  )
}
