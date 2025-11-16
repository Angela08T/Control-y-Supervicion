import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalJob from '@/Components/Modal/ModalJob';
import useJobs from '@/Components/hooks/useJobs';

/**
 * Página de Creación de Cargo
 *
 * Muestra un modal para crear un nuevo cargo
 * Redirige a la lista después de crear
 */
export default function AddJobs() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearJob } = useJobs();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nuevo cargo
   */
  const handleSave = async (jobData) => {
    setSaving(true);
    const success = await crearJob(jobData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/cargos');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/cargos');
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVO CARGO</h2>
      </header>

      <ModalJob
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
