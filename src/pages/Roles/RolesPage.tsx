import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FiLock, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useAppSelector } from '@/store/hooks'
import PageHeader from '@/components/UI/PageHeader'
import Button from '@/components/UI/Button'
import Badge from '@/components/UI/Badge'
import { Field, Input, Textarea } from '@/components/UI/Field'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import ConfirmModal from '@/components/ConfirmModal'
import { createRole, deleteRole, getRoleCatalog, getRoles, updateRole } from '@/api/role'
import { getModulePermissions } from '@/utils/permissions'
import { toast } from '@/utils/toast'
import { cn, fitCard, fitPage, incTable, incTableTd, incTableTh } from '@/utils/classes'
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

const roleItem =
  'group relative flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border-none bg-transparent px-4 py-3 text-left transition-colors duration-150 hover:bg-[rgba(30,58,138,0.05)]'
const roleItemActive = 'bg-gradient-to-r from-[rgba(30,58,138,0.12)] to-[rgba(30,58,138,0.02)]'

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
  function select(id: string | 'new') {
    if (id === selectedId) return
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?')) return
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

  return (
    <div className={fitPage}>
      <PageHeader
        title="Roles y permisos"
        description="Define qué puede hacer cada rol en el sistema. El rol de cada persona se asigna en Usuarios."
        actions={
          canCreate && (
            <Button icon={<FiPlus />} onClick={() => select('new')}>
              Nuevo rol
            </Button>
          )
        }
      />

      {loading ? (
        <div className={fitCard}>
          <LoadingState label="Cargando roles…" />
        </div>
      ) : roles.length === 0 && !isNew ? (
        <div className={fitCard}>
          <EmptyState title="Aún no hay roles" description="Crea el primero con el botón “Nuevo rol”." />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
          {/* Lista de roles */}
          <aside className={cn(fitCard, 'max-lg:max-h-60')} aria-label="Roles">
            <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-auto p-2">
              {isNew && (
                <li>
                  <button type="button" className={cn(roleItem, roleItemActive)} aria-current="true">
                    <span aria-hidden className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-primary" />
                    <span className="text-sm font-semibold text-primary">{draft.name.trim() || 'Rol nuevo'}</span>
                    <span className="text-xs text-muted">Sin guardar</span>
                  </button>
                </li>
              )}
              {roles.map((role) => {
                const active = role.id === selectedId
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      onClick={() => select(role.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(roleItem, active && roleItemActive)}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-primary transition-transform duration-200',
                          active ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'
                        )}
                      />
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className={cn('truncate text-sm', active ? 'font-semibold text-primary' : 'font-medium text-content')}>
                          {role.name}
                        </span>
                        {role.is_system ? (
                          <Badge dot={false}>Sistema</Badge>
                        ) : (
                          <Badge tone="info" dot={false}>
                            Propio
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted">
                        {role.users} {role.users === 1 ? 'usuario' : 'usuarios'} · {countModules(role.permissions)} módulos
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Detalle del rol */}
          <section className={cn(fitCard, 'min-w-0')} aria-label={isNew ? 'Rol nuevo' : `Rol ${selected?.name ?? ''}`}>
            <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-b border-line px-5 py-4 max-md:grid-cols-1">
              <Field label="Nombre del rol" required hint={isNew ? 'Mínimo 3 letras' : undefined}>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={readOnly}
                  maxLength={40}
                  placeholder="Ej. Auditor"
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

            {locked ? (
              <p className="m-0 flex shrink-0 items-center gap-2 border-b border-line bg-[rgba(30,58,138,0.05)] px-5 py-2.5 text-[13px] text-primary">
                <FiLock aria-hidden /> El Administrador siempre tiene todos los permisos y no se puede limitar.
              </p>
            ) : selected?.is_system ? (
              <p className="m-0 shrink-0 border-b border-line bg-subtle px-5 py-2.5 text-[13px] text-muted">
                Rol del sistema: puedes cambiar sus permisos, pero no eliminarlo.
              </p>
            ) : null}

            {/* Matriz de permisos */}
            <div className="min-h-0 flex-1 overflow-auto">
              <table className={incTable}>
                <thead>
                  <tr>
                    <th className={incTableTh}>Módulo</th>
                    {(catalog?.actions ?? []).map((action) => (
                      <th key={action} className={cn(incTableTh, 'text-center')}>
                        {ACTION_LABELS[action]}
                      </th>
                    ))}
                    <th className={cn(incTableTh, 'text-center')}>Todo</th>
                  </tr>
                </thead>
                <tbody>
                  {(catalog?.modules ?? []).map((module) => {
                    const granted = draft.permissions[module.key] ?? []
                    const all = granted.length === module.actions.length
                    return (
                      <tr key={module.key} className="border-b border-line last:border-b-0">
                        <td className={cn(incTableTd, 'font-medium text-content')}>{module.label}</td>
                        {(catalog?.actions ?? []).map((action) => (
                          <td key={action} className={cn(incTableTd, 'text-center')}>
                            {module.actions.includes(action) ? (
                              <input
                                type="checkbox"
                                className="size-4 cursor-pointer accent-[var(--page-color)] disabled:cursor-not-allowed"
                                checked={granted.includes(action)}
                                disabled={readOnly}
                                onChange={(e) => toggle(module.key, action, e.target.checked)}
                                aria-label={`${ACTION_LABELS[action]} en ${module.label}`}
                              />
                            ) : (
                              <span aria-hidden className="text-line-strong">
                                –
                              </span>
                            )}
                          </td>
                        ))}
                        <td className={cn(incTableTd, 'text-center')}>
                          <input
                            type="checkbox"
                            className="size-4 cursor-pointer accent-[var(--page-color)] disabled:cursor-not-allowed"
                            checked={all}
                            disabled={readOnly}
                            onChange={(e) => toggleRow(module.key, module.actions, e.target.checked)}
                            aria-label={`Todos los permisos en ${module.label}`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Acciones */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
              <div>
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
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  {dirty && <span className="text-[13px] text-muted">Cambios sin guardar</span>}
                  <Button variant="secondary" onClick={discard} disabled={!dirty || saving}>
                    Descartar
                  </Button>
                  <Button onClick={save} loading={saving} disabled={!dirty || !valid}>
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
        title="Eliminar rol"
        message={`¿Seguro que quieres eliminar el rol “${selected?.name ?? ''}”? Esta acción no se puede deshacer.`}
        type="danger"
        confirmText="Sí, eliminar"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
