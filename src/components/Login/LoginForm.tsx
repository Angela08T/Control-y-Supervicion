import React, { useState } from 'react'
import { FiAlertCircle, FiArrowRight, FiEye, FiEyeOff, FiLoader, FiLock, FiShield, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/types'
import useLogin from '../../hooks/Login/useLogin'
import CentinelaWordmark from '@/components/UI/CentinelaWordmark'
import loboImage from '@/assets/lobo.png'
import cityBackground from '@/assets/sjl-ciudad.png'

/**
 * Franja diagonal en un lienzo de 0-100 (x e y, en % del contenedor).
 * `shift`: desplazamiento horizontal desde el borde diagonal; `width`: grosor;
 * `from`/`to`: tramo vertical que ocupa; `opacity`: intensidad.
 */
interface Stripe {
  shift: number
  width: number
  from: number
  to: number
  opacity: number
}

/** Borde diagonal del panel de la foto: x en la parte de arriba y en la de abajo */
const EDGE_TOP = 78
const EDGE_BOTTOM = 40

/** Franjas a lo largo del borde de la foto (inferior izquierda): mas fuertes abajo */
const LEFT_STRIPES: Stripe[] = [
  { shift: -7, width: 1.2, from: 52, to: 100, opacity: 0.55 },
  { shift: -1.5, width: 4, from: 22, to: 100, opacity: 0.95 },
  { shift: 4, width: 0.9, from: 38, to: 100, opacity: 0.8 },
  { shift: 6.5, width: 7, from: 50, to: 100, opacity: 0.5 },
  { shift: 15, width: 0.6, from: 64, to: 100, opacity: 0.7 },
]

/** Franjas de la esquina superior derecha: mas fuertes arriba */
const RIGHT_STRIPES: Stripe[] = [
  { shift: 0, width: 5, from: 0, to: 70, opacity: 0.85 },
  { shift: 7, width: 1, from: 0, to: 55, opacity: 0.7 },
  { shift: 10, width: 9, from: 0, to: 85, opacity: 0.4 },
  { shift: 21, width: 0.8, from: 0, to: 45, opacity: 0.6 },
]

/** Franjas paralelas a una recta que va de (top, 0) a (bottom, 100), con degradado hacia `fadeTo` */
function DiagonalStripes({
  stripes,
  top,
  bottom,
  fadeTo,
  className,
}: {
  stripes: Stripe[]
  top: number
  bottom: number
  fadeTo: 'up' | 'down'
  className: string
}) {
  const gradId = `stripe-fade-${fadeTo}`
  const edgeX = (y: number) => top + ((bottom - top) * y) / 100
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1={fadeTo === 'up' ? '1' : '0'} x2="0" y2={fadeTo === 'up' ? '0' : '1'}>
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="0.55" stopColor="#2563eb" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      {stripes.map((s, i) => {
        const a = edgeX(s.from) + s.shift
        const b = edgeX(s.to) + s.shift
        return (
          <polygon
            key={i}
            points={`${a},${s.from} ${a + s.width},${s.from} ${b + s.width},${s.to} ${b},${s.to}`}
            fill={`url(#${gradId})`}
            opacity={s.opacity}
          />
        )
      })}
    </svg>
  )
}

/** Caja de cada campo: vidrio azul translucido sobre la tarjeta, anillo azul al enfocar */
const fieldBox =
  'flex h-[50px] items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-[#60a5fa] focus-within:bg-white/15 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.3)]'

