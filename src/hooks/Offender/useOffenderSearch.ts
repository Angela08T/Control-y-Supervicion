import { useState, useEffect, useRef } from 'react';
import { getOffenderByDni, getOffenders } from '../../api/offender';

const useOffenderSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Ref para manejar el debouncing
  const debounceTimeout = useRef(null);

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
        let offenders = [];

        if (isNumeric) {
          // Búsqueda por DNI
          const response = await getOffenderByDni(searchTerm);

          // Lógica de parsers para DNI
          if (Array.isArray(response)) {
            offenders = response;
          } else if (response.data) {
            if (Array.isArray(response.data)) {
              offenders = response.data;
            } else if (typeof response.data === 'object' && response.data.dni) {
              offenders = [response.data];
            } else if (response.data.data) {
              if (Array.isArray(response.data.data)) {
                offenders = response.data.data;
              } else if (typeof response.data.data === 'object' && response.data.data.dni) {
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
        // Ignorar error 404 si es búsqueda por DNI (simplemente no encontrado)
        // Para búsqueda por nombre, también podría ser vacío
        setResults([]);
        setShowSuggestions(false);
        if (err.response && err.response.status !== 404) {
          setError(err.response?.data?.message || 'Error al buscar');
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

  const selectOffender = (offender) => {
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
