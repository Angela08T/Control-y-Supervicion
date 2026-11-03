import React, { useState, useEffect } from 'react'
import { getDashboardPerformance, getDashboardOffenders } from '../../api/statistics'
import {
  FaUsers, FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaEdit, FaMedal, FaSearch, FaChartBar, FaUserTimes, FaIdCard
} from 'react-icons/fa'
import type { DashboardOffenders, DashboardPerformance } from '@/types'
import { cn } from '../../utils/classes'

const ROL_LABEL: Record<string, string> = {
  ADMINISTRATOR: 'Admin',
  SUPERVISOR: 'Supervisor',
  SENTINEL: 'Centinela',
  VALIDATOR: 'Validador',
}

// Paleta de colores para los badges de faltas
const LACK_COLORS = [
  '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#22c55e', '#ec4899', '#06b6d4', '#f97316',
]

// ── Clases compartidas de la página ──────────────────────────────────────────
// Los bordes parciales usan `border-b` sin `border-solid`: con `border-solid` los
// lados no declarados tomarian un ancho medio (3px) y se verian.
const TH = 'border-b border-line px-3 py-2.5 text-[0.73rem] font-semibold uppercase tracking-[0.04em] whitespace-nowrap [background:var(--bg)]'
const TD = 'border-b border-line px-3 py-[11px] align-middle'
const TD_TXT = `${TD} text-[0.87rem]`
const HIDE_MD = 'max-[1100px]:hidden!'
const HIDE_SM = 'max-[860px]:hidden!'
const HIDE_XS = 'max-[560px]:hidden!'
const AVATAR = 'flex size-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold text-primary [background:color-mix(in_srgb,var(--primary,#3b82f6)_20%,transparent)]'
const AVATAR_RED = 'flex size-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold text-[#ef4444]! [background:rgba(239,68,68,0.15)]!'
const SEARCH_WRAP = 'relative min-w-[140px] max-w-[220px] flex-1 max-[560px]:max-w-full'
const SEARCH_ICON = 'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.78rem] text-muted'
const SEARCH_INPUT = 'box-border w-full rounded-lg border border-line py-[7px] pr-3 pl-7 text-[0.84rem] [background:var(--bg)] [color:inherit] focus:border-primary focus:outline-none'
const TABLE_CARD_HEADER = 'flex flex-wrap items-center justify-between gap-3 border-b border-line px-[18px] py-3.5 max-[560px]:flex-col max-[560px]:items-stretch'
const TITLE_ROW = 'flex shrink-0 items-center gap-2'
const BADGE = 'rounded-[20px] bg-line px-2.5 py-0.5 text-[0.75rem] font-semibold text-muted'
const TABLE_SCROLL = 'w-full overflow-x-auto'
const TABLE = 'w-full min-w-[480px] border-collapse'
const TAB_CARD = 'min-w-0 overflow-hidden rounded-xl border border-line'
const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#cd7c2f']

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-xl border border-line px-4 py-[18px] max-[560px]:gap-2.5 max-[560px]:px-3 max-[560px]:py-3.5"
      style={{ '--met-color': color } as React.CSSProperties}
    >
      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] text-[1.1rem] text-white opacity-90 [background:var(--met-color,#3b82f6)]">{icon}</div>
      <div className="min-w-0">
        <div className="text-[1.7rem] font-bold leading-none max-[560px]:text-[1.4rem]">{value}</div>
        <div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.76rem] text-muted">{label}</div>
      </div>
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
  if (total === 0) return <span className="text-[0.85rem] text-muted">—</span>
  const pct = (n: number) => Math.round((n / total) * 100)
  const segments = [
    { val: approved, color: '#22c55e', label: 'Apr' },
    { val: pending,  color: '#f59e0b', label: 'Pen' },
    { val: draft,    color: '#94a3b8', label: 'Bor' },
    { val: rejected, color: '#ef4444', label: 'Rec' },
  ].filter(s => s.val > 0)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex min-w-[60px] flex-1 overflow-hidden rounded bg-line h-2">
        {segments.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.val}`}
            className="h-full min-w-[3px] w-(--seg-w) [background:var(--seg-c)] transition-[width]! duration-300! ease-[ease]!"
            style={{ '--seg-w': `${pct(s.val)}%`, '--seg-c': s.color } as React.CSSProperties} />
        ))}
      </div>
      <span className="flex flex-wrap gap-1 whitespace-nowrap text-[0.73rem] text-muted">
        {segments.map((s, i) => (
          <span key={i} className="whitespace-nowrap">
            <span className="font-semibold [color:var(--seg-c)]" style={{ '--seg-c': s.color } as React.CSSProperties}>{s.val}</span>
            <span className="opacity-70">&nbsp;{s.label}</span>
          </span>
        ))}
      </span>
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
      {error && <div className="rounded-lg bg-[#fee2e2] px-4 py-3 text-[0.88rem] text-[#b91c1c]">{error}</div>}

      <div className="grid grid-cols-[repeat(5,1fr)] gap-3 max-[1100px]:grid-cols-[repeat(3,1fr)] max-[860px]:grid-cols-[repeat(2,1fr)] max-[560px]:gap-2 max-[360px]:grid-cols-[1fr_1fr]">
        <StatCard icon={<FaFileAlt />}     label="Total"      value={general.total}    color="#3b82f6" />
        <StatCard icon={<FaCheckCircle />} label="Aprobadas"  value={general.approved} color="#22c55e" />
        <StatCard icon={<FaClock />}       label="Pendientes" value={general.pending}  color="#f59e0b" />
        <StatCard icon={<FaEdit />}        label="Borradores" value={general.draft}    color="#94a3b8" />
        <StatCard icon={<FaTimesCircle />} label="Rechazadas" value={general.rejected} color="#ef4444" />
      </div>

      <div className={TAB_CARD}>
        <div className={TABLE_CARD_HEADER}>
          <div className={TITLE_ROW}>
            <FaUsers className="text-primary" />
            <span className="text-[0.95rem] font-semibold">Ranking de Usuarios</span>
            <span className={BADGE}>{performance.length} usuario{performance.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={SEARCH_WRAP}>
            <FaSearch className={SEARCH_ICON} />
            <input type="text" placeholder="Buscar usuario..." value={search}
              onChange={e => setSearch(e.target.value)} className={SEARCH_INPUT} />
          </div>
        </div>

        <div className={TABLE_SCROLL}>
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={`${TH} text-center text-muted`}>#</th>
                <th className={`${TH} text-left text-muted`}>Usuario</th>
                <th className={`${TH} text-center text-muted ${HIDE_SM}`}>Rol</th>
                <th className={`${TH} text-center text-muted`}>Total</th>
                <th className={`${TH} text-center text-[#22c55e] font-semibold`}>Apr.</th>
                <th className={`${TH} text-center text-[#f59e0b] font-semibold ${HIDE_XS}`}>Pen.</th>
                <th className={`${TH} text-center text-[#94a3b8] font-semibold ${HIDE_SM}`}>Bor.</th>
                <th className={`${TH} text-center text-[#ef4444] font-semibold ${HIDE_XS}`}>Rec.</th>
                <th className={`${TH} text-left text-muted ${HIDE_MD} min-w-[180px]`}>Distribución</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="p-10 text-center text-muted">Cargando datos…</td></tr>}
              {!loading && performance.length === 0 && (
                <tr><td colSpan={9} className="p-10 text-center text-muted">No hay datos para el período seleccionado</td></tr>
              )}
              {!loading && performance.map((u, i) => {
                const initials    = `${u.name?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase()
                const medalColors = MEDAL_COLORS
                return (
                  <tr key={u.id} className={cn('last:[&>td]:border-b-0', i % 2 === 1 && '[background:var(--bg)]')}>
                    <td className={`${TD_TXT} text-center`}>
                      {i < 3 ? <FaMedal style={{ color: medalColors[i] }} title={`#${i+1}`} />
                              : <span className="font-semibold text-muted">{i + 1}</span>}
                    </td>
                    <td className={TD_TXT}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className={AVATAR}>{initials || '?'}</div>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">{u.name} {u.lastname}</span>
                      </div>
                    </td>
                    <td className={`${TD_TXT} text-center ${HIDE_SM}`}>
                      <span className="whitespace-nowrap rounded-md bg-line px-2 py-0.5 text-[0.75rem] text-muted">{ROL_LABEL[u.rol] || u.rol}</span>
                    </td>
                    <td className={`${TD} text-center text-[1rem] font-bold`}>{u.total}</td>
                    <td className={`${TD_TXT} text-center text-[#22c55e] font-semibold`}>{u.approved}</td>
                    <td className={`${TD_TXT} text-center text-[#f59e0b] font-semibold ${HIDE_XS}`}>{u.pending}</td>
                    <td className={`${TD_TXT} text-center text-[#94a3b8] font-semibold ${HIDE_SM}`}>{u.draft}</td>
                    <td className={`${TD_TXT} text-center text-[#ef4444] font-semibold ${HIDE_XS}`}>{u.rejected}</td>
                    <td className={`${TD_TXT} min-w-[180px] ${HIDE_MD}`}>
                      <StatusBar approved={u.approved} pending={u.pending}
                        draft={u.draft} rejected={u.rejected} total={u.total} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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

  // Recopilar todos los tipos de falta únicos para asignar color consistente
  const allLacks = [...new Set(
    performance.flatMap(o => o.byLack.map(l => l.lack))
  )]
  const lackColor = (lack: string) => LACK_COLORS[allLacks.indexOf(lack) % LACK_COLORS.length]

  return (
    <>
      {error && <div className="rounded-lg bg-[#fee2e2] px-4 py-3 text-[0.88rem] text-[#b91c1c]">{error}</div>}

      <div className="grid grid-cols-[repeat(5,1fr)] gap-3 max-[1100px]:grid-cols-[repeat(3,1fr)] max-[860px]:grid-cols-[repeat(2,1fr)] max-[560px]:gap-2 max-[360px]:grid-cols-[1fr_1fr]">
        <StatCard icon={<FaFileAlt />}    label="Total Infracciones" value={general.totalReports}   color="#ef4444" />
        <StatCard icon={<FaUserTimes />}  label="Infractores"        value={general.totalOffenders} color="#f59e0b" />
      </div>

      <div className={TAB_CARD}>
        <div className={TABLE_CARD_HEADER}>
          <div className={TITLE_ROW}>
            <FaUserTimes className="text-danger" />
            <span className="text-[0.95rem] font-semibold">Ranking de Infractores</span>
            <span className={BADGE}>{performance.length} infractor{performance.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className={SEARCH_WRAP}>
            <FaSearch className={SEARCH_ICON} />
            <input type="text" placeholder="Buscar nombre o DNI..." value={search}
              onChange={e => setSearch(e.target.value)} className={SEARCH_INPUT} />
          </div>
        </div>

        <div className={TABLE_SCROLL}>
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={`${TH} text-center text-muted`}>#</th>
                <th className={`${TH} text-center text-muted`}>DNI</th>
                <th className={`${TH} text-left text-muted`}>Nombre</th>
                <th className={`${TH} text-left text-muted ${HIDE_SM}`}>Subgerencia</th>
                <th className={`${TH} text-left text-muted ${HIDE_SM}`}>Cargo</th>
                <th className={`${TH} text-center text-muted`}>Total</th>
                <th className={`${TH} text-left text-muted ${HIDE_XS}`}>Tipos de Falta</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-10 text-center text-muted">Cargando datos…</td></tr>}
              {!loading && performance.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-muted">No hay infracciones en el período seleccionado</td></tr>
              )}
              {!loading && performance.map((o, i) => {
                const initials    = `${o.name?.[0] || ''}${o.lastname?.[0] || ''}`.toUpperCase()
                const medalColors = MEDAL_COLORS
                return (
                  <tr key={o.id} className={cn('last:[&>td]:border-b-0', i % 2 === 1 && '[background:var(--bg)]')}>
                    <td className={`${TD_TXT} text-center`}>
                      {i < 3 ? <FaMedal style={{ color: medalColors[i] }} title={`#${i+1}`} />
                              : <span className="font-semibold text-muted">{i + 1}</span>}
                    </td>
                    <td className={`${TD_TXT} text-center`}>
                      <span className="inline-flex items-center gap-[5px] whitespace-nowrap text-[0.88rem] [font-family:monospace]!">
                        <FaIdCard className="opacity-50 text-[0.7rem]" />
                        {o.dni || '—'}
                      </span>
                    </td>
                    <td className={TD_TXT}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className={AVATAR_RED}>{initials || '?'}</div>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">{o.name} {o.lastname}</span>
                      </div>
                    </td>
                    <td className={`${TD_TXT} ${HIDE_SM}`}>
                      <span className="block max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] text-muted">{o.subgerencia || '—'}</span>
                    </td>
                    <td className={`${TD_TXT} ${HIDE_SM}`}>
                      <span className="block max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] text-muted">{o.job || '—'}</span>
                    </td>
                    <td className={`${TD_TXT} text-center`}>
                      <span className="text-[1rem] font-bold text-danger">{o.total}</span>
                    </td>
                    <td className={`${TD_TXT} ${HIDE_XS}`}>
                      <div className="flex flex-wrap gap-[5px]">
                        {o.byLack.map((l, li) => (
                          <span key={li}
                            className="inline-flex max-w-[260px] items-center gap-[5px] overflow-hidden text-ellipsis whitespace-nowrap rounded-md border px-[9px] py-[3px] text-[0.74rem] font-medium"
                            style={{ background: `${lackColor(l.lack)}18`, color: lackColor(l.lack),
                                     borderColor: `${lackColor(l.lack)}40` }}>
                            <span className="mr-0.5 text-[0.82rem] font-extrabold">{l.count}</span>
                            {l.lack}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
    <div className="box-border flex w-full min-w-0 flex-col gap-5 p-6 max-[860px]:gap-3.5 max-[860px]:p-4 max-[560px]:gap-3 max-[560px]:p-3">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-[860px]:flex-col max-[860px]:items-stretch">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] text-[1.2rem] text-primary"><FaChartBar /></div>
          <div>
            <h2 className="m-0 whitespace-nowrap text-[1.3rem] font-bold max-[560px]:text-[1.1rem]">Métricas</h2>
            <p className="m-0 mt-[3px] text-[0.82rem] text-muted">Estadísticas de incidencias por período</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 max-[860px]:justify-start max-[560px]:gap-2">
          <div className="flex items-center gap-1.5 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-[3px]">
            <label className="whitespace-nowrap text-[0.8rem] font-medium text-muted">Desde</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)}
              className="w-[140px] min-w-0 rounded-lg border border-line bg-transparent px-2.5 py-[7px] text-[0.84rem] [color:inherit] max-[860px]:w-[130px] max-[560px]:w-full" />
          </div>
          <div className="flex items-center gap-1.5 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-[3px]">
            <label className="whitespace-nowrap text-[0.8rem] font-medium text-muted">Hasta</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
              className="w-[140px] min-w-0 rounded-lg border border-line bg-transparent px-2.5 py-[7px] text-[0.84rem] [color:inherit] max-[860px]:w-[130px] max-[560px]:w-full" />
          </div>
          <button onClick={handleApply}
            className="cursor-pointer whitespace-nowrap rounded-lg border-none bg-primary px-5 py-2 text-[0.85rem] font-semibold text-white transition-[opacity]! duration-200! ease-[ease]! not-disabled:hover:opacity-[0.88] disabled:cursor-not-allowed disabled:opacity-60 max-[560px]:w-full max-[560px]:text-center">
            Aplicar
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1.5 border-b-2 border-line">
        <button
          className={cn(
            'inline-flex cursor-pointer items-center gap-[7px] border-x-0 border-t-0 border-b-2 bg-transparent px-5 py-[9px] text-[0.87rem] font-semibold -mb-0.5 rounded-t-[6px] transition-[color,border-color,background]! duration-150! ease-[ease]! hover:bg-line hover:[color:inherit]',
            tab === 'usuarios' ? 'text-primary border-b-primary' : 'text-muted border-b-transparent'
          )}
          onClick={() => setTab('usuarios')}
        >
          <FaUsers /> Usuarios
        </button>
        <button
          className={cn(
            'inline-flex cursor-pointer items-center gap-[7px] border-x-0 border-t-0 border-b-2 bg-transparent px-5 py-[9px] text-[0.87rem] font-semibold -mb-0.5 rounded-t-[6px] transition-[color,border-color,background]! duration-150! ease-[ease]! hover:bg-line hover:[color:inherit]',
            tab === 'infractores' ? 'text-primary border-b-primary' : 'text-muted border-b-transparent'
          )}
          onClick={() => setTab('infractores')}
        >
          <FaUserTimes /> Infractores
        </button>
      </div>

      {/* ── CONTENIDO ── */}
      {tab === 'usuarios'    && <TabUsuarios    start={applied.start} end={applied.end} />}
      {tab === 'infractores' && <TabInfractores start={applied.start} end={applied.end} />}

    </div>
  )
}