const fieldInput =
  'h-full min-w-0 flex-1 border-none bg-transparent p-0 text-[15px] text-white outline-none placeholder:text-white/70 disabled:cursor-not-allowed'

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#071233] text-white">
      {/* Fondo azul marino con un leve resplandor al centro */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_55%_50%,#0e2363_0%,#071233_70%)]" />

      {/* Panel izquierdo: foto de SJL tenida de azul, cortada en diagonal, con franjas a lo largo del corte */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[38vw] max-md:w-[75vw]">
        <div
          className="absolute inset-0 isolate"
          style={{ clipPath: `polygon(0 0, ${EDGE_TOP}% 0, ${EDGE_BOTTOM}% 100%, 0 100%)` }}
        >
          <img src={cityBackground} alt="" className="absolute inset-0 size-full object-cover object-left" />
          <div className="absolute inset-0 bg-[#1d4ed8] mix-blend-color" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,51,0.35)_0%,rgba(7,18,51,0.6)_50%,rgba(7,18,51,0.9)_80%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,51,0.5)_0%,rgba(7,18,51,0)_35%)]" />
        </div>
        <DiagonalStripes
          stripes={LEFT_STRIPES}
          top={EDGE_TOP}
          bottom={EDGE_BOTTOM}
          fadeTo="up"
          className="absolute inset-0 size-full"
        />
      </div>

      {/* Esquina superior derecha: solo franjas */}
      <DiagonalStripes
        stripes={RIGHT_STRIPES}
        top={62}
        bottom={22}
        fadeTo="down"
        className="pointer-events-none absolute top-0 right-0 h-[70vh] w-[26vw] max-md:hidden"
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="flex w-full max-w-[820px] animate-[pageIn_450ms_ease-out_both] items-center gap-10 max-md:max-w-[420px] max-md:flex-col max-md:gap-8">
          {/* Marca: lobo, nombre, lema y distrito */}
          <div className="flex flex-1 flex-col items-center text-center">
            <img
              src={loboImage}
              alt="Lobo Centinela"
              className="size-[128px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)] max-md:size-[96px]"
            />
            <CentinelaWordmark tone="dark" className="mt-3 w-[min(300px,90%)]" />
            <p className="m-0 mt-2 text-[15px] text-white/80">Control y supervisión del serenazgo</p>
            <div className="mt-5 flex w-full max-w-[340px] items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(147,197,253,0.7))]" />
              <span className="text-[14px] font-semibold tracking-[0.14em] whitespace-nowrap text-[#dbe6ff]">SAN JUAN DE LURIGANCHO</span>
              <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,rgba(147,197,253,0.7),transparent)]" />
            </div>
          </div>

          {/* Separador vertical */}
          <span aria-hidden className="h-[300px] w-px shrink-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.35),transparent)] max-md:hidden" />

          {/* Tarjeta de vidrio */}
          <div className="w-full max-w-[380px] shrink-0 rounded-[24px] border border-[#60a5fa]/30 bg-[#0f2160]/55 px-8 pt-7 pb-6 text-center shadow-[0_30px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl max-sm:px-6">
          <span className="mx-auto mb-6 flex size-[52px] items-center justify-center rounded-full bg-[#2563eb] text-[24px] text-white shadow-[0_0_24px_rgba(37,99,235,0.7)]">
            <FiShield aria-hidden />
          </span>

          <form className="flex flex-col gap-3.5 text-left" onSubmit={handleSubmit}>
            <label className={fieldBox}>
              <FiUser className="shrink-0 text-[17px] text-white/80" aria-hidden />
              <span className="sr-only">Usuario</span>
              <input
                type="text"
                placeholder="Usuario"
                autoComplete="username"
                className={fieldInput}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <label className={fieldBox}>
              <FiLock className="shrink-0 text-[17px] text-white/80" aria-hidden />
              <span className="sr-only">Contraseña</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="current-password"
                className={fieldInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="-mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent p-0 text-[17px] text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </label>

            {/* Mensaje de error bajo los campos */}
            {loginError && (
              <p role="alert" className="m-0 flex items-start gap-2 rounded-xl border border-[#f87171]/40 bg-[#7f1d1d]/40 px-4 py-3 text-sm text-[#fecaca]">
                <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
                <span>{loginError}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none bg-[#2563eb] text-[16px] font-semibold text-white shadow-[0_12px_26px_-10px_rgba(37,99,235,0.8)] transition-[transform,background-color] duration-150 hover:bg-[#1d4ed8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" aria-hidden />
                  Ingresando…
                </>
              ) : (
                <>
                  Ingresar
                  <FiArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-[12px] tracking-[0.08em] text-white/60">
            <span aria-hidden className="h-px flex-1 bg-white/15" />
            Por una SJL más segura
            <span aria-hidden className="h-px flex-1 bg-white/15" />
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}
