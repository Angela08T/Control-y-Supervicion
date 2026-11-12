import React, { useState, useEffect } from 'react'
import { getDashboardPerformance, getDashboardOffenders } from '../../api/statistics'
import {
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiChevronUp,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiEdit2,
  FiFileText,
  FiList,
  FiPieChart,
  FiRepeat,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiUserX,
  FiXCircle,
} from 'react-icons/fi'
import type { DashboardOffenders, DashboardPerformance } from '@/types'
import { cn, incTable, incTableTh, incTableTr, incTableTd } from '@/utils/classes'
import SearchInput from '@/components/UI/SearchInput'
import { EmptyState, LoadingState } from '@/components/UI/EmptyState'
import Pagination from '@/components/UI/Pagination'
import { usePagedList } from '@/hooks/usePagedList'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
import DateRangeModal from '../Dashboard/components/DateRangeModal'
import { Columns, Legend, RankedBars, Scatter, SegmentedBar, StackedBarList, TipRow } from './charts'

const ROL_LABEL: Record<string, string> = {
  ADMINISTRATOR: 'Admin',
  SUPERVISOR: 'Supervisor',
  SENTINEL: 'Centinela',
  VALIDATOR: 'Validador',
}

// Celda de tabla alineada a la derecha (incTableTh ya trae text-left; se sobreescribe con arbitrary property)
const TH_RIGHT = `${incTableTh} [text-align:right]`
const TD_RIGHT = `${incTableTd} text-right tabular-nums`

/** Tarjeta de la pagina: borde suave y sombra azulada (como Incidencias) */
const card =
  'rounded-2xl border border-[#d3dceb] bg-surface shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line'

const TAB_OPTIONS: { key: 'usuarios' | 'infractores'; label: string; icon: React.ReactNode }[] = [
  { key: 'usuarios', label: 'Usuarios', icon: <FiUsers aria-hidden /> },
  { key: 'infractores', label: 'Infractores', icon: <FiUserX aria-hidden /> },
]

type Tone = 'success' | 'warning' | 'danger' | 'neutral'

/** Colores por estado: icono, numero y barra */
const TONE: Record<Tone, { icon: string; bar: string; text: string }> = {
  success: { icon: 'bg-success/12 text-lime-ink', bar: 'bg-success', text: 'text-lime-ink' },
  warning: { icon: 'bg-warning/14 text-amber-ink', bar: 'bg-warning', text: 'text-amber-ink' },
  danger: { icon: 'bg-danger/10 text-red-ink', bar: 'bg-danger', text: 'text-red-ink' },
  neutral: { icon: 'bg-subtle text-content-2', bar: 'bg-line-strong', text: 'text-content-2' },
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

/** 'YYYY-MM-DD' en hora local (toISOString usaria UTC y podria saltar al dia siguiente) */
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ── Piezas ───────────────────────────────────────────────────────────────────

/** Tarjeta destacada en azul: el numero principal del periodo */
function HeroCard({ label, value, detail, icon }: { label: string; value: number; detail: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#10265f_0%,#14296b_55%,#1b3b8f_100%)] p-5 text-white shadow-[0_22px_44px_-22px_rgba(10,22,61,0.85)]">
      <span aria-hidden className="pointer-events-none absolute -top-14 -right-10 size-40 rounded-full bg-white/6" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 right-16 size-32 rounded-full bg-white/4" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-white/80">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/12 text-base ring-1 ring-white/15" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="relative m-0 mt-3 text-[40px] leading-none font-bold tracking-[-0.02em] tabular-nums">{value.toLocaleString('es-PE')}</p>
      <div className="relative mt-3 text-xs text-white/80">{detail}</div>
    </div>
  )
}

/** Tarjeta de un estado: numero, porcentaje del total y barra */
function StatCard({ icon, label, value, total, tone }: { icon: React.ReactNode; label: string; value: number; total?: number; tone: Tone }) {
  const t = TONE[tone]
  const p = total !== undefined ? pct(value, total) : null
  return (
    <div className={cn(card, 'flex min-w-0 flex-col gap-3 p-4')}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[13px] font-medium text-content-2">{label}</span>
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl text-base', t.icon)} aria-hidden>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums dark:text-content">{value.toLocaleString('es-PE')}</span>
        {p !== null && <span className={cn('text-[13px] font-semibold tabular-nums', t.text)}>{p}%</span>}
      </div>
      {p !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
          <div className={cn('h-full rounded-full transition-[width] duration-500', t.bar)} style={{ width: `${p}%` }} />
        </div>
      )}
    </div>
  )
}

