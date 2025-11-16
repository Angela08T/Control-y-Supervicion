# ESTRUCTURA DEL PROYECTO - Gestionate Frontend

> Documentación de la estructura del proyecto para replicar en otros proyectos

## 📁 Estructura General

```
proyecto-frontend/
├── public/                    # Archivos estáticos públicos
│   ├── vite.svg
│   ├── favicon.ico
│   └── datos-ejemplo.json
│
├── src/                       # Código fuente principal
│   ├── App.jsx               # Componente raíz de la aplicación
│   ├── main.jsx              # Punto de entrada de React
│   ├── index.css             # Estilos globales
│   │
│   ├── assets/               # Recursos estáticos
│   │   ├── animaciones/      # Archivos de animación (Lottie, etc.)
│   │   ├── logos/            # Imágenes y logos
│   │   └── images/           # Otras imágenes
│   │
│   ├── Components/           # Componentes reutilizables
│   │   ├── Filtroselect/    # Componentes de filtros
│   │   ├── hooks/           # Custom hooks
│   │   ├── Icon/            # Componentes de iconos
│   │   ├── Image/           # Componentes de imágenes (zoom, compare)
│   │   ├── Inputs/          # Inputs personalizados
│   │   ├── Loader/          # Componentes de carga
│   │   ├── Modal/           # Modales personalizados
│   │   ├── Navigation/      # Header y Sidebar
│   │   ├── Pagination/      # Componentes de paginación
│   │   ├── Popover/         # Popovers y filtros avanzados
│   │   ├── ProgressBar/     # Barras de progreso
│   │   ├── Socket/          # Configuración de Socket.io
│   │   ├── StatusModule/    # Módulos de estado
│   │   └── Table/           # Tablas CRUD reutilizables
│   │
│   ├── Pages/               # Páginas de la aplicación
│   │   ├── Login/           # Página de inicio de sesión
│   │   │   ├── Login.jsx
│   │   │   └── UseLogin.js  # Hook personalizado para login
│   │   │
│   │   ├── Layout.jsx       # Layout principal con Sidebar/Header
│   │   ├── Inicio.jsx       # Dashboard/Página principal
│   │   ├── Error404.jsx     # Página de error 404
│   │   ├── Error403.jsx     # Página de acceso denegado
│   │   │
│   │   ├── [Entidad]/       # Patrón CRUD por entidad
│   │   │   ├── [Entidad].jsx          # Listado/Tabla principal
│   │   │   ├── Add[Entidad].jsx       # Formulario de creación
│   │   │   ├── Edit[Entidad].jsx      # Formulario de edición
│   │   │   └── Delete[Entidad].js     # Lógica de eliminación
│   │   │
│   │   ├── Area/            # Ejemplo: CRUD de Áreas
│   │   │   ├── Area.jsx
│   │   │   ├── AddArea.jsx
│   │   │   ├── EditArea.jsx
│   │   │   └── DeleteArea.js
│   │   │
│   │   ├── Cargo/           # Ejemplo: CRUD de Cargos
│   │   ├── Empleado/        # Ejemplo: CRUD de Empleados
│   │   ├── Horarios/        # Ejemplo: CRUD de Horarios
│   │   ├── Usuarios/        # Ejemplo: CRUD de Usuarios
│   │   │
│   │   └── [Módulo]/        # Módulos complejos con submódulos
│   │       ├── Dashboard/
│   │       ├── SubModulo1/
│   │       │   ├── SubModulo1.jsx
│   │       │   ├── AddSubModulo1.jsx
│   │       │   ├── EditSubModulo1.jsx
│   │       │   └── DeleteSubModulo1.js
│   │       ├── SubModulo2/
│   │       └── components/   # Componentes específicos del módulo
│   │           └── helpers/  # Helpers específicos del módulo
│   │
│   ├── Redux/               # Estado global con Redux
│   │   ├── Slices/          # Slices de Redux Toolkit
│   │   │   ├── AuthSlice.js
│   │   │   ├── UserSlice.js
│   │   │   └── [Entidad]Slice.js
│   │   │
│   │   └── Store/           # Configuración del store
│   │       └── Store.js
│   │
│   ├── Router/              # Configuración de rutas
│   │   ├── AppRouter.jsx    # Router principal
│   │   ├── PrivateRouter.jsx # Rutas que requieren autenticación
│   │   └── PublicRouter.jsx  # Rutas públicas (login, etc.)
│   │
│   ├── Middleware/          # Middlewares
│   │   ├── Auth.jsx         # Middleware de autenticación
│   │   └── [Otros].jsx      # Otros middlewares específicos
│   │
│   └── helpers/             # Funciones utilitarias
│       ├── Constants.js     # Constantes globales (URLs, keys, etc.)
│       ├── GeneralFunctions.js  # Funciones de uso general
│       ├── DayJs.Config.js  # Configuración de librerías de fecha
│       ├── swalConfig.js    # Configuración de alertas
│       ├── cacheUtils.js    # Utilidades de caché
│       ├── localStorageUtils.js # Utilidades de localStorage
│       ├── fileAndDateUtils.js  # Utilidades de archivos y fechas
│       └── mapSelectOptions.js  # Mapeo de datos para selects
│
├── index.html               # HTML principal
├── package.json             # Dependencias del proyecto
├── vite.config.js          # Configuración de Vite
├── tailwind.config.js      # Configuración de TailwindCSS
├── eslint.config.js        # Configuración de ESLint
└── README.md               # Documentación del proyecto
```

