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
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { Field, Input, Select } from '@/components/UI/Field'
import { FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi'
import { toast } from '../utils/toast'
import {
  actionBtnDanger,
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

/** Bloque de solo lectura con los datos que se completan con el DNI */
const autoBlock = 'grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-subtle p-4 max-md:grid-cols-1'

/** Fila de cada persona en copia (CC) */
const ccRow = 'flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2'

/** Selector de personas para copia, desplegado bajo la lista */
const ccPicker =
  'flex max-h-[240px] flex-col gap-0.5 overflow-y-auto rounded-lg border border-line-strong bg-surface p-1.5'

/** Fila del selector de copia */
const checkboxLabel =
  'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm text-content-2 transition-colors duration-150 hover:bg-subtle'

/** Casilla del selector de copia */
const checkboxInput = 'size-4 cursor-pointer accent-primary'

/** Par etiqueta / valor dentro del bloque de datos automáticos */
function DatoAuto({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="break-words text-sm text-content">{value || '—'}</span>
    </div>
  )
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

  const dniValido = /^\d{8}$/.test(form.dni)

  return (
    <Modal
      title={initial ? 'Editar incidencia' : 'Nueva incidencia'}
      description="Los campos con * son obligatorios."
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-incidencia">
            {initial ? 'Actualizar incidencia' : 'Crear incidencia'}
          </Button>
        </>
      }
    >
      <form id="form-incidencia" className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Infractor */}
        <section className="flex flex-col gap-4">
          <h4 className="m-0 text-[13px] font-semibold text-content">Infractor</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div className={cn(autocompleteContainer, 'col-span-2')} ref={dniAutocompleteRef}>
              <Field label="DNI del infractor" required hint="8 dígitos; al ingresarlo se completan los demás datos">
                <Input
                  value={dniSearchTerm}
                  onChange={handleDNIChange}
                  onFocus={() => offenderResults.length > 0 && setShowOffenderSuggestions(true)}
                  placeholder="Ingresa 8 dígitos del DNI"
                  autoComplete="off"
                  inputMode="numeric"
                />
              </Field>
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

            {dniValido ? (
              <div className={cn(autoBlock, 'col-span-2')}>
                <DatoAuto label="Nombre" value={form.nombreCompleto} />
                <DatoAuto label="Turno" value={form.turno} />
                <DatoAuto label="Cargo" value={form.cargo} />
                <DatoAuto label="Régimen laboral" value={form.regLab} />
              </div>
            ) : (
              <p className="col-span-2 m-0 text-sm text-muted">Se completará al ingresar el DNI</p>
            )}
          </div>
        </section>

        {/* El hecho */}
        <section className="flex flex-col gap-4 border-t border-line pt-5">
          <h4 className="m-0 text-[13px] font-semibold text-content">El hecho</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field
              label="Asunto"
              required
              className="col-span-2"
              error={subjectsError ? 'Error al cargar asuntos desde el servidor.' : undefined}
            >
              <Select
                value={form.asunto}
                onChange={e => setField('asunto', e.target.value)}
                disabled={subjectsLoading}
                invalid={!!subjectsError}
              >
                <option value="">{subjectsLoading ? 'Cargando asuntos...' : 'Selecciona'}</option>
                {Object.keys(subjectMap).map((asuntoName) => (
                  <option key={subjectMap[asuntoName].id} value={asuntoName}>{asuntoName}</option>
                ))}
              </Select>
            </Field>

            {form.asunto && (
              <Field label="Falta" required className="col-span-2">
                <Select value={form.falta} onChange={e => setField('falta', e.target.value)}>
                  <option value="">Selecciona</option>
                  {lacksDisponibles.map(lack => (
                    <option key={lack.id} value={lack.name}>{lack.name}</option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label="Fecha del hecho" required>
              <Input
                type="date"
                value={form.fechaIncidente}
                onChange={e => setField('fechaIncidente', e.target.value)}
              />
            </Field>
            <Field label="Hora del hecho" required>
              <Input
                type="time"
                value={form.horaIncidente}
                onChange={e => setField('horaIncidente', e.target.value)}
              />
            </Field>

            <Field
              label="Jurisdicción"
              required
              className="col-span-2"
              hint="Se sugiere según la ubicación en el mapa. Puedes cambiarla."
            >
              {jurisdictionsLoading ? (
                <span className="block text-sm text-muted">Cargando jurisdicciones...</span>
              ) : jurisdictionsError ? (
                <span className="block text-sm text-danger">{jurisdictionsError}</span>
              ) : (
                <Select
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
                </Select>
              )}
            </Field>

            <div className="col-span-2 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-content-2">
                  Ubicación del infractor<span className="ml-0.5 text-danger">*</span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FiMapPin />}
                  onClick={() => setMostrarMapa(v => !v)}
                  aria-expanded={mostrarMapa}
                >
                  {mostrarMapa ? 'Ocultar mapa' : 'Seleccionar en el mapa'}
                </Button>
              </div>
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
          </div>
        </section>

        {/* Medio (solo cuando no es inasistencia) */}
        {mostrarCamposBodycam && (
          <section className="flex flex-col gap-4 border-t border-line pt-5">
            <h4 className="m-0 text-[13px] font-semibold text-content">Medio</h4>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <Field label="Tipo de medio" required>
                <Select
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
                </Select>
              </Field>

              {/* Campos de Bodycam */}
              {form.tipoMedio === 'bodycam' && (
                <>
                  <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                    <Field label="N.º de bodycam" required>
                      <Input
                        value={bodycamSearchTerm}
                        onChange={handleBodycamInputChange}
                        onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                        placeholder="Escribe para buscar bodycam (ej: SG004 o FISCA004)"
                        autoComplete="off"
                      />
                    </Field>
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

                  <Field label="Bodycam asignada a" required className="col-span-2">
                    <Input
                      value={form.bodycamAsignadaA}
                      onChange={e => setField('bodycamAsignadaA', e.target.value)}
                      placeholder="Se llenará automáticamente al seleccionar DNI"
                    />
                  </Field>
                </>
              )}

              {/* Campos de Cámara */}
              {form.tipoMedio === 'camara' && (
                <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                  <Field label="N.º de cámara" required>
                    <Input
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar cámara (ej: 104A)"
                      autoComplete="off"
                    />
                  </Field>
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
              )}

              {/* Campos de Radio */}
              {form.tipoMedio === 'radio' && (
                <div className={autocompleteContainer} ref={bodycamAutocompleteRef}>
                  <Field label="N.º de radio" required>
                    <Input
                      value={bodycamSearchTerm}
                      onChange={handleBodycamInputChange}
                      onFocus={() => bodycamResults.length > 0 && setShowBodycamSuggestions(true)}
                      placeholder="Escribe para buscar radio (ej: 22110)"
                      autoComplete="off"
                    />
                  </Field>
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
              )}
            </div>
          </section>
        )}

        {/* Destinatarios */}
        <section className="flex flex-col gap-4 border-t border-line pt-5">
          <h4 className="m-0 text-[13px] font-semibold text-content">Destinatarios</h4>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Dirigido a" required>
              {jobsLoading ? (
                <span className="block text-sm text-muted">Cargando cargos...</span>
              ) : jobsError ? (
                <span className="block text-sm text-danger">{jobsError}</span>
              ) : (
                <Select
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
                </Select>
              )}
            </Field>

            {form.dirigidoA && (
              <Field label="Persona" required>
                {leadsLoading ? (
                  <span className="block text-sm text-muted">Cargando personas...</span>
                ) : leadsError ? (
                  <span className="block text-sm text-danger">{leadsError}</span>
                ) : (
                  <Select
                    value={selectedLeadId}
                    onChange={e => handleLeadChange(e.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {leadsHabilitados.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} {lead.lastname}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </div>

          {/* Con copia (obligatorio: al menos 1 persona) */}
          {form.conCopia && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-content-2">
                  Con copia a<span className="ml-0.5 text-danger">*</span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FiPlus />}
                  onClick={() => setMostrarSelectorCC(v => !v)}
                  aria-expanded={mostrarSelectorCC}
                >
                  Agregar destinatario
                </Button>
              </div>
              <p className="m-0 text-xs text-muted">Selecciona al menos 1 persona para enviar copia del reporte.</p>

              {(form.cc || []).length === 0 && (
                <p className="m-0 text-sm text-muted">Aún no hay personas en copia.</p>
              )}
              {(form.cc || []).map(nombre => (
                <div key={nombre} className={ccRow}>
                  <span className="min-w-0 break-words text-sm text-content">{nombre}</span>
                  <button
                    type="button"
                    aria-label="Quitar destinatario"
                    title="Quitar destinatario"
                    className={actionBtnDanger}
                    onClick={() => setForm(f => ({ ...f, cc: (f.cc || []).filter(p => p !== nombre) }))}
                  >
                    <FiTrash2 aria-hidden />
                  </button>
                </div>
              ))}

              {mostrarSelectorCC && (
                <div className={ccPicker}>
                  {allLeadsLoading ? (
                    <span className="block p-3 text-center text-sm text-muted">Cargando personas...</span>
                  ) : allLeadsError ? (
                    <span className="block p-3 text-center text-sm text-danger">{allLeadsError}</span>
                  ) : (
                    <>
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
                            <span>{nombreCompleto} - {lead.job?.name || 'Sin cargo'}</span>
                          </label>
                        )
                      })}
                      {listaCC.length === 0 && !allLeadsLoading && (
                        <span className="block p-3 text-center text-sm text-muted">No hay otras personas disponibles</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </form>
    </Modal>
  )
}
