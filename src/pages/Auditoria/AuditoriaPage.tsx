import React from 'react';
import AuditoriaTable from '../../components/AuditoriaTable';
import useAudit from '../../hooks/Audit/useAudit';
import { FaSearch, FaRedo } from 'react-icons/fa';

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

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  const handlePageChange = (newPage) => {
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

  const handleItemsPerPageChange = (newItemsPerPage) => {
    changeItemsPerPage(newItemsPerPage);
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>AUDITORÍA DEL SISTEMA</h2>
          <div className="controls">
            <select
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
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="SUCCESS">Éxito</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="FAILED">Fallido</option>
            </select>

            <div style={{ position: 'relative' }}>
              <FaSearch
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)'
                }}
              />
              <input
                placeholder="Buscar por usuario..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{ paddingLeft: '35px' }}
              />
            </div>

            <button className="btn-secondary" onClick={resetFilters}>
              <FaRedo style={{ marginRight: '8px' }} />
              Limpiar
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
          fontSize: '1.1rem'
        }}>
          Cargando registros de auditoría...
        </div>
      ) : (
        <div className="table-container-wrapper">
          <AuditoriaTable
            data={audits}
            currentPage={pagination.currentPage}
            itemsPerPage={itemsPerPage}
          />

          {/* Controles de paginación */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            marginTop: '20px',
            background: 'var(--card-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            {/* Lado izquierdo: Contador y selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}>
                Mostrando {audits.length} de {pagination.totalCount} registros
              </div>

              {/* Selector de items por página */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Mostrar:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Lado derecho: Botones de navegación */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handlePreviousPage}
                disabled={pagination.currentPage === 1}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  opacity: pagination.currentPage === 1 ? 0.5 : 1,
                  cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                ← Anterior
              </button>

              {/* Números de página */}
              {pagination.totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center'
                }}>
                  {(() => {
                    const pages = [];
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
                            style={{
                              padding: '8px 12px',
                              color: 'var(--text-muted)',
                              minWidth: '40px',
                              textAlign: 'center'
                            }}
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            padding: '8px 12px',
                            background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                            color: currentPage === pageNum ? 'white' : 'var(--text)',
                            border: `1px solid ${currentPage === pageNum ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                            minWidth: '40px'
                          }}
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
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: '1px solid var(--primary)',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  1
                </div>
              )}

              <button
                onClick={handleNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1,
                  cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
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
