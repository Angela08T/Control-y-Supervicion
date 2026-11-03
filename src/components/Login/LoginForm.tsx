import React, { useState } from 'react'
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/types'
import useLogin from '../../hooks/Login/useLogin'
import logoSJL from '../../assets/logo-sjl.png'
import muniBackground from '../../assets/muni-background.png'
import { formGroup, formLabel } from '../../utils/classes'

const loginInput =
  'w-full rounded-[10px] border-2 border-line [background:var(--bg)] px-4 py-3 text-[14px] text-content! outline-none transition-all duration-300 ease-[ease] placeholder:text-muted focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] disabled:cursor-not-allowed disabled:opacity-60 disabled:[background:rgba(100,116,139,0.1)] dark:text-[#f8fafc]!'

export default function LoginForm() {
  const navigate = useNavigate()
  const { handleLogin, loading, error: loginError } = useLogin()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validación básica
    if (!username || !password) {
      return
    }

    // Llamar al hook de login
    const result = await handleLogin({ username, password })

    if (result.success) {
      // Redirigir según el rol
      const roleRoutes: Record<AppRole, string> = {
        admin: '/dashboard/admin',
        supervisor: '/dashboard/supervisor',
        centinela: '/dashboard/centinela',
        validator: '/dashboard/validator',
        subgerente: '/dashboard/subgerente'
      }

      navigate((result.role && roleRoutes[result.role]) || '/dashboard/admin')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={muniBackground}
          alt="Municipalidad de San Juan de Lurigancho - CECOM"
          className="size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,58,138,0.85)_0%,rgba(15,23,42,0.90)_100%)] [backdrop-filter:blur(3px)]"></div>
      </div>

      <div className="relative z-10 w-[420px] max-w-[95%] rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-surface p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] [backdrop-filter:blur(20px)] animate-[modalSlideIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)] max-[600px]:px-5 max-[600px]:py-[30px]">
        {/* Logo Municipal */}
        <div className="mb-[30px] text-center">
          <img
            src={logoSJL}
            alt="Logo Municipalidad San Juan de Lurigancho"
            className="mx-auto mt-0 mb-5 block h-20 w-[200px] object-fill [filter:drop-shadow(0_4px_15px_rgba(30,58,138,0.4))] animate-[fadeIn_0.8s_ease-out]"
          />
          <div>
            <h1 className="m-0 mb-2 text-[24px] font-extrabold tracking-[2px] text-primary! [text-shadow:0_2px_10px_rgba(30,58,138,0.3)] dark:text-[#60a5fa]! max-[600px]:text-[20px]">SISTEMA CENTINELA</h1>
            <p className="m-0 text-[13px] font-medium text-content-2 max-[600px]:text-[12px]">Control y Supervisión - CECOM SJL</p>
          </div>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Mensajes de error */}
          {loginError && (
            <div className="mb-[15px] rounded-[10px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-[13px] font-medium text-danger">
              {loginError}
            </div>
          )}

          {/* Usuario */}
          <div className={formGroup}>
            <label className={formLabel}>
              <FaUser className="text-[14px] text-primary" />
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              className={loginInput}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Contraseña */}
          <div className={formGroup}>
            <label className={formLabel}>
              <FaLock className="text-[14px] text-primary" />
              Contraseña
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                className={`${loginInput} pr-[45px]`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute right-3 flex cursor-pointer items-center justify-center rounded-[6px] border-none bg-transparent p-2 text-[16px] text-muted transition-all duration-300 ease-[ease] hover:bg-[rgba(30,58,138,0.1)] hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Botón de Ingreso */}
          <button type="submit" className="cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,var(--primary)_0%,var(--secondary)_100%)] px-6 py-3.5 text-[14px] font-bold uppercase tracking-[1px] text-white! shadow-[0_4px_15px_rgba(30,58,138,0.3)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:-translate-y-[3px] hover:shadow-[0_8px_25px_rgba(30,58,138,0.5)] active:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-none disabled:hover:shadow-[0_4px_15px_rgba(30,58,138,0.3)]" disabled={loading}>
            {loading ? 'INGRESANDO...' : 'INGRESAR AL SISTEMA'}
          </button>

        </form>
      </div>
    </div>
  )
}
