import React from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'

export default function LeadTable({ data = [], onDelete, onEdit, startIndex = 0 }) {
  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Acciones</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Cargo</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay personal registrado
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px' }}>
                  {startIndex + index + 1}
                </td>
                <td className="actions">
                  <button title="Editar" onClick={() => onEdit(item)}>
                    <FaEdit />
                  </button>
                  <button title="Eliminar" onClick={() => onDelete(item.id)}>
                    <FaTrash />
                  </button>
                </td>
                <td style={{ fontWeight: '600', color: 'var(--text)' }}>{item.name}</td>
                <td style={{ fontWeight: '600', color: 'var(--text)' }}>{item.lastname}</td>
                <td>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6'
                  }}>
                    {item.job?.name || 'Sin cargo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
