import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Importar CSS de Leaflet
import 'leaflet/dist/leaflet.css'

// Configurar íconos
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function ClickHandler({ setPosition, setAddress }) {
  useMapEvents({
    async click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng]
      setPosition(newPos)
      
      // Obtener dirección usando geocoding inverso
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos[0]}&lon=${newPos[1]}&zoom=18&addressdetails=1`
        )
        const data = await response.json()
        
        if (data && data.display_name) {
          setAddress(data.display_name)
        } else {
          setAddress('Dirección no encontrada')
        }
      } catch (error) {
        console.error('Error obteniendo dirección:', error)
        setAddress('Error al obtener dirección')
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

  function handlePositionChange(newPos, newAddress) {
    setPosition(newPos)
    setAddress(newAddress)
    
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
            setPosition={(pos) => handlePositionChange(pos, address)} 
            setAddress={setAddress}
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
          <div className="map-coords" style={{ background: 'rgba(74, 155, 142, 0.1)' }}>
            🏠 Dirección: {address || 'Cargando...'}
          </div>
        </div>
      )}
    </div>
  )
}