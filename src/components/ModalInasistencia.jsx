import React, { useEffect, useState, useRef, useMemo } from 'react'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useJobs from '../hooks/Job/useJobs'
import useLeads from '../hooks/Job/useLeads'
import useAllLeads from '../hooks/Job/useAllLeads'
import useSubjects from '../hooks/Subject/useSubjects'
import useJurisdictions from '../hooks/Jurisdiction/useJurisdictions'
import './Autocomplete.css'
import {
  FaIdCard,
  FaClipboardList,
  FaClock,
  FaUserTag,
  FaUsers,
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
  dirigidoA: '',
  destinatario: '',
  cargoDestinatario: '',
  conCopia: true,
  cc: [],
  subjectId: null,
  lackId: null
}

export default function ModalInasistencia({ onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [selectedLeadId, setSelectedLeadId] = useState('')

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

  // Hook para obtener lista de jobs (cargos)
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError
  } = useJobs()

  // Hook para obtener lista de leads (personas) según el job seleccionado
  const {
    leads,
    loading: leadsLoading,
    error: leadsError
  } = useLeads(selectedJobId)

  // Hook para obtener TODOS los leads (para la sección CC)
  const {
    allLeads,
    loading: allLeadsLoading,
    error: allLeadsError
  } = useAllLeads()

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

  // Filtrar lista de CC para excluir a la persona seleccionada y los deshabilitados
  const listaCC = useMemo(() => {
    if (!allLeads || allLeads.length === 0) return []

    return allLeads.filter(lead => {
      const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()
      const isEnabled = !lead.deleted_at
      return nombreCompleto !== form.destinatario && isEnabled
    })
  }, [allLeads, form.destinatario])

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

  // Filtrar solo jobs (cargos) habilitados
  const jobsHabilitados = useMemo(() => {
    if (!jobs || jobs.length === 0) return []
    return jobs.filter(job => !job.deleted_at)
  }, [jobs])

  // Filtrar solo leads (personal) habilitados
  const leadsHabilitados = useMemo(() => {
    if (!leads || leads.length === 0) return []
    return leads.filter(lead => !lead.deleted_at)
  }, [leads])

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

      // Si cambia dirigidoA, resetear destinatario
      if (k === 'dirigidoA') {
        newForm.destinatario = ''
      }

      return newForm
    })
  }

  // Función para manejar cambio de job/destinatario
  function handleJobChange(jobId, jobName) {
    setSelectedJobId(jobId)
    setSelectedLeadId('')
    setField('dirigidoA', jobName)
  }

  // Función para manejar selección de persona (lead)
  function handleLeadChange(leadId) {
    setSelectedLeadId(leadId)
    const selectedLead = leads.find(lead => lead.id === leadId)
    if (selectedLead) {
      const nombreCompleto = `${selectedLead.name} ${selectedLead.lastname}`.trim()
      setForm(f => ({
        ...f,
        destinatario: nombreCompleto,
        cargoDestinatario: selectedLead.job?.name || form.dirigidoA
      }))
    } else {
      setForm(f => ({
        ...f,
        destinatario: '',
        cargoDestinatario: ''
      }))
    }
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

  function toggleCC(leadId) {
    setForm(f => {
      const cc = f.cc || []
      const lead = allLeads.find(l => l.id === leadId)
      if (!lead) return f

      const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()

      if (cc.includes(nombreCompleto)) {
        return { ...f, cc: cc.filter(p => p !== nombreCompleto) }
      } else {
        return { ...f, cc: [...cc, nombreCompleto] }
      }
    })
  }

  async function handleSubmit(ev) {
    ev.preventDefault()

    // Validar campos obligatorios
    if (!form.dni || form.dni.length !== 8) {
      alert('El DNI debe tener exactamente 8 dígitos')
      return
    }

    if (!form.turno || !form.jurisdiccion || !form.dirigidoA || !form.destinatario || !form.cargo || !form.regLab) {
      alert('Completa todos los campos obligatorios')
      return
    }

    if (!form.subjectId) {
      alert('Error: No se pudo obtener el ID del asunto.')
      return
    }

    if (!form.jurisdictionId) {
      alert('Error: No se pudo obtener el ID de la jurisdicción. Por favor, reselecciona la jurisdicción.')
      return
    }

    if (!form.cc || form.cc.length === 0) {
      alert('Debes seleccionar al menos 1 persona para copia (CC)')
      return
    }

    if (onSave) {
      onSave(form, allLeads)
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

          <label>
            <FaUserTag style={{ marginRight: '8px' }} />
            Destinatario *
          </label>
          {jobsLoading ? (
            <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Cargando cargos...
            </div>
          ) : jobsError ? (
            <div style={{ padding: '12px', color: '#ef4444', textAlign: 'center' }}>
              {jobsError}
            </div>
          ) : (
            <select
              value={form.dirigidoA}
              onChange={e => {
                const selectedJob = jobs.find(job => job.name === e.target.value)
                if (selectedJob) {
                  handleJobChange(selectedJob.id, selectedJob.name)
                } else {
                  handleJobChange(null, '')
                }
              }}
            >
              <option value="">Selecciona</option>
              {jobsHabilitados.map(job => (
                <option key={job.id} value={job.name}>{job.name}</option>
              ))}
            </select>
          )}

          {form.dirigidoA && (
            <>
              <label>Persona *</label>
              {leadsLoading ? (
                <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Cargando personas...
                </div>
              ) : leadsError ? (
                <div style={{ padding: '12px', color: '#ef4444', textAlign: 'center' }}>
                  {leadsError}
                </div>
              ) : (
                <select
                  value={selectedLeadId}
                  onChange={e => handleLeadChange(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {leadsHabilitados.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.lastname}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {/* Sección CC - Obligatoria */}
          <div className="cc-section">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <FaUsers />
              Con copia (CC) - Obligatorio *
            </label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Selecciona al menos 1 persona para enviar copia del reporte
            </p>
          </div>

          {/* Lista de personas para CC */}
          {form.conCopia && (
            <div className="cc-list">
              <label>Seleccionar personas para copia:</label>
              {allLeadsLoading ? (
                <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Cargando personas...
                </div>
              ) : allLeadsError ? (
                <div style={{ padding: '12px', color: '#ef4444', textAlign: 'center' }}>
                  {allLeadsError}
                </div>
              ) : (
                <div className="checkbox-group">
                  {listaCC.map(lead => {
                    const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()
                    return (
                      <label key={lead.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={(form.cc || []).includes(nombreCompleto)}
                          onChange={() => toggleCC(lead.id)}
                        />
                        <span>{nombreCompleto} - {lead.job?.name || 'Sin cargo'}</span>
                      </label>
                    )
                  })}
                  {listaCC.length === 0 && !allLeadsLoading && (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No hay otras personas disponibles
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">CANCELAR</button>
            <button type="submit" className="btn-primary">CREAR INCIDENCIA</button>
          </div>
        </form>
      </div>
    </div>
  )
}
