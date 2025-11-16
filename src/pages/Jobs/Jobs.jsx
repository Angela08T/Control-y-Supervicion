import React, { useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import JobTable from '@/Components/Table/JobTable';
import useJobs from '@/Components/hooks/useJobs';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Gestión de Cargos - Listado Principal
 *
 * Muestra tabla de cargos con opciones de:
 * - Búsqueda y filtrado
 * - Crear nuevo cargo
 * - Editar cargo existente
 * - Eliminar cargo
 */
export default function Jobs() {
  const navigate = useNavigate();

  // Hook con toda la lógica de cargos
  const {
    jobs,
    loading,
    filters,
    permissions,
    eliminarJob,
    updateFilters
  } = useJobs();

  const [isSearching, setIsSearching] = useState(false);

  /**
   * Navegar a página de crear cargo
   */
  const handleAdd = () => {
    navigate('/dashboard/admin/cargos/add');
  };

  /**
   * Navegar a página de editar cargo
   */
  const handleEdit = (job) => {
    navigate(`/dashboard/admin/cargos/edit/${job.id}`);
  };

  /**
   * Manejar cambios en filtros
   */
  const handleFilterChange = (field, value) => {
    setIsSearching(true);
    updateFilters({ [field]: value });

    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
          <h2>GESTIÓN DE CARGOS</h2>

          <div className="controls">
            {/* Búsqueda */}
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
                placeholder="Buscar cargo..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  paddingLeft: '35px',
                  paddingRight: isSearching ? '35px' : '12px'
                }}
              />
              {isSearching && (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--primary)',
                    animation: 'spin 1s linear infinite'
                  }}
                >
                  ⏳
                </div>
              )}
            </div>

            {/* Botón agregar (solo si tiene permisos) */}
            {permissions.canCreate && (
              <button className="btn-primary" onClick={handleAdd}>
                <FaPlus style={{ marginRight: '8px' }} />
                Agregar Cargo
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando cargos...
        </div>
      ) : (
        <div className="table-container-wrapper">
          {/* Mensaje informativo según permisos */}
          {!permissions.canCreate && (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid rgba(251, 191, 36, 0.3)'
              }}
            >
              <p style={{ fontSize: '0.9rem', color: '#f59e0b', margin: '0' }}>
                ⚠️ Solo puedes ver los cargos registrados
              </p>
            </div>
          )}

          {jobs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              No se encontraron cargos con los filtros aplicados
            </div>
          ) : (
            <>
              <JobTable
                data={jobs}
                onDelete={eliminarJob}
                onEdit={handleEdit}
                startIndex={0}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
              />

              {/* Contador de cargos */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '20px',
                  marginTop: '20px',
                  background: 'var(--card-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  Total: {jobs.length} cargo(s)
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
