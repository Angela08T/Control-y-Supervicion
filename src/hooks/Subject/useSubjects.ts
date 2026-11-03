import { useState, useEffect } from 'react';
import { getSubjects } from '../../api/subject';
import type { Subject } from '@/types';

/** Forma de la respuesta: lista directa o envuelta en `data` (o `data.data`) */
type SubjectListPayload = Subject[] | { data: Subject[] | { data: Subject[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface SubjectsApiError {
  response?: { data?: { message?: string } };
}

export interface UseSubjectsResult {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
}

const useSubjects = (): UseSubjectsResult => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: SubjectListPayload = await getSubjects();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let subjectList: Subject[] = [];

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
        const apiError = err as SubjectsApiError;
        setError(apiError.response?.data?.message || 'Error al cargar asuntos');
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
