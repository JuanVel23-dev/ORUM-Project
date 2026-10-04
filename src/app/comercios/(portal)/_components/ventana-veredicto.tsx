'use client'

import { useActionState, useEffect } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { iniciales } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { error as vibrarError, exito as vibrarExito } from '@/lib/shared/haptica'
import { registrarVenta, type MiembroEncontrado, type RegistrarVentaState } from '../actions'
import { ConfirmarVentaForm } from './confirmar-venta-form'
import type { MetodoRegistroVenta, TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './verificar.module.css'

type Sucursal = { id: number; nombre: string | null }
type Promocion = {
  id: number
  titulo: string
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

const estadoInicial: RegistrarVentaState = {}

const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/*
  EL FOCO INICIAL DE LA VENTANA, EN LA X.

  `showModal()` enfoca el primer elemento enfocable del diálogo, y ese resultó
  ser la propia ventana: es un contenedor con desplazamiento, y Chrome los
  hace enfocables. El foco caía en la tarjeta entera, con su anillo dorado
  alrededor.

  Con el atributo `autofocus` el navegador sabe a quién dárselo. Se pone por
  `ref` y no con la prop `autoFocus` de React, que no escribe el atributo:
  llama a `focus()` al montar, cuando el diálogo todavía está cerrado y nada
  de dentro puede recibirlo.
*/
const enfocarAlAbrir = (nodo: HTMLButtonElement | null) => {
  nodo?.setAttribute('autofocus', '')
}

/*
  LA VENTANA DEL VEREDICTO  ·  04/10/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «cuando se lee el QR o se pone el número y la
  persona está activa o no, mejora el diseño del formulario y quiero que sea
  una ventana encima; no quiero que vaya debajo».

  Antes el veredicto y la venta eran dos tarjetas bajo la de buscar: en un
  teléfono quedaban fuera de la vista y había que bajar para saber si la
  membresía valía. Ahora el resultado LLEGA: una ventana encima de la página,
  que es a la vez el dictamen y —si la membresía vale— el formulario de venta.

  LA VENTANA ES LA TARJETA (`Modal desnudo`), como el carnet del socio: no hay
  un panel con otra tarjeta dentro. Su cabeza es el veredicto.

    · LA CABEZA es la franja de color sólido con el dictamen en mayúsculas.
      Se queda PEGADA arriba al desplazar el formulario: mientras se teclea
      el importe, el cajero sigue viendo si la membresía vale.
    · EL SOCIO, justo debajo: iniciales, nombre, plan y número. El nombre es
      lo que confirma que el carnet es de quien lo entrega.
    · Si está ACTIVA, el formulario de venta. Si NO, qué hacer y la vuelta.
    · Al registrar, la ventana entera pasa a ser el ACUSE.

  NO SE CIERRA AL PULSAR FUERA (`cerrarAlPulsarFuera={false}`): hay un
  importe a medio teclear y un toque en el velo lo perdería. La cierran su X,
  Escape y «Verificar otro socio», y las tres dejan la caja lista para el
  siguiente.

  POR QUÉ NO `StatusBadge` AQUÍ, Y POR QUÉ ESO NO CONTRADICE AL SISTEMA:
  `StatusBadge` sigue siendo lo correcto en una lista. Lo que no puede hacer
  un badge es ser el contenido principal: su tamaño —el diagnóstico exacto de
  `AUDIT-a11y` #9— es justo lo que falla cuando el dato que decide la
  transacción es el más pequeño de la pantalla. Lo que se hereda es su PATRÓN:
  punto lleno / punto hueco, texto siempre, nunca el color solo.

  CONTRASTE, MEDIDO. Relleno `--success` / `--danger` con texto `--surface`,
  que en este portal (siempre en claro) es blanco puro:

    activa    #137a3b con texto #ffffff .......... 5,37:1
    inactiva  #c1121f con texto #ffffff .......... 6,16:1

  El motivo de una inactiva se omite a propósito: `buscar_miembro_comercio`
  solo devuelve `vigente`, y no se inventa un «vencida» que podría ser
  «suspendida».
*/
export function VentanaVeredicto({
  abierta,
  consultaId,
  miembro,
  metodo,
  sucursales,
  promociones,
  onCerrar,
}: {
  abierta: boolean
  /** Cambia con cada búsqueda: arranca el contenido en limpio. */
  consultaId: number
  miembro: MiembroEncontrado | null
  metodo: MetodoRegistroVenta
  sucursales: Sucursal[]
  promociones: Promocion[]
  onCerrar: () => void
}) {
  /* El nombre del diálogo ES el veredicto: es lo primero que anuncia un
     lector de pantalla al abrirse, sin tener que ir a buscarlo. */
  const etiqueta = miembro
    ? `${miembro.vigente ? 'Membresía activa' : 'Membresía inactiva'}: ${miembro.nombreCompleto}`
    : 'Resultado de la verificación'

  return (
    <Modal
      open={abierta}
      onClose={onCerrar}
      ariaLabel={etiqueta}
      width="520px"
      desnudo
      cerrarAlPulsarFuera={false}
    >
      {miembro && (
        <Contenido
          key={consultaId}
          miembro={miembro}
          metodo={metodo}
          sucursales={sucursales}
          promociones={promociones}
          onCerrar={onCerrar}
        />
      )}
    </Modal>
  )
}

function Contenido({
  miembro,
  metodo,
  sucursales,
  promociones,
  onCerrar,
}: {
  miembro: MiembroEncontrado
  metodo: MetodoRegistroVenta
  sucursales: Sucursal[]
  promociones: Promocion[]
  onCerrar: () => void
}) {
  /* El estado de la VENTA vive aquí y no en el formulario: al registrarse, la
     ventana entera cambia al acuse, y el formulario ya no está para contarlo. */
  const [venta, registrar, registrando] = useActionState(registrarVenta, estadoInicial)

  /* La vibración sí es un efecto de verdad: toca una API del sistema. Solo en
     el flanco, al pasar a `ok`. */
  useEffect(() => {
    if (venta.ok) vibrarExito()
  }, [venta.ok])

  useEffect(() => {
    if (venta.error) vibrarError()
  }, [venta.error])

  if (venta.ok) {
    return (
      <article className={`${styles.ventana} ${styles.ventanaAcuse}`}>
        <button type="button" className={styles.cerrarAcuse} onClick={onCerrar} aria-label="Cerrar">
          <X size={20} aria-hidden="true" />
        </button>

        <div className={styles.exito} role="status">
          <span className={styles.exitoIcono} aria-hidden="true">
            <Check size={30} strokeWidth={2.5} />
          </span>

          <div className={styles.exitoTextos}>
            <h2 className={styles.exitoTitulo}>Venta registrada</h2>

            {/*
              LOS TRES DATOS PARA RECLAMAR: monto, socio y hora. Un cajero que
              sospecha un error necesita con qué llamar al administrador: «me
              equivoqué en una venta de esta tarde» no localiza ninguna fila.
              El monto y la hora los dice el SERVIDOR: son los que quedaron
              guardados, no los que había en pantalla.
            */}
            <p className={styles.exitoNota}>
              Se cobraron {PESOS.format(venta.valorFinal ?? 0)} a {miembro.nombreCompleto} (N.º{' '}
              {miembro.numeroMembresia}){venta.hora && <>, a las {venta.hora}</>}.
            </p>

            {/*
              HONESTIDAD EN LUGAR DE UN BOTÓN QUE NO EXISTE. El contrato de
              datos no expone ninguna anulación de venta (`API-CONTRACT.md` §4),
              así que no se ofrece un «Deshacer» de mentira: se dice a quién
              acudir y con qué datos, que es lo único cierto que se puede dar.
            */}
            <p className={styles.exitoAviso}>
              ¿Te equivocaste? Esta venta no se puede anular desde aquí: escribe al
              administrador con la hora y el número del socio.
            </p>
          </div>

          {/* La cola sigue: el camino de vuelta es un solo toque, y con
              teclado un solo Enter — el foco cae aquí al llegar el acuse. */}
          <Button
            onClick={onCerrar}
            variant="brand"
            size="lg"
            pildora
            fullWidth
            autoFocus
            icon={<RotateCcw size={17} />}
          >
            Verificar otro socio
          </Button>
        </div>
      </article>
    )
  }

  const vigente = miembro.vigente

  return (
    <article className={styles.ventana}>
      <header
        className={`${styles.dictamen} ${vigente ? styles.dictamenActiva : styles.dictamenInactiva}`}
      >
        {/* La X, primera en el DOM para que el foco empiece por la salida (y
            no por el campo del importe: en un teléfono abriría el teclado
            encima del veredicto). El orden visual lo pone el CSS. */}
        <button
          ref={enfocarAlAbrir}
          type="button"
          className={styles.cerrarVentana}
          onClick={onCerrar}
          aria-label="Cerrar"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 className={styles.dictamenTexto}>
          {/*
            Punto LLENO frente a anillo HUECO: la diferencia es de forma, no de
            color, así que sobrevive al daltonismo y al sol dando en la pantalla
            del móvil en plena caja. El texto dice lo mismo que el color, y es
            quien manda.
          */}
          <span
            className={`${styles.punto} ${vigente ? '' : styles.puntoHueco}`}
            aria-hidden="true"
          />
          {vigente ? 'Membresía activa' : 'Membresía inactiva'}
        </h2>
      </header>

      <div className={styles.socio}>
        {/* Decorativas: el nombre va al lado. */}
        <span className={styles.socioIniciales} aria-hidden="true">
          {iniciales(miembro.nombreCompleto)}
        </span>
        <div className={styles.socioDatos}>
          {/*
            El NOMBRE antes que el número: lo que confirma que el carnet es de
            quien lo está entregando es la cara y el nombre. El número baja a
            dato de cotejo, que es para lo que sirve.
          */}
          <p className={styles.nombre}>{miembro.nombreCompleto}</p>
          <p className={styles.socioMeta}>
            {vigente && miembro.planNombre && (
              <span className={styles.plan}>{miembro.planNombre}</span>
            )}
            <span className={styles.numero}>N.º {miembro.numeroMembresia}</span>
          </p>
        </div>
      </div>

      {vigente ? (
        <ConfirmarVentaForm
          miembroId={miembro.id}
          membresiaId={miembro.membresiaId}
          numeroMembresia={miembro.numeroMembresia}
          metodo={metodo}
          sucursales={sucursales}
          promociones={promociones}
          state={venta}
          formAction={registrar}
          pending={registrando}
        />
      ) : (
        <div className={styles.cuerpoVentana}>
          {/* Qué hacer, no solo qué pasa: un veredicto negativo sin
              instrucción deja al cajero decidiendo a solas delante del cliente. */}
          <p className={styles.instruccion}>
            No apliques el beneficio. El socio puede reactivar su membresía con el club.
          </p>

          <Button
            onClick={onCerrar}
            variant="brand"
            size="lg"
            pildora
            fullWidth
            icon={<RotateCcw size={17} />}
          >
            Verificar otro socio
          </Button>
        </div>
      )}
    </article>
  )
}
