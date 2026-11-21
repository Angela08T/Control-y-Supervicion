import ServiceAssignmentFields from './ServiceAssignmentFields'
import { identityError, serviceAssignment } from '../utils/serviceAssignment'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import MapSelector from './MapSelector'
import type { MapSelectorValue } from './MapSelector'
import type { Cam, ID, ISODateString, Incidencia, IncidenciaForm, Lead, OffenderDniLookup, SubjectLack, Ubicacion } from '@/types'
import { getBodycams } from '../api/bodycam'
import type { BodycamView } from '@/types'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useJobs from '../hooks/Job/useJobs'
import useLeads from '../hooks/Job/useLeads'
import useAllLeads from '../hooks/Job/useAllLeads'
import useSubjects from '../hooks/Subject/useSubjects'
import useJurisdictions from '../hooks/Jurisdiction/useJurisdictions'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { Field, Input } from '@/components/UI/Field'
import Dropdown from '@/components/UI/Dropdown'
import { DatePicker, TimePicker } from '@/components/UI/DateTimePicker'
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
  FiChevronUp,
  FiEdit3,
  FiFilePlus,
  FiInfo,
  FiLoader,
  FiMapPin,
  FiPlus,
  FiRadio,
  FiSave,
  FiSearch,
  FiSend,
  FiSmartphone,
  FiUser,
  FiUserPlus,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import { HeroProgress, ModalHero, StepLayout, StepSection, useActiveStep, type StepInfo } from '@/components/UI/FormSteps'
import { ASUNTOS, nombreCorto } from '@/pages/Dashboard/asuntos'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
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
  cn
} from '@/utils/classes'

