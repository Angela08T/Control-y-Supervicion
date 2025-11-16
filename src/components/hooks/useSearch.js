import { useState, useCallback, useEffect, useRef } from 'react';
import useFetch from './useFetch';
import { API_URL } from '@/helpers/Constants';

/**
 * Hook genérico para búsquedas con autocomplete
 * @param {string} endpoint - Endpoint de la API (ej: '/bodycams/search')
 * @param {number} debounceMs - Tiempo de espera antes de buscar (ms)
 * @returns {Object} Estados y funciones para búsqueda
 */
export const useSearchAutocomplete = (endpoint, debounceMs = 300) => {
  const { getData } = useFetch();

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef(null);

  const search = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getData(`${API_URL}${endpoint}?search=${term}`, true);

      if (response.status) {
        const data = response.data?.data || response.data || [];
        setResults(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
      } else {
        setResults([]);
        setError(response.message || 'Error en la búsqueda');
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError(err.message || 'Error al buscar');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [getData, endpoint]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(searchTerm);
      }, debounceMs);
    } else {
      setResults([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, search, debounceMs]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    showSuggestions,
    setShowSuggestions
  };
};

/**
 * Hook para búsqueda de bodycams
 */
export const useBodycamSearch = () => {
  const hook = useSearchAutocomplete('/bodycams', 300);

  const selectBodycam = useCallback((bodycam) => {
    hook.setSearchTerm(bodycam.name || '');
    hook.setShowSuggestions(false);
    return bodycam;
  }, [hook]);

  return {
    ...hook,
    selectBodycam
  };
};

/**
 * Hook para búsqueda de offenders por DNI
 */
export const useOffenderSearch = () => {
  const { getData } = useFetch();

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef(null);

  const searchByDni = useCallback(async (dni) => {
    if (!dni || dni.length < 3) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar offender por DNI parcial
      const response = await getData(`${API_URL}/offenders?search=${dni}`, true);

      if (response.status) {
        const data = response.data?.data || response.data || [];
        setResults(Array.isArray(data) ? data : []);
        setShowSuggestions(data.length > 0);
      } else {
        setResults([]);
        setError(response.message || 'Error en la búsqueda');
      }
    } catch (err) {
      console.error('Error en búsqueda de offender:', err);
      setError(err.message || 'Error al buscar');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [getData]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchByDni(searchTerm);
      }, 300);
    } else {
      setResults([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, searchByDni]);

  const selectOffender = useCallback((offender) => {
    setSearchTerm(offender.dni || '');
    setShowSuggestions(false);
    return offender;
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    showSuggestions,
    setShowSuggestions,
    selectOffender
  };
};

export default useSearchAutocomplete;
