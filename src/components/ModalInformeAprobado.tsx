import { isAxiosError } from 'axios'
import React, { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import Modal from './UI/Modal'
import type { Absence } from '../types/offender.types'
import api from '../api/config'
import { getReportWithEvidences } from '../api/report'
import { getAttendances } from '../api/offender'
import { trackPDFDownload } from '../utils/storage'
import logoSJL from '../assets/logo-sjl.png?inline'
import InformePDFDocument from './PDFDocument'

// La API expresa la fecha del informe como fecha calendario en su cadena ISO.
function fechaLarga(date: string) {
  const day = date.slice(0, 10)
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(day + 'T00:00:00Z'))
}

async function filasInasistencia(period: Absence) {
  const result = await getAttendances(period.start.slice(0, 10), period.end.slice(0, 10), period.mode)
  return result.data.flatMap(person =>
    (person.dates || []).filter(day => day.date && !day.delete_at).map(day => ({
      nombreCompleto: [person.lastname, person.name].filter(Boolean).join(' ') || person.fullname,
      cargo: person.job,
      regLab: person.regime,
      turno: person.shift,
      jurisdiccion: typeof person.jurisdiction === 'string' ? person.jurisdiction : person.jurisdiction?.name,
      fechaFalta: fechaLarga(day.date!),
      tipoInasistencia: day.mode === 'JUSTIFIED' ? 'JUSTIFICADA' : 'INJUSTIFICADA'
    }))
  )
}

async function generarInforme(id: string) {
  const report = await getReportWithEvidences(id)
  if (report?.process !== 'APPROVED' || !report.code) {
    throw new Error('El informe aún no tiene un código de aprobación.')
  }
  const periods = report.absences || []
  const [images, attendance] = await Promise.all([
    Promise.all(report.evidences.map(async evidence => {
      try {
        const response = await api.get<Blob>(evidence.path, { responseType: 'blob' })
        return { base64: response.data, anexo: evidence.description }
      } catch (error) {
        if (!isAxiosError(error) || error.response?.status !== 404) throw error
        return { base64: null, anexo: evidence.description }
      }
    })),
    Promise.all(periods.map(filasInasistencia))
  ])
  const doc = <InformePDFDocument
    approvedReport={report}
    incidencia={{ asunto: report.subject.name, falta: report.lack?.name || '' }}
    formData={{ fecha: fechaLarga(report.date), imagenes: images, links: report.link }}
    logoBase64={logoSJL}
    esInasistencia={periods.length > 0}
    inasistenciasHistoricas={attendance.flat()}
  />
  return { blob: await pdf(doc).toBlob(), code: report.code, missing: images.filter(image => !image.base64).length }
}

export default function ModalInformeAprobado({ id, onClose }: { id: string; onClose: () => void }) {
  const [file, setFile] = useState<{ url: string; code: string; missing: number } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let url: string | undefined
    generarInforme(id).then(({ blob, code, missing }) => {
      if (active) {
        url = URL.createObjectURL(blob)
        setFile({ url, code, missing })
      }
    }).catch(() => {
      if (active) setError('No se pudo cargar el PDF del informe aprobado.')
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, attempt])

  return (
    <Modal size="xl" title={`Informe aprobado ${file?.code || ''}`} onClose={onClose}
      footer={<>
        {error && <button onClick={() => { setError(''); setAttempt(n => n + 1) }}>Reintentar</button>}
        {file && <a className="font-semibold text-primary" href={file.url} download={'Informe_' + file.code + '.pdf'}
          onClick={() => trackPDFDownload(id)}>Descargar PDF</a>}
      </>}>
      {file && file.missing > 0 && <p role="status">Archivos de evidencia no disponibles: {file.missing}. Sus anexos están identificados en el PDF.</p>}
      {error ? <p role="alert">{error}</p> : file
        ? <iframe title="Vista previa del informe aprobado" src={file.url} className="h-[70vh] w-full border-0" />
        : <p role="status">Preparando el PDF…</p>}
    </Modal>
  )
}
