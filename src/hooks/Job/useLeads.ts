import { useState, useEffect } from 'react';
import { getLeadsByJob } from '../../api/job';
import type { ID, Lead } from '@/types';

/** Forma de la respuesta: lista directa o envuelta en `data` (o `data.data`) */
type LeadListPayload = Lead[] | { data: Lead[] | { data: Lead[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface LeadsApiError {
  response?: { data?: { message?: string } };
}

export interface UseLeadsResult {
  leads: Lead[];
  loading: boolean;
  error: string | null;
}

const useLeads = (jobId: ID | null | undefined): UseLeadsResult => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        const response: LeadListPayload = await getLeadsByJob(jobId);

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

        setLeads(leadList);
      } catch (err) {
        const apiError = err as LeadsApiError;
        setError(apiError.response?.data?.message || 'Error al cargar personas');
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
