import { useState, useEffect, useRef } from 'react';
import { getOffenderByDni } from '@/helpers/api/offender';

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

    // Si el término de búsqueda está vacío o tiene menos de 3 dígitos, resetear
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
        const response = await getOffenderByDni(searchTerm);

        // Estructura del API: { message: "...", data: { dni, job, shift, regime, ... } }
        // La respuesta es UN SOLO OBJETO, no un array
        let offenders = [];

        if (Array.isArray(response)) {
          offenders = response;
        } else if (response.data) {
          // Si response.data es un objeto (no array), convertirlo a array de un elemento
          if (Array.isArray(response.data)) {
            offenders = response.data;
          } else if (typeof response.data === 'object' && response.data.dni) {
            // Es un solo offender, convertirlo a array
            offenders = [response.data];
          } else if (response.data.data) {
            // Caso anidado
            if (Array.isArray(response.data.data)) {
              offenders = response.data.data;
            } else if (typeof response.data.data === 'object' && response.data.data.dni) {
              offenders = [response.data.data];
            }
          }
        }

        console.log('📊 Offenders procesados:', offenders);
        setResults(offenders);
        setShowSuggestions(offenders.length > 0);
      } catch (err) {
        console.error('Error buscando offender:', err);
        setError(err.response?.data?.message || 'Error al buscar offender');
        setResults([]);
        setShowSuggestions(false);
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
