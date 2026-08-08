export function SearchForm({
  name,
  placeholder,
  defaultValue,
  gap = '0.75rem',
  marginBottom = '1.25rem',
}: {
  name: string
  placeholder: string
  defaultValue?: string
  gap?: string
  marginBottom?: string
}) {
  return (
    <form method="get" className="orum-card" style={{ marginBottom, display: 'flex', gap }}>
      <input type="text" name={name} className="orum-input" placeholder={placeholder} defaultValue={defaultValue} />
      <button type="submit" className="orum-button orum-button--secondary">
        Buscar
      </button>
    </form>
  )
}
