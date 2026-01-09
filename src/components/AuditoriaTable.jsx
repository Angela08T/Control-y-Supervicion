import React from 'react';

// Función para formatear fecha
function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

// Función para obtener badge de estado
function getStatusBadge(status) {
  const statusColors = {
    SUCCESS: 'badge-success',
    BLOCKED: 'badge-danger',
    ERROR: 'badge-warning',
    FAILED: 'badge-danger'
  };

  return (
    <span className={`badge ${statusColors[status] || 'badge-default'}`}>
      {status}
    </span>
  );
}

// Función para obtener badge de acción
function getActionBadge(action) {
  const actionColors = {
    LOGIN: 'badge-info',
    LOGOUT: 'badge-secondary',
    CREATE: 'badge-success',
    UPDATE: 'badge-warning',
    DELETE: 'badge-danger',
    GET_ALL: 'badge-primary',
    GET_ONE: 'badge-primary'
  };

  return (
    <span className={`badge ${actionColors[action] || 'badge-default'}`}>
      {action}
    </span>
  );
}

export default function AuditoriaTable({ data = [], currentPage = 1, itemsPerPage = 10 }) {
  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="inc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>IP</th>
              <th>Acción</th>
              <th>Modelo</th>
              <th>Estado</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                  No hay registros de auditoría disponibles
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={item.id}>
                <td style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px'}}>
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td>
                  <strong>{item.user?.username || 'N/A'}</strong>
                  <br />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                    ID: {item.user?.id?.substring(0, 8) || 'N/A'}...
                  </small>
                </td>
                <td>{item.ip}</td>
                <td>{getActionBadge(item.action)}</td>
                <td>
                  <span className="badge badge-default">{item.model}</span>
                </td>
                <td>{getStatusBadge(item.status)}</td>
                <td>
                  {item.description}
                  {(item.preview_content || item.new_content) && (
                    <div style={{ marginTop: '8px' }}>
                      {item.preview_content && (
                        <details>
                          <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.85em' }}>
                            📄 Contenido anterior
                          </summary>
                          <pre style={{
                            fontSize: '0.75em',
                            background: 'var(--bg)',
                            padding: '8px',
                            borderRadius: '4px',
                            marginTop: '4px',
                            overflow: 'auto',
                            maxHeight: '150px',
                            border: '1px solid var(--border)'
                          }}>
                            {JSON.stringify(JSON.parse(item.preview_content || '{}'), null, 2)}
                          </pre>
                        </details>
                      )}
                      {item.new_content && (
                        <details style={{ marginTop: '4px' }}>
                          <summary style={{ cursor: 'pointer', color: 'var(--success)', fontSize: '0.85em' }}>
                            ✅ Contenido nuevo
                          </summary>
                          <pre style={{
                            fontSize: '0.75em',
                            background: 'var(--bg)',
                            padding: '8px',
                            borderRadius: '4px',
                            marginTop: '4px',
                            overflow: 'auto',
                            maxHeight: '150px',
                            border: '1px solid var(--border)'
                          }}>
                            {JSON.stringify(JSON.parse(item.new_content || '{}'), null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                  {item.register_id && (
                    <div style={{ marginTop: '4px' }}>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                        Registro: <code style={{
                          fontSize: '0.85em',
                          background: 'var(--bg)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {item.register_id.substring(0, 8)}...
                        </code>
                      </small>
                    </div>
                  )}
                  {item.field && (
                    <div style={{ marginTop: '4px' }}>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                        Campo: <strong>{item.field}</strong>
                      </small>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
