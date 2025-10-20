import React, { useState } from 'react'
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSync } from 'react-icons/fa'

export default function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const [userInput, setUserInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  
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
    
    // Simular validación (siempre permite acceso por ahora)
    if (attempts >= 2) {
      // Verificar CAPTCHA si hay muchos intentos
      if (userInput !== captchaCode) {
        alert('Código CAPTCHA incorrecto')
        generateCaptcha()
        setUserInput('')
        return
      }
    }
    
    // Acceso permitido (sin validación real hasta tener backend)
    onLogin()
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
                onFocus={handlePasswordFocus}
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
            <p>Modo desarrollo</p>
            
          </div>
        </form>
      </div>
    </div>
  )
}