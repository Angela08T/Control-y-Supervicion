import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalOffender from '@/Components/Modal/ModalOffender';
import useOffenders from '@/Components/hooks/useOffenders';

/**
 * Página de Creación de Infractor
 *
 * Muestra un modal para crear un nuevo infractor
 * Redirige a la lista después de crear
 */
export default function AddOffender() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearOffender } = useOffenders();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nuevo infractor
   */
  const handleSave = async (offenderData) => {
    setSaving(true);
    const success = await crearOffender(offenderData);
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

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVO INFRACTOR</h2>
      </header>

      <ModalOffender
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
