// ModalIncidencia.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import MapSelector from './MapSelector'
import type { MapSelectorValue } from './MapSelector'
import type { Bodycam, Cam, ID, ISODateString, Incidencia, IncidenciaForm, Lead, OffenderDniLookup, SubjectLack, TipoMedio, Ubicacion } from '@/types'
import useBodycamSearch from '../hooks/Bodycam/useBodycamSearch'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useJobs from '../hooks/Job/useJobs'
import useLeads from '../hooks/Job/useLeads'
import useAllLeads from '../hooks/Job/useAllLeads'
import useSubjects from '../hooks/Subject/useSubjects'
import useJurisdictions from '../hooks/Jurisdiction/useJurisdictions'
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
import {
  autocompleteContainer,
  autocompleteError,
  autocompleteItem,
  autocompleteItemCode,
  autocompleteItemDetails,
  autocompleteLoading,
  autocompleteNoResults,
  autocompleteSuggestions,
  btnPrimary,
  btnSecondary,
  cn,
  modalActions,
  modalBackdrop,
  modalBody,
  modalCard,
  modalClose,
  modalHeader,
  modalInput,
  modalInputDateTime,
  modalLabel,
  modalTitle
} from '@/utils/classes'

/** Props de ModalIncidencia. `initial` es la incidencia a editar (vacío al crear). */
export interface ModalIncidenciaProps {
  initial?: Partial<IncidenciaForm> | Incidencia | null;
  onClose: () => void;
  onSave?: (data: IncidenciaForm, allLeads: Lead[]) => void | Promise<void>;
}

/** Campos de asignación que el API de bodycam devuelve y que no están en el modelo `Bodycam`. */
interface BodycamSugerencia extends Bodycam {
  asignadoA?: string;
  asignado?: string;
  usuario?: string;
}

/** Campos que la búsqueda por DNI devuelve y que no están en `OffenderDniLookup`. */
interface OffenderSugerencia extends OffenderDniLookup {
  id?: ID;
  deleted_at?: ISODateString | null;
}

/** Entrada del mapa de asuntos: id del asunto y sus faltas. */
interface SubjectEntry {
  id: ID;
  lacks: SubjectLack[];
}

/** Input de solo lectura (rellenado automáticamente con el DNI) */
const readOnlyInput = cn(modalInput, 'cursor-not-allowed')

/** Input de fecha y hora del modal */
const dateTimeInput = cn(modalInput, modalInputDateTime)

/** Recuadro con la lista de personas para copia (CC) */
const ccList =
  'mt-3 animate-[slideDown_0.3s_ease-out] rounded-[12px] border border-line bg-surface p-4 [backdrop-filter:blur(10px)]'

/** Fila de cada persona de la lista CC (hereda el estilo de <label> del modal) */
const checkboxLabel = cn(
  modalLabel,
  'flex cursor-pointer items-center gap-3 rounded-[8px] border border-transparent px-3 py-2.5 transition-all duration-300 ease-[ease] hover:translate-x-1 hover:border-primary hover:bg-[rgba(30,58,138,0.1)]'
)

/** Checkbox de la lista CC: hereda los estilos de input del modal, con tamaño de 20px */
const checkboxInput =
  'h-5 w-5 cursor-pointer accent-primary rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[14px] text-content! outline-none transition-all duration-300 ease-[ease] [backdrop-filter:blur(5px)] focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] dark:text-[#f8fafc]!'

