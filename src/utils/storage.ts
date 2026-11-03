import type {
  ID,
  LatLng,
  PDFDownloadRecord,
  PDFDownloadStats,
  StoredIncidencia,
} from '@/types'

const KEY = 'centinela_incidencias_v2' // Cambiar versión para forzar actualización

/** Ubicacion tal como puede estar guardada: array de coordenadas (formato antiguo) u objeto. */
type RawUbicacion = LatLng | { coordinates?: LatLng | null; address?: string } | null

/** Registro leído del localStorage antes de migrarlo al formato actual. */
interface RawIncidencia extends Omit<StoredIncidencia, 'ubicacion'> {
  ubicacion?: RawUbicacion
}

export function loadIncidencias(): StoredIncidencia[]{
  const raw = localStorage.getItem(KEY)
  try{
    const data: RawIncidencia[] = raw ? JSON.parse(raw) : []
    // Migrar datos antiguos si es necesario
    return data.map((item: RawIncidencia): StoredIncidencia => ({
      // Campos antiguos
      id: item.id,
      dni: item.dni,
      asunto: item.asunto,
      falta: item.falta,
      turno: item.turno,
      medio: item.medio,
      fechaIncidente: item.fechaIncidente,
      horaIncidente: item.horaIncidente,
      bodycamNumber: item.bodycamNumber,
      ubicacion: item.ubicacion ? {
        coordinates: Array.isArray(item.ubicacion) ? item.ubicacion :
                    (item.ubicacion.coordinates || null),
        address: Array.isArray(item.ubicacion) ? '' : (item.ubicacion.address || '')
      } : null,
      dirigidoA: item.dirigidoA,
      destinatario: item.destinatario,
      conCopia: item.conCopia,
      cc: item.cc,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Nuevos campos con valores por defecto
      jurisdiccion: item.jurisdiccion || '',
      cargo: item.cargo || '',
      regLab: item.regLab || '',
      bodycamAsignadaA: item.bodycamAsignadaA || '',
      encargadoBodycam: item.encargadoBodycam || '',
      tipoInasistencia: item.tipoInasistencia || '',
      fechaFalta: item.fechaFalta || ''
    }))
  }catch(e){
    return []
  }
}

export function saveIncidencias(list: StoredIncidencia[]): void{
  localStorage.setItem(KEY, JSON.stringify(list))
}

// Gestión de descargas de PDF
const PDF_DOWNLOADS_KEY = 'centinela_pdf_downloads'

export function trackPDFDownload(incidenciaId: ID): void {
  try {
    const downloads = getPDFDownloads()
    downloads.push({
      incidenciaId,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem(PDF_DOWNLOADS_KEY, JSON.stringify(downloads))
  } catch (e) {
  }
}

export function getPDFDownloads(): PDFDownloadRecord[] {
  try {
    const raw = localStorage.getItem(PDF_DOWNLOADS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function getPDFDownloadStats(): PDFDownloadStats {
  try {
    const incidencias = loadIncidencias()
    const downloads = getPDFDownloads()

    const totalIncidencias = incidencias.length
    const totalDownloads = downloads.length

    // Calcular porcentaje
    const percentage = totalIncidencias > 0
      ? Math.round((totalDownloads / totalIncidencias) * 100)
      : 0

    return {
      totalIncidencias,
      totalDownloads,
      percentage: Math.min(percentage, 100) // Limitar a 100%
    }
  } catch (e) {
    return {
      totalIncidencias: 0,
      totalDownloads: 0,
      percentage: 0
    }
  }
}
