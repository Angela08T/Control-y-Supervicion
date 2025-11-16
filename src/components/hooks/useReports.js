import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import useFetch from './useFetch';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';
import { getModulePermissions } from '@/helpers/permissions';

/**
 * Hook personalizado para gestión de reportes/incidencias
 * Reemplaza todas las funciones de helpers/api/report.jsx
 *
 * @returns {Object} Estados y funciones para gestionar reportes
 */
export const useReports = () => {
  const { role: userRole } = useSelector((state) => state.auth);
  const { getData, postData, patchData, deleteData } = useFetch();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    lackId: null,
    subjectId: null,
    jurisdictionId: null,
    shift: ''
  });

  const permissions = getModulePermissions(userRole, 'incidencias');

  /**
   * Transformar datos de reporte de API a formato interno
   */
  const transformReportData = (r) => {
    const encargadoBodycam =
      r.bodycam_supervisor ||
      r.bodycamSupervisor ||
      r.supervisor ||
      (r.user ? `${r.user.name} ${r.user.lastname}`.trim() : '');

    return {
      id: r.id,
      dni: r.offender?.dni || '',
      asunto: r.subject?.name || '',
      falta: r.lack?.name || '',
      tipoInasistencia: r.subject?.name === 'Inasistencia' ? r.lack?.name : null,
      medio: r.bodycam ? 'Bodycam' : 'Otro',
      fechaIncidente: r.date ? r.date.substring(0, 10).split('-').reverse().join('/') : '',
      horaIncidente: r.date ? r.date.substring(11, 16) : '',
      turno: r.offender?.shift || '',
      cargo: r.offender?.job || '',
      regLab: r.offender?.regime || '',
      jurisdiccion: r.jurisdiction?.name || r.offender?.subgerencia || '',
      jurisdictionId: r.jurisdiction?.id || null,
      bodycamNumber: r.bodycam?.name || '',
      bodycamAsignadaA: r.bodycam_user || r.bodycamUser || '',
      encargadoBodycam: encargadoBodycam,
      dirigidoA: r.header?.to?.job || '',
      destinatario: r.header?.to?.name || '',
      cargoDestinatario: r.header?.to?.job || '',
      cc: (r.header?.cc || []).map(c => c.name),
      ubicacion: {
        address: r.address || '',
        coordinates: [r.latitude || null, r.longitude || null]
      },
      nombreCompleto: r.offender ? `${r.offender.name} ${r.offender.lastname}`.trim() : '',
      status: r.process ? r.process.toLowerCase() : 'draft',
      evidences: r.evidences || [],
      createdAt: r.lack?.created_at || r.date,
      updatedAt: r.lack?.updated_at || r.date
    };
  };

  /**
   * Transformar datos del formulario al formato de API
   */
  const mapFormDataToAPI = (form, allLeads = []) => {
    const coords = form.ubicacion?.coordinates || [null, null];

    const to = {
      name: form.destinatario || '',
      job: form.dirigidoA || ''
    };

    let cc = (form.cc || []).map(nombre => {
      const lead = allLeads.find(l => `${l.name} ${l.lastname}`.trim() === nombre);
      return {
        name: nombre || '',
        job: lead?.job?.name || ''
      };
    });

    const [year, month, day] = form.fechaIncidente.split('-');
    const [hour, minute] = form.horaIncidente.split(':');
    const date = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      0
    )).toISOString();

    const payload = {
      header: { to, cc },
      address: form.ubicacion?.address || '',
      latitude: coords[0] !== null ? parseFloat(coords[0]) : null,
      longitude: coords[1] !== null ? parseFloat(coords[1]) : null,
      date,
      offender_dni: form.dni || '',
      lack_id: form.lackId || null,
      subject_id: form.subjectId || null,
      jurisdiction_id: form.jurisdictionId || null
    };

    if (form.bodycamId) {
      payload.bodycam_id = form.bodycamId;
      payload.bodycam_dni = form.dni || '';
    }

    return payload;
  };

  /**
   * Obtener reportes con paginación y filtros
   */
  const fetchReports = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);

      if (filters.search) params.append('search', filters.search);
      if (filters.lackId) params.append('lack', filters.lackId);
      if (filters.subjectId) params.append('subject', filters.subjectId);
      if (filters.jurisdictionId) params.append('jurisdiction', filters.jurisdictionId);
      if (filters.shift) params.append('shift', filters.shift);

      const response = await getData(`${API_URL}/report?${params.toString()}`, false);

      if (response.status) {
        const responseData = response.data?.data || response.data;
        const reportsArray = responseData?.data || [];
        const transformedReports = reportsArray.map(transformReportData);

        setReports(transformedReports);

        const currentPageNum = responseData?.currentPage || page;
        const totalNum = responseData?.totalCount || transformedReports.length;
        const perPageNum = limit;
        const totalPagesNum = Math.ceil(totalNum / perPageNum);
        const from = totalNum === 0 ? 0 : ((currentPageNum - 1) * perPageNum) + 1;
        const to = Math.min(currentPageNum * perPageNum, totalNum);

        setPagination({
          currentPage: currentPageNum,
          totalPages: totalPagesNum,
          perPage: perPageNum,
          total: totalNum,
          from,
          to
        });
      } else {
        showError('Error', 'No se pudieron cargar los reportes');
        setReports([]);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      showError('Error', 'Ocurrió un error al cargar los reportes');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filters, getData]);

  /**
   * Buscar reportes por término
   */
  const searchReports = async (searchTerm, page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('search', searchTerm);
      params.append('page', page);
      params.append('limit', limit);

      const response = await getData(`${API_URL}/report?${params.toString()}`, false);

      if (response.status) {
        return response.data;
      }
      return { data: [], pagination: null };
    } catch (error) {
      console.error('Error al buscar reportes:', error);
      return { data: [], pagination: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener reporte por ID
   */
  const getReportById = async (reportId) => {
    try {
      const response = await getData(`${API_URL}/report/${reportId}`, false);

      if (response.status && response.data?.data) {
        const transformed = transformReportData(response.data.data);
        return { data: [transformed], found: true };
      }
      return { data: [], found: false };
    } catch (error) {
      console.error('Error al buscar reporte por ID:', error);
      if (error.response?.status === 404) {
        return { data: [], found: false };
      }
      throw error;
    }
  };

  /**
   * Crear un nuevo reporte
   */
  const crearReport = async (reportData, allLeads = []) => {
    try {
      if (!permissions.canCreate) {
        showError('Sin permisos', 'No tienes permisos para crear reportes');
        return false;
      }

      const payload = mapFormDataToAPI(reportData, allLeads);
      const response = await postData(`${API_URL}/report`, payload);

      if (response.status) {
        showSuccess('Reporte creado', 'El reporte se creó correctamente');
        await fetchReports(pagination.currentPage, pagination.perPage);
        return response.data;
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('\n')
          : response.message || 'Error al crear el reporte';
        showError('Error', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error al crear reporte:', error);
      showError('Error', error.message || 'Ocurrió un error al crear el reporte');
      return false;
    }
  };

  /**
   * Eliminar reporte
   */
  const eliminarReport = async (report) => {
    try {
      if (!permissions.canDelete) {
        showError('Sin permisos', 'No tienes permisos para eliminar reportes');
        return false;
      }

      const confirmed = await showDeleteConfirm('este reporte');
      if (!confirmed) return false;

      const response = await deleteData(`${API_URL}/report/${report.id}`);

      if (response.status) {
        showSuccess('Reporte eliminado', 'El reporte se eliminó correctamente');
        await fetchReports(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar el reporte');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar el reporte');
      return false;
    }
  };

  /**
   * Actualizar reporte con evidencias
   */
  const updateReportWithEvidences = async (reportId, files = [], descriptions = [], message = '') => {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', file);
      });

      descriptions.forEach((desc) => {
        formData.append('descriptions', desc);
      });

      if (message) {
        formData.append('message', message);
      }

      const response = await patchData(`${API_URL}/report/${reportId}`, formData, true);

      if (response.status) {
        showSuccess('Evidencias actualizadas', 'Las evidencias se guardaron correctamente');
        return response.data;
      } else {
        showError('Error', response.message || 'Error al actualizar evidencias');
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar reporte con evidencias:', error);
      showError('Error', error.message || 'Ocurrió un error al actualizar las evidencias');
      return false;
    }
  };

  /**
   * Obtener reporte con evidencias completo
   */
  const getReportWithEvidences = async (reportId) => {
    try {
      const response = await getData(`${API_URL}/report/${reportId}`, false);

      if (response.status && response.data?.data) {
        const report = response.data.data;
        const evidences = (report.evidences || []).map(ev => ({
          id: ev.id,
          description: ev.description,
          path: ev.path,
          imageUrl: getEvidenceImageUrl(ev.path),
          mimetype: ev.mimetype,
          size: ev.size,
          createdAt: ev.created_at
        }));

        return {
          ...report,
          evidences,
          message: report.message || ''
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener reporte con evidencias:', error);
      return null;
    }
  };

  /**
   * Obtener URL de imagen de evidencia
   */
  const getEvidenceImageUrl = (evidencePath) => {
    const cleanPath = evidencePath.startsWith('/') ? evidencePath.substring(1) : evidencePath;
    return `${API_URL}/${cleanPath}`;
  };

  /**
   * Eliminar evidencia
   */
  const deleteEvidence = async (evidenceId) => {
    try {
      const response = await deleteData(`${API_URL}/evidence/${evidenceId}`);

      if (response.status) {
        showSuccess('Evidencia eliminada', 'La evidencia se eliminó correctamente');
        return true;
      } else {
        showError('Error', response.message || 'Error al eliminar la evidencia');
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar evidencia:', error);
      showError('Error', error.message || 'Ocurrió un error al eliminar la evidencia');
      return false;
    }
  };

  /**
   * Enviar incidencia al validador
   */
  const sendToValidator = async (reportId) => {
    try {
      const response = await patchData(`${API_URL}/report/${reportId}/send`, {});

      if (response.status) {
        showSuccess('Incidencia enviada', 'La incidencia se envió al validador');
        await fetchReports(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al enviar incidencia');
        return false;
      }
    } catch (error) {
      console.error('Error al enviar incidencia:', error);
      showError('Error', error.message || 'Ocurrió un error al enviar la incidencia');
      return false;
    }
  };

  /**
   * Validar incidencia (aprobar/rechazar)
   */
  const validateReport = async (reportId, approved) => {
    try {
      const response = await patchData(`${API_URL}/report/${reportId}/validate`, { approved });

      if (response.status) {
        const message = approved ? 'Incidencia aprobada' : 'Incidencia rechazada';
        showSuccess('Validación exitosa', message);
        await fetchReports(pagination.currentPage, pagination.perPage);
        return true;
      } else {
        showError('Error', response.message || 'Error al validar incidencia');
        return false;
      }
    } catch (error) {
      console.error('Error al validar incidencia:', error);
      showError('Error', error.message || 'Ocurrió un error al validar la incidencia');
      return false;
    }
  };

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchReports(pagination.currentPage, pagination.perPage);
  }, [fetchReports]);

  return {
    reports,
    loading,
    pagination,
    filters,
    permissions,
    fetchReports,
    searchReports,
    getReportById,
    crearReport,
    eliminarReport,
    updateReportWithEvidences,
    getReportWithEvidences,
    getEvidenceImageUrl,
    deleteEvidence,
    sendToValidator,
    validateReport,
    mapFormDataToAPI,
    updateFilters,
    setPagination
  };
};

export default useReports;