---

## 🎯 Patrones y Convenciones

### 1. Organización por Módulos (Pages)

Cada entidad del sistema tiene su propia carpeta dentro de `Pages/`:

```
Pages/
├── Empleado/
│   ├── Empleado.jsx           # Lista/Tabla de empleados
│   ├── AddEmpleado.jsx        # Formulario para crear empleado
│   ├── EditEmpleado.jsx       # Formulario para editar empleado
│   └── DeleteEmpleado.js      # Lógica de eliminación
```

**Convenciones:**
- El archivo principal lleva el nombre de la entidad: `Empleado.jsx`
- Formulario de creación: `Add[Entidad].jsx`
- Formulario de edición: `Edit[Entidad].jsx`
- Lógica de eliminación: `Delete[Entidad].js`

### 2. Componentes Reutilizables

Organizados por funcionalidad en carpetas específicas:

```
Components/
├── Table/
│   ├── CRUDTable.jsx          # Tabla genérica CRUD
│   └── TablaPermisos.jsx      # Tabla específica
│
├── Modal/
│   └── CustomModal.jsx         # Modal reutilizable
│
├── hooks/
│   ├── useFetch.js            # Hook para llamadas HTTP
│   ├── useFetchData.js        # Hook para obtener datos
│   ├── usePermission.js       # Hook para permisos
│   └── UseUrlParamsManager.jsx # Hook para params de URL
│
└── Navigation/
    ├── Header.jsx             # Barra superior
    └── Sidebar.jsx            # Menu lateral
```

**Convenciones:**
- Componentes visuales en `.jsx`
- Hooks y lógica en `.js`
- Custom hooks empiezan con `use` o `Use`

### 3. Helpers/Utilidades

Funciones puras y configuraciones:

```
helpers/
├── Constants.js              # URLs API, keys, valores fijos
├── GeneralFunctions.js       # Funciones de uso general
├── swalConfig.js            # Config de SweetAlert2
├── localStorageUtils.js     # Manejo de localStorage
└── fileAndDateUtils.js      # Utilidades de archivos/fechas
```

**Uso:**
```javascript
// En cualquier componente
import { API_URL, ROLES } from '@/helpers/Constants';
import { formatDate, downloadFile } from '@/helpers/fileAndDateUtils';
```

### 4. Estado Global con Redux

Estructura clara con Slices y Store:

```
Redux/
├── Slices/
│   ├── AuthSlice.js          # Estado de autenticación
│   │   ├── initialState
│   │   ├── reducers
│   │   └── actions
│   │
│   └── UserSlice.js          # Estado de usuarios
│
└── Store/
    └── Store.js              # Configuración del store
```

