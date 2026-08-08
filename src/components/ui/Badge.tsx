import type { ReactNode } from 'react'

export function Badge({ tone, children }: { tone: 'on' | 'off'; children: ReactNode }) {
  return <span className={`orum-badge orum-badge--${tone}`}>{children}</span>
}
