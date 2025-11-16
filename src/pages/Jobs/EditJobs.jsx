import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalJob from '@/Components/Modal/ModalJob';
import useJobs from '@/Components/hooks/useJobs';

/**
 * Página de Edición de Cargo
 *
 * Muestra un modal para editar un cargo existente
 * Carga los datos del cargo por ID
 * Redirige a la lista después de editar
 */
export default function EditJobs() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { jobs, actualizarJob } = useJobs();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar cargo a editar
   */
  useEffect(() => {
    if (jobs.length > 0 && id) {
      const job = jobs.find(j => j.id === parseInt(id));

      if (job) {
        setEditItem(job);
      } else {
        // Cargo no encontrado, volver a la lista
        navigate('/dashboard/admin/cargos');
      }

      setLoading(false);
    }
  }, [jobs, id, navigate]);

  /**
   * Manejar guardado de cargo editado
   */
  const handleSave = async (jobData) => {
    setSaving(true);
    const success = await actualizarJob(id, jobData);
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

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR CARGO</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos del cargo...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR CARGO</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargo no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR CARGO</h2>
      </header>

      <ModalJob
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
