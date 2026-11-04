import React from 'react'
import { FiLogOut, FiMenu } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '@/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { clearToken } from '../../api/config'
import { logout as logoutApi } from '../../api/auth'
import logoSJL from '../../assets/logo-sjl.png'
import userAvatar from '../../assets/user-avatar.png'

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
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { username, role, nombre, apellido } = useAppSelector((state) => state.auth)

  const displayName = [nombre, apellido].filter(Boolean).join(' ') || username || 'Usuario'

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
    <header className="fixed top-0 left-0 z-[1600] flex h-14 w-full items-center justify-between bg-[var(--topbar-bg)] px-4 text-white max-md:px-3">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-xl text-white transition-colors duration-150 hover:bg-white/10 md:hidden"
          >
            <FiMenu />
          </button>
        )}
        <img src={logoSJL} alt="San Juan de Lurigancho" className="h-9 w-auto object-contain" />
        <span className="h-5 w-px bg-white/25 max-sm:hidden" aria-hidden />
        <h1 className="m-0 text-[15px] font-semibold tracking-wide text-white max-sm:hidden">Sistema Centinela</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img src={userAvatar} alt="" className="size-8 rounded-full border border-white/30 object-cover" />
          <div className="flex flex-col leading-tight max-sm:hidden">
            <span className="text-[13px] font-medium text-white">{displayName}</span>
            {role && <span className="text-xs text-white/70">{ROLE_LABEL[role]}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/25 bg-transparent px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-white/10"
        >
          <FiLogOut aria-hidden />
          <span className="max-sm:hidden">Salir</span>
        </button>
      </div>
    </header>
  )
}
