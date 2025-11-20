# 📊 Documentación de Endpoints del Dashboard - Sistema Centinela

## 🎯 Estado General

Esta documentación detalla qué datos del Dashboard están enlazados a endpoints de la API y cuáles aún faltan por implementar en el backend.

---

## ✅ ENDPOINTS YA ENLAZADOS

### 1. **Reportes/Incidencias**
- **Componente:** `DashboardPage.jsx`
- **Función API:** `getReports(page, limit)`
- **Archivo:** `/src/api/report.jsx`
- **Endpoint Backend:** `GET /report?page=1&limit=1000`
- **Estado:** ✅ **FUNCIONANDO**
- **Datos que proporciona:**
  - Total de incidencias
  - Evolución de incidencias por mes (gráfico de líneas)
  - Incidencias por tipo de asunto (gráfico de barras)
  - Incidencias por turno
  - Incidencias críticas (más frecuentes)
  - Zona con más incidencias
  - Cumplimiento de reportes

**Ejemplo de respuesta:**
```json
{
  "data": {
    "data": [
      {
        "id": "uuid",
        "offender": { "dni": "12345678", "shift": "Mañana" },
        "subject": { "name": "Falta disciplinaria" },
        "lack": { "name": "Dormir en horario laboral" },
        "date": "2025-01-15T10:00:00Z",
        "bodycam": { "name": "SG001" }
      }
    ],
    "currentPage": 1,
    "totalCount": 150,
    "pageCount": 10
  }
}
```

---

### 2. **Búsqueda de Offenders por DNI**
- **Componente:** `ModalIncidencia.jsx` (al crear incidencia)
- **Función API:** `searchOffenderByDNI(dni)`
- **Archivo:** `/src/api/offender.jsx`
- **Endpoint Backend:** `GET /offender/dni/{dni}`
- **Estado:** ✅ **FUNCIONANDO**
- **Puerto:** 3021 (según `VITE_API_OFFENDER_URL`)

**Ejemplo de respuesta:**
```json
{
  "data": {
    "dni": "75326418",
    "name": "JUAN CARLOS PEREZ LOPEZ",
    "shift": "Mañana",
    "job": "Sereno Conductor",
    "regime": "CAS",
    "subgerencia": "Zona Este"
  }
}
```

---

### 3. **Búsqueda de Bodycams**
- **Componente:** `ModalIncidencia.jsx`
- **Función API:** `searchBodycam(searchTerm)`
- **Archivo:** `/src/api/bodycam.jsx`
- **Endpoint Backend:** `GET /bodycam?search={term}`
- **Estado:** ✅ **FUNCIONANDO**

**Ejemplo de respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SG004",
      "status": "active",
      "assigned_to": "Juan Perez"
    }
  ]
}
```

---

### 4. **Lista de Asuntos y Faltas**
- **Componente:** `ModalIncidencia.jsx`
- **Función API:** `getSubjects()`
- **Archivo:** `/src/api/subject.jsx`
- **Endpoint Backend:** `GET /subject`
- **Estado:** ✅ **FUNCIONANDO**

**Ejemplo de respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Falta disciplinaria",
      "lacks": [
        { "id": "uuid", "name": "Dormir en horario laboral" },
        { "id": "uuid", "name": "Comer en horario laboral" }
      ]
    }
  ]
}
```

---

### 5. **Lista de Cargos/Puestos (Jobs)**
- **Componente:** `ModalIncidencia.jsx`
- **Función API:** `getJobs()`
- **Archivo:** `/src/api/job.jsx`
- **Endpoint Backend:** `GET /job`
- **Estado:** ✅ **FUNCIONANDO**

**Ejemplo de respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jefe de Operaciones"
    },
    {
      "id": "uuid",
      "name": "Coordinador"
    }
  ]
}
```

---

### 6. **Lista de Líderes/Destinatarios**
- **Componente:** `ModalIncidencia.jsx`
- **Función API:** `getLeadsByJob(jobId)` y `getAllLeads()`
- **Archivo:** `/src/api/job.jsx`
- **Endpoint Backend:** `GET /lead?job={jobId}` o `GET /lead`
- **Estado:** ✅ **FUNCIONANDO**

**Ejemplo de respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Carlos",
      "lastname": "Ramirez",
      "job": {
        "id": "uuid",
        "name": "Jefe de Operaciones"
      }
    }
  ]
}
```

