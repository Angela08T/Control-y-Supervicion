import React from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'

export default function UserTable({ data = [], onDelete, onEdit, startIndex = 0, canEdit = true, canDelete = true }) {
  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              {(canEdit || canDelete) && <th>Acciones</th>}
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Usuario</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={canEdit || canDelete ? 5 : 4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {data.map((item, index) => {
              // Obtener el rol (compatibilidad con ambos formatos)
              const userRole = item.rol || item.role
              const isSupervisor = userRole?.toUpperCase() === 'SUPERVISOR'

              return (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px' }}>
                    {startIndex + index + 1}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="actions">
                      {canEdit && (
                        <button title="Editar" onClick={() => onEdit(item)}>
                          <FaEdit />
                        </button>
                      )}
                      {canDelete && (
                        <button title="Eliminar" onClick={() => onDelete(item.id)}>
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  )}
                  <td>{item.name}</td>
                  <td>{item.lastname}</td>
                  <td>{item.username}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      backgroundColor: isSupervisor ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isSupervisor ? '#3b82f6' : '#10b981'
                    }}>
                      {isSupervisor ? 'Supervisor' : 'Sentinel'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
