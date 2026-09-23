import { SubidaImagen } from '@/components/imagenes/subida-imagen'
import { LIMITE_AVATARES } from '@/lib/imagenes/validacion'
import { guardarMiFoto } from '@/app/miembros/(portal)/perfil/imagenes-actions'

/**
 * El socio cambia la foto de su propio carnet.
 *
 * `acento="marca"`: estamos en el recorrido del cliente, donde el primario sí
 * puede ser relleno dorado (`--gold-600` + tinta, 5,40:1 firmado). En
 * Administración esta misma pieza va en tinta — la diferencia no es estética,
 * es la regla del oro.
 *
 * La acción NO recibe el id del miembro: lo deriva de la sesión. Si viniera
 * del formulario, cualquiera podría cambiar la foto del carnet de otro socio.
 */
export function MiFoto({ nombre, fotoUrl }: { nombre: string; fotoUrl: string | null }) {
  return (
    <SubidaImagen
      accion={guardarMiFoto}
      label="Tu foto"
      help="PNG, JPEG o WebP. Máximo 512 KB. Aparecerá en tu carnet, así que que se te vea la cara."
      urlActual={fotoUrl}
      nombre={nombre}
      limite={LIMITE_AVATARES}
      forma="circulo"
      acento="marca"
      etiquetaAccion="Guardar mi foto"
    />
  )
}
