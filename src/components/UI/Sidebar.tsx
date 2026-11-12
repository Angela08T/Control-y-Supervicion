import React from 'react'
import { NavLink } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiChevronsLeft,
  FiChevronsRight,
  FiClipboard,
  FiFileText,
  FiHome,
  FiKey,
  FiShield,
  FiUser,
  FiUserMinus,
  FiUserX,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import { useAppSelector } from '@/store/hooks'
import { cn } from '@/utils/classes'
import { formatearRestante, getTurno } from '@/utils/turno'
import { useNow } from '@/hooks/useNow'
import { NAV_GROUPS, canSee, type NavKey } from '@/utils/navigation'

interface NavItem {
  label: string
  icon: IconType
}

/** Texto e ícono de cada opción; el permiso que la habilita está en utils/navigation.ts */
const ITEMS: Record<NavKey, NavItem> = {
  dashboard: { label: 'Inicio', icon: FiHome },
  incidencias: { label: 'Incidencias', icon: FiFileText },
  inasistencias: { label: 'Inasistencias', icon: FiUserMinus },
  bodycam: { label: 'Dispositivos', icon: FiVideo },
  estadisticas: { label: 'Estadísticas', icon: FiBarChart2 },
  personal: { label: 'Personal', icon: FiUser },
  cargos: { label: 'Cargos', icon: FiBriefcase },
  infractores: { label: 'Infractores', icon: FiUserX },
  asuntos: { label: 'Asuntos', icon: FiClipboard },
  faltas: { label: 'Faltas', icon: FiAlertTriangle },
  usuarios: { label: 'Usuarios', icon: FiUsers },
  roles: { label: 'Roles y permisos', icon: FiKey },
  auditoria: { label: 'Auditoría', icon: FiShield },
}

const linkBase =
  'nav-in group relative flex h-12 items-center gap-3 rounded-xl px-2 text-[14.5px] font-medium no-underline transition-[background-color,color,box-shadow] duration-150'
const linkIdle = 'text-white/85 hover:bg-white/8 hover:text-white'
const linkActive =
  'bg-[linear-gradient(90deg,#2f62d8,#3b74ee)] text-[16px] font-semibold text-white shadow-[0_10px_22px_-10px_rgba(37,99,235,0.9)] ring-1 ring-white/15'
/** Cuadro del icono: blanco en la opcion activa, translucido en las demas */
const tileBase = 'flex size-9 shrink-0 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-200'
const tileIdle = 'bg-white/10 text-white/90 group-hover:scale-105 group-hover:bg-white/16 group-hover:text-white'
const tileActive = 'bg-white text-[#2f62d8] shadow-[0_4px_10px_-4px_rgba(0,0,0,0.4)]'


export interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  /** Solo pantallas pequenas: el menu se abre como panel */
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { role, permissions } = useAppSelector((state) => state.auth)
  // Cada rol ve solo las opciones que puede consultar; los grupos sin opciones no se muestran
  const groups = NAV_GROUPS.map((group) => ({ ...group, keys: group.keys.filter((key) => canSee(permissions, key)) })).filter(
    (group) => group.keys.length > 0
  )
  // En el panel movil siempre se muestran las etiquetas
  const compact = collapsed && !mobileOpen
  const turno = getTurno(useNow())
  const restante = formatearRestante(turno.minutosRestantes)
  // Posicion de cada opcion en todo el menu: escalona la entrada
  let orden = 0

  const pathFor = (key: NavKey) => (key === 'dashboard' ? `/dashboard/${role}` : `/dashboard/${role}/${key}`)

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-[1650] bg-slate-900/45 dark:bg-black/65 md:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        aria-label="Menú principal"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-[1700] flex flex-col overflow-hidden bg-[linear-gradient(180deg,#132a6e_0%,#10235d_45%,#0b1a4a_100%)] text-white shadow-[6px_0_24px_-12px_rgba(10,22,61,0.5)] transition-[width,transform] duration-200',
          compact ? 'w-16' : 'w-[232px]',
          mobileOpen ? 'translate-x-0 shadow-[0_16px_48px_rgba(15,23,42,0.18)]' : 'max-md:-translate-x-full'
        )}
      >
        {/* Ondas suaves de fondo */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 232 900" preserveAspectRatio="none">
          <path d="M0 520 C 80 470 150 560 232 500 V900 H0Z" fill="#ffffff" opacity="0.035" />
          <path d="M0 640 C 90 590 160 690 232 620 V900 H0Z" fill="#60a5fa" opacity="0.06" />
          <path d="M0 300 C 70 260 170 340 232 280" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1.5" />
        </svg>

        {/* Marca: nombre del sistema (con el menu contraido solo queda un espacio) */}
        {compact ? (
          <div className="h-4 shrink-0" />
        ) : (
          <div className="relative mx-3 mt-4 mb-3 flex shrink-0 items-center gap-3 border-b border-white/10 pb-4 pl-2">
            {/* Barra de acento a la izquierda del nombre */}
            <span aria-hidden className="h-10 w-1 shrink-0 rounded-full bg-[linear-gradient(180deg,#60a5fa,#2f62d8)]" />
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[22px] font-bold tracking-[-0.01em] text-white">Centinela</span>
              <span className="mt-1.5 flex items-center gap-1.5 truncate text-[12px] font-semibold tracking-[0.08em] text-[#93c5fd] uppercase">
                CECOM
                <span aria-hidden className="size-1 rounded-full bg-white/40" />
                SJL
              </span>
            </span>
          </div>
        )}

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="absolute top-2 right-2 z-10 flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-white/10 p-0 text-lg text-white hover:bg-white/20 md:hidden"
          >
            <FiX />
          </button>
        )}

        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-4 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]">
          {groups.map((group, gi) => {
            return (
              <div key={gi} className={cn(gi > 0 && 'mt-5')}>
                {group.title && !compact && (
                  <div className="mb-2 flex items-center gap-2 px-2">
                    <p className="m-0 text-[12px] font-bold tracking-[0.08em] text-white/60 uppercase">{group.title}</p>
                  </div>
                )}
                {group.title && compact && gi > 0 && <div className="mx-2 mb-3 border-t border-white/12" />}
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {group.keys.map((key) => {
                    const { label, icon: Icon } = ITEMS[key]
                    return (
                      <li key={key}>
                        <NavLink
                          to={pathFor(key)}
                          end={key === 'dashboard'}
                          title={compact ? label : undefined}
                          aria-label={label}
                          onClick={onCloseMobile}
                          style={{ '--i': orden++ } as React.CSSProperties}
                          className={({ isActive }) =>
                            cn(linkBase, compact && 'justify-center px-0', isActive ? (compact ? 'text-white' : linkActive) : linkIdle)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className={cn(tileBase, isActive ? tileActive : tileIdle, compact && 'size-10', compact && isActive && 'ring-2 ring-white/80')} aria-hidden>
                                <Icon className="size-[17px]" />
                              </span>
                              {!compact && (
                                <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                                  {label}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* Turno en curso: dato util para quien opera el centro de control */}
        <div
          className={cn(
            'relative mx-3 mb-3 rounded-2xl bg-white/8 ring-1 ring-white/12 backdrop-blur-sm',
            compact ? 'flex justify-center py-3' : 'px-4 py-3'
          )}
          title={compact ? `Turno ${turno.nombre.toLowerCase()} en curso` : undefined}
        >
          <div className={cn('flex items-center gap-2', compact && 'justify-center')}>
            <span className="relative flex size-2 shrink-0">
              <span
                className="absolute inset-0 rounded-full bg-brand-lime"
                style={{ animation: 'blipRing 2.4s ease-out infinite' }}
              />
              <span className="relative size-2 rounded-full bg-brand-lime" />
            </span>
            {!compact && <span className="text-[11px] font-bold tracking-[0.12em] text-white/60 uppercase">Turno en curso</span>}
          </div>
          {!compact && (
            <>
              <p className="m-0 mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-base font-bold text-white">{turno.nombre}</span>
                <span className="text-xs font-medium tabular-nums text-white/70">{turno.rango}</span>
              </p>
              <div
                role="progressbar"
                aria-label="Avance del turno"
                aria-valuenow={Math.round(turno.progreso * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#8ebc22,#b5e04a)] transition-transform duration-1000"
                  style={{ transform: `scaleX(${turno.progreso})` }}
                />
              </div>
              <p className="m-0 mt-1.5 text-xs font-medium tabular-nums text-white/70">Termina en <span className="font-bold text-white">{restante}</span></p>
            </>
          )}
        </div>

        <div className="relative hidden border-t border-white/10 p-3 md:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menú' : undefined}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className={cn(
              'flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent px-3 text-[13.5px] font-medium text-white/65 transition-colors duration-150 hover:bg-white/8 hover:text-white',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? <FiChevronsRight className="size-[18px]" /> : <FiChevronsLeft className="size-[18px]" />}
            {!collapsed && <span>Contraer menú</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
