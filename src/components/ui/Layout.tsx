import type { CSSProperties, ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  gap?: string
  style?: CSSProperties
}

export function Row({ children, gap = '0.75rem', style }: LayoutProps) {
  return <div style={{ display: 'flex', gap, ...style }}>{children}</div>
}

export function Stack({ children, gap = '0.75rem', style }: LayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {children}
    </div>
  )
}