---

### 7. **Auditoría**
- **Componente:** `AuditoriaPage.jsx` (si existe)
- **Función API:** Definida en `/src/api/audit.jsx`
- **Endpoint Backend:** `GET /audit` (probablemente)
- **Estado:** ✅ **ARCHIVO CREADO** (endpoint por confirmar)

---

## ❌ ENDPOINTS QUE FALTAN IMPLEMENTAR EN EL BACKEND

### 1. **Lista Completa de Offenders** ⚠️ PRIORITARIO
- **Componente afectado:** `PersonalTable.jsx` (Tabla de Centinelas)
- **Función API creada:** `getAllOffenders()`
- **Archivo:** `/src/api/statistics.jsx` (línea 74)
- **Endpoint esperado:** `GET /offender`
- **Estado:** ⚠️ **FRONTEND LISTO** - Backend debe implementar

**Respuesta esperada:**
```json
{
  "data": [
    {
      "dni": "12345678",
      "name": "JUAN PEREZ LOPEZ",
      "shift": "Mañana",
      "job": "Sereno Conductor",
      "regime": "CAS",
      "status": "active",
      "subgerencia": "Zona Este"
    },
    {
      "dni": "87654321",
      "name": "MARIA RODRIGUEZ GOMEZ",
      "shift": "Tarde",
      "job": "Sereno",
      "regime": "CAS",
      "status": "inactive",
      "subgerencia": "Zona Oeste"
    }
  ]
}
```

**Uso en el frontend:**
- Tabla de "Centinelas" en el Dashboard
- Muestra: nombre, turno, estado (en turno / fuera de turno)
- Calcula cantidad de serenos activos

**Fallback actual:**
Si el endpoint falla, muestra datos de ejemplo hardcodeados.

---

### 2. **Estadísticas de Supervisión de Campo** ⚠️ PRIORITARIO
- **Componente afectado:** `SupervisionCard.jsx`
- **Función API creada:** `getFieldSupervisionStats()`
- **Archivo:** `/src/api/statistics.jsx` (línea 47)
- **Endpoint esperado:** `GET /statistics/field-supervision`
- **Estado:** ⚠️ **FRONTEND LISTO** - Backend debe implementar

**Respuesta esperada:**
```json
{
  "data": {
    "serenosEnCampo": 18,
    "serenosSinConexion": 2,
    "nivelCumplimiento": 92
  }
}
```

**Descripción de campos:**
- `serenosEnCampo`: Cantidad de serenos actualmente trabajando
- `serenosSinConexion`: Serenos que perdieron conexión con el sistema
- `nivelCumplimiento`: Porcentaje de cumplimiento de protocolos (0-100)

**Uso en el frontend:**
- Card de "Supervisión de Campo" en el Dashboard
- Muestra gráfico circular con nivel de cumplimiento
- Alertas de serenos sin conexión

**Fallback actual:**
Valores por defecto: 18, 2, 92

---

### 3. **Personal Activo** 📊 OPCIONAL
- **Componente afectado:** Ninguno (preparado para uso futuro)
- **Función API creada:** `getActivePersonnel()`
- **Archivo:** `/src/api/statistics.jsx` (línea 33)
- **Endpoint esperado:** `GET /personnel/active`
- **Estado:** 📦 **PREPARADO** - No se usa actualmente

