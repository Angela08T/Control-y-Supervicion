import { useState, useEffect } from 'react';
import { getLacks } from '../../api/lack';

const useLacks = () => {
  const [lacks, setLacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLacks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getLacks();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let lackList = [];

        if (Array.isArray(response)) {
          lackList = response;
        } else if (response.data && Array.isArray(response.data)) {
          lackList = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          lackList = response.data.data;
        }

        setLacks(lackList);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar faltas');
        setLacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLacks();
  }, []);

  return {
    lacks,
    loading,
    error
  };
};

export default useLacks;
