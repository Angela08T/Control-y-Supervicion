import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import Toast from './Toast'
import { setToastFunction, type ToastType } from '../utils/toast'

export interface ToastProviderProps {
  children: React.ReactNode
}

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  // Exportar la función showToast para uso global
  useEffect(() => {
    setToastFunction(showToast)
  }, [showToast])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[999999] flex max-w-[500px] flex-col gap-4 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
