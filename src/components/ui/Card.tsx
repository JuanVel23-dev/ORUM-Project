import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="orum-card">{children}</div>
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="orum-card-grid">{children}</div>
}
