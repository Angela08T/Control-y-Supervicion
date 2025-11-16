import React, { useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import UserTable from '@/Components/Table/UserTable';
import useUsuarios from '@/Components/hooks/useUsuarios';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Gestión de Usuarios - Listado Principal
 *
 * Muestra tabla de usuarios con opciones de:
 * - Búsqueda y filtrado
 * - Crear nuevo usuario
 * - Editar usuario existente
 * - Cambiar estado (habilitar/deshabilitar)
 */
export default function Usuarios() {
  const navigate = useNavigate();

  // Hook con toda la lógica de usuarios
  const {
    usuarios,
    loading,
    filters,
    permissions,
    toggleEstadoUsuario,
    updateFilters
  } = useUsuarios();

  const [isSearching, setIsSearching] = useState(false);

  /**
   * Navegar a página de crear usuario
   */
  const handleAdd = () => {
    navigate('/dashboard/admin/usuarios/add');
  };

  /**
   * Navegar a página de editar usuario
   */
  const handleEdit = (usuario) => {
    navigate(`/dashboard/admin/usuarios/edit/${usuario.id}`);
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
          <h2>GESTIÓN DE USUARIOS</h2>

          <div className="controls">
            {/* Filtro por rol */}
            <select
              value={filters.roleFilter}
              onChange={(e) => handleFilterChange('roleFilter', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="all">📋 Todos los roles</option>
              <option value="ADMINISTRATOR">👑 Administradores</option>
              <option value="SUPERVISOR">👨‍💼 Supervisores</option>
              <option value="VALIDATOR">✅ Validadores</option>
              <option value="SENTINEL">🛡️ Sentinels</option>
            </select>

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
                placeholder="Buscar por nombre, usuario o email"
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
                Agregar Usuario
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
          Cargando usuarios...
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
                ⚠️ Como Sentinel, solo puedes ver los usuarios registrados
              </p>
            </div>
          )}

          {usuarios.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              No se encontraron usuarios con los filtros aplicados
            </div>
          ) : (
            <>
              <UserTable
                data={usuarios}
                onToggleStatus={toggleEstadoUsuario}
                onEdit={handleEdit}
                startIndex={0}
                canEdit={permissions.canEdit}
                canDelete={permissions.canDelete}
              />

              {/* Contador de usuarios */}
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
                  Total: {usuarios.length} usuario(s)
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
