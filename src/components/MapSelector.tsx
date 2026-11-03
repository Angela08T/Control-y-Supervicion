import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import useJurisdiccionDetection from '../hooks/Jurisdiction/useJurisdiccionDetection'
import type { DetectedJurisdiction } from '@/types'

// Importar CSS de Leaflet
import 'leaflet/dist/leaflet.css'

// Configurar íconos (usando recursos locales en lugar de CDN)
/** Par [latitud, longitud] */
type Coordinates = [number, number]

/** Dirección de Nominatim (addressdetails=1) */
type NominatimAddress = Record<string, string | undefined>

/** Respuesta de Nominatim reverse */
interface NominatimReverseResponse {
  address?: NominatimAddress
}

/** Valor del selector: coordenadas, dirección y jurisdicción detectada */
export interface MapSelectorValue {
  coordinates?: Coordinates | null
  address?: string
  jurisdiccion?: string | null
}

export interface MapSelectorProps {
  value?: MapSelectorValue | null
  onChange?: (value: MapSelectorValue) => void
}

interface ClickHandlerProps {
  onLocationSelect: (position: Coordinates, address: string) => void
  validarJurisdiccion?: (latitude: number, longitude: number) => DetectedJurisdiction | null
}

const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Función helper para formatear direccion
const getFormattedAddress = (addr: NominatimAddress): string | null => {
  if (!addr) return null

  // Helper para buscar el primer valor existente
  const get = (keys: string[]): string | undefined => keys.map(k => addr[k]).find(Boolean)

  const placeName = get(['amenity', 'shop', 'building', 'office', 'tourism', 'historic', 'leisure'])

  const streetName = get(['road', 'pedestrian', 'construction', 'residential', 'hamlet'])
  const streetPart = [streetName, addr.house_number].filter(Boolean).join(' ')

  const rawParts: string[] = [
    placeName,
    streetPart,
    get(['neighbourhood', 'suburb', 'quarter', 'city_block']),
    get(['city_district', 'district', 'borough']) || 'San Juan de Lurigancho', // Forzar SJL
    get(['city', 'town', 'village']),
    get(['state', 'region']),
    addr.country,
    addr.postcode
  ].filter((part): part is string => Boolean(part))

  // Quitar valores repetidos
  let uniqueParts = [...new Set(rawParts)]

  // Para que no repita Lima
  if (uniqueParts.includes('Lima')) {
    uniqueParts = uniqueParts.filter(p => !p.includes('Metropolitana') && !p.includes('Provincia de'))
  }


  return uniqueParts.join(', ')
}

function ClickHandler({ onLocationSelect, validarJurisdiccion }: ClickHandlerProps) {
  useMapEvents({
    async click(e) {
      const newPos: Coordinates = [e.latlng.lat, e.latlng.lng]

      // 1. Validar si está dentro de una jurisdicción permitida
      if (validarJurisdiccion) {
        const isInJurisdiction = validarJurisdiccion(newPos[0], newPos[1])
        if (!isInJurisdiction) {
          onLocationSelect(newPos, 'Direccion no encontrada')
          return // Detener ejecución
        }
      }

      // 2. Actualizar INMEDIATAMENTE con las coordenadas
      onLocationSelect(newPos, 'Cargando dirección...')

      // 3. Obtener dirección de forma asíncrona (en background)
      try {
        // Timeout 
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos[0]}&lon=${newPos[1]}&zoom=18&addressdetails=1`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)

        const data: NominatimReverseResponse | null = await response.json()

        const newAddress = (data && data.address)
          ? (getFormattedAddress(data.address) || 'Dirección no encontrada')
          : 'Dirección no encontrada'

        // 4. Actualizar con la dirección real cuando llegue
        onLocationSelect(newPos, newAddress)
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
          onLocationSelect(newPos, 'Timeout - Dirección no disponible')
        } else {
          onLocationSelect(newPos, 'Error al obtener dirección')
        }
      }
    }
  })
  return null
}

export default function MapSelector({ value, onChange }: MapSelectorProps) {
  const [position, setPosition] = useState<Coordinates | null>(value?.coordinates || null)
  const [address, setAddress] = useState<string>(value?.address || '')
  const [jurisdiccionDetectada, setJurisdiccionDetectada] = useState<DetectedJurisdiction | null>(null)

  // Hook para detección de jurisdicción
  const { detectarJurisdiccion, jurisdicciones } = useJurisdiccionDetection()

  useEffect(() => {
    if (value) {
      setPosition(value.coordinates || null)
      setAddress(value.address || '')
    }
  }, [value])

  function handleLocationSelect(newPos: Coordinates, newAddress: string) {
    setPosition(newPos)
    setAddress(newAddress)

    // Detectar jurisdicción automáticamente
    let jurisdiccion: DetectedJurisdiction | null = null
    if (jurisdicciones && jurisdicciones.length > 0) {
      jurisdiccion = detectarJurisdiccion(newPos[0], newPos[1])
      if (jurisdiccion) {
        setJurisdiccionDetectada(jurisdiccion)
      } else {
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

          /* Renderisar Jurisdicciones*/
          {jurisdicciones && jurisdicciones.map(jurisdiccion => {
            if (!jurisdiccion.geometry || !jurisdiccion.geometry.coordinates) return null;

            let positions: Coordinates[][] = []
            try {
              positions = jurisdiccion.geometry.coordinates.map(ring => ring.map((card): Coordinates => [card[1], card[0]]))
            } catch (error) {
              console.error('Error al procesar jurisdicción:', error)
              return null
            }
            const isSelected = jurisdiccionDetectada && jurisdiccionDetectada.id === jurisdiccion.id
            return (
              <Polygon
                key={jurisdiccion.id}
                positions={positions}
                pathOptions={{
                  color: (isSelected ? jurisdiccion.color : (jurisdiccion.color || '#3b82f6')),
                  fillColor: (isSelected ? jurisdiccion.color : (jurisdiccion.color || '#3b82f6')),
                  fillOpacity: isSelected ? 0.2 : 0.1,
                  weight: isSelected ? 3 : 2,
                  opacity: 1 // Asegura que el borde no sea transparente ni negro por defecto
                }}
              >
                <Tooltip sticky direction="center" opacity={0.9}>
                  <span>{jurisdiccion.name}</span>
                </Tooltip>
              </Polygon>
            )
          })}

          <ClickHandler
            onLocationSelect={handleLocationSelect}
            validarJurisdiccion={detectarJurisdiccion}
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