import React from 'react'
import { useAppSelector } from '../../../store/hooks'
import loboImage from '../../../assets/lobo.png'

export interface WelcomeCardProps {
  message: string
}

export default function WelcomeCard({ message }: WelcomeCardProps) {
  const { username } = useAppSelector((state) => state.auth)

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-transparent! p-[30px] shadow-[0_8px_30px_rgba(14,165,233,0.15)] [backdrop-filter:blur(10px)] dark:shadow-[0_8px_30px_rgba(59,130,246,0.25)]">
      <div className="relative z-2 flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-1 text-[22px] font-bold text-[#0c4a6e] [text-shadow:0_1px_2px_rgba(255,255,255,0.5)] dark:text-white dark:[text-shadow:0_2px_4px_rgba(0,0,0,0.3)]">Bienvenido a Control y Supervisión,</p>
          <h2 className="m-0 mb-2 text-[52px] font-extrabold text-[#075985] [text-shadow:0_1px_3px_rgba(255,255,255,0.5)] dark:text-white dark:[text-shadow:0_2px_6px_rgba(0,0,0,0.4)]">{username || 'Usuario'}</h2>
          <p className="mb-5 max-w-[320px] text-[20px] font-semibold leading-[1.5] text-[#0c4a6e] [text-shadow:0_1px_2px_rgba(255,255,255,0.5)] dark:text-white dark:[text-shadow:0_2px_4px_rgba(0,0,0,0.3)]">{message}</p>
        </div>

        <div className="relative -ml-[60px] flex h-[350px] w-[350px] items-center justify-center">
          <img
            src={loboImage}
            alt="Lobo Centinela"
            className="h-full w-full object-contain [filter:drop-shadow(0_4px_20px_rgba(0,0,0,0.2))] [transition:all_0.3s_ease]! hover:[transform:scale(1.05)] dark:[filter:brightness(1.2)_saturate(1.1)_drop-shadow(0_4px_20px_rgba(0,0,0,0.5))_contrast(1.15)]"
          />
        </div>
      </div>
    </div>
  )
}
