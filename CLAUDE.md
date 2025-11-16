# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema Centinela** - Control and Supervision System for CECOM (Centro de Control Municipal) of San Juan de Lurigancho. This is a React-based incident management system that allows supervisors to track, document, and generate reports about labor incidents and disciplinary actions for municipal personnel.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

### Core
- **Frontend Framework**: React 18.2 with JSX
- **Build Tool**: Vite 5.0
- **Lenguaje**: JavaScript
- **State Management**: Redux Toolkit + Redux Persist
- **Routing**: React Router DOM v7

### UI & Integration
- **Map Integration**: Leaflet + React-Leaflet
- **PDF Generation**: @react-pdf/renderer
- **Icons**: react-icons
- **HTTP Client**: Axios

### Data Persistence
- **Estado Global**: Redux Toolkit con persistencia
- **localStorage**: Para configuraciones y datos temporales

## Architecture

### Application Flow

1. **Authentication**: Login screen validates users through backend API. Uses Redux for auth state management.
2. **Main App**: After login, users see Header (navigation), Sidebar (menu), and the main content area.
3. **Role-Based Access**: Different layouts and routes for Admin, Supervisor, Centinela, and Validator roles.
4. **Core Functionality**: The system manages incidents, bodycams, users, jobs, personnel, subjects, lacks, offenders, and audit logs.

### Directory Structure (Nueva Arquitectura)

```
src/
├── App.jsx                  # Root component
├── main.jsx                 # Application entry point
├── index.css               # Global styles (antes styles.css)
│
├── assets/                  # Recursos estáticos
│   ├── animaciones/         # Archivos de animación (Lottie, etc.)
│   ├── logos/               # Logos e imágenes de marca
│   └── images/              # Otras imágenes
│
├── Components/              # Componentes reutilizables (CAPITALIZADO)
│   ├── hooks/               # Custom hooks
│   │   ├── useFetch.js              # Hook para llamadas HTTP
│   │   ├── useFetchData.js          # Hook para obtener datos bajo demanda
│   │   ├── usePermission.js         # Hook para permisos
│   │   ├── UseUrlParamsManager.jsx  # Hook para params de URL
│   │   ├── Audit/                   # Hooks específicos por módulo
│   │   ├── Bodycam/
│   │   ├── Job/
│   │   ├── Login/
│   │   ├── Subject/
│   │   └── ...
│   │
│   ├── Navigation/          # Componentes de navegación
│   │   ├── Header.jsx       # Barra superior (antes Topbar)
│   │   └── Sidebar.jsx      # Menu lateral
│   │
│   ├── Table/               # Componentes de tabla
│   │   ├── CRUDTable.jsx    # Tabla genérica CRUD reutilizable
│   │   ├── IncidenciasTable.jsx
│   │   ├── BodycamTable.jsx
│   │   ├── UserTable.jsx
│   │   └── ...
│   │
│   ├── Modal/               # Componentes de modal
│   │   ├── CustomModal.jsx  # Modal genérico reutilizable
│   │   ├── ModalIncidencia.jsx
│   │   ├── ModalBodycam.jsx
│   │   ├── ModalPDFInforme.jsx
│   │   └── ...
│   │
│   ├── Map/                 # Componentes de mapa
│   │   └── MapSelector.jsx
│   │
│   ├── PDF/                 # Componentes de PDF
│   │   └── PDFDocument.jsx
│   │
│   └── Login/               # Componentes de login
│       └── LoginForm.jsx
│
├── Pages/                   # Páginas de la aplicación (CAPITALIZADO)
│   ├── Layouts/             # Layouts por rol
│   │   ├── DashboardLayoutAdmin.jsx
│   │   ├── DashboardLayoutSupervisor.jsx
│   │   ├── DashboardLayoutCentinela.jsx
│   │   └── DashboardLayoutValidator.jsx
│   │
│   ├── Login.jsx, LoginPage.jsx
│   ├── UnauthorizedPage.jsx
│   ├── NotFoundPage.jsx
│   │
│   ├── Dashboard/
│   │   ├── DashboardPage.jsx
│   │   └── components/      # Componentes específicos del Dashboard
│   │
│   ├── Incidencias/
│   │   └── IncidenciasPage.jsx
│   │
│   ├── Bodycam/
│   │   └── BodycamPage.jsx
│   │
│   ├── Usuarios/
│   │   └── UsuariosPage.jsx
│   │
│   ├── Jobs/
│   │   └── JobsPage.jsx
│   │
│   └── ...                  # Otros módulos
│
├── Redux/                   # Estado global (antes: store)
│   ├── Store/
│   │   └── Store.js         # Configuración del store con persist
│   │
│   └── Slices/
│       └── AuthSlice.js     # Slice de autenticación
│
├── Router/                  # Sistema de routing (antes: routes)
│   ├── AppRouter.jsx        # Router principal con todas las rutas
│   ├── PrivateRouter.jsx    # HOC para rutas privadas
│   └── PublicRouter.jsx     # HOC para rutas públicas
│
├── Middleware/              # Middlewares personalizados
│
└── helpers/                 # Utilidades y funciones helper (antes: utils)
    ├── api/                 # Funciones de API (antes carpeta separada)
    │   ├── config.jsx       # Configuración de axios
    │   ├── auth.jsx
    │   ├── user.jsx
    │   ├── report.jsx
    │   ├── bodycam.jsx
    │   └── ...
    │
    ├── Constants.js         # Constantes globales (URLs, roles, keys)
    ├── GeneralFunctions.js  # Funciones de uso general
    ├── swalConfig.js        # Configuración de SweetAlert2
    ├── localStorageUtils.js # Manejo de localStorage (antes storage.js)
    ├── fileAndDateUtils.js  # Utilidades de archivos y fechas
    └── permissions.js       # Utilidades de permisos
```

