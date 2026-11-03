// Sistema de notificaciones toast
// Este archivo exporta funciones para mostrar toasts desde cualquier componente

export type ToastType = 'success' | 'error' | 'warning' | 'info'

/** Función registrada por ToastProvider para mostrar un toast. */
export type ToastFunction = (message: string, type: ToastType) => void

let toastFunction: ToastFunction | null = null

export const setToastFunction = (fn: ToastFunction | null): void => {
  toastFunction = fn
}

export const toast = {
  success: (message: string): void => {
    if (toastFunction) {
      toastFunction(message, 'success')
    }
  },
  error: (message: string): void => {
    if (toastFunction) {
      toastFunction(message, 'error')
    }
  },
  warning: (message: string): void => {
    if (toastFunction) {
      toastFunction(message, 'warning')
    }
  },
  info: (message: string): void => {
    if (toastFunction) {
      toastFunction(message, 'info')
    }
  }
}
