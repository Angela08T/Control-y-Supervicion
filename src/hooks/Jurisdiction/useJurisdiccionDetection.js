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
        console.log('🌍 Cargando jurisdicciones desde: /Data/juridiccion.geojson');
        const response = await fetch('/Data/juridiccion.geojson');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Datos recibidos:', data);

        if (data.status && data.data) {
          console.log('✅ Jurisdicciones cargadas correctamente:', data.data.length);
          data.data.forEach((j, index) => {
            console.log(`  ${index + 1}. ${j.name} (ID: ${j.id})`);
          });
          setJurisdicciones(data.data);
        } else {
          console.error('❌ Formato de datos inválido:', data);
          throw new Error('Formato de datos inválido en el archivo GeoJSON');
        }
      } catch (err) {
        console.error('💥 Error cargando jurisdicciones:', err);
        setError('Error al cargar las jurisdicciones: ' + err.message);
      }
    };

    loadJurisdicciones();
  }, []);

  // Función para detectar la jurisdicción basada en coordenadas
  const detectarJurisdiccion = (latitude, longitude) => {
    console.log('=== DETECTAR JURISDICCIÓN ===');
    console.log('Coordenadas recibidas:', { latitude, longitude });
    console.log('Jurisdicciones disponibles:', jurisdicciones.length);

    if (!jurisdicciones.length) {
      console.log('No hay jurisdicciones cargadas');
      return null;
    }

    try {
      // Crear un punto con las coordenadas del usuario
      // IMPORTANTE: Turf.js usa [longitude, latitude] (orden inverso)
      const punto = turf.point([longitude, latitude]);
      console.log('Punto a evaluar:', [longitude, latitude]);

      // Buscar en qué jurisdicción se encuentra el punto
      for (const jurisdiccion of jurisdicciones) {
        console.log('Evaluando jurisdicción:', jurisdiccion.name);

        if (jurisdiccion.geometry && jurisdiccion.geometry.coordinates) {
          try {
            // Crear el polígono de la jurisdicción
            const poligono = turf.polygon(jurisdiccion.geometry.coordinates);

            // Verificar si el punto está dentro del polígono
            if (turf.booleanPointInPolygon(punto, poligono)) {
              console.log('✅ Jurisdicción encontrada:', jurisdiccion.name);
              return {
                id: jurisdiccion.id,
                name: jurisdiccion.name,
                description: jurisdiccion.description,
                color: jurisdiccion.color
              };
            } else {
              console.log('❌ Punto fuera de:', jurisdiccion.name);
            }
          } catch (geoErr) {
            console.warn('Error procesando geometría de:', jurisdiccion.name, geoErr);
          }
        } else {
          console.warn('Jurisdicción sin geometría válida:', jurisdiccion.name);
        }
      }

      console.log('❌ No se encontró jurisdicción para las coordenadas');
      return null;
    } catch (err) {
      console.error('Error detectando jurisdicción:', err);
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

          console.log('=== DETECCIÓN DE JURISDICCIÓN ===');
          console.log('Coordenadas obtenidas:', { latitude, longitude });

          try {
            const jurisdiccion = detectarJurisdiccion(latitude, longitude);
            console.log('Jurisdicción detectada:', jurisdiccion);

            setLoading(false);
            resolve({
              coordinates: { latitude, longitude },
              jurisdiccion
            });
          } catch (err) {
            console.error('Error detectando jurisdicción:', err);
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
