import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModalUser from '@/Components/Modal/ModalUser';
import useUsuarios from '@/Components/hooks/useUsuarios';

/**
 * Página de Edición de Usuario
 *
 * Muestra un modal para editar un usuario existente
 * Carga los datos del usuario por ID
 * Redirige a la lista después de editar
 */
export default function EditUsuarios() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role: userRole } = useSelector((state) => state.auth);
  const { usuarios, actualizarUsuario } = useUsuarios();

  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Cargar usuario a editar
   */
  useEffect(() => {
    if (usuarios.length > 0 && id) {
      const usuario = usuarios.find(u => u.id === parseInt(id));

      if (usuario) {
        setEditItem(usuario);
      } else {
        // Usuario no encontrado, volver a la lista
        navigate('/dashboard/admin/usuarios');
      }

      setLoading(false);
    }
  }, [usuarios, id, navigate]);

  /**
   * Manejar guardado de usuario editado
   */
  const handleSave = async (userData) => {
    setSaving(true);
    const success = await actualizarUsuario(id, userData);
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

  if (loading) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR USUARIO</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Cargando datos del usuario...
        </div>
      </div>
    );
  }

  if (!editItem) {
    return (
      <div className="incidencias-page">
        <header className="page-header">
          <h2>EDITAR USUARIO</h2>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            fontSize: '1.1rem'
          }}
        >
          Usuario no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="incidencias-page">
      <header className="page-header">
        <h2>EDITAR USUARIO</h2>
      </header>

      <ModalUser
        initial={editItem}
        onClose={handleClose}
        onSave={handleSave}
        userRole={userRole}
        saving={saving}
      />
    </div>
  );
}
