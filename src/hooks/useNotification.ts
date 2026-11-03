import { useState } from 'react'

/** Estado de un modal de notificación */
export interface NotificationModalState {
  show: boolean
  message: string
}

export interface UseNotificationResult {
  successModal: NotificationModalState
  errorModal: NotificationModalState
  showSuccess: (message?: string) => void
  showError: (message?: string) => void
  closeSuccess: () => void
  closeError: () => void
}

export default function useNotification(): UseNotificationResult {
  const [successModal, setSuccessModal] = useState<NotificationModalState>({
    show: false,
    message: ''
  })

  const [errorModal, setErrorModal] = useState<NotificationModalState>({
    show: false,
    message: ''
  })

  const showSuccess = (message?: string) => {
    setSuccessModal({
      show: true,
      message: message || 'Operación realizada correctamente'
    })
  }

  const showError = (message?: string) => {
    setErrorModal({
      show: true,
      message: message || 'Ha ocurrido un error'
    })
  }

  const closeSuccess = () => {
    setSuccessModal({ show: false, message: '' })
  }

  const closeError = () => {
    setErrorModal({ show: false, message: '' })
  }

  return {
    successModal,
    errorModal,
    showSuccess,
    showError,
    closeSuccess,
    closeError
  }
}
