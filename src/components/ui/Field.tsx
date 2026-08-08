import type { ReactNode } from 'react'

export function Field({
  label,
  htmlFor,
  children,
  flex,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  flex?: boolean
}) {
  return (
    <div className="orum-field" style={{ flex: flex ? 1 : undefined }}>
      <label className="orum-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}
