import type { OptionalAssignmentField, ServiceAssignment } from '../types/report.types'

export const assignmentFields = [
  ['reported_name', 'Nombres'],
  ['reported_lastname', 'Apellidos'],
  ['reported_dni', 'DNI'],
  ['reported_job', 'Cargo'],
  ['reported_regime', 'Régimen laboral'],
  ['service_start', 'Fecha de inicio'],
  ['assigned_zone', 'Zona'],
  ['assigned_sector', 'Sector'],
  ['assigned_radio', 'Radio'],
] as const

export function isOptionalAssignmentField(key: string): key is OptionalAssignmentField {
  return key === 'assigned_zone' || key === 'assigned_sector' || key === 'assigned_radio'
}

export function serviceAssignment(person: ServiceAssignment & { offender?: Partial<Record<'name' | 'lastname' | 'dni' | 'job' | 'regime', string>> | null }) {
  return {
    omitted_assignment_fields: person.omitted_assignment_fields ?? [],
    reported_name: (person.reported_name ?? person.offender?.name ?? '').trim(),
    reported_lastname: (person.reported_lastname ?? person.offender?.lastname ?? '').trim(),
    reported_dni: (person.reported_dni ?? person.offender?.dni ?? '').trim(),
    reported_job: (person.reported_job ?? person.offender?.job ?? '').trim(),
    reported_regime: (person.reported_regime ?? person.offender?.regime ?? '').trim(),
    service_start: person.service_start ?? '',
    assigned_zone: person.assigned_zone ?? '',
    assigned_sector: person.assigned_sector ?? '',
    assigned_radio: person.assigned_radio ?? '',
  }
}

export function identityError(value: ServiceAssignment) {
  if (!/^[0-9]{8}$/.test(value.reported_dni ?? '')) return 'El DNI de la identificación debe tener ocho dígitos.'
  if (![value.reported_name, value.reported_lastname, value.reported_job, value.reported_regime].every(v => v?.trim()))
    return 'Completa los nombres, apellidos, cargo y régimen laboral del sereno.'
  return ''
}
