import React, { useEffect } from 'react'
import { FaSignOutAlt } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { clearToken } from '../../api/config'
import { logout as logoutApi } from '../../api/auth'
import logoSJL from '../../assets/logo-sjl.png'
import userAvatar from '../../assets/user-avatar.png'

export default function Topbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { username, role } = useSelector((state) => state.auth)

  // Forzar modo claro siempre
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

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img
          src={logoSJL}
          alt="Logo SJL"
          className="logo-sjl"
        />
        <h1 className="topbar-title">CENTINELA</h1>
      </div>

      <div className="topbar-right">
        <span className="user-name">{username || 'Usuario'}</span>
        <img
          src={userAvatar}
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