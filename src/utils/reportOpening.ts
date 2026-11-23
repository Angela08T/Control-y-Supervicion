export type Opening = { fechaIncidente: string; horaIncidente: string; ubicacion: string }

export function readReportLinks(raw?: string | null): { references: string; opening?: Opening } {
  const fallback = { references: raw || '' }
  if (!raw?.startsWith('{')) return fallback
  try {
    const data = JSON.parse(raw)
    if (data?.format !== 'centinela-report-v1' || typeof data.references !== 'string') return fallback
    const opening = data.opening
    const references = [data.references, data.images?.url, data.video?.url].filter(Boolean).join('\n')
    return { references, opening: opening && [opening.fechaIncidente, opening.horaIncidente, opening.ubicacion]
      .every(v => typeof v === 'string') ? opening : undefined }
  } catch {
    return fallback
  }
}

export function writeReportLinks(references: string, { fechaIncidente, horaIncidente, ubicacion }: Opening) {
  return JSON.stringify({ format: 'centinela-report-v1', references, opening: { fechaIncidente, horaIncidente, ubicacion } })
}
