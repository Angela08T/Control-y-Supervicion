import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalLack from '@/Components/Modal/ModalLack';
import useLacks from '@/Components/hooks/useLacks';

/**
 * Página de Creación de Falta
 *
 * Muestra un modal para crear una nueva falta
 * Redirige a la lista después de crear
 */
export default function AddLack() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearLack } = useLacks();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nueva falta
   */
  const handleSave = async (lackData) => {
    setSaving(true);
    const success = await crearLack(lackData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/faltas');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/faltas');
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVA FALTA</h2>
      </header>

      <ModalLack
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
