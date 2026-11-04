import React from 'react'
import { FiLoader } from 'react-icons/fi'
import { cn } from '@/utils/classes'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icono a la izquierda del texto */
  icon?: React.ReactNode
  /** Muestra un spinner y deshabilita el boton */
  loading?: boolean
}

const base =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-btn hover:bg-primary-hover',
  secondary: 'border-line-strong bg-surface text-content-2 hover:bg-subtle hover:text-content',
  ghost: 'border-transparent bg-transparent text-content-2 hover:bg-subtle hover:text-content',
  danger: 'border-transparent bg-danger text-btn hover:bg-[#dc2626]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <FiLoader className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}
