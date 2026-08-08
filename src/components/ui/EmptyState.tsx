import type { ReactNode } from 'react'

export function EmptyState({
  children,
  marginBottom,
}: {
  children: ReactNode
  marginBottom?: string
}) {
  return (
    <div className="orum-card" style={{ marginBottom }}>
      <p className="orum-muted">{children}</p>
    </div>
  )
}
