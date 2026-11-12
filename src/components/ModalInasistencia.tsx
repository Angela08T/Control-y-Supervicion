import React, { useState, useEffect, useRef, useMemo } from 'react'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useSubjects from '../hooks/Subject/useSubjects'
import useJurisdictions from '../hooks/Jurisdiction/useJurisdictions'
import AlertModal from './AlertModal'
import Modal from '@/components/UI/Modal'
import Button from '@/components/UI/Button'
import { Field, Input } from '@/components/UI/Field'
import Dropdown from '@/components/UI/Dropdown'
import { HeroProgress, ModalHero, StepSection } from '@/components/UI/FormSteps'
import { ASUNTOS, nombreCorto } from '@/pages/Dashboard/asuntos'
import { colorAvatar, iniciales } from '@/utils/incidenciaFormat'
import { FiCalendar, FiCheckCircle, FiInfo, FiLoader, FiMapPin, FiPlus, FiSearch, FiTag, FiUser, FiUserX } from 'react-icons/fi'
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
import type { ID, ISODateString, Jurisdiction, Lead, OffenderDniLookup, SubjectLack } from '@/types'

/** Datos del formulario de inasistencia */
export interface InasistenciaForm {
  dni: string
  nombreCompleto: string
  asunto: string
  falta: string
  turno: string
  cargo: string
  regLab: string
  jurisdiccion: string
  jurisdictionId: ID | null
  subjectId: ID | null
  lackId: ID | null
}

/** Infractor mostrado en las sugerencias (el resultado del hook puede traer id y deleted_at) */
type OffenderSuggestion = OffenderDniLookup & {
  id?: ID
  deleted_at?: ISODateString | null
}

/** Mapa de asuntos por nombre con su id y sus faltas */
type SubjectMap = Record<string, { id: ID; lacks: SubjectLack[] }>

/** Estado del modal de alerta */
interface AlertState {
  isOpen: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'info'
}

export interface ModalInasistenciaProps {
  onClose: () => void
  onSave?: (form: InasistenciaForm, leads: Lead[]) => void
}

