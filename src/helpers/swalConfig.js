import Swal from 'sweetalert2';

/**
 * Configuración personalizada de SweetAlert2
 */

// Configuración base para todos los alerts
const baseConfig = {
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Aceptar',
  cancelButtonText: 'Cancelar'
};

/**
 * Alert de éxito
 * @param {string} title - Título del alert
 * @param {string} text - Texto del alert
 * @returns {Promise}
 */
export const showSuccess = (title = '¡Éxito!', text = 'Operación completada exitosamente') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'success',
    title,
    text,
    timer: 3000,
    timerProgressBar: true
  });
};

/**
 * Alert de error
 * @param {string} title - Título del alert
 * @param {string} text - Texto del alert
 * @returns {Promise}
 */
export const showError = (title = 'Error', text = 'Ha ocurrido un error') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'error',
    title,
    text
  });
};

/**
 * Alert de advertencia
 * @param {string} title - Título del alert
 * @param {string} text - Texto del alert
 * @returns {Promise}
 */
export const showWarning = (title = 'Advertencia', text = '') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title,
    text
  });
};

/**
 * Alert de información
 * @param {string} title - Título del alert
 * @param {string} text - Texto del alert
 * @returns {Promise}
 */
export const showInfo = (title = 'Información', text = '') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'info',
    title,
    text
  });
};

/**
 * Alert de confirmación
 * @param {string} title - Título del alert
 * @param {string} text - Texto del alert
 * @param {string} confirmText - Texto del botón de confirmar
 * @returns {Promise<boolean>} True si confirma, false si cancela
 */
export const showConfirm = async (
  title = '¿Estás seguro?',
  text = 'Esta acción no se puede deshacer',
  confirmText = 'Sí, confirmar'
) => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText
  });

  return result.isConfirmed;
};

/**
 * Alert de confirmación de eliminación
 * @param {string} itemName - Nombre del item a eliminar
 * @returns {Promise<boolean>}
 */
export const showDeleteConfirm = async (itemName = 'este elemento') => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title: '¿Eliminar?',
    text: `¿Estás seguro de eliminar ${itemName}? Esta acción no se puede deshacer.`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  });

  return result.isConfirmed;
};

/**
 * Alert con input de texto
 * @param {string} title - Título
 * @param {string} placeholder - Placeholder del input
 * @param {string} defaultValue - Valor por defecto
 * @returns {Promise<string|null>} Valor ingresado o null si cancela
 */
export const showInputText = async (
  title = 'Ingrese un valor',
  placeholder = '',
  defaultValue = ''
) => {
  const result = await Swal.fire({
    ...baseConfig,
    title,
    input: 'text',
    inputPlaceholder: placeholder,
    inputValue: defaultValue,
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Este campo es requerido';
      }
    }
  });

  return result.isConfirmed ? result.value : null;
};

/**
 * Alert de carga (loading)
 * @param {string} title - Título
 */
export const showLoading = (title = 'Cargando...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

/**
 * Cierra el alert de carga
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * Toast notification (pequeño popup en esquina)
 * @param {string} icon - 'success', 'error', 'warning', 'info'
 * @param {string} title - Título del toast
 */
export const showToast = (icon = 'success', title = 'Operación completada') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon,
    title
  });
};

export default Swal;