**Ejemplo de Slice:**
```javascript
// AuthSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 5. Sistema de Routing

```
Router/
├── AppRouter.jsx            # Router principal con rutas
├── PrivateRouter.jsx        # HOC para rutas privadas
└── PublicRouter.jsx         # HOC para rutas públicas
```

**Ejemplo de uso:**
```javascript
// AppRouter.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRouter from './PrivateRouter';
import PublicRouter from './PublicRouter';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRouter><Login /></PublicRouter>} />
        <Route path="/" element={<PrivateRouter><Layout /></PrivateRouter>}>
          <Route index element={<Inicio />} />
          <Route path="empleados" element={<Empleado />} />
          <Route path="areas" element={<Area />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 6. Módulos Complejos con Submódulos

Para funcionalidades grandes que requieren múltiples submódulos:

```
Pages/
└── Municipal/                    # Módulo principal
    ├── DashboardMunicipal/
    │   └── DashboardMunicipal.jsx
    │
    ├── EmpleadosMunicipales/    # Submódulo CRUD
    │   ├── EmpleadosMunicipales.jsx
    │   ├── AddEmpleadoMunicipal.jsx
    │   ├── EditEmpleadoMunicipal.jsx
    │   └── DeleteEmpleadoMunicipal.jsx
    │
    ├── RolesMunicipales/        # Submódulo CRUD
    └── components/               # Componentes específicos del módulo
        └── helpers/              # Helpers específicos del módulo
```

---

## 📦 Stack Tecnológico Recomendado

### Core
- **Framework:** React 18+
- **Build Tool:** Vite
- **Lenguaje:** JavaScript (o TypeScript)

### UI/Estilos
- **Librería de Componentes:** Material-UI (MUI) v6
- **CSS Framework:** TailwindCSS v4
- **Iconos:** @mui/icons-material
- **Animaciones:** @lottiefiles/dotlottie-react

### Estado y Datos
- **Estado Global:** Redux Toolkit
- **Sincronización de Estado:** redux-state-sync
- **HTTP Client:** Axios
- **Caché:** localStorage utilities

### Formularios y Validación
- **Formularios:** Formik
- **Validación:** Yup
- **Date Pickers:** @mui/x-date-pickers

### Routing
- **Router:** React Router DOM v6

### Utilidades
- **Fechas:** DayJS
- **UUID:** uuid
- **Encriptación:** crypto-js
- **Excel:** xlsx, xlsx-js-style

### UI/UX Extras
- **Alertas:** SweetAlert2 + sweetalert2-react-content
- **Notificaciones:** Sonner
- **Mapas:** React-Leaflet, Pigeon Maps
- **Drag & Drop:** react-beautiful-dnd
- **Comparación de Imágenes:** react-compare-slider
- **Confetti:** canvas-confetti

### Tiempo Real
- **WebSockets:** Socket.io Client

### Desarrollo
- **Linter:** ESLint v9
- **Análisis de Bundle:** webpack-bundle-analyzer

---

## 🎨 Ejemplo de package.json

```json
{
  "name": "mi-proyecto",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.13.3",
    "@emotion/styled": "^11.13.0",
    "@mui/icons-material": "^6.1.3",
    "@mui/material": "^6.1.3",
    "@mui/x-date-pickers": "^7.22.2",
    "@reduxjs/toolkit": "^2.3.0",
    "axios": "^1.7.7",
    "dayjs": "^1.11.13",
    "formik": "^2.4.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-redux": "^9.1.2",
    "react-router-dom": "^6.28.0",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.3",
    "sweetalert2": "^11.14.4",
    "tailwindcss": "^4.1.4",
    "yup": "^1.4.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.11.1",
    "@tailwindcss/vite": "^4.1.4",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "eslint": "^9.11.1",
    "eslint-plugin-react": "^7.37.0",
    "vite": "^5.4.8"
  }
}
```

---

## 🚀 Guía de Implementación Paso a Paso

### 1. Crear la estructura base

```bash
# Crear proyecto con Vite
npm create vite@latest mi-proyecto -- --template react
cd mi-proyecto

# Crear carpetas principales
mkdir -p src/{Components,Pages,Redux,Router,Middleware,helpers,assets}
mkdir -p src/assets/{animaciones,logos}
mkdir -p src/Components/{hooks,Navigation,Table,Modal,Inputs}
mkdir -p src/Redux/{Slices,Store}
```

### 2. Instalar dependencias esenciales

```bash
# UI y estilos
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install tailwindcss @tailwindcss/vite

# Estado y routing
npm install @reduxjs/toolkit react-redux
npm install react-router-dom

# Formularios
npm install formik yup

# Utilidades
npm install axios dayjs
npm install sweetalert2 sweetalert2-react-content sonner
```

### 3. Configurar archivos base

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

### 4. Crear estructura de Redux

**src/Redux/Store/Store.js:**
```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../Slices/AuthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer
  }
});
```

**src/Redux/Slices/AuthSlice.js:**
```javascript
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 5. Configurar Router

**src/Router/AppRouter.jsx:**
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Pages/Layout';
import Inicio from '../Pages/Inicio';
import Login from '../Pages/Login/Login';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 6. Crear helpers básicos

**src/helpers/Constants.js:**
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404
};
```

---

## ✅ Ventajas de esta Estructura

### 1. Clara Separación de Responsabilidades
- Cada carpeta tiene un propósito específico
- Fácil encontrar código relacionado
- Reduce la complejidad mental

### 2. Escalabilidad
- Agregar nuevos módulos es simple
- Patrón consistente facilita el crecimiento
- Sin refactorización masiva al crecer

### 3. Mantenibilidad
- Código organizado lógicamente
- Componentes reutilizables centralizados
- Helpers y utilidades accesibles

### 4. Trabajo en Equipo
- Estructura predecible
- Menos conflictos de merge
- Onboarding más rápido

### 5. Reutilización
- Componentes compartidos en Components/
- Lógica común en helpers/
- Hooks personalizados centralizados

---

## 📝 Checklist de Implementación

- [ ] Crear estructura de carpetas base
- [ ] Configurar Vite + TailwindCSS
- [ ] Instalar y configurar Redux Toolkit
- [ ] Configurar React Router
- [ ] Crear helpers de constantes
- [ ] Implementar sistema de autenticación
- [ ] Crear Layout con Header/Sidebar
- [ ] Implementar primer módulo CRUD
- [ ] Crear componentes reutilizables (Table, Modal, etc.)
- [ ] Configurar Axios con interceptores
- [ ] Implementar manejo de errores global
- [ ] Configurar ESLint

---

## 🎣 Custom Hooks Documentados

### 1. useFetch
**Ubicación:** `src/Components/hooks/useFetch.js`

**Descripción:** Hook para realizar peticiones HTTP con manejo de autenticación, loading state y errores automáticos.

**Características:**
- Manejo automático de estados de carga con Redux
- Detección automática de errores 401 (sesión expirada)
- Soporte para API Key o Bearer Token
- Manejo de errores con SweetAlert2
- Métodos HTTP: GET, POST, PATCH, DELETE

**Uso:**
```javascript
import useFetch from '@/Components/hooks/useFetch';

const { getData, postData, patchData, deleteData } = useFetch();

// GET
const response = await getData('/empleados', token);
// Con lazy loading (sin mostrar loader)
const response = await getData('/empleados', token, true);
// Con API Key
const response = await getData('/empleados', token, false, true);

// POST
const response = await postData('/empleados', formData, token);

// PATCH
const response = await patchData('/empleados/1', updateData, token);

// DELETE
const response = await deleteData('/empleados/1', token, { reason: 'inactive' });
```

**Respuesta:**
```javascript
{
  data: {...},      // Datos de la respuesta
  status: true,     // true si fue exitoso, false si hubo error
  error: {...}      // Error si status es false
}
```

---

### 2. useFetchData
**Ubicación:** `src/Components/hooks/useFetchData.js`

**Descripción:** Hook especializado para obtener datos específicos de la aplicación con caché integrado en localStorage.

**Características:**
- Caché automático en localStorage con TTL (Time To Live)
- Múltiples funciones especializadas para obtener datos
- Manejo de imágenes y PDFs como Blob URLs
- Optimización de llamadas repetidas

**Funciones disponibles:**
```javascript
const {
  // Empleados y Usuarios
  fetchEmpleados,
  fetchEmpleadosMunicipales,

  // Roles y Permisos
  fetchRoles,
  fetchRolesMunicipales,
  fetchPermisos,
  fetchPermisosRol,

  // Configuración Organizacional
  fetchCargos,
  fetchCargoConvocatoria,
  fetchCargoConvocatoriaActual,
  fetchSubgerencias,
  fetchAreas,
  fetchAreas2,
  fetchFunciones,

  // Tiempo Laboral
  fetchTurnos,
  fetchRegimenLaboral,
  fetchJurisdicciones,
  fetchLugarTrabajo,

  // Configuración Personal
  fetchSexos,
  fetchGradoEstudio,

  // Convocatorias
  fetchConvocatoria,
  fetchDistritos,
  fetchEntidades,

  // Otros
  fetchSectoresMuniciaples,
  fetchSectoresMuniciaplesSelction,
  fetchServiciosSelction,
  fetchTiposFeriados,

  // Archivos
  fetchPDF,      // Retorna URL de Blob
  fetchImage     // Retorna URL de Blob
} = useFetchData(token);
```

**Uso con caché:**
```javascript
// Primera llamada: hace fetch a la API y guarda en cache
const { data, status } = await fetchCargos();

// Llamadas subsecuentes: usa datos del cache (más rápido)
const { data, status } = await fetchCargos();
```

---

### 3. usePermission
**Ubicación:** `src/Components/hooks/usePermission.js`

**Descripción:** Hook para verificar permisos del usuario actual en módulos específicos.

**Características:**
- Verifica permisos de create, update, delete
- Soporte para múltiples módulos simultáneos
- Integración con Redux para datos del usuario

**Uso:**
```javascript
import usePermissions from '@/Components/hooks/usePermission';

// Para un módulo
const { canCreate, canDelete, canEdit } = usePermissions('empleado');

// Para múltiples módulos
const { canCreate, canDelete, canEdit } = usePermissions(['empleado', 'cargo']);

// En JSX
{canCreate && <Button onClick={handleCreate}>Crear</Button>}
{canEdit && <Button onClick={handleEdit}>Editar</Button>}
{canDelete && <Button onClick={handleDelete}>Eliminar</Button>}
```

---

### 4. UseUrlParamsManager
**Ubicación:** `src/Components/hooks/UseUrlParamsManager.jsx`

**Descripción:** Hook para gestionar parámetros de URL (query params) de forma programática.

**Características:**
- Obtener todos los parámetros de la URL
- Agregar/actualizar parámetros
- Eliminar parámetros específicos o todos
- Soporte para arrays (se convierten a string con guiones)

**Uso:**
```javascript
import UseUrlParamsManager from '@/Components/hooks/UseUrlParamsManager';

const { getParams, addParams, removeParams, removeParam } = UseUrlParamsManager();

// Obtener todos los parámetros
const params = getParams();
// Resultado: { page: '1', limit: '10', status: 'active' }

// Agregar/actualizar parámetros
addParams({ page: 2, search: 'Juan' });
// URL resultante: ?page=2&limit=10&status=active&search=Juan

// Agregar arrays
addParams({ filters: ['cargo', 'turno', 'area'] });
// URL resultante: ?filters=cargo-turno-area

// Eliminar un parámetro específico
removeParam('search');

// Eliminar todos los parámetros
removeParams();
```

---

### 5. useSubgerencia
**Ubicación:** `src/Components/hooks/useSubgerencia.js`

**Descripción:** Hook especializado para gestionar el listado de subgerencias con paginación.

**Características:**
- Paginación integrada
- Loading state automático
- Formateo de datos para tablas
- Gestión de errores

**Uso:**
```javascript
import useSubgerencia from '@/Components/hooks/useSubgerencia';

// Con valores por defecto (página 1, límite 10)
const {
  subgerencias,   // Array de subgerencias formateadas
  loading,        // Estado de carga
  count,          // Total de registros
  page,           // Página actual
  setPage,        // Función para cambiar página
  limitRows,      // Límite de filas por página
  setLimitRows    // Función para cambiar límite
} = useSubgerencia();

// Con valores iniciales personalizados
const { subgerencias, loading } = useSubgerencia(2, 20);
```

---

### 6. UseLogin
**Ubicación:** `src/Pages/Login/UseLogin.js`

**Descripción:** Hook para gestionar el proceso de autenticación del usuario.

**Características:**
- Login completo con obtención de token
- Obtención automática de datos del usuario
- Obtención automática de permisos
- Registro en Socket.io
- Manejo de errores de autenticación

**Uso:**
```javascript
import UseLogin from '@/Pages/Login/UseLogin';

const { login, getUserData } = UseLogin();

// Login
const handleLogin = async () => {
  const result = await login({
    usuario: 'admin',
    password: '123456'
  });

  if (result.status) {
    // result.data.user contiene los datos del usuario
    // result.data.token contiene el JWT
    dispatch(loginAction(result.data));
  } else {
    // result.error contiene el mensaje de error
    showError(result.error);
  }
};

// Obtener datos del usuario con token
const userData = await getUserData(token);
```

---

### 7. useDataSeguimiento
**Ubicación:** `src/Components/hooks/useDataSeguimiento.js`

**Descripción:** Hook para obtener datos estáticos de seguimiento de asistencias.

**Uso:**
```javascript
import useDataSeguimiento from '@/Components/hooks/useDataSeguimiento';

const { datosAsistencias, meses, anios, turnos } = useDataSeguimiento();
```

---

### 8. UseDB y UseUsers
**Ubicación:** `src/Components/hooks/UseDB.jsx` y `UseUsers.jsx`

**Descripción:** Hooks para obtener datos estáticos de cargos, turnos y usuarios (actualmente retornan datos hardcodeados de helpers).

**Uso:**
```javascript
import useData from '@/Components/hooks/UseDB';
import UseUsers from '@/Components/hooks/UseUsers';

const { data, cargos, regimens, sexos, cants_hijos, edades, Jurisdicciones, turnos, subgerencias } = useData();
const { data } = UseUsers();
```

---

## 🧩 Componentes Reutilizables Principales

### 1. CRUDTable
**Ubicación:** `src/Components/Table/CRUDTable.jsx`

**Descripción:** Tabla genérica y reutilizable para operaciones CRUD con todas las funcionalidades comunes.

**Características:**
- Ordenamiento por columnas
- Filtros por columna
- Paginación
- Acciones personalizables (editar, eliminar, custom)
- Exportación a Excel
- Selección múltiple
- Responsive
- Integración con Material-UI

---

### 2. CustomModal
**Ubicación:** `src/Components/Modal/CustomModal.jsx`

**Descripción:** Modal reutilizable y personalizable.

**Características:**
- Tamaños configurables
- Botones personalizables
- Transiciones suaves
- Integración con MUI

---

### 3. SearchInput
**Ubicación:** `src/Components/Inputs/SearchInput.jsx`

**Descripción:** Input de búsqueda con debounce y estilos consistentes.

---

### 4. Loader
**Ubicación:** `src/Components/Loader/Loader.jsx`

**Descripción:** Componente de carga global con animación Lottie.

---

### 5. Header y Sidebar
**Ubicación:** `src/Components/Navigation/`

**Descripción:** Componentes de navegación principal de la aplicación.

**Características:**
- Header con menú de usuario y notificaciones
- Sidebar con menú colapsable y permisos
- Integración con routing
- Responsive

---

### 6. ImageComponent y CompareImages
**Ubicación:** `src/Components/Image/`

**Descripción:** Componentes para manejo de imágenes con zoom y comparación.

**Características:**
- Zoom de imágenes
- Comparación de imágenes lado a lado
- Visor de imágenes

---

### 7. CustomPopover y CustomFiltrer
**Ubicación:** `src/Components/Popover/`

**Descripción:** Popovers para filtros avanzados y menús contextuales.

---

### 8. TablePagination
**Ubicación:** `src/Components/Pagination/TablePagination.jsx`

**Descripción:** Componente de paginación reutilizable para tablas.

---

### 9. ProgressBar
**Ubicación:** `src/Components/ProgressBar/ProgressBar.jsx`

**Descripción:** Barra de progreso personalizable.

---

### 10. DynamicIcon
**Ubicación:** `src/Components/Icon/DynamicIcon.jsx`

**Descripción:** Componente para renderizar iconos de MUI dinámicamente por nombre.

**Uso:**
```javascript
<DynamicIcon iconName="Dashboard" />
<DynamicIcon iconName="Person" color="primary" />
```

---

## 🛠️ Helpers y Utilidades Documentadas

### 1. Constants.js
**Ubicación:** `src/helpers/Constants.js`

**Descripción:** Constantes globales del proyecto.

**Contiene:**
```javascript
// Tipos de justificaciones
TIPO_JUSTIFICACIONES = ["A", 'F', "DO", "DL", "DC", "LF", "NA", "DM", "LSG", "LCG", "SSG", "V", "R", "DF"]

// Tipos de descansos
TIPO_DESCANSOS = ['DL', 'DO', 'DC']

// Estados de empleados
ESTADOS = [{ value: 'true', label: 'Trabajando' }, { value: 'false', label: 'Cesado' }]

// Permisos excluidos del sistema
PERMISOS_EXCLUIDOS = ['usuario', 'rol', 'rolesPermiso', 'empleadoPagos', "horario", "blackList", "observacion"]

// Simbología con colores RGB
SIMBOLOGIA = [
  { id: "F", bg: "255, 0, 1", text: "255, 255, 255" },
  { id: "DO", bg: "0, 176, 238", text: "255, 255, 255" },
  // ... más símbolos
]

// Menú items de navegación
MenuItems = [...]
```

---

### 2. GeneralFunctions.js
**Ubicación:** `src/helpers/GeneralFunctions.js`

**Descripción:** Funciones generales de uso común.

**Funciones:**
```javascript
// Ordenar arrays de objetos
SortData(data, orderBy, orderDirection)

// Formatear nombre completo (primer nombre + primer apellido)
formatFirstNameLastName(nombres, apellidos)

// Verificar permisos del usuario
hasPermissionFunction(user, permission)

// Formatear fecha a DD-MM-YYYY
formatDate(DateString)

// Formatear fecha para envío a backend YYYY-MM-DD
FormatoEnvioFecha(fecha)

// Buscar símbolo por ID
findSimbologiaId(id)

// Convertir RGB string a hexadecimal
rgbToHex(rgbString)

// Verificar si es cumpleaños
HappyBirthday(fecha)
```

**Ejemplo de uso:**
```javascript
import { formatDate, hasPermissionFunction, SortData } from '@/helpers/GeneralFunctions';

// Formatear fecha
const formattedDate = formatDate('2024-01-15T00:00:00Z');
// Resultado: "15-01-2024"

// Verificar permisos
const hasAccess = hasPermissionFunction(user, 'empleado');

// Ordenar datos
const sortedData = SortData(employees, 'nombre', 'asc');
```

---

### 3. swalConfig.js
**Ubicación:** `src/helpers/swalConfig.js`

**Descripción:** Configuración personalizada de SweetAlert2.

**Uso:**
```javascript
import CustomSwal, { swalError } from '@/helpers/swalConfig';

// Alertas básicas
CustomSwal.fire({
  icon: 'success',
  title: 'Éxito',
  text: 'Operación completada'
});

// Manejo de errores automático
swalError({
  message: 'Error en la operación',
  data: ['Error 1', 'Error 2', 'Error 3']
});

// Con confirmación
CustomSwal.fire({
  title: '¿Estás seguro?',
  text: 'Esta acción no se puede deshacer',
  icon: 'warning',
  showCancelButton: true
}).then((result) => {
  if (result.isConfirmed) {
    // Realizar acción
  }
});
```

---

### 4. cacheUtils.js
**Ubicación:** `src/helpers/cacheUtils.js`

**Descripción:** Utilidades para gestión de caché en localStorage con TTL.

**Funciones:**
```javascript
// Revisar si existe cache válido
reviewCache(key, attribute)

// Guardar en cache con tiempo de vida
saveToCache(key, ttl, data)
```

**Ejemplo:**
```javascript
import { reviewCache, saveToCache } from '@/helpers/cacheUtils';

// Verificar si hay caché válido
if (!reviewCache('dataSetTareaje', 'cargosData')) {
  // No hay caché, hacer fetch
  const data = await fetchData();

  // Guardar en caché por 8 horas
  saveToCache('dataSetTareaje', 8, { cargosData: data });
} else {
  // Usar datos del caché
  const cachedData = JSON.parse(localStorage.getItem('dataSetTareaje')).cargosData;
}
```

---

### 5. localStorageUtils.js
**Ubicación:** `src/helpers/localStorageUtils.js`

**Descripción:** Utilidades para manejo seguro de localStorage con encriptación.

**Funciones:**
```javascript
// Guardar estado encriptado
saveStateToLocalStorage(state)

// Cargar estado desencriptado
loadStateFromLocalStorage()
```

**Ejemplo:**
```javascript
import { saveStateToLocalStorage, loadStateFromLocalStorage } from '@/helpers/localStorageUtils';

// Guardar estado de Redux encriptado
saveStateToLocalStorage({
  auth: { user: {...}, token: '...' },
  data: {...}
});

// Recuperar estado
const persistedState = loadStateFromLocalStorage();
```

---

### 6. fileAndDateUtils.js
**Ubicación:** `src/helpers/fileAndDateUtils.js`

**Descripción:** Utilidades para archivos y fechas.

**Funciones:**
```javascript
// Calcular edad a partir de fecha de nacimiento
calculateAge(birthDate)

// Validar y manejar carga de archivos PDF
handleFileChangePDF(e, setFoto, CustomSwal)

// Validar y manejar carga de imágenes (JPG/PNG)
handleFileChange(e, setFoto, CustomSwal)
```

**Ejemplo:**
```javascript
import { calculateAge, handleFileChange } from '@/helpers/fileAndDateUtils';

// Calcular edad
const age = calculateAge('1990-05-15');
// Resultado: 34 (si estamos en 2024)

// En componente con input de archivo
<input
  type="file"
  onChange={(e) => handleFileChange(e, setImagen, CustomSwal)}
/>
```

---

### 7. mapSelectOptions.js
**Ubicación:** `src/helpers/mapSelectOptions.js`

**Descripción:** Utilidad para transformar arrays de datos a formato de opciones para selects.

**Uso:**
```javascript
import { mapToSelectOptions } from '@/helpers/mapSelectOptions';

// Datos originales
const cargos = [
  { id: 1, nombre: 'Gerente' },
  { id: 2, nombre: 'Supervisor' }
];

// Transformar
const options = mapToSelectOptions(cargos);
// Resultado: [
//   { value: 1, label: 'Gerente' },
//   { value: 2, label: 'Supervisor' }
// ]

// Con campo personalizado
const options = mapToSelectOptions(users, 'usuario');
// Usa user.usuario en lugar de user.nombre
```

---

### 8. DayJs.Config.js
**Ubicación:** `src/helpers/DayJs.Config.js`

**Descripción:** Configuración global de DayJS (librería de manejo de fechas).

---

## 🔗 Referencias y Recursos

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Material-UI](https://mui.com/)
- [React Router](https://reactrouter.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

**Última actualización:** 2025-01-15

**Versión:** 2.0.0
