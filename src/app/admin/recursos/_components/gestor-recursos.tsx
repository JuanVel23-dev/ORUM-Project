import { Eye, EyeOff, Save, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copiar } from '@/components/ui/copiar'
import { AccionEstado } from '@/components/ui/accion-estado'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/toggle'
import { SubidaImagen } from '@/components/imagenes/subida-imagen'
import { LIMITE_RECURSOS_SITIO } from '@/lib/imagenes/validacion'
import { DESCRIPTOR_UBICACION, UBICACIONES_RECURSO } from '@/lib/sitio/recursos'
import type { UbicacionRecurso } from '@/lib/supabase/database.types'
import {
  actualizarRecurso,
  borrarRecurso,
  cambiarVisibilidadRecurso,
  subirRecurso,
} from '@/app/admin/recursos/actions'
import type { RecursoAdmin, RecursosPorUbicacion } from './datos'
import styles from './gestor-recursos.module.css'

/*
  GESTOR DE LOS RECURSOS DEL SITIO

  Server Component. La única isla de cliente por bloque es `SubidaImagen`
  —necesita `useActionState` y la vista previa local— más `AccionEstado` y
  `Copiar` por fila. Todo lo demás son formularios llanos con server actions,
  así que renombrar, reordenar y borrar funcionan sin JavaScript.

  Se importan las acciones con el alias `@/app/admin/…` y no con `../`: es la
  norma del proyecto, y aquí además protege del día en que esta pantalla tenga
  una gemela bajo `@modal` cuatro niveles más abajo.

  CUATRO BLOQUES Y NO CUATRO PESTAÑAS. Un segmentado ahorraría desplazamiento
  y costaría un clic para ver lo que hay —y la regla uno del proyecto es el
  menor número de clics—. Además son listas cortas por naturaleza: esta tabla
  no crece con los socios ni con los comercios, crece con lo que sube una
  persona a mano.
*/

export function GestorRecursos({ recursos }: { recursos: RecursosPorUbicacion }) {
  return (
    <div className={styles.gestor}>
      {UBICACIONES_RECURSO.map((ubicacion) => (
        <BloqueUbicacion
          key={ubicacion}
          ubicacion={ubicacion}
          piezas={recursos[ubicacion]}
        />
      ))}
    </div>
  )
}

