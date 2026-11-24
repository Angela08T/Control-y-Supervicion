import React, { useEffect, useRef } from 'react'
import { FiCheckCircle, FiLoader, FiSearch } from 'react-icons/fi'
import useBodycamSearch from '../hooks/Bodycam/useBodycamSearch'
import { Field, Input } from '@/components/UI/Field'
import { MEDIO_INFO } from '@/utils/medios'
import type { Bodycam, Cam, ID } from '@/types'
import {
  autocompleteContainer,
  autocompleteError,
  autocompleteItem,
  autocompleteItemCode,
  autocompleteItemDetails,
  autocompleteLoading,
  autocompleteNoResults,
  autocompleteSuggestions,
} from '@/utils/classes'

/** Campos de asignacion que el API puede devolver y que no estan en el modelo `Bodycam` */
type Sugerencia = Bodycam & { asignadoA?: string; asignado?: string; usuario?: string }

const EJEMPLO: Partial<Record<Cam, string>> = {
  BODYCAM: 'Ej.: SG004 o FISCA004',
  CAMERA: 'Ej.: 104A',
  RADIO: 'Ej.: 22110',
}

interface BuscadorDispositivoProps {
  cam: Cam
  /** Dispositivo elegido (null si aun no se elige de la lista) */
  value: { id: ID | null; name: string | null }
  onChange: (value: { id: ID | null; name: string | null }) => void
}

/**
 * Buscador de un dispositivo registrado (bodycam, camara o radio) con sugerencias filtradas por tipo.
 * Escribir sin elegir de la lista deja el medio sin dispositivo (id null), lo que el formulario valida.
 */
export default function BuscadorDispositivo({ cam, value, onChange }: BuscadorDispositivoProps) {
  const { searchTerm, setSearchTerm, results, loading, error, showSuggestions, setShowSuggestions } = useBodycamSearch(cam)
  const ref = useRef<HTMLDivElement>(null)
  const info = MEDIO_INFO[cam]

  // Al montar con un valor ya elegido, mostrarlo
  useEffect(() => {
    if (value.name && !searchTerm) setSearchTerm(value.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [setShowSuggestions])

  const habilitados = (results as Sugerencia[]).filter(d => !d.deleted_at)
  const elegido = !!value.id

  return (
    <div className={autocompleteContainer} ref={ref}>
      <Field label={info.numero} required>
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              // Al escribir de nuevo se pierde la eleccion anterior
              if (value.id || value.name) onChange({ id: null, name: null })
            }}
            onFocus={() => habilitados.length > 0 && setShowSuggestions(true)}
            placeholder={EJEMPLO[cam]}
            autoComplete="off"
            invalid={!elegido && searchTerm.length >= 2 && !loading && !showSuggestions}
            className="pr-9"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-base" aria-hidden>
            {elegido ? <FiCheckCircle className="text-success" /> : <FiSearch className="text-muted" />}
          </span>
        </div>
      </Field>
      {loading && (
        <div className={autocompleteLoading}>
          <FiLoader className="animate-spin" aria-hidden /> Buscando…
        </div>
      )}
      {error && <div className={autocompleteError}>{error}</div>}
      {showSuggestions && habilitados.length > 0 && (
        <div className={autocompleteSuggestions}>
          {habilitados.map(d => (
            <div
              key={d.id}
              className={autocompleteItem}
              onClick={() => {
                setShowSuggestions(false)
                setSearchTerm(d.name)
                onChange({ id: d.id, name: d.name })
              }}
            >
              <div className={autocompleteItemCode}>{d.name}</div>
              {(d.asignadoA || d.asignado || d.usuario || d.serie) && (
                <div className={autocompleteItemDetails}>{d.asignadoA || d.asignado || d.usuario || `Serie: ${d.serie}`}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {showSuggestions && results.length === 0 && searchTerm.length >= 2 && !loading && (
        <div className={autocompleteNoResults}>No se encontró ninguna {info.label.toLowerCase()} con ese número</div>
      )}
      {!elegido && searchTerm.length >= 2 && !loading && !showSuggestions && (
        <p className="m-0 mt-1 text-xs text-red-ink">Elige {info.label === 'Bodycam' ? 'la bodycam' : `la ${info.label.toLowerCase()}`} de la lista.</p>
      )}
    </div>
  )
}
