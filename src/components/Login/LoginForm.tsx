import React, { useState } from 'react'
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/types'
import useLogin from '../../hooks/Login/useLogin'
import logoSJL from '../../assets/logo-sjl.png'
import muniBackground from '../../assets/muni-background.png'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1e3a8a] p-4">
      {/* Marca de agua de fondo, con baja opacidad */}
      <img
        src={muniBackground}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-center opacity-[0.12]"
      />

      <div className="relative z-10 w-full max-w-[400px] rounded-xl bg-surface p-8 shadow-[0_1px_2px_var(--shadow)] max-[600px]:p-6">
        {/* Identidad */}
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src={logoSJL}
            alt="Logo Municipalidad San Juan de Lurigancho"
            className="mb-5 block h-20 w-[200px] object-contain"
          />
          <h1 className="m-0 text-[22px] font-semibold text-primary">Sistema Centinela</h1>
          <p className="m-0 mt-1 text-[13px] text-muted">Control y supervisión · CECOM SJL</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Usuario">
            <Input
              type="text"
              placeholder="Ingrese su usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <Field label="Contraseña">
            <div className="relative flex items-center">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 flex size-7 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-muted transition-colors duration-150 hover:bg-subtle hover:text-content disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </div>
          </Field>

          {/* Mensaje de error bajo los campos */}
          {loginError && (
            <p role="alert" className="m-0 flex items-start gap-2 text-sm text-danger">
              <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
              <span>{loginError}</span>
            </p>
          )}

          <Button type="submit" className="mt-1 h-10 w-full" loading={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
