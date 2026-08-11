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
 * Entrada permanente a la instalación, para el menú de la cuenta.
 *
 * El banner superior se puede descartar, y una vez descartado no había forma
 * de volver a encontrar cómo instalar la app. Esto siempre está disponible.
 *
 * Se oculta solo cuando ya se está ejecutando instalada: ofrecer "instalar"
 * dentro de la app instalada no tendría sentido.
 */
export function BotonInstalar() {
  const hidratado = useHidratado()
  const [guiaAbierta, setGuiaAbierta] = useState(false)

  const promptDisponible = useSyncExternalStore(
    suscribirInstalable,
    leerInstalable,
    leerInstalableEnServidor,
  )

  if (!hidratado || esStandalone()) return null

  const enIOS = esSafariEnIOS()
  // Sin prompt y fuera de iOS, el navegador no permite instalar.
  if (!promptDisponible && !enIOS) return null

  return (
    <>
      <MenuItem
        icon={enIOS ? <Share size={16} /> : <Download size={16} />}
        onSelect={() => {
          if (enIOS) setGuiaAbierta(true)
          else void lanzarInstalacion()
        }}
      >
        Instalar en este dispositivo
      </MenuItem>

      <GuiaIOS abierta={guiaAbierta} onCerrar={() => setGuiaAbierta(false)} />
    </>
  )
}

export function InstalarApp() {
  const hidratado = useHidratado()
  const [descartado, setDescartado] = usePreferenciaLocal('orum-instalar-descartado')
  const [guiaAbierta, setGuiaAbierta] = useState(false)

  const promptDisponible = useSyncExternalStore(
    suscribirInstalable,
    leerInstalable,
    leerInstalableEnServidor,
  )

  // Antes de hidratar no se sabe nada del dispositivo ni de la preferencia:
  // pintar el banner y quitarlo después sería un parpadeo.
  if (!hidratado || descartado) return null

  // Ya está instalada: no hay nada que ofrecer.
  if (esStandalone()) return null

  const enIOS = esSafariEnIOS()
  if (!promptDisponible && !enIOS) return null

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
