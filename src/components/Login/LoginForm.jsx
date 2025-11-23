import React, { useState } from 'react'
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import useLogin from '../../hooks/Login/useLogin'

export default function LoginForm() {
  const navigate = useNavigate()
  const { handleLogin, loading, error: loginError } = useLogin()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación básica
    if (!username || !password) {
      return
    }

    // Llamar al hook de login
    const result = await handleLogin({ username, password })

    if (result.success) {
      // Redirigir según el rol
      const roleRoutes = {
        admin: '/dashboard/admin',
        supervisor: '/dashboard/supervisor',
        centinela: '/dashboard/centinela',
        validator: '/dashboard/validator'
      }

      navigate(roleRoutes[result.role] || '/dashboard/admin')
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <img 
          src="/src/assets/muni-background.png" 
          alt="Municipalidad de San Juan de Lurigancho - CECOM" 
          className="background-image"
        />
        <div className="background-overlay"></div>
      </div>
      
      <div className="login-card">
        {/* Logo Municipal */}
        <div className="login-header">
          <img 
            src="/src/assets/logo-sjl.png" 
            alt="Logo Municipalidad San Juan de Lurigancho" 
            className="login-logo"
          />
          <div className="login-title">
            <h1>SISTEMA CENTINELA</h1>
            <p>Control y Supervisión - CECOM SJL</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Mensajes de error */}
          {loginError && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              borderRadius: '10px',
              marginBottom: '15px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {loginError}
            </div>
          )}

          {/* Usuario */}
          <div className="form-group">
            <label>
              <FaUser className="input-icon" />
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label>
              <FaLock className="input-icon" />
              Contraseña
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Botón de Ingreso */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'INGRESANDO...' : 'INGRESAR AL SISTEMA'}
          </button>

        </form>
      </div>
    </div>
  )
}