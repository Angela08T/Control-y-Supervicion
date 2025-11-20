# 📊 Fuentes de Datos del Dashboard - Sistema Centinela

## 🎯 Documento de Referencia

Este documento explica **de dónde viene cada dato** que se muestra en cada cuadro del Dashboard.

---

## 📍 FILA 1: Cards Superiores (stats-grid)

### 1️⃣ **Total de Incidencias**

**Componente:** `StatCard`
**Ubicación:** DashboardPage.jsx línea 195-202

**Fuente de datos:**
```javascript
value={stats.totalIncidencias}
```

**Origen:**
- **Variable:** `stats.totalIncidencias` (línea 91)
- **Cálculo:** `const totalIncidencias = filtered.length`
- **Datos base:** Array `filtered` que viene de `incidencias`

**Cadena de origen:**
```
1. useEffect() -> fetchDashboardData() (línea 30)
2. API: getReports(1, 1000) - GET /report (línea 36)
3. Si API falla -> localStorage: loadIncidencias() (línea 17)
4. Filtrado por dateRange (líneas 24-28)
5. Cuenta total: filtered.length (línea 91)
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (si está activo)
- ✅ Icono con calendario permite seleccionar fechas

**Cambio porcentual:**
- **Variable:** `stats.cambioIncidencias` (línea 94)
- **Cálculo:** `totalIncidencias > 0 ? '+10%' : '0%'`
- **Tipo:** Simulado (hardcoded)

---

### 2️⃣ **Serenos Activos**

**Componente:** `StatCard`
**Ubicación:** DashboardPage.jsx línea 204-210

**Fuente de datos:**
```javascript
value={serenosActivos}
```

**Origen:**
- **Variable:** `serenosActivos` (state, línea 20)
- **Inicialización:** `useState(0)`

**Cadena de origen:**
```
1. useEffect() -> fetchDashboardData() (línea 30)
2. API: getAllOffenders() - GET /offender (línea 47)
3. Filtro: offendersResponse.data.filter(o => o.status === 'active') (línea 48)
4. Cuenta: .length
5. Si API falla -> Valor por defecto: 23 (línea 52)
```

**Filtros aplicados:**
- ✅ Solo offenders con `status === 'active'`
- ❌ NO se filtra por fecha

**Cambio porcentual:**
- **Variable:** `stats.cambioSerenos` (línea 97)
- **Cálculo:** `serenosActivos > 20 ? '+5%' : '0%'`
- **Tipo:** Calculado basado en cantidad

---

### 3️⃣ **Incidencias Críticas**

**Componente:** `StatCard`
**Ubicación:** DashboardPage.jsx línea 212-219

**Fuente de datos:**
```javascript
value={stats.totalCriticas}
subtitle={stats.asuntoMasFrecuente}
```

**Origen:**
- **Variable:** `stats.totalCriticas` (línea 107) y `stats.asuntoMasFrecuente` (línea 103)
- **Datos base:** Array `filtered` (incidencias filtradas)

**Cadena de origen:**
```
1. Mismo origen que "Total de Incidencias" (filtered)
2. Agrupa por campo 'asunto' (líneas 100-102):
   - Cuenta cuántas veces aparece cada asunto
   - Ejemplo: { "Falta disciplinaria": 15, "Inasistencia": 20 }
3. Encuentra el asunto más frecuente (líneas 103-106)
4. totalCriticas = cantidad del asunto más frecuente
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (hereda de filtered)
- ✅ Solo cuenta el asunto que más se repite

**Cambio porcentual:**
- **Valor:** `"+12%"` (línea 216)
- **Tipo:** Hardcoded (no calculado)

---

### 4️⃣ **Zona con Más Incidencias**

**Componente:** `StatCard`
**Ubicación:** DashboardPage.jsx línea 221-228

**Fuente de datos:**
```javascript
value={stats.totalZona}
subtitle={stats.zonaConMas}
```

**Origen:**
- **Variable:** `stats.totalZona` (línea 120) y `stats.zonaConMas` (línea 116)
- **Datos base:** Array `filtered` (incidencias filtradas)