/** Props de ModalIncidencia. `initial` es la incidencia a editar (vacío al crear). */
export interface ModalIncidenciaProps {
  initial?: Partial<IncidenciaForm> | Incidencia | null;
  onClose: () => void;
  onSave?: (data: IncidenciaForm, allLeads: Lead[]) => void | Promise<void>;
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

const defaultState: IncidenciaForm = {
  dni: '',
  nombreCompleto: '',  // Nuevo campo para nombre completo del offender
  asunto: '',
  falta: '',
  turno: '',
  medio: 'bodycam',
  media: [{ cam: 'BODYCAM', id: null, name: null }],
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
  const [devices, setDevices] = useState<BodycamView[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [deviceError, setDeviceError] = useState(false)
  const [deviceAttempt, setDeviceAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoadingDevices(true)
    setDeviceError(false)
    getBodycams(0).then(result => {
      if (active) setDevices(result.data.filter(device => !device.deleted_at))
    }).catch(() => { if (active) setDeviceError(true) })
      .finally(() => { if (active) setLoadingDevices(false) })
    return () => { active = false }
  }, [deviceAttempt])
  const [mostrarMapa, setMostrarMapa] = useState(true) // Visibilidad del mapa (solo UI)
  const [mostrarSelectorCC, setMostrarSelectorCC] = useState(false) // Selector de personas en copia (solo UI)
  const [ccFiltro, setCcFiltro] = useState('') // Buscador del selector de copia (solo UI)

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

  const dniAutocompleteRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (initial) {
      setForm({ ...defaultState, ...(initial as Partial<IncidenciaForm>) })
      // Si estamos editando, establecer los searchTerms existentes
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
      if (k === 'dni' && f.dni !== v) Object.assign(newForm, serviceAssignment({}), { nombreCompleto: '', cargo: '', regLab: '', turno: '' })

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
    const selectedLead = leads.find(lead => String(lead.id) === leadId)
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
      ...(f.dni !== offender.dni ? serviceAssignment({}) : {}),
      service_start: f.dni === offender.dni && f.service_start ? f.service_start : offender.service_start ?? '',
      reported_name: offender.name || '',
      reported_lastname: offender.lastname || '',
      reported_dni: offender.dni || '',
      reported_job: offender.job || '',
      reported_regime: offender.regime || '',
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

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    // Validar campos obligatorios
    if (!form.dni) {
      toast.warning('El campo DNI/Nombre es obligatorio');
      return;
    }

    const identificationError = identityError(form)
    if (identificationError) { toast.warning(identificationError); return }

    // Si es numérico, debe tener 8 dígitos (DNI)
    if (/^\d+$/.test(form.dni) && form.dni.length !== 8) {
      toast.warning('El DNI debe tener exactamente 8 dígitos');
      return;
    }

    if (!form.asunto || !form.falta || !form.turno || !form.fechaIncidente || !form.horaIncidente || !form.jurisdiccion || !form.dirigidoA || !form.destinatario) {
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

    if (mostrarCamposBodycam && !medioCompleto) {
      toast.warning('Elige al menos un medio y selecciona el equipo de cada tipo marcado.')
      return
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

  const dniValido = /^\d{8}$/.test(form.dni)

  // ===== Presentacion =====

  const media = form.media ?? []
  function toggleMedium(cam: Cam) {
    setForm(previous => {
      const selected = previous.media ?? []
      return { ...previous, media: selected.some(m => m.cam === cam)
        ? selected.filter(m => m.cam !== cam)
        : [...selected, { cam, id: null, name: null }] }
    })
  }

  const medioCompleto = media.length > 0 && media.every(m => m.cam === 'PHONE' || !!m.id)
  const completo = {
    infractor: dniValido && !!form.nombreCompleto,
    hecho: !!(form.asunto && form.falta && form.fechaIncidente && form.horaIncidente),
    ubicacion: !!(form.jurisdiccion && form.ubicacion?.address),
    medio: medioCompleto,
    destinatarios: !!(form.dirigidoA && form.destinatario && (form.cc || []).length > 0),
  }

  const pasos: StepInfo[] = [
    { id: 'inc-infractor', title: 'Infractor', icon: <FiUser />, done: completo.infractor },
    { id: 'inc-hecho', title: 'El hecho', icon: <FiAlertTriangle />, done: completo.hecho },
    { id: 'inc-ubicacion', title: 'Ubicación', icon: <FiMapPin />, done: completo.ubicacion },
    ...(mostrarCamposBodycam ? [{ id: 'inc-medio', title: 'Medio', icon: <FiVideo />, done: completo.medio }] : []),
    { id: 'inc-destinatarios', title: 'Destinatarios', icon: <FiSend />, done: completo.destinatarios },
  ]
  const numero = (id: string) => pasos.findIndex(p => p.id === id) + 1
  const pasosHechos = pasos.filter(p => p.done).length
  const [pasoActivo, irAPaso] = useActiveStep(pasos.map(p => p.id))

  const hoyISO = new Date().toLocaleDateString('en-CA') // 'YYYY-MM-DD' en hora local

  /** Opciones del tipo de medio, mostradas como tarjetas seleccionables */
  const tiposMedio: { value: Cam; label: string; icon: React.ReactNode }[] = [
    { value: 'BODYCAM', label: 'Bodycam', icon: <FiVideo /> },
    { value: 'CAMERA', label: 'Cámara', icon: <FiCamera /> },
    { value: 'RADIO', label: 'Radio', icon: <FiRadio /> },
    { value: 'PHONE', label: 'Celular', icon: <FiSmartphone /> },
  ]

  // Personas para copia, filtradas por el buscador del selector
  const filtroCC = ccFiltro.trim().toLowerCase()
  const listaCCFiltrada = filtroCC
    ? listaCC.filter(lead => `${lead.name} ${lead.lastname} ${lead.job?.name || ''}`.toLowerCase().includes(filtroCC))
    : listaCC

  const cabecera = (
    <ModalHero
      icon={initial ? <FiEdit3 /> : <FiFilePlus />}
      eyebrow={initial ? 'Editar registro' : 'Registro de incidencia'}
      title={initial ? 'Editar incidencia' : 'Nueva incidencia'}
      subtitle="Completa cada paso. Los campos con * son obligatorios."
      onClose={onClose}
    >
      <HeroProgress done={pasosHechos} total={pasos.length} />
    </ModalHero>
  )

  const pie = (
    <>
      <p className="m-0 mr-auto flex items-center gap-2 text-xs text-muted max-sm:hidden">
        {pasosHechos === pasos.length ? (
          <>
            <FiCheckCircle className="shrink-0 text-success" aria-hidden />
            Todo listo para guardar.
          </>
        ) : (
          <>
            <FiInfo className="shrink-0" aria-hidden />
            {pasos.length - pasosHechos === 1 ? 'Falta 1 paso por completar.' : `Faltan ${pasos.length - pasosHechos} pasos por completar.`}
          </>
        )}
      </p>
      <Button variant="ghost" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" form="form-incidencia" icon={initial ? <FiSave /> : <FiPlus />}>
        {initial ? 'Actualizar incidencia' : 'Crear incidencia'}
      </Button>
    </>
  )

  /** Avisos de carga / sin resultados de los buscadores */
  const sinResultados = (texto: string) => (
    <div className={autocompleteNoResults}>
      <span className="flex items-center gap-2">
        <FiSearch aria-hidden /> {texto}
      </span>
    </div>
  )
  const buscando = (
    <div className={autocompleteLoading}>
      <span className="flex items-center gap-2">
        <FiLoader className="animate-spin" aria-hidden /> Buscando…
      </span>
    </div>
  )

  return (
    <Modal
      title={initial ? 'Editar incidencia' : 'Nueva incidencia'}
      header={cabecera}
      onClose={onClose}
      size="xl"
      footer={pie}
      bodyClassName="bg-page p-0! gap-0!"
    >
      <form id="form-incidencia" onSubmit={handleSubmit} noValidate className="flex-1">
        <StepLayout
          steps={pasos}
          active={pasoActivo}
          onSelect={irAPaso}
          aside={
            <div className="rounded-xl bg-subtle p-3 text-xs leading-relaxed text-content-2">
              <p className="m-0 flex items-center gap-1.5 font-semibold text-content">
                <FiInfo className="shrink-0 text-accent" aria-hidden />
                Consejo
              </p>
              <p className="m-0 mt-1">
                Empieza por el DNI: el nombre, cargo, turno y régimen se completan solos.
              </p>
            </div>
          }
        >
          {/* Infractor */}
          <StepSection
            id="inc-infractor"
            n={numero('inc-infractor')}
            title="Infractor"
            icon={<FiUser />}
            description="Busca a la persona por su DNI."
            done={completo.infractor}
          >
            <div className={autocompleteContainer} ref={dniAutocompleteRef}>
              <Field label="DNI del infractor" required hint="8 dígitos; al elegirlo de la lista se completan los demás datos.">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
                  <Input
                    value={dniSearchTerm}
                    onChange={handleDNIChange}
                    onFocus={() => offenderResults.length > 0 && setShowOffenderSuggestions(true)}
                    placeholder="Ej.: 45678912"
                    autoComplete="off"
                    inputMode="numeric"
                    className="pl-9 text-[15px] tracking-[0.06em] tabular-nums"
                  />
                </div>
              </Field>
              {offenderLoading && buscando}
              {offenderError && <div className={autocompleteError}>{offenderError}</div>}
              {showOffenderSuggestions && offendersHabilitados.length > 0 && (
                <div className={autocompleteSuggestions}>
                  {offendersHabilitados.map((offender, index) => {
                    const nombre = `${offender.name || ''} ${offender.lastname || ''}`.trim()
                    return (
                      <div
                        key={offender.gestionate_id || offender.id || index}
                        className={cn(autocompleteItem, 'flex items-center gap-3')}
                        onClick={() => handleOffenderSelect(offender)}
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ background: colorAvatar(offender.dni || nombre) }}
                          aria-hidden
                        >
                          {iniciales(nombre, offender.dni)}
                        </span>
                        <div className="min-w-0">
                          <div className={cn(autocompleteItemCode, 'truncate')}>
                            {nombre || 'Sin nombre'} <span className="font-normal text-muted">· DNI {offender.dni}</span>
                          </div>
                          <div className={cn(autocompleteItemDetails, 'truncate')}>
                            {[offender.job, offender.shift, offender.regime].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {showOffenderSuggestions && offenderResults.length === 0 && dniSearchTerm.length >= 3 && !offenderLoading &&
                sinResultados('No se encontraron registros')}
            </div>

            {dniValido && form.nombreCompleto ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Revisa los datos de la persona seleccionada. Las correcciones se guardan en este informe.</p>
                <ServiceAssignmentFields value={form} onChange={setField} />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-sm text-muted">
                <FiUser className="shrink-0 text-lg" aria-hidden />
                {dniValido ? 'Elige a la persona de la lista para completar sus datos.' : 'Los datos de la persona aparecerán aquí al ingresar el DNI.'}
              </div>
            )}
          </StepSection>

          {/* El hecho */}
          <StepSection
            id="inc-hecho"
            n={numero('inc-hecho')}
            title="El hecho"
            icon={<FiAlertTriangle />}
            description="Qué falta se cometió y cuándo ocurrió."
            done={completo.hecho}
          >
            <Field label="Asunto" required error={subjectsError ? 'Error al cargar asuntos desde el servidor.' : undefined}>
              <Dropdown
                aria-label="Asunto"
                value={form.asunto}
                onChange={v => setField('asunto', v)}
                loading={subjectsLoading}
                invalid={!!subjectsError}
                placeholder="Selecciona el asunto"
                searchable
                options={Object.keys(subjectMap).map(nombre => ({
                  value: nombre,
                  label: nombreCorto(nombre),
                  description: nombreCorto(nombre) !== nombre ? nombre : undefined,
                  color: ASUNTOS[nombre]?.color ?? 'var(--accent-light)',
                }))}
              />
            </Field>

            <Field label="Falta" required>
              <Dropdown
                aria-label="Falta"
                value={form.falta}
                onChange={v => setField('falta', v)}
                disabled={!form.asunto}
                placeholder={form.asunto ? 'Selecciona la falta' : 'Primero elige el asunto'}
                emptyText="Este asunto no tiene faltas"
                options={lacksDisponibles.map(lack => ({ value: lack.name, label: lack.name }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4 max-[420px]:grid-cols-1">
              <Field label="Fecha del hecho" required>
                <DatePicker
                  aria-label="Fecha del hecho"
                  value={form.fechaIncidente}
                  onChange={v => setField('fechaIncidente', v)}
                  max={hoyISO}
                />
              </Field>
              <Field label="Hora del hecho" required>
                <TimePicker aria-label="Hora del hecho" value={form.horaIncidente} onChange={v => setField('horaIncidente', v)} />
              </Field>
            </div>

            {mostrarCamposInasistencia && (
              <p className="m-0 flex items-start gap-2 rounded-xl bg-primary/6 px-3.5 py-2.5 text-[13px] text-content-2 dark:bg-primary/15">
                <FiInfo className="mt-0.5 shrink-0 text-accent" aria-hidden />
                En las inasistencias no se registra el medio: el reporte es la evidencia.
              </p>
            )}
          </StepSection>

          {/* Ubicación */}
          <StepSection
            id="inc-ubicacion"
            n={numero('inc-ubicacion')}
            title="Ubicación"
            icon={<FiMapPin />}
            description="Marca el punto en el mapa; la jurisdicción se sugiere sola."
            done={completo.ubicacion}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-content-2">
                  Punto en el mapa<span className="ml-0.5 text-danger">*</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={mostrarMapa ? <FiChevronUp /> : <FiMapPin />}
                  onClick={() => setMostrarMapa(v => !v)}
                  aria-expanded={mostrarMapa}
                >
                  {mostrarMapa ? 'Ocultar mapa' : 'Mostrar mapa'}
                </Button>
              </div>
              {!mostrarMapa && form.ubicacion?.address && (
                <p className="m-0 flex items-start gap-2 rounded-xl bg-subtle px-3.5 py-2.5 text-sm text-content">
                  <FiMapPin className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  {form.ubicacion.address}
                </p>
              )}
              {mostrarMapa && (
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
                          .replace(/[̀-ͯ]/g, '') // Quitar tildes
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
              )}
            </div>

            <Field label="Jurisdicción" required hint="Se sugiere según el punto del mapa. Puedes cambiarla.">
              {jurisdictionsLoading ? (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <FiLoader className="animate-spin" aria-hidden /> Cargando jurisdicciones…
                </span>
              ) : jurisdictionsError ? (
                <span className="block text-sm text-danger">{jurisdictionsError}</span>
              ) : (
                <Dropdown
                  aria-label="Jurisdicción"
                  value={form.jurisdiccion}
                  onChange={nombre => {
                    const selectedJurisdiction = jurisdictions.find(j => j.name === nombre)
                    setForm(f => ({
                      ...f,
                      jurisdiccion: selectedJurisdiction?.name ?? '',
                      jurisdictionId: selectedJurisdiction?.id ?? null
                    }))
                  }}
                  placeholder="Selecciona una jurisdicción"
                  icon={<FiMapPin />}
                  searchable
                  options={jurisdiccionesHabilitadas.map(j => ({ value: j.name, label: j.name }))}
                />
              )}
            </Field>
          </StepSection>

          {/* Medio (solo cuando no es inasistencia) */}
          {mostrarCamposBodycam && (
            <StepSection
              id="inc-medio"
              n={numero('inc-medio')}
              title="Medio"
              icon={<FiVideo />}
              description="Selecciona todos los medios con los que se registró el hecho."
              done={completo.medio}
            >
              <div role="group" aria-label="Medios utilizados" className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                {tiposMedio.map(t => {
                  const activo = media.some(m => m.cam === t.value)
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => toggleMedium(t.value)}
                      className={cn(
                        'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-[13px] font-semibold transition-colors duration-150',
                        activo
                          ? 'border-primary bg-primary/8 text-primary dark:border-accent dark:bg-primary/20 dark:text-accent-light'
                          : 'border-line bg-surface text-content-2 hover:border-line-hover hover:bg-subtle'
                      )}
                    >
                      <span className="text-xl" aria-hidden>
                        {t.icon}
                      </span>
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {media.filter(m => m.cam !== 'PHONE').map(m => {
                const label = tiposMedio.find(t => t.value === m.cam)!.label
                const options = devices.filter(d => d.cam === m.cam).map(d => ({
                  value: d.id, label: d.name, description: d.serie ?? undefined,
                }))
                return <Field key={m.cam} label={'N.º de ' + label.toLowerCase()} required>
                  <Dropdown aria-label={'Seleccionar ' + label} value={m.id ?? ''} options={options}
                    loading={loadingDevices} searchable placeholder={'Seleccionar ' + label}
                    onChange={id => setField('media', media.map(item => item.cam === m.cam
                      ? { ...item, id, name: options.find(d => d.value === id)?.label ?? null } : item))} />
                </Field>
              })}
              {deviceError && media.some(m => m.cam !== 'PHONE') && <p role="alert">
                No se pudo cargar el catálogo de equipos. <button type="button" onClick={() => setDeviceAttempt(n => n + 1)}>Reintentar</button>
              </p>}
              {media.some(m => m.cam === 'BODYCAM') && <Field label="Bodycam asignada a">
                <Input readOnly value={form.bodycamAsignadaA} placeholder="Se completa con el DNI" />
              </Field>}
            </StepSection>
          )}

          {/* Destinatarios */}
          <StepSection
            id="inc-destinatarios"
            n={numero('inc-destinatarios')}
            title="Destinatarios"
            icon={<FiSend />}
            description="A quién se dirige el informe y quién recibe copia."
            done={completo.destinatarios}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Dirigido a" required>
                {jobsLoading ? (
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <FiLoader className="animate-spin" aria-hidden /> Cargando cargos…
                  </span>
                ) : jobsError ? (
                  <span className="block text-sm text-danger">{jobsError}</span>
                ) : (
                  <Dropdown
                    aria-label="Dirigido a"
                    value={form.dirigidoA}
                    onChange={nombre => {
                      const selectedJob = jobs.find(job => job.name === nombre)
                      if (selectedJob) {
                        handleJobChange(selectedJob.id, selectedJob.name)
                      } else {
                        handleJobChange(null, '')
                      }
                    }}
                    placeholder="Selecciona el cargo"
                    icon={<FiBriefcase />}
                    options={jobsHabilitados.map(job => ({ value: job.name, label: job.name }))}
                  />
                )}
              </Field>

              <Field label="Persona" required>
                {leadsLoading ? (
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <FiLoader className="animate-spin" aria-hidden /> Cargando personas…
                  </span>
                ) : leadsError ? (
                  <span className="block text-sm text-danger">{leadsError}</span>
                ) : (
                  <Dropdown
                    aria-label="Persona"
                    value={selectedLeadId}
                    onChange={handleLeadChange}
                    disabled={!form.dirigidoA}
                    placeholder={form.dirigidoA ? 'Selecciona la persona' : 'Primero elige el cargo'}
                    emptyText="No hay personas con este cargo"
                    icon={<FiUser />}
                    options={leadsHabilitados.map(lead => ({
                      value: String(lead.id),
                      label: `${lead.name} ${lead.lastname}`.trim(),
                      description: lead.job?.name,
                    }))}
                  />
                )}
              </Field>
            </div>

            {/* Con copia (obligatorio: al menos 1 persona) */}
            {form.conCopia && (
              <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-subtle p-4 max-sm:p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-semibold text-content">
                      Con copia a<span className="ml-0.5 text-danger">*</span>
                    </span>
                    <p className="m-0 text-xs text-muted">Al menos 1 persona recibe copia del reporte.</p>
                  </div>
                  <Button
                    variant={mostrarSelectorCC ? 'ghost' : 'secondary'}
                    size="sm"
                    icon={mostrarSelectorCC ? <FiChevronUp /> : <FiUserPlus />}
                    onClick={() => setMostrarSelectorCC(v => !v)}
                    aria-expanded={mostrarSelectorCC}
                  >
                    {mostrarSelectorCC ? 'Listo' : 'Agregar'}
                  </Button>
                </div>

                {(form.cc || []).length === 0 ? (
                  <p className="m-0 text-sm text-muted">Aún no hay personas en copia.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {(form.cc || []).map(nombre => (
                      <li
                        key={nombre}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface py-1 pr-1 pl-1 text-[13px] font-medium text-content ring-1 ring-line"
                      >
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: colorAvatar(nombre) }}
                          aria-hidden
                        >
                          {iniciales(nombre)}
                        </span>
                        <span className="truncate">{nombre}</span>
                        <button
                          type="button"
                          aria-label={`Quitar a ${nombre}`}
                          title="Quitar"
                          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          onClick={() => setForm(f => ({ ...f, cc: (f.cc || []).filter(p => p !== nombre) }))}
                        >
                          <FiX aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {mostrarSelectorCC && (
                  <div className="flex flex-col gap-2 rounded-xl border border-line-strong bg-surface p-2">
                    <div className="relative">
                      <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
                      <Input
                        value={ccFiltro}
                        onChange={e => setCcFiltro(e.target.value)}
                        placeholder="Buscar por nombre o cargo"
                        aria-label="Buscar personas para copia"
                        className="pl-9"
                      />
                    </div>
                    <div className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
                      {allLeadsLoading ? (
                        <span className="flex items-center justify-center gap-2 p-3 text-sm text-muted">
                          <FiLoader className="animate-spin" aria-hidden /> Cargando personas…
                        </span>
                      ) : allLeadsError ? (
                        <span className="block p-3 text-center text-sm text-danger">{allLeadsError}</span>
                      ) : listaCCFiltrada.length === 0 ? (
                        <span className="block p-3 text-center text-sm text-muted">
                          {filtroCC ? 'Nadie coincide con la búsqueda' : 'No hay otras personas disponibles'}
                        </span>
                      ) : (
                        listaCCFiltrada.map(lead => {
                          const nombreCompleto = `${lead.name} ${lead.lastname}`.trim()
                          const marcado = (form.cc || []).includes(nombreCompleto)
                          return (
                            <label
                              key={lead.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150',
                                marcado ? 'bg-primary/8 dark:bg-primary/20' : 'hover:bg-subtle'
                              )}
                            >
                              <input
                                type="checkbox"
                                className="size-4 shrink-0 cursor-pointer accent-primary"
                                checked={marcado}
                                onChange={() => toggleCC(lead.id)}
                              />
                              <span
                                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                style={{ background: colorAvatar(nombreCompleto) }}
                                aria-hidden
                              >
                                {iniciales(nombreCompleto)}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-content">{nombreCompleto}</span>
                                <span className="block truncate text-xs text-muted">{lead.job?.name || 'Sin cargo'}</span>
                              </span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </StepSection>
        </StepLayout>
      </form>
    </Modal>
  )
}
