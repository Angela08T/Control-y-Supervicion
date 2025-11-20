# Guía: Asignación Automática de Jurisdicción por Mapa

Esta guía explica cómo implementar la funcionalidad donde al seleccionar una ubicación en el mapa, la jurisdicción se detecta y asigna automáticamente.

---

## Tabla de Contenidos

1. [Resumen del Flujo](#resumen-del-flujo)
2. [Dependencias Necesarias](#dependencias-necesarias)
3. [Archivos a Crear](#archivos-a-crear)
4. [Código Completo](#código-completo)
5. [Cómo Integrar en tu Componente](#cómo-integrar-en-tu-componente)
6. [Estructura del GeoJSON](#estructura-del-geojson)

---

## Resumen del Flujo

```
Usuario hace clic en el mapa
         ↓
MapModal captura coordenadas (lat, lng)
         ↓
Se llama a handleLocationSelect()
         ↓
Se ejecuta detectarJurisdiccion(lat, lng)
         ↓
Turf.js verifica si el punto está dentro de algún polígono
         ↓
Se retorna la jurisdicción encontrada
         ↓
El formulario se actualiza automáticamente
```

---

## Dependencias Necesarias

Instala estas dependencias en tu proyecto:

```bash
npm install @turf/turf react-leaflet leaflet @mui/material lucide-react
```

### Lista de dependencias:

| Paquete | Versión | Uso |
|---------|---------|-----|
| `@turf/turf` | ^6.5.0 | Detección point-in-polygon |
| `react-leaflet` | ^4.2.1 | Mapa interactivo |
| `leaflet` | ^1.9.4 | Base del mapa |
| `@mui/material` | ^5.x | Componentes UI (Modal, Button) |
| `lucide-react` | ^0.x | Íconos |

---

## Archivos a Crear

Necesitas crear estos archivos en tu proyecto:

```
tu-proyecto/
├── public/
│   └── Data/
│       └── jurisdicciones.geojson    # Datos de polígonos
├── src/
│   ├── hooks/
│   │   └── useJurisdiccionDetection.js   # Hook principal
│   └── Components/
│       └── MapModal.jsx              # Modal con mapa
```

---

## Código Completo

### 1. Hook: useJurisdiccionDetection.js

Este es el corazón de la funcionalidad. Carga los polígonos y detecta en cuál está el punto.

```javascript
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
        console.log('🌍 Cargando jurisdicciones desde: /Data/jurisdicciones.geojson');
        const response = await fetch('/Data/jurisdicciones.geojson');

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
```

---

### 2. Componente: MapModal.jsx

Modal con mapa interactivo que permite seleccionar ubicaciones.

```javascript
import React, { useState, useCallback } from 'react';
import { Modal, Box, IconButton, Button } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { X, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Solucionar problema con los íconos de los marcadores
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente para manejar clics en el mapa
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationSelect(lat, lng);
        },
    });
    return null;
};

const MapModal = ({ open, onClose, latitude, longitude, address, onLocationSelect }) => {
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [loading, setLoading] = useState(false);

    // Posición por defecto (puedes cambiarla a tu ubicación)
    const position = [latitude || -12.0464, longitude || -77.0428];
    const displayPosition = selectedPosition || position;

    // Función para obtener dirección de coordenadas (Geocodificación inversa)
    const getAddressFromCoords = useCallback(async (lat, lng) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
                {
                    headers: {
                        'User-Agent': 'TuApp/1.0 (Leaflet Compatible)'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Construir dirección más legible
                let readableAddress = '';
                if (data.address) {
                    const parts = [];
                    if (data.address.road) parts.push(data.address.road);
                    if (data.address.house_number) parts.push(data.address.house_number);
                    if (data.address.suburb) parts.push(data.address.suburb);
                    if (data.address.city_district) parts.push(data.address.city_district);
                    if (data.address.city) parts.push(data.address.city);

                    readableAddress = parts.join(', ') || data.display_name;
                }

                return readableAddress || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
            }
        } catch (err) {
            console.warn('Error obteniendo dirección:', err);
        }

        setLoading(false);
        return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }, []);

    // Manejar selección de nueva ubicación
    const handleLocationSelect = useCallback(async (lat, lng) => {
        console.log('Nueva ubicación seleccionada:', { lat, lng });
        setSelectedPosition([lat, lng]);

        const newAddress = await getAddressFromCoords(lat, lng);
        setSelectedAddress(newAddress);
        setLoading(false);
    }, [getAddressFromCoords]);

    // Confirmar nueva ubicación
    const handleConfirmLocation = () => {
        if (selectedPosition && onLocationSelect) {
            const [lat, lng] = selectedPosition;
            onLocationSelect({
                latitude: lat,
                longitude: lng,
                address: selectedAddress
            });
        }
        onClose();
    };

    // Resetear al cerrar
    const handleClose = () => {
        setSelectedPosition(null);
        setSelectedAddress('');
        setLoading(false);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
        >
            <Box
                sx={{
                    width: '90vw',
                    height: '85vh',
                    maxWidth: '800px',
                    maxHeight: '700px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header del modal */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: 'white'
                }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {selectedPosition ? 'Nueva Ubicación Seleccionada' : 'Ubicación Actual'}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            {selectedPosition
                                ? 'Haz clic en "Confirmar" para usar esta ubicación'
                                : 'Haz clic en el mapa para seleccionar una nueva ubicación'}
                        </p>
                    </div>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{
                            color: 'gray',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        <X style={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </div>

                {/* Contenedor del mapa */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {latitude && longitude ? (
                        <MapContainer
                            center={position}
                            zoom={16}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Handler para clics en el mapa */}
                            <MapClickHandler onLocationSelect={handleLocationSelect} />

                            {/* Marcador de la ubicación */}
                            <Marker position={displayPosition}>
                                <Popup>
                                    <div style={{ fontSize: '14px', maxWidth: '250px' }}>
                                        <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                                            {selectedPosition ? 'Nueva ubicación' : 'Ubicación actual'}
                                        </h3>
                                        <p style={{ color: '#6b7280', fontSize: '12px' }}>
                                            {selectedPosition
                                                ? (loading ? 'Obteniendo dirección...' : selectedAddress)
                                                : (address || 'Dirección no disponible')
                                            }
                                        </p>
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                                            <p>Lat: {displayPosition[0]?.toFixed(6)}</p>
                                            <p>Lng: {displayPosition[1]?.toFixed(6)}</p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            backgroundColor: '#f3f4f6'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px'
                                }}>
                                    <MapPin style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
                                </div>
                                <p style={{ color: '#6b7280' }}>
                                    No se pudo obtener la ubicación
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con botones */}
                {selectedPosition && (
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSelectedPosition(null);
                                    setSelectedAddress('');
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleConfirmLocation}
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    backgroundColor: '#10b981',
                                    '&:hover': {
                                        backgroundColor: '#059669'
                                    }
                                }}
                            >
                                {loading ? 'Obteniendo dirección...' : 'Confirmar Ubicación'}
                            </Button>
                        </div>
                    </div>
                )}
            </Box>
        </Modal>
    );
};

export default MapModal;
```

---

## Cómo Integrar en tu Componente

En tu página/componente principal donde quieras usar esta funcionalidad:

```javascript
import React, { useState, useEffect } from 'react';
import { TextField, Button, Alert } from '@mui/material';
import MapModal from './Components/MapModal';
import useJurisdiccionDetection from './hooks/useJurisdiccionDetection';

const MiFormulario = () => {
    // Hook de detección de jurisdicción
    const {
        detectarJurisdiccion,
        jurisdicciones,
        loading: loadingJurisdiccion
    } = useJurisdiccionDetection();

    // Estados del formulario
    const [formData, setFormData] = useState({
        direccion: '',
        jurisdiccion: '',
        // ... otros campos
    });

    // Estado para coordenadas actuales (puedes obtenerlas de geolocalización)
    const [coordenadas, setCoordenadas] = useState({
        latitude: -12.0464,  // Valor por defecto
        longitude: -77.0428
    });

    // Estado para la jurisdicción detectada
    const [jurisdiccionDetectada, setJurisdiccionDetectada] = useState(null);

    // Estado del modal del mapa
    const [mapModalOpen, setMapModalOpen] = useState(false);

    // Manejar selección de nueva ubicación desde el mapa
    const handleLocationSelect = async (newLocation) => {
        console.log('=== NUEVA UBICACIÓN SELECCIONADA ===');
        console.log('Coordenadas:', newLocation);

        // Actualizar dirección en el formulario
        setFormData(prev => ({
            ...prev,
            direccion: newLocation.address
        }));

        // Actualizar coordenadas
        setCoordenadas({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude
        });

        // Detectar jurisdicción automáticamente
        if (jurisdicciones && jurisdicciones.length > 0 && detectarJurisdiccion) {
            try {
                const jurisdiccionEncontrada = detectarJurisdiccion(
                    newLocation.latitude,
                    newLocation.longitude
                );

                if (jurisdiccionEncontrada) {
                    setJurisdiccionDetectada(jurisdiccionEncontrada);

                    // Actualizar el formulario con la jurisdicción
                    setFormData(prev => ({
                        ...prev,
                        jurisdiccion: jurisdiccionEncontrada.name
                    }));

                    console.log('✅ Jurisdicción detectada:', jurisdiccionEncontrada.name);
                } else {
                    console.warn('❌ No se encontró jurisdicción');
                    setJurisdiccionDetectada(null);
                    setFormData(prev => ({
                        ...prev,
                        jurisdiccion: ''
                    }));
                }
            } catch (err) {
                console.error('Error:', err);
                setJurisdiccionDetectada(null);
            }
        }

        // Cerrar el modal
        setMapModalOpen(false);
    };

    return (
        <div>
            <h1>Mi Formulario</h1>

            {/* Campo de dirección */}
            <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
            />

            {/* Botón para abrir el mapa */}
            <Button
                variant="outlined"
                onClick={() => setMapModalOpen(true)}
            >
                Seleccionar en Mapa
            </Button>

            {/* Campo de jurisdicción (se llena automáticamente) */}
            <TextField
                fullWidth
                label="Jurisdicción"
                value={formData.jurisdiccion}
                onChange={(e) => setFormData(prev => ({ ...prev, jurisdiccion: e.target.value }))}
                disabled={loadingJurisdiccion}
                placeholder="Se detecta automáticamente al seleccionar ubicación"
            />

            {/* Mostrar jurisdicción detectada */}
            {jurisdiccionDetectada && (
                <Alert severity="success">
                    <strong>Jurisdicción detectada:</strong> {jurisdiccionDetectada.name}
                </Alert>
            )}

            {/* Modal del mapa */}
            <MapModal
                open={mapModalOpen}
                onClose={() => setMapModalOpen(false)}
                latitude={coordenadas.latitude}
                longitude={coordenadas.longitude}
                address={formData.direccion}
                onLocationSelect={handleLocationSelect}
            />
        </div>
    );
};

export default MiFormulario;
```

---

## Estructura del GeoJSON

Crea el archivo `public/Data/jurisdicciones.geojson` con esta estructura:

```json
{
    "status": true,
    "message": "Successful",
    "data": [
        {
            "id": "1",
            "name": "Jurisdicción Norte",
            "description": "Zona norte de la ciudad",
            "color": "#FF5733",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-77.0500, -12.0300],
                        [-77.0400, -12.0300],
                        [-77.0400, -12.0400],
                        [-77.0500, -12.0400],
                        [-77.0500, -12.0300]
                    ]
                ]
            }
        },
        {
            "id": "2",
            "name": "Jurisdicción Sur",
            "description": "Zona sur de la ciudad",
            "color": "#33FF57",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-77.0500, -12.0400],
                        [-77.0400, -12.0400],
                        [-77.0400, -12.0500],
                        [-77.0500, -12.0500],
                        [-77.0500, -12.0400]
                    ]
                ]
            }
        }
    ]
}
```

### Puntos importantes sobre el GeoJSON:

1. **Formato de coordenadas**: `[longitud, latitud]` (orden inverso al usual)
2. **Polígono cerrado**: La primera y última coordenada deben ser iguales
3. **Sentido**: Las coordenadas deben ir en sentido antihorario
4. **Estructura anidada**: `coordinates` es un array de arrays de arrays

### Cómo obtener coordenadas para tus polígonos:

1. Usa [geojson.io](https://geojson.io) para dibujar polígonos visualmente
2. Exporta como GeoJSON
3. Adapta al formato requerido

---

## Herramientas Útiles

- **geojson.io**: Para crear y editar polígonos visualmente
- **Turf.js Playground**: Para probar operaciones geoespaciales
- **QGIS**: Para trabajar con datos geográficos más complejos

---

## Troubleshooting

### El punto no se detecta dentro de ningún polígono

1. Verifica que las coordenadas estén en orden `[longitud, latitud]`
2. Asegúrate de que el polígono esté correctamente cerrado
3. Revisa la consola para ver los logs de debugging

### El mapa no se muestra

1. Verifica que `leaflet.css` esté importado
2. Asegúrate de que el contenedor tenga altura definida

### Error al cargar el GeoJSON

1. Verifica que el archivo esté en `public/Data/`
2. Revisa que el JSON sea válido (usa un validador online)

---

## Resumen

Para replicar esta funcionalidad necesitas:

1. **Instalar dependencias**: `@turf/turf`, `react-leaflet`, `leaflet`
2. **Crear el hook** `useJurisdiccionDetection.js`
3. **Crear el componente** `MapModal.jsx`
4. **Crear el archivo GeoJSON** con tus jurisdicciones
5. **Integrar en tu componente** usando `handleLocationSelect`

La magia ocurre en `turf.booleanPointInPolygon()` que verifica si el punto clickeado está dentro de alguno de los polígonos definidos.
