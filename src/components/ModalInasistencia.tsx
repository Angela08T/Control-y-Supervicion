import React, { useEffect, useState, useRef, useMemo } from 'react'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useSubjects from '../hooks/Subject/useSubjects'
import useJurisdictions from '../hooks/Jurisdiction/useJurisdictions'
import AlertModal from './AlertModal'
import './Autocomplete.css'
import {
  FaIdCard,
  FaClipboardList,
  FaClock,
  FaUserTie,
  FaIdBadge,
  FaBalanceScale
} from 'react-icons/fa'

const defaultState = {
  dni: '',
  nombreCompleto: '',
  asunto: 'Conductas relacionadas con el cumplimiento del horario y asistencia',
  falta: '',
  turno: '',
  cargo: '',
  regLab: '',
  jurisdiccion: '',
  jurisdictionId: null,
  subjectId: null,
  lackId: null
}

export default function ModalInasistencia({ onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' })

  // Hook para búsqueda de offender (DNI)
  const {
    
    searchTerm: dniSearchTerm,
    setSearchTerm: setDniSearchTerm,
    results: offenderResults,
    loading: offenderLoading,
    error: offenderError,
    showSuggestions: showOffenderSuggestions,
    setShowSuggestions: setShowOffenderSuggestions,
    selectOffender
  } = useOffenderSearch()


  // Hook para obtener subjects (asuntos) y lacks (faltas) desde la API
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError
  } = useSubjects()

  // Hook para obtener jurisdicciones
  const {
    jurisdictions,
    loading: jurisdictionsLoading,
    error: jurisdictionsError
  } = useJurisdictions()


  // Crear mapa de subjects con sus lacks desde la API
  const subjectMap = useMemo(() => {
    const map = {}

    if (subjects && subjects.length > 0) {
      subjects.forEach(subject => {
        map[subject.name] = {
          id: subject.id,
          lacks: subject.lacks || []
        }
      })
    }

    return map
  }, [subjects])

  // Obtener faltas de inasistencia disponibles
  const lacksInasistencia = useMemo(() => {
    // Buscar en todos los subjects las faltas que contengan "Inasistencia"
    let inasistencias = []

    Object.keys(subjectMap).forEach(subjectName => {
      const subject = subjectMap[subjectName]
      const lacksInasistenciaDeSubject = subject.lacks.filter(lack =>
        lack.name.toLowerCase().includes('inasistencia')
      )
      inasistencias = [...inasistencias, ...lacksInasistenciaDeSubject]
    })

    return inasistencias
  }, [subjectMap])

  // Establecer el subjectId automáticamente cuando se carguen los subjects
  useEffect(() => {
    // Buscar el subject que contiene las faltas de inasistencia
    const asuntoKey = Object.keys(subjectMap).find(key =>
      key.toLowerCase().includes('horario') ||
      key.toLowerCase().includes('asistencia') ||
      key.toLowerCase().includes('cumplimiento')
    )

    if (asuntoKey && subjectMap[asuntoKey]) {
      setForm(f => ({
        ...f,
        asunto: asuntoKey,
        subjectId: subjectMap[asuntoKey].id
      }))
    } else if (Object.keys(subjectMap).length > 0) {
      // Si no encuentra por nombre, buscar el que tenga faltas de inasistencia
      const subjectConInasistencias = Object.keys(subjectMap).find(key =>
        subjectMap[key].lacks.some(lack => lack.name.toLowerCase().includes('inasistencia'))
      )

      if (subjectConInasistencias) {
        setForm(f => ({
          ...f,
          asunto: subjectConInasistencias,
          subjectId: subjectMap[subjectConInasistencias].id
        }))
      }
    }
  }, [subjectMap])


  // Filtrar solo jurisdicciones habilitadas
  const jurisdiccionesHabilitadas = useMemo(() => {
    if (!jurisdictions || jurisdictions.length === 0) return []
    return jurisdictions.filter(jurisdiction => !jurisdiction.deleted_at)
  }, [jurisdictions])

  // Filtrar solo offenders habilitados
  const offendersHabilitados = useMemo(() => {
    if (!offenderResults || offenderResults.length === 0) return []
    return offenderResults.filter(offender => !offender.deleted_at)
  }, [offenderResults])

  const dniAutocompleteRef = useRef(null)

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dniAutocompleteRef.current && !dniAutocompleteRef.current.contains(event.target)) {
        setShowOffenderSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function setField(k, v) {
    setForm(f => {
      const newForm = { ...f, [k]: v }

      // Si cambia la falta, guardar el ID de la falta y el subjectId correspondiente
      if (k === 'falta') {
        const lack = lacksInasistencia.find(l => l.name === v)
        newForm.lackId = lack ? lack.id : null

        // Encontrar el subject al que pertenece esta falta
        if (lack) {
          Object.keys(subjectMap).forEach(subjectName => {
            const subject = subjectMap[subjectName]
            const foundLack = subject.lacks.find(l => l.id === lack.id)
            if (foundLack) {
              newForm.asunto = subjectName
              newForm.subjectId = subject.id
            }
          })
        }
      }

      return newForm
    })
  }


  function handleDNIChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setDniSearchTerm(value)
    setField('dni', value)
  }

  function handleOffenderSelect(offender) {
    selectOffender(offender)

    const nombreCompleto = `${offender.name || ''} ${offender.lastname || ''}`.trim()

    setForm(f => ({
      ...f,
      dni: offender.dni || '',
      nombreCompleto: nombreCompleto,
      turno: offender.shift || '',
      cargo: offender.job || '',
      regLab: offender.regime || ''
    }))

    setDniSearchTerm(offender.dni || '')
  }

  async function handleSubmit(ev) {
    ev.preventDefault()

    // Validar campos obligatorios
    if (!form.dni || form.dni.length !== 8) {
      setAlertModal({
        isOpen: true,
        title: 'DNI inválido',
        message: 'El DNI debe tener exactamente 8 dígitos',
        type: 'error'
      })
      return
    }

    if (!form.turno || !form.jurisdiccion || !form.cargo || !form.regLab) {
      setAlertModal({
        isOpen: true,
        title: 'Campos incompletos',
        message: 'Por favor, completa todos los campos obligatorios marcados con *',
        type: 'error'
      })
      return
    }

    if (!form.subjectId) {
      setAlertModal({
        isOpen: true,
        title: 'Error de configuración',
        message: 'No se pudo obtener el ID del asunto. Por favor, contacta al administrador.',
        type: 'error'
      })
      return
    }

    if (!form.jurisdictionId) {
      setAlertModal({
        isOpen: true,
        title: 'Jurisdicción no seleccionada',
        message: 'No se pudo obtener el ID de la jurisdicción. Por favor, reselecciona la jurisdicción.',
        type: 'error'
      })
      return
    }

    if (onSave) {
      onSave(form, []) // Enviar array vacío ya que no hay allLeads
    }

    onClose()
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Nueva Inasistencia</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <label>
            <FaIdCard style={{ marginRight: '8px' }} />
            DNI * (8 dígitos)
          </label>
          <div className="autocomplete-container" ref={dniAutocompleteRef}>
            <input
              value={dniSearchTerm}
              onChange={handleDNIChange}
              onFocus={() => offenderResults.length > 0 && setShowOffenderSuggestions(true)}
              placeholder="Ingresa 8 dígitos del DNI"
              maxLength={8}
              pattern="[0-9]{8}"
              autoComplete="off"
            />
            {offenderLoading && (
              <div className="autocomplete-loading">Buscando...</div>
            )}
            {offenderError && (
              <div className="autocomplete-error">{offenderError}</div>
            )}
            {showOffenderSuggestions && offendersHabilitados.length > 0 && (
              <div className="autocomplete-suggestions">
                {offendersHabilitados.map((offender, index) => (
                  <div
                    key={offender.gestionate_id || offender.id || index}
                    className="autocomplete-item"
                    onClick={() => handleOffenderSelect(offender)}
                  >
                    <div className="autocomplete-item-code">
                      DNI: {offender.dni} - {offender.name} {offender.lastname}
                    </div>
                    <div className="autocomplete-item-details">
                      {offender.job} | {offender.shift} | {offender.regime}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showOffenderSuggestions && offenderResults.length === 0 && dniSearchTerm.length >= 3 && !offenderLoading && (
              <div className="autocomplete-no-results">
                No se encontraron registros
              </div>
            )}
          </div>

          <label>
            <FaClipboardList style={{ marginRight: '8px' }} />
            Asunto
          </label>
          <input
            value={form.asunto}
            readOnly
            style={{ cursor: 'not-allowed', backgroundColor: 'var(--bg-secondary)' }}
          />

          <label>
            <FaClock style={{ marginRight: '8px' }} />
            Turno *
          </label>
          <input
            value={form.turno}
            readOnly
            placeholder="Se llenará automáticamente con el DNI"
            style={{ cursor: 'not-allowed' }}
          />

          <label>
            <FaUserTie style={{ marginRight: '8px' }} />
            Cargo *
          </label>
          <input
            value={form.cargo}
            readOnly
            placeholder="Se llenará automáticamente con el DNI"
            style={{ cursor: 'not-allowed' }}
          />

          <label>
            <FaIdBadge style={{ marginRight: '8px' }} />
            Reg. Lab *
          </label>
          <input
            value={form.regLab}
            readOnly
            placeholder="Se llenará automáticamente con el DNI"
            style={{ cursor: 'not-allowed' }}
          />

          <label>
            <FaBalanceScale style={{ marginRight: '8px' }} />
            Jurisdicción *
          </label>
          {jurisdictionsLoading ? (
            <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Cargando jurisdicciones...
            </div>
          ) : jurisdictionsError ? (
            <div style={{ padding: '12px', color: '#ef4444', textAlign: 'center' }}>
              {jurisdictionsError}
            </div>
          ) : (
            <select
              value={form.jurisdiccion}
              onChange={e => {
                const selectedJurisdiction = jurisdictions.find(j => j.name === e.target.value)
                if (selectedJurisdiction) {
                  setForm(f => ({
                    ...f,
                    jurisdiccion: selectedJurisdiction.name,
                    jurisdictionId: selectedJurisdiction.id
                  }))
                } else {
                  setForm(f => ({
                    ...f,
                    jurisdiccion: '',
                    jurisdictionId: null
                  }))
                }
              }}
            >
              <option value="">Selecciona una jurisdicción</option>
              {jurisdiccionesHabilitadas.map(jurisdiction => (
                <option key={jurisdiction.id} value={jurisdiction.name}>
                  {jurisdiction.name}
                </option>
              ))}
            </select>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">CANCELAR</button>
            <button type="submit" className="btn-primary">CREAR INCIDENCIA</button>
          </div>
        </form>
      </div>

      {/* Modal de alerta personalizado */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  )
}
