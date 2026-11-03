import React from 'react'
import { FaFileAlt, FaTimes } from 'react-icons/fa'

export default function ModalViewContent({ content, title, onClose }) {
  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{ maxWidth: '900px', maxHeight: '90vh' }}
      >
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFileAlt />
            {title || 'Vista de Contenido'}
          </h3>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <div
          className="modal-body"
          style={{
            maxHeight: 'calc(90vh - 120px)',
            overflowY: 'auto',
            padding: '20px'
          }}
        >
          {/* Contenido */}
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: '1.8',
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {content || 'Sin contenido disponible'}
          </div>

          {/* Información sobre placeholders */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>
              📝 Placeholders identificados en el contenido:
            </strong>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '6px',
              marginTop: '10px'
            }}>
              {[
                '{{offender.name}}',
                '{{offender.lastname}}',
                '{{offender.regime}}',
                '{{offender.job}}',
                '{{offender.shift}}',
                '{{bodycam.name}}',
                '{{lack.name}}',
                '{{address}}',
                '{{dates}}',
                '{{time}}'
              ].map((placeholder) => {
                const isPresent = content && content.includes(placeholder)
                return (
                  <span
                    key={placeholder}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      backgroundColor: isPresent
                        ? 'rgba(74, 222, 128, 0.1)'
                        : 'rgba(156, 163, 175, 0.1)',
                      color: isPresent ? '#22c55e' : '#9ca3af',
                      border: `1px solid ${isPresent ? 'rgba(74, 222, 128, 0.3)' : 'rgba(156, 163, 175, 0.2)'}`,
                      display: 'inline-block'
                    }}
                  >
                    {isPresent && '✓ '}{placeholder}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Botón de cerrar */}
          <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              className="btn-secondary"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaTimes />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
