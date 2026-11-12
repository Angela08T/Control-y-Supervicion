import React from 'react';
import AuditoriaTable, { ACTION_LABELS, ACTION_STYLE, MODEL_LABELS } from '../../components/AuditoriaTable';
import useAudit from '../../hooks/Audit/useAudit';
import type { AuditFilterState } from '../../hooks/Audit/useAudit';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiGrid, FiLayers, FiRotateCcw, FiSlash, FiXCircle } from 'react-icons/fi';
import Button from '@/components/UI/Button';
import Dropdown from '@/components/UI/Dropdown';
import Pagination from '@/components/UI/Pagination';
import SearchInput from '@/components/UI/SearchInput';
import { EmptyState, LoadingState } from '@/components/UI/EmptyState';
import { cn, fitCard, fitPage } from '@/utils/classes';
import { PAGE_SIZE } from '@/hooks/usePagedList';

/** Estados que se pueden filtrar, como pestanas */
const ESTADOS = [
  { value: '', label: 'Todos', icon: <FiGrid /> },
  { value: 'SUCCESS', label: 'Exitosos', icon: <FiCheckCircle /> },
  { value: 'FAILED', label: 'Fallidos', icon: <FiXCircle /> },
  { value: 'BLOCKED', label: 'Bloqueados', icon: <FiSlash /> },
] as const;

/** Acciones que se ofrecen en el filtro */
const FILTER_ACTIONS = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'GET_ALL', 'GET_ONE'] as const;

export default function AuditoriaPage() {
  const {
    audits,
    loading,
    error,
    pagination,
    filters,
    changePage,
    updateFilters,
    resetFilters
  } = useAudit();

  const handleFilterChange = (key: keyof AuditFilterState, value: string) => {
    updateFilters({ [key]: value } as Partial<AuditFilterState>);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      changePage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasFilters = Boolean(filters.action || filters.model || filters.status || filters.search);
  const total = pagination.totalCount;
  const from = total === 0 ? 0 : (pagination.currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(pagination.currentPage * PAGE_SIZE, total);

  // Resumen de la pagina que se esta viendo
  const fallidos = audits.filter(a => a.status !== 'SUCCESS').length;
  const usuarios = new Set(audits.map(a => a.user?.username).filter(Boolean)).size;

  return (
    <div className={fitPage}>
      {/* Encabezado como el de Incidencias */}
      <header className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-primary/70 uppercase dark:text-accent-light">Administración · Trazabilidad</p>
          <h2 className="m-0 mt-0.5 text-[30px] leading-tight font-bold tracking-[-0.02em] text-ink dark:text-content">Auditoría</h2>
          <p className="m-0 mt-1 text-sm text-content-2">
            Quién hizo qué y cuándo en el sistema ·{' '}
            <strong className="font-semibold text-ink tabular-nums dark:text-content">{loading ? '—' : total.toLocaleString('es-PE')}</strong> registros
          </p>
        </div>
        {!loading && audits.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 font-medium text-content-2 ring-1 ring-line">
              <FiActivity className="text-muted" aria-hidden />
              <strong className="font-bold text-content">{usuarios}</strong> {usuarios === 1 ? 'usuario' : 'usuarios'} en esta página
            </span>
            {fallidos > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 font-semibold text-red-ink">
                <FiAlertTriangle aria-hidden />
                {fallidos} {fallidos === 1 ? 'acción no exitosa' : 'acciones no exitosas'}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Filtros: estado en pestanas; accion, modulo y usuario a la derecha */}
      <div className="mb-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-[#d3dceb] bg-surface p-3 shadow-[0_1px_2px_rgba(12,26,75,0.06),0_12px_28px_-14px_rgba(12,26,75,0.28)] dark:border-line">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1">
            <SearchInput
              value={filters.search}
              onChange={(v) => handleFilterChange('search', v)}
              placeholder="Buscar por usuario"
              className="max-w-none!"
            />
          </div>
          <div className="w-[200px] max-sm:w-full">
            <Dropdown
              aria-label="Filtrar por acción"
              value={filters.action}
              onChange={(v) => handleFilterChange('action', v)}
              placeholder="Todas las acciones"
              icon={<FiActivity />}
              options={[
                { value: '', label: 'Todas las acciones' },
                ...FILTER_ACTIONS.map(value => ({ value, label: ACTION_LABELS[value], icon: ACTION_STYLE[value]?.icon })),
              ]}
            />
          </div>
          <div className="w-[200px] max-sm:w-full">
            <Dropdown
              aria-label="Filtrar por módulo"
              value={filters.model}
              onChange={(v) => handleFilterChange('model', v)}
              placeholder="Todos los módulos"
              icon={<FiLayers />}
              searchable
              options={[{ value: '', label: 'Todos los módulos' }, ...Object.entries(MODEL_LABELS).map(([value, label]) => ({ value, label }))]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap items-center gap-1.5">
            {ESTADOS.map(e => {
              const activo = filters.status === e.value;
              return (
                <button
                  key={e.value || 'todos'}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => handleFilterChange('status', e.value)}
                  className={cn(
                    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition-colors duration-150',
                    activo
                      ? 'border-primary bg-primary text-white shadow-[0_6px_14px_-8px_rgba(30,58,138,0.9)]'
                      : 'border-line bg-surface text-content hover:border-line-strong hover:bg-subtle'
                  )}
                >
                  <span className={activo ? 'text-white' : 'text-muted'} aria-hidden>{e.icon}</span>
                  {e.label}
                </button>
              );
            })}
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" icon={<FiRotateCcw />} onClick={resetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <div className={fitCard}>
        {loading ? (
          <LoadingState label="Cargando registros de auditoría…" />
        ) : error ? (
          <EmptyState title="No se pudieron cargar los registros" description={error} />
        ) : audits.length === 0 ? (
          hasFilters ? (
            <EmptyState
              title="Sin resultados"
              description="Ningún registro coincide con los filtros. Prueba con otros valores o limpia los filtros."
            />
          ) : (
            <EmptyState title="Aún no hay registros" description="Cuando haya acciones en el sistema, aparecerán aquí." />
          )
        ) : (
          <AuditoriaTable data={audits} currentPage={pagination.currentPage} itemsPerPage={PAGE_SIZE} />
        )}

        {!loading && !error && (
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            total={total}
            from={from}
            to={to}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
