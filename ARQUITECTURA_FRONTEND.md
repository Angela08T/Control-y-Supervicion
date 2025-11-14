# Documentación de Arquitectura Frontend - Sistema Centinela

**React + Vite - Sistema de Control y Supervisión**

---

## Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Flujo de Datos](#flujo-de-datos)
4. [Capa de API](#capa-de-api)
5. [Gestión de Estado](#gestión-de-estado)
6. [Componentes Principales](#componentes-principales)
7. [Routing y Navegación](#routing-y-navegación)
8. [Sistema de Permisos](#sistema-de-permisos)
9. [Guía de Desarrollo](#guía-de-desarrollo)

---

## Stack Tecnológico

### Core
- **React** 18.2.0 - Librería de UI
- **Vite** 5.0.8 - Build tool y dev server
- **React Router DOM** 6.21.2 - Routing
- **Redux Toolkit** 2.0.1 - Gestión de estado
- **Redux Persist** 6.0.0 - Persistencia de estado

### UI y Estilos
- **CSS Custom** - Estilos personalizados
- **React Icons** 5.0.1 - Iconos

### Mapas y Geolocalización
- **Leaflet** 1.9.4 - Librería de mapas
- **React Leaflet** 4.2.1 - Integración React-Leaflet

### PDF y Documentos
- **@react-pdf/renderer** 3.4.5 - Generación de PDFs
- **jsPDF** 2.5.2 - Librería PDF alternativa

### HTTP Client
- **Axios** 1.6.5 - Cliente HTTP

### Utilidades
- **Buffer** - Polyfill para Node.js APIs en navegador

---

## Estructura de Carpetas

```
Control-y-Supervicion/
│
├── public/                          # Archivos públicos estáticos
│   ├── leaflet/                     # Recursos de Leaflet
│   │   ├── marker-icon.png
│   │   ├── marker-icon-2x.png
│   │   └── marker-shadow.png
│   └── vite.svg
│
├── src/                             # Código fuente
│   │
│   ├── api/                         # 📡 Capa de comunicación con backend
│   │   ├── config.jsx               # Configuración base de Axios
│   │   ├── auth.jsx                 # Endpoints de autenticación
│   │   ├── audit.jsx                # Endpoints de auditoría
│   │   ├── bodycam.jsx              # Endpoints de bodycams
│   │   ├── job.jsx                  # Endpoints de cargos
│   │   ├── jurisdiction.jsx         # Endpoints de jurisdicciones
│   │   ├── lack.jsx                 # Endpoints de faltas
│   │   ├── lead.jsx                 # Endpoints de personal
│   │   ├── offender.jsx             # Endpoints de infractores
│   │   ├── report.jsx               # Endpoints de incidencias/reportes
│   │   ├── statistics.jsx           # Endpoints de estadísticas
│   │   ├── subject.jsx              # Endpoints de asuntos
│   │   └── user.jsx                 # Endpoints de usuarios
│   │
│   ├── assets/                      # Recursos estáticos
│   │   ├── logo-sjl.png             # Logo de San Juan de Lurigancho
│   │   └── captcha/                 # Imágenes CAPTCHA
│   │
│   ├── components/                  # 🧩 Componentes reutilizables
│   │   ├── UI/                      # Componentes de interfaz
│   │   │   ├── Sidebar.jsx          # Menú lateral
│   │   │   └── Topbar.jsx           # Barra superior
│   │   │
│   │   ├── BodycamTable.jsx         # Tabla de bodycams
│   │   ├── IncidenciasTable.jsx     # Tabla de incidencias
│   │   ├── JobTable.jsx             # Tabla de cargos
│   │   ├── LackTable.jsx            # Tabla de faltas
│   │   ├── LeadTable.jsx            # Tabla de personal
│   │   ├── OffenderTable.jsx        # Tabla de infractores
│   │   ├── SubjectTable.jsx         # Tabla de asuntos
│   │   ├── UserTable.jsx            # Tabla de usuarios
│   │   │
│   │   ├── ModalBodycam.jsx         # Modal CRUD bodycam
│   │   ├── ModalIncidencia.jsx      # Modal CRUD incidencia
│   │   ├── ModalJob.jsx             # Modal CRUD cargo
│   │   ├── ModalLack.jsx            # Modal CRUD falta
│   │   ├── ModalLead.jsx            # Modal CRUD personal
│   │   ├── ModalOffender.jsx        # Modal CRUD infractor
│   │   ├── ModalPDFInforme.jsx      # Modal generación PDF
│   │   ├── ModalSubject.jsx         # Modal CRUD asunto
│   │   ├── ModalUser.jsx            # Modal CRUD usuario
│   │   │
│   │   ├── MapSelector.jsx          # Selector de ubicación en mapa
│   │   ├── PDFDocument.jsx          # Documento PDF (react-pdf)
│   │   │
│   │   └── Login/                   # Componentes de login
│   │       └── LoginForm.jsx
│   │
│   ├── hooks/                       # 🎣 Custom Hooks
│   │   ├── Bodycam/
│   │   │   └── useBodycams.js       # Hook para gestión de bodycams
│   │   ├── Job/
│   │   │   └── useJobs.js           # Hook para gestión de cargos
│   │   ├── Lack/
│   │   │   └── useLacks.js          # Hook para gestión de faltas
│   │   ├── Lead/
│   │   │   └── useLeads.js          # Hook para gestión de personal
│   │   ├── Offender/
│   │   │   ├── useOffenders.js      # Hook para gestión de infractores
│   │   │   └── useOffenderSearch.js # Hook para búsqueda de infractores
│   │   ├── Subject/
│   │   │   └── useSubjects.js       # Hook para gestión de asuntos
│   │   └── User/
│   │       └── useUsers.js          # Hook para gestión de usuarios
│   │
│   ├── layouts/                     # 📐 Layouts por rol
│   │   ├── DashboardLayoutAdmin.jsx       # Layout para admin
│   │   ├── DashboardLayoutSupervisor.jsx  # Layout para supervisor
│   │   ├── DashboardLayoutCentinela.jsx   # Layout para centinela
│   │   └── DashboardLayoutValidator.jsx   # Layout para validator
│   │
│   ├── pages/                       # 📄 Páginas principales
│   │   ├── Dashboard/
│   │   │   ├── DashboardPage.jsx    # Página principal dashboard
│   │   │   └── components/          # Componentes del dashboard
│   │   │       ├── StatCard.jsx
│   │   │       ├── LineChart.jsx
│   │   │       ├── BarChart.jsx
│   │   │       ├── PersonalTable.jsx
│   │   │       ├── SupervisionCard.jsx
│   │   │       ├── DateCard.jsx
│   │   │       ├── WelcomeCard.jsx
│   │   │       ├── TurnoList.jsx
│   │   │       ├── CircularProgress.jsx
│   │   │       ├── DateRangeModal.jsx
│   │   │       └── CalendarModal.jsx
│   │   │
│   │   ├── Incidencias/
│   │   │   └── IncidenciasPage.jsx  # Gestión de incidencias
│   │   ├── Bodycam/
│   │   │   └── BodycamPage.jsx      # Gestión de bodycams
│   │   ├── Usuarios/
│   │   │   └── UsuariosPage.jsx     # Gestión de usuarios
│   │   ├── Jobs/
│   │   │   └── JobsPage.jsx         # Gestión de cargos
│   │   ├── Leads/
│   │   │   └── LeadsPage.jsx        # Gestión de personal
│   │   ├── Subject/
│   │   │   └── SubjectPage.jsx      # Gestión de asuntos
│   │   ├── Lack/
│   │   │   └── LackPage.jsx         # Gestión de faltas
│   │   ├── Offender/
│   │   │   └── OffenderPage.jsx     # Gestión de infractores
│   │   ├── Auditoria/
│   │   │   └── AuditoriaPage.jsx    # Auditoría del sistema
│   │   │
│   │   ├── LoginPage.jsx            # Página de login
│   │   ├── UnauthorizedPage.jsx     # Página de no autorizado
│   │   └── NotFoundPage.jsx         # Página 404
│   │
│   ├── routes/                      # 🛣️ Configuración de rutas
│   │   ├── Router.jsx               # Configuración principal de rutas
│   │   ├── PrivateRoute.jsx         # HOC para rutas protegidas
│   │   └── PublicRoute.jsx          # HOC para rutas públicas
│   │
│   ├── store/                       # 🏪 Redux Store
│   │   ├── index.js                 # Configuración del store
│   │   └── slices/
│   │       └── authSlice.js         # Slice de autenticación
│   │
│   ├── utils/                       # 🛠️ Utilidades
│   │   ├── permissions.js           # Sistema de permisos
│   │   └── storage.js               # Gestión de localStorage
│   │
│   ├── App.jsx                      # Componente raíz
│   ├── main.jsx                     # Entry point
│   └── styles.css                   # Estilos globales
│
├── index.html                       # HTML principal
├── vite.config.js                   # Configuración de Vite
├── package.json                     # Dependencias
├── .gitignore
│
├── MODULOS_Y_PERMISOS.md           # 📚 Doc de módulos y permisos
└── ARQUITECTURA_FRONTEND.md         # 📚 Este documento
```

---

## Flujo de Datos

### Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
│                     (Navegador Web)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE VISTA                             │
│  - Components (UI)                                           │
│  - Pages (Páginas principales)                               │
│  - Layouts (Estructuras por rol)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 CAPA DE LÓGICA                               │
│  - Custom Hooks (Lógica reutilizable)                        │
│  - Redux Store (Estado global)                               │
│  - Utils (Validaciones, permisos)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE API                                 │
│  - Axios Instance (config.jsx)                               │
│  - API Modules (auth, user, report, etc.)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                              │
│          http://192.168.137.217:3021/api                     │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de una Petición HTTP Completa

**Ejemplo: Crear una nueva incidencia**

```javascript
// 1. USUARIO interactúa con UI
Usuario hace clic en "Crear Incidencia" en IncidenciasPage.jsx
          ↓
// 2. PÁGINA maneja el evento
IncidenciasPage.jsx → handleCreate()
          ↓
// 3. LLAMA A CUSTOM HOOK (opcional)
useReports.js → createReport(data)
          ↓
// 4. CUSTOM HOOK llama a API
import { createReport } from '../../api/report'
await createReport(reportData)
          ↓
// 5. MÓDULO API prepara petición
src/api/report.jsx
export const createReport = async (data) => {
  const response = await api.post('/report', data)
  return response.data
}
          ↓
// 6. AXIOS INSTANCE ejecuta petición
src/api/config.jsx
const api = axios.create({
  baseURL: 'http://192.168.137.217:3021/api',
  headers: { Authorization: `Bearer ${token}` }
})
          ↓
// 7. BACKEND procesa
POST http://192.168.137.217:3021/api/report
          ↓
// 8. RESPUESTA DEL BACKEND
{
  message: "Reporte creado exitosamente",
  data: { id: 123, ... }
}
          ↓
// 9. API retorna datos
return response.data
          ↓
// 10. CUSTOM HOOK actualiza estado local
setReports([...reports, newReport])
          ↓
// 11. COMPONENTE se re-renderiza
React detecta cambio de estado → Re-render
          ↓
// 12. UI se actualiza
Usuario ve la nueva incidencia en la tabla
```

---

## Capa de API

### Configuración Base (`src/api/config.jsx`)

```javascript
import axios from 'axios'

// Instancia base de Axios
const api = axios.create({
  baseURL: 'http://192.168.137.217:3021/api',
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de Request - Agrega token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de Response - Maneja errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido - Logout automático
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Módulos de API

Cada módulo de API sigue la misma estructura:

#### Estructura de Módulo API

```javascript
// src/api/[modulo].jsx
import api from './config'

// GET - Obtener lista (con paginación)
export const get[Modulos] = async (page = 1, limit = 10) => {
  const response = await api.get('/[modulo]', {
    params: { page, limit }
  })
  return response.data
}

// GET - Buscar por criterio
export const search[Modulo] = async (searchTerm) => {
  const response = await api.get('/[modulo]', {
    params: { search: searchTerm }
  })
  return response.data
}

// GET - Obtener por ID
export const get[Modulo]ById = async (id) => {
  const response = await api.get(`/[modulo]/${id}`)
  return response.data
}

// POST - Crear
export const create[Modulo] = async (data) => {
  const response = await api.post('/[modulo]', data)
  return response.data
}

// PATCH - Actualizar
export const update[Modulo] = async (id, data) => {
  const response = await api.patch(`/[modulo]/${id}`, data)
  return response.data
}

// DELETE - Eliminar (soft delete)
export const delete[Modulo] = async (id) => {
  const response = await api.delete(`/[modulo]/${id}`)
  return response.data
}
```

#### Ejemplo Real: `src/api/offender.jsx`

```javascript
import api from './config'

// GET /offender?page=1&limit=10
export const getOffenders = async (page = 1, limit = 10) => {
  const response = await api.get('/offender', {
    params: { page, limit }
  })
  return response.data
}

// GET /offender/dni/12345678
export const getOffenderByDni = async (dni) => {
  const response = await api.get(`/offender/dni/${dni}`)
  return response.data
}

// POST /offender
export const createOffender = async (offenderData) => {
  const response = await api.post('/offender', offenderData)
  return response.data
}

// PATCH /offender/123
export const updateOffender = async (offenderId, offenderData) => {
  const response = await api.patch(`/offender/${offenderId}`, offenderData)
  return response.data
}

// DELETE /offender/123
export const deleteOffender = async (offenderId) => {
  const response = await api.delete(`/offender/${offenderId}`)
  return response.data
}
```

### Mapa Completo de Endpoints

| Módulo | Archivo API | Endpoint Base | Métodos Disponibles |
|--------|-------------|---------------|---------------------|
| Auth | `auth.jsx` | `/auth` | POST /login, POST /register, POST /logout |
| Users | `user.jsx` | `/user` | GET, GET /:id, POST, PATCH /:id, DELETE /:id |
| Bodycams | `bodycam.jsx` | `/bodycam` | GET, GET /:id, POST, PATCH /:id, DELETE /:id |
| Jobs | `job.jsx` | `/job` | GET, GET /:id, POST, PATCH /:id, DELETE /:id |
| Leads | `lead.jsx` | `/lead` | GET, GET /:id, POST, PATCH /:id, DELETE /:id |
| Subjects | `subject.jsx` | `/subject` | GET, GET /:id, POST, PATCH /:id, DELETE /:id |
| Lacks | `lack.jsx` | `/lack`, `/lack?search=` | GET, POST, PATCH /:id, DELETE /:id |
| Offenders | `offender.jsx` | `/offender`, `/offender/dni/:dni` | GET, GET /dni/:dni, POST, PATCH /:id, DELETE /:id |
| Reports | `report.jsx` | `/report` | GET, GET /:id, POST, PATCH /:id, DELETE /:id, POST /evidence |
| Statistics | `statistics.jsx` | `/statistics/*`, `/dashboard/*` | GET /dashboard, GET /field-supervision, GET /trends |
| Audit | `audit.jsx` | `/audit` | GET |
| Jurisdiction | `jurisdiction.jsx` | `/jurisdiction` | GET |

---

## Gestión de Estado

### Redux Store

```javascript
// src/store/index.js
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // Solo persistir auth
}

const persistedReducer = persistReducer(persistConfig, authReducer)

export const store = configureStore({
  reducer: {
    auth: persistedReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
})

export const persistor = persistStore(store)
```

### Auth Slice

```javascript
// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  username: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.role = action.payload.role
      state.username = action.payload.username
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.role = null
      state.username = null
    }
  }
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
```

### Usar Estado en Componentes

```javascript
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'

function MyComponent() {
  // Leer estado
  const { role, username, token } = useSelector((state) => state.auth)

  // Despachar acciones
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logout())
  }

  return <div>Hola {username}</div>
}
```

---

## Componentes Principales

### Estructura de un Componente Página

**Ejemplo: OffenderPage.jsx**

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getOffenders, createOffender, updateOffender, deleteOffender } from '../../api/offender'
import { hasPermission } from '../../utils/permissions'
import OffenderTable from '../../components/OffenderTable'
import ModalOffender from '../../components/ModalOffender'

// 2. Componente Principal
export default function OffenderPage() {
  // 3. Estado Local
  const [offenders, setOffenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOffender, setEditingOffender] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
  })

  // 4. Redux State
  const { role } = useSelector((state) => state.auth)

  // 5. Permisos
  const canCreate = hasPermission(role, 'offenders', 'create')
  const canEdit = hasPermission(role, 'offenders', 'edit')
  const canDelete = hasPermission(role, 'offenders', 'delete')

  // 6. Effects
  useEffect(() => {
    fetchOffenders()
  }, [pagination.currentPage, pagination.itemsPerPage])

  // 7. Funciones de API
  const fetchOffenders = async () => {
    setLoading(true)
    try {
      const response = await getOffenders(
        pagination.currentPage,
        pagination.itemsPerPage
      )
      setOffenders(response.data || [])
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages || 1
      }))
    } catch (error) {
      console.error('Error fetching offenders:', error)
    }
    setLoading(false)
  }

  const handleCreate = async (data) => {
    try {
      await createOffender(data)
      fetchOffenders()
      setModalOpen(false)
    } catch (error) {
      console.error('Error creating offender:', error)
      throw error
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      await updateOffender(id, data)
      fetchOffenders()
      setModalOpen(false)
    } catch (error) {
      console.error('Error updating offender:', error)
      throw error
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este infractor?')) return
    try {
      await deleteOffender(id)
      fetchOffenders()
    } catch (error) {
      console.error('Error deleting offender:', error)
    }
  }

  // 8. Handlers de UI
  const openCreateModal = () => {
    setEditingOffender(null)
    setModalOpen(true)
  }

  const openEditModal = (offender) => {
    setEditingOffender(offender)
    setModalOpen(true)
  }

  // 9. Render
  return (
    <div className="main-area">
      <h1>Infractores</h1>

      {canCreate && (
        <button onClick={openCreateModal}>Nuevo Infractor</button>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <OffenderTable
          data={offenders}
          onEdit={canEdit ? openEditModal : null}
          onDelete={canDelete ? handleDelete : null}
        />
      )}

      {modalOpen && (
        <ModalOffender
          offender={editingOffender}
          onClose={() => setModalOpen(false)}
          onSave={editingOffender ? handleUpdate : handleCreate}
        />
      )}
    </div>
  )
}
```

### Estructura de un Componente Modal

**Ejemplo: ModalOffender.jsx**

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react'

// 2. Componente
export default function ModalOffender({ offender, onClose, onSave }) {
  // 3. Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    dni: '',
    job: '',
    regime: '',
    shift: 'Mañana',
    subgerencia: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // 4. Cargar datos si es edición
  useEffect(() => {
    if (offender) {
      setFormData({
        name: offender.name || '',
        lastname: offender.lastname || '',
        dni: offender.dni || '',
        job: offender.job || '',
        regime: offender.regime || '',
        shift: offender.shift || 'Mañana',
        subgerencia: offender.subgerencia || ''
      })
    }
  }, [offender])

  // 5. Validación
  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Nombre requerido'
    if (!formData.lastname.trim()) newErrors.lastname = 'Apellido requerido'
    if (!/^\d{8}$/.test(formData.dni)) newErrors.dni = 'DNI debe tener 8 dígitos'
    // ... más validaciones
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 6. Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      if (offender) {
        await onSave(offender.id, formData)
      } else {
        await onSave(formData)
      }
    } catch (error) {
      alert('Error al guardar')
    }
    setLoading(false)
  }

  // 7. Render
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{offender ? 'Editar' : 'Nuevo'} Infractor</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre"
          />
          {errors.name && <span className="error">{errors.name}</span>}

          {/* ...más campos... */}

          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  )
}
```

---

## Routing y Navegación

### Configuración de Rutas (`src/routes/Router.jsx`)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'

// Layouts
import DashboardLayoutAdmin from '../layouts/DashboardLayoutAdmin'
import DashboardLayoutSupervisor from '../layouts/DashboardLayoutSupervisor'
import DashboardLayoutCentinela from '../layouts/DashboardLayoutCentinela'
import DashboardLayoutValidator from '../layouts/DashboardLayoutValidator'

// Pages
import LoginPage from '../pages/LoginPage'
import OffenderPage from '../pages/Offender/OffenderPage'
// ...más páginas

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rutas Admin */}
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <DashboardLayoutAdmin />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="infractores" element={<OffenderPage />} />
          {/* ...más rutas admin */}
        </Route>

        {/* Rutas Supervisor */}
        <Route
          path="/dashboard/supervisor"
          element={
            <PrivateRoute requiredRole="supervisor">
              <DashboardLayoutSupervisor />
            </PrivateRoute>
          }
        >
          <Route path="infractores" element={<OffenderPage />} />
          {/* ...más rutas supervisor */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Private Route HOC

```javascript
// src/routes/PrivateRoute.jsx
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" />
  }

  return children
}
```

---

## Sistema de Permisos

### Archivo de Permisos (`src/utils/permissions.js`)

```javascript
// Roles
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  CENTINELA: 'centinela',
  VALIDATOR: 'validator'
}

