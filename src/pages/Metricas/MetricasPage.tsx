import React, { useState, useEffect } from 'react'
import { getDashboardPerformance, getDashboardOffenders } from '../../api/statistics'
import { FiUsers, FiUserX, FiFileText, FiCheckCircle, FiClock, FiEdit2, FiXCircle } from 'react-icons/fi'
import type { DashboardOffenders, DashboardPerformance } from '@/types'
import { cn, cardClass, incTable, incTableTh, incTableTr, incTableTd } from '@/utils/classes'
import PageHeader from '@/components/UI/PageHeader'
import SearchInput from '@/components/UI/SearchInput'
import Badge from '@/components/UI/Badge'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'

const ROL_LABEL: Record<string, string> = {
  ADMINISTRATOR: 'Admin',
  SUPERVISOR: 'Supervisor',
  SENTINEL: 'Centinela',
  VALIDATOR: 'Validador',
}

// Celda de tabla alineada a la derecha (incTableTh ya trae text-left; se sobreescribe con arbitrary property)
const TH_RIGHT = `${incTableTh} [text-align:right]`
const TD_RIGHT = `${incTableTd} text-right tabular-nums`

const TABLE_WRAP = 'overflow-x-auto'
const TABS = {
  base: 'inline-flex -mb-px cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
  on: 'border-primary text-primary',
  off: 'border-transparent text-muted hover:text-content',
}

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const TONE_CLASS: Record<Tone, string> = {
  primary: 'bg-[rgba(30,58,138,0.08)] text-primary',
  success: 'bg-[rgba(16,185,129,0.12)] text-[#047857]',
  warning: 'bg-[rgba(245,158,11,0.14)] text-[#b45309]',
  danger: 'bg-[rgba(239,68,68,0.10)] text-[#b91c1c]',
  neutral: 'bg-subtle text-content-2',
}

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: Tone;
}

function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] text-muted">{label}</span>
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-base', TONE_CLASS[tone])} aria-hidden>
          {icon}
        </span>
      </div>
      <span className="text-3xl font-semibold tabular-nums text-content">{value}</span>
    </div>
  )
}

export interface StatusBarProps {
  approved: number;
  pending: number;
  draft: number;
  rejected: number;
  total: number;
}

function StatusBar({ approved, pending, draft, rejected, total }: StatusBarProps) {
  if (total === 0) return <span className="text-sm text-muted">—</span>
  const pct = (n: number) => (n / total) * 100
  const segments = [
    { val: approved, cls: 'bg-success',     label: 'aprobadas' },
    { val: pending,  cls: 'bg-warning',     label: 'pendientes' },
    { val: draft,    cls: 'bg-line-strong', label: 'borradores' },
    { val: rejected, cls: 'bg-danger',      label: 'rechazadas' },
  ].filter(s => s.val > 0)
  const summary = segments.map(s => `${s.val} ${s.label}`).join(', ')
  return (
    <div role="img" aria-label={summary} className="flex h-1.5 w-full min-w-[120px] overflow-hidden rounded-full bg-subtle">
      {segments.map((s, i) => (
        <div key={i} title={`${s.val} ${s.label}`} className={cn('h-full', s.cls)} style={{ width: `${pct(s.val)}%` }} />
      ))}
    </div>
  )
}

// ── Tab de usuarios ──────────────────────────────────────────────────────────
export interface TabUsuariosProps {
  start: string;
  end: string;
}