### Import Paths (usando alias @)

Todos los imports usan el alias `@` configurado en `vite.config.js`:

```javascript
// Redux
import { store, persistor } from '@/Redux/Store/Store'
import { login, logout } from '@/Redux/Slices/AuthSlice'

// Router
import AppRouter from '@/Router/AppRouter'
import PrivateRouter from '@/Router/PrivateRouter'

// Components
import Header from '@/Components/Navigation/Header'
import Sidebar from '@/Components/Navigation/Sidebar'
import CRUDTable from '@/Components/Table/CRUDTable'
import CustomModal from '@/Components/Modal/CustomModal'
import MapSelector from '@/Components/Map/MapSelector'

// Hooks
import useFetch from '@/Components/hooks/useFetch'
import usePermission from '@/Components/hooks/usePermission'
import useLogin from '@/Components/hooks/Login/useLogin'

// Pages
import DashboardLayoutAdmin from '@/Pages/Layouts/DashboardLayoutAdmin'
import IncidenciasPage from '@/Pages/Incidencias/IncidenciasPage'

// Helpers
import { API_URL, ROLES } from '@/helpers/Constants'
import { formatDate, downloadFile } from '@/helpers/fileAndDateUtils'
import { showSuccess, showError } from '@/helpers/swalConfig'
import { getUsers } from '@/helpers/api/user'
```

### Data Model

Incidents (incidencias) are managed through backend API with the following structure:

```javascript
{
  id: string,              // Unique ID
  dni: string,             // 8-digit DNI (required)
  asunto: string,          // Incident type: "Falta disciplinaria" | "Abandono de servicio" | "Inasistencia"
  falta: string,           // Specific fault subtype
  turno: string,           // Shift: "Mañana" | "Tarde" | "Noche"
  medio: string,           // Evidence source: "bodycam" | "reporte"
  fechaIncidente: string,  // Incident date (ISO format)
  horaIncidente: string,   // Incident time (HH:mm)
  bodycamNumber: string,   // Bodycam ID (required for non-absence incidents)
  bodycamAsignadaA: string,// Person bodycam is assigned to
  encargadoBodycam: string,// Bodycam responsible person
  ubicacion: {             // Location object (optional)
    coordinates: [lat, lng],
    address: string
  },
  jurisdiccion: string,    // Jurisdiction (required)
  dirigidoA: string,       // Report recipient type
  destinatario: string,    // Specific recipient name
  cargo: string,           // Position/role of the person
  regLab: string,          // Labor registry number
  tipoInasistencia: string,// For "Inasistencia": "Justificada" | "Injustificada"
  fechaFalta: string,      // Date of absence (for Inasistencia)
  conCopia: boolean,       // Whether to include CC recipients
  cc: string[],            // Array of CC recipient names
  createdAt: string,       // ISO timestamp
  updatedAt: string        // ISO timestamp
}
```

### Key Components

#### Custom Hooks (Genéricos)

