import { useState, useEffect } from 'react';
import { getJobs } from '../../api/job';

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getJobs();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let jobList = [];

        if (Array.isArray(response)) {
          jobList = response;
        } else if (response.data && Array.isArray(response.data)) {
          jobList = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          jobList = response.data.data;
        }

        setJobs(jobList);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar cargos');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    error
  };
};

export default useJobs;
