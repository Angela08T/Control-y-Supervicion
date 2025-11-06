import { useState, useEffect } from 'react';
import { getJurisdictions } from '../../api/jurisdiction';

const useJurisdictions = () => {
  const [jurisdictions, setJurisdictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJurisdictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getJurisdictions();
        console.log('🏛️ Respuesta completa de jurisdicciones:', response);

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let jurisdictionList = [];

        if (Array.isArray(response)) {
          jurisdictionList = response;
        } else if (response.data && Array.isArray(response.data)) {
          jurisdictionList = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          jurisdictionList = response.data.data;
        }

        console.log('🏛️ Lista de jurisdicciones procesada:', jurisdictionList);
        setJurisdictions(jurisdictionList);
      } catch (err) {
        console.error('Error obteniendo jurisdicciones:', err);
        setError(err.response?.data?.message || 'Error al cargar jurisdicciones');
        setJurisdictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJurisdictions();
  }, []);

  return {
    jurisdictions,
    loading,
    error
  };
};

export default useJurisdictions;
