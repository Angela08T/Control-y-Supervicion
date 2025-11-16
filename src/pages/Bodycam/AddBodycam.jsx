import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalBodycam from '@/Components/Modal/ModalBodycam';
import useBodycams from '@/Components/hooks/useBodycams';

/**
 * Página de Creación de Bodycam
 *
 * Muestra un modal para crear una nueva bodycam
 * Redirige a la lista después de crear
 */
export default function AddBodycam() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearBodycam } = useBodycams();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nueva bodycam
   */
  const handleSave = async (bodycamData) => {
    setSaving(true);
    const success = await crearBodycam(bodycamData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/bodycam');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/bodycam');
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVA BODYCAM</h2>
      </header>

      <ModalBodycam
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
