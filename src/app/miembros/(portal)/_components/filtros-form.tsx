import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import styles from './filtros-form.module.css'

type Opcion = { id: number; nombre: string }

export function FiltrosForm({
  q,
  comercioId,
  marcaId,
  ciudadId,
  comercios,
  marcas,
  ciudades,
}: {
  q: string
  comercioId: string
  marcaId: string
  ciudadId: string
  comercios: Opcion[]
  marcas: Opcion[]
  ciudades: Opcion[]
}) {
  const hayFiltros = Boolean(q || comercioId || marcaId || ciudadId)

  return (
    /* GET, no POST: los filtros quedan en la URL, se comparten y sobreviven a
       un refresco. Funciona sin JavaScript. */
    <form method="get" className={styles.filtros}>
      <div className={styles.campoBusqueda}>
        <label className={styles.etiqueta} htmlFor="f-buscar">
          Buscar
        </label>
        <Input
          id="f-buscar"
          name="q"
          defaultValue={q}
          placeholder="Comercio o promoción"
          startIcon={<Search size={16} />}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={styles.etiqueta} htmlFor="f-comercio">
          Comercio
        </label>
        <Select id="f-comercio" name="comercio_id" defaultValue={comercioId}>
          <option value="">Todos</option>
          {comercios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={styles.etiqueta} htmlFor="f-marca">
          Marca
        </label>
        <Select id="f-marca" name="marca_id" defaultValue={marcaId}>
          <option value="">Todas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={styles.etiqueta} htmlFor="f-ciudad">
          Ciudad
        </label>
        <Select id="f-ciudad" name="ciudad_id" defaultValue={ciudadId}>
          <option value="">Todas</option>
          {ciudades.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.acciones}>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {hayFiltros && (
          <Button href="/miembros" variant="ghost" icon={<X size={16} />}>
            Limpiar
          </Button>
        )}
      </div>
    </form>
  )
}
