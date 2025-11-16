import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalSubject from '@/Components/Modal/ModalSubject';
import useSubjects from '@/Components/hooks/useSubjects';

/**
 * Página de Creación de Asunto
 *
 * Muestra un modal para crear un nuevo asunto
 * Redirige a la lista después de crear
 */
export default function AddSubject() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearSubject } = useSubjects();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nuevo asunto
   */
  const handleSave = async (subjectData) => {
    setSaving(true);
    const success = await crearSubject(subjectData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/asuntos');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/asuntos');
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVO ASUNTO</h2>
      </header>

      <ModalSubject
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
