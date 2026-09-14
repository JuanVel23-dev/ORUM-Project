import { Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SubidaImagen } from '@/components/imagenes/subida-imagen'
import { LIMITE_IMAGENES_COMERCIOS } from '@/lib/imagenes/validacion'
import {
  actualizarImagenGaleria,
  agregarImagenGaleria,
  guardarImagenComercio,
  quitarImagenGaleria,
} from '@/app/admin/comercios/imagenes-actions'
import styles from './gestor-imagenes.module.css'

/*
  GESTOR DE IMÁGENES DE UN COMERCIO

  Server Component. Solo las tres subidas son islas de cliente (`SubidaImagen`
  necesita `useActionState` y la vista previa local); la galería ya montada son
  formularios llanos con server actions, así que ordenar y quitar funcionan sin
  JavaScript.

  Se importa con el alias `@/app/admin/…`, nunca con `../../../..`: la gemela
  interceptada de esta pantalla vive cuatro niveles por debajo y una ruta
  relativa apuntaría a otro sitio desde cada una.
*/

export type ImagenGaleria = {
  id: number
  url: string
  descripcion: string | null
  orden: number
}

export function GestorImagenes({
  comercioId,
  nombre,
  logoUrl,
  portadaUrl,
  galeria,
}: {
  comercioId: number
  nombre: string
  logoUrl: string | null
  portadaUrl: string | null
  galeria: ImagenGaleria[]
}) {
  return (
    <div className={styles.gestor}>
      <section className={styles.bloque}>
        <h2 className={styles.titulo}>Logo</h2>
        <p className={styles.nota}>
          Es lo que identifica al comercio en el catálogo. Si ya tenía un logo alojado
          en su propia web, sigue viéndose hasta que subas uno aquí.
        </p>
        <SubidaImagen
          accion={guardarImagenComercio}
          campos={{ id: comercioId, destino: 'logo' }}
          label="Archivo del logo"
          urlActual={logoUrl}
          nombre={nombre}
          limite={LIMITE_IMAGENES_COMERCIOS}
          forma="cuadrada"
          etiquetaAccion="Subir logo"
        />
      </section>

      <section className={styles.bloque}>
        <h2 className={styles.titulo}>Portada</h2>
        <p className={styles.nota}>
          Foto apaisada (16/9) para la cubierta del comercio. Es la imagen grande que
          ve el socio, así que conviene que sea del local o del producto, no el logo
          otra vez.
        </p>
        <SubidaImagen
          accion={guardarImagenComercio}
          campos={{ id: comercioId, destino: 'portada' }}
          label="Archivo de la portada"
          urlActual={portadaUrl}
          nombre={nombre}
          limite={LIMITE_IMAGENES_COMERCIOS}
          forma="apaisada"
          etiquetaAccion="Subir portada"
        />
      </section>

      <section className={styles.bloque}>
        <h2 className={styles.titulo}>Galería</h2>
        <p className={styles.nota}>
          El orden manda de menor a mayor. El texto alternativo describe lo que se ve,
          para quien no puede verlo: déjalo vacío solo si la imagen es decorativa —
          nunca pongas ahí el nombre del archivo.
        </p>

        <SubidaImagen
          accion={agregarImagenGaleria}
          campos={{ comercio_id: comercioId }}
          label="Añadir una imagen"
          urlActual={null}
          nombre={nombre}
          limite={LIMITE_IMAGENES_COMERCIOS}
          forma="apaisada"
          etiquetaAccion="Añadir a la galería"
        >
          <div className={styles.meta}>
            <Field label="Texto alternativo" optional>
              <Input name="descripcion" maxLength={160} />
            </Field>
            <Field label="Orden">
              <Input
                name="orden"
                type="number"
                inputMode="numeric"
                numeric
                defaultValue={galeria.length}
                min={0}
                step={1}
              />
            </Field>
          </div>
        </SubidaImagen>

        {galeria.length === 0 ? (
          <p className={styles.vacia}>
            Todavía no hay imágenes en la galería de este comercio.
          </p>
        ) : (
          <ul className={styles.lista}>
            {galeria.map((imagen) => (
              <li key={imagen.id} className={styles.pieza}>
                <span className={styles.miniatura} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local */}
                  <img
                    src={imagen.url}
                    alt=""
                    className={styles.miniaturaImagen}
                    loading="lazy"
                    decoding="async"
                  />
                </span>

                {/*
                  Dos formularios hermanos y NO uno con dos botones: quitar y
                  guardar mandan a acciones distintas, y un `formaction` dentro
                  de un `<form>` que ya tiene `action` de servidor no se
                  comporta igual sin JavaScript.
                */}
                <form action={actualizarImagenGaleria} className={styles.piezaCampos}>
                  <input type="hidden" name="id" value={imagen.id} />
                  <input type="hidden" name="comercio_id" value={comercioId} />

                  <Field label="Texto alternativo" optional>
                    <Input
                      name="descripcion"
                      defaultValue={imagen.descripcion ?? ''}
                      maxLength={160}
                    />
                  </Field>

                  <Field label="Orden">
                    <Input
                      name="orden"
                      type="number"
                      inputMode="numeric"
                      numeric
                      defaultValue={imagen.orden}
                      min={0}
                      step={1}
                    />
                  </Field>

                  <Button type="submit" size="sm" variant="secondary" icon={<Save size={15} />}>
                    Guardar
                  </Button>
                </form>

                <form action={quitarImagenGaleria} className={styles.piezaQuitar}>
                  <input type="hidden" name="id" value={imagen.id} />
                  <input type="hidden" name="comercio_id" value={comercioId} />
                  <Button type="submit" size="sm" variant="danger" icon={<Trash2 size={15} />}>
                    Quitar
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
