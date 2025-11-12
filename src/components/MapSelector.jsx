import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

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

    if (onChange) {
      onChange({
        coordinates: newPos,
        address: newAddress
      })
    }
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ height: '250px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #21343d' }}>
        <MapContainer
          center={[-12.0464, -77.0428]}
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
            fontStyle: address === 'Cargando dirección...' ? 'italic' : 'normal'
          }}>
            🏠 {address || 'Sin dirección'}
          </div>
        </div>
      )}
    </div>
  )
}