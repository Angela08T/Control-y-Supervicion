import React, { useState, useEffect } from 'react'
import { getDashboardPerformance, getDashboardOffenders } from '../../api/statistics'
import {
  FaUsers, FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaEdit, FaMedal, FaSearch, FaChartBar, FaUserTimes, FaIdCard
} from 'react-icons/fa'
import './MetricasPage.css'

const ROL_LABEL = {
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

function StatCard({ icon, label, value, color }) {
  return (
    <div className="met-stat-card" style={{ '--met-color': color }}>
      <div className="met-stat-icon">{icon}</div>
      <div className="met-stat-body">
        <div className="met-stat-value">{value}</div>
        <div className="met-stat-label">{label}</div>
      </div>
    </div>
  )
}

function StatusBar({ approved, pending, draft, rejected, total }) {
  if (total === 0) return <span className="met-bar-empty">—</span>
  const pct = (n) => Math.round((n / total) * 100)
  const segments = [
    { val: approved, color: '#22c55e', label: 'Apr' },
    { val: pending,  color: '#f59e0b', label: 'Pen' },
    { val: draft,    color: '#94a3b8', label: 'Bor' },
    { val: rejected, color: '#ef4444', label: 'Rec' },
  ].filter(s => s.val > 0)
  return (
    <div className="met-bar-wrap">
      <div className="met-bar-track">
        {segments.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.val}`}
            className="met-bar-segment" style={{ width: `${pct(s.val)}%`, background: s.color }} />
        ))}
      </div>
      <span className="met-bar-legend">
        {segments.map((s, i) => (
          <span key={i} className="met-bar-item">
            <span style={{ color: s.color, fontWeight: 600 }}>{s.val}</span>
            <span className="met-bar-lbl">&nbsp;{s.label}</span>
          </span>
        ))}
      </span>
    </div>
  )
}

// ── Tab de usuarios ──────────────────────────────────────────────────────────
function TabUsuarios({ start, end }) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [data, setData]           = useState(null)
  const [search, setSearch]       = useState('')

  useEffect(() => { fetchData() }, [start, end])

  const fetchData = async () => {
    if (!start || !end) return
    setLoading(true); setError(null)
    try {
      const res = await getDashboardPerformance(start, end)
      setData(res?.data || res)
    } catch { setError('No se pudieron cargar los datos.') }
    finally { setLoading(false) }
  }

  const general     = data?.general || { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 }
  const performance = (data?.performance || []).filter(u =>
    !search.trim() || `${u.name} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {error && <div className="met-error">{error}</div>}

      <div className="met-cards">
        <StatCard icon={<FaFileAlt />}     label="Total"      value={general.total}    color="#3b82f6" />
        <StatCard icon={<FaCheckCircle />} label="Aprobadas"  value={general.approved} color="#22c55e" />
        <StatCard icon={<FaClock />}       label="Pendientes" value={general.pending}  color="#f59e0b" />
        <StatCard icon={<FaEdit />}        label="Borradores" value={general.draft}    color="#94a3b8" />
        <StatCard icon={<FaTimesCircle />} label="Rechazadas" value={general.rejected} color="#ef4444" />
      </div>

      <div className="met-table-card">
        <div className="met-table-header">
          <div className="met-table-title-row">
            <FaUsers className="met-table-icon" />
            <span className="met-table-title">Ranking de Usuarios</span>
            <span className="met-badge">{performance.length} usuario{performance.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="met-search-wrap">
            <FaSearch className="met-search-icon" />
            <input type="text" placeholder="Buscar usuario..." value={search}
              onChange={e => setSearch(e.target.value)} className="met-search-input" />
          </div>
        </div>

        <div className="met-table-scroll">
          <table className="met-table">
            <thead>
              <tr>
                <th className="met-th met-th-center">#</th>
                <th className="met-th met-th-left">Usuario</th>
                <th className="met-th met-th-center met-col-hide-sm">Rol</th>
                <th className="met-th met-th-center">Total</th>
                <th className="met-th met-th-center met-col-apr">Apr.</th>
                <th className="met-th met-th-center met-col-pen met-col-hide-xs">Pen.</th>
                <th className="met-th met-th-center met-col-bor met-col-hide-sm">Bor.</th>
                <th className="met-th met-th-center met-col-rec met-col-hide-xs">Rec.</th>
                <th className="met-th met-th-left met-col-dist met-col-hide-md">Distribución</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="met-td-empty">Cargando datos…</td></tr>}
              {!loading && performance.length === 0 && (
                <tr><td colSpan={9} className="met-td-empty">No hay datos para el período seleccionado</td></tr>
              )}
              {!loading && performance.map((u, i) => {
                const initials    = `${u.name?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase()
                const medalColors = ['#f59e0b', '#94a3b8', '#cd7c2f']
                return (
                  <tr key={u.id} className={`met-tr ${i % 2 === 1 ? 'met-tr-alt' : ''}`}>
                    <td className="met-td met-td-center">
                      {i < 3 ? <FaMedal style={{ color: medalColors[i] }} title={`#${i+1}`} />
                              : <span className="met-rank">{i + 1}</span>}
                    </td>
                    <td className="met-td">
                      <div className="met-user">
                        <div className="met-avatar">{initials || '?'}</div>
                        <span className="met-user-name">{u.name} {u.lastname}</span>
                      </div>
                    </td>
                    <td className="met-td met-td-center met-col-hide-sm">
                      <span className="met-rol-badge">{ROL_LABEL[u.rol] || u.rol}</span>
                    </td>
                    <td className="met-td met-td-center met-total">{u.total}</td>
                    <td className="met-td met-td-center met-col-apr">{u.approved}</td>
                    <td className="met-td met-td-center met-col-pen met-col-hide-xs">{u.pending}</td>
                    <td className="met-td met-td-center met-col-bor met-col-hide-sm">{u.draft}</td>
                    <td className="met-td met-td-center met-col-rec met-col-hide-xs">{u.rejected}</td>
                    <td className="met-td met-col-dist met-col-hide-md">
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
function TabInfractores({ start, end }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [data, setData]       = useState(null)
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchData() }, [start, end])

  const fetchData = async () => {
    if (!start || !end) return
    setLoading(true); setError(null)
    try {
      const res = await getDashboardOffenders(start, end)
      setData(res?.data || res)
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
  const lackColor = (lack) => LACK_COLORS[allLacks.indexOf(lack) % LACK_COLORS.length]

  return (
    <>
      {error && <div className="met-error">{error}</div>}

      <div className="met-cards">
        <StatCard icon={<FaFileAlt />}    label="Total Infracciones" value={general.totalReports}   color="#ef4444" />
        <StatCard icon={<FaUserTimes />}  label="Infractores"        value={general.totalOffenders} color="#f59e0b" />
      </div>

      <div className="met-table-card">
        <div className="met-table-header">
          <div className="met-table-title-row">
            <FaUserTimes className="met-table-icon" style={{ color: '#ef4444' }} />
            <span className="met-table-title">Ranking de Infractores</span>
            <span className="met-badge">{performance.length} infractor{performance.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="met-search-wrap">
            <FaSearch className="met-search-icon" />
            <input type="text" placeholder="Buscar nombre o DNI..." value={search}
              onChange={e => setSearch(e.target.value)} className="met-search-input" />
          </div>
        </div>

        <div className="met-table-scroll">
          <table className="met-table">
            <thead>
              <tr>
                <th className="met-th met-th-center">#</th>
                <th className="met-th met-th-center">DNI</th>
                <th className="met-th met-th-left">Nombre</th>
                <th className="met-th met-th-left met-col-hide-sm">Subgerencia</th>
                <th className="met-th met-th-left met-col-hide-sm">Cargo</th>
                <th className="met-th met-th-center">Total</th>
                <th className="met-th met-th-left met-col-hide-xs">Tipos de Falta</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="met-td-empty">Cargando datos…</td></tr>}
              {!loading && performance.length === 0 && (
                <tr><td colSpan={7} className="met-td-empty">No hay infracciones en el período seleccionado</td></tr>
              )}
              {!loading && performance.map((o, i) => {
                const initials    = `${o.name?.[0] || ''}${o.lastname?.[0] || ''}`.toUpperCase()
                const medalColors = ['#f59e0b', '#94a3b8', '#cd7c2f']
                return (
                  <tr key={o.id} className={`met-tr ${i % 2 === 1 ? 'met-tr-alt' : ''}`}>
                    <td className="met-td met-td-center">
                      {i < 3 ? <FaMedal style={{ color: medalColors[i] }} title={`#${i+1}`} />
                              : <span className="met-rank">{i + 1}</span>}
                    </td>
                    <td className="met-td met-td-center">
                      <span className="met-dni">
                        <FaIdCard style={{ opacity: 0.5, fontSize: '0.7rem' }} />
                        {o.dni || '—'}
                      </span>
                    </td>
                    <td className="met-td">
                      <div className="met-user">
                        <div className="met-avatar met-avatar-red">{initials || '?'}</div>
                        <span className="met-user-name">{o.name} {o.lastname}</span>
                      </div>
                    </td>
                    <td className="met-td met-col-hide-sm">
                      <span className="met-sub-text">{o.subgerencia || '—'}</span>
                    </td>
                    <td className="met-td met-col-hide-sm">
                      <span className="met-sub-text">{o.job || '—'}</span>
                    </td>
                    <td className="met-td met-td-center">
                      <span className="met-total-red">{o.total}</span>
                    </td>
                    <td className="met-td met-col-hide-xs">
                      <div className="met-lack-list">
                        {o.byLack.map((l, li) => (
                          <span key={li} className="met-lack-badge"
                            style={{ background: `${lackColor(l.lack)}18`, color: lackColor(l.lack),
                                     border: `1px solid ${lackColor(l.lack)}40` }}>
                            <span className="met-lack-count">{l.count}</span>
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
  const [tab, setTab]       = useState('usuarios')

  const handleApply = () => {
    if (!start || !end) return
    setApplied({ start, end })
  }

  return (
    <div className="met-page">

      {/* ── HEADER ── */}
      <div className="met-header">
        <div className="met-title-block">
          <div className="met-title-icon"><FaChartBar /></div>
          <div>
            <h2 className="met-title">Métricas</h2>
            <p className="met-subtitle">Estadísticas de incidencias por período</p>
          </div>
        </div>

        <div className="met-filters">
          <div className="met-date-group">
            <label className="met-date-label">Desde</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="met-date-input" />
          </div>
          <div className="met-date-group">
            <label className="met-date-label">Hasta</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="met-date-input" />
          </div>
          <button onClick={handleApply} className="met-apply-btn">Aplicar</button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="met-tabs">
        <button
          className={`met-tab ${tab === 'usuarios' ? 'met-tab-active' : ''}`}
          onClick={() => setTab('usuarios')}
        >
          <FaUsers /> Usuarios
        </button>
        <button
          className={`met-tab ${tab === 'infractores' ? 'met-tab-active' : ''}`}
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
