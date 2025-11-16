import { useState, useEffect } from 'react';
import { getSubjects } from '@/helpers/api/subject';

const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getSubjects();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let subjectList = [];

        if (Array.isArray(response)) {
          subjectList = response;
        } else if (response.data && Array.isArray(response.data)) {
          subjectList = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          subjectList = response.data.data;
        }

        setSubjects(subjectList);
      } catch (err) {
        console.error('Error obteniendo subjects:', err);
        setError(err.response?.data?.message || 'Error al cargar asuntos');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return {
    subjects,
    loading,
    error
  };
};

export default useSubjects;
