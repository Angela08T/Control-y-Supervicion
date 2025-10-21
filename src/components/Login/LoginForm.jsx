import React, { useState } from 'react'
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSync } from 'react-icons/fa'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../../store/slices/authSlice'

// Usuarios de prueba (MODO DESARROLLO)
const DEMO_USERS = {
  admin: { password: 'admin123', role: 'admin', id: 1, username: 'admin' },
  supervisor: { password: 'super123', role: 'supervisor', id: 2, username: 'supervisor' },
  centinela: { password: 'cent123', role: 'centinela', id: 3, username: 'centinela' },
}

export default function LoginForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  
  // Generar código CAPTCHA simple
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaCode(result)
    return result
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Verificar CAPTCHA si hay muchos intentos
    if (attempts >= 2) {
      if (userInput !== captchaCode) {
        setError('Código CAPTCHA incorrecto')
        generateCaptcha()
        setUserInput('')
        return
      }
    }

    // Validar credenciales (MODO DESARROLLO)
    const user = DEMO_USERS[username.toLowerCase()]

    if (!user || user.password !== password) {
      setError('Usuario o contraseña incorrectos')
      setAttempts(prev => prev + 1)

      if (attempts >= 1) {
        setShowCaptcha(true)
        generateCaptcha()
      }
      return
    }

    // Login exitoso - Guardar en Redux
    const token = `demo-token-${Date.now()}` // Token simulado
    dispatch(login({
      token,
      id: user.id,
      username: user.username,
      role: user.role,
    }))

    // Redirigir según el rol
    const roleRoutes = {
      admin: '/dashboard/admin',
      supervisor: '/dashboard/supervisor',
      centinela: '/dashboard/centinela',
    }

    navigate(roleRoutes[user.role] || '/login')
  }

  const handlePasswordFocus = () => {
    if (attempts === 1) {
      setShowCaptcha(true)
      generateCaptcha()
    }
    setAttempts(prev => prev + 1)
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
          {error && (
            <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
              {error}
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
                onFocus={handlePasswordFocus}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* CAPTCHA (solo aparece después de intentos fallidos) */}
          {showCaptcha && (
            <div className="captcha-section">
              <label>Código de Verificación</label>
              <div className="captcha-container">
                <div className="captcha-code">
                  {captchaCode}
                </div>
                <button 
                  type="button"
                  className="captcha-refresh"
                  onClick={generateCaptcha}
                >
                  <FaSync />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Ingrese el código mostrado"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="login-input"
              />
            </div>
          )}

          {/* Botón de Ingreso */}
          <button type="submit" className="login-btn">
            INGRESAR AL SISTEMA
          </button>

          {/* Mensaje informativo (sin backend) */}
          <div className="login-info">
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>MODO DESARROLLO - Usuarios de prueba:</p>
            <p>Admin: admin / admin123</p>
            <p>Supervisor: supervisor / super123</p>
            <p>Centinela: centinela / cent123</p>
          </div>
        </form>
      </div>
    </div>
  )
}