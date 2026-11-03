import { useState } from 'react'

export default function useNotification() {
  const [successModal, setSuccessModal] = useState({
    show: false,
    message: ''
  })

  const [errorModal, setErrorModal] = useState({
    show: false,
    message: ''
  })

  const showSuccess = (message) => {
    setSuccessModal({
      show: true,
      message: message || 'Operación realizada correctamente'
    })
  }

  const showError = (message) => {
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
