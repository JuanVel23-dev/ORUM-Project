'use client'

import { useActionState } from 'react'
import { Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/input'
import { useCerrarCuando } from '@/components/shell/overlay-ruta'
import { retirarFotoMiembro } from '@/app/admin/miembros/imagenes-actions'
import { ESTADO_SUBIDA_INICIAL } from '@/lib/imagenes/estado'
import { ETIQUETA_MOTIVO, MOTIVOS_RETIRADA } from '@/lib/imagenes/derechos'
import styles from '../../../ficha.module.css'

/* Sin `Card`: la superficie la pone quien lo usa (el overlay o la página). */
export function RetirarFotoForm({ miembroId, nombre }: { miembroId: number; nombre: string }) {
  const [estado, accion, enviando] = useActionState(retirarFotoMiembro, ESTADO_SUBIDA_INICIAL)
  useCerrarCuando(estado.ok)

  return (
    <form action={accion} className={styles.renovar} noValidate>
      {estado.error && <Alert tone="danger">{estado.error}</Alert>}

      <Alert tone="warning">
        Se borrará la foto de {nombre} y su carnet volverá a mostrar las iniciales. La acción
        queda registrada en la bitácora con el motivo.
      </Alert>

      <input type="hidden" name="id" value={miembroId} />

      <div className={styles.renovarCampos}>
        <Field label="Motivo">
          <Select name="motivo" required defaultValue="">
            <option value="" disabled>
              Elige un motivo…
            </option>
            {MOTIVOS_RETIRADA.map((m) => (
              <option key={m} value={m}>
                {ETIQUETA_MOTIVO[m]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button
        type="submit"
        loading={enviando}
        icon={<Trash2 size={16} />}
        className={styles.renovarBoton}
      >
        Retirar foto
      </Button>
    </form>
  )
}
