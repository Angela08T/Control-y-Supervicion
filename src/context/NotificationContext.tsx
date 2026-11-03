import React, { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/Toast'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, type, duration }

    setNotifications(prev => [...prev, notification])

    // Auto-remove después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, 'success', duration)
  }, [showNotification])

  const showError = useCallback((message, duration) => {
    return showNotification(message, 'error', duration)
  }, [showNotification])

  const showWarning = useCallback((message, duration) => {
    return showNotification(message, 'warning', duration)
  }, [showNotification])

  const showInfo = useCallback((message, duration) => {
    return showNotification(message, 'info', duration)
  }, [showNotification])

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        {notifications.map(notification => (
          <Toast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
