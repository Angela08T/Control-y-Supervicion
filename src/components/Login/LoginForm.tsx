import React, { useState } from 'react'
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/types'
import useLogin from '../../hooks/Login/useLogin'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import ContourMap from '@/components/UI/ContourMap'
import BrandMark from '@/components/UI/BrandMark'
import RadarMotif from '@/components/UI/RadarMotif'

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
        subgerente: '/dashboard/subgerente',
        custom: '/dashboard/custom'
      }

      navigate((result.role && roleRoutes[result.role]) || '/dashboard/admin')
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] max-lg:grid-cols-1">
      {/* Panel azul: fondo cartografico en movimiento, con el radar y el lobo al centro */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_50%_46%,#24419b_0%,#14297a_55%,#0c1a4b_100%)] p-10 max-lg:hidden">
        <ContourMap tone="dark" />
        <div className="relative z-10">
          <BrandMark tone="dark" />
        </div>

        <RadarMotif wolf className="relative mx-auto w-[min(480px,84%)]" />

        <div className="relative z-10 max-w-[470px] text-white">
          <h2 className="m-0 text-[30px] leading-[1.2] font-semibold tracking-[-0.01em] text-balance">
            Control y supervisión del serenazgo
          </h2>
          <p className="m-0 mt-3 text-[15px] leading-relaxed text-pretty text-white/70">
            Incidencias, inasistencias y dispositivos del personal en campo, en un solo lugar.
          </p>
        </div>
      </aside>

      {/* Formulario */}
      <main className="relative flex flex-col overflow-hidden bg-surface">
        <ContourMap tone="light" align="xMaxYMid" />
        <div className="relative hidden items-center bg-primary px-5 py-3 max-lg:flex">
          <BrandMark tone="dark" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-10 py-10 max-sm:px-6">
          <div className="mx-auto w-full max-w-[380px] animate-[pageIn_450ms_ease-out_both]">
            <h1 className="m-0 text-[28px] leading-tight font-semibold tracking-[-0.01em] text-primary">
              Iniciar sesión
            </h1>
            <p className="m-0 mt-2.5 mb-7 text-[14px] text-muted">Ingresa con tu usuario del sistema Centinela.</p>

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

              <Button type="submit" className="mt-2 h-11 w-full text-[15px]" loading={loading}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </form>
          </div>
        </div>

        <p className="m-0 px-10 pb-6 text-center text-xs text-muted max-sm:px-6">
          CECOM · Municipalidad de San Juan de Lurigancho
        </p>
      </main>
    </div>
  )
}
