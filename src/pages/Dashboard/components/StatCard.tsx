import React from 'react'
import { cn } from '../../../utils/classes'

export interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  change?: string
  icon: React.ReactNode
  color: string
  onIconClick?: () => void
}

export default function StatCard({ title, value, subtitle, change, icon, color, onIconClick }: StatCardProps) {
  const isPositive = change?.startsWith('+')

  return (
    <div className="rounded-[16px] border border-line bg-transparent! p-6 shadow-[0_4px_20px_var(--shadow)] [backdrop-filter:blur(10px)] [transition:transform_0.3s_ease,box-shadow_0.3s_ease] hover:[transform:translateY(-4px)] hover:shadow-[0_8px_30px_var(--shadow-hover)]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-2 text-[15px] font-medium uppercase tracking-[0.5px] text-content-2!">{title}</p>
          <h3 className="m-0 flex items-baseline gap-3 text-[36px] font-bold text-content! dark:text-[#f8fafc]!">
            {value}
            {change && (
              <span className={cn(
                'rounded-[6px] px-2 py-1 text-[14px] font-semibold',
                isPositive ? 'bg-[rgba(16,185,129,0.1)] text-success' : 'bg-[rgba(239,68,68,0.1)] text-danger'
              )}>
                {change}
              </span>
            )}
          </h3>
          {subtitle && <p className="mt-1 text-[12px] text-content-2">{subtitle}</p>}
        </div>

        <div
          className="flex size-14 cursor-pointer items-center justify-center rounded-[12px] text-[24px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] [transition:transform_0.2s_ease] hover:[transform:scale(1.1)]"
          style={{ background: color }}
          onClick={onIconClick}
          role={onIconClick ? "button" : undefined}
          tabIndex={onIconClick ? 0 : undefined}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
