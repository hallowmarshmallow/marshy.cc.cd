import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', loading = false, disabled, className, children, ...rest }: ButtonProps) {
  const cls = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ')
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
