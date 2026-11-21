import { Field, Input } from './UI/Field'
import { assignmentFields } from '../utils/serviceAssignment'
import type { ServiceAssignment } from '../types/report.types'

export default function ServiceAssignmentFields({ value, onChange }: {
  value: ServiceAssignment
  onChange: (key: keyof ServiceAssignment, value: string) => void
}) {
  return <div className="grid gap-3 sm:grid-cols-2">
    {assignmentFields.map(([key, label]) => (
      <Field key={key} label={label}>
        <Input aria-label={label} type={key === 'service_start' ? 'date' : 'text'} inputMode={key === 'reported_dni' ? 'numeric' : undefined}
          maxLength={key === 'reported_dni' ? 8 : key.startsWith('reported_') ? 160 : 120}
          value={value[key] ?? ''} onChange={e => onChange(key, e.target.value)} />
      </Field>
    ))}
  </div>
}
