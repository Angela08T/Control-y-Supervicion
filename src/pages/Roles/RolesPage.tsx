import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiEdit2,
  FiEye,
  FiFileText,
  FiGrid,
  FiHome,
  FiKey,
  FiLock,
  FiPlus,
  FiSave,
  FiSend,
  FiShield,
  FiSlash,
  FiTrash2,
  FiUser,
  FiUserMinus,
  FiUsers,
  FiUserX,
  FiVideo,
  FiX,
  FiZap,
} from 'react-icons/fi'
import { estiloRol } from '@/components/UserTable'
import { useAppSelector } from '@/store/hooks'
import Button from '@/components/UI/Button'
import { Field, Input, Textarea } from '@/components/UI/Field'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import ConfirmModal from '@/components/ConfirmModal'
import { createRole, deleteRole, getRoleCatalog, getRoles, updateRole } from '@/api/role'
import { getModulePermissions } from '@/utils/permissions'
import { toast } from '@/utils/toast'
import { cn, fitCard, fitPage } from '@/utils/classes'
import type { PermissionAction, RoleCatalog, RoleItem, RolePermissions } from '@/types'

/** Clave del rol que siempre tiene todos los permisos */
const SUPER_ROLE = 'ADMINISTRATOR'

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  send: 'Enviar',
  validate: 'Validar',
}

const ACTION_ICONS: Record<PermissionAction, React.ReactNode> = {
  view: <FiEye />,
  create: <FiPlus />,
  edit: <FiEdit2 />,
  delete: <FiTrash2 />,
  send: <FiSend />,
  validate: <FiCheckCircle />,
}

/** Icono de cada modulo (los mismos del menu lateral) */
const MODULE_ICONS: Record<string, React.ReactNode> = {
  dashboard: <FiHome />,
  incidencias: <FiFileText />,
  inasistencias: <FiUserMinus />,
  bodycam: <FiVideo />,
  estadisticas: <FiBarChart2 />,
  personal: <FiUser />,
  cargos: <FiBriefcase />,
  offenders: <FiUserX />,
  infractores: <FiUserX />,
  asuntos: <FiClipboard />,
  faltas: <FiAlertTriangle />,
  usuarios: <FiUsers />,
  roles: <FiKey />,
  auditoria: <FiShield />,
}

/**
 * Casilla de permiso con forma de boton: verde con check cuando esta marcada; con borde y el icono
 * de la accion cuando no. Es un checkbox para lectores de pantalla (role="checkbox").
 */
function CasillaPermiso({
  checked,
  onChange,
  disabled,
  label,
  icon,
  cambio,
  grande = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
  icon: React.ReactNode
  /** Cambio sin guardar: punto ambar en la esquina */
  cambio?: boolean
  grande?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center rounded-lg border-2 transition-[background-color,border-color,color,transform] duration-150 active:scale-95 disabled:cursor-not-allowed',
        grande ? 'size-9 text-base' : 'size-8 text-[15px]',
        checked
          ? 'border-[var(--viz-approved)] bg-[var(--viz-approved)] text-white shadow-[0_4px_10px_-4px_rgba(47,125,50,0.7)]'
          : 'border-line-strong bg-surface text-muted hover:border-[var(--viz-approved)] hover:text-lime-ink',
        disabled && !checked && 'opacity-60 hover:border-line-strong hover:text-muted'
      )}
    >
      <span aria-hidden>{checked ? <FiCheck strokeWidth={3} /> : icon}</span>
      {cambio && <span className="pointer-events-none absolute -top-1.5 -right-1.5 size-3 rounded-full border-2 border-surface bg-warning" title="Cambio sin guardar" />}
    </button>
  )
}

/** Total de acciones disponibles en el catalogo y cuantas tiene el rol */
const totalAcciones = (catalog: RoleCatalog | null) => (catalog?.modules ?? []).reduce((n, m) => n + m.actions.length, 0)
const accionesDe = (permissions: RolePermissions) => Object.values(permissions).reduce((n, a) => n + a.length, 0)

/** Anillo de "nivel de acceso": porcentaje de permisos que tiene el rol */
function Anillo({ pct, color, size = 34 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--subtle)" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}

/** Formulario en edición: es una copia del rol seleccionado (o un rol nuevo) */
interface Draft {
  name: string
  description: string
  permissions: RolePermissions
}

const EMPTY_DRAFT: Draft = { name: '', description: '', permissions: {} }

const toDraft = (role: RoleItem): Draft => ({
  name: role.name,
  description: role.description ?? '',
  permissions: role.permissions,
})

/** Compara permisos sin importar el orden de las acciones */
const samePermissions = (a: RolePermissions, b: RolePermissions): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const x = [...(a[key] ?? [])].sort().join()
    const y = [...(b[key] ?? [])].sort().join()
    if (x !== y) return false
  }
  return true
}

