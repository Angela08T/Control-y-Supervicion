import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Hook para manejar parámetros de URL de forma fácil
 * @returns {Object} { params, setParam, setParams, removeParam, clearParams }
 */
const UseUrlParamsManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Convertir searchParams a objeto
  const params = useMemo(() => {
    const paramsObj = {};
    for (let [key, value] of searchParams.entries()) {
      paramsObj[key] = value;
    }
    return paramsObj;
  }, [searchParams]);

  // Establecer un solo parámetro
  const setParam = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === undefined || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Establecer múltiples parámetros
  const setParams = useCallback((paramsObj) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Eliminar un parámetro
  const removeParam = useCallback((key) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Limpiar todos los parámetros
  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    params,
    setParam,
    setParams,
    removeParam,
    clearParams
  };
};

export default UseUrlParamsManager;
