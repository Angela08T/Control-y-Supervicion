import React from 'react';
import AuditoriaTable, { ACTION_LABELS, MODEL_LABELS } from '../../components/AuditoriaTable';
import useAudit from '../../hooks/Audit/useAudit';
import type { AuditFilterState } from '../../hooks/Audit/useAudit';
import { FiRotateCcw } from 'react-icons/fi';
import Button from '@/components/UI/Button';
import { Select } from '@/components/UI/Field';
import PageHeader from '@/components/UI/PageHeader';
import Pagination from '@/components/UI/Pagination';
import SearchInput from '@/components/UI/SearchInput';
import { EmptyState, LoadingState } from '@/components/UI/EmptyState';
import { cardClass } from '@/utils/classes';

/** Ancho fijo de cada filtro dentro de la barra */
const filterWrap = 'w-44 max-w-full';

/** Acciones que se ofrecen en el filtro */
const FILTER_ACTIONS = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'GET_ALL', 'GET_ONE'] as const;

export default function AuditoriaPage() {
  const {
    audits,
    loading,
    error,
    pagination,
    filters,
    itemsPerPage,
    changePage,
    changeItemsPerPage,
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

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    changeItemsPerPage(newItemsPerPage);
  };

  const hasFilters = Boolean(filters.action || filters.model || filters.status || filters.search);
  const total = pagination.totalCount;
  const from = total === 0 ? 0 : (pagination.currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(pagination.currentPage * itemsPerPage, total);

  return (
    <div className="flex w-full flex-col">
      <PageHeader title="Auditoría" description="Registro de acciones realizadas en el sistema.">
        <div className={filterWrap}>
          <Select
            aria-label="Filtrar por acción"
            className="h-9"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Todas las acciones</option>
            {FILTER_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {ACTION_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className={filterWrap}>
          <Select
            aria-label="Filtrar por módulo"
            className="h-9"
            value={filters.model}
            onChange={(e) => handleFilterChange('model', e.target.value)}
          >
            <option value="">Todos los módulos</option>
            {Object.entries(MODEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className={filterWrap}>
          <Select
            aria-label="Filtrar por estado"
            className="h-9"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="SUCCESS">Exitoso</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="FAILED">Fallido</option>
          </Select>
        </div>

        <SearchInput
          value={filters.search}
          onChange={(v) => handleFilterChange('search', v)}
          placeholder="Buscar por usuario"
        />

        <Button variant="secondary" icon={<FiRotateCcw />} onClick={resetFilters}>
          Limpiar filtros
        </Button>
      </PageHeader>

      <div className={cardClass}>
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
          <AuditoriaTable data={audits} currentPage={pagination.currentPage} itemsPerPage={itemsPerPage} />
        )}

        {!loading && !error && (
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            total={total}
            from={from}
            to={to}
            perPage={itemsPerPage}
            onPageChange={handlePageChange}
            onPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  );
}
