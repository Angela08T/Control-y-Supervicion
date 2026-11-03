import { useState, useEffect } from 'react';
import { getAllLeads } from '../../api/job';
import type { Lead } from '@/types';

/** Forma de la respuesta: lista directa o envuelta en `data` (o `data.data`) */
type LeadListPayload = Lead[] | { data: Lead[] | { data: Lead[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface AllLeadsApiError {
  response?: { data?: { message?: string } };
}

export interface UseAllLeadsResult {
  allLeads: Lead[];
  loading: boolean;
  error: string | null;
}

const useAllLeads = (): UseAllLeadsResult => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllLeads = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: LeadListPayload = await getAllLeads();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let leadList: Lead[] = [];

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
        const apiError = err as AllLeadsApiError;
        setError(apiError.response?.data?.message || 'Error al cargar lista de personas');
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
