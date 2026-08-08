import Link from 'next/link'

type PageHeaderAction = {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

export function PageHeader({
  title,
  action,
  as = 'h1',
}: {
  title: string
  action?: PageHeaderAction
  as?: 'h1' | 'h2'
}) {
  const Heading = as
  const isSub = as === 'h2'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isSub ? '0.75rem' : '1.25rem',
      }}
    >
      <Heading style={{ fontSize: isSub ? '1.2rem' : '1.5rem', fontWeight: 700 }}>{title}</Heading>
      {action && (
        <Link
          href={action.href}
          className={action.variant === 'secondary' ? 'orum-button orum-button--secondary' : 'orum-button'}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
