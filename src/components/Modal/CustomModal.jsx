import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * Componente de modal reutilizable
 * @param {Boolean} isOpen - Estado del modal
 * @param {Function} onClose - Función para cerrar el modal
 * @param {String} title - Título del modal
 * @param {ReactNode} children - Contenido del modal
 * @param {String} size - Tamaño del modal: 'small', 'medium', 'large', 'xlarge'
 * @param {Boolean} showCloseButton - Mostrar botón de cerrar
 * @param {Boolean} closeOnOverlayClick - Cerrar al hacer click fuera
 */
const CustomModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  // Manejar tecla ESC para cerrar
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
    xlarge: 'modal-xlarge'
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${sizeClasses[size]} ${className}`}>
        {/* Header */}
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          {showCloseButton && (
            <button
              className="modal-close-button"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
