import { useState, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getOffenderByDni, getOffenders } from '../../api/offender';
import type { OffenderDniLookup } from '@/types';

/** Cuerpo de la respuesta de búsqueda por DNI: registro, lista o envoltorio `data` */
type DniSearchBody = OffenderDniLookup | OffenderDniLookup[] | { data?: OffenderDniLookup | OffenderDniLookup[] };

/** Respuesta de búsqueda por DNI envuelta en `data` */
interface DniSearchEnvelope {
  data?: DniSearchBody;
}

/** Forma mínima de un error de axios usada para leer estado y mensaje del backend */
interface OffenderApiError {
  response?: { status?: number; data?: { message?: string } };
}

/** Indica si el valor es un registro de infractor (objeto con DNI) */
const esRegistroDni = (valor: unknown): valor is OffenderDniLookup =>
  typeof valor === 'object' && valor !== null && Boolean((valor as Partial<OffenderDniLookup>).dni);

export interface UseOffenderSearchResult {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  results: OffenderDniLookup[];
  loading: boolean;
  error: string | null;
  showSuggestions: boolean;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  selectOffender: <T>(offender: T) => T;
  clearSearch: () => void;
}

const useOffenderSearch = (): UseOffenderSearchResult => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<OffenderDniLookup[]>([]);
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

    // Si el término de búsqueda está vacío o tiene menos de 3 caracteres, resetear
    if (!searchTerm || searchTerm.length < 3) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    // Aplicar debouncing de 400ms
    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const isNumeric = /^\d+$/.test(searchTerm);
        let offenders: OffenderDniLookup[] = [];

        if (isNumeric) {
          // Búsqueda por DNI
          const response: DniSearchEnvelope | OffenderDniLookup[] = await getOffenderByDni(searchTerm);

          // Lógica de parsers para DNI
          if (Array.isArray(response)) {
            offenders = response;
          } else if (response.data) {
            if (Array.isArray(response.data)) {
              offenders = response.data;
            } else if (esRegistroDni(response.data)) {
              offenders = [response.data];
            } else if (response.data.data) {
              if (Array.isArray(response.data.data)) {
                offenders = response.data.data;
              } else if (esRegistroDni(response.data.data)) {
                offenders = [response.data.data];
              }
            }
          }
        } else {
          // Si no es numérico, no buscar (deshabilitar búsqueda por nombre)
          setResults([]);
          setShowSuggestions(false);
          setLoading(false);
          return;
        }

        setResults(offenders);
        setShowSuggestions(offenders.length > 0);
      } catch (err) {
        const apiError = err as OffenderApiError;
        // Ignorar error 404 si es búsqueda por DNI (simplemente no encontrado)
        // Para búsqueda por nombre, también podría ser vacío
        setResults([]);
        setShowSuggestions(false);
        if (apiError.response && apiError.response.status !== 404) {
          setError(apiError.response?.data?.message || 'Error al buscar');
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    // Cleanup
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm]);

  const selectOffender = <T,>(offender: T): T => {
    setShowSuggestions(false);
    return offender;
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
    selectOffender,
    clearSearch
  };
};

export default useOffenderSearch;
