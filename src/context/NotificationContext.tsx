import React, { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/Toast'

/** Tipos de notificación disponibles. */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/** Notificación activa en pantalla. */
export interface NotificationItem {
  id: number
  message: string
  type: NotificationType
  duration: number
}

/** Valor expuesto por NotificationContext. */
export interface NotificationContextValue {
  showNotification: (message: string, type?: NotificationType, duration?: number) => number
  showSuccess: (message: string, duration?: number) => number
  showError: (message: string, duration?: number) => number
  showWarning: (message: string, duration?: number) => number
  showInfo: (message: string, duration?: number) => number
  removeNotification: (id: number) => void
}

export interface NotificationProviderProps {
  children: React.ReactNode
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = useCallback((message: string, type: NotificationType = 'success', duration: number = 4000): number => {
    const id = Date.now() + Math.random()
    const notification: NotificationItem = { id, message, type, duration }

    setNotifications(prev => [...prev, notification])

    // Auto-remove después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: number): void => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number): number => {
    return showNotification(message, 'success', duration)
  }, [showNotification])

  const showError = useCallback((message: string, duration?: number): number => {
    return showNotification(message, 'error', duration)
  }, [showNotification])

  const showWarning = useCallback((message: string, duration?: number): number => {
    return showNotification(message, 'warning', duration)
  }, [showNotification])

  const showInfo = useCallback((message: string, duration?: number): number => {
    return showNotification(message, 'info', duration)
  }, [showNotification])

  const value: NotificationContextValue = {
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
      <div className="pointer-events-none fixed right-5 top-5 z-[99999] flex w-full max-w-[400px] flex-col gap-3">
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
