import { io } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL

let socket = null

/**
 * Inicializar conexión WebSocket
 * @returns {Socket} - Instancia del socket
 */
export const initSocket = () => {
  if (socket && socket.connected) {
    return socket
  }

  if (!WS_URL) {
    return null
  }

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
  })

  return socket
}

/**
 * Obtener la instancia del socket actual
 * @returns {Socket|null} - Instancia del socket o null si no está conectado
 */
export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

/**
 * Desconectar el WebSocket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Suscribirse al evento de cambio de estado de reporte
 * @param {Function} callback - Función a ejecutar cuando cambie el estado
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onReportStatusChanged = (callback) => {
  const socketInstance = getSocket()
  if (!socketInstance) return () => {}

  const handler = (data) => {
    callback(data)
  }

  socketInstance.on('report_status_changed', handler)

  return () => {
    socketInstance.off('report_status_changed', handler)
  }
}

/**
 * Suscribirse al evento de validación de estado de reporte (APPROVED/REJECTED)
 * @param {Function} callback - Función a ejecutar cuando se valide el estado
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onReportStatusValidate = (callback) => {
  const socketInstance = getSocket()
  if (!socketInstance) return () => {}

  const handler = (data) => {
    callback(data)
  }

  socketInstance.on('report_status_validate', handler)

  return () => {
    socketInstance.off('report_status_validate', handler)
  }
}

/**
 * Emitir un evento al servidor
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
export const emitEvent = (event, data) => {
  const socketInstance = getSocket()
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit(event, data)
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  onReportStatusChanged,
  onReportStatusValidate,
  emitEvent
}
