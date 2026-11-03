import React from 'react';
import AuditoriaTable from '../../components/AuditoriaTable';
import useAudit from '../../hooks/Audit/useAudit';
import type { AuditFilterState } from '../../hooks/Audit/useAudit';
import { FaSearch, FaRedo } from 'react-icons/fa';
import {
  btnSecondary,
  cn,
  controlsBar,
  controlsInput,
  controlsSelect,
  incidenciasPage,
  pageHeaderIncidencias,
  pageTitle,
  tableWrapper
} from '../../utils/classes';

/** Ajustes de .controls a ancho tablet (<=900px) que no incluyen las constantes compartidas */
const controlsBarResponsive = cn(controlsBar, 'max-[900px]:flex-wrap max-[900px]:justify-between max-[900px]:gap-2');
const controlsSelectResponsive = cn(controlsSelect, 'max-[900px]:flex-[1_1_100%] max-[900px]:min-w-0');
const controlsInputResponsive = cn(controlsInput, 'max-[900px]:flex-[1_1_100%] max-[900px]:min-w-0');

/** Boton de pagina numerica (activo / inactivo) */
const pageButton = (active: boolean) =>
  cn(
    'min-w-10 cursor-pointer rounded-[4px] border px-3 py-2',
    active ? 'border-primary bg-primary font-bold text-white' : 'border-line bg-transparent font-normal [color:inherit]'
  );

/** Boton anterior / siguiente de la paginacion */
const navButton = cn(btnSecondary, 'flex items-center gap-[5px] px-4! py-2! disabled:cursor-not-allowed disabled:opacity-50');

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

  const handlePreviousPage = () => {
    handlePageChange(pagination.currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(pagination.currentPage + 1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    changeItemsPerPage(newItemsPerPage);
  };

  return (
    <div className={incidenciasPage}>
      <header className={pageHeaderIncidencias}>
        <div className="flex flex-1 items-center gap-5">
          <h2 className={pageTitle}>AUDITORÍA DEL SISTEMA</h2>
          <div className={controlsBarResponsive}>
            <select
              className={controlsSelectResponsive}
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">Todas las acciones</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="GET_ALL">Consultar Todos</option>
              <option value="GET_ONE">Consultar Uno</option>
            </select>

            <select
              className={controlsSelectResponsive}
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
            >
              <option value="">Todos los modelos</option>
              <option value="AUTH">Autenticación</option>
              <option value="AUDIT">Auditoría</option>
              <option value="REPORT">Reportes</option>
              <option value="USER">Usuarios</option>
              <option value="BODYCAM">Bodycam</option>
              <option value="OFFENDER">Infractor</option>
            </select>

            <select
              className={controlsSelectResponsive}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="SUCCESS">Éxito</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="FAILED">Fallido</option>
            </select>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={cn(controlsInputResponsive, 'pl-[35px]!')}
                placeholder="Buscar por usuario..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <button className={btnSecondary} onClick={resetFilters}>
              <FaRedo className="mr-2" />
              Limpiar
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-[17.6px] text-muted">
          Cargando registros de auditoría...
        </div>
      ) : (
        <div className={tableWrapper}>
          <AuditoriaTable
            data={audits}
            currentPage={pagination.currentPage}
            itemsPerPage={itemsPerPage}
          />

          {/* Controles de paginación */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-[15px] rounded-[8px] border border-line p-5">
            {/* Lado izquierdo: Contador y selector */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="text-[15.2px] font-medium">
                Mostrando {audits.length} de {pagination.totalCount} registros
              </div>

              {/* Selector de items por página */}
              <div className="flex items-center gap-2">
                <label className="text-[14.4px] text-muted">
                  Mostrar:
                </label>
                <select
                  className="cursor-pointer rounded-[4px] border border-line [background:var(--bg)] px-3 py-1.5 text-[14.4px] [color:inherit]"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Lado derecho: Botones de navegación */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.currentPage === 1}
                className={navButton}
              >
                ← Anterior
              </button>

              {/* Números de página */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-[5px]">
                  {(() => {
                    const pages: (number | '...')[] = [];
                    const totalPages = pagination.totalPages;
                    const currentPage = pagination.currentPage;

                    if (totalPages <= 7) {
                      // Mostrar todas las páginas si son 7 o menos
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Lógica para mostrar páginas con elipsis
                      if (currentPage <= 4) {
                        // Inicio: 1 2 3 4 5 ... último
                        pages.push(1, 2, 3, 4, 5);
                        pages.push('...');
                        pages.push(totalPages);
                      } else if (currentPage >= totalPages - 3) {
                        // Final: 1 ... penúltimo-3 penúltimo-2 penúltimo-1 penúltimo último
                        pages.push(1);
                        pages.push('...');
                        for (let i = totalPages - 4; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Medio: 1 ... actual-1 actual actual+1 ... último
                        pages.push(1);
                        pages.push('...');
                        pages.push(currentPage - 1, currentPage, currentPage + 1);
                        pages.push('...');
                        pages.push(totalPages);
                      }
                    }

                    return pages.map((pageNum, idx) => {
                      if (pageNum === '...') {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="min-w-10 px-3 py-2 text-center text-muted"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={pageButton(currentPage === pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Indicador de página actual si solo hay 1 página */}
              {pagination.totalPages === 1 && (
                <div className="min-w-10 rounded-[4px] border border-primary bg-primary px-3 py-2 text-center font-bold text-white">
                  1
                </div>
              )}

              <button
                onClick={handleNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className={navButton}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
