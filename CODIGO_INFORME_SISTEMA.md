# Sistema de Código de Informe (INFORME N°)

## Descripción General

El campo **`code`** (mostrado como "INFORME N°" en el PDF) es el identificador único y oficial del informe que se genera **automáticamente por el backend** cuando el informe es **aprobado**.

## Estados del Informe y Código

### 1. 📝 **Borrador (draft)**
- **Estado**: Informe recién creado
- **Código**: `null` (no tiene código)
- **Visualización**: Se muestra mensaje "⏳ Se generará automáticamente al aprobar el informe"
- **Acciones permitidas**:
  - Editar contenido
  - Agregar/eliminar evidencias
  - Enviar a validación

### 2. ⏳ **Pendiente (pending)**
- **Estado**: Enviado para aprobación, esperando validación
- **Código**: `null` (aún no tiene código)
- **Visualización**: Se muestra mensaje "⏳ Se generará automáticamente al aprobar el informe"
- **Acciones permitidas**:
  - Aprobar (genera el código automáticamente)
  - Rechazar (no genera código)

### 3. ✅ **Aprobado (approved)**
- **Estado**: Informe validado y aprobado
- **Código**: `XXX-YYYY-CS-SS-GOP/MDSJL` (generado automáticamente)
  - `XXX`: Número correlativo (001, 002, 003, etc.)
  - `YYYY`: Año correspondiente (2025, 2026, etc.)
  - Ejemplo: `042-2025-CS-SS-GOP/MDSJL`
- **Visualización**: Se muestra el código en campo de solo lectura con estilo de éxito (fondo verde claro)
- **Comportamiento**: El código NO puede ser modificado manualmente

### 4. ❌ **Rechazado (rejected)**
- **Estado**: Informe rechazado, no válido
- **Código**: `null` (no se genera código)
- **Visualización**: Se muestra mensaje "⏳ Se generará automáticamente al aprobar el informe"
- **Observación**: El informe puede ser eliminado o reeditado según políticas

## Flujo Completo del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. CREAR INCIDENCIA                                               │
│    - Estado: draft                                                │
│    - code: null                                                   │
│    - Usuario agrega datos básicos del incidente                  │
└─────────────────┬────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. COMPLETAR EVIDENCIAS                                           │
│    - Estado: draft                                                │
│    - code: null                                                   │
│    - Usuario agrega imágenes y descripción                       │
│    - Al menos 1 imagen es obligatoria                            │
└─────────────────┬────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. ENVIAR A VALIDADOR                                             │
│    - Estado: draft → pending                                      │
│    - code: null                                                   │
│    - Solo si tiene al menos 1 imagen                             │
│    - Botón "Enviar a validador" (📤)                             │
└─────────────────┬────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. VALIDACIÓN                                                     │
│    - Estado: pending                                              │
│    - code: null                                                   │
│    - Validador revisa el informe                                 │
│    - Opciones: Aprobar (✓) o Rechazar (✗)                       │
└─────────────────┬────────────────────────────────────────────────┘
                  │
                  ├─────────────────────────┐
                  │                         │
                  ▼                         ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ 5a. APROBADO                │  │ 5b. RECHAZADO               │
│    - Estado: approved       │  │    - Estado: rejected       │
│    - code: AUTO-GENERADO ✅  │  │    - code: null            │
│    - Número correlativo     │  │    - No se genera código    │
│    - Año actual             │  │    - Informe no válido      │
│    - Ejemplo:               │  │                             │
│      042-2025-CS-SS-GOP     │  │                             │
│    - SOLO LECTURA           │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

## Implementación Frontend

### Archivos Modificados

1. **[src/api/report.jsx](src/api/report.jsx)**
   - Agregado campo `code` en transformación de datos (línea 136 y 241)
   - Se obtiene desde `r.code || null`

2. **[src/components/ModalPDFInforme.jsx](src/components/ModalPDFInforme.jsx)**
   - Línea 133: `const numeroInforme = incidencia.code || ''`
   - Líneas 643-749: Renderizado condicional según estado
     - **Aprobado**: Input de solo lectura con fondo verde
     - **Otros estados**: Mensaje informativo sobre generación automática
   - Líneas 628-695: Badge visual de estado en el header del modal

3. **[src/components/PDFDocument.jsx](src/components/PDFDocument.jsx)**
   - Líneas 193-199: Renderizado condicional del campo "INFORME N°"
   - Solo se muestra en el PDF si `formData.numeroInforme` existe (está aprobado)

### Visualización en UI

