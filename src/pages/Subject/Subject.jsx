import React, { useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import SubjectTable from '@/Components/Table/SubjectTable';
import useSubjects from '@/Components/hooks/useSubjects';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Gestión de Asuntos - Listado Principal
 *
 * Muestra tabla de asuntos con opciones de:
 * - Búsqueda y filtrado
 * - Crear nuevo asunto
 * - Editar asunto existente
 * - Eliminar asunto
 */
export default function Subject() {
  const navigate = useNavigate();

  // Hook con toda la lógica de asuntos
  const {
    subjects,
    loading,
    filters,
    permissions,
    eliminarSubject,
    updateFilters
  } = useSubjects();

  const [isSearching, setIsSearching] = useState(false);

  /**
   * Navegar a página de crear asunto
   */
  const handleAdd = () => {
    navigate('/dashboard/admin/asuntos/add');
  };

  /**
   * Navegar a página de editar asunto
   */
  const handleEdit = (subject) => {
    navigate(`/dashboard/admin/asuntos/edit/${subject.id}`);
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
          <h2>GESTIÓN DE ASUNTOS</h2>

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
                placeholder="Buscar asunto..."
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
                Agregar Asunto
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
          Cargando asuntos...
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
                ⚠️ Solo puedes ver los asuntos registrados
              </p>
            </div>
          )}

          {subjects.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              No se encontraron asuntos con los filtros aplicados
            </div>
          ) : (
            <>
              <SubjectTable
                data={subjects}
                onDelete={eliminarSubject}
                onEdit={handleEdit}
                startIndex={0}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
              />

              {/* Contador de asuntos */}
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
                  Total: {subjects.length} asunto(s)
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
