/**
 * Layout de la sección de miembros.
 *
 * Declara la ranura paralela `@modal`, donde Next monta las rutas
 * interceptadas. La lista de detrás no se desmonta: conserva su scroll, sus
 * filtros y su estado mientras el formulario está abierto encima.
 */
export default function MiembrosLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
