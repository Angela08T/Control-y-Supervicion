import React from 'react'
import { cn } from '@/utils/classes'

/**
 * Marcadores de la plantilla de informe de una falta. Al generar el documento se reemplazan por los
 * datos reales; aqui se muestran como etiquetas legibles o con un dato de ejemplo.
 */
export const MARCADORES = [
  { token: '{{offender.name}}', label: 'Nombre', ejemplo: 'JUAN CARLOS' },
  { token: '{{offender.lastname}}', label: 'Apellidos', ejemplo: 'QUISPE HUAMÁN' },
  { token: '{{offender.job}}', label: 'Cargo', ejemplo: 'INSPECTOR COMERCIAL' },
  { token: '{{offender.regime}}', label: 'Régimen', ejemplo: 'CAS 1057' },
  { token: '{{offender.shift}}', label: 'Turno', ejemplo: 'MAÑANA' },
  { token: '{{bodycam.name}}', label: 'Bodycam', ejemplo: 'SG004' },
  { token: '{{lack.name}}', label: 'Falta', ejemplo: 'TARDANZA REITERADA' },
  { token: '{{address}}', label: 'Dirección', ejemplo: 'AV. PRÓCERES DE LA INDEPENDENCIA 1632' },
  { token: '{{dates}}', label: 'Fecha', ejemplo: '11 de noviembre del 2026' },
  { token: '{{time}}', label: 'Hora', ejemplo: '08:30' },
] as const

const POR_TOKEN = new Map<string, (typeof MARCADORES)[number]>(MARCADORES.map(m => [m.token, m]))

/** Marcadores que aparecen en un texto */
export const marcadoresEn = (texto?: string | null) => MARCADORES.filter(m => !!texto && texto.includes(m.token))

/**
 * Texto de la plantilla con los marcadores resaltados.
 * - modo "etiqueta": cada marcador se ve como una pastilla con su nombre ("Nombre", "Fecha").
 * - modo "ejemplo": cada marcador se reemplaza por un dato de ejemplo resaltado (vista previa del informe).
 * Un marcador desconocido ({{algo}}) se muestra tal cual, en rojo, para que se note.
 */
export function TemplateText({
  texto,
  modo = 'etiqueta',
  ejemplos,
  className,
}: {
  texto: string
  modo?: 'etiqueta' | 'ejemplo'
  /** Reemplazos de ejemplo propios (p. ej. el nombre de la falta que se esta escribiendo) */
  ejemplos?: Partial<Record<string, string>>
  className?: string
}) {
  const partes = texto.split(/(\{\{[^}]+\}\})/g)
  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {partes.map((p, i) => {
        if (!/^\{\{[^}]+\}\}$/.test(p)) return <React.Fragment key={i}>{p}</React.Fragment>
        const m = POR_TOKEN.get(p)
        if (!m) {
          return (
            <mark
              key={i}
              title="Marcador desconocido: no se reemplazará"
              // En la hoja (modo ejemplo) el fondo siempre es blanco: colores fijos para que se lea tambien en modo oscuro
              className={cn('rounded px-1 font-mono text-[0.85em]', modo === 'ejemplo' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-danger/12 text-red-ink')}
            >
              {p}
            </mark>
          )
        }
        if (modo === 'ejemplo') {
          return (
            <mark key={i} title={`${m.label} (${m.token})`} className="rounded-[4px] bg-brand-amber/22 px-0.5 font-semibold text-inherit [box-decoration-break:clone]">
              {ejemplos?.[m.token] || m.ejemplo}
            </mark>
          )
        }
        return (
          <mark
            key={i}
            title={m.token}
            className="mx-px inline-flex items-center rounded-md bg-primary/10 px-1.5 align-baseline text-[0.85em] leading-[1.45] font-semibold text-primary dark:bg-primary/25 dark:text-accent-light"
          >
            {m.label}
          </mark>
        )
      })}
    </span>
  )
}

/** Hoja de papel: fondo blanco (tambien en modo oscuro), margenes y tipografia de documento */
export function Paper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // La regla global "*" fija la fuente del sistema en cada elemento: [&_*] hace que el texto interior herede la de documento
        'relative rounded-md bg-white px-8 py-7 text-[13.5px] leading-[1.75] text-[#1f2937] shadow-[0_1px_3px_rgba(15,23,42,0.12),0_18px_40px_-18px_rgba(15,23,42,0.35)] [font-family:Georgia,"Times_New_Roman",serif] max-sm:px-5 max-sm:py-5 [&_*]:[font-family:inherit]',
        className
      )}
    >
      {children}
    </div>
  )
}
