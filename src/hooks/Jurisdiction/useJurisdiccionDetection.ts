import { useState, useEffect } from 'react';
import * as turf from '@turf/turf';

const useJurisdiccionDetection = () => {
  const [jurisdicciones, setJurisdicciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar las jurisdicciones desde el archivo GeoJSON
  useEffect(() => {
    const loadJurisdicciones = async () => {
      try {
        const response = await fetch('/Data/juridiccion.geojson');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status && data.data) {
          setJurisdicciones(data.data);
        } else {
          throw new Error('Formato de datos inválido en el archivo GeoJSON');
        }
      } catch (err) {
        setError('Error al cargar las jurisdicciones: ' + err.message);
      }
    };

    loadJurisdicciones();
  }, []);

  // Función para detectar la jurisdicción basada en coordenadas
  const detectarJurisdiccion = (latitude, longitude) => {
    if (!jurisdicciones.length) {
      return null;
    }

    try {
      // Crear un punto con las coordenadas del usuario
      // IMPORTANTE: Turf.js usa [longitude, latitude] (orden inverso)
      const punto = turf.point([longitude, latitude]);

      // Buscar en qué jurisdicción se encuentra el punto
      for (const jurisdiccion of jurisdicciones) {
        if (jurisdiccion.geometry && jurisdiccion.geometry.coordinates) {
          try {
            // Crear el polígono de la jurisdicción
            const poligono = turf.polygon(jurisdiccion.geometry.coordinates);

            // Verificar si el punto está dentro del polígono
            if (turf.booleanPointInPolygon(punto, poligono)) {
              return {
                id: jurisdiccion.id,
                name: jurisdiccion.name,
                description: jurisdiccion.description,
                color: jurisdiccion.color
              };
            }
          } catch (geoErr) {
          }
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  };

  // Función para obtener coordenadas GPS y detectar jurisdicción automáticamente
  const obtenerJurisdiccionActual = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const jurisdiccion = detectarJurisdiccion(latitude, longitude);

            setLoading(false);
            resolve({
              coordinates: { latitude, longitude },
              jurisdiccion
            });
          } catch (err) {
            setLoading(false);
            setError('Error al detectar jurisdicción');
            reject(err);
          }
        },
        (err) => {
          setLoading(false);
          let errorMessage = 'Error obteniendo ubicación';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible';
              break;
            case err.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado';
              break;
          }

          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    });
  };

  return {
    jurisdicciones,
    detectarJurisdiccion,
    obtenerJurisdiccionActual,
    loading,
    error
  };
};

export default useJurisdiccionDetection;
