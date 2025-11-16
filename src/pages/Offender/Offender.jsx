import React, { useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import OffenderTable from '@/Components/Table/OffenderTable';
import useOffenders from '@/Components/hooks/useOffenders';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Gestión de Infractores - Listado Principal
 *
 * Muestra tabla de infractores con opciones de:
 * - Búsqueda y filtrado
 * - Crear nuevo infractor
 * - Editar infractor existente
 * - Eliminar infractor
 */
export default function Offender() {
  const navigate = useNavigate();

  // Hook con toda la lógica de infractores
  const {
    offenders,
    loading,
    filters,
    permissions,
    eliminarOffender,
    updateFilters
  } = useOffenders();

  const [isSearching, setIsSearching] = useState(false);

  /**
   * Navegar a página de crear infractor
   */
  const handleAdd = () => {
    navigate('/dashboard/admin/infractores/add');
  };

  /**
   * Navegar a página de editar infractor
   */
  const handleEdit = (offender) => {
    navigate(`/dashboard/admin/infractores/edit/${offender.id}`);
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
          <h2>GESTIÓN DE INFRACTORES</h2>

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
                placeholder="Buscar infractor..."
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
                Agregar Infractor
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
          Cargando infractores...
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
                ⚠️ Solo puedes ver los infractores registrados
              </p>
            </div>
          )}

          {offenders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              No se encontraron infractores con los filtros aplicados
            </div>
          ) : (
            <>
              <OffenderTable
                data={offenders}
                onDelete={eliminarOffender}
                onEdit={handleEdit}
                startIndex={0}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
              />

              {/* Contador de infractores */}
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
                  Total: {offenders.length} infractor(es)
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