**Cadena de origen:**
```
1. Mismo origen que "Total de Incidencias" (filtered)
2. Agrupa por campo 'jurisdiccion' (líneas 110-115):
   - Solo si inc.jurisdiccion existe
   - Cuenta cuántas veces aparece cada jurisdicción
   - Ejemplo: { "Zona Este": 25, "Zona Oeste": 18 }
3. Encuentra la jurisdicción más frecuente (líneas 116-119)
4. totalZona = cantidad de la zona más frecuente
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (hereda de filtered)
- ✅ Ignora incidencias sin jurisdicción
- ✅ Solo cuenta la zona que más se repite

**Cambio porcentual:**
- **Valor:** `"+8%"` (línea 225)
- **Tipo:** Hardcoded (no calculado)

---

## 📍 FILA 2: Middle Grid

### 5️⃣ **WelcomeCard (Tarjeta de Bienvenida)**

**Componente:** `WelcomeCard`
**Ubicación:** DashboardPage.jsx línea 233-235

**Fuente de datos:**
```javascript
message="Revisa el control de las incidencias y el desempeño del equipo"
```

**Origen:**
- **Username:** Redux store `state.auth.username` (WelcomeCard.jsx línea 5)
- **Mensaje:** Hardcoded (prop message)
- **Logo:** `/src/assets/lobo.png` (WelcomeCard.jsx línea 21)

**Cadena de origen:**
```
1. Redux: useSelector((state) => state.auth)
2. Muestra: username del usuario logueado
3. Mensaje: Prop estático pasado desde DashboardPage
```

**Filtros aplicados:**
- ❌ Ninguno (es una tarjeta informativa)

---

### 6️⃣ **Cumplimiento de Reportes**

**Componente:** `CircularProgress`
**Ubicación:** DashboardPage.jsx línea 237-241

**Fuente de datos:**
```javascript
percentage={stats.porcentajeCumplimiento}
```

**Origen:**
- **Variable:** `stats.porcentajeCumplimiento` (línea 125)
- **Datos base:** `totalIncidencias` (del array filtered)

**Cadena de origen:**
```
1. Mismo origen que "Total de Incidencias" (filtered)
2. pdfDescargados = totalIncidencias * 0.95 (línea 123)
   - Simulación: asume 95% de reportes generados
3. porcentajeCumplimiento = (pdfDescargados / totalIncidencias) * 100 (línea 126)
4. Resultado redondeado: Math.round()
```

**Cálculo:**
```javascript
const pdfDescargados = Math.floor(totalIncidencias * 0.95)
const porcentajeCumplimiento = totalIncidencias > 0
  ? Math.round((pdfDescargados / totalIncidencias) * 100)
  : 0
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (hereda de totalIncidencias)
- ⚠️ El cálculo es simulado (95% fijo)

**Nota:** Este dato debería venir de un endpoint real que cuente cuántos PDFs se han generado.

---

### 7️⃣ **Supervisión de Campo**

**Componente:** `SupervisionCard`
**Ubicación:** DashboardPage.jsx línea 243-247

**Fuente de datos:**
```javascript
serenosEnCampo={supervisionData.serenosEnCampo}
serenosSinConexion={supervisionData.serenosSinConexion}
nivelCumplimiento={supervisionData.nivelCumplimiento}
```

**Origen:**
- **Variable:** `supervisionData` (state, línea 21-25)
- **Inicialización:** `{ serenosEnCampo: 0, serenosSinConexion: 0, nivelCumplimiento: 0 }`

**Cadena de origen:**
```
1. useEffect() -> fetchDashboardData() (línea 30)
2. API: getFieldSupervisionStats() - GET /statistics/field-supervision (línea 57)
3. Si API responde:
   - supervisionData.serenosEnCampo = response.data.serenosEnCampo || 18
   - supervisionData.serenosSinConexion = response.data.serenosSinConexion || 2
   - supervisionData.nivelCumplimiento = response.data.nivelCumplimiento || 92
4. Si API falla -> Valores por defecto: 18, 2, 92 (líneas 68-72)
```

**Filtros aplicados:**
- ❌ Ninguno (son datos de estado actual en tiempo real)
- ❌ NO se filtra por fecha (representa estado actual)

**Estado del endpoint:**
- ⚠️ **Endpoint NO implementado en backend**
- ✅ Frontend preparado y esperando
- 🔄 Usa valores por defecto mientras tanto

---

## 📍 FILA 3: Gráficos (charts-grid)

### 8️⃣ **Evolución de Incidencias (LineChart)**

**Componente:** `LineChart`
**Ubicación:** DashboardPage.jsx línea 252-256

**Fuente de datos:**
```javascript
data={stats.incidenciasPorMes}
```

**Origen:**
- **Variable:** `stats.incidenciasPorMes` (línea 130-149)
- **Datos base:** Array `filtered` (incidencias filtradas)