function BloqueUbicacion({
  ubicacion,
  piezas,
}: {
  ubicacion: UbicacionRecurso
  piezas: RecursoAdmin[]
}) {
  const { titulo, nota, sePublica, forma } = DESCRIPTOR_UBICACION[ubicacion]
  const publicadas = piezas.filter((p) => p.visible).length

  return (
    <section className={styles.bloque} aria-labelledby={`recursos-${ubicacion}`}>
      <div className={styles.cabecera}>
        <h2 id={`recursos-${ubicacion}`} className={styles.titulo}>
          {titulo}
        </h2>

        {/*
          El recuento no es adorno: en «Imagen principal», saber que hay DOS
          visibles es lo que explica que la portada esté alternando. Sin él,
          alguien que solo quería cambiar la foto deja dos encendidas sin
          entender por qué se mueve.

          Texto y no solo color, como manda el sistema.
        */}
        {sePublica && piezas.length > 0 && (
          <Badge tone={publicadas > 0 ? 'success' : 'warning'} size="sm">
            {publicadas === 0
              ? 'Ninguna visible'
              : `${publicadas} visible${publicadas === 1 ? '' : 's'} de ${piezas.length}`}
          </Badge>
        )}
      </div>

      <p className={styles.nota}>{nota}</p>

      <SubidaImagen
        accion={subirRecurso}
        campos={{ ubicacion }}
        label="Archivo de la imagen"
        urlActual={null}
        nombre={titulo}
        limite={LIMITE_RECURSOS_SITIO}
        forma={forma}
        etiquetaAccion="Subir"
      >
        <div className={styles.meta}>
          <Field
            label="Nombre"
            help="Solo para ti: es lo que vas a leer en esta lista."
          >
            <Input name="titulo" maxLength={120} required />
          </Field>

          <Field label="Orden">
            <Input
              name="orden"
              type="number"
              inputMode="numeric"
              numeric
              defaultValue={piezas.length}
              min={0}
              step={1}
            />
          </Field>
        </div>

        <Field
          label="Texto alternativo"
          optional
          help="Describe lo que se ve, para quien no puede verlo. Déjalo vacío solo si la imagen es decorativa — nunca pongas ahí el nombre del archivo."
        >
          <Input name="descripcion" maxLength={160} />
        </Field>

        {sePublica && (
          <>
            <Field
              label="Enlace al que lleva"
              optional
              help="Empieza por https:// si va a otra web, o por / si es una página de ORUM."
            >
              <Input name="enlace_url" maxLength={300} inputMode="url" />
            </Field>

            {/*
              Apagado por defecto, y el `defaultChecked` no está puesto a
              propósito: subir un archivo no es publicarlo. Quien quiere que
              se vea ya, lo marca aquí y se ahorra el segundo viaje.
            */}
            <Checkbox
              name="visible"
              label="Mostrarla en la página"
              description="Si la dejas sin marcar, queda guardada y sin publicar."
            />
          </>
        )}
      </SubidaImagen>

      {piezas.length === 0 ? (
        <p className={styles.vacia}>Todavía no has subido nada aquí.</p>
      ) : (
        <ul className={styles.lista}>
          {piezas.map((pieza) => (
            <Pieza key={pieza.id} pieza={pieza} sePublica={sePublica} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Pieza({ pieza, sePublica }: { pieza: RecursoAdmin; sePublica: boolean }) {
  return (
    <li className={styles.pieza}>
      <span className={styles.miniatura} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL de Storage arbitraria, no un asset local */}
        <img
          src={pieza.url}
          alt=""
          className={styles.miniaturaImagen}
          loading="lazy"
          decoding="async"
        />
      </span>

      {/*
        Dos formularios hermanos y NO uno con varios botones: guardar, publicar
        y borrar van a acciones distintas, y un `formaction` dentro de un
        `<form>` que ya tiene `action` de servidor no se comporta igual sin
        JavaScript.
      */}
      <form action={actualizarRecurso} className={styles.campos}>
        <input type="hidden" name="id" value={pieza.id} />

        <div className={styles.filaCampos}>
          <Field label="Nombre">
            <Input name="titulo" defaultValue={pieza.titulo} maxLength={120} required />
          </Field>

          <Field label="Orden">
            <Input
              name="orden"
              type="number"
              inputMode="numeric"
              numeric
              defaultValue={pieza.orden}
              min={0}
              step={1}
            />
          </Field>
        </div>

        <Field label="Texto alternativo" optional>
          <Input
            name="descripcion"
            defaultValue={pieza.descripcion ?? ''}
            maxLength={160}
          />
        </Field>

        {sePublica && (
          <Field label="Enlace al que lleva" optional>
            <Input
              name="enlace_url"
              defaultValue={pieza.enlaceUrl ?? ''}
              maxLength={300}
              inputMode="url"
            />
          </Field>
        )}

        <div className={styles.piePieza}>
          <Button type="submit" size="sm" variant="secondary" icon={<Save size={15} />}>
            Guardar
          </Button>

          {/*
            La dirección del archivo, a un clic. Es lo que convierte «logos de
            ORUM» y «otros recursos» en una biblioteca útil en vez de una
            galería que solo se mira: se pega en un correo, en una plantilla o
            donde haga falta sin abrir el panel de Supabase.
          */}
          <Copiar valor={pieza.url} label="Copiar dirección">
            <span className={styles.direccion}>Dirección de la imagen</span>
          </Copiar>
        </div>
      </form>

      <div className={styles.acciones}>
        {sePublica && (
          <AccionEstado
            activo={pieza.visible}
            accion={cambiarVisibilidadRecurso}
            campos={{ id: pieza.id }}
            etiquetaActivar="Mostrar"
            etiquetaDesactivar="Ocultar"
            iconoActivar={<Eye size={15} aria-hidden="true" />}
            iconoDesactivar={<EyeOff size={15} aria-hidden="true" />}
          />
        )}

        <form action={borrarRecurso}>
          <input type="hidden" name="id" value={pieza.id} />
          <Button type="submit" size="sm" variant="danger" icon={<Trash2 size={15} />}>
            Borrar
          </Button>
        </form>
      </div>
    </li>
  )
}
