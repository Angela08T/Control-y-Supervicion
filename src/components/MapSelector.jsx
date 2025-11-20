import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import useJurisdiccionDetection from '../hooks/Jurisdiction/useJurisdiccionDetection'

// Importar CSS de Leaflet
import 'leaflet/dist/leaflet.css'

// Configurar íconos (usando recursos locales en lugar de CDN)
const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    async click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng]

      // 1. Actualizar INMEDIATAMENTE con las coordenadas
      onLocationSelect(newPos, 'Cargando dirección...')

      // 2. Obtener dirección de forma asíncrona (en background)
      try {
        // Timeout de 5 segundos para la petición
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos[0]}&lon=${newPos[1]}&zoom=18&addressdetails=1`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)

        const data = await response.json()

        let newAddress = 'Dirección no encontrada'
        if (data && data.display_name) {
          newAddress = data.display_name
        }

        // 3. Actualizar con la dirección real cuando llegue
        onLocationSelect(newPos, newAddress)
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Timeout obteniendo dirección')
          onLocationSelect(newPos, 'Timeout - Dirección no disponible')
        } else {
          console.error('Error obteniendo dirección:', error)
          onLocationSelect(newPos, 'Error al obtener dirección')
        }
      }
    }
  })
  return null
}

export default function MapSelector({ value, onChange }) {
  const [position, setPosition] = useState(value?.coordinates || null)
  const [address, setAddress] = useState(value?.address || '')
  const [jurisdiccionDetectada, setJurisdiccionDetectada] = useState(null)

  // Hook para detección de jurisdicción
  const { detectarJurisdiccion, jurisdicciones } = useJurisdiccionDetection()

  useEffect(() => {
    if (value) {
      setPosition(value.coordinates || null)
      setAddress(value.address || '')
    }
  }, [value])

  function handleLocationSelect(newPos, newAddress) {
    setPosition(newPos)
    setAddress(newAddress)

    console.log('📍 MapSelector - Ubicación seleccionada:')
    console.log('   Coordenadas:', newPos)
    console.log('   Dirección:', newAddress)

    // Detectar jurisdicción automáticamente
    let jurisdiccion = null
    if (jurisdicciones && jurisdicciones.length > 0) {
      jurisdiccion = detectarJurisdiccion(newPos[0], newPos[1])
      if (jurisdiccion) {
        console.log('🏛️ Jurisdicción detectada:', jurisdiccion.name)
        setJurisdiccionDetectada(jurisdiccion)
      } else {
        console.log('⚠️ No se detectó jurisdicción para esta ubicación')
        setJurisdiccionDetectada(null)
      }
    }

    if (onChange) {
      onChange({
        coordinates: newPos,
        address: newAddress,
        jurisdiccion: jurisdiccion ? jurisdiccion.name : null
      })
    }
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ height: '250px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #21343d' }}>
        <MapContainer
          center={[-11.9833, -77.0075]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler
            onLocationSelect={handleLocationSelect}
          />
          {position && <Marker position={position} icon={icon} />}
        </MapContainer>
      </div>
      <div className="map-hint">Haz clic en el mapa para seleccionar ubicación</div>
      {position && (
        <div style={{ marginTop: '10px' }}>
          <div className="map-coords" style={{ marginBottom: '8px' }}>
            📍 Coordenadas: Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </div>
          <div className="map-coords" style={{
            background: address === 'Cargando dirección...' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(74, 155, 142, 0.1)',
            fontStyle: address === 'Cargando dirección...' ? 'italic' : 'normal',
            marginBottom: '8px'
          }}>
            🏠 {address || 'Sin dirección'}
          </div>
          {jurisdiccionDetectada && (
            <div className="map-coords" style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              fontWeight: '500'
            }}>
              🏛️ Jurisdicción: {jurisdiccionDetectada.name}
            </div>
          )}
          {!jurisdiccionDetectada && jurisdicciones.length > 0 && (
            <div className="map-coords" style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#f59e0b',
              fontStyle: 'italic'
            }}>
              ⚠️ No se detectó jurisdicción para esta ubicación
            </div>
          )}
        </div>
      )}
    </div>
  )
}