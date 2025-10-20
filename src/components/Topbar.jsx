import React, { useState, useEffect } from 'react'
import { FaSun, FaMoon, FaBell, FaSignOutAlt } from 'react-icons/fa'

export default function Topbar({ onLogout }) {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem('centinela-theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setIsDarkMode(!isDarkMode)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('centinela-theme', newTheme)
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

        {/* Toggle de tema */}
        <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

        <span className="user-name">Supervisor</span>
        <img
          src="/src/assets/user-avatar.png"
          alt="Usuario"
          className="user-avatar"
        />
        
        {/* Botón de Salir */}
        <button className="logout-btn" onClick={onLogout} title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  )
}