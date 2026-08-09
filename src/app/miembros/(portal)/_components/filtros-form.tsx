import { Select } from '@/components/ui'

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
  return (
    <form
      method="get"
      className="orum-card"
      style={{
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
      }}
    >
      <div className="orum-field" style={{ flex: 2, minWidth: 200 }}>
        <label className="orum-label" htmlFor="q">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="text"
          className="orum-input"
          placeholder="Comercio o promoción…"
          defaultValue={q}
        />
      </div>

      <Select label="Comercio" htmlFor="comercio_id" name="comercio_id" defaultValue={comercioId} flex>
        <option value="">Todos</option>
        {comercios.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Select label="Marca" htmlFor="marca_id" name="marca_id" defaultValue={marcaId} flex>
        <option value="">Todas</option>
        {marcas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </Select>

      <Select label="Ciudad" htmlFor="ciudad_id" name="ciudad_id" defaultValue={ciudadId} flex>
        <option value="">Todas</option>
        {ciudades.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <button type="submit" className="orum-button">
        Filtrar
      </button>
    </form>
  )
}
