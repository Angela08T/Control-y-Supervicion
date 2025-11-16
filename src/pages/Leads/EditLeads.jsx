import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalLead from '@/Components/Modal/ModalLead';
import useLeads from '@/Components/hooks/useLeads';

/**
 * Página de Edición de Personal
 *
 * Muestra un modal para editar un personal existente
 * Carga los datos del personal por ID
 * Redirige a la lista después de editar
 */
export default function EditLeads() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { leads, actualizarLead } = useLeads();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar personal a editar
   */
  useEffect(() => {
    if (leads.length > 0 && id) {
      const lead = leads.find(l => l.id === parseInt(id));

      if (lead) {
        setEditItem(lead);
      } else {
        // Personal no encontrado, volver a la lista
        navigate('/dashboard/admin/personal');
      }

      setLoading(false);
    }
  }, [leads, id, navigate]);

  /**
   * Manejar guardado de personal editado
   */
  const handleSave = async (leadData) => {
    setSaving(true);
    const success = await actualizarLead(id, leadData);
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

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR PERSONAL</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos del personal...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR PERSONAL</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Personal no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR PERSONAL</h2>
      </header>

      <ModalLead
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
