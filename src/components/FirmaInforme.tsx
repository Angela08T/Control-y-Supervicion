import React from 'react'

export const firmanteInforme = {
  nombre: 'EDSON LEON AGUIRRE CHANG',
  cargo: 'Jefe de Supervisión y Control'
}

export default function FirmaInforme() {
  return (
    <div style={{ textAlign: 'center', margin: '40px 0 20px' }}>
      <div style={{ display: 'inline-block', borderTop: '1px solid', padding: '8px 12px 0' }}>
        <strong>{firmanteInforme.nombre}</strong>
        <div>{firmanteInforme.cargo}</div>
      </div>
    </div>
  )
}
