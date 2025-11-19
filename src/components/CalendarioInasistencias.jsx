import React, { useState, useMemo } from 'react'
import { FaFilePdf, FaTrash } from 'react-icons/fa'

export default function CalendarioInasistencias({
  inasistencias = [],
  savedAttendances = [],
  onDelete,
  onSave,
  onDeleteMarks,
  onMonthChange
}) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [flMode, setFlMode] = useState(false) // Modo de marcado FL activo
  const [editMode, setEditMode] = useState(false) // Modo de edición para quitar marcas
  const [selectedCells, setSelectedCells] = useState({}) // Celdas seleccionadas: { "dni-dia": true }
  const [tempMarks, setTempMarks] = useState({}) // Marcas temporales: { "dni-dia": { tipo: "FL", id: null } }
  const [marksToDelete, setMarksToDelete] = useState([]) // IDs de marcas a eliminar
  const [currentPage, setCurrentPage] = useState(1) // Página actual
  const itemsPerPage = 12 // Límite de personas por página

  // Obtener nombre del mes en español
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  const diasSemanaCorto = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SÁ']

  // Procesar savedAttendances para obtener las marcas guardadas: { "dni-dia": { tipo: "J"/"I", id: "uuid" } }
  const savedMarks = useMemo(() => {
    const marks = {}

    savedAttendances.forEach(person => {
      const dni = person.dni

      if (person.dates && Array.isArray(person.dates)) {
        person.dates.forEach(dateObj => {
          // Solo procesar si no está eliminado (delete_at es null)
          if (!dateObj.delete_at) {
            const date = new Date(dateObj.date)
            const day = date.getDate()
            const key = `${dni}-${day}`

            marks[key] = {
              tipo: dateObj.mode === 'JUSTIFIED' ? 'J' : 'I',
              id: dateObj.id
            }
          }
        })
      }
    })

    console.log('📊 Marcas guardadas procesadas:', marks)
    return marks
  }, [savedAttendances])

  // Calcular días del mes seleccionado
  const diasDelMes = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)
    const totalDias = ultimoDia.getDate()

    const dias = []
    for (let i = 1; i <= totalDias; i++) {
      const fecha = new Date(year, month, i)
      dias.push({
        numero: i,
        diaSemana: diasSemanaCorto[fecha.getDay()],
        fecha: fecha
      })
    }
    return dias
  }, [selectedDate])

  // Filtrar inasistencias del mes seleccionado (solo para mostrar faltas existentes)
  const inasistenciasDelMes = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()

    return inasistencias.filter(item => {
      if (!item.fechaIncidente) return false
      // Parsear fecha en formato DD/MM/YYYY o ISO
      let fecha
      if (item.fechaIncidente.includes('/')) {
        const [dia, mes, anio] = item.fechaIncidente.split('/')
        fecha = new Date(anio, mes - 1, dia)
      } else {
        fecha = new Date(item.fechaIncidente)
      }
      return fecha.getFullYear() === year && fecha.getMonth() === month
    })
  }, [inasistencias, selectedDate])

  // Agrupar TODAS las personas (offenders), no solo las que tienen inasistencias este mes
  const personasConInasistencias = useMemo(() => {
    const personas = {}

    // 🔹 CAMBIO: Primero agregar TODOS los offenders (de inasistencias, sin filtrar por mes)
    inasistencias.forEach(item => {
      const key = item.dni
      if (!personas[key]) {
        personas[key] = {
          dni: item.dni,
          nombreCompleto: item.nombreCompleto || `${item.apellidos || ''} ${item.nombres || ''}`.trim(),
          turno: item.turno || '-',
          cargo: item.cargo || '-',
          regimen: item.regLab || item.regimen || '-',
          subgerencia: item.subgerencia || '-',
          faltas: {}
        }
      }
    })

    // Luego marcar las faltas del mes seleccionado
    inasistenciasDelMes.forEach(item => {
      const key = item.dni

      // Marcar el día de la falta
      let diaFalta
      if (item.fechaIncidente && item.fechaIncidente.includes('/')) {
        const [dia] = item.fechaIncidente.split('/')
        diaFalta = parseInt(dia)
      } else if (item.fechaIncidente) {
        diaFalta = new Date(item.fechaIncidente).getDate()
      }

      if (diaFalta && personas[key]) {
        personas[key].faltas[diaFalta] = item.falta?.includes('Justificada') ? 'J' : 'I'
      }
    })

    return Object.values(personas)
  }, [inasistencias, inasistenciasDelMes])

  function handleMonthChange(e) {
    const newDate = new Date(selectedDate)
    newDate.setMonth(parseInt(e.target.value))
    setSelectedDate(newDate)
    // Limpiar selecciones al cambiar mes
    setSelectedCells({})
    setTempMarks({})
    setMarksToDelete([])
    setFlMode(false)
    setEditMode(false)
    setCurrentPage(1) // Resetear a página 1

    // Notificar al padre del cambio de mes
    if (onMonthChange) {
      onMonthChange(newDate)
    }
  }

  function handleYearChange(e) {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(parseInt(e.target.value))
    setSelectedDate(newDate)
    // Limpiar selecciones al cambiar año
    setSelectedCells({})
    setTempMarks({})
    setMarksToDelete([])
    setFlMode(false)
    setEditMode(false)
    setCurrentPage(1) // Resetear a página 1

    // Notificar al padre del cambio de mes
    if (onMonthChange) {
      onMonthChange(newDate)
    }
  }

  function handleDownloadPDF() {
    console.log('Exportar PDF - Funcionalidad pendiente')
  }

  function handleToggleFL() {
    setFlMode(!flMode)
    if (flMode) {
      // Si se desactiva el modo FL, limpiar selecciones
      setSelectedCells({})
    }
    // Desactivar modo edición si está activo
    if (editMode) {
      setEditMode(false)
      setSelectedCells({})
    }
  }

  function handleToggleEdit() {
    setEditMode(!editMode)
    if (editMode) {
      // Si se desactiva el modo edición, limpiar selecciones
      setSelectedCells({})
    }
    // Desactivar modo FL si está activo
    if (flMode) {
      setFlMode(false)
      setSelectedCells({})
    }
  }

  function handleCellClick(dni, dia) {
    const key = `${dni}-${dia}`

    // Modo FL: agregar marcas temporales (solo si NO hay marca guardada)
    if (flMode) {
      // No permitir marcar si ya existe una marca guardada
      if (savedMarks[key]) {
        alert('Esta celda ya tiene una marca guardada. Usa el modo EDITAR para eliminarla.')
        return
      }

      setSelectedCells(prev => {
        const newSelected = { ...prev }
        if (newSelected[key]) {
          delete newSelected[key]
          // Quitar marca temporal
          setTempMarks(marks => {
            const newMarks = { ...marks }
            delete newMarks[key]
            return newMarks
          })
        } else {
          newSelected[key] = true
          // Agregar marca temporal (tipo por defecto: injustificada)
          setTempMarks(marks => ({
            ...marks,
            [key]: { tipo: 'injustificada', id: null }
          }))
        }
        return newSelected
      })
    }

    // Modo edición: seleccionar marcas guardadas para eliminar
    if (editMode) {
      // Solo permitir seleccionar celdas que tienen marcas guardadas
      if (savedMarks[key]) {
        const markId = savedMarks[key].id

        setMarksToDelete(prev => {
          const newMarks = [...prev]
          const index = newMarks.indexOf(markId)

          if (index > -1) {
            // Ya está seleccionado, quitarlo
            newMarks.splice(index, 1)
          } else {
            // No está seleccionado, agregarlo
            newMarks.push(markId)
          }

          return newMarks
        })

        // Toggle selección visual
        setSelectedCells(prev => {
          const newSelected = { ...prev }
          if (newSelected[key]) {
            delete newSelected[key]
          } else {
            newSelected[key] = true
          }
          return newSelected
        })
      }
    }
  }

  function handleDeleteSelected() {
    if (onDelete) {
      onDelete()
    }
  }

  function handleCancel() {
    // Limpiar todas las selecciones y marcas temporales
    setSelectedCells({})
    setTempMarks({})
    setFlMode(false)
    setEditMode(false)
  }

  function handleSave() {
    // Modo FL: guardar marcas nuevas
    if (flMode || Object.keys(tempMarks).length > 0) {
      const marksToSave = Object.keys(tempMarks).map(key => {
        const [dni, dia] = key.split('-')
        const markData = tempMarks[key]
        return {
          dni,
          dia: parseInt(dia),
          mes: selectedDate.getMonth() + 1,
          anio: selectedDate.getFullYear(),
          tipo: markData.tipo || 'injustificada'
        }
      })

      if (marksToSave.length === 0) {
        alert('No hay faltas seleccionadas para guardar')
        return
      }

      console.log('Guardando faltas:', marksToSave)

      if (onSave) {
        onSave(marksToSave)
      }

      // Limpiar después de guardar
      setSelectedCells({})
      setTempMarks({})
      setFlMode(false)
      // No mostrar alert aquí, el componente padre lo hará
    }

    // Modo edición: eliminar marcas seleccionadas
    if (editMode) {
      if (marksToDelete.length === 0) {
        alert('No hay marcas seleccionadas para eliminar')
        setEditMode(false)
        return
      }

      console.log('Eliminando marcas:', marksToDelete)

      if (onDeleteMarks) {
        onDeleteMarks(marksToDelete)
      }

      // Limpiar después de eliminar
      setSelectedCells({})
      setMarksToDelete([])
      setEditMode(false)
      // No mostrar alert aquí, el componente padre lo hará
    }
  }

  // Generar años disponibles
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }

  // Calcular paginación
  const totalPersonas = personasConInasistencias.length
  const totalPages = Math.ceil(totalPersonas / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const personasPaginadas = personasConInasistencias.slice(startIndex, endIndex)

  // Funciones de navegación de página
  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  function handlePreviousPage() {
    handlePageChange(currentPage - 1)
  }

  function handleNextPage() {
    handlePageChange(currentPage + 1)
  }

  return (
    <div className="calendario-inasistencias">
      {/* Controles superiores */}
      <div className="calendario-controls">
        <div className="fecha-selector">
          <span className="label">Mes y año</span>
          <div className="selector-group">
            <select value={selectedDate.getMonth()} onChange={handleMonthChange}>
              {meses.map((mes, index) => (
                <option key={mes} value={index}>{mes}</option>
              ))}
            </select>
            <select value={selectedDate.getFullYear()} onChange={handleYearChange}>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn-icon btn-pdf" onClick={handleDownloadPDF} title="Descargar PDF">
          <FaFilePdf />
        </button>
      </div>

      {/* Botones de acción */}
      <div className="calendario-actions">
        <button
          className={`btn-fl ${flMode ? 'active' : ''}`}
          onClick={handleToggleFL}
          title={flMode ? 'Desactivar modo FL' : 'Activar modo FL'}
        >
          FL
        </button>
        <button
          className={`btn-edit ${editMode ? 'active' : ''}`}
          onClick={handleToggleEdit}
          title={editMode ? 'Desactivar modo edición' : 'Activar modo edición'}
        >
          EDITAR
        </button>
        <button className="btn-icon btn-delete" onClick={handleDeleteSelected} title="Eliminar">
          <FaTrash />
        </button>
        {flMode && (
          <span style={{ marginLeft: '10px', color: 'var(--primary)', fontWeight: '500', fontSize: '0.9rem' }}>
            Modo FL activo - Haz clic en las celdas de fecha para marcar
          </span>
        )}
        {editMode && (
          <span style={{ marginLeft: '10px', color: '#f59e0b', fontWeight: '500', fontSize: '0.9rem' }}>
            Modo edición activo - Haz clic en las celdas con FL para eliminarlas
          </span>
        )}
      </div>

      {/* Tabla calendario */}
      <div className="calendario-table-container">
        <div className="calendario-header">
          INASISTENCIAS DE SERVICIO - MES DE {meses[selectedDate.getMonth()]}
        </div>

        <div className="calendario-grid">
          <table className="calendario-table">
            <thead>
              <tr>
                <th className="col-numero">#</th>
                <th className="col-nombre">APELLIDOS Y NOMBRES</th>
                <th className="col-turno">TURNO</th>
                <th className="col-cargo">CARGO</th>
                <th className="col-regimen">RÉGIMEN</th>
                {diasDelMes.map(dia => (
                  <th key={dia.numero} className="col-dia">
                    <div className="dia-header">
                      <span className="dia-semana">{dia.diaSemana}</span>
                      <span className="dia-numero">{dia.numero.toString().padStart(2, '0')}</span>
                    </div>
                  </th>
                ))}
                <th className="col-total">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {totalPersonas === 0 ? (
                <tr>
                  <td colSpan={6 + diasDelMes.length} className="empty-message">
                    No hay inasistencias registradas en este mes
                  </td>
                </tr>
              ) : (
                personasPaginadas.map((persona, index) => {
                  // Calcular total de inasistencias para esta persona
                  const totalInasistencias = Object.keys(persona.faltas).length
                  // Número de fila global (considerando la paginación)
                  const numeroFila = startIndex + index + 1

                  return (
                    <tr key={persona.dni}>
                      <td className="col-numero">{numeroFila}</td>
                      <td className="col-nombre">{persona.nombreCompleto}</td>
                      <td className="col-turno">{persona.turno}</td>
                      <td className="col-cargo">{persona.cargo}</td>
                      <td className="col-regimen">{persona.regimen}</td>
                      {diasDelMes.map(dia => {
                        const cellKey = `${persona.dni}-${dia.numero}`
                        const isSelected = selectedCells[cellKey]
                        const tempMark = tempMarks[cellKey]
                        const savedMark = savedMarks[cellKey]

                        // Mostrar marca temporal o marca guardada, o guion si no hay nada
                        let content
                        let cellClass = 'col-dia'

                        if (tempMark) {
                          // Marca temporal (nueva, aún no guardada)
                          content = <span className="marca-falta temp">FL</span>
                          cellClass += ' temp-mark'
                        } else if (savedMark) {
                          // Marca guardada desde la API
                          const displayText = savedMark.tipo // "J" o "I"
                          content = <span className="marca-falta saved">{displayText}</span>
                          cellClass += ' saved-mark'
                        } else {
                          // Sin marca
                          content = <span className="sin-falta">-</span>
                        }

                        // Agregar clases para interacción
                        if (flMode || editMode) {
                          cellClass += ' clickable'
                        }
                        if (isSelected) {
                          cellClass += ' selected'
                        }
                        if (editMode && savedMark) {
                          cellClass += ' editable'
                        }

                        return (
                          <td
                            key={dia.numero}
                            className={cellClass}
                            onClick={() => handleCellClick(persona.dni, dia.numero)}
                          >
                            {content}
                          </td>
                        )
                      })}
                      <td className="col-total">
                        <span className="total-count">{totalInasistencias}</span>
                      </td>
                    </tr>
                  )
                })
              )}
              {/* Filas vacías para completar hasta 12 */}
              {Array.from({ length: Math.max(0, itemsPerPage - personasPaginadas.length) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="col-numero">{startIndex + personasPaginadas.length + index + 1}</td>
                  <td className="col-nombre"></td>
                  <td className="col-turno"></td>
                  <td className="col-cargo"></td>
                  <td className="col-regimen"></td>
                  {diasDelMes.map(dia => (
                    <td key={dia.numero} className={`col-dia ${flMode ? 'clickable' : ''}`}>
                      <span className="sin-falta">-</span>
                    </td>
                  ))}
                  <td className="col-total">
                    <span className="total-count">0</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="calendario-pagination">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Anterior
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? 'page-number active' : 'page-number'}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="btn-secondary"
            style={{
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Botones de Cancelar y Guardar */}
      <div className="calendario-footer">
        <button className="btn-secondary" onClick={handleCancel}>
          CANCELAR
        </button>
        <button className="btn-primary" onClick={handleSave}>
          GUARDAR
        </button>
      </div>
    </div>
  )
}