// Normalizar rol del backend
export function normalizeRole(backendRole) {
  const roleMap = {
    'ADMINISTRATOR': ROLES.ADMIN,
    'SUPERVISOR': ROLES.SUPERVISOR,
    'SENTINEL': ROLES.CENTINELA,
    'VALIDATOR': ROLES.VALIDATOR
  }
  return roleMap[backendRole.toUpperCase()] || ROLES.CENTINELA
}

// Permisos por módulo
export const PERMISSIONS = {
  offenders: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  },
  // ...más módulos
}

// Verificar permiso
export function hasPermission(role, module, action) {
  const modulePermissions = PERMISSIONS[module]
  if (!modulePermissions) return false

  const allowedRoles = modulePermissions[action]
  if (!allowedRoles) return false

  return allowedRoles.includes(role)
}
```

### Uso en Componentes

```javascript
import { hasPermission } from '../../utils/permissions'
import { useSelector } from 'react-redux'

function MyComponent() {
  const { role } = useSelector((state) => state.auth)

  const canCreate = hasPermission(role, 'offenders', 'create')
  const canEdit = hasPermission(role, 'offenders', 'edit')

  return (
    <div>
      {canCreate && <button>Crear</button>}
      {canEdit && <button>Editar</button>}
    </div>
  )
}
```

---

## Guía de Desarrollo

### Agregar un Nuevo Módulo

#### 1. Crear Archivo API

```javascript
// src/api/miModulo.jsx
import api from './config'