- **useFetch**: Hook para llamadas HTTP automáticas con axios
- **useFetchData**: Hook para llamadas HTTP bajo demanda
- **usePermission**: Hook para obtener permisos del usuario según rol
- **UseUrlParamsManager**: Hook para manejar parámetros de URL

#### Componentes Reutilizables

- **CRUDTable**: Tabla genérica con acciones (ver, editar, eliminar)
- **CustomModal**: Modal reutilizable con diferentes tamaños
- **Header**: Barra superior con tema, notificaciones y usuario
- **Sidebar**: Menu lateral con navegación por rol

#### Helpers

- **Constants.js**: URLs, roles, HTTP status codes, storage keys, etc.
- **GeneralFunctions.js**: Funciones utilitarias (capitalize, truncate, validate, etc.)
- **swalConfig.js**: Configuración y helpers de SweetAlert2
- **fileAndDateUtils.js**: Formateo de fechas, manejo de archivos, exportación
- **localStorageUtils.js**: Gestión de localStorage con migraciones

#### MapSelector.jsx
- Interactive Leaflet map for location selection
- Uses OpenStreetMap tiles
- Reverse geocoding via Nominatim API to display addresses
- Centered on Lima, Peru coordinates (-12.0464, -77.0428)

#### ModalIncidencia.jsx
- Manages incident creation and editing
- Dynamic form fields based on incident type
- Cascading dropdowns for recipient selection
- DNI validation (exactly 8 digits)
- Automatic date/time population for new incidents

### Redux State Management

```javascript
// AuthSlice
{
  token: null,
  username: null,
  id: null,
  role: null,      // 'admin' | 'supervisor' | 'centinela' | 'validator'
  authorized: false
}
```

### Routing System

**Public Routes:**
- `/login` - Login page
- `/unauthorized` - Unauthorized access page

**Private Routes (Role-based):**
- `/dashboard/admin/*` - Admin dashboard and modules
- `/dashboard/supervisor/*` - Supervisor dashboard
- `/dashboard/centinela/*` - Centinela dashboard
- `/dashboard/validator/*` - Validator dashboard

Each role has specific permissions managed through `helpers/permissions.js`.

### Theme System

The app supports light/dark mode:
- Theme state persisted in localStorage key: `centinela-theme`
- Attribute set on `document.documentElement`: `data-theme="dark"` or `data-theme="light"`
- Toggle button in Header.jsx (antes Topbar.jsx)

## Important Implementation Notes

1. **Backend Integration**: Uses Axios for all HTTP requests. Base URL configured in `helpers/api/config.jsx`.

2. **Authentication Flow**:
   - Login credentials sent to backend
   - JWT token stored in Redux with persistence
   - Token included in all API requests via Axios interceptor

3. **Map Configuration**: Leaflet requires explicit icon configuration. Icons are loaded from unpkg CDN URLs in MapSelector.jsx.

4. **Incident Type Logic**: Bodycam fields are only required for "Falta disciplinaria" and "Abandono de servicio". For "Inasistencia", the medio field defaults to "reporte".

5. **PDF Generation**: ModalPDFInforme.jsx uses @react-pdf/renderer to generate incident reports. For "Inasistencia" incidents, it includes historical absence data for the same DNI.

6. **Form Validation**: DNI must be exactly 8 digits. Most fields are required except ubicacion (map selection).

7. **Permissions System**: Role-based permissions defined in `helpers/permissions.js`. Use `usePermission` hook to access permissions in components.

## Styling

- Global styles in `src/index.css`
- CSS custom properties for theming (defined with [data-theme] attribute)
- No CSS framework - custom styles throughout
- Modular CSS for specific components

## Development Notes

- The project uses Vite with `@` alias for clean imports
- ESLint configured with minimal rules (see eslint.config.js)
- React rendered with Redux Provider and PersistGate
- Assets referenced with absolute paths from `@/assets/`
- All API calls centralized in `helpers/api/`
- Custom hooks for reusable logic in `Components/hooks/`

## Convenciones de Código

1. **Nombrado de Archivos**:
   - Componentes React: PascalCase.jsx
   - Hooks: camelCase.js (con prefijo `use` o `Use`)
   - Helpers: camelCase.js
   - Constantes: PascalCase.js

2. **Carpetas**: Capitalizadas (Components, Pages, Redux, Router, Middleware)

3. **Imports**: Siempre usar alias `@/` en vez de rutas relativas

4. **Componentes**: Preferir funciones arrow sobre function declarations

5. **Estado**: Redux para estado global, useState para estado local
