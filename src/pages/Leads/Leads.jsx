import React, { useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import LeadTable from '@/Components/Table/LeadTable';
import useLeads from '@/Components/hooks/useLeads';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Gestión de Personal - Listado Principal
 *
 * Muestra tabla de personal con opciones de:
 * - Búsqueda y filtrado
 * - Crear nuevo personal
 * - Editar personal existente
 * - Eliminar personal
 */
export default function Leads() {
  const navigate = useNavigate();

  // Hook con toda la lógica de personal
  const {
    leads,
    loading,
    filters,
    permissions,
    eliminarLead,
    updateFilters
  } = useLeads();

  const [isSearching, setIsSearching] = useState(false);

  /**
   * Navegar a página de crear personal
   */
  const handleAdd = () => {
    navigate('/dashboard/admin/personal/add');
  };

  /**
   * Navegar a página de editar personal
   */
  const handleEdit = (lead) => {
    navigate(`/dashboard/admin/personal/edit/${lead.id}`);
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
          <h2>GESTIÓN DE PERSONAL</h2>

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
                placeholder="Buscar personal..."
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
                Agregar Personal
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
          Cargando personal...
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
                ⚠️ Solo puedes ver el personal registrado
              </p>
            </div>
          )}

          {leads.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              No se encontró personal con los filtros aplicados
            </div>
          ) : (
            <>
              <LeadTable
                data={leads}
                onDelete={eliminarLead}
                onEdit={handleEdit}
                startIndex={0}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
              />

              {/* Contador de personal */}
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
                  Total: {leads.length} personal(es)
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
