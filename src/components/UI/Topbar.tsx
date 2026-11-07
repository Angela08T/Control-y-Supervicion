import React from 'react'
import { FiLogOut, FiMenu } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { cn } from '@/utils/classes'
import { useNow } from '@/hooks/useNow'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { clearToken } from '../../api/config'
import { logout as logoutApi } from '../../api/auth'
import userAvatar from '../../assets/user-avatar.png'
import BrandMark from './BrandMark'

const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  centinela: 'Centinela',
  validator: 'Validador',
  subgerente: 'Subgerente',
}

export interface TopbarProps {
  /** Abre el menu lateral en pantallas pequenas */
  onMenuClick?: () => void
  /** Menu lateral contraido: el bloque de marca se achica al mismo ancho */
  collapsed?: boolean
}

export default function Topbar({ onMenuClick, collapsed = false }: TopbarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { username, role, nombre, apellido } = useAppSelector((state) => state.auth)

  const displayName = [nombre, apellido].filter(Boolean).join(' ') || username || 'Usuario'

  const now = useNow()
  const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  const fecha = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleLogout = async () => {
    try {
      // Cierra la sesión en el servidor
      await logoutApi()
    } catch (error) {
      // Continuar con el logout local aunque falle el backend
    } finally {
      clearToken() // Limpiar el token global de axios
      dispatch(logoutAction()) // Limpiar el estado de Redux
      navigate('/login')
    }
  }

  return (
    <header className="fixed top-0 left-0 z-[1600] flex h-14 w-full border-b border-line bg-surface">
      {/* Bloque de marca: tiene el mismo ancho que el menu y comparte su borde */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 px-3 transition-[width] duration-200 md:border-r md:border-line',
          collapsed ? 'md:w-16 md:justify-center md:px-0' : 'md:w-[232px] md:px-4'
        )}
      >
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-xl text-content-2 transition-colors duration-150 hover:bg-subtle md:hidden"
          >
            <FiMenu />
          </button>
        )}
        <BrandMark tone="light" className="md:hidden" />
        <BrandMark compact={collapsed} tone="light" className="max-md:hidden" />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 px-5 max-md:px-3">
        {/* Hora y fecha: dan contexto de turno al centro de control */}
        <div className="flex items-center gap-3 max-md:hidden">
          <span className="text-[15px] font-semibold tabular-nums text-content">{hora}</span>
          <span aria-hidden className="h-4 w-px bg-line-strong" />
          <span className="text-[13px] text-muted first-letter:uppercase">{fecha}</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <img src={userAvatar} alt="" className="size-8 rounded-full border border-line object-cover" />
          <div className="flex flex-col leading-tight max-sm:hidden">
            <span className="text-[13px] font-semibold text-content">{displayName}</span>
            {role && <span className="text-xs text-muted">{ROLE_LABEL[role]}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium text-content-2 transition-colors duration-150 hover:bg-subtle hover:text-content"
        >
          <FiLogOut aria-hidden />
          <span className="max-sm:hidden">Salir</span>
        </button>
      </div>
    </header>
  )
}
