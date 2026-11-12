import React, { useEffect, useState } from 'react'
import { FiClock, FiLogOut, FiMenu, FiMinus, FiMoon, FiPlus, FiSun } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { cn } from '@/utils/classes'
import { useNow } from '@/hooks/useNow'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { clearToken } from '../../api/config'
import { logout as logoutApi } from '../../api/auth'
import BrandMark from './BrandMark'

const THEME_KEY = 'centinela-theme'
type Theme = 'light' | 'dark'

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export interface TopbarProps {
  /** Abre el menu lateral en pantallas pequenas */
  onMenuClick?: () => void
  /** Menu lateral contraido: la barra empieza donde termina el menu */
  collapsed?: boolean
  /** Zoom actual del contenido (1 = 100%) */
  zoom?: number
  /** Sin funcion: el boton queda deshabilitado (se llego al limite) */
  onZoomOut?: () => void
  onZoomIn?: () => void
  onZoomReset?: () => void
}

/** Boton redondo de la pastilla de controles */
const ctrlBtn =
  'flex size-10 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-[18px] text-white/90 transition-colors duration-150 hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

export default function Topbar({ onMenuClick, collapsed = false, zoom = 1, onZoomOut, onZoomIn, onZoomReset }: TopbarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const now = useNow()
  const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  const fecha = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

  // Tema claro / oscuro: se guarda y se aplica en <html data-theme>
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // sin persistencia
    }
  }, [theme])

  // Evita doble clic mientras se cierra la sesion
  const [saliendo, setSaliendo] = useState(false)

  const handleLogout = async () => {
    if (saliendo) return
    setSaliendo(true)
    try {
      // Cierra la sesión en el servidor
      await logoutApi()
    } catch {
      // Continuar con el logout local aunque falle el backend
    } finally {
      clearToken() // Limpiar el token global de axios
      dispatch(logoutAction()) // Limpiar el estado de Redux
      navigate('/login')
    }
  }

  const zoomPct = `${Math.round(zoom * 100)}%`

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-[1600] flex h-16 items-center gap-3 overflow-hidden border-b border-[#d3dceb]/70 bg-white/70 px-6 backdrop-blur-md transition-[left] duration-200 max-md:left-0 max-md:px-3 dark:border-white/[0.06] dark:bg-[#0d1730]/85',
        collapsed ? 'md:left-16' : 'md:left-[232px]'
      )}
    >
      {/* Onda azul decorativa a la derecha, detras de los controles */}
      <svg
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full w-[46%] max-md:hidden"
        viewBox="0 0 600 64"
        preserveAspectRatio="none"
      >
        <path d="M120 0 C 210 10 230 64 330 64 H600 V0Z" fill="#14296b" />
        <path d="M60 0 C 150 6 190 46 260 64 H330 C 230 64 210 10 120 0Z" fill="#1e3a8a" opacity="0.55" />
        <path d="M0 0 C 90 4 140 34 200 64 H260 C 190 46 150 6 60 0Z" fill="#3b6fd8" opacity="0.18" />
      </svg>

      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="relative flex size-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-xl text-content-2 transition-colors duration-150 hover:bg-subtle md:hidden"
        >
          <FiMenu />
        </button>
      )}
      <BrandMark tone="light" className="relative md:hidden" />

      {/* Hora y fecha: dan contexto de turno al centro de control */}
      <div className="relative flex items-center gap-3 max-md:hidden">
        <FiClock className="size-[22px] text-ink dark:text-content" aria-hidden />
        <span className="text-[19px] font-bold tabular-nums text-ink dark:text-content">{hora}</span>
        <span aria-hidden className="h-5 w-px bg-line-strong" />
        <span className="text-sm font-medium text-content-2 first-letter:uppercase">{fecha}</span>
      </div>

      <div className="relative ml-auto flex items-center gap-2.5">
        {/* Pastilla de controles: tema y tamano del contenido */}
        <div className="flex items-center gap-0.5 rounded-full bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur-sm max-md:bg-primary max-sm:hidden">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            className={ctrlBtn}
          >
            {theme === 'dark' ? <FiMoon /> : <FiSun />}
          </button>
          <button type="button" onClick={onZoomOut} disabled={!onZoomOut} aria-label="Reducir tamaño" title={`Reducir tamaño (${zoomPct})`} className={ctrlBtn}>
            <FiMinus />
          </button>
          <button type="button" onClick={onZoomIn} disabled={!onZoomIn} aria-label="Aumentar tamaño" title={`Aumentar tamaño (${zoomPct})`} className={ctrlBtn}>
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            disabled={zoom === 1}
            title="Volver al tamaño normal"
            className="ml-1 h-10 cursor-pointer rounded-full border-none bg-[#2a4ea8] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3360c4] disabled:cursor-default disabled:opacity-70 disabled:hover:bg-[#2a4ea8]"
          >
            Restablecer
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={saliendo}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="group flex h-11 cursor-pointer items-center gap-2 rounded-full border-none bg-[linear-gradient(135deg,#b3121f,#d32f3a)] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(199,21,34,0.8)] transition-[filter,box-shadow] duration-150 hover:brightness-110 disabled:cursor-wait disabled:opacity-60 max-sm:px-3.5"
        >
          <FiLogOut className="size-[17px] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          <span className="max-sm:hidden">{saliendo ? 'Saliendo…' : 'Salir'}</span>
        </button>
      </div>
    </header>
  )
}
