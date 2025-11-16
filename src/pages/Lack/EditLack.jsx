import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalLack from '@/Components/Modal/ModalLack';
import useLacks from '@/Components/hooks/useLacks';

/**
 * Página de Edición de Falta
 *
 * Muestra un modal para editar una falta existente
 * Carga los datos de la falta por ID
 * Redirige a la lista después de editar
 */
export default function EditLack() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { lacks, actualizarLack } = useLacks();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar falta a editar
   */
  useEffect(() => {
    if (lacks.length > 0 && id) {
      const lack = lacks.find(l => l.id === parseInt(id));

      if (lack) {
        setEditItem(lack);
      } else {
        // Falta no encontrada, volver a la lista
        navigate('/dashboard/admin/faltas');
      }

      setLoading(false);
    }
  }, [lacks, id, navigate]);

  /**
   * Manejar guardado de falta editada
   */
  const handleSave = async (lackData) => {
    setSaving(true);
    const success = await actualizarLack(id, lackData);
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

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR FALTA</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos de la falta...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR FALTA</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Falta no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR FALTA</h2>
      </header>

      <ModalLack
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
