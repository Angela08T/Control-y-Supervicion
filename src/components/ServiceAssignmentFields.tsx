import { Field, Input } from './UI/Field'
import { assignmentFields, isOptionalAssignmentField } from '../utils/serviceAssignment'
import type { OptionalAssignmentField, ServiceAssignment } from '../types/report.types'

export default function ServiceAssignmentFields({ value, onChange, onOmissionChange }: {
  value: ServiceAssignment
  onChange: (key: typeof assignmentFields[number][0], value: string) => void
  onOmissionChange: (keys: OptionalAssignmentField[]) => void
}) {
  const omitted = value.omitted_assignment_fields ?? []
  return <div className="grid gap-3 sm:grid-cols-2">
    {assignmentFields.map(([key, label]) => {
      const optional = isOptionalAssignmentField(key)
      const excluded = optional && omitted.includes(key)
      return <div key={key}>
        <Field label={label}>
        <Input aria-label={label} type={key === 'service_start' ? 'date' : 'text'} inputMode={key === 'reported_dni' ? 'numeric' : undefined}
          maxLength={key === 'reported_dni' ? 8 : key.startsWith('reported_') ? 160 : 120}
          disabled={excluded} value={excluded ? '' : value[key] ?? ''} onChange={e => onChange(key, e.target.value)} />
        </Field>
        {optional && <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={excluded} aria-label={`Omitir ${label.toLowerCase()} en el informe`}
            onChange={e => onOmissionChange(e.target.checked ? [...omitted, key] : omitted.filter(field => field !== key))} />
          Omitir en el informe
        </label>}
      </div>
    })}
  </div>
}