export interface StatusBarProps {
  approved: number;
  pending: number;
  draft: number;
  rejected: number;
  total: number;
  /** Barra mas alta, con leyenda (resumen general) */
  large?: boolean;
}

const SEGMENTOS = [
  { key: 'approved', cls: 'bg-viz-approved', label: 'Aprobadas', color: 'var(--viz-approved)' },
  { key: 'pending', cls: 'bg-viz-pending', label: 'Pendientes', color: 'var(--viz-pending)' },
  { key: 'draft', cls: 'bg-viz-draft', label: 'Borradores', color: 'var(--viz-draft)' },
  { key: 'rejected', cls: 'bg-viz-rejected', label: 'Rechazadas', color: 'var(--viz-rejected)' },
] as const

function StatusBar({ approved, pending, draft, rejected, total, large = false }: StatusBarProps) {
  if (total === 0) return <span className="text-sm text-muted">—</span>
  const vals = { approved, pending, draft, rejected }
  const segments = SEGMENTOS.filter(s => vals[s.key] > 0)
  const summary = segments.map(s => `${vals[s.key]} ${s.label.toLowerCase()}`).join(', ')
  return (
    <div className="flex w-full min-w-[140px] flex-col gap-2">
      <div
        role="img"
        aria-label={summary}
        className={cn('flex w-full gap-0.5 overflow-hidden rounded-full bg-subtle', large ? 'h-3' : 'h-2')}
      >
        {segments.map(s => (
          <div
            key={s.key}
            title={`${vals[s.key]} ${s.label.toLowerCase()} (${pct(vals[s.key], total)}%)`}
            className={cn('h-full first:rounded-l-full last:rounded-r-full', s.cls)}
            style={{ width: `${(vals[s.key] / total) * 100}%` }}
          />
        ))}
      </div>
      {large && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-content-2">
          {SEGMENTOS.map(s => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-full', s.cls)} aria-hidden />
              {s.label}
              <strong className="font-semibold text-content tabular-nums">{pct(vals[s.key], total)}%</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Avatar con iniciales */
function Avatar({ nombre, clave, size = 'md' }: { nombre: string; clave: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center font-bold text-white',
        size === 'lg' ? 'size-12 rounded-2xl text-base' : 'size-9 rounded-xl text-xs'
      )}
      style={{ background: colorAvatar(clave) }}
      aria-hidden
    >
      {iniciales(nombre)}
    </span>
  )
}

/** Puesto en el ranking: medalla para los tres primeros */
function Puesto({ n }: { n: number }) {
  const medalla = ['bg-[linear-gradient(135deg,#f2a50f,#f7c948)] text-[#4a3000]', 'bg-[linear-gradient(135deg,#94a3b8,#cbd5e1)] text-[#1e293b]', 'bg-[linear-gradient(135deg,#b45309,#d97706)] text-white']
  if (n <= 3) {
    return (
      <span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold shadow-sm', medalla[n - 1])} aria-label={`Puesto ${n}`}>
        {n}
      </span>
    )
  }
  return <span className="flex size-7 items-center justify-center text-xs font-semibold text-muted tabular-nums">{n}</span>
}

/** Encabezado de la tarjeta del ranking: icono, titulo, cantidad y buscador */
function RankingHeader({ icon, title, count, search, onSearch, placeholder }: {
  icon: React.ReactNode; title: string; count: string; search: string; onSearch: (v: string) => void; placeholder: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 max-sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary dark:bg-primary/25 dark:text-accent-light" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="m-0 text-[15px] font-semibold text-content">{title}</h3>
          <p className="m-0 text-xs text-muted">{count}</p>
        </div>
      </div>
      <SearchInput value={search} onChange={onSearch} placeholder={placeholder} />
    </div>
  )
}

/** Tarjeta de un grafico: icono, titulo, una linea que dice que responde y acciones */
function ChartCard({ icon, title, question, actions, children, className }: {
  icon: React.ReactNode; title: string; question: string; actions?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <section className={cn(card, 'flex min-w-0 flex-col gap-4 p-5 max-sm:p-4', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary dark:bg-primary/25 dark:text-accent-light" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-semibold text-content">{title}</h3>
            <p className="m-0 text-xs text-muted">{question}</p>
          </div>
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

/** Boton "Ver todos / Ver menos" bajo una lista larga */
function VerTodos({ abierto, total, visibles, onToggle }: { abierto: boolean; total: number; visibles: number; onToggle: () => void }) {
  if (total <= visibles && !abierto) return null
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex cursor-pointer items-center gap-1.5 self-center rounded-lg border-none bg-transparent px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/8 dark:text-accent-light dark:hover:bg-primary/20"
    >
      {abierto ? <FiChevronUp aria-hidden /> : <FiChevronDown aria-hidden />}
      {abierto ? 'Ver menos' : `Ver todos (${total})`}
    </button>
  )
}

export type Vista = 'graficos' | 'tabla'

const errorBox = 'flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/6 px-4 py-3 text-sm text-red-ink'

// ── Tab de usuarios ──────────────────────────────────────────────────────────
export interface TabUsuariosProps {
  start: string;
  end: string;
  vista: Vista;
}

function TabUsuarios({ start, end, vista }: TabUsuariosProps) {
  const [verTodos, setVerTodos] = useState(false)
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
  const todos       = [...(data?.performance || [])].sort((a, b) => b.total - a.total)
  const performance = todos.filter(u =>
    !search.trim() || `${u.name} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  )
  const { pageItems, page, setPage, totalPages, total, from, to } =
    usePagedList(performance, `${search}|${start}|${end}`)
  const maxTotal = Math.max(1, ...todos.map(u => u.total))
  // Puesto real en el ranking (no cambia al buscar)
  const puestoDe = new Map(todos.map((u, i) => [u.id, i + 1]))

  return (
    <>
      {error && <div role="alert" className={errorBox}><FiAlertTriangle aria-hidden />{error}</div>}

      <div className="grid grid-cols-[1.3fr_repeat(4,1fr)] gap-3 max-xl:grid-cols-3 max-sm:grid-cols-2">
        <div className="max-xl:col-span-3 max-sm:col-span-2">
          <HeroCard
            label="Informes del periodo"
            value={general.total}
            icon={<FiFileText />}
            detail={
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/12 px-2 py-1 font-semibold ring-1 ring-white/15">
                <FiTrendingUp aria-hidden /> {pct(general.approved, general.total)}% aprobados
              </span>
            }
          />
        </div>
        <StatCard icon={<FiCheckCircle />} label="Aprobadas"  value={general.approved} total={general.total} tone="success" />
        <StatCard icon={<FiClock />}       label="Pendientes" value={general.pending}  total={general.total} tone="warning" />
        <StatCard icon={<FiEdit2 />}       label="Borradores" value={general.draft}    total={general.total} tone="neutral" />
        <StatCard icon={<FiXCircle />}     label="Rechazadas" value={general.rejected} total={general.total} tone="danger" />
      </div>

      {general.total > 0 && (
        <ChartCard icon={<FiPieChart />} title="Estado de los informes" question="¿Cómo se reparten los informes del periodo?">
          <SegmentedBar
            parts={SEGMENTOS.map(sg => ({
              key: sg.key,
              label: sg.label,
              value: general[sg.key],
              color: sg.color,
              textOn: sg.key === 'pending' ? '#2a1a00' : sg.key === 'draft' ? 'var(--text-primary)' : '#ffffff',
            }))}
          />
        </ChartCard>
      )}

      {vista === 'graficos' && (
        loading ? (
          <div className={card}><LoadingState label="Cargando datos…" /></div>
        ) : todos.length === 0 ? (
          <div className={card}><EmptyState title="No hay datos en el periodo" description="Elige un periodo más amplio." /></div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
            <ChartCard
              icon={<FiBarChart2 />}
              title="Informes por usuario"
              question="¿Quién registra más y en qué estado están sus informes?"
              actions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar usuario" className="max-w-[220px]! max-sm:max-w-none!" />}
            >
              <Legend items={SEGMENTOS.map(sg => ({ label: sg.label, color: sg.color }))} />
              {performance.length === 0 ? (
                <EmptyState title="Sin resultados" description={`No hay usuarios que coincidan con “${search.trim()}”.`} />
              ) : (
                <>
                  <StackedBarList
                    max={maxTotal}
                    rows={(verTodos ? performance : performance.slice(0, 10)).map(u => ({
                      id: String(u.id),
                      name: `${u.name} ${u.lastname}`,
                      sub: `${ROL_LABEL[u.rol] || u.rol} · ${pct(u.approved, u.total)}% aprobados`,
                      segments: SEGMENTOS.map(sg => ({ key: sg.key, label: sg.label, value: u[sg.key], color: sg.color })),
                    }))}
                  />
                  <VerTodos abierto={verTodos} total={performance.length} visibles={10} onToggle={() => setVerTodos(v => !v)} />
                </>
              )}
            </ChartCard>

            <ChartCard icon={<FiTarget />} title="Volumen y calidad" question="¿Quién registra mucho y además con alta aprobación?">
              <Scatter
                xLabel="Informes registrados"
                yLabel="% aprobados"
                points={todos.map((u, i) => ({
                  id: String(u.id),
                  name: `${u.name} ${u.lastname}`,
                  x: u.total,
                  y: pct(u.approved, u.total),
                  label: i < 3,
                }))}
              />
              <p className="m-0 text-xs leading-relaxed text-muted">
                Cada punto es un usuario. Las líneas marcan la mediana del equipo; arriba a la derecha (zona verde) están
                quienes registran más que la mayoría y con mejor aprobación.
              </p>
            </ChartCard>
          </div>
        )
      )}

      {vista === 'tabla' && (
      <div className={cn(card, 'flex flex-col overflow-hidden')}>
        <RankingHeader
          icon={<FiAward />}
          title="Ranking de usuarios"
          count={`${performance.length} usuario${performance.length !== 1 ? 's' : ''} · ordenado por informes`}
          search={search}
          onSearch={setSearch}
          placeholder="Buscar por nombre"
        />

        {loading ? <LoadingState label="Cargando datos…" />
          : performance.length === 0 ? (
            search.trim()
              ? <EmptyState title="Sin resultados" description={`No hay usuarios que coincidan con “${search.trim()}”.`} />
              : <EmptyState title="No hay datos en el periodo" description="Elige un periodo más amplio." />
          ) : (
          <div className="overflow-x-auto">
            <table className={incTable}>
              <thead>
                <tr>
                  <th className={cn(incTableTh, 'w-14 text-center!')}>#</th>
                  <th className={incTableTh}>Usuario</th>
                  <th className={cn(incTableTh, 'min-w-[150px]')}>Total</th>
                  <th className={TH_RIGHT}>Aprob.</th>
                  <th className={TH_RIGHT}>Pend.</th>
                  <th className={TH_RIGHT}>Borr.</th>
                  <th className={TH_RIGHT}>Rech.</th>
                  <th className={cn(incTableTh, 'min-w-[180px]')}>Distribución</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u, i) => (
                  <tr key={u.id} className={incTableTr}>
                    <td className={cn(incTableTd, 'text-center')}>
                      <div className="flex justify-center"><Puesto n={puestoDe.get(u.id) ?? from + i} /></div>
                    </td>
                    <td className={incTableTd}>
                      <div className="flex items-center gap-3">
                        <Avatar nombre={`${u.name} ${u.lastname}`} clave={String(u.id)} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-content">{u.name} {u.lastname}</div>
                          <span className="mt-0.5 inline-flex rounded-md bg-subtle px-1.5 py-px text-[11px] font-semibold text-content-2">
                            {ROL_LABEL[u.rol] || u.rol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={incTableTd}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 text-right text-[15px] font-bold text-content tabular-nums">{u.total}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,#1e3a8a,#3b82f6)]" style={{ width: `${(u.total / maxTotal) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className={cn(TD_RIGHT, u.approved ? 'font-semibold text-lime-ink' : 'text-muted')}>{u.approved}</td>
                    <td className={cn(TD_RIGHT, u.pending ? 'font-semibold text-amber-ink' : 'text-muted')}>{u.pending}</td>
                    <td className={cn(TD_RIGHT, u.draft ? 'text-content-2' : 'text-muted')}>{u.draft}</td>
                    <td className={cn(TD_RIGHT, u.rejected ? 'font-semibold text-red-ink' : 'text-muted')}>{u.rejected}</td>
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
        {!loading && performance.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPageChange={setPage} />
        )}
      </div>
      )}
    </>
  )
}

// ── Tab de infractores ───────────────────────────────────────────────────────
export interface TabInfractoresProps {
  start: string;
  end: string;
  vista: Vista;
}

function TabInfractores({ start, end, vista }: TabInfractoresProps) {
  const [verTodos, setVerTodos] = useState(false)
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
  const todos       = [...(data?.performance || [])].sort((a, b) => b.total - a.total)
  const performance = todos.filter(o =>
    !search.trim() ||
    `${o.name} ${o.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
    (o.dni || '').includes(search)
  )
  const { pageItems, page, setPage, totalPages, total, from, to } =
    usePagedList(performance, `${search}|${start}|${end}`)
  const puestoDe = new Map(todos.map((o, i) => [o.id, i + 1]))

  // Indicadores calculados con el ranking completo
  const reincidentes = todos.filter(o => o.total >= 2).length
  const promedio = general.totalOffenders > 0 ? general.totalReports / general.totalOffenders : 0
  const conteoFaltas = new Map<string, number>()
  todos.forEach(o => o.byLack.forEach(l => conteoFaltas.set(l.lack, (conteoFaltas.get(l.lack) ?? 0) + l.count)))
  const faltasOrdenadas = [...conteoFaltas.entries()].sort((a, b) => b[1] - a[1])
  const faltaFrecuente = faltasOrdenadas[0]
  // Faltas mas frecuentes: las 7 primeras y el resto agrupado en "Otras"
  const topFaltas = faltasOrdenadas.slice(0, 7).map(([lack, count]) => ({ id: lack, label: lack, value: count }))
  const otras = faltasOrdenadas.slice(7).reduce((sum, [, c]) => sum + c, 0)
  if (otras > 0) topFaltas.push({ id: '__otras', label: `Otras (${faltasOrdenadas.length - 7} tipos)`, value: otras })
  const totalFaltas = faltasOrdenadas.reduce((sum, [, c]) => sum + c, 0)
  // Reincidencia: cuantas personas tienen 1, 2, 3, 4 y 5 o mas faltas
  const tramos = [1, 2, 3, 4, 5].map(n => ({
    label: n === 5 ? '5 o más' : n === 1 ? '1 falta' : `${n} faltas`,
    value: todos.filter(o => (n === 5 ? o.total >= 5 : o.total === n)).length,
    emphasis: n >= 2,
  }))
  const pctReincidencia = pct(reincidentes, todos.length)

  /** Total por persona: mas intenso cuanto mas faltas */
  const totalTono = (n: number) =>
    n >= 5 ? 'bg-danger text-white' : n >= 3 ? 'bg-danger/12 text-red-ink' : n >= 2 ? 'bg-warning/14 text-amber-ink' : 'bg-subtle text-content-2'

  return (
    <>
      {error && <div role="alert" className={errorBox}><FiAlertTriangle aria-hidden />{error}</div>}

      <div className="grid grid-cols-[1.3fr_repeat(3,1fr)] gap-3 max-xl:grid-cols-3 max-sm:grid-cols-2">
        <div className="max-xl:col-span-3 max-sm:col-span-2">
          <HeroCard
            label="Infracciones del periodo"
            value={general.totalReports}
            icon={<FiFileText />}
            detail={
              faltaFrecuente ? (
                <span className="block truncate" title={faltaFrecuente[0]}>
                  Más frecuente: <strong className="font-semibold text-white">{faltaFrecuente[0]}</strong> ({faltaFrecuente[1]})
                </span>
              ) : (
                'Sin infracciones registradas'
              )
            }
          />
        </div>
        <StatCard icon={<FiUserX />}   label="Infractores"           value={general.totalOffenders} tone="warning" />
        <StatCard icon={<FiRepeat />}  label="Reincidentes (2 o más)" value={reincidentes} total={todos.length || undefined} tone="danger" />
        <div className={cn(card, 'flex min-w-0 flex-col gap-3 p-4 max-sm:col-span-2')}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[13px] font-medium text-content-2">Promedio por infractor</span>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl text-base', TONE.neutral.icon)} aria-hidden>
              <FiTrendingUp />
            </span>
          </div>
          <span className="text-[28px] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums dark:text-content">
            {promedio.toLocaleString('es-PE', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-xs text-muted">infracciones por persona</span>
        </div>
      </div>

      {vista === 'graficos' && (
        loading ? (
          <div className={card}><LoadingState label="Cargando datos…" /></div>
        ) : todos.length === 0 ? (
          <div className={card}><EmptyState title="No hay datos en el periodo" description="Elige un periodo más amplio." /></div>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
              <ChartCard icon={<FiBarChart2 />} title="Faltas más frecuentes" question="¿Qué faltas se repiten más en el periodo?">
                <RankedBars items={topFaltas} total={totalFaltas} unidad="Faltas" />
              </ChartCard>

              <ChartCard icon={<FiRepeat />} title="Reincidencia" question="¿Cuántas personas repiten faltas?">
                <div className="flex items-baseline gap-2">
                  <span className="text-[34px] leading-none font-bold tracking-[-0.02em] text-ink dark:text-content">{pctReincidencia}%</span>
                  <span className="text-[13px] text-content-2">de los infractores reincide ({reincidentes} de {todos.length})</span>
                </div>
                <Columns items={tramos} unidad="Personas" />
                <Legend
                  items={[
                    { label: 'Una sola falta', color: 'var(--viz-muted)' },
                    { label: 'Reincidentes (2 o más)', color: 'var(--viz-rejected)' },
                  ]}
                />
              </ChartCard>
            </div>

            <ChartCard
              icon={<FiUserX />}
              title="Infractores con más faltas"
              question="¿Quiénes concentran más faltas? Pasa el mouse para ver el detalle por tipo."
              actions={<SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o DNI" className="max-w-[240px]! max-sm:max-w-none!" />}
            >
              {performance.length === 0 ? (
                <EmptyState title="Sin resultados" description={`No hay infractores que coincidan con “${search.trim()}”.`} />
              ) : (
                <>
                  <RankedBars
                    unidad="Faltas"
                    total={general.totalReports}
                    color="var(--viz-rejected)"
                    items={(verTodos ? performance : performance.slice(0, 10)).map(o => ({
                      id: String(o.id),
                      label: `${o.name} ${o.lastname}`,
                      sub: `DNI ${o.dni || '—'}`,
                      value: o.total,
                      detail: (
                        <div className="mt-1 border-t border-line pt-1">
                          {[...o.byLack].sort((a, b) => b.count - a.count).slice(0, 5).map(l => (
                            <TipRow key={l.lack} label={l.lack} value={l.count} />
                          ))}
                        </div>
                      ),
                    }))}
                  />
                  <VerTodos abierto={verTodos} total={performance.length} visibles={10} onToggle={() => setVerTodos(v => !v)} />
                </>
              )}
            </ChartCard>
          </>
        )
      )}

      {vista === 'tabla' && (
      <div className={cn(card, 'flex flex-col overflow-hidden')}>
        <RankingHeader
          icon={<FiUserX />}
          title="Ranking de infractores"
          count={`${performance.length} infractor${performance.length !== 1 ? 'es' : ''} · ordenado por faltas`}
          search={search}
          onSearch={setSearch}
          placeholder="Buscar por nombre o DNI"
        />

        {loading ? <LoadingState label="Cargando datos…" />
          : performance.length === 0 ? (
            search.trim()
              ? <EmptyState title="Sin resultados" description={`No hay infractores que coincidan con “${search.trim()}”.`} />
              : <EmptyState title="No hay datos en el periodo" description="Elige un periodo más amplio." />
          ) : (
          <div className="overflow-x-auto">
            <table className={incTable}>
              <thead>
                <tr>
                  <th className={cn(incTableTh, 'w-14 text-center!')}>#</th>
                  <th className={incTableTh}>Infractor</th>
                  <th className={cn(incTableTh, 'text-center!')}>Faltas</th>
                  <th className={incTableTh}>Tipos de falta</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o, i) => (
                  <tr key={o.id} className={incTableTr}>
                    <td className={cn(incTableTd, 'text-center')}>
                      <div className="flex justify-center"><Puesto n={puestoDe.get(o.id) ?? from + i} /></div>
                    </td>
                    <td className={incTableTd}>
                      <div className="flex items-center gap-3">
                        <Avatar nombre={`${o.name} ${o.lastname}`} clave={o.dni || String(o.id)} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-content">{o.name} {o.lastname}</div>
                          <div className="truncate text-xs text-muted">
                            <span className="font-mono">DNI {o.dni || '—'}</span>
                            {[o.subgerencia, o.job].filter(Boolean).length > 0 && ` · ${[o.subgerencia, o.job].filter(Boolean).join(' · ')}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={cn(incTableTd, 'text-center')}>
                      <span className={cn('inline-flex min-w-9 items-center justify-center rounded-lg px-2 py-1 text-[14px] font-bold tabular-nums', totalTono(o.total))}>
                        {o.total}
                      </span>
                    </td>
                    <td className={incTableTd}>
                      <div className="flex flex-wrap gap-1.5">
                        {[...o.byLack].sort((a, b) => b.count - a.count).map((l, li) => (
                          <span
                            key={li}
                            title={l.lack}
                            className="inline-flex max-w-[280px] items-center gap-1.5 rounded-lg border border-line bg-subtle py-0.5 pr-2 pl-0.5 text-xs text-content-2"
                          >
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-surface px-1 text-[11px] font-bold text-content tabular-nums shadow-sm">
                              {l.count}
                            </span>
                            <span className="truncate">{l.lack}</span>
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
        {!loading && performance.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPageChange={setPage} />
        )}
      </div>
      )}
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function MetricasPage() {
  const today        = new Date()
  const firstOfMonth = toISODate(new Date(today.getFullYear(), today.getMonth(), 1))
  const todayStr     = toISODate(today)

  const [applied, setApplied]   = useState({ start: firstOfMonth, end: todayStr })
  const [tab, setTab]           = useState<'usuarios' | 'infractores'>('usuarios')
  const [showPeriodo, setShowPeriodo] = useState(false)
  const [vista, setVista]       = useState<Vista>('graficos')

  const fmt = (s: string) => fromISODate(s).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  const periodoTexto = `${fmt(applied.start)} – ${fmt(applied.end)}`

  return (
    <div className="box-border flex w-full min-w-0 flex-col gap-4 p-6 max-[860px]:p-4 max-[560px]:p-3">

      {/* Encabezado como el de Incidencias: titulo grande, periodo y vista a la derecha */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Análisis · Desempeño</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Estadísticas</h2>
          <p className="m-0 mt-1 text-sm text-content-2">Incidencias por usuario e infractor en el periodo elegido.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPeriodo(true)}
            className="group inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-surface pr-3 pl-1.5 text-left transition-[border-color,box-shadow] duration-150 hover:border-accent hover:shadow-[0_0_0_3px_var(--focus-ring)]"
            aria-label={`Cambiar periodo: ${periodoTexto}`}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm text-white" aria-hidden>
              <FiCalendar />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold tracking-[0.1em] text-muted uppercase">Periodo</span>
              <span className="text-[13px] font-semibold text-content tabular-nums">{periodoTexto}</span>
            </span>
            <FiChevronDown className="text-muted transition-transform group-hover:translate-y-0.5" aria-hidden />
          </button>

          <div role="tablist" aria-label="Ver estadísticas por" className="flex items-center gap-1.5">
            {TAB_OPTIONS.map(({ key, label, icon }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={cn(
                    'inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13.5px] font-semibold transition-colors duration-150',
                    active
                      ? 'border-primary bg-primary text-white shadow-[0_6px_14px_-8px_rgba(30,58,138,0.9)]'
                      : 'border-line bg-surface text-content hover:border-line-strong hover:bg-subtle'
                  )}
                >
                  {icon} {label}
                </button>
              )
            })}
          </div>

          {/* Vista: graficos o tabla (la tabla es la version accesible de los mismos datos) */}
          <div role="group" aria-label="Vista" className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-line bg-surface p-1">
            {([
              { key: 'graficos', label: 'Gráficos', icon: <FiBarChart2 aria-hidden /> },
              { key: 'tabla', label: 'Tabla', icon: <FiList aria-hidden /> },
            ] as const).map(v => (
              <button
                key={v.key}
                type="button"
                aria-pressed={vista === v.key}
                onClick={() => setVista(v.key)}
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none px-2.5 text-[13px] font-semibold transition-colors',
                  vista === v.key ? 'bg-subtle text-content shadow-[0_1px_2px_rgba(15,23,42,0.12)]' : 'bg-transparent text-muted hover:text-content'
                )}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {tab === 'usuarios'    && <TabUsuarios    start={applied.start} end={applied.end} vista={vista} />}
        {tab === 'infractores' && <TabInfractores start={applied.start} end={applied.end} vista={vista} />}
      </div>

      {showPeriodo && (
        <DateRangeModal
          initialStart={fromISODate(applied.start)}
          initialEnd={fromISODate(applied.end)}
          onClose={() => setShowPeriodo(false)}
          onApply={(start, end) => {
            if (start) setApplied({ start: toISODate(start), end: toISODate(end ?? start) })
            setShowPeriodo(false)
          }}
        />
      )}
    </div>
  )
}
