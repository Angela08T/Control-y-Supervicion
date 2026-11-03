import React, { useEffect } from 'react'
import { FaSignOutAlt } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout as logoutAction } from '../../store/slices/authSlice'
import { clearToken } from '../../api/config'
import { logout as logoutApi } from '../../api/auth'
import logoSJL from '../../assets/logo-sjl.png'
import userAvatar from '../../assets/user-avatar.png'

export default function Topbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { username, role } = useAppSelector((state) => state.auth)

  // Forzar modo claro siempre
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('centinela-theme', 'light')
  }, [])

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout del backend para cerrar la sesión en el servidor
      await logoutApi()
    } catch (error) {
      // Continuar con el logout local aunque falle el backend
    } finally {
      // Limpiar el estado local independientemente del resultado
      clearToken() // Limpiar el token global de axios
      dispatch(logoutAction()) // Limpiar el estado de Redux
      navigate('/login')
    }
  }

  return (
    <header className="fixed top-0 left-0 z-[1000] flex h-[65px] w-full items-center justify-between px-[30px] py-0 text-white! [background-image:var(--topbar-bg)] bg-[length:200%_200%] animate-[gradientShift_10s_ease_infinite] shadow-[0_4px_20px_rgba(0,0,0,0.2)] [backdrop-filter:blur(10px)] border-b border-[rgba(255,255,255,0.1)] max-[600px]:px-2.5">
      <div className="flex items-center gap-[15px] animate-[slideInLeft_0.6s_ease-out]">
        <img
          src={logoSJL}
          alt="Logo SJL"
          className="h-[75px] w-[75px] object-contain [filter:drop-shadow(0_2px_8px_rgba(255,255,255,0.3))] transition-transform duration-[0.4s] ease-[ease] hover:rotate-[360deg] hover:scale-110"
        />
        <h1 className="m-0 text-[22px] font-extrabold tracking-[2px] text-white! [text-shadow:0_2px_10px_rgba(0,0,0,0.3)] animate-[fadeIn_0.8s_ease-out_0.2s_both] max-[600px]:text-[18px]">CENTINELA</h1>
      </div>

      <div className="flex items-center gap-[15px] animate-[slideInRight_0.6s_ease-out]">
        <span className="text-[15px] font-semibold text-white! [text-shadow:0_2px_4px_rgba(0,0,0,0.2)] max-[600px]:hidden">{username || 'Usuario'}</span>
        <img
          src={userAvatar}
          alt="Usuario"
          className="size-10 cursor-pointer rounded-full border-[3px] border-[rgba(255,255,255,0.3)] object-cover shadow-[0_4px_15px_var(--shadow)] transition-all duration-[0.4s] ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:scale-[1.15] hover:rotate-5 hover:border-[rgba(255,255,255,0.8)] hover:shadow-[0_6px_25px_var(--shadow-hover)] max-[600px]:size-8"
        />

        {/* Botón de Salir */}
        <button className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] border-2 border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] p-2.5 text-danger [backdrop-filter:blur(5px)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:scale-110 hover:-rotate-5 hover:border-danger hover:bg-[rgba(239,68,68,0.2)] hover:text-white hover:shadow-[0_4px_15px_rgba(239,68,68,0.4)]" onClick={handleLogout} title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  )
}