ModalIncidencia.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import MapSelector from './MapSelector'
import useBodycamSearch from '../hooks/Bodycam/useBodycamSearch'
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
  FaExclamationTriangle,
  FaClock,
  FaMapMarkerAlt,
  FaUserTag,
  FaUsers,
  FaUserTie,
  FaIdBadge,
  FaBalanceScale
} from 'react-icons/fa'
import { BsCameraVideo } from 'react-icons/bs'
import { toast } from '../utils/toast'

const defaultState = {
  dni: '',
  nombreCompleto: '',  // Nuevo campo para nombre completo del offender
  asunto: '',
  falta: '',
  turno: '',
  medio: 'bodycam',
  tipoMedio: 'bodycam', // Tipo de medio: 'bodycam', 'camara' o 'radio'
  fechaIncidente: '',
  horaIncidente: '',
  bodycamNumber: '',
  bodycamAsignadaA: '',
  numeroCamara: '', // Número de cámara cuando se selecciona cámara
  numeroRadio: '', // Número de radio cuando se selecciona radio
  ubicacion: null,
  jurisdiccion: '',
  jurisdictionId: null,  // ID de la jurisdicción para la API
  dirigidoA: '',
  destinatario: '',
  cargoDestinatario: '', // Cargo de la persona destinataria (para el PDF)
  cargo: '',
  regLab: '',
  fechaFalta: '',
  conCopia: true,  // Cambiado a true porque la API requiere al menos 1 CC
  cc: [],
  subjectId: null,  // ID del asunto para la API
  lackId: null      // ID de la falta para la API
}