**Cadena de origen:**
```
1. Mismo origen que "Total de Incidencias" (filtered)
2. Inicializa objeto con 12 meses (Ene-Dic) (líneas 131-139)
   Estructura: { 'Ene': { 'Falta disciplinaria': 0, ... }, ... }
3. Itera cada incidencia en filtered (líneas 141-149):
   - Extrae el mes de fechaIncidente
   - Incrementa el contador para ese mes y asunto
4. Resultado: Objeto con conteo mensual por tipo de asunto
```

**Estructura de datos resultante:**
```javascript
{
  'Ene': { 'Falta disciplinaria': 3, 'Abandono de servicio': 1, 'Inasistencia': 5 },
  'Feb': { 'Falta disciplinaria': 2, 'Abandono de servicio': 0, 'Inasistencia': 7 },
  // ... resto de meses
}
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (hereda de filtered)
- ✅ Agrupa por mes (usa fecha.getMonth())
- ✅ Separa por tipo de asunto

**Visualización:**
- 🔵 Línea azul: Falta disciplinaria
- 🟣 Línea morada: Abandono de servicio
- 🟢 Línea verde: Inasistencia

---

### 9️⃣ **Incidencias por Tipo (BarChart)**

**Componente:** `BarChart`
**Ubicación:** DashboardPage.jsx línea 258-262

**Fuente de datos:**
```javascript
data={stats.incidenciasPorAsunto}
```

**Origen:**
- **Variable:** `stats.incidenciasPorAsunto` (línea 164-168)
- **Datos base:** `conteoAsuntos` (ya calculado para "Incidencias Críticas")

**Cadena de origen:**
```
1. Mismo origen que "Incidencias Críticas" (conteoAsuntos)
2. Usa el mismo objeto de conteo por asunto (líneas 100-102)
3. Crea objeto simplificado (líneas 164-168):
   {
     'Falta disciplinaria': cantidad o 0,
     'Abandono de servicio': cantidad o 0,
     'Inasistencia': cantidad o 0
   }
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (hereda de filtered)
- ✅ Solo 3 tipos de asunto específicos

**Visualización:**
- 📊 Barra para cada tipo de asunto
- 🎨 Colores diferentes por tipo

---

## 📍 FILA 4: Bottom Grid

### 🔟 **Tabla de Centinelas (PersonalTable)**

**Componente:** `PersonalTable`
**Ubicación:** DashboardPage.jsx línea 267

**Fuente de datos:**
```javascript
// No recibe props del Dashboard
// Tiene su propia lógica de carga
```

**Origen:**
- **Variable interna:** `personal` (PersonalTable.jsx línea 6)
- **Inicialización:** `useState([])`

**Cadena de origen:**
```
1. useEffect() -> fetchPersonal() (PersonalTable.jsx línea 10)
2. API: getAllOffenders() - GET /offender (línea 15)
3. Transformación de datos (líneas 18-30):
   - name -> nombre
   - shift -> turno
   - status === 'active' -> activo
   - Genera iniciales para avatar
4. Si API falla -> Array con 5 personas de ejemplo (líneas 36-42)
```

**Estructura de datos:**
```javascript
[
  {
    nombre: "Juan Perez",
    turno: "Mañana",
    activo: true,
    avatar: "JP",
    dni: "12345678"
  }
]
```

**Filtros aplicados:**
- ❌ Ninguno (muestra todos los offenders)
- ✅ Compara turno con hora actual para estado "En turno" / "Fuera de turno"

**Cálculo de estado:**
```javascript
const turnoActual = () => {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 14) return 'Mañana'
  if (hora >= 14 && hora < 22) return 'Tarde'
  return 'Noche'
}
const esSuTurno = persona.turno === enTurno
```

**Estado del endpoint:**
- ⚠️ **Endpoint NO implementado en backend**
- ✅ Frontend preparado y esperando
- 🔄 Usa datos de ejemplo mientras tanto

---

### 1️⃣1️⃣ **Lista de Turnos (TurnoList)**

**Componente:** `TurnoList`
**Ubicación:** DashboardPage.jsx línea 269-271

**Fuente de datos:**
```javascript
data={stats.incidenciasPorTurno}
```

**Origen:**
- **Variable:** `stats.incidenciasPorTurno` (línea 151-160)
- **Datos base:** Array `filtered` (incidencias filtradas)

**Cadena de origen:**
```
1. Mismo origen que "Total de Incidencias" (filtered)
2. Inicializa objeto con 3 turnos (líneas 151-155):
   { 'Mañana': 0, 'Tarde': 0, 'Noche': 0 }
3. Itera cada incidencia en filtered (líneas 157-160):
   - Si tiene campo 'turno' válido
   - Incrementa contador para ese turno
4. Resultado: Objeto con conteo por turno
```

