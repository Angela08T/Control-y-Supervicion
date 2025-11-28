// Sistema de notificaciones toast
// Este archivo exporta funciones para mostrar toasts desde cualquier componente

let toastFunction = null

export const setToastFunction = (fn) => {
  toastFunction = fn
}

export const toast = {
  success: (message) => {
    if (toastFunction) {
      toastFunction(message, 'success')
    }
  },
  error: (message) => {
    if (toastFunction) {
      toastFunction(message, 'error')
    }
  },
  warning: (message) => {
    if (toastFunction) {
      toastFunction(message, 'warning')
    }
  },
  info: (message) => {
    if (toastFunction) {
      toastFunction(message, 'info')
    }
  }
}