const defaultState: IncidenciaForm = {
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

export default function ModalIncidencia({ initial, onClose, onSave }: ModalIncidenciaProps) {
  const [form, setForm] = useState<IncidenciaForm>(defaultState)
  const [selectedJobId, setSelectedJobId] = useState<ID | null>(null) // ID del job seleccionado
  const [selectedLeadId, setSelectedLeadId] = useState<string>('') // ID del lead seleccionado
  const [camType, setCamType] = useState<Cam>('BODYCAM') //Tipo de cámara para filtrar: 'BODYCAM' o 'CAMERA'

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
    const map: Record<string, SubjectEntry> = {}

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
  const bodycamsHabilitadas = useMemo<BodycamSugerencia[]>(() => {
    if (!bodycamResults || bodycamResults.length === 0) return []
    return bodycamResults.filter(bodycam => !bodycam.deleted_at)
  }, [bodycamResults])

  // Filtrar solo jurisdicciones habilitadas (deleted_at === null)
  const jurisdiccionesHabilitadas = useMemo(() => {
    if (!jurisdictions || jurisdictions.length === 0) return []
    return jurisdictions.filter(jurisdiction => !jurisdiction.deleted_at)
  }, [jurisdictions])

  // Filtrar solo offenders habilitados (deleted_at === null)
  const offendersHabilitados = useMemo<OffenderSugerencia[]>(() => {
    if (!offenderResults || offenderResults.length === 0) return []
    return offenderResults.filter(offender => !(offender as OffenderSugerencia).deleted_at)
  }, [offenderResults])

  const bodycamAutocompleteRef = useRef<HTMLDivElement | null>(null)
  const dniAutocompleteRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (initial) {
      setForm({ ...defaultState, ...(initial as Partial<IncidenciaForm>) })
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
    function handleClickOutside(event: MouseEvent) {
      if (bodycamAutocompleteRef.current && !bodycamAutocompleteRef.current.contains(event.target as Node)) {
        setShowBodycamSuggestions(false)
      }
      if (dniAutocompleteRef.current && !dniAutocompleteRef.current.contains(event.target as Node)) {
        setShowOffenderSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function setField<K extends keyof IncidenciaForm>(k: K, v: IncidenciaForm[K]) {
    setForm(f => {
      const newForm: IncidenciaForm = { ...f, [k]: v }

      // Si cambia el asunto, resetear falta y campos relacionados
      if (k === 'asunto') {
        const asunto = v as string
        newForm.falta = ''
        newForm.lackId = null
        newForm.fechaFalta = ''

        // Guardar el ID del asunto seleccionado
        if (subjectMap[asunto]) {
          newForm.subjectId = subjectMap[asunto].id
        } else {
          newForm.subjectId = null
        }

        // Resetear campos de bodycam si la falta seleccionada es "Inasistencia"
        // (ya no verificamos el asunto, sino la falta específica)
        newForm.medio = 'bodycam' // Por defecto bodycam para todos
      }

      // Si cambia la falta, guardar el ID de la falta
      if (k === 'falta') {
        const falta = v as string
        const lack = lacksDisponibles.find(l => l.name === falta)
        newForm.lackId = lack ? lack.id : null

        // Si la falta es "Inasistencia" (cualquier tipo), cambiar medio a reporte y limpiar bodycam
        if (falta && falta.startsWith('Inasistencia')) {
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
  function handleJobChange(jobId: ID | null, jobName: string) {
    setSelectedJobId(jobId) // Actualizar el ID para cargar los leads
    setSelectedLeadId('') // Resetear la persona seleccionada
    setField('dirigidoA', jobName) // Guardar el nombre en el formulario
  }

  // Función para manejar selección de persona (lead)
  function handleLeadChange(leadId: string) {
    setSelectedLeadId(leadId) // Guardar ID para el select
    const selectedLead = leads.find(lead => lead.id === leadId)
    if (selectedLead) {
      const nombreCompleto = `${selectedLead.name} ${selectedLead.lastname}`.trim().toUpperCase()
      setForm(f => ({
        ...f,
        destinatario: nombreCompleto,
        cargoDestinatario: (selectedLead.job?.name || form.dirigidoA).toUpperCase() // Guardar el cargo del lead en mayúsculas
      }))
    } else {
      setForm(f => ({
        ...f,
        destinatario: '',
        cargoDestinatario: ''
      }))
    }
  }
 
  function handleDNIChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setDniSearchTerm(value)
    setField('dni', value)
  }

  function handleOffenderSelect(offender: OffenderDniLookup) {
    // Seleccionar offender usando el hook
    selectOffender(offender)

    // Rellenar el formulario con los datos del offender
    // Estructura del API: { dni, job, regime, shift, name, lastname }
    const nombreCompleto = `${offender.name || ''} ${offender.lastname || ''}`.trim().toUpperCase()

    setForm(f => ({
      ...f,
      dni: offender.dni || '',
      nombreCompleto: nombreCompleto,
      turno: (offender.shift || '').toUpperCase(),
      cargo: (offender.job || '').toUpperCase(),
      regLab: (offender.regime || '').toUpperCase(),
      bodycamAsignadaA: nombreCompleto
    }))

    // Actualizar también el searchTerm
    setDniSearchTerm(offender.dni || '')
  }

  function toggleCC(leadId: ID) {
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

  function handleBodycamSelect(bodycam: Bodycam) {
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

  function handleBodycamInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setBodycamSearchTerm(value)
    setField('bodycamNumber', value)
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    // Validar campos obligatorios
    if (!form.dni) {
      toast.warning('El campo DNI/Nombre es obligatorio');
      return;
    }

    // Si es numérico, debe tener 8 dígitos (DNI)
    if (/^\d+$/.test(form.dni) && form.dni.length !== 8) {
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
    } else if ((form.tipoMedio as string) === 'Phone') {
      // Para celular no se requieren campos adicionales
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
    <div className={modalBackdrop}>
      <div className={modalCard}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>{initial ? 'Editar Incidencia' : 'Nueva Incidencia'}</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>
        <form className={modalBody} onSubmit={handleSubmit}>
          <label className={modalLabel}>
            <FaIdCard className="mr-2" />
            DNI * (8 dígitos)
          </label>
          <div className={autocompleteContainer} ref={dniAutocompleteRef}>
            <input
              className={modalInput}
              value={dniSearchTerm}
              onChange={handleDNIChange}
              onFocus={() => offenderResults.length > 0 && setShowOffenderSuggestions(true)}
              placeholder="Ingresa 8 dígitos del DNI"
              autoComplete="off"
            />
            {offenderLoading && (
              <div className={autocompleteLoading}>Buscando...</div>
            )}
            {offenderError && (
              <div className={autocompleteError}>{offenderError}</div>
            )}
            {showOffenderSuggestions && offendersHabilitados.length > 0 && (
              <div className={autocompleteSuggestions}>
                {offendersHabilitados.map((offender, index) => (
                  <div
                    key={offender.gestionate_id || offender.id || index}
                    className={autocompleteItem}
                    onClick={() => handleOffenderSelect(offender)}
                  >
                    <div className={autocompleteItemCode}>
                      DNI: {offender.dni} - {offender.name} {offender.lastname}
                    </div>
                    <div className={autocompleteItemDetails}>
                      {offender.job} | {offender.shift} | {offender.regime}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showOffenderSuggestions && offenderResults.length === 0 && dniSearchTerm.length >= 3 && !offenderLoading && (
              <div className={autocompleteNoResults}>
                No se encontraron registros
              </div>
            )}
          </div>

          <label className={modalLabel}>
            <FaClipboardList className="mr-2" />
            Seleccionar asunto *
          </label>
          <select
            className={modalInput}
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
            <div className="mt-1 text-[12px] text-[red]">
              Error al cargar asuntos desde el servidor.
            </div>
          )}

          {form.asunto && (
            <>
              <label className={modalLabel}>
                <FaExclamationTriangle className="mr-2" />
                Seleccionar falta *
              </label>
              <select
                className={modalInput}
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

          <label className={modalLabel}>
            <FaClock className="mr-2" />
            Turno *
          </label>
          <input
            className={readOnlyInput}
            value={form.turno}
            readOnly
            placeholder="Se llenará automáticamente con el DNI"
          />

          <label className={modalLabel}>
            <FaUserTie className="mr-2" />
            Cargo *
          </label>
          <input
            className={readOnlyInput}
            value={form.cargo}
            readOnly
            placeholder="Se llenará automáticamente con el DNI"
          />

          <label className={modalLabel}>
            <FaIdBadge className="mr-2" />
            Reg. Lab *
          </label>
          <input
            className={readOnlyInput}
            value={form.regLab}
            readOnly
            placeholder="Se llenará automáticamente con el DNI"
          />

          {/* Campos de bodycam/cámara (solo para NO inasistencia) */}
          {mostrarCamposBodycam && (
            <>
              <label className={modalLabel}>
                <BsCameraVideo className="mr-2" />
                Tipo de medio *
              </label>
              <select
                className={modalInput}
                value={form.tipoMedio}
                onChange={e => {
                  const nuevoTipo = e.target.value

                  // Actualizar el tipo de cámara para el filtro de búsqueda primero
                  if (nuevoTipo === 'camara') {
                    setCamType('CAMERA')
                  } else if (nuevoTipo === 'radio') {
                    setCamType('RADIO')
                  } else if (nuevoTipo === 'Phone') {
                    // Phone no necesita tipo de cámara
                  } else {
                    setCamType('BODYCAM')
                  }

                  // Limpiar el término de búsqueda
                  setBodycamSearchTerm('')

                  // Actualizar el formulario en un solo batch para evitar re-renders
                  setForm(f => {
                    const newForm = { ...f }
                    newForm.tipoMedio = nuevoTipo as TipoMedio // 'Phone' se usa en la UI pero no está en TIPOS_MEDIO
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
                    } else if (nuevoTipo === 'Phone') {
                      // Limpiar todos los campos relacionados a bodycam/cámara/radio
                      newForm.bodycamNumber = ''
                      newForm.bodycamAsignadaA = ''
                      newForm.bodycamId = ''
                      newForm.numeroCamara = ''
                      newForm.numeroRadio = ''
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
                <option value="Phone">Celular</option>
              </select>

              {/* Campos de Bodycam */}
              {form.tipoMedio === 'bodycam' && (
                <>
                  <label className={modalLabel}>N° de Bodycam *</label>
                  <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                    <input
                      className={modalInput}
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar bodycam (ej: SG004 o FISCA004)"
                      autoComplete="off"
                    />
                    {bodycamLoading && (
                      <div className={autocompleteLoading}>Buscando...</div>
                    )}
                    {bodycamError && (
                      <div className={autocompleteError}>{bodycamError}</div>
                    )}
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className={autocompleteSuggestions}>
                        {bodycamsHabilitadas.map((bodycam, index) => (
                          <div
                            key={bodycam.id || index}
                            className={autocompleteItem}
                            onClick={() => handleBodycamSelect(bodycam)}
                          >
                            <div className={autocompleteItemCode}>
                              {bodycam.name || bodycam.id}
                            </div>
                            {(bodycam.asignadoA || bodycam.asignado || bodycam.usuario) && (
                              <div className={autocompleteItemDetails}>
                                {bodycam.asignadoA || bodycam.asignado || bodycam.usuario}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {showBodycamSuggestions && bodycamResults.length === 0 && bodycamSearchTerm.length >= 2 && !bodycamLoading && (
                      <div className={autocompleteNoResults}>
                        No se encontraron bodycams
                      </div>
                    )}
                  </div>

                  <label className={modalLabel}>Bodycam asignada a: *</label>
                  <input
                    className={modalInput}
                    value={form.bodycamAsignadaA}
                    onChange={e => setField('bodycamAsignadaA', e.target.value)}
                    placeholder="Se llenará automáticamente al seleccionar DNI"
                  />
                </>
              )}

              {/* Campos de Cámara */}
              {form.tipoMedio === 'camara' && (
                <>
                  <label className={modalLabel}>N° de Cámara *</label>
                  <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                    <input
                      className={modalInput}
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar cámara (ej: 104A)"
                      autoComplete="off"
                    />
                    {bodycamLoading && (
                      <div className={autocompleteLoading}>Buscando...</div>
                    )}
                    {bodycamError && (
                      <div className={autocompleteError}>{bodycamError}</div>
                    )}
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className={autocompleteSuggestions}>
                        {bodycamsHabilitadas.map((camera, index) => (
                          <div
                            key={camera.id || index}
                            className={autocompleteItem}
                            onClick={() => {
                              selectBodycam(camera)
                              setShowBodycamSuggestions(false)
                              setBodycamSearchTerm(camera.name)
                              setField('numeroCamara', camera.name)
                              setField('bodycamId', camera.id)
                            }}
                          >
                            <strong>{camera.name}</strong>
                            {camera.serie && <span className="ml-2 text-muted">Serie: {camera.serie}</span>}
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
                  <label className={modalLabel}>N° de Radio *</label>
                  <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                    <input
                      className={modalInput}
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar radio (ej: 22110)"
                      autoComplete="off"
                    />
                    {bodycamLoading && (
                      <div className={autocompleteLoading}>Buscando...</div>
                    )}
                    {bodycamError && (
                      <div className={autocompleteError}>{bodycamError}</div>
                    )}
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className={autocompleteSuggestions}>
                        {bodycamsHabilitadas.map((radio, index) => (
                          <div
                            key={radio.id || index}
                            className={autocompleteItem}
                            onClick={() => {
                              selectBodycam(radio)
                              setShowBodycamSuggestions(false)
                              setBodycamSearchTerm(radio.name)
                              setField('numeroRadio', radio.name)
                              setField('bodycamId', radio.id)
                            }}
                          >
                            <strong>{radio.name}</strong>
                            {radio.serie && <span className="ml-2 text-muted">Serie: {radio.serie}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={modalLabel}>Fecha de la falta *</label>
              <input
                className={dateTimeInput}
                type="date"
                value={form.fechaIncidente}
                onChange={e => setField('fechaIncidente', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className={modalLabel}>Hora del Incidente *</label>
              <input
                className={dateTimeInput}
                type="time"
                value={form.horaIncidente}
                onChange={e => setField('horaIncidente', e.target.value)}
              />
            </div>
          </div>

          <label className={modalLabel}>
            <FaBalanceScale className="mr-2" />
            Jurisdicción *
          </label>
          {jurisdictionsLoading ? (
            <div className="p-3 text-center text-muted">
              Cargando jurisdicciones...
            </div>
          ) : jurisdictionsError ? (
            <div className="p-3 text-center text-[#ef4444]">
              {jurisdictionsError}
            </div>
          ) : (
            <select
              className={modalInput}
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

          <label className={modalLabel}>
            <FaMapMarkerAlt className="mr-2" />
            Ubicación del Infractor *
          </label>
          <MapSelector
            value={form.ubicacion}
            onChange={(p: MapSelectorValue) => {
              setField('ubicacion', p as Ubicacion)
              // Si el mapa detectó una jurisdicción, actualizarla automáticamente
              if (p.jurisdiccion) {
                // Función para normalizar texto (quitar tildes y convertir a minúsculas)
                const normalizar = (texto: string): string => {
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

          <label className={modalLabel}>
            <FaUserTag className="mr-2" />
            Destinatario *
          </label>
          {jobsLoading ? (
            <div className="p-3 text-center text-muted">
              Cargando cargos...
            </div>
          ) : jobsError ? (
            <div className="p-3 text-center text-[#ef4444]">
              {jobsError}
            </div>
          ) : (
            <select
              className={modalInput}
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
              <label className={modalLabel}>Persona *</label>
              {leadsLoading ? (
                <div className="p-3 text-center text-muted">
                  Cargando personas...
                </div>
              ) : leadsError ? (
                <div className="p-3 text-center text-[#ef4444]">
                  {leadsError}
                </div>
              ) : (
                <select
                  className={modalInput}
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
          <div>
            <label className={cn(modalLabel, 'flex items-center gap-2')}>
              <FaUsers />
              Con copia (CC) - Obligatorio *
            </label>
            <p className="mt-1 text-[0.85rem] text-muted">
              Selecciona al menos 1 persona para enviar copia del reporte
            </p>
          </div>

          {/* Lista de personas para CC */}
          {form.conCopia && (
            <div className={ccList}>
              <label className={modalLabel}>Seleccionar personas para copia:</label>
              {allLeadsLoading ? (
                <div className="p-3 text-center text-muted">
                  Cargando personas...
                </div>
              ) : allLeadsError ? (
                <div className="p-3 text-center text-[#ef4444]">
                  {allLeadsError}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2.5">
                  {listaCC.map(lead => {
                    const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()
                    return (
                      <label key={lead.id} className={checkboxLabel}>
                        <input
                          type="checkbox"
                          className={checkboxInput}
                          checked={(form.cc || []).includes(nombreCompleto)}
                          onChange={() => toggleCC(lead.id)}
                        />
                        <span className="text-[14px] text-content-2">{nombreCompleto} - {lead.job?.name || 'Sin cargo'}</span>
                      </label>
                    )
                  })}
                  {listaCC.length === 0 && !allLeadsLoading && (
                    <div className="p-3 text-center text-muted">
                      No hay otras personas disponibles
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={modalActions}>
            <button type="button" onClick={onClose} className={btnSecondary}>CANCELAR</button>
            <button type="submit" className={btnPrimary}>
              {initial ? 'ACTUALIZAR INCIDENCIA' : 'CREAR INCIDENCIA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}