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
  const [mostrarMapa, setMostrarMapa] = useState(true) // Visibilidad del mapa (solo UI)
  const [mostrarSelectorCC, setMostrarSelectorCC] = useState(false) // Selector de personas en copia (solo UI)
  const [ccFiltro, setCcFiltro] = useState('') // Buscador del selector de copia (solo UI)

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

  const dniValido = /^\d{8}$/.test(form.dni)

  // ===== Presentacion =====

  /** Cambia el tipo de medio: ajusta el filtro de busqueda y limpia los campos de los otros tipos */
  function cambiarTipoMedio(nuevoTipo: string) {
    if (nuevoTipo === form.tipoMedio) return

    // Actualizar el tipo de cámara para el filtro de búsqueda primero
    if (nuevoTipo === 'camara') {
      setCamType('CAMERA')
    } else if (nuevoTipo === 'radio') {
      setCamType('RADIO')
    } else if (nuevoTipo !== 'Phone') {
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
  }

  // Pasos completos: alimentan el indice y la barra de progreso de la cabecera
  const medioCompleto =
    form.tipoMedio === 'bodycam'
      ? !!(form.bodycamNumber && form.bodycamAsignadaA && form.bodycamId)
      : form.tipoMedio === 'camara'
        ? !!(form.numeroCamara && form.bodycamId)
        : form.tipoMedio === 'radio'
          ? !!(form.numeroRadio && form.bodycamId)
          : true
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
  const tiposMedio: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'bodycam', label: 'Bodycam', icon: <FiVideo /> },
    { value: 'camara', label: 'Cámara', icon: <FiCamera /> },
    { value: 'radio', label: 'Radio', icon: <FiRadio /> },
    { value: 'Phone', label: 'Celular', icon: <FiSmartphone /> },
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
              <div className="flex items-center gap-4 rounded-xl border border-line bg-subtle p-4 max-sm:items-start max-sm:p-3">
                <span
                  className="flex size-13 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm max-sm:size-11 max-sm:text-base"
                  style={{ background: colorAvatar(form.dni || form.nombreCompleto) }}
                  aria-hidden
                >
                  {iniciales(form.nombreCompleto, form.dni)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[15px] font-bold text-content" title={form.nombreCompleto}>
                    {form.nombreCompleto}
                  </p>
                  <p className="m-0 text-xs text-muted tabular-nums">DNI {form.dni}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      { label: 'Turno', value: form.turno },
                      { label: 'Cargo', value: form.cargo },
                      { label: 'Régimen', value: form.regLab },
                    ].map(d => (
                      <span key={d.label} className="inline-flex max-w-full items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-xs ring-1 ring-line">
                        <span className="text-muted">{d.label}:</span>
                        <span className="truncate font-semibold text-content">{d.value || '—'}</span>
                      </span>
                    ))}
                  </div>
                </div>
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
              description="Con qué se registró el hecho."
              done={completo.medio}
            >
              <div role="radiogroup" aria-label="Tipo de medio" className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                {tiposMedio.map(t => {
                  const activo = form.tipoMedio === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      onClick={() => cambiarTipoMedio(t.value)}
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

              {/* Campos de Bodycam */}
              {form.tipoMedio === 'bodycam' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                    <Field label="N.º de bodycam" required>
                      <Input
                        value={bodycamSearchTerm}
                        onChange={handleBodycamInputChange}
                        onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                        placeholder="Ej.: SG004 o FISCA004"
                        autoComplete="off"
                      />
                    </Field>
                    {bodycamLoading && buscando}
                    {bodycamError && <div className={autocompleteError}>{bodycamError}</div>}
                    {showBodycamSuggestions && bodycamsHabilitadas.length > 0 && (
                      <div className={autocompleteSuggestions}>
                        {bodycamsHabilitadas.map((bodycam, index) => (
                          <div key={bodycam.id || index} className={autocompleteItem} onClick={() => handleBodycamSelect(bodycam)}>
                            <div className={autocompleteItemCode}>{bodycam.name || bodycam.id}</div>
                            {(bodycam.asignadoA || bodycam.asignado || bodycam.usuario) && (
                              <div className={autocompleteItemDetails}>{bodycam.asignadoA || bodycam.asignado || bodycam.usuario}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {showBodycamSuggestions && bodycamResults.length === 0 && bodycamSearchTerm.length >= 2 && !bodycamLoading &&
                      sinResultados('No se encontraron bodycams')}
                  </div>

                  <Field label="Bodycam asignada a" required>
                    <Input
                      value={form.bodycamAsignadaA}
                      onChange={e => setField('bodycamAsignadaA', e.target.value)}
                      placeholder="Se completa con el DNI"
                    />
                  </Field>
                </div>
              )}

              {/* Campos de Cámara */}
              {form.tipoMedio === 'camara' && (
                <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                  <Field label="N.º de cámara" required>
                    <Input
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Ej.: 104A"
                      autoComplete="off"
                    />
                  </Field>
                  {bodycamLoading && buscando}
                  {bodycamError && <div className={autocompleteError}>{bodycamError}</div>}
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
                          <div className={autocompleteItemCode}>{camera.name}</div>
                          {camera.serie && <div className={autocompleteItemDetails}>Serie: {camera.serie}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Campos de Radio */}
              {form.tipoMedio === 'radio' && (
                <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                  <Field label="N.º de radio" required>
                    <Input
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Ej.: 22110"
                      autoComplete="off"
                    />
                  </Field>
                  {bodycamLoading && buscando}
                  {bodycamError && <div className={autocompleteError}>{bodycamError}</div>}
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
                          <div className={autocompleteItemCode}>{radio.name}</div>
                          {radio.serie && <div className={autocompleteItemDetails}>Serie: {radio.serie}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(form.tipoMedio as string) === 'Phone' && (
                <p className="m-0 flex items-start gap-2 rounded-xl bg-subtle px-3.5 py-2.5 text-[13px] text-content-2">
                  <FiInfo className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  Para celular no se necesitan más datos.
                </p>
              )}
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
