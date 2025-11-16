import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalSubject from '@/Components/Modal/ModalSubject';
import useSubjects from '@/Components/hooks/useSubjects';

/**
 * Página de Edición de Asunto
 *
 * Muestra un modal para editar un asunto existente
 * Carga los datos del asunto por ID
 * Redirige a la lista después de editar
 */
export default function EditSubject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { subjects, actualizarSubject } = useSubjects();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar asunto a editar
   */
  useEffect(() => {
    if (subjects.length > 0 && id) {
      const subject = subjects.find(s => s.id === parseInt(id));

      if (subject) {
        setEditItem(subject);
      } else {
        // Asunto no encontrado, volver a la lista
        navigate('/dashboard/admin/asuntos');
      }

      setLoading(false);
    }
  }, [subjects, id, navigate]);

  /**
   * Manejar guardado de asunto editado
   */
  const handleSave = async (subjectData) => {
    setSaving(true);
    const success = await actualizarSubject(id, subjectData);
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

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR ASUNTO</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos del asunto...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR ASUNTO</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Asunto no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR ASUNTO</h2>
      </header>

      <ModalSubject
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