**Estructura de datos resultante:**
```javascript
{
  'Mañana': 15,
  'Tarde': 12,
  'Noche': 20
}
```

**Filtros aplicados:**
- ✅ Filtro por rango de fechas (hereda de filtered)
- ✅ Solo cuenta turnos válidos (Mañana/Tarde/Noche)
- ✅ Ignora incidencias sin turno

---

## 🔄 Resumen de Fuentes de Datos

### 📊 Datos de API (Backend)

| Componente | Endpoint | Estado | Fallback |
|-----------|----------|--------|----------|
| Total Incidencias | `GET /report` | ✅ Funciona | localStorage |
| Serenos Activos | `GET /offender` | ❌ Falta | Valor: 23 |
| Supervisión Campo | `GET /statistics/field-supervision` | ❌ Falta | 18, 2, 92 |
| Tabla Centinelas | `GET /offender` | ❌ Falta | 5 personas ejemplo |

### 🧮 Datos Calculados (Frontend)

| Componente | Base de Cálculo | Filtro por Fecha |
|-----------|----------------|------------------|
| Incidencias Críticas | filtered (incidencias) | ✅ Sí |
| Zona con Más Incidencias | filtered (incidencias) | ✅ Sí |
| Cumplimiento Reportes | totalIncidencias * 0.95 | ✅ Sí |
| Evolución Mensual | filtered (incidencias) | ✅ Sí |
| Gráfico de Barras | filtered (incidencias) | ✅ Sí |
| Lista de Turnos | filtered (incidencias) | ✅ Sí |

### 📝 Datos Estáticos

| Componente | Tipo |
|-----------|------|
| WelcomeCard | Usuario de Redux + mensaje prop |
| Cambios % (críticas) | Hardcoded "+12%" |
| Cambios % (zona) | Hardcoded "+8%" |

---

## 🎯 Filtros Aplicables

### 📅 Filtro por Rango de Fechas

**Afecta a:**
- ✅ Total de Incidencias
- ✅ Incidencias Críticas
- ✅ Zona con Más Incidencias
- ✅ Cumplimiento de Reportes
- ✅ Evolución de Incidencias (gráfico líneas)
- ✅ Incidencias por Tipo (gráfico barras)
- ✅ Lista de Turnos

**NO afecta a:**
- ❌ Serenos Activos (es estado actual)
- ❌ Supervisión de Campo (es estado actual)
- ❌ Tabla de Centinelas (es estado actual)
- ❌ WelcomeCard (es informativo)

**Cómo funciona:**
```javascript
// DashboardPage.jsx líneas 24-28
if (dateRange.start && dateRange.end) {
  filtered = incidencias.filter(inc => {
    const fecha = new Date(inc.fechaIncidente)
    return fecha >= dateRange.start && fecha <= dateRange.end
  })
}
```

---

## 📈 Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CARGA INICIAL (useEffect al montar componente)          │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │   fetchDashboardData()              │
        └─────────────────────────────────────┘
                 ↓           ↓           ↓
        ┌────────┐   ┌────────┐   ┌────────┐
        │ API    │   │ API    │   │ API    │
        │Reports │   │Offender│   │Superv. │
        └────────┘   └────────┘   └────────┘
             ↓            ↓            ↓
        ┌────────┐   ┌────────┐   ┌────────┐
        │inciden │   │serenos │   │superv  │
        │cias    │   │Activos │   │Data    │
        └────────┘   └────────┘   └────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. APLICAR FILTROS (useMemo al cambiar datos/filtros)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │   Filtro por dateRange              │
        │   incidencias -> filtered           │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │   Calcular Estadísticas (stats)     │
        │   - totalIncidencias                │
        │   - asuntoMasFrecuente              │
        │   - zonaConMas                      │
        │   - incidenciasPorMes               │
        │   - incidenciasPorTurno             │
        │   - porcentajeCumplimiento          │
        └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. RENDERIZAR COMPONENTES                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌────────────────┬───────────────┬──────────────┐
        │  StatCards     │  CircularProg │  Supervision │
        │  (stats.*)     │  (stats.%)    │  (superv*)   │
        └────────────────┴───────────────┴──────────────┘
        ┌────────────────┬───────────────┐
        │  LineChart     │  BarChart     │
        │  (stats.mes)   │  (stats.asunto│
        └────────────────┴───────────────┘
        ┌────────────────┬───────────────┐
        │ PersonalTable  │  TurnoList    │
        │ (API propia)   │  (stats.turno)│
        └────────────────┴───────────────┘
```

---

**Última actualización:** 2025-01-04