export default function ModalIncidencia({ initial, onClose, onSave }) {
  const [form, setForm] = useState(defaultState)
  const [selectedJobId, setSelectedJobId] = useState(null) // ID del job seleccionado
  const [selectedLeadId, setSelectedLeadId] = useState('') // ID del lead seleccionado
  const [camType, setCamType] = useState('BODYCAM') // Tipo de cámara para filtrar: 'BODYCAM' o 'CAMERA'

  // Hook para búsqueda de bodycam - filtra por tipo de cámara
  const {
    searchTerm: bodycamSearchTerm,
    setSearchTerm: setBodycamSearchTerm,
    results: bodycamResults,
    loading: bodycamLoading,
    error: bodycamError,
    showSuggestions: showBodycamSuggestions,
    setShowSuggestions: setShowBodycamSuggestions,
    selectBodycam
  } = useBodycamSearch(camType)

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

    // Filtrar para excluir al destinatario seleccionado y los deshabilitados (deleted_at !== null)
    return allLeads.filter(lead => {
      const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()
      const isEnabled = !lead.deleted_at // Solo habilitados
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

  // Obtener faltas disponibles según el asunto seleccionado
  // Excluir las faltas de tipo "Inasistencia"
  const lacksDisponibles = useMemo(() => {
    if (!form.asunto || !subjectMap[form.asunto]) return []
    // Filtrar para excluir faltas que contengan "Inasistencia"
    return subjectMap[form.asunto].lacks.filter(lack =>
      !lack.name.toLowerCase().includes('inasistencia')
    )
  }, [form.asunto, subjectMap])

  // Filtrar solo jobs (cargos) habilitados (deleted_at === null)
  const jobsHabilitados = useMemo(() => {
    if (!jobs || jobs.length === 0) return []
    return jobs.filter(job => !job.deleted_at)
  }, [jobs])

  // Filtrar solo leads (personal) habilitados (deleted_at === null)
  const leadsHabilitados = useMemo(() => {
    if (!leads || leads.length === 0) return []
    return leads.filter(lead => !lead.deleted_at)
  }, [leads])

  // Filtrar solo bodycams habilitadas (deleted_at === null)
  const bodycamsHabilitadas = useMemo(() => {
    if (!bodycamResults || bodycamResults.length === 0) return []
    return bodycamResults.filter(bodycam => !bodycam.deleted_at)
  }, [bodycamResults])

  // Filtrar solo jurisdicciones habilitadas (deleted_at === null)
  const jurisdiccionesHabilitadas = useMemo(() => {
    if (!jurisdictions || jurisdictions.length === 0) return []
    return jurisdictions.filter(jurisdiction => !jurisdiction.deleted_at)
  }, [jurisdictions])

  // Filtrar solo offenders habilitados (deleted_at === null)
  const offendersHabilitados = useMemo(() => {
    if (!offenderResults || offenderResults.length === 0) return []
    return offenderResults.filter(offender => !offender.deleted_at)
  }, [offenderResults])

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

      // Si cambia el asunto, resetear falta y campos relacionados
      if (k === 'asunto') {
        newForm.falta = ''
        newForm.lackId = null
        newForm.fechaFalta = ''

        // Guardar el ID del asunto seleccionado
        if (subjectMap[v]) {
          newForm.subjectId = subjectMap[v].id
        } else {
          newForm.subjectId = null
        }

        // Resetear campos de bodycam si la falta seleccionada es "Inasistencia"
        // (ya no verificamos el asunto, sino la falta específica)
        newForm.medio = 'bodycam' // Por defecto bodycam para todos
      }

      // Si cambia la falta, guardar el ID de la falta
      if (k === 'falta') {
        const lack = lacksDisponibles.find(l => l.name === v)
        newForm.lackId = lack ? lack.id : null

        // Si la falta es "Inasistencia" (cualquier tipo), cambiar medio a reporte y limpiar bodycam
        if (v && v.startsWith('Inasistencia')) {
          newForm.medio = 'reporte'
          newForm.bodycamNumber = ''
          newForm.bodycamAsignadaA = ''
        } else {
          newForm.medio = 'bodycam'
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
      toast.warning('El DNI debe tener exactamente 8 dígitos');
      return;
    }

    if (!form.asunto || !form.falta || !form.turno || !form.fechaIncidente || !form.horaIncidente || !form.jurisdiccion || !form.dirigidoA || !form.destinatario || !form.cargo || !form.regLab) {
      toast.warning('Completa todos los campos obligatorios');
      return;
    }

    // Validar que se hayan cargado los IDs necesarios de la API
    if (!form.subjectId) {
      toast.error('Error: No se pudo obtener el ID del asunto. Por favor, reselecciona el asunto.');
      return;
    }

    if (!form.lackId) {
      toast.error('Error: No se pudo obtener el ID de la falta. Por favor, reselecciona la falta.');
      return;
    }

    if (!form.jurisdictionId) {
      toast.error('Error: No se pudo obtener el ID de la jurisdicción. Por favor, reselecciona la jurisdicción.');
      return;
    }

    // Validar que haya al menos 1 persona en CC (la API lo requiere)
    if (!form.cc || form.cc.length === 0) {
      toast.warning('Debes seleccionar al menos 1 persona para copia (CC)');
      return;
    }

    // Validar ubicación (la API requiere coordenadas y dirección)
    if (!form.ubicacion || !form.ubicacion.coordinates || !form.ubicacion.address) {
      toast.warning('Debes seleccionar una ubicación en el mapa');
      return;
    }

    // Validaciones específicas para inasistencia
    if (form.falta && form.falta.startsWith('Inasistencia')) {
      // Para inasistencia no se requiere bodycam ni cámara ni radio
    } else {
      // Validaciones para otras faltas (requieren bodycam, cámara o radio)
      if (form.tipoMedio === 'bodycam') {
        if (!form.bodycamNumber || !form.bodycamAsignadaA) {
          toast.warning('Completa los campos de bodycam');
          return;
        }

        if (!form.bodycamId) {
          toast.error('Error: No se pudo obtener el ID de la bodycam. Por favor, selecciona una bodycam de la lista.');
          return;
        }
      } else if (form.tipoMedio === 'camara') {
        if (!form.numeroCamara) {
          toast.warning('Ingresa el número de cámara');
          return;
        }

        if (!form.bodycamId) {
          toast.error('Error: No se pudo obtener el ID de la cámara. Por favor, selecciona una cámara de la lista.');
          return;
        }
      } else if (form.tipoMedio === 'radio') {
        if (!form.numeroRadio) {
          toast.warning('Ingresa el número de radio');
          return;
        }

        if (!form.bodycamId) {
          toast.error('Error: No se pudo obtener el ID del radio. Por favor, selecciona un radio de la lista.');
          return;
        }
      }
    }

    // Notificar al padre con los datos del formulario y allLeads
    if (onSave) {
      onSave(form, allLeads);
    }

    // Cerrar modal
    onClose();
  }

  const mostrarCamposInasistencia = form.falta && form.falta.startsWith('Inasistencia')
  const mostrarCamposBodycam = !(form.falta && form.falta.startsWith('Inasistencia'))

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
            Seleccionar asunto *
          </label>
          <select
            value={form.asunto}
            onChange={e => setField('asunto', e.target.value)}
            disabled={subjectsLoading}
          >
            <option value="">{subjectsLoading ? 'Cargando asuntos...' : 'Selecciona'}</option>
            {Object.keys(subjectMap).map((asuntoName) => (
              <option key={subjectMap[asuntoName].id} value={asuntoName}>{asuntoName}</option>
            ))}
          </select>
          {subjectsError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              Error al cargar asuntos desde el servidor.
            </div>
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

          {/* Campos de bodycam/cámara (solo para NO inasistencia) */}
          {mostrarCamposBodycam && (
            <>
              <label>
                <BsCameraVideo style={{ marginRight: '8px' }} />
                Tipo de medio *
              </label>
              <select
                value={form.tipoMedio}
                onChange={e => {
                  const nuevoTipo = e.target.value

                  // Actualizar el tipo de cámara para el filtro de búsqueda primero
                  if (nuevoTipo === 'camara') {
                    setCamType('CAMERA')
                  } else if (nuevoTipo === 'radio') {
                    setCamType('RADIO')
                  } else {
                    setCamType('BODYCAM')
                  }

                  // Limpiar el término de búsqueda
                  setBodycamSearchTerm('')

                  // Actualizar el formulario en un solo batch para evitar re-renders
                  setForm(f => {
                    const newForm = { ...f }
                    newForm.tipoMedio = nuevoTipo
                    newForm.medio = nuevoTipo

                    // Limpiar campos de los otros tipos
                    if (nuevoTipo === 'camara') {
                      newForm.bodycamNumber = ''
                      newForm.bodycamAsignadaA = ''
                      newForm.bodycamId = ''
                      newForm.numeroRadio = ''
                    } else if (nuevoTipo === 'radio') {
                      newForm.bodycamNumber = ''
                      newForm.bodycamAsignadaA = ''
                      newForm.bodycamId = ''
                      newForm.numeroCamara = ''
                    } else {
                      newForm.numeroCamara = ''
                      newForm.numeroRadio = ''
                      newForm.bodycamId = ''
                    }

                    return newForm
                  })
                }}
              >
                <option value="bodycam">Bodycam</option>
                <option value="camara">Cámara</option>
                <option value="radio">Radio</option>
              </select>

              {/* Campos de Bodycam */}
              {form.tipoMedio === 'bodycam' && (
                <>
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
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className="autocomplete-suggestions">
                        {bodycamsHabilitadas.map((bodycam, index) => (
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
                </>
              )}

              {/* Campos de Cámara */}
              {form.tipoMedio === 'camara' && (
                <>
                  <label>N° de Cámara *</label>
                  <div className="autocomplete-container" ref={bodycamAutocompleteRef}>
                    <input
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar cámara (ej: 104A)"
                      autoComplete="off"
                    />
                    {bodycamLoading && (
                      <div className="autocomplete-loading">Buscando...</div>
                    )}
                    {bodycamError && (
                      <div className="autocomplete-error">{bodycamError}</div>
                    )}
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className="autocomplete-suggestions">
                        {bodycamsHabilitadas.map((camera, index) => (
                          <div
                            key={camera.id || index}
                            className="autocomplete-item"
                            onClick={() => {
                              selectBodycam(camera)
                              setShowBodycamSuggestions(false)
                              setBodycamSearchTerm(camera.name)
                              setField('numeroCamara', camera.name)
                              setField('bodycamId', camera.id)
                            }}
                          >
                            <strong>{camera.name}</strong>
                            {camera.serie && <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>Serie: {camera.serie}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Campos de Radio */}
              {form.tipoMedio === 'radio' && (
                <>
                  <label>N° de Radio *</label>
                  <div className="autocomplete-container" ref={bodycamAutocompleteRef}>
                    <input
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar radio (ej: 22110)"
                      autoComplete="off"
                    />
                    {bodycamLoading && (
                      <div className="autocomplete-loading">Buscando...</div>
                    )}
                    {bodycamError && (
                      <div className="autocomplete-error">{bodycamError}</div>
                    )}
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className="autocomplete-suggestions">
                        {bodycamsHabilitadas.map((radio, index) => (
                          <div
                            key={radio.id || index}
                            className="autocomplete-item"
                            onClick={() => {
                              selectBodycam(radio)
                              setShowBodycamSuggestions(false)
                              setBodycamSearchTerm(radio.name)
                              setField('numeroRadio', radio.name)
                              setField('bodycamId', radio.id)
                            }}
                          >
                            <strong>{radio.name}</strong>
                            {radio.serie && <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>Serie: {radio.serie}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Fecha de la falta *</label>
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
            <FaMapMarkerAlt style={{ marginRight: '8px' }} />
            Ubicación del Infractor *
          </label>
          <MapSelector
            value={form.ubicacion}
            onChange={p => {
              setField('ubicacion', p)
              // Si el mapa detectó una jurisdicción, actualizarla automáticamente
              if (p.jurisdiccion) {
                // Función para normalizar texto (quitar tildes y convertir a minúsculas)
                const normalizar = (texto) => {
                  return texto
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
                    .replace(/\s+/g, ' ') // Normalizar espacios
                    .trim()
                }

                const jurisdiccionNormalizada = normalizar(p.jurisdiccion)

                // Buscar la jurisdicción del backend que coincida
                const jurisdiccionBackend = jurisdiccionesHabilitadas.find(j =>
                  normalizar(j.name) === jurisdiccionNormalizada ||
                  normalizar(j.name).includes(jurisdiccionNormalizada) ||
                  jurisdiccionNormalizada.includes(normalizar(j.name))
                )

                if (jurisdiccionBackend) {
                  setField('jurisdiccion', jurisdiccionBackend.name)
                  setField('jurisdictionId', jurisdiccionBackend.id)
                }
              }
            }}
          />

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
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR INCIDENCIA' : 'CREAR INCIDENCIA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}