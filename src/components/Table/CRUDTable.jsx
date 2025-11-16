import React from 'react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

/**
 * Componente de tabla CRUD reutilizable
 * @param {Array} data - Datos a mostrar
 * @param {Array} columns - Configuración de columnas [{ key, label, render }]
 * @param {Function} onEdit - Callback para editar
 * @param {Function} onDelete - Callback para eliminar
 * @param {Function} onView - Callback para ver detalles
 * @param {Object} permissions - Permisos { canUpdate, canDelete }
 * @param {Boolean} loading - Estado de carga
 */
const CRUDTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onView,
  permissions = { canUpdate: true, canDelete: true },
  loading = false,
  emptyMessage = 'No hay datos para mostrar'
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-state">
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="crud-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.label}</th>
            ))}
            {(permissions.canUpdate || permissions.canDelete || onView) && (
              <th>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={item.id || rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {column.render
                    ? column.render(item[column.key], item, rowIndex)
                    : item[column.key]}
                </td>
              ))}
              {(permissions.canUpdate || permissions.canDelete || onView) && (
                <td className="actions-cell">
                  {onView && (
                    <button
                      className="btn-icon btn-view"
                      onClick={() => onView(item)}
                      title="Ver detalles"
                    >
                      <FaEye />
                    </button>
                  )}
                  {permissions.canUpdate && onEdit && (
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => onEdit(item)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {permissions.canDelete && onDelete && (
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => onDelete(item)}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CRUDTable;
