import { useState, useCallback } from 'react';
import useFetch from './useFetch';
import { API_URL } from '@/helpers/Constants';

/**
 * Hook personalizado para estadísticas del dashboard
 * Reemplaza helpers/api/statistics.jsx
 *
 * @returns {Object} Estados y funciones para gestionar estadísticas
 */
export const useDashboardStats = () => {
  const { getData } = useFetch();

  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [generalStats, setGeneralStats] = useState(null);
  const [fieldSupervision, setFieldSupervision] = useState(null);
  const [offenders, setOffenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener estadísticas generales del dashboard
   */
  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData(`${API_URL}/statistics/dashboard`, false);

      if (response.status) {
        setStats(response.data);
        return response.data;
      } else {
        console.warn('Endpoint de estadísticas no disponible');
        setStats(null);
        return null;
      }
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError(err.message || 'Error al obtener estadísticas');
      setStats(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getData]);

  /**
   * Obtener tendencias del dashboard por rango de fechas
   * @param {string} startDate - Fecha inicio YYYY-MM-DD
   * @param {string} endDate - Fecha fin YYYY-MM-DD
   */
  const fetchDashboardTrends = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('start', startDate);
      params.append('end', endDate);

      const response = await getData(`${API_URL}/dashboard/trends/?${params.toString()}`, false);

      if (response.status) {
        setTrends(response.data);
        return response.data;
      } else {
        console.warn('Endpoint de tendencias no disponible');
        setTrends(null);
        return null;
      }
    } catch (err) {
      console.error('Error al obtener tendencias:', err);
      setError(err.message || 'Error al obtener tendencias');
      setTrends(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getData]);

  /**
   * Obtener estadísticas generales del dashboard
   * @param {string} startDate - Fecha inicio YYYY-MM-DD
   * @param {string} endDate - Fecha fin YYYY-MM-DD
   */
  const fetchDashboardGeneral = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('start', startDate);
      params.append('end', endDate);

      const response = await getData(`${API_URL}/dashboard/general/?${params.toString()}`, false);

      if (response.status) {
        setGeneralStats(response.data);
        return response.data;
      } else {
        console.warn('Endpoint de estadísticas generales no disponible');
        setGeneralStats(null);
        return null;
      }
    } catch (err) {
      console.error('Error al obtener estadísticas generales:', err);
      setError(err.message || 'Error al obtener estadísticas generales');
      setGeneralStats(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getData]);

  /**
   * Obtener estadísticas de supervisión de campo
   */
  const fetchFieldSupervision = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData(`${API_URL}/statistics/field-supervision`, false);

      if (response.status) {
        setFieldSupervision(response.data);
        return response.data;
      } else {
        console.warn('Endpoint de supervisión de campo no disponible');
        setFieldSupervision(null);
        return null;
      }
    } catch (err) {
      console.error('Error al obtener supervisión de campo:', err);
      setError(err.message || 'Error al obtener supervisión de campo');
      setFieldSupervision(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getData]);

  /**
   * Obtener lista de todos los offenders (para tabla de personal)
   */
  const fetchAllOffenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData(`${API_URL}/offender`, false);

      if (response.status) {
        const data = response.data?.data || response.data || [];
        setOffenders(Array.isArray(data) ? data : []);
        return data;
      } else {
        console.warn('Endpoint de offenders no disponible');
        setOffenders([]);
        return [];
      }
    } catch (err) {
      console.error('Error al obtener offenders:', err);
      setError(err.message || 'Error al obtener offenders');
      setOffenders([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getData]);

  /**
   * Cargar todas las estadísticas del dashboard
   * @param {string} startDate - Fecha inicio YYYY-MM-DD
   * @param {string} endDate - Fecha fin YYYY-MM-DD
   */
  const fetchAllDashboardData = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        fetchDashboardStats(),
        fetchDashboardTrends(startDate, endDate),
        fetchDashboardGeneral(startDate, endDate),
        fetchFieldSupervision(),
        fetchAllOffenders()
      ]);

      const hasError = results.some(r => r.status === 'rejected');
      if (hasError) {
        console.warn('Algunas estadísticas no pudieron cargarse');
      }

      return {
        stats: results[0].status === 'fulfilled' ? results[0].value : null,
        trends: results[1].status === 'fulfilled' ? results[1].value : null,
        general: results[2].status === 'fulfilled' ? results[2].value : null,
        fieldSupervision: results[3].status === 'fulfilled' ? results[3].value : null,
        offenders: results[4].status === 'fulfilled' ? results[4].value : []
      };
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      setError(err.message || 'Error al cargar datos del dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchDashboardTrends, fetchDashboardGeneral, fetchFieldSupervision, fetchAllOffenders]);

  return {
    stats,
    trends,
    generalStats,
    fieldSupervision,
    offenders,
    loading,
    error,
    fetchDashboardStats,
    fetchDashboardTrends,
    fetchDashboardGeneral,
    fetchFieldSupervision,
    fetchAllOffenders,
    fetchAllDashboardData
  };
};

export default useDashboardStats;
