import type { ReactNode, SelectHTMLAttributes } from 'react'

export function Select({
  label,
  htmlFor,
  children,
  flex,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
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
      <select id={htmlFor} className="orum-select" {...props}>
        {children}
      </select>
    </div>
  )
}
