import { useState, useEffect } from 'react';
import { getAllLeads } from '@/helpers/api/job';

const useAllLeads = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllLeads = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAllLeads();

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

        setAllLeads(leadList);
      } catch (err) {
        console.error('Error obteniendo todos los leads:', err);
        setError(err.response?.data?.message || 'Error al cargar lista de personas');
        setAllLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLeads();
  }, []);

  return {
    allLeads,
    loading,
    error
  };
};

export default useAllLeads;
