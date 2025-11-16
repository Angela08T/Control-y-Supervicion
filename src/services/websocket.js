import { io } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3021'

let socket = null

/**
 * Inicializar conexión WebSocket
 * @returns {Socket} - Instancia del socket
 */
export const initSocket = () => {
  if (socket && socket.connected) {
    console.log('🔌 WebSocket ya está conectado')
    return socket
  }

  console.log('🔌 Conectando WebSocket a:', WS_URL)

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
  })

  socket.on('connect', () => {
    console.log('✅ WebSocket conectado - ID:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket desconectado:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('🔴 Error de conexión WebSocket:', error.message)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 WebSocket reconectado después de', attemptNumber, 'intentos')
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 Intento de reconexión #', attemptNumber)
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
    console.log('🔌 Desconectando WebSocket...')
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

  const handler = (data) => {
    console.log('📨 Evento report_status_changed recibido:', data)
    callback(data)
  }

  socketInstance.on('report_status_changed', handler)
  console.log('👂 Escuchando evento: report_status_changed')

  // Retornar función para cancelar suscripción
  return () => {
    socketInstance.off('report_status_changed', handler)
    console.log('🔇 Dejando de escuchar: report_status_changed')
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
    console.log('📤 Emitiendo evento:', event, data)
    socketInstance.emit(event, data)
  } else {
    console.error('❌ No se puede emitir evento, WebSocket no conectado')
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  onReportStatusChanged,
  emitEvent
}