export const getMiModulos = async (page = 1, limit = 10) => {
  const response = await api.get('/mi-modulo', { params: { page, limit } })
  return response.data
}

export const createMiModulo = async (data) => {
  const response = await api.post('/mi-modulo', data)
  return response.data
}

// ...más métodos
```

#### 2. Crear Componente Tabla

```javascript
// src/components/MiModuloTable.jsx
export default function MiModuloTable({ data, onEdit, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nombre</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={item.id}>
            <td>{index + 1}</td>
            <td>{item.name}</td>
            <td>
              {onEdit && <button onClick={() => onEdit(item)}>Editar</button>}
              {onDelete && <button onClick={() => onDelete(item.id)}>Eliminar</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

#### 3. Crear Modal CRUD

```javascript
// src/components/ModalMiModulo.jsx
export default function ModalMiModulo({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    if (item) setFormData(item)
  }, [item])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(item?.id, formData)
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit}>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <button type="submit">Guardar</button>
      </form>
    </div>
  )
}
```

#### 4. Crear Página

```javascript
// src/pages/MiModulo/MiModuloPage.jsx
import { useState, useEffect } from 'react'
import { getMiModulos, createMiModulo, updateMiModulo } from '../../api/miModulo'
import MiModuloTable from '../../components/MiModuloTable'
import ModalMiModulo from '../../components/ModalMiModulo'

export default function MiModuloPage() {
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const response = await getMiModulos()
    setItems(response.data)
  }

  const handleSave = async (id, data) => {
    if (id) {
      await updateMiModulo(id, data)
    } else {
      await createMiModulo(data)
    }
    fetchItems()
    setModalOpen(false)
  }

  return (
    <div className="main-area">
      <h1>Mi Módulo</h1>
      <button onClick={() => setModalOpen(true)}>Nuevo</button>
      <MiModuloTable data={items} onEdit={(item) => {
        setEditing(item)
        setModalOpen(true)
      }} />
      {modalOpen && (
        <ModalMiModulo
          item={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
```

#### 5. Agregar Permisos

```javascript
// src/utils/permissions.js
export const PERMISSIONS = {
  // ...módulos existentes
  miModulo: {
    view: [ROLES.ADMIN, ROLES.SUPERVISOR],
    create: [ROLES.ADMIN],
    edit: [ROLES.ADMIN],
    delete: [ROLES.ADMIN]
  }
}
```

#### 6. Agregar Ruta

```javascript
// src/routes/Router.jsx
import MiModuloPage from '../pages/MiModulo/MiModuloPage'

// Dentro de las rutas admin:
<Route path="mi-modulo" element={<MiModuloPage />} />
```

#### 7. Agregar al Sidebar

```javascript
// src/components/UI/Sidebar.jsx
const menuItems = {
  admin: [
    // ...items existentes
    {
      path: '/dashboard/admin/mi-modulo',
      label: 'Mi Módulo',
      svg: (/* icono SVG */)
    }
  ]
}
```

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar dev server
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint
```

---

## Variables de Entorno

```env
# .env
VITE_API_URL=http://192.168.137.217:3021/api
```

Uso:
```javascript
const API_URL = import.meta.env.VITE_API_URL
```

---

## Buenas Prácticas

1. **Separación de responsabilidades**: Lógica en hooks, UI en componentes
2. **Reutilización**: Componentes genéricos en `/components`
3. **Consistencia**: Seguir patrones establecidos
4. **Validación**: Siempre validar en cliente y servidor
5. **Error Handling**: Usar try/catch y mostrar mensajes claros
6. **Loading States**: Indicar cuando se carga datos
7. **Permisos**: Verificar permisos antes de mostrar botones
8. **TypeScript**: Considerar migrar a TS para mayor seguridad

---

## Troubleshooting

### Error: Buffer is not defined
**Solución**: Ya configurado en `vite.config.js` y `main.jsx`

### Error: 401 Unauthorized
**Solución**: Token expirado, logout automático configurado

### Mapa no carga
**Solución**: Verificar que `/public/leaflet` tenga los iconos

### PDF no genera
**Solución**: Verificar polyfill de Buffer

---

**Última actualización**: 2025-01-13
