const KEY = 'centinela_incidencias_v2' // Cambiar versión para forzar actualización

export function loadIncidencias(){
  const raw = localStorage.getItem(KEY)
  try{
    const data = raw ? JSON.parse(raw) : []
    // Migrar datos antiguos si es necesario
    return data.map(item => ({
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
        address: item.ubicacion.address || ''
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
    console.error('Error parseando incidencias', e)
    return []
  }
}

export function saveIncidencias(list){
  localStorage.setItem(KEY, JSON.stringify(list))
}