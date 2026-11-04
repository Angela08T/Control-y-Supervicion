import React from 'react'
import { cn } from '@/utils/classes'

/** Clases base de los controles de formulario (input, select, textarea) */
export const controlClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-content outline-none transition-colors duration-150 placeholder:text-muted hover:border-[#9fb0c8] focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted'

const controlError = 'border-danger! focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]!'

export interface FieldProps {
  label: React.ReactNode
  /** Muestra un asterisco junto a la etiqueta */
  required?: boolean
  /** Mensaje de error bajo el control */
  error?: string
  /** Ayuda corta bajo el control (se oculta si hay error) */
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Etiqueta + control + mensaje de error/ayuda. */
export function Field({ label, required, error, hint, className, children }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[13px] font-medium text-content-2">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-muted">{hint}</span>
      )}
    </label>
  )
}

interface ControlProps {
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & ControlProps>(
  ({ invalid, className, ...rest }, ref) => (
    <input ref={ref} className={cn(controlClass, invalid && controlError, className)} {...rest} />
  )
)
Input.displayName = 'Input'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & ControlProps>(
  ({ invalid, className, ...rest }, ref) => (
    <select ref={ref} className={cn(controlClass, 'cursor-pointer', invalid && controlError, className)} {...rest} />
  )
)
Select.displayName = 'Select'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps>(
  ({ invalid, className, ...rest }, ref) => (
    <textarea ref={ref} className={cn(controlClass, 'min-h-20 resize-y', invalid && controlError, className)} {...rest} />
  )
)
Textarea.displayName = 'Textarea'
