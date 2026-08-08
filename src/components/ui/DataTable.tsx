import type { ReactNode } from 'react'

export function DataTable({
  children,
  marginBottom,
}: {
  children: ReactNode
  marginBottom?: string
}) {
  return (
    <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom }}>
      <table className="orum-table">{children}</table>
    </div>
  )
}
