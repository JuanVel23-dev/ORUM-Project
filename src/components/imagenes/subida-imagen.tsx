'use client'

import { useActionState, useEffect, useState, type ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, useField } from '@/components/ui/field'
import {
  TIPOS_IMAGEN,
  pesoLegible,
  validarImagen,
} from '@/lib/imagenes/validacion'
import { ESTADO_SUBIDA_INICIAL, type EstadoSubida } from '@/lib/imagenes/estado'
import styles from './subida-imagen.module.css'

/*
  EL CONTROL DE SUBIDA  ·  una sola pieza para los cuatro sitios

  Vive en `src/components/imagenes/` y no en `ui/` porque no es una primitiva
  del sistema: sabe de buckets, de límites y del estado que devuelven las
  acciones de imagen. Lo usan el panel (comercio, usuario, miembro) y el
  portal del socio, así que tampoco puede vivir dentro de una ruta.

  Tres decisiones que no son cosméticas:

  1. El `<input type="file">` se queda VISIBLE y se estiliza por
     `::file-selector-button`. La alternativa habitual —ocultarlo y poner un
     `<label>` con pinta de botón— exige reconstruir a mano el foco, el
     nombre accesible y el anuncio del archivo elegido, y el resultado se
     rompe con teclado más veces de las que se arregla.

  2. La validación del navegador es COMODIDAD, no seguridad. Usa la misma
     función pura que el servidor, pero sin leer los bytes: aquí solo evita un
     viaje de ida y vuelta con un archivo de 4 MB. Quien decide es el servidor.

  3. `<img>` y no `next/image`: `next.config.ts` no declara `images`, y estas
     URLs son externas —conviven las de Storage con las de comercios que
     alojan su logo en su propia web—. `loading="lazy"` y `decoding="async"`,
     igual que `ComercioLogo`.
*/

export type FormaImagen = 'circulo' | 'cuadrada' | 'apaisada'

type Props = {
  /** La server action de subida. Devuelve la URL nueva para la vista previa. */
  accion: (previo: EstadoSubida, formData: FormData) => Promise<EstadoSubida>
  /** Campos ocultos que identifican la entidad (id, perfil_id, destino…). */
  campos?: Record<string, string | number>
  label: string
  help?: string
  /** URL actual, para la vista previa. Puede ser externa o de Storage. */
  urlActual: string | null
  /** Se usa como respaldo cuando no hay imagen: la inicial, como `Avatar`. */
  nombre: string
  /** Límite del bucket correspondiente, en bytes. */
  limite: number
  forma?: FormaImagen
  /**
   * `tinta` en Administración y en la Herramienta de Comercios; `marca` (oro)
   * solo en el recorrido del socio. No es una preferencia: es la regla del oro.
   */
  acento?: 'tinta' | 'marca'
  /** Texto del botón de envío. */
  etiquetaAccion?: string
  /**
   * Campos extra DENTRO del mismo formulario (el texto alternativo y el orden
   * de una pieza de galería). Van aquí y no en un formulario aparte porque se
   * envían con el archivo: separarlos obligaría a subir primero y describir
   * después, que es como se acumulan imágenes sin texto alternativo.
   */
  children?: ReactNode
}

const ACEPTA = TIPOS_IMAGEN.join(',')

export function SubidaImagen({
  accion,
  campos,
  label,
  help,
  urlActual,
  nombre,
  limite,
  forma = 'cuadrada',
  acento = 'tinta',
  etiquetaAccion = 'Subir imagen',
  children,
}: Props) {
  const [state, formAction, pending] = useActionState(accion, ESTADO_SUBIDA_INICIAL)

  /* Vista previa local del archivo recién elegido. Estado de UI puro, no
     estado externo: `useSyncExternalStore` no aplica aquí. */
  const [previa, setPrevia] = useState<string | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  // Un object URL retiene el archivo en memoria hasta que se revoca.
  useEffect(() => {
    if (!previa) return
    return () => URL.revokeObjectURL(previa)
  }, [previa])

  const inicial = nombre.trim().charAt(0).toUpperCase() || '?'
  const mostrada = previa ?? state.url ?? urlActual
  const error = errorLocal ?? state.error ?? null

  function alElegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0] ?? null
    setPrevia(null)
    setErrorLocal(null)
    if (!archivo) return

    const veredicto = validarImagen({ tipo: archivo.type, tamano: archivo.size }, limite)
    if (!veredicto.ok) {
      setErrorLocal(veredicto.error)
      evento.target.value = ''
      return
    }
    setPrevia(URL.createObjectURL(archivo))
  }

  return (
    <form action={formAction} className={styles.subida}>
      {campos &&
        Object.entries(campos).map(([clave, valor]) => (
          <input key={clave} type="hidden" name={clave} value={String(valor)} />
        ))}

      {/* El acuse de éxito es un `Alert` y no solo un cambio en la vista
          previa: el color no puede ser el único portador del significado. */}
      {state.ok && !previa && <Alert tone="success">Imagen actualizada.</Alert>}

      <div className={styles.fila}>
        <span className={`${styles.previa} ${styles[forma]}`} aria-hidden="true">
          {mostrada ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
            <img
              src={mostrada}
              /* Vacío a propósito: si la URL está muerta, un `alt` con texto
                 puede arrastrar el glifo de imagen rota en Chrome. El peor
                 caso admitido es una placa vacía, nunca un icono de error. */
              alt=""
              className={styles.imagen}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={styles.inicial}>{inicial}</span>
          )}
        </span>

        <div className={styles.campo}>
          <Field
            label={label}
            help={help ?? `PNG, JPEG o WebP. Máximo ${pesoLegible(limite)}.`}
            error={error}
          >
            <CampoArchivo onChange={alElegir} />
          </Field>

          {children}

          <Button
            type="submit"
            size="sm"
            variant={acento === 'marca' ? 'brand' : 'primary'}
            loading={pending}
            icon={<Upload size={15} />}
          >
            {etiquetaAccion}
          </Button>
        </div>
      </div>
    </form>
  )
}

/**
 * El `<input type="file">` en su propio componente, y no en línea, porque
 * `useField()` solo ve el contexto del `Field` si se llama DENTRO de él.
 * Sin esto la etiqueta no apunta a ningún control: se ve bien y al tocarla no
 * pasa nada, que es de los fallos de accesibilidad más difíciles de ver en una
 * captura.
 */
function CampoArchivo({
  onChange,
}: {
  onChange: (evento: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const { id, describedBy, invalid } = useField()

  return (
    <input
      type="file"
      name="archivo"
      id={id || undefined}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      accept={ACEPTA}
      required
      onChange={onChange}
      className={styles.archivo}
    />
  )
}