**Respuesta esperada:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Juan Perez",
      "position": "Sereno",
      "status": "active",
      "shift": "Mañana",
      "zone": "Zona Este"
    }
  ]
}
```

---

### 4. **Estadísticas Generales del Dashboard** 📊 OPCIONAL
- **Componente afectado:** Ninguno (preparado para uso futuro)
- **Función API creada:** `getDashboardStats()`
- **Archivo:** `/src/api/statistics.jsx` (línea 9)
- **Endpoint esperado:** `GET /statistics/dashboard`
- **Estado:** 📦 **PREPARADO** - No se usa actualmente

**Respuesta esperada:**
```json
{
  "data": {
    "totalIncidencias": 150,
    "incidenciasDelMes": 45,
    "porcentajeCambio": 10,
    "serenosActivos": 23,
    "zonaConMasIncidencias": "Zona Este",
    "asuntoMasFrecuente": "Falta disciplinaria"
  }
}
```

**Nota:** Actualmente estas estadísticas se calculan en el frontend desde los reportes.

---

## 🔄 CÓMO FUNCIONA ACTUALMENTE EL DASHBOARD

### Flujo de Carga de Datos:

1. **Al cargar el Dashboard** (`DashboardPage.jsx:30`)
   ```javascript
   useEffect(() => {
     fetchDashboardData()  // Llama a múltiples APIs
   }, [])
   ```

2. **fetchDashboardData()** intenta cargar:
   - ✅ Reportes desde `GET /report` (funciona)
   - ⚠️ Offenders desde `GET /offender` (falta en backend)
   - ⚠️ Supervisión desde `GET /statistics/field-supervision` (falta en backend)

3. **Si alguna API falla:**
   - Muestra warning en consola
   - Usa datos de fallback (localStorage o valores por defecto)
   - La aplicación sigue funcionando normalmente

4. **Cálculos en el Frontend:**
   - Total de incidencias: cuenta los reportes
   - Incidencias por mes: agrupa por fecha
   - Incidencias por turno: agrupa por turno
   - Zona con más incidencias: agrupa por jurisdicción
   - Cumplimiento de reportes: calcula porcentaje

---

## 📝 RECOMENDACIONES PARA EL BACKEND

### Alta Prioridad:
1. ✅ Implementar `GET /offender` - Lista completa de offenders
2. ✅ Implementar `GET /statistics/field-supervision` - Datos de supervisión en tiempo real

### Media Prioridad:
3. ✅ Implementar `GET /statistics/dashboard` - Estadísticas precalculadas
4. ✅ Agregar endpoint de auditoría completo

### Baja Prioridad:
5. 📊 `GET /personnel/active` - Personal activo (alternativa a offenders)

---

## 🛠️ TESTING DE ENDPOINTS

### Para verificar que un endpoint funciona:

1. **Abrir DevTools del navegador (F12)**
2. **Ir a la pestaña Network**
3. **Recargar el Dashboard**
4. **Buscar las peticiones:**
   - ✅ Verde = Funcionando (status 200)
   - ❌ Rojo = Error (status 404, 500, etc.)

### Peticiones esperadas al cargar Dashboard:
```
GET /report?page=1&limit=1000          ✅ Funciona
GET /offender                          ❌ Falta implementar
GET /statistics/field-supervision      ❌ Falta implementar
```

---

## 📊 RESUMEN VISUAL

| Dato del Dashboard | Fuente de Datos | Estado Backend | Fallback |
|-------------------|----------------|----------------|----------|
| Total Incidencias | `GET /report` | ✅ Funciona | localStorage |
| Serenos Activos | `GET /offender` | ❌ Falta | Valor: 23 |
| Incidencias Críticas | Cálculo Frontend | ✅ N/A | - |
| Zona con Más Incidencias | Cálculo Frontend | ✅ N/A | - |
| Cumplimiento Reportes | Cálculo Frontend | ✅ N/A | - |
| Supervisión Campo | `GET /statistics/field-supervision` | ❌ Falta | Valores: 18,2,92 |
| Tabla Centinelas | `GET /offender` | ❌ Falta | 5 personas ejemplo |
| Evolución Mensual | Cálculo Frontend | ✅ N/A | - |
| Gráfico de Barras | Cálculo Frontend | ✅ N/A | - |
| Lista de Turnos | Cálculo Frontend | ✅ N/A | - |

---

## 🚀 PRÓXIMOS PASOS

1. **Backend Team:**
   - Implementar `GET /offender` (devolver lista completa de offenders)
   - Implementar `GET /statistics/field-supervision` (datos de supervisión en tiempo real)
   - Probar endpoints con Postman/Insomnia

2. **Frontend Team:**
   - Verificar que los endpoints funcionen cuando estén listos
   - Remover fallbacks si ya no son necesarios
   - Agregar manejo de errores mejorado

3. **Testing:**
   - Verificar que el Dashboard cargue correctamente con datos reales
   - Probar escenarios de error (API caída, sin datos, etc.)
   - Validar que los datos se actualicen correctamente

---

## 📞 CONTACTO

Si tienes dudas sobre algún endpoint o necesitas más detalles sobre la estructura de datos, revisa:
- `/src/api/` - Todos los archivos de API
- `/src/pages/Dashboard/` - Componentes del Dashboard
- `CLAUDE.md` - Documentación general del proyecto

**Última actualización:** 2025-01-04