#### Estado Draft/Pending/Rejected
```
┌────────────────────────────────────────────────────────────┐
│ INFORME N°                                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ⏳ Se generará automáticamente al aprobar el informe   │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ℹ️ Nota: El código del informe será asignado          │ │
│ │ automáticamente por el sistema con el número           │ │
│ │ correlativo y año correspondiente una vez que el       │ │
│ │ informe sea aprobado. Hasta entonces, no es necesario  │ │
│ │ ingresar ningún código manualmente.                    │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

#### Estado Approved
```
┌────────────────────────────────────────────────────────────┐
│ INFORME N°                                                  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 042-2025-CS-SS-GOP/MDSJL                    [🔒]      │ │
│ └────────────────────────────────────────────────────────┘ │
│ (Campo de solo lectura - fondo verde claro)                │
└────────────────────────────────────────────────────────────┘
```

## Ventajas del Sistema

### ✅ Ventajas
1. **Automatización completa**: No hay posibilidad de error humano en la numeración
2. **Números correlativos**: Garantiza secuencia única y sin duplicados
3. **Trazabilidad**: Solo informes aprobados tienen código oficial
4. **Claridad visual**: Estados claramente diferenciados con colores y mensajes
5. **Prevención de fraudes**: No se puede "inventar" un código de informe
6. **Año dinámico**: El sistema usa el año actual automáticamente

### ⚠️ Consideraciones Importantes

1. **No editable**: Una vez generado, el código NO puede ser modificado (es de solo lectura)
2. **Backend requerido**: La generación del código depende del backend
3. **Proceso irreversible**: Una vez aprobado y generado el código, no se puede "desaprobar"
4. **Eliminar con cuidado**: Si se elimina un informe aprobado, su código queda "consumido"

## Ejemplo de Uso

### Caso de Uso: Informe de Falta Disciplinaria

1. **Día 1 - 10:00 AM**: Supervisor crea incidencia
   - Estado: `draft`
   - Code: `null`
   - Acción: Llena datos básicos (DNI, falta, ubicación, etc.)

2. **Día 1 - 10:30 AM**: Supervisor agrega evidencias
   - Estado: `draft`
   - Code: `null`
   - Acción: Sube 3 imágenes con descripciones

3. **Día 1 - 11:00 AM**: Supervisor envía a validador
   - Estado: `draft` → `pending`
   - Code: `null`
   - Acción: Click en "Enviar a validador"

4. **Día 2 - 09:00 AM**: Validador revisa
   - Estado: `pending`
   - Code: `null`
   - Acción: Revisa contenido y evidencias

5. **Día 2 - 09:15 AM**: Validador APRUEBA
   - Estado: `pending` → `approved`
   - Code: **`042-2025-CS-SS-GOP/MDSJL`** ✅ (GENERADO AUTOMÁTICAMENTE)
   - Sistema asigna el código automáticamente

6. **Día 2 - 10:00 AM**: Descarga del PDF
   - Estado: `approved`
   - Code: `042-2025-CS-SS-GOP/MDSJL`
   - El PDF se genera con el código oficial

## Backend Requerido

### Endpoint de Aprobación

Cuando se aprueba un informe, el backend debe:

```javascript
// Pseudocódigo del backend
async function approveReport(reportId) {
  // 1. Obtener el último número correlativo del año actual
  const year = new Date().getFullYear()
  const lastNumber = await getLastReportNumber(year)

  // 2. Incrementar el número
  const newNumber = lastNumber + 1

  // 3. Formatear el código
  const code = `${String(newNumber).padStart(3, '0')}-${year}-CS-SS-GOP/MDSJL`

  // 4. Actualizar el reporte
  await updateReport(reportId, {
    process: 'APPROVED',
    code: code,
    approved_at: new Date()
  })

  return { code, status: 'APPROVED' }
}
```

### Estructura de Respuesta API

```json
{
  "id": "uuid-del-reporte",
  "code": "042-2025-CS-SS-GOP/MDSJL",
  "process": "APPROVED",
  "offender": { ... },
  "subject": { ... },
  "lack": { ... },
  "evidences": [ ... ],
  "approved_at": "2025-11-24T12:30:00.000Z",
  ...
}
```

## Preguntas Frecuentes

### ❓ ¿Puedo cambiar el código manualmente?
**No.** El código es generado automáticamente por el sistema y es de solo lectura. Esto garantiza la integridad y trazabilidad.

### ❓ ¿Qué pasa si rechazo un informe?
El informe queda en estado `rejected`, no se genera código, y puede ser eliminado o corregido según políticas.

### ❓ ¿Puedo aprobar un informe sin evidencias?
**No.** Para enviar a validación (y posteriormente aprobar), el informe debe tener al menos 1 imagen con descripción.

### ❓ ¿El código se puede repetir?
**No.** El backend garantiza que cada código es único usando números correlativos por año.

### ❓ ¿Qué pasa si cambio el año del sistema?
El backend usa el año actual al momento de la aprobación. Si apruebas un informe en 2026, el código será `XXX-2026-CS-SS-GOP/MDSJL`.

### ❓ ¿Puedo descargar el PDF antes de aprobar?
**Sí**, pero el PDF NO incluirá el campo "INFORME N°" hasta que el informe sea aprobado.

## Resumen

El sistema de código de informe está diseñado para:
- ✅ Garantizar unicidad y trazabilidad
- ✅ Prevenir errores humanos en la numeración
- ✅ Automatizar el proceso de asignación de códigos oficiales
- ✅ Proporcionar claridad visual sobre el estado del informe
- ✅ Asegurar que solo informes aprobados tienen código oficial

**Regla de Oro**: 🔑 **Solo los informes APROBADOS tienen código oficial.**
