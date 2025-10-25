ModalIncidencia.jsx
import React, { useEffect, useState } from 'react'
import MapSelector from './MapSelector'
import { 
  FaIdCard, 
  FaClipboardList, 
  FaExclamationTriangle, 
  FaClock, 
  FaVideo,
  FaMapMarkerAlt,
  FaUserTag,
  FaUsers,
  FaUserTie,
  FaIdBadge,
  FaBalanceScale
} from 'react-icons/fa'

const defaultState = {
  dni: '', 
  asunto: '', 
  falta: '',
  turno: '', 
  medio: 'bodycam', 
  fechaIncidente: '', 
  horaIncidente: '', 
  bodycamNumber: '', 
  bodycamAsignadaA: '',
  encargadoBodycam: '',
  ubicacion: null,
  jurisdiccion: '',
  dirigidoA: '',
  destinatario: '',
  cargo: '',
  regLab: '',
  tipoInasistencia: '',
  fechaFalta: '',
  conCopia: false,
  cc: []
}

// Mapeo de subtipos por asunto
const subtipoPorAsunto = {
  'Falta disciplinaria': [
    'Dormir en horario laboral',
    'Comer en horario laboral',
    'Jugar en horario laboral'
  ],
  'Abandono de servicio': [
    'Abandono injustificado del puesto',
    'Abandono temporal reiterado',
    'Negativa a cumplir funciones asignadas'
  ],
  'Inasistencia': [
    'Inasistencia prolongada sin aviso',
    'Llegó fuera de horario'
  ]
}

// Mapeo de destinatarios por tipo
const destinatariosPorTipo = {
  'Jefe de operaciones': [
    'Shols Tello Jose Rodrigo',
    'Gutierrez Moreno Edwin Alexander'
  ],
  'Coordinadores': [
    'Vieri Flores',
    'Smith Carhuchahua',
    'Diego Matute'
  ],
  'Subgerente': [
    'David Sanchez',
    'Stewar'
  ]
}

// Lista completa para CC
const listaCompletaCC = [
  'Shols Tello Jose Rodrigo',
  'Gutierrez Moreno Edwin Alexander',
  'Vieri Flores',
  'Smith Carhuchahua',
  'Diego Matute',
  'David Sanchez',
  'Stewar'
]