const defaultState: InasistenciaForm = {
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

export default function ModalInasistencia({ onClose, onSave }: ModalInasistenciaProps) {
  const [form, setForm] = useState<InasistenciaForm>(defaultState)
  const [alertModal, setAlertModal] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'error' })

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
  const subjectMap = useMemo<SubjectMap>(() => {
    const map: SubjectMap = {}

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
  const lacksInasistencia = useMemo<SubjectLack[]>(() => {
    // Buscar en todos los subjects las faltas que contengan "Inasistencia"
    let inasistencias: SubjectLack[] = []

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
  const jurisdiccionesHabilitadas = useMemo<Jurisdiction[]>(() => {
    if (!jurisdictions || jurisdictions.length === 0) return []
    return jurisdictions.filter(jurisdiction => !jurisdiction.deleted_at)
  }, [jurisdictions])

  // Filtrar solo offenders habilitados
  const offendersHabilitados = useMemo<OffenderSuggestion[]>(() => {
    if (!offenderResults || offenderResults.length === 0) return []
    return (offenderResults as OffenderSuggestion[]).filter(offender => !offender.deleted_at)
  }, [offenderResults])

  const dniAutocompleteRef = useRef<HTMLDivElement | null>(null)

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

  function setField(k: keyof InasistenciaForm, v: string) {
    setForm(f => {
      const newForm: InasistenciaForm = { ...f, [k]: v }

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


  function handleDNIChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setDniSearchTerm(value)
    setField('dni', value)
  }

  function handleOffenderSelect(offender: OffenderSuggestion) {
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

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
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

  // Pasos completos (barra de progreso de la cabecera)
  const dniValido = /^\d{8}$/.test(form.dni)
  const personaCompleta = dniValido && !!form.nombreCompleto && !!form.turno && !!form.cargo && !!form.regLab
  const jurisdiccionCompleta = !!form.jurisdictionId
  const pasosHechos = Number(personaCompleta) + Number(jurisdiccionCompleta)
  const colorAsunto = ASUNTOS[form.asunto]?.color ?? 'var(--primary)'

  return (
    <>
      <Modal
        title="Nueva inasistencia"
        header={
          <ModalHero
            icon={<FiUserX />}
            eyebrow="Registro de inasistencia"
            title="Nueva inasistencia"
            subtitle="Busca a la persona por DNI; turno, cargo y régimen se completan solos."
            onClose={onClose}
          >
            <HeroProgress done={pasosHechos} total={2} />
          </ModalHero>
        }
        onClose={onClose}
        size="lg"
        bodyClassName="bg-page"
        footer={
          <>
            <p className="m-0 mr-auto flex items-center gap-2 text-xs text-muted max-sm:hidden">
              {pasosHechos === 2 ? (
                <>
                  <FiCheckCircle className="shrink-0 text-success" aria-hidden />
                  Todo listo para guardar.
                </>
              ) : (
                <>
                  <FiInfo className="shrink-0" aria-hidden />
                  Luego marca los días en el calendario.
                </>
              )}
            </p>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="form-inasistencia" icon={<FiPlus />}>
              Crear inasistencia
            </Button>
          </>
        }
      >
        <form id="form-inasistencia" onSubmit={handleSubmit} className="flex flex-col gap-4 max-sm:gap-3">
          <StepSection
            id="inas-persona"
            n={1}
            title="Personal"
            icon={<FiUser />}
            description="La persona que faltó al servicio."
            done={personaCompleta}
          >
            <div className={autocompleteContainer} ref={dniAutocompleteRef}>
              <Field label="DNI" required hint="8 dígitos; elige a la persona de la lista.">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
                  <Input
                    value={dniSearchTerm}
                    onChange={handleDNIChange}
                    onFocus={() => offenderResults.length > 0 && setShowOffenderSuggestions(true)}
                    placeholder="Ej.: 45678912"
                    maxLength={8}
                    inputMode="numeric"
                    autoComplete="off"
                    className="pl-9 text-[15px] tracking-[0.06em] tabular-nums"
                  />
                </div>
              </Field>
              {offenderLoading && (
                <div className={autocompleteLoading}>
                  <span className="flex items-center gap-2">
                    <FiLoader className="animate-spin" aria-hidden /> Buscando…
                  </span>
                </div>
              )}
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
              {showOffenderSuggestions && offenderResults.length === 0 && dniSearchTerm.length >= 3 && !offenderLoading && (
                <div className={autocompleteNoResults}>
                  <span className="flex items-center gap-2">
                    <FiSearch aria-hidden /> No se encontraron registros
                  </span>
                </div>
              )}
            </div>

            {form.nombreCompleto ? (
              <div className="flex items-center gap-4 rounded-xl border border-line bg-subtle p-4 max-sm:items-start max-sm:p-3">
                <span
                  className="flex size-13 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm max-sm:size-11 max-sm:text-base"
                  style={{ background: colorAvatar(form.dni || form.nombreCompleto) }}
                  aria-hidden
                >
                  {iniciales(form.nombreCompleto, form.dni)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[15px] font-bold text-content uppercase" title={form.nombreCompleto}>
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
                        <span className={cn('truncate font-semibold', d.value ? 'text-content' : 'text-red-ink')}>{d.value || 'Falta'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-sm text-muted">
                <FiUser className="shrink-0 text-lg" aria-hidden />
                Los datos de la persona aparecerán aquí al elegirla.
              </div>
            )}
          </StepSection>

          <StepSection
            id="inas-lugar"
            n={2}
            title="Jurisdicción y tipo"
            icon={<FiMapPin />}
            description="Dónde presta servicio y bajo qué asunto se registra."
            done={jurisdiccionCompleta}
          >
            <Field label="Jurisdicción" required error={jurisdictionsError || undefined}>
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
                loading={jurisdictionsLoading}
                invalid={!!jurisdictionsError}
                placeholder="Selecciona una jurisdicción"
                icon={<FiMapPin />}
                searchable
                options={jurisdiccionesHabilitadas.map(j => ({ value: j.name, label: j.name }))}
              />
            </Field>

            <div className="flex items-start gap-3 rounded-xl border border-line bg-subtle px-4 py-3" style={{ borderLeft: `4px solid ${colorAsunto}` }}>
              <FiTag className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <div className="min-w-0">
                <p className="m-0 text-xs font-medium text-muted">Asunto (automático)</p>
                <p className="m-0 mt-0.5 text-sm font-semibold text-content">
                  {subjectsLoading ? 'Cargando…' : subjectsError ? 'No se pudo cargar el asunto' : nombreCorto(form.asunto)}
                </p>
              </div>
            </div>

            <p className="m-0 flex items-start gap-2 rounded-xl bg-primary/6 px-3.5 py-2.5 text-[13px] text-content-2 dark:bg-primary/15">
              <FiCalendar className="mt-0.5 shrink-0 text-accent" aria-hidden />
              Al crearla, la persona aparece en el calendario: ahí marcas los días como justificados o injustificados.
            </p>
          </StepSection>
        </form>
      </Modal>

      {/* Modal de alerta personalizado */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </>
  )
}
