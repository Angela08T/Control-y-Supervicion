/** Color y nombre corto de los asuntos conocidos (mismos colores que el grafico de evolucion) */
export const ASUNTOS: Record<string, { corto: string; color: string }> = {
  'Conductas relacionadas con el Cumplimiento del Horario y Asistencia': { corto: 'Horario y asistencia', color: '#1e3a8a' },
  'Conductas relacionadas con el Cumplimiento de Funciones o Desempeño': { corto: 'Funciones y desempeño', color: '#31a3b5' },
  'Conductas relacionadas con el Uso de Recursos o Bienes Municipales': { corto: 'Uso de recursos', color: '#8ebc22' },
  'Conductas relacionadas con la Imagen o Representación Institucional': { corto: 'Imagen institucional', color: '#f2a50f' },
  'Conductas relacionadas con la Convivencia y Comportamiento Institucional': { corto: 'Convivencia', color: '#d20b80' },
  'Conductas que podrían afectar la Seguridad o la Integridad de Personas': { corto: 'Seguridad e integridad', color: '#c71522' },
}

/** Asuntos nuevos del backend: se quita el prefijo "Conductas relacionadas con el/la" */
export const nombreCorto = (asunto: string) =>
  ASUNTOS[asunto]?.corto ?? asunto.replace(/^Conductas (relacionadas con (el|la|los|las)? ?|que podrían afectar )/i, '')
