ModalIncidencia.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import MapSelector from './MapSelector'
import useBodycamSearch from '../hooks/Bodycam/useBodycamSearch'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useJobs from '../hooks/Job/useJobs'
import useLeads from '../hooks/Job/useLeads'
import useAllLeads from '../hooks/Job/useAllLeads'
import useSubjects from '../hooks/Subject/useSubjects'
import './Autocomplete.css'
import {
  FaIdCard,
  FaClipboardList,
  FaExclamationTriangle,
  FaClock,
  FaVideo,
  FaMapMarkerAlt,
  FaUserTag,
  FaUsers,
  FaUserTie,
  FaIdBadge,
  FaBalanceScale
} from 'react-icons/fa'

const defaultState = {
  dni: '',
  nombreCompleto: '',  // Nuevo campo para nombre completo del offender
  asunto: '',
  falta: '',
  turno: '',
  medio: 'bodycam',
  fechaIncidente: '',
  horaIncidente: '',
  bodycamNumber: '',
  bodycamAsignadaA: '',
  encargadoBodycam: '',
  ubicacion: null,
  jurisdiccion: '',
  dirigidoA: '',
  destinatario: '',
  cargoDestinatario: '', // Cargo de la persona destinataria (para el PDF)
  cargo: '',
  regLab: '',
  tipoInasistencia: '',
  fechaFalta: '',
  conCopia: true,  // Cambiado a true porque la API requiere al menos 1 CC
  cc: [],
  subjectId: null,  // ID del asunto para la API
  lackId: null      // ID de la falta para la API
}

// Nota: Los asuntos, faltas, destinatarios y la lista de CC ahora se cargan dinámicamente desde la API

