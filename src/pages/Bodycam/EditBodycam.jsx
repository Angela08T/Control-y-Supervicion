import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalBodycam from '@/Components/Modal/ModalBodycam';
import useBodycams from '@/Components/hooks/useBodycams';

/**
 * Página de Edición de Bodycam
 *
 * Muestra un modal para editar una bodycam existente
 * Carga los datos de la bodycam por ID
 * Redirige a la lista después de editar
 */
export default function EditBodycam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { bodycams, actualizarBodycam } = useBodycams();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar bodycam a editar
   */
  useEffect(() => {
    if (bodycams.length > 0 && id) {
      const bodycam = bodycams.find(b => b.id === parseInt(id));

      if (bodycam) {
        setEditItem(bodycam);
      } else {
        // Bodycam no encontrada, volver a la lista
        navigate('/dashboard/admin/bodycam');
      }

      setLoading(false);
    }
  }, [bodycams, id, navigate]);

  /**
   * Manejar guardado de bodycam editada
   */
  const handleSave = async (bodycamData) => {
    setSaving(true);
    const success = await actualizarBodycam(id, bodycamData);
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

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR BODYCAM</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos de la bodycam...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR BODYCAM</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Bodycam no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR BODYCAM</h2>
      </header>

      <ModalBodycam
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
