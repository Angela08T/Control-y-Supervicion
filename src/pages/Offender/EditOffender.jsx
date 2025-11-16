import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalOffender from '@/Components/Modal/ModalOffender';
import useOffenders from '@/Components/hooks/useOffenders';

/**
 * Página de Edición de Infractor
 *
 * Muestra un modal para editar un infractor existente
 * Carga los datos del infractor por ID
 * Redirige a la lista después de editar
 */
export default function EditOffender() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { offenders, actualizarOffender } = useOffenders();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar infractor a editar
   */
  useEffect(() => {
    if (offenders.length > 0 && id) {
      const offender = offenders.find(o => o.id === parseInt(id));

      if (offender) {
        setEditItem(offender);
      } else {
        // Infractor no encontrado, volver a la lista
        navigate('/dashboard/admin/infractores');
      }

      setLoading(false);
    }
  }, [offenders, id, navigate]);

  /**
   * Manejar guardado de infractor editado
   */
  const handleSave = async (offenderData) => {
    setSaving(true);
    const success = await actualizarOffender(id, offenderData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/infractores');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/infractores');
  };

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR INFRACTOR</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos del infractor...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR INFRACTOR</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Infractor no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR INFRACTOR</h2>
      </header>

      <ModalOffender
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
