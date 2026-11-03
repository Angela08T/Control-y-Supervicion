import { useState, useEffect } from 'react';
import { getJobs } from '../../api/job';
import type { Job } from '@/types';

/** Forma de la respuesta: lista directa o envuelta en `data` (o `data.data`) */
type JobListPayload = Job[] | { data: Job[] | { data: Job[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface JobsApiError {
  response?: { data?: { message?: string } };
}

export interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}

const useJobs = (): UseJobsResult => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: JobListPayload = await getJobs();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let jobList: Job[] = [];

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
        const apiError = err as JobsApiError;
        setError(apiError.response?.data?.message || 'Error al cargar cargos');
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