/** Cantidad de módulos a los que el rol tiene algún acceso */
const countModules = (permissions: RolePermissions): number =>
  Object.values(permissions).filter((actions) => actions.length > 0).length


export default function RolesPage() {
  const { role: userRole } = useAppSelector((state) => state.auth)
  const { canCreate, canEdit, canDelete } = getModulePermissions(userRole, 'roles')

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [catalog, setCatalog] = useState<RoleCatalog | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  /** Id del rol seleccionado, o 'new' mientras se crea uno */
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false)
  /** Rol al que se quiere pasar con cambios sin guardar (se confirma en un modal) */
  const [pendiente, setPendiente] = useState<string | 'new' | null>(null)

  const selected = useMemo(() => roles.find((role) => role.id === selectedId) ?? null, [roles, selectedId])
  const isNew = selectedId === 'new'
  const locked = selected?.key === SUPER_ROLE
  const readOnly = locked || (isNew ? !canCreate : !canEdit)

  const original: Draft = isNew ? EMPTY_DRAFT : selected ? toDraft(selected) : EMPTY_DRAFT
  const dirty =
    isNew
      ? draft.name.trim() !== '' || countModules(draft.permissions) > 0 || draft.description.trim() !== ''
      : !!selected &&
        (draft.name.trim() !== original.name ||
          draft.description.trim() !== original.description ||
          !samePermissions(draft.permissions, original.permissions))
  const valid = draft.name.trim().length >= 3

  const load = useCallback(async (keepId?: string) => {
    setLoading(true)
    try {
      const [list, cat] = await Promise.all([getRoles(), getRoleCatalog()])
      setRoles(list)
      setCatalog(cat)
      const next = list.find((role) => role.id === keepId) ?? list[0] ?? null
      setSelectedId(next?.id ?? null)
      setDraft(next ? toDraft(next) : EMPTY_DRAFT)
    } catch {
      toast.error('No se pudieron cargar los roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Cambia de rol; si hay cambios sin guardar, pregunta antes de descartarlos */
  function select(id: string | 'new', forzar = false) {
    if (id === selectedId) return
    if (dirty && !forzar) {
      setPendiente(id)
      return
    }
    setSelectedId(id)
    if (id === 'new') {
      setDraft(EMPTY_DRAFT)
    } else {
      const role = roles.find((item) => item.id === id)
      setDraft(role ? toDraft(role) : EMPTY_DRAFT)
    }
  }

  function discard() {
    setDraft(isNew || !selected ? EMPTY_DRAFT : toDraft(selected))
  }

  /** Marca o desmarca una acción. Ver es la base: sin ella no hay nada más, y al marcar algo se activa. */
  function toggle(module: string, action: PermissionAction, checked: boolean) {
    if (readOnly) return
    setDraft((prev) => {
      let actions = new Set(prev.permissions[module] ?? [])
      if (checked) {
        actions.add(action)
        if (action !== 'view' && catalog?.modules.find((m) => m.key === module)?.actions.includes('view')) actions.add('view')
      } else {
        actions.delete(action)
        if (action === 'view') actions = new Set()
      }
      return { ...prev, permissions: { ...prev.permissions, [module]: [...actions] } }
    })
  }

  /** Marca o desmarca todas las acciones de un módulo */
  function toggleRow(module: string, available: PermissionAction[], checked: boolean) {
    if (readOnly) return
    setDraft((prev) => ({ ...prev, permissions: { ...prev.permissions, [module]: checked ? [...available] : [] } }))
  }

  /** Atajos: aplica un conjunto de permisos a todos los modulos */
  function aplicarAtajo(tipo: 'ver' | 'todo' | 'nada') {
    if (readOnly || !catalog) return
    setDraft(prev => ({
      ...prev,
      permissions: Object.fromEntries(
        catalog.modules.map(m => [
          m.key,
          tipo === 'todo' ? [...m.actions] : tipo === 'ver' && m.actions.includes('view') ? ['view' as PermissionAction] : [],
        ])
      ),
    }))
  }

  async function save() {
    if (!valid || saving) return
    setSaving(true)
    try {
      const body = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        permissions: Object.fromEntries(Object.entries(draft.permissions).filter(([, actions]) => actions.length > 0)),
      }
      if (isNew) {
        const response = await createRole(body)
        toast.success(response.message || 'Rol creado exitosamente')
        await load(response.data.id)
      } else if (selected) {
        // El Administrador no admite cambios de permisos; el servidor lo rechaza
        const { permissions, ...rest } = body
        const response = await updateRole(selected.id, locked ? rest : { ...rest, permissions })
        toast.success(response.message || 'Rol actualizado exitosamente')
        await load(selected.id)
      }
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string | string[] } }; message?: string })
      const text = message.response?.data?.message ?? message.message ?? 'No se pudo guardar el rol'
      toast.error(Array.isArray(text) ? text.join(', ') : text)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!selected) return
    setConfirmDelete(false)
    try {
      const response = await deleteRole(selected.id)
      toast.success(response.message || 'Rol eliminado exitosamente')
      await load()
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } }; message?: string })
      toast.error(message.response?.data?.message ?? message.message ?? 'No se pudo eliminar el rol')
    }
  }

  const canRemove = !!selected && !selected.is_system && canDelete
  const removeBlocked = !!selected && selected.users > 0

  const total = totalAcciones(catalog)
  const otorgadas = accionesDe(draft.permissions)
  const pctDraft = total ? Math.round((otorgadas / total) * 100) : 0
  const estiloSel = estiloRol(isNew ? '' : selected?.key ?? '')
  const pendientes = (catalog?.modules ?? []).reduce((n, m) => {
    const a = new Set(draft.permissions[m.key] ?? [])
    const b = new Set(original.permissions[m.key] ?? [])
    return n + m.actions.filter(x => a.has(x) !== b.has(x)).length
  }, 0)

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias: titulo grande a la izquierda y la accion a la derecha */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Administración · Seguridad</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Roles y permisos</h2>
          <p className="m-0 mt-1 text-sm text-content-2">Define qué puede hacer cada rol. El rol de cada persona se asigna en Usuarios.</p>
        </div>
        {canCreate && (
          <Button icon={<FiPlus />} onClick={() => select('new')}>
            Nuevo rol
          </Button>
        )}
      </header>

      {loading ? (
        <div className={fitCard}>
          <LoadingState label="Cargando roles…" />
        </div>
      ) : roles.length === 0 && !isNew ? (
        <div className={fitCard}>
          <EmptyState title="Aún no hay roles" description="Crea el primero con el botón “Nuevo rol”." />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[290px_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
          {/* Lista de roles */}
          <aside className={cn(fitCard, 'max-lg:max-h-64')} aria-label="Roles">
            <p className="m-0 border-b border-line px-4 py-2.5 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
              {roles.length} {roles.length === 1 ? 'rol' : 'roles'}
            </p>
            <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-auto p-2">
              {isNew && (
                <li>
                  <button
                    type="button"
                    aria-current="true"
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/6 px-3 py-2.5 text-left dark:bg-primary/15"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary dark:text-accent-light" aria-hidden>
                      <FiPlus />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-primary dark:text-accent-light">{draft.name.trim() || 'Rol nuevo'}</span>
                      <span className="block text-xs text-muted">Sin guardar</span>
                    </span>
                  </button>
                </li>
              )}
              {roles.map((role) => {
                const active = role.id === selectedId
                const st = estiloRol(role.key)
                const pct = total ? Math.round((accionesDe(role.permissions) / total) * 100) : 0
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      onClick={() => select(role.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-none px-3 py-2.5 text-left transition-colors duration-150',
                        active ? 'bg-primary/8 dark:bg-primary/20' : 'bg-transparent hover:bg-subtle'
                      )}
                    >
                      {active && <span aria-hidden className="absolute top-2 bottom-2 left-0 w-1 rounded-full" style={{ background: st.color }} />}
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: st.color }} aria-hidden>
                        {st.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className={cn('truncate text-sm', active ? 'font-bold text-content' : 'font-semibold text-content')}>{role.name}</span>
                          {role.is_system && <FiLock className="shrink-0 text-[11px] text-muted" title="Rol del sistema" aria-label="Rol del sistema" />}
                        </span>
                        <span className="block text-xs text-muted">
                          {role.users} {role.users === 1 ? 'usuario' : 'usuarios'} · {countModules(role.permissions)} módulos
                        </span>
                      </span>
                      <span className="relative flex items-center justify-center" title={`Nivel de acceso: ${pct}%`}>
                        <Anillo pct={pct} color={st.color} />
                        <span className="absolute text-[9px] font-bold text-content-2 tabular-nums">{pct}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Detalle del rol */}
          <section className={cn(fitCard, 'min-w-0')} aria-label={isNew ? 'Rol nuevo' : `Rol ${selected?.name ?? ''}`}>
            {/* Cabecera del rol: icono, nombre, descripcion y nivel de acceso */}
            <div className="flex shrink-0 flex-wrap items-start gap-4 border-b border-line px-5 py-4 max-sm:px-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl text-white shadow-sm" style={{ background: isNew ? 'var(--primary)' : estiloSel.color }} aria-hidden>
                {isNew ? <FiPlus /> : estiloSel.icon}
              </span>
              <div className="grid min-w-[240px] flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 max-md:grid-cols-1">
                <Field label="Nombre del rol" required hint={isNew ? 'Mínimo 3 letras' : undefined}>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={readOnly}
                    maxLength={40}
                    placeholder="Ej. Auditor"
                    className="font-semibold"
                  />
                </Field>
                <Field label="Descripción">
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={readOnly}
                    rows={1}
                    maxLength={150}
                    placeholder="Para qué sirve este rol"
                  />
                </Field>
              </div>
              {/* Nivel de acceso */}
              <div className="flex shrink-0 items-center gap-3 rounded-xl bg-subtle px-3.5 py-2.5">
                <span className="relative flex items-center justify-center">
                  <Anillo pct={pctDraft} color={isNew ? 'var(--primary)' : estiloSel.color} size={46} />
                  <span className="absolute text-[11px] font-bold text-content tabular-nums">{pctDraft}%</span>
                </span>
                <span className="text-xs leading-tight text-content-2">
                  <strong className="block text-[13px] font-bold text-content">Nivel de acceso</strong>
                  {otorgadas} de {total} permisos
                  {!isNew && selected && <span className="block text-muted">{selected.users} {selected.users === 1 ? 'usuario' : 'usuarios'} con este rol</span>}
                </span>
              </div>
            </div>

            {locked ? (
              <p className="m-0 flex shrink-0 items-center gap-2 border-b border-line bg-primary/5 px-5 py-2.5 text-[13px] text-primary dark:text-accent-light">
                <FiLock aria-hidden /> El Administrador siempre tiene todos los permisos y no se puede limitar.
              </p>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-5 py-2.5 max-sm:px-4">
                {selected?.is_system && (
                  <span className="mr-auto inline-flex items-center gap-1.5 text-[13px] text-muted">
                    <FiLock aria-hidden /> Rol del sistema: puedes cambiar sus permisos, pero no eliminarlo.
                  </span>
                )}
                {!readOnly && (
                  <span className={cn('flex flex-wrap items-center gap-1.5', !selected?.is_system && 'ml-auto')}>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <FiZap aria-hidden /> Atajos:
                    </span>
                    {([
                      ['ver', <FiEye key="i" />, 'Solo ver todo'],
                      ['todo', <FiCheck key="i" />, 'Acceso total'],
                      ['nada', <FiSlash key="i" />, 'Quitar todo'],
                    ] as const).map(([tipo, icono, label]) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => aplicarAtajo(tipo)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-content-2 transition-colors hover:border-line-strong hover:text-content"
                      >
                        <span aria-hidden>{icono}</span>
                        {label}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            )}

            {/* Matriz de permisos: una fila por modulo y una columna por accion, con casillas */}
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-20 border-b border-line bg-subtle px-5 py-2.5 text-left text-xs font-semibold text-muted max-sm:px-3">
                      Módulo
                    </th>
                    {(catalog?.actions ?? []).map((action) => (
                      <th key={action} className="sticky top-0 z-10 border-b border-line bg-subtle px-2 py-2 text-center text-xs font-semibold text-muted">
                        <span className="flex flex-col items-center gap-0.5">
                          <span className="text-sm" aria-hidden>{ACTION_ICONS[action]}</span>
                          {ACTION_LABELS[action]}
                        </span>
                      </th>
                    ))}
                    <th className="sticky top-0 z-10 border-b border-l border-line bg-subtle px-3 py-2 text-center text-xs font-semibold text-muted">
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-sm" aria-hidden><FiCheckCircle /></span>
                        Todo
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(catalog?.modules ?? []).map((module) => {
                    const granted = draft.permissions[module.key] ?? []
                    const antes = original.permissions[module.key] ?? []
                    const all = granted.length === module.actions.length && module.actions.length > 0
                    const algo = granted.length > 0
                    return (
                      <tr key={module.key} className="group transition-colors hover:bg-card-hover">
                        {/* Modulo */}
                        <td className="sticky left-0 z-10 border-b border-line bg-surface px-5 py-2.5 group-hover:bg-card-hover max-sm:px-3">
                          <div className="flex min-w-[170px] items-center gap-3">
                            <span
                              className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-lg text-[15px] transition-colors',
                                algo ? 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-light' : 'bg-subtle text-muted'
                              )}
                              aria-hidden
                            >
                              {MODULE_ICONS[module.key] ?? <FiGrid />}
                            </span>
                            <span className="min-w-0">
                              <span className={cn('block truncate text-sm font-semibold', algo ? 'text-content' : 'text-content-2')}>{module.label}</span>
                              <span className="block text-[11px] text-muted">{algo ? `${granted.length} de ${module.actions.length}` : 'Sin acceso'}</span>
                            </span>
                          </div>
                        </td>

                        {/* Una casilla por accion; "–" si el modulo no tiene esa accion */}
                        {(catalog?.actions ?? []).map((action) => {
                          const disponible = module.actions.includes(action)
                          const on = granted.includes(action)
                          const cambio = disponible && on !== antes.includes(action)
                          return (
                            <td key={action} className="border-b border-line px-2 py-2.5 text-center">
                              {disponible ? (
                                <CasillaPermiso
                                  checked={on}
                                  disabled={readOnly}
                                  onChange={(v) => toggle(module.key, action, v)}
                                  label={`${ACTION_LABELS[action]} en ${module.label}`}
                                  icon={ACTION_ICONS[action]}
                                  cambio={cambio}
                                />
                              ) : (
                                <span aria-hidden className="text-line-strong">–</span>
                              )}
                            </td>
                          )
                        })}

                        {/* Todo el modulo */}
                        <td className="border-b border-l border-line px-3 py-2.5 text-center">
                          <CasillaPermiso
                            grande
                            checked={all}
                            disabled={readOnly}
                            onChange={(v) => toggleRow(module.key, module.actions, v)}
                            label={`Todos los permisos en ${module.label}`}
                            icon={<FiCheckCircle />}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Acciones: la barra se vuelve ambar cuando hay cambios sin guardar */}
            <div
              className={cn(
                'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-3 transition-colors duration-200 max-sm:px-4',
                dirty && !readOnly ? 'border-warning/40 bg-warning/10' : 'border-line bg-subtle'
              )}
            >
              <div className="flex items-center gap-3">
                {canRemove && !isNew && (
                  <Button
                    variant="ghost"
                    icon={<FiTrash2 />}
                    onClick={() => setConfirmDelete(true)}
                    disabled={removeBlocked}
                    title={removeBlocked ? 'Hay usuarios con este rol: cámbiales el rol primero' : 'Eliminar este rol'}
                  >
                    Eliminar rol
                  </Button>
                )}
                {dirty && !readOnly && (
                  <span className="flex items-center gap-2 text-[13px] text-content-2" aria-live="polite">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-warning text-xs font-bold text-white tabular-nums dark:text-[#2a1a00]">
                      {pendientes || <FiEdit2 />}
                    </span>
                    <strong className="font-semibold text-content">Cambios sin guardar</strong>
                  </span>
                )}
                {readOnly && !locked && (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                    <FiLock aria-hidden /> Solo lectura
                  </span>
                )}
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" icon={<FiX />} onClick={discard} disabled={!dirty || saving}>
                    Descartar
                  </Button>
                  <Button icon={isNew ? <FiPlus /> : <FiSave />} onClick={save} loading={saving} disabled={!dirty || !valid}>
                    {isNew ? 'Crear rol' : 'Guardar cambios'}
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        title={`¿Eliminar el rol «${selected?.name ?? ''}»?`}
        message="Esta acción no se puede deshacer."
        type="danger"
        confirmText="Sí, eliminar"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmModal
        isOpen={pendiente !== null}
        title="Tienes cambios sin guardar"
        message="Si cambias de rol ahora, se perderán los cambios que hiciste. ¿Quieres descartarlos?"
        type="warning"
        confirmText="Descartar cambios"
        cancelText="Seguir editando"
        onConfirm={() => {
          const id = pendiente
          setPendiente(null)
          if (id) select(id, true)
        }}
        onCancel={() => setPendiente(null)}
      />
    </div>
  )
}
