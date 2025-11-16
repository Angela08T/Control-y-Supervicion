import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalUser from '@/Components/Modal/ModalUser';
import useUsuarios from '@/Components/hooks/useUsuarios';

/**
 * Página de Creación de Usuario
 *
 * Muestra un modal para crear un nuevo usuario
 * Redirige a la lista después de crear
 */
export default function AddUsuarios() {
  const navigate = useNavigate();
  const { role: userRole } = useSelector((state) => state.auth);
  const { crearUsuario } = useUsuarios();

  const [saving, setSaving] = useState(false);

  /**
   * Manejar guardado de nuevo usuario
   */
  const handleSave = async (userData) => {
    setSaving(true);
    const success = await crearUsuario(userData);
    setSaving(false);

    if (success) {
      // Redirigir a la lista
      navigate('/dashboard/admin/usuarios');
    }
  };

  /**
   * Cancelar y volver a la lista
   */
  const handleClose = () => {
    navigate('/dashboard/admin/usuarios');
  };

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>CREAR NUEVO USUARIO</h2>
      </header>

      <ModalUser
        initial={null}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
