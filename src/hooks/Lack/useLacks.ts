import { useState, useEffect } from 'react';
import { getLacks } from '../../api/lack';
import type { Lack } from '@/types';

/** Forma de la respuesta: lista directa o envuelta en `data` (o `data.data`) */
type LackListPayload = Lack[] | { data: Lack[] | { data: Lack[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface LacksApiError {
  response?: { data?: { message?: string } };
}

export interface UseLacksResult {
  lacks: Lack[];
  loading: boolean;
  error: string | null;
}

const useLacks = (): UseLacksResult => {
  const [lacks, setLacks] = useState<Lack[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLacks = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: LackListPayload = await getLacks();

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let lackList: Lack[] = [];

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
        const apiError = err as LacksApiError;
        setError(apiError.response?.data?.message || 'Error al cargar faltas');
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
