import type { ReactNode } from 'react'

export function Alert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p className={`orum-alert orum-alert--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </p>
  )
}
