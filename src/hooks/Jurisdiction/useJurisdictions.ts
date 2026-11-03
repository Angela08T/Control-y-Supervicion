import { useState, useEffect } from 'react';
import { getJurisdictions } from '../../api/jurisdiction';
import type { Jurisdiction } from '@/types';

/** Forma de la respuesta: lista directa o envuelta en `data` (o `data.data`) */
type JurisdictionListPayload = Jurisdiction[] | { data: Jurisdiction[] | { data: Jurisdiction[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface JurisdictionsApiError {
  response?: { data?: { message?: string } };
}

export interface UseJurisdictionsResult {
  jurisdictions: Jurisdiction[];
  loading: boolean;
  error: string | null;
}

const useJurisdictions = (): UseJurisdictionsResult => {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJurisdictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: JurisdictionListPayload = await getJurisdictions();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let jurisdictionList: Jurisdiction[] = [];

        if (Array.isArray(response)) {
          jurisdictionList = response;
        } else if (response.data && Array.isArray(response.data)) {
          jurisdictionList = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          jurisdictionList = response.data.data;
        }

        setJurisdictions(jurisdictionList);
      } catch (err) {
        const apiError = err as JurisdictionsApiError;
        setError(apiError.response?.data?.message || 'Error al cargar jurisdicciones');
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
