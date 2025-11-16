import { useState, useEffect, useRef } from 'react';
import { searchBodycam } from '@/helpers/api/bodycam';

const useBodycamSearch = () => {
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
        const response = await searchBodycam(searchTerm);

        // Estructura del API: { message: "...", data: { data: [...], currentPage, totalCount, ... } }
        let bodycams = [];

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
        console.error('Error buscando bodycam:', err);
        setError(err.response?.data?.message || 'Error al buscar bodycam');
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
  }, [searchTerm]);

  const selectBodycam = (bodycam) => {
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
