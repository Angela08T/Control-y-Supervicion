import { useState, useEffect } from 'react';
import { getLeadsByJob } from '../../api/job';

const useLeads = (jobId) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay jobId, resetear
    if (!jobId) {
      setLeads([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchLeads = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getLeadsByJob(jobId);

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let leadList = [];

        if (Array.isArray(response)) {
          leadList = response;
        } else if (response.data && Array.isArray(response.data)) {
          leadList = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          leadList = response.data.data;
        }

        setLeads(leadList);
      } catch (err) {
        console.error('Error obteniendo leads:', err);
        setError(err.response?.data?.message || 'Error al cargar personas');
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [jobId]); // Se vuelve a ejecutar cada vez que cambia el jobId

  return {
    leads,
    loading,
    error
  };
};

export default useLeads;
