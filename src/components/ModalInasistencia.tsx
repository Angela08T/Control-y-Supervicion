import React, { useState, useEffect, useRef, useMemo } from 'react'
import useOffenderSearch from '../hooks/Offender/useOffenderSearch'
import useSubjects from '../hooks/Subject/useSubjects'
import useJurisdictions from '../hooks/Jurisdiction/useJurisdictions'
import AlertModal from './AlertModal'
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
  modalLabel,
  modalTitle
} from '@/utils/classes'
import {
  FaIdCard,
  FaClipboardList,
  FaClock,
  FaUserTie,
  FaIdBadge,
  FaBalanceScale
} from 'react-icons/fa'
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

/** Input de solo lectura (rellenado automáticamente con el DNI) */
const readOnlyInput = cn(modalInput, 'cursor-not-allowed')

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

  return (
    <div className={modalBackdrop}>
      <div className={cn(modalCard, 'max-[900px]:mx-auto max-[900px]:my-2.5 max-[900px]:max-h-[90vh] max-[900px]:w-[95%] max-[900px]:overflow-y-auto')}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>Nueva Inasistencia</h3>
          <button className={modalClose} onClick={onClose}>×</button>
        </div>
        <form className={cn(modalBody, 'max-[900px]:max-h-[calc(90vh-120px)] max-[900px]:overflow-y-auto')} onSubmit={handleSubmit}>
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
              maxLength={8}
              pattern="[0-9]{8}"
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
            Asunto
          </label>
          <input
            className={readOnlyInput}
            value={form.asunto}
            readOnly
          />

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

          <label className={modalLabel}>
            <FaBalanceScale className="mr-2" />
            Jurisdicción *
          </label>
          {jurisdictionsLoading ? (
            <div className="p-3 text-center text-muted">
              Cargando jurisdicciones...
            </div>
          ) : jurisdictionsError ? (
            <div className="p-3 text-center text-danger">
              {jurisdictionsError}
            </div>
          ) : (
            <select
              className={modalInput}
              value={form.jurisdiccion}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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

          <div className={modalActions}>
            <button type="button" onClick={onClose} className={btnSecondary}>CANCELAR</button>
            <button type="submit" className={btnPrimary}>CREAR INCIDENCIA</button>
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
