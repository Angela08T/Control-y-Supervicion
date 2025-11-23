import React, { useEffect } from 'react'
import { FaSun, FaMoon, FaBell, FaSignOutAlt } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { clearToken } from '../../api/config'
import { logout as logoutApi } from '../../api/auth'

export default function Topbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { username, role } = useSelector((state) => state.auth)

  // Forzar modo claro siempre (modo oscuro deshabilitado temporalmente)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('centinela-theme', 'light')
  }, [])

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout del backend para cerrar la sesión en el servidor
      await logoutApi()
    } catch (error) {
      // Continuar con el logout local aunque falle el backend
    } finally {
      // Limpiar el estado local independientemente del resultado
      clearToken() // Limpiar el token global de axios
      dispatch(logoutAction()) // Limpiar el estado de Redux
      navigate('/login')
    }
  }

  // Función deshabilitada - para reactivar más adelante
  const toggleTheme = () => {
    // Deshabilitado temporalmente
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img
          src="/src/assets/logo-sjl.png"
          alt="Logo SJL"
          className="logo-sjl"
        />
        <h1 className="topbar-title">CENTINELA</h1>
      </div>

      <div className="topbar-right">
        {/* Notificaciones */}
        <div className="notification-bell">
          <FaBell className="bell-icon" />
          <span className="notification-badge">3</span>
        </div>

        {/* Toggle de tema - Deshabilitado temporalmente */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title="Cambio de tema deshabilitado temporalmente"
          style={{ opacity: 0.5, cursor: 'not-allowed' }}
        >
          <FaSun />
        </button>

        <span className="user-name">{username || 'Usuario'}</span>
        <img
          src="/src/assets/user-avatar.png"
          alt="Usuario"
          className="user-avatar"
        />

        {/* Botón de Salir */}
        <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  )
}