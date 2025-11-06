import React from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'

export default function BodycamTable({ data = [], onDelete, onEdit, startIndex = 0 }) {
  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Acciones</th>
              <th>Nombre</th>
              <th>Serie</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay bodycams registradas
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
                <td>{item.name}</td>
                <td>{item.serie}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
