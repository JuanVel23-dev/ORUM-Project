import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

function variantClass(variant: Variant) {
  return variant === 'primary' ? 'orum-button' : `orum-button orum-button--${variant}`
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={[variantClass(variant), className].filter(Boolean).join(' ')} {...props} />
}

export function LinkButton({
  variant = 'primary',
  className,
  ...props
}: LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { variant?: Variant }) {
  return <Link className={[variantClass(variant), className].filter(Boolean).join(' ')} {...props} />
}
