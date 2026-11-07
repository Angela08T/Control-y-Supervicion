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
  FiGrid,
  FiShield,
  FiUser,
  FiUserMinus,
  FiUserX,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import type { AppRole } from '@/types'
import { useAppSelector } from '@/store/hooks'
import { cn } from '@/utils/classes'
import { formatearRestante, getTurno } from '@/utils/turno'
import ContourMap from './ContourMap'
import { useNow } from '@/hooks/useNow'

type NavKey =
  | 'dashboard'
  | 'incidencias'
  | 'inasistencias'
  | 'bodycam'
  | 'usuarios'
  | 'cargos'
  | 'personal'
  | 'asuntos'
  | 'faltas'
  | 'infractores'
  | 'estadisticas'
  | 'auditoria'

interface NavItem {
  label: string
  icon: IconType
}

/** Un solo catalogo de opciones; cada rol elige cuales ve y en que grupo. */
const ITEMS: Record<NavKey, NavItem> = {
  dashboard: { label: 'Inicio', icon: FiGrid },
  incidencias: { label: 'Incidencias', icon: FiFileText },
  inasistencias: { label: 'Inasistencias', icon: FiUserMinus },
  bodycam: { label: 'Dispositivos', icon: FiVideo },
  usuarios: { label: 'Usuarios', icon: FiUsers },
  cargos: { label: 'Cargos', icon: FiBriefcase },
  personal: { label: 'Personal', icon: FiUser },
  asuntos: { label: 'Asuntos', icon: FiClipboard },
  faltas: { label: 'Faltas', icon: FiAlertTriangle },
  infractores: { label: 'Infractores', icon: FiUserX },
  estadisticas: { label: 'Estadísticas', icon: FiBarChart2 },
  auditoria: { label: 'Auditoría', icon: FiShield },
}

interface NavGroup {
  /** Sin titulo cuando el rol solo tiene un grupo */
  title?: string
  keys: NavKey[]
}

const adminGroups = (withAudit: boolean): NavGroup[] => [
  { title: 'Operación', keys: ['dashboard', 'incidencias', 'inasistencias'] },
  { title: 'Administración', keys: ['bodycam', 'usuarios', 'cargos', 'personal', 'asuntos', 'faltas', 'infractores'] },
  { title: 'Análisis', keys: withAudit ? ['estadisticas', 'auditoria'] : ['estadisticas'] },
]

const GROUPS: Record<AppRole, NavGroup[]> = {
  admin: adminGroups(true),
  supervisor: adminGroups(false),
  centinela: [{ keys: ['dashboard', 'incidencias', 'inasistencias', 'bodycam'] }],
  validator: [{ keys: ['incidencias', 'inasistencias'] }],
  subgerente: [{ keys: ['dashboard', 'incidencias', 'estadisticas'] }],
}

const linkBase =
  'nav-in group relative flex h-11 items-center gap-3 overflow-hidden rounded-lg px-3 text-sm no-underline transition-colors duration-150'
const linkIdle = 'text-content-2 hover:bg-[rgba(30,58,138,0.05)] hover:text-content'
const linkActive =
  'bg-gradient-to-r from-[rgba(30,58,138,0.13)] to-[rgba(30,58,138,0.02)] font-semibold text-primary'
/** Marca vertical a la izquierda: crece al pasar el mouse y se completa en la opcion activa */
const markBase =
  'absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-primary transition-transform duration-200 ease-out'


export interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  /** Solo pantallas pequenas: el menu se abre como panel */
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { role } = useAppSelector((state) => state.auth)
  const groups: NavGroup[] = (role && GROUPS[role]) || []
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
        <div className="fixed inset-0 z-[1400] bg-slate-900/45 md:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        aria-label="Menú principal"
        className={cn(
          'fixed top-14 bottom-0 left-0 z-[1500] flex flex-col overflow-hidden border-r border-line bg-gradient-to-b from-surface via-surface to-[rgba(30,58,138,0.05)] transition-[width,transform] duration-200',
          compact ? 'w-16' : 'w-[232px]',
          mobileOpen ? 'translate-x-0 shadow-[0_16px_48px_rgba(15,23,42,0.18)]' : 'max-md:-translate-x-full'
        )}
      >
        <ContourMap align="xMinYMid" className="opacity-80" />

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="absolute top-2 right-2 z-10 flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-lg text-muted hover:bg-subtle md:hidden"
          >
            <FiX />
          </button>
        )}

        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {groups.map((group, gi) => {
            return (
              <div key={gi} className={cn(gi > 0 && 'mt-5')}>
                {group.title && !compact && (
                  <div className="mb-1 flex items-center gap-2 px-3">
                    <p className="m-0 text-xs font-medium text-muted">{group.title}</p>
                    <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
                  </div>
                )}
                {group.title && compact && gi > 0 && <div className="mx-3 mb-2 border-t border-line" />}
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
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
                            cn(linkBase, compact && 'justify-center px-0', isActive ? linkActive : linkIdle)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                aria-hidden
                                className={cn(markBase, isActive ? 'scale-y-100' : 'scale-y-0 opacity-50 group-hover:scale-y-50')}
                              />
                              <Icon
                                className="size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                                aria-hidden
                              />
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
            'relative mx-2 mb-2 rounded-lg bg-gradient-to-br from-[rgba(30,58,138,0.08)] to-[rgba(30,58,138,0.02)] ring-1 ring-[rgba(30,58,138,0.12)]',
            compact ? 'flex justify-center py-3' : 'px-3 py-3'
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
            {!compact && <span className="text-xs text-muted">Turno en curso</span>}
          </div>
          {!compact && (
            <>
              <p className="m-0 mt-1.5 text-sm font-semibold text-content">{turno.nombre}</p>
              <p className="m-0 text-xs tabular-nums text-muted">{turno.rango}</p>
              <div
                role="progressbar"
                aria-label="Avance del turno"
                aria-valuenow={Math.round(turno.progreso * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2.5 h-1 overflow-hidden rounded-full bg-[rgba(30,58,138,0.12)]"
              >
                <div
                  className="h-full origin-left rounded-full bg-primary transition-transform duration-1000"
                  style={{ transform: `scaleX(${turno.progreso})` }}
                />
              </div>
              <p className="m-0 mt-1.5 text-[11px] tabular-nums text-muted">Termina en {restante}</p>
            </>
          )}
        </div>

        <div className="relative hidden border-t border-line p-2 md:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menú' : undefined}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className={cn(
              'flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-3 text-[13px] text-muted transition-colors duration-150 hover:bg-subtle hover:text-content',
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
