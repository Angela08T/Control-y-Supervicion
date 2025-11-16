import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalLead from '@/Components/Modal/ModalLead';
import useLeads from '@/Components/hooks/useLeads';

/**
 * Página de Creación de Personal
 *
 * Muestra un modal para crear un nuevo personal
 * Redirige a la lista después de crear
 */
export default function AddLeads() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearLead } = useLeads();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nuevo personal
   */
  const handleSave = async (leadData) => {
    setSaving(true);
    const success = await crearLead(leadData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/personal');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/personal');
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVO PERSONAL</h2>
      </header>

      <ModalLead
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