export default function ModalIncidencia({ initial, onClose, onSave }){
  const [form, setForm] = useState(defaultState)

  useEffect(()=>{
    if(initial){
      setForm({...defaultState, ...initial})
    } else {
      // Establecer fecha y hora automáticamente al crear
      const now = new Date()
      const fecha = now.toISOString().split('T')[0]
      const hora = now.toTimeString().slice(0,5)
      setForm(f => ({...f, fechaIncidente: fecha, horaIncidente: hora}))
    }
  }, [initial])

  function setField(k, v){ 
    setForm(f => {
      const newForm = {...f, [k]: v}
      
      // Si cambia el asunto, resetear falta y campos relacionados
      if(k === 'asunto'){
        newForm.falta = ''
        newForm.tipoInasistencia = ''
        newForm.fechaFalta = ''
        // Resetear campos de bodycam si cambia a inasistencia
        if(v === 'Inasistencia') {
          newForm.medio = 'reporte'
          newForm.bodycamNumber = ''
          newForm.bodycamAsignadaA = ''
          newForm.encargadoBodycam = ''
        } else {
          newForm.medio = 'bodycam'
        }
      }
      
      // Si cambia dirigidoA, resetear destinatario
      if(k === 'dirigidoA'){
        newForm.destinatario = ''
      }
      
      return newForm
    })
  }

  function handleDNIChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setField('dni', value)
  }

  function toggleCC(persona){
    setForm(f => {
      const cc = f.cc || []
      if(cc.includes(persona)){
        return {...f, cc: cc.filter(p => p !== persona)}
      } else {
        return {...f, cc: [...cc, persona]}
      }
    })
  }

  function handleSubmit(ev){
    ev.preventDefault()
    
    // Validar campos obligatorios
    if(!form.dni || form.dni.length !== 8){
      alert('El DNI debe tener exactamente 8 dígitos')
      return
    }
    
    // Validaciones comunes
    if(!form.asunto || !form.falta || !form.turno || !form.fechaIncidente || !form.horaIncidente || !form.jurisdiccion || !form.dirigidoA || !form.destinatario || !form.cargo || !form.regLab){
      alert('Completa todos los campos obligatorios')
      return
    }

    // Validaciones específicas para inasistencia
    if(form.asunto === 'Inasistencia') {
      if(!form.tipoInasistencia || !form.fechaFalta) {
        alert('Para inasistencia, completa el tipo y la fecha de falta')
        return
      }
    } else {
      // Validaciones para otros asuntos (requieren bodycam)
      if(!form.bodycamNumber || !form.bodycamAsignadaA || !form.encargadoBodycam) {
        alert('Completa los campos de bodycam')
        return
      }
    }
    
    onSave(form)
  }

  const subtipesDisponibles = form.asunto ? subtipoPorAsunto[form.asunto] || [] : []
  const destinatariosDisponibles = form.dirigidoA ? destinatariosPorTipo[form.dirigidoA] || [] : []
  const mostrarCamposInasistencia = form.asunto === 'Inasistencia'
  const mostrarCamposBodycam = form.asunto !== 'Inasistencia'

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{initial ? 'Editar Incidencia' : 'Nueva Incidencia'}</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <label>
            <FaIdCard style={{marginRight: '8px'}} />
            DNI * (8 dígitos)
          </label>
          <input 
            value={form.dni} 
            onChange={handleDNIChange}
            placeholder="Ingresa 8 dígitos del DNI"
            maxLength={8}
            pattern="[0-9]{8}"
          />

          <label>
            <FaClipboardList style={{marginRight: '8px'}} />
            Seleccionar asunto *
          </label>
          <select 
            value={form.asunto} 
            onChange={e=> setField('asunto', e.target.value)}
          >
            <option value="">Selecciona</option>
            <option value="Falta disciplinaria">Falta disciplinaria</option>
            <option value="Abandono de servicio">Abandono de servicio</option>
            <option value="Inasistencia">Inasistencia</option>
          </select>

          {form.asunto && (
            <>
              <label>
                <FaExclamationTriangle style={{marginRight: '8px'}} />
                Seleccionar falta *
              </label>
              <select 
                value={form.falta} 
                onChange={e=> setField('falta', e.target.value)}
              >
                <option value="">Selecciona</option>
                {subtipesDisponibles.map(subtipo => (
                  <option key={subtipo} value={subtipo}>{subtipo}</option>
                ))}
              </select>
            </>
          )}

          {/* Campos específicos para inasistencia */}
          {mostrarCamposInasistencia && (
            <>
              <label>
                <FaExclamationTriangle style={{marginRight: '8px'}} />
                Tipo de inasistencia *
              </label>
              <select 
                value={form.tipoInasistencia} 
                onChange={e=> setField('tipoInasistencia', e.target.value)}
              >
                <option value="">Selecciona tipo</option>
                <option value="Justificada">Justificada</option>
                <option value="Injustificada">Injustificada</option>
              </select>

              <label>Fecha de falta *</label>
              <input 
                type="date" 
                value={form.fechaFalta} 
                onChange={e=> setField('fechaFalta', e.target.value)} 
              />
            </>
          )}

          <label>
            <FaClock style={{marginRight: '8px'}} />
            Turno *
          </label>
          <select 
            value={form.turno} 
            onChange={e=> setField('turno', e.target.value)}
          >
            <option value="">Selecciona</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
          </select>

          <label>
            <FaUserTie style={{marginRight: '8px'}} />
            Cargo *
          </label>
          <input 
            value={form.cargo} 
            onChange={e=> setField('cargo', e.target.value)} 
            placeholder="Ingresa el cargo"
          />

          <label>
            <FaIdBadge style={{marginRight: '8px'}} />
            Reg. Lab *
          </label>
          <input 
            value={form.regLab} 
            onChange={e=> setField('regLab', e.target.value)} 
            placeholder="Ingresa Reg. Lab"
          />

          {/* Campos de bodycam (solo para NO inasistencia) */}
          {mostrarCamposBodycam && (
            <>
              <label>
                <FaVideo style={{marginRight: '8px'}} />
                Medio *
              </label>
              <select 
                value={form.medio} 
                onChange={e=> setField('medio', e.target.value)}
              >
                <option value="bodycam">Bodycam</option>
              </select>

              <label>N° de Bodycam *</label>
              <input 
                value={form.bodycamNumber} 
                onChange={e=> setField('bodycamNumber', e.target.value)} 
                placeholder="Número de bodycam" 
              />

              <label>Bodycam asignada a: *</label>
              <input 
                value={form.bodycamAsignadaA} 
                onChange={e=> setField('bodycamAsignadaA', e.target.value)} 
                placeholder="Persona a quien está asignada la bodycam" 
              />

              <label>Encargado de bodycam: *</label>
              <input 
                value={form.encargadoBodycam} 
                onChange={e=> setField('encargadoBodycam', e.target.value)} 
                placeholder="Encargado de la bodycam" 
              />
            </>
          )}

          <div className="row">
            <div style={{flex:1}}>
              <label>Fecha del Incidente *</label>
              <input 
                type="date" 
                value={form.fechaIncidente} 
                onChange={e=> setField('fechaIncidente', e.target.value)} 
              />
            </div>
            <div style={{flex:1}}>
              <label>Hora del Incidente *</label>
              <input 
                type="time" 
                value={form.horaIncidente} 
                onChange={e=> setField('horaIncidente', e.target.value)} 
              />
            </div>
          </div>

          <label>
            <FaBalanceScale style={{marginRight: '8px'}} />
            Jurisdicción *
          </label>
          <input 
            value={form.jurisdiccion} 
            onChange={e=> setField('jurisdiccion', e.target.value)} 
            placeholder="Ingresa la jurisdicción"
          />

          <label>
            <FaMapMarkerAlt style={{marginRight: '8px'}} />
            Ubicación del Infractor
          </label>
          <MapSelector value={form.ubicacion} onChange={p => setField('ubicacion', p)} />

          <label>
            <FaUserTag style={{marginRight: '8px'}} />
            Destinatario *
          </label>
          <select 
            value={form.dirigidoA} 
            onChange={e=> setField('dirigidoA', e.target.value)}
          >
            <option value="">Selecciona</option>
            <option value="Jefe de operaciones">Jefe de operaciones</option>
            <option value="Coordinadores">Coordinadores</option>
            <option value="Subgerente">Subgerente</option>
          </select>

          {form.dirigidoA && (
            <>
              <label>Persona *</label>
              <select 
                value={form.destinatario} 
                onChange={e=> setField('destinatario', e.target.value)}
              >
                <option value="">Selecciona</option>
                {destinatariosDisponibles.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </>
          )}

          {/* Botón CC */}
          <div className="cc-section">
            <button 
              type="button" 
              className="btn-cc"
              onClick={()=> setField('conCopia', !form.conCopia)}
            >
              <FaUsers style={{marginRight: '8px'}} />
              {form.conCopia ? '✓ Con copia (CC)' : '+ Agregar CC'}
            </button>
          </div>

          {/* Lista de personas para CC */}
          {form.conCopia && (
            <div className="cc-list">
              <label>Seleccionar personas para copia:</label>
              <div className="checkbox-group">
                {listaCompletaCC.map(persona => (
                  <label key={persona} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={(form.cc || []).includes(persona)}
                      onChange={()=> toggleCC(persona)}
                    />
                    <span>{persona}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">CANCELAR</button>
            <button type="submit" className="btn-primary">
              {initial ? 'ACTUALIZAR INCIDENCIA' : 'CREAR INCIDENCIA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}