function TabUsuarios({ start, end }: TabUsuariosProps) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [data, setData]           = useState<Partial<DashboardPerformance> | null>(null)
  const [search, setSearch]       = useState('')

  useEffect(() => { fetchData() }, [start, end])

  const fetchData = async () => {
    if (!start || !end) return
    setLoading(true); setError(null)
    try {
      const res = await getDashboardPerformance(start, end)
      setData((res?.data || res) as Partial<DashboardPerformance>)
    } catch { setError('No se pudieron cargar los datos.') }
    finally { setLoading(false) }
  }

  const general     = data?.general || { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 }
  const performance = (data?.performance || []).filter(u =>
    !search.trim() || `${u.name} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {error && <div role="alert" className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={<FiFileText />}   label="Total"      value={general.total}    tone="primary" />
        <StatCard icon={<FiCheckCircle />} label="Aprobadas"  value={general.approved} tone="success" />
        <StatCard icon={<FiClock />}      label="Pendientes" value={general.pending}  tone="warning" />
        <StatCard icon={<FiEdit2 />}      label="Borradores" value={general.draft}    tone="neutral" />
        <StatCard icon={<FiXCircle />}    label="Rechazadas" value={general.rejected} tone="danger" />
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-[15px] font-semibold text-content">Ranking de usuarios</h3>
            <Badge tone="neutral" dot={false}>{performance.length} usuario{performance.length !== 1 ? 's' : ''}</Badge>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre" />
        </div>

        {loading ? <LoadingState label="Cargando datos…" />
          : performance.length === 0 ? (
            search.trim()
              ? <EmptyState title="Sin resultados" description={`No hay usuarios que coincidan con “${search.trim()}”.`} />
              : <EmptyState title="No hay datos en el rango seleccionado" description="Amplía el rango de fechas y vuelve a aplicar." />
          ) : (
          <div className={TABLE_WRAP}>
            <table className={incTable}>
              <thead>
                <tr>
                  <th className={cn(incTableTh, 'w-12')}>#</th>
                  <th className={incTableTh}>Usuario</th>
                  <th className={TH_RIGHT}>Total</th>
                  <th className={TH_RIGHT}>Aprobadas</th>
                  <th className={TH_RIGHT}>Pendientes</th>
                  <th className={TH_RIGHT}>Borradores</th>
                  <th className={TH_RIGHT}>Rechazadas</th>
                  <th className={cn(incTableTh, 'min-w-[160px]')}>Distribución</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((u, i) => (
                  <tr key={u.id} className={incTableTr}>
                    <td className={cn(incTableTd, 'text-muted tabular-nums')}>{i + 1}</td>
                    <td className={incTableTd}>
                      <div className="font-medium text-content">{u.name} {u.lastname}</div>
                      <div className="text-xs text-muted">{ROL_LABEL[u.rol] || u.rol}</div>
                    </td>
                    <td className={cn(TD_RIGHT, 'font-semibold text-content')}>{u.total}</td>
                    <td className={TD_RIGHT}>{u.approved}</td>
                    <td className={TD_RIGHT}>{u.pending}</td>
                    <td className={TD_RIGHT}>{u.draft}</td>
                    <td className={TD_RIGHT}>{u.rejected}</td>
                    <td className={incTableTd}>
                      <StatusBar approved={u.approved} pending={u.pending}
                        draft={u.draft} rejected={u.rejected} total={u.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Tab de infractores ───────────────────────────────────────────────────────
export interface TabInfractoresProps {
  start: string;
  end: string;
}

function TabInfractores({ start, end }: TabInfractoresProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [data, setData]       = useState<Partial<DashboardOffenders> | null>(null)
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchData() }, [start, end])

  const fetchData = async () => {
    if (!start || !end) return
    setLoading(true); setError(null)
    try {
      const res = await getDashboardOffenders(start, end)
      setData((res?.data || res) as Partial<DashboardOffenders>)
    } catch { setError('No se pudieron cargar los datos de infractores.') }
    finally { setLoading(false) }
  }

  const general     = data?.general || { totalReports: 0, totalOffenders: 0 }
  const performance = (data?.performance || []).filter(o =>
    !search.trim() ||
    `${o.name} ${o.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    (o.dni || '').includes(search)
  )

  return (
    <>
      {error && <div role="alert" className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={<FiFileText />} label="Total infracciones" value={general.totalReports}   tone="primary" />
        <StatCard icon={<FiUserX />}    label="Infractores"        value={general.totalOffenders} tone="warning" />
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-[15px] font-semibold text-content">Ranking de infractores</h3>
            <Badge tone="neutral" dot={false}>{performance.length} infractor{performance.length !== 1 ? 'es' : ''}</Badge>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o DNI" />
        </div>

        {loading ? <LoadingState label="Cargando datos…" />
          : performance.length === 0 ? (
            search.trim()
              ? <EmptyState title="Sin resultados" description={`No hay infractores que coincidan con “${search.trim()}”.`} />
              : <EmptyState title="No hay datos en el rango seleccionado" description="Amplía el rango de fechas y vuelve a aplicar." />
          ) : (
          <div className={TABLE_WRAP}>
            <table className={incTable}>
              <thead>
                <tr>
                  <th className={cn(incTableTh, 'w-12')}>#</th>
                  <th className={incTableTh}>DNI</th>
                  <th className={incTableTh}>Nombre</th>
                  <th className={TH_RIGHT}>Total</th>
                  <th className={incTableTh}>Tipos de falta</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((o, i) => (
                  <tr key={o.id} className={incTableTr}>
                    <td className={cn(incTableTd, 'text-muted tabular-nums')}>{i + 1}</td>
                    <td className={cn(incTableTd, 'font-mono text-sm')}>{o.dni || '—'}</td>
                    <td className={incTableTd}>
                      <div className="font-medium text-content">{o.name} {o.lastname}</div>
                      <div className="text-xs text-muted">
                        {[o.subgerencia, o.job].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
                    <td className={cn(TD_RIGHT, 'font-semibold text-content')}>{o.total}</td>
                    <td className={incTableTd}>
                      <div className="flex flex-wrap gap-1.5">
                        {o.byLack.map((l, li) => (
                          <span key={li} className="inline-flex max-w-[260px] items-center gap-1.5 truncate rounded-md bg-subtle px-2 py-0.5 text-xs text-content-2">
                            <span className="font-semibold text-content">{l.count}</span>
                            {l.lack}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function MetricasPage() {
  const today        = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const todayStr     = today.toISOString().split('T')[0]

  const [start, setStart]   = useState(firstOfMonth)
  const [end, setEnd]       = useState(todayStr)
  const [applied, setApplied] = useState({ start: firstOfMonth, end: todayStr })
  const [tab, setTab]       = useState<'usuarios' | 'infractores'>('usuarios')

  const handleApply = () => {
    if (!start || !end) return
    setApplied({ start, end })
  }

  return (
    <div className="box-border flex w-full min-w-0 flex-col gap-6 p-6 max-[860px]:p-4 max-[560px]:p-3">

      <PageHeader
        title="Estadísticas"
        description="Incidencias por usuario e infractor en el período elegido."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Desde" className="w-[160px]">
            <Input type="date" className="h-9" value={start} onChange={e => setStart(e.target.value)} />
          </Field>
          <Field label="Hasta" className="w-[160px]">
            <Input type="date" className="h-9" value={end} onChange={e => setEnd(e.target.value)} />
          </Field>
          <Button onClick={handleApply}>Aplicar</Button>
        </div>
      </PageHeader>

      <div role="tablist" className="flex gap-1 border-b border-line">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'usuarios'}
          className={cn(TABS.base, tab === 'usuarios' ? TABS.on : TABS.off)}
          onClick={() => setTab('usuarios')}
        >
          <FiUsers aria-hidden /> Usuarios
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'infractores'}
          className={cn(TABS.base, tab === 'infractores' ? TABS.on : TABS.off)}
          onClick={() => setTab('infractores')}
        >
          <FiUserX aria-hidden /> Infractores
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {tab === 'usuarios'    && <TabUsuarios    start={applied.start} end={applied.end} />}
        {tab === 'infractores' && <TabInfractores start={applied.start} end={applied.end} />}
      </div>

    </div>
  )
}
