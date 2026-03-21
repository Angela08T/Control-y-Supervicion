import React, { useState, useEffect } from 'react'
import { getDashboardPerformance } from '../../api/statistics'
import {
  FaUsers, FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaEdit, FaMedal, FaSearch, FaChartBar
} from 'react-icons/fa'
import './MetricasPage.css'

const ROL_LABEL = {
  ADMINISTRATOR: 'Admin',
  SUPERVISOR: 'Supervisor',
  SENTINEL: 'Centinela',
  VALIDATOR: 'Validador',
}

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
          <div
            key={i}
            title={`${s.label}: ${s.val}`}
            className="met-bar-segment"
            style={{ width: `${pct(s.val)}%`, background: s.color }}
          />
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

export default function MetricasPage() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const [start, setStart] = useState(firstOfMonth)
  const [end, setEnd] = useState(todayStr)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    if (!start || !end) return
    setLoading(true)
    setError(null)
    try {
      const res = await getDashboardPerformance(start, end)
      setData(res?.data || res)
    } catch {
      setError('No se pudieron cargar las métricas. Intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const general = data?.general || { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 }
  const performance = (data?.performance || []).filter(u => {
    if (!search.trim()) return true
    return `${u.name} ${u.lastname}`.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="met-page">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="met-header">
        <div className="met-title-block">
          <div className="met-title-icon"><FaChartBar /></div>
          <div>
            <h2 className="met-title">Métricas de Incidencias</h2>
            <p className="met-subtitle">Rendimiento de usuarios por estado de incidencias</p>
          </div>
        </div>

        <div className="met-filters">
          <div className="met-date-group">
            <label className="met-date-label">Desde</label>
            <input
              type="date" value={start}
              onChange={e => setStart(e.target.value)}
              className="met-date-input"
            />
          </div>
          <div className="met-date-group">
            <label className="met-date-label">Hasta</label>
            <input
              type="date" value={end}
              onChange={e => setEnd(e.target.value)}
              className="met-date-input"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="met-apply-btn"
          >
            {loading ? 'Cargando…' : 'Aplicar'}
          </button>
        </div>
      </div>

      {error && <div className="met-error">{error}</div>}

      {/* ── TARJETAS ────────────────────────────────────────────────── */}
      <div className="met-cards">
        <StatCard icon={<FaFileAlt />}     label="Total"      value={general.total}    color="#3b82f6" />
        <StatCard icon={<FaCheckCircle />} label="Aprobadas"  value={general.approved} color="#22c55e" />
        <StatCard icon={<FaClock />}       label="Pendientes" value={general.pending}  color="#f59e0b" />
        <StatCard icon={<FaEdit />}        label="Borradores" value={general.draft}    color="#94a3b8" />
        <StatCard icon={<FaTimesCircle />} label="Rechazadas" value={general.rejected} color="#ef4444" />
      </div>

      {/* ── TABLA ───────────────────────────────────────────────────── */}
      <div className="met-table-card">
        <div className="met-table-header">
          <div className="met-table-title-row">
            <FaUsers className="met-table-icon" />
            <span className="met-table-title">Ranking de Usuarios</span>
            <span className="met-badge">
              {performance.length} usuario{performance.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="met-search-wrap">
            <FaSearch className="met-search-icon" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="met-search-input"
            />
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
              {loading && (
                <tr>
                  <td colSpan={9} className="met-td-empty">Cargando datos…</td>
                </tr>
              )}
              {!loading && performance.length === 0 && (
                <tr>
                  <td colSpan={9} className="met-td-empty">
                    No hay datos para el período seleccionado
                  </td>
                </tr>
              )}
              {!loading && performance.map((u, i) => {
                const initials = `${u.name?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase()
                const medalColors = ['#f59e0b', '#94a3b8', '#cd7c2f']
                return (
                  <tr key={u.id} className={`met-tr ${i % 2 === 1 ? 'met-tr-alt' : ''}`}>
                    <td className="met-td met-td-center">
                      {i < 3
                        ? <FaMedal style={{ color: medalColors[i] }} title={`#${i + 1}`} />
                        : <span className="met-rank">{i + 1}</span>
                      }
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
                      <StatusBar
                        approved={u.approved} pending={u.pending}
                        draft={u.draft} rejected={u.rejected}
                        total={u.total}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
