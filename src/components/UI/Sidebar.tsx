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
  'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm no-underline transition-colors duration-150'
const linkIdle = 'text-content-2 hover:bg-subtle hover:text-content'
const linkActive = 'bg-[rgba(30,58,138,0.08)] font-medium text-primary'

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

  const pathFor = (key: NavKey) => (key === 'dashboard' ? `/dashboard/${role}` : `/dashboard/${role}/${key}`)

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-[1400] bg-slate-900/45 md:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        aria-label="Menú principal"
        className={cn(
          'fixed top-14 bottom-0 left-0 z-[1500] flex flex-col border-r border-line bg-surface transition-[width,transform] duration-200',
          compact ? 'w-16' : 'w-[232px]',
          mobileOpen ? 'translate-x-0 shadow-[0_16px_48px_rgba(15,23,42,0.18)]' : 'max-md:-translate-x-full'
        )}
      >
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-lg text-muted hover:bg-subtle md:hidden"
          >
            <FiX />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {groups.map((group, gi) => (
            <div key={gi} className={cn(gi > 0 && 'mt-4')}>
              {group.title && !compact && (
                <p className="m-0 mb-1 px-3 text-xs font-medium text-muted">{group.title}</p>
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
                        className={({ isActive }) =>
                          cn(linkBase, compact && 'justify-center px-0', isActive ? linkActive : linkIdle)
                        }
                      >
                        <Icon className="size-[18px] shrink-0" aria-hidden />
                        {!compact && <span className="truncate">{label}</span>}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-line p-2 md:block">
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