export default function ModalIncidencia({ initial, onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [selectedJobId, setSelectedJobId] = useState(null) // ID del job seleccionado
  const [selectedLeadId, setSelectedLeadId] = useState('') // ID del lead seleccionado

  // Hook para búsqueda de bodycam
  const {
    searchTerm: bodycamSearchTerm,
    setSearchTerm: setBodycamSearchTerm,
    results: bodycamResults,
    loading: bodycamLoading,
    error: bodycamError,
    showSuggestions: showBodycamSuggestions,
    setShowSuggestions: setShowBodycamSuggestions,
    selectBodycam
  } = useBodycamSearch()

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

  // Hook para obtener subjects (asuntos) y lacks (faltas)
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError
  } = useSubjects()

  // Filtrar lista de CC para excluir a la persona seleccionada
  const listaCC = useMemo(() => {
    if (!allLeads || allLeads.length === 0) return []

    // Filtrar para excluir al destinatario seleccionado
    return allLeads.filter(lead => {
      const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()
      return nombreCompleto !== form.destinatario
    })
  }, [allLeads, form.destinatario])

  // Crear mapa de asuntos y faltas desde la API
  const subjectMap = useMemo(() => {
    const map = {}
    subjects.forEach(subject => {
      map[subject.name] = {
        id: subject.id,
        lacks: subject.lacks || []
      }
    })
    return map
  }, [subjects])

  // Obtener faltas disponibles según el asunto seleccionado
  const lacksDisponibles = useMemo(() => {
    if (!form.asunto || !subjectMap[form.asunto]) return []
    return subjectMap[form.asunto].lacks
  }, [form.asunto, subjectMap])

  const bodycamAutocompleteRef = useRef(null)
  const dniAutocompleteRef = useRef(null)

  useEffect(() => {
    if (initial) {
      setForm({ ...defaultState, ...initial })
      // Si estamos editando, establecer los searchTerms existentes
      if (initial.bodycamNumber) {
        setBodycamSearchTerm(initial.bodycamNumber)
      }
      if (initial.dni) {
        setDniSearchTerm(initial.dni)
      }
    } else {
      // Establecer fecha y hora automáticamente al crear
      const now = new Date()
      const fecha = now.toISOString().split('T')[0]
      const hora = now.toTimeString().slice(0, 5)
      setForm(f => ({ ...f, fechaIncidente: fecha, horaIncidente: hora }))
    }
  }, [initial])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (bodycamAutocompleteRef.current && !bodycamAutocompleteRef.current.contains(event.target)) {
        setShowBodycamSuggestions(false)
      }
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

      // Log cuando se actualiza la ubicación
      if (k === 'ubicacion') {
        console.log('🗺️ ModalIncidencia - Ubicación guardada en form:')
        console.log('   Coordenadas:', v?.coordinates)
        console.log('   Dirección:', v?.address)
      }

      // Si cambia el asunto, resetear falta y campos relacionados
      if (k === 'asunto') {
        newForm.falta = ''
        newForm.lackId = null
        newForm.tipoInasistencia = ''
        newForm.fechaFalta = ''

        // Guardar el ID del asunto desde la API
        if (subjectMap[v]) {
          newForm.subjectId = subjectMap[v].id
        } else {
          newForm.subjectId = null
        }

        // Resetear campos de bodycam si cambia a inasistencia
        if (v === 'Inasistencia') {
          newForm.medio = 'reporte'
          newForm.bodycamNumber = ''
          newForm.bodycamAsignadaA = ''
          newForm.encargadoBodycam = ''
        } else {
          newForm.medio = 'bodycam'
        }
      }

      // Si cambia la falta, guardar el ID de la falta
      if (k === 'falta') {
        const lack = lacksDisponibles.find(l => l.name === v)
        newForm.lackId = lack ? lack.id : null
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
    setSelectedJobId(jobId) // Actualizar el ID para cargar los leads
    setSelectedLeadId('') // Resetear la persona seleccionada
    setField('dirigidoA', jobName) // Guardar el nombre en el formulario
  }

  // Función para manejar selección de persona (lead)
  function handleLeadChange(leadId) {
    setSelectedLeadId(leadId) // Guardar ID para el select
    const selectedLead = leads.find(lead => lead.id === leadId)
    if (selectedLead) {
      const nombreCompleto = `${selectedLead.name} ${selectedLead.lastname}`.trim()
      setForm(f => ({
        ...f,
        destinatario: nombreCompleto,
        cargoDestinatario: selectedLead.job?.name || form.dirigidoA // Guardar el cargo del lead
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
    // Seleccionar offender usando el hook
    selectOffender(offender)

    // Rellenar el formulario con los datos del offender
    // Estructura del API: { dni, job, regime, shift, name, lastname }
    const nombreCompleto = `${offender.name || ''} ${offender.lastname || ''}`.trim()

    console.log('👤 Offender seleccionado:', offender)
    console.log('📝 Nombre completo:', nombreCompleto)

    setForm(f => ({
      ...f,
      dni: offender.dni || '',
      nombreCompleto: nombreCompleto,   // Guardar nombre completo
      turno: offender.shift || '',      // shift → turno
      cargo: offender.job || '',         // job → cargo
      regLab: offender.regime || '',     // regime → regLab
      bodycamAsignadaA: nombreCompleto   // Auto-llenar bodycam asignada a
    }))

    // Actualizar también el searchTerm
    setDniSearchTerm(offender.dni || '')
  }

  function toggleCC(leadId) {
    setForm(f => {
      const cc = f.cc || []
      // Buscar el lead completo
      const lead = allLeads.find(l => l.id === leadId)
      if (!lead) return f

      const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()

      // Verificar si ya está en la lista
      if (cc.includes(nombreCompleto)) {
        return { ...f, cc: cc.filter(p => p !== nombreCompleto) }
      } else {
        return { ...f, cc: [...cc, nombreCompleto] }
      }
    })
  }

  function handleBodycamSelect(bodycam) {
    // Seleccionar bodycam usando el hook
    selectBodycam(bodycam)

    // Rellenar el formulario con los datos de la bodycam
    // Campos del API: id, name
    setForm(f => ({
      ...f,
      bodycamId: bodycam.id || '',  // Guardar ID para la API
      bodycamNumber: bodycam.name || bodycam.id || ''
      // NO sobrescribir bodycamAsignadaA ni encargadoBodycam
      // Estos campos ya se llenaron con handleOffenderSelect
    }))

    // Actualizar también el searchTerm
    setBodycamSearchTerm(bodycam.name || bodycam.id || '')
  }

  function handleBodycamInputChange(e) {
    const value = e.target.value
    setBodycamSearchTerm(value)
    setField('bodycamNumber', value)
  }

  async function handleSubmit(ev) {
    ev.preventDefault();

    // Validar campos obligatorios
    if (!form.dni || form.dni.length !== 8) {
      alert('El DNI debe tener exactamente 8 dígitos');
      return;
    }

    if (!form.asunto || !form.falta || !form.turno || !form.fechaIncidente || !form.horaIncidente || !form.jurisdiccion || !form.dirigidoA || !form.destinatario || !form.cargo || !form.regLab) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    // Validar que se hayan cargado los IDs necesarios de la API
    if (!form.subjectId) {
      alert('Error: No se pudo obtener el ID del asunto. Por favor, reselecciona el asunto.');
      return;
    }

    if (!form.lackId) {
      alert('Error: No se pudo obtener el ID de la falta. Por favor, reselecciona la falta.');
      return;
    }

    // Validar que haya al menos 1 persona en CC (la API lo requiere)
    if (!form.cc || form.cc.length === 0) {
      alert('Debes seleccionar al menos 1 persona para copia (CC)');
      return;
    }

    // Validar ubicación (la API requiere coordenadas y dirección)
    if (!form.ubicacion || !form.ubicacion.coordinates || !form.ubicacion.address) {
      alert('Debes seleccionar una ubicación en el mapa');
      return;
    }

    // Validaciones específicas para inasistencia
    if (form.asunto === 'Inasistencia') {
      if (!form.tipoInasistencia || !form.fechaFalta) {
        alert('Para inasistencia, completa el tipo y la fecha de falta');
        return;
      }
    } else {
      // Validaciones para otros asuntos (requieren bodycam)
      if (!form.bodycamNumber || !form.bodycamAsignadaA || !form.encargadoBodycam) {
        alert('Completa los campos de bodycam');
        return;
      }

      if (!form.bodycamId) {
        alert('Error: No se pudo obtener el ID de la bodycam. Por favor, selecciona una bodycam de la lista.');
        return;
      }
    }

    console.log('📋 Datos del formulario antes de enviar:', form);

    // Notificar al padre con los datos del formulario y allLeads
    if (onSave) {
      onSave(form, allLeads);
    }

    // Cerrar modal
    onClose();
  }

  const mostrarCamposInasistencia = form.asunto === 'Inasistencia'
  const mostrarCamposBodycam = form.asunto !== 'Inasistencia'

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{initial ? 'Editar Incidencia' : 'Nueva Incidencia'}</h3>
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
            {showOffenderSuggestions && offenderResults.length > 0 && (
              <div className="autocomplete-suggestions">
                {offenderResults.map((offender, index) => (
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
            Seleccionar asunto *
          </label>
          {subjectsLoading ? (
            <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Cargando asuntos...
            </div>
          ) : subjectsError ? (
            <div style={{ padding: '12px', color: '#ef4444', textAlign: 'center' }}>
              {subjectsError}
            </div>
          ) : (
            <select
              value={form.asunto}
              onChange={e => setField('asunto', e.target.value)}
            >
              <option value="">Selecciona</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          )}

          {form.asunto && (
            <>
              <label>
                <FaExclamationTriangle style={{ marginRight: '8px' }} />
                Seleccionar falta *
              </label>
              <select
                value={form.falta}
                onChange={e => setField('falta', e.target.value)}
              >
                <option value="">Selecciona</option>
                {lacksDisponibles.map(lack => (
                  <option key={lack.id} value={lack.name}>{lack.name}</option>
                ))}
              </select>
            </>
          )}

          {/* Campos específicos para inasistencia */}
          {mostrarCamposInasistencia && (
            <>
              <label>
                <FaExclamationTriangle style={{ marginRight: '8px' }} />
                Tipo de inasistencia *
              </label>
              <select
                value={form.tipoInasistencia}
                onChange={e => setField('tipoInasistencia', e.target.value)}
              >
                <option value="">Selecciona tipo</option>
                <option value="Justificada">Justificada</option>
                <option value="Injustificada">Injustificada</option>
              </select>

              <label>Fecha de falta *</label>
              <input
                type="date"
                value={form.fechaFalta}
                onChange={e => setField('fechaFalta', e.target.value)}
              />
            </>
          )}

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

          {/* Campos de bodycam (solo para NO inasistencia) */}
          {mostrarCamposBodycam && (
            <>
              <label>
                <FaVideo style={{ marginRight: '8px' }} />
                Medio *
              </label>
              <select
                value={form.medio}
                onChange={e => setField('medio', e.target.value)}
              >
                <option value="bodycam">Bodycam</option>
              </select>

              <label>N° de Bodycam *</label>
              <div className="autocomplete-container" ref={bodycamAutocompleteRef}>
                <input
                  value={bodycamSearchTerm}
                  onChange={handleBodycamInputChange}
                  onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                  placeholder="Escribe para buscar bodycam (ej: SG004 o FISCA004)"
                  autoComplete="off"
                />
                {bodycamLoading && (
                  <div className="autocomplete-loading">Buscando...</div>
                )}
                {bodycamError && (
                  <div className="autocomplete-error">{bodycamError}</div>
                )}
                {showBodycamSuggestions && bodycamResults.length > 0 && (
                  <div className="autocomplete-suggestions">
                    {bodycamResults.map((bodycam, index) => (
                      <div
                        key={bodycam.id || index}
                        className="autocomplete-item"
                        onClick={() => handleBodycamSelect(bodycam)}
                      >
                        <div className="autocomplete-item-code">
                          {bodycam.name || bodycam.id}
                        </div>
                        {(bodycam.asignadoA || bodycam.asignado || bodycam.usuario) && (
                          <div className="autocomplete-item-details">
                            {bodycam.asignadoA || bodycam.asignado || bodycam.usuario}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {showBodycamSuggestions && bodycamResults.length === 0 && bodycamSearchTerm.length >= 2 && !bodycamLoading && (
                  <div className="autocomplete-no-results">
                    No se encontraron bodycams
                  </div>
                )}
              </div>

              <label>Bodycam asignada a: *</label>
              <input
                value={form.bodycamAsignadaA}
                onChange={e => setField('bodycamAsignadaA', e.target.value)}
                placeholder="Se llenará automáticamente al seleccionar DNI"
              />

              <label>Encargado de bodycam: *</label>
              <input
                value={form.encargadoBodycam}
                onChange={e => setField('encargadoBodycam', e.target.value)}
                placeholder="Encargado de la bodycam"
              />
            </>
          )}

          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Fecha del Incidente *</label>
              <input
                type="date"
                value={form.fechaIncidente}
                onChange={e => setField('fechaIncidente', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Hora del Incidente *</label>
              <input
                type="time"
                value={form.horaIncidente}
                onChange={e => setField('horaIncidente', e.target.value)}
              />
            </div>
          </div>

          <label>
            <FaBalanceScale style={{ marginRight: '8px' }} />
            Jurisdicción *
          </label>
          <input
            value={form.jurisdiccion}
            onChange={e => setField('jurisdiccion', e.target.value)}
            placeholder="Ingresa la jurisdicción"
          />

          <label>
            <FaMapMarkerAlt style={{ marginRight: '8px' }} />
            Ubicación del Infractor *
          </label>
          <MapSelector value={form.ubicacion} onChange={p => setField('ubicacion', p)} />

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
              {jobs.map(job => (
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
                  {leads.map(lead => (
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
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR INCIDENCIA' : 'CREAR INCIDENCIA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}