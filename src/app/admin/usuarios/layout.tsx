/**
 * Declara la ranura paralela `@modal`, donde Next monta las rutas
 * interceptadas. La pantalla de detrás no se desmonta: conserva su scroll y
 * su estado mientras el formulario está abierto encima.
 */
export default function SeccionLayout({
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