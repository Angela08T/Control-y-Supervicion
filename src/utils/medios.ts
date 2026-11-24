import type { Cam, ID, MedioItem } from '@/types'

/** Nombre de cada tipo de medio en pantalla y en el texto del informe */
export const MEDIO_INFO: Record<Cam, { label: string; doc: string; numero: string }> = {
  BODYCAM: { label: 'Bodycam', doc: 'la BODYCAM', numero: 'N.º de bodycam' },
  CAMERA: { label: 'Cámara', doc: 'la CÁMARA', numero: 'N.º de cámara' },
  RADIO: { label: 'Radio', doc: 'la RADIO', numero: 'N.º de radio' },
  PHONE: { label: 'Celular', doc: 'un CELULAR', numero: '' },
}

/** Orden fijo de los medios (como las tarjetas del formulario) */
export const ORDEN_MEDIOS: Cam[] = ['BODYCAM', 'CAMERA', 'RADIO', 'PHONE']

/** Medios de un reporte: la lista guardada o, en reportes antiguos, la bodycam principal */
export function mediosDeReporte(r: {
  media?: MedioItem[] | null
  bodycam?: { id?: ID; name?: string; cam?: Cam } | null
}): MedioItem[] {
  if (Array.isArray(r.media) && r.media.length > 0) return r.media
  if (r.bodycam) return [{ cam: r.bodycam.cam || 'BODYCAM', id: r.bodycam.id ?? null, name: r.bodycam.name ?? null }]
  return []
}

/** Une frases en español: "a", "a y b", "a, b y c" */
export function unirConY(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? ''
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
}

/** Frase para el informe: "la BODYCAM SG004, la CÁMARA 104A y un CELULAR" */
export function describirMedios(medios: MedioItem[]): string {
  return unirConY(medios.map(m => (m.name ? `${MEDIO_INFO[m.cam].doc} ${m.name}` : MEDIO_INFO[m.cam].doc)))
}

/** Etiqueta corta para listas y detalle: "Bodycam SG004 · Cámara 104A · Celular" */
export function etiquetaMedios(medios: MedioItem[]): string {
  return medios.map(m => (m.name ? `${MEDIO_INFO[m.cam].label} ${m.name}` : MEDIO_INFO[m.cam].label)).join(' · ')
}

/** Tipos de medio para la tabla: "Bodycam, Cámara" */
export function tiposDeMedios(medios: MedioItem[]): string {
  return medios.map(m => MEDIO_INFO[m.cam].label).join(', ')
}
