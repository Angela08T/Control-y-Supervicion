import { useState, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { searchBodycam } from '../../api/bodycam';
import type { Bodycam, Cam } from '@/types';

/** Forma de la respuesta de búsqueda: lista directa o envuelta en `data` (o `data.data`) */
type BodycamSearchPayload = Bodycam[] | { data: Bodycam[] | { data: Bodycam[] } };

/** Forma mínima de un error de axios usada para leer el mensaje del backend */
interface BodycamApiError {
  response?: { data?: { message?: string } };
}

export interface UseBodycamSearchResult {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  results: Bodycam[];
  loading: boolean;
  error: string | null;
  showSuggestions: boolean;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  selectBodycam: <T>(bodycam: T) => T;
  clearSearch: () => void;
}

const useBodycamSearch = (camType: Cam | null = null): UseBodycamSearchResult => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<Bodycam[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Ref para manejar el debouncing
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Si el término de búsqueda está vacío, resetear
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    // Aplicar debouncing de 300ms
    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        // Pasar el tipo de cámara al buscar
        const response: BodycamSearchPayload = await searchBodycam(searchTerm, 1000, camType);

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let bodycams: Bodycam[] = [];

        if (Array.isArray(response)) {
          bodycams = response;
        } else if (response.data && Array.isArray(response.data)) {
          bodycams = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Caso específico: response.data.data es el array
          bodycams = response.data.data;
        }

        setResults(bodycams);
        setShowSuggestions(bodycams.length > 0);
      } catch (err) {
        const apiError = err as BodycamApiError;
        setError(apiError.response?.data?.message || 'Error al buscar bodycam');
        setResults([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm, camType]);

  const selectBodycam = <T,>(bodycam: T): T => {
    setShowSuggestions(false);
    return bodycam;
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowSuggestions(false);
    setError(null);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    showSuggestions,
    setShowSuggestions,
    selectBodycam,
    clearSearch
  };
};

export default useBodycamSearch;
