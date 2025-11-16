/**
 * Utilidades para manejo de archivos y fechas
 */

// ==================== UTILIDADES DE FECHAS ====================

/**
 * Formatea una fecha a formato DD/MM/YYYY
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha a formato YYYY-MM-DD
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDateISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha a formato legible en español
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 de enero de 2025")
 */
export const formatDateLong = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
};

/**
 * Formatea una hora a formato HH:MM
 * @param {Date|string} time - Hora a formatear
 * @returns {string} Hora formateada
 */
export const formatTime = (time) => {
  if (!time) return '';
  const d = new Date(time);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Formatea fecha y hora completa
 * @param {Date|string} datetime - Fecha y hora
 * @returns {string} Fecha y hora formateadas
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '';
  return `${formatDate(datetime)} ${formatTime(datetime)}`;
};

/**
 * Obtiene el tiempo transcurrido desde una fecha (ej: "hace 2 horas")
 * @param {Date|string} date - Fecha
 * @returns {string} Tiempo transcurrido
 */
export const getTimeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  const intervals = {
    año: 31536000,
    mes: 2592000,
    semana: 604800,
    día: 86400,
    hora: 3600,
    minuto: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `hace ${interval} ${unit}${interval > 1 ? (unit === 'mes' ? 'es' : 's') : ''}`;
    }
  }

  return 'hace un momento';
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==================== UTILIDADES DE ARCHIVOS ====================

/**
 * Descarga un archivo desde una URL
 * @param {string} url - URL del archivo
 * @param {string} filename - Nombre del archivo
 */
export const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    throw error;
  }
};

/**
 * Convierte un archivo a base64
 * @param {File} file - Archivo
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Valida el tamaño de un archivo
 * @param {File} file - Archivo
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {boolean} True si es válido
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Valida el tipo de un archivo
 * @param {File} file - Archivo
 * @param {Array<string>} allowedTypes - Tipos permitidos (ej: ['image/jpeg', 'image/png'])
 * @returns {boolean} True si es válido
 */
export const validateFileType = (file, allowedTypes = []) => {
  return allowedTypes.includes(file.type);
};

/**
 * Formatea el tamaño de un archivo a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Obtiene la extensión de un archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} Extensión (ej: "pdf")
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Exporta datos a CSV
 * @param {Array<Object>} data - Datos a exportar
 * @param {string} filename - Nombre del archivo
 * @param {Array<string>} headers - Headers del CSV
 */
export const exportToCSV = (data, filename = 'export.csv', headers = null) => {
  if (!data || data.length === 0) {
    console.error('No hay datos para exportar');
    return;
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(',')];

  for (const row of data) {
    const values = csvHeaders.map(header => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
