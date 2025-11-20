# Documentación de Cambios - Sistema Centinela

**Fecha de actualización:** 21 de Octubre, 2025
**Versión:** 2.0.0
**Sistema:** Control y Supervisión CECOM - San Juan de Lurigancho

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Dependencias Instaladas](#dependencias-instaladas)
4. [Sistema de Autenticación](#sistema-de-autenticación)
5. [Gestión de Estado (Redux)](#gestión-de-estado-redux)
6. [Sistema de Rutas](#sistema-de-rutas)
7. [Componentes Principales](#componentes-principales)
8. [Layouts y UI](#layouts-y-ui)
9. [Roles y Permisos](#roles-y-permisos)
10. [Guía de Desarrollo](#guía-de-desarrollo)
11. [Migración a Backend](#migración-a-backend)

---

## 📊 Resumen Ejecutivo

El Sistema Centinela ha sido completamente reestructurado para implementar una arquitectura moderna basada en:

- **React Router v6** para navegación
- **Redux Toolkit** para gestión de estado global
- **Redux Persist** para persistencia de sesión
- **Sistema de autenticación** con roles
- **Rutas protegidas** por permisos
- **Layouts modulares** reutilizables

### Objetivos Cumplidos

✅ Implementación de autenticación con Redux
✅ Sistema de rutas protegidas por rol
✅ Persistencia de sesión del usuario
✅ Arquitectura escalable y mantenible
✅ Separación de responsabilidades
✅ Reutilización de componentes UI originales

---

## 🏗️ Arquitectura del Sistema

### Estructura de Directorios

```
Control-y-Supervicion/
├── src/
│   ├── api/                    # (Preparado para integración con backend)
│   ├── components/             # Componentes reutilizables
│   │   ├── UI/                 # Componentes de interfaz
│   │   │   ├── Sidebar.jsx     # Menú lateral con iconos
│   │   │   └── Topbar.jsx      # Barra superior con usuario y logout
│   │   ├── Login/              # Componentes de autenticación
│   │   │   └── LoginForm.jsx   # Formulario de login con CAPTCHA
│   │   ├── IncidenciasTable.jsx     # Tabla de incidencias
│   │   ├── ModalIncidencia.jsx      # Modal crear/editar incidencia
│   │   ├── ModalPDFInforme.jsx      # Generador de informes PDF
│   │   └── MapSelector.jsx          # Selector de ubicación con mapa
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Plantillas de página
│   │   ├── DashboardLayoutAdmin.jsx      # Layout para administradores
│   │   ├── DashboardLayoutSupervisor.jsx # Layout para supervisores
│   │   └── DashboardLayoutCentinela.jsx  # Layout para centinelas
│   ├── pages/                  # Páginas de la aplicación
│   │   ├── Incidencias/
│   │   │   └── IncidenciasPage.jsx  # Página principal (compartida por roles)
│   │   ├── Login.jsx           # Página de login antigua (deprecada)
│   │   ├── UnauthorizedPage.jsx     # Página de acceso denegado
│   │   └── NotFoundPage.jsx    # Página 404
│   ├── routes/                 # Configuración de rutas
│   │   ├── Router.jsx          # Definición de todas las rutas
│   │   ├── PrivateRoute.jsx    # Componente de ruta protegida
│   │   └── PublicRoute.jsx     # Componente de ruta pública
│   ├── store/                  # Redux store
│   │   ├── index.js            # Configuración del store
│   │   └── slices/
│   │       └── authSlice.js    # Slice de autenticación
│   ├── utils/
│   │   └── storage.js          # Gestión de localStorage
│   ├── App.jsx                 # Componente raíz (simplificado)
│   ├── main.jsx                # Punto de entrada con Providers
│   └── styles.css              # Estilos globales
├── package.json
├── CLAUDE.md                   # Instrucciones para Claude Code
└── DOCUMENTACION_CAMBIOS.md   # Este archivo
```

---

## 📦 Dependencias Instaladas

### Nuevas Dependencias

```json
{
  "@reduxjs/toolkit": "^2.x.x",      // Gestión de estado simplificada
  "react-redux": "^9.x.x",            // Integración Redux con React
  "redux-persist": "^6.x.x",          // Persistencia del store
  "react-router-dom": "^6.x.x",       // Sistema de rutas
  "axios": "^1.x.x"                   // Cliente HTTP (preparado para backend)
}
```

### Instalación

```bash
npm install @reduxjs/toolkit react-redux redux-persist react-router-dom axios
```

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

```
┌─────────────┐
│   Usuario   │
│ ingresa al  │
│   sistema   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  LoginForm.jsx              │
│  - Valida credenciales      │
│  - Muestra CAPTCHA si falla │
└──────────┬──────────────────┘
           │
           ▼ ✅ Login exitoso
┌─────────────────────────────┐
│  Redux Store (authSlice)    │
│  - Guarda token             │
│  - Guarda username          │
│  - Guarda role              │
│  - Guarda id                │
│  - authorized = true        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Redux Persist              │
│  - Persiste en localStorage │
│  - Key: "persist:root"      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  React Router               │
│  - Redirige según rol       │
│  - Aplica PrivateRoute      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Dashboard del rol          │
│  - Admin → /dashboard/admin │
│  - Supervisor → /dashboard/supervisor │
│  - Centinela → /dashboard/centinela   │
└─────────────────────────────┘
```

### Archivo: `src/components/Login/LoginForm.jsx`

**Características:**

- ✅ Validación de credenciales (modo desarrollo)
- ✅ Sistema CAPTCHA después de 2 intentos fallidos
- ✅ Integración con Redux para guardar estado
- ✅ Redirección automática según rol
- ✅ Usuarios de prueba incluidos

**Usuarios de Prueba (Modo Desarrollo):**

```javascript
const DEMO_USERS = {
  admin: { password: 'admin123', role: 'admin', id: 1, username: 'admin' },
  supervisor: { password: 'super123', role: 'supervisor', id: 2, username: 'supervisor' },
  centinela: { password: 'cent123', role: 'centinela', id: 3, username: 'centinela' },
}
```

**Función de Login:**

```javascript
const handleSubmit = (e) => {
  e.preventDefault()

  // Validar usuario
  const user = DEMO_USERS[username.toLowerCase()]

  if (!user || user.password !== password) {
    setError('Usuario o contraseña incorrectos')
    return
  }

  // Guardar en Redux
  dispatch(login({
    token: `demo-token-${Date.now()}`,
    id: user.id,
    username: user.username,
    role: user.role,
  }))

  // Redirigir
  navigate(roleRoutes[user.role])
}
```

---

## 🗄️ Gestión de Estado (Redux)

### Configuración del Store

**Archivo: `src/store/index.js`**

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Configuración de persistencia
const persistedReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: ['auth'], // Solo persistir auth
  },
  combineReducers({
    auth: authReducer,
  })
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
```

### Auth Slice

**Archivo: `src/store/slices/authSlice.js`**

```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  username: null,
  role: null,
  authorized: false,
  id: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action) {
      const { token, id, username, role } = action.payload;
      state.token = token;
      state.username = username;
      state.role = role;
      state.id = id;
      state.authorized = true;
    },
    logout(state) {
      state.id = null;
      state.token = null;
      state.username = null;
      state.role = null;
      state.authorized = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
```

### Uso en Componentes

**Leer datos del store:**

```javascript
import { useSelector } from 'react-redux';

function MiComponente() {
  const { username, role, authorized } = useSelector((state) => state.auth);

  return <div>Hola, {username}</div>;
}
```

**Despachar acciones:**

```javascript
import { useDispatch } from 'react-redux';
import { login, logout } from '../store/slices/authSlice';

function LoginButton() {
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(login({ token: 'abc', username: 'admin', role: 'admin', id: 1 }));
  };

  const handleLogout = () => {
    dispatch(logout());
  };
}
```

---

## 🛣️ Sistema de Rutas

### Configuración Principal

**Archivo: `src/routes/Router.jsx`**

```javascript
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<PublicRouter element={<LoginPage />} />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rutas Protegidas - ADMIN */}
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <DashboardLayoutAdmin />
            </PrivateRoute>
          }
        >
          <Route index element={<IncidenciasPage />} />
        </Route>

        {/* Rutas Protegidas - SUPERVISOR */}
        <Route
          path="/dashboard/supervisor"
          element={
            <PrivateRoute requiredRole="supervisor">
              <DashboardLayoutSupervisor />
            </PrivateRoute>
          }
        >
          <Route index element={<IncidenciasPage />} />
        </Route>

        {/* Rutas Protegidas - CENTINELA */}
        <Route
          path="/dashboard/centinela"
          element={
            <PrivateRoute requiredRole="centinela">
              <DashboardLayoutCentinela />
            </PrivateRoute>
          }
        >
          <Route index element={<IncidenciasPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Ruta Protegida

**Archivo: `src/routes/PrivateRoute.jsx`**

```javascript
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole }) => {
  const { authorized, role } = useSelector((state) => state.auth);

  // Verificar autenticación
  if (!authorized) return <Navigate to="/login" />;

  // Verificar rol
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

### Ruta Pública

**Archivo: `src/routes/PublicRoute.jsx`**

Redirige al dashboard si el usuario ya está autenticado:

```javascript
const PublicRouter = ({ element }) => {
  const { authorized, role } = useSelector((state) => state.auth);

  const getRedirectPath = () => {
    switch (role) {
      case 'admin': return '/dashboard/admin';
      case 'supervisor': return '/dashboard/supervisor';
      case 'centinela': return '/dashboard/centinela';
      default: return '/login';
    }
  };

  return authorized ? <Navigate to={getRedirectPath()} /> : element;
};
```

---

## 🎨 Componentes Principales

### 1. LoginForm

**Ubicación:** `src/components/Login/LoginForm.jsx`

**Responsabilidades:**
- Validar credenciales de usuario
- Mostrar CAPTCHA después de 2 intentos fallidos
- Despachar acción de login a Redux
- Redirigir al dashboard correspondiente

**Props:** Ninguna (autónomo)

**Hooks utilizados:**
- `useState` - gestión de estado local
- `useDispatch` - despachar acciones Redux
- `useNavigate` - navegación programática

---

### 2. IncidenciasPage

**Ubicación:** `src/pages/Incidencias/IncidenciasPage.jsx`

**Responsabilidades:**
- Cargar y mostrar incidencias desde localStorage
- Filtrar incidencias por asunto, turno, tipo
- Crear nueva incidencia
- Editar incidencia existente
- Eliminar incidencia
- Abrir modal de PDF

**Sub-componentes utilizados:**
- `IncidenciasTable` - Tabla de datos
- `ModalIncidencia` - Formulario de creación/edición
- `ModalPDFInforme` - Generador de PDF

**Estado:**
```javascript
const [incidencias, setIncidencias] = useState([])
const [showModal, setShowModal] = useState(false)
const [showPDFModal, setShowPDFModal] = useState(false)
const [editItem, setEditItem] = useState(null)
const [filters, setFilters] = useState({ asunto: 'Todos', turno: 'Todos', ... })
```

---

### 3. ModalIncidencia

**Ubicación:** `src/components/ModalIncidencia.jsx`

**Responsabilidades:**
- Formulario dinámico según tipo de incidencia
- Validación de DNI (8 dígitos)
- Integración con MapSelector
- Campos condicionales (bodycam, inasistencia)

**Campos del formulario:**
- DNI
- Asunto (tipo de incidencia)
- Falta (subtipo)
- Turno
- Medio (bodycam/reporte)
- Fecha y hora del incidente
- Bodycam (condicional)
- Ubicación (mapa)
- Jurisdicción
- Destinatario
- CC (copia)

---

### 4. ModalPDFInforme

**Ubicación:** `src/components/ModalPDFInforme.jsx`

**Responsabilidades:**
- Vista previa del informe
- Edición de campos antes de generar PDF
- Generación de PDF con jsPDF
- Incluir historial de inasistencias
- Adjuntar imágenes
- Firma digital

**Características especiales:**
- Generación automática de número de informe
- Formato oficial de la municipalidad
- Historial de inasistencias del personal
- Soporte para imágenes y firma

---

### 5. MapSelector

**Ubicación:** `src/components/MapSelector.jsx`

**Responsabilidades:**
- Mostrar mapa interactivo con Leaflet
- Permitir selección de ubicación
- Geocodificación inversa (coordenadas → dirección)
- Centrado en Lima, Perú

**Dependencias:**
- Leaflet
- React-Leaflet
- OpenStreetMap tiles
- Nominatim API (geocoding)

---

## 🖼️ Layouts y UI

### Layouts

Todos los layouts comparten la misma estructura:

```javascript
import { Outlet } from "react-router-dom";
import Sidebar from "../components/UI/Sidebar";
import Topbar from "../components/UI/Topbar";

const DashboardLayoutXXX = () => {
  return (
    <div className="app-root">
      <Topbar />
      <div className="app-content">
        <Sidebar />
        <main className="main-area">
          <Outlet /> {/* Aquí se renderiza la página actual */}
        </main>
      </div>
    </div>
  );
};
```

### Topbar

**Ubicación:** `src/components/UI/Topbar.jsx`

**Elementos:**
- Logo SJL
- Título "CENTINELA"
- Campana de notificaciones (con badge)
- Toggle tema claro/oscuro
- Nombre de usuario (dinámico desde Redux)
- Avatar
- Botón de logout

**Funcionalidades:**
- Guardar tema en localStorage
- Despachar logout a Redux
- Redirigir a /login al hacer logout

---

### Sidebar

**Ubicación:** `src/components/UI/Sidebar.jsx`

**Menú de navegación:**

| Icono | Función | Estado |
|-------|---------|--------|
| 📄 | Incidencias | Activo |
| 👥 | Supervisores | Futuro |
| 🔔 | Alertas | Futuro |
| 📊 | Estadísticas | Futuro |
| 📹 | Cámaras | Futuro |
| 📋 | Reportes | Futuro |
| ⚙️ | Configuración | Futuro |

**Nota:** Actualmente solo "Incidencias" está implementado.

---

## 👥 Roles y Permisos

### Roles Definidos

| Rol | Nombre | Ruta | Permisos |
|-----|--------|------|----------|
| Admin | Administrador | `/dashboard/admin` | Acceso completo |
| Supervisor | Supervisor | `/dashboard/supervisor` | Gestión de incidencias |
| Centinela | Centinela | `/dashboard/centinela` | Creación de incidencias |

### Tabla de Acceso

| Funcionalidad | Admin | Supervisor | Centinela |
|---------------|-------|------------|-----------|
| Ver incidencias | ✅ | ✅ | ✅ |
| Crear incidencia | ✅ | ✅ | ✅ |
| Editar incidencia | ✅ | ✅ | ✅ |
| Eliminar incidencia | ✅ | ✅ | ✅ |
| Generar PDF | ✅ | ✅ | ✅ |

**Nota:** Actualmente todos los roles tienen los mismos permisos. La diferenciación se implementará en futuras versiones.

---

## 🛠️ Guía de Desarrollo

### Comandos Principales

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

### Agregar Nueva Página

**Paso 1:** Crear el componente de página

```javascript
// src/pages/MiNuevaPagina.jsx
export default function MiNuevaPagina() {
  return <div>Mi nueva página</div>;
}
```

**Paso 2:** Agregar ruta en Router.jsx

```javascript
import MiNuevaPagina from '../pages/MiNuevaPagina';

// Dentro de un layout existente
<Route path="mi-ruta" element={<MiNuevaPagina />} />
```

**Paso 3:** Agregar enlace en Sidebar (opcional)

```javascript
// src/components/UI/Sidebar.jsx
<li title="Mi Nueva Página">
  <Link to="/dashboard/admin/mi-ruta">
    {/* Icono SVG */}
  </Link>
</li>
```

---

### Agregar Nuevo Slice de Redux

**Paso 1:** Crear el slice

```javascript
// src/store/slices/miSlice.js
import { createSlice } from '@reduxjs/toolkit';

const miSlice = createSlice({
  name: 'miSlice',
  initialState: { /* ... */ },
  reducers: {
    miAccion(state, action) {
      // Modificar estado
    }
  }
});

export const { miAccion } = miSlice.actions;
export default miSlice.reducer;
```

**Paso 2:** Registrar en el store

```javascript
// src/store/index.js
import miReducer from './slices/miSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  miSlice: miReducer, // ← Agregar aquí
});
```

---

### Proteger Nueva Ruta

```javascript
<Route
  path="/ruta-protegida"
  element={
    <PrivateRoute requiredRole="admin">
      <MiComponente />
    </PrivateRoute>
  }
/>
```

---

## 🔄 Migración a Backend

### Preparación

El sistema está preparado para integración con backend. Solo necesitas:

1. Crear endpoints en tu API
2. Reemplazar usuarios hardcodeados por llamadas HTTP
3. Configurar axios

### Modificar LoginForm.jsx

**Antes (Modo Desarrollo):**

```javascript
const user = DEMO_USERS[username.toLowerCase()]

if (!user || user.password !== password) {
  setError('Usuario o contraseña incorrectos')
  return
}

dispatch(login({
  token: `demo-token-${Date.now()}`,
  id: user.id,
  username: user.username,
  role: user.role,
}))
```

**Después (Con Backend):**

```javascript
import axios from 'axios'

try {
  const response = await axios.post('https://tu-api.com/api/auth/login', {
    username,
    password
  })

  const { token, id, username: user, role } = response.data

  dispatch(login({ token, id, username: user, role }))
  navigate(roleRoutes[role])

} catch (error) {
  setError(error.response?.data?.message || 'Error al iniciar sesión')
}
```

### Configurar Axios

**Crear archivo:** `src/api/axios.js`

```javascript
import axios from 'axios'
import { store } from '../store'

const api = axios.create({
  baseURL: 'https://tu-api.com/api',
  timeout: 10000,
})

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, hacer logout
      store.dispatch(logout())
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Endpoints Necesarios

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login | `{ username, password }` |
| POST | `/auth/logout` | Logout | `{ }` |
| GET | `/incidencias` | Listar incidencias | - |
| POST | `/incidencias` | Crear incidencia | `{ dni, asunto, ... }` |
| PUT | `/incidencias/:id` | Actualizar incidencia | `{ dni, asunto, ... }` |
| DELETE | `/incidencias/:id` | Eliminar incidencia | - |

---

## 📝 Notas Importantes

### localStorage Keys

El sistema utiliza las siguientes claves en localStorage:

| Key | Descripción | Valor |
|-----|-------------|-------|
| `persist:root` | Estado de Redux persistido | JSON |
| `centinela-theme` | Tema actual (dark/light) | String |
| `centinela_incidencias_v2` | Incidencias guardadas | JSON Array |

### Limpiar localStorage

Para resetear el sistema durante desarrollo:

```javascript
localStorage.clear()
location.reload()
```

O desde consola del navegador:
```
F12 → Application → Local Storage → Clear All
```

---

## 🐛 Troubleshooting

### Problema: "404 Página no encontrada"

**Solución:**
1. Verificar que los roles en `LoginForm.jsx`, `PrivateRoute.jsx`, `PublicRoute.jsx` y `NotFoundPage.jsx` coincidan
2. Limpiar localStorage: `localStorage.clear()`
3. Recargar la página

### Problema: "Loop infinito de redirección"

**Solución:**
1. Verificar que `PublicRoute` no esté redirigiendo a una ruta protegida inexistente
2. Revisar que todos los roles tengan una ruta válida en Router.jsx

### Problema: "Estado de Redux no persiste"

**Solución:**
1. Verificar que `PersistGate` esté en `main.jsx`
2. Revisar la configuración de `persistReducer` en `store/index.js`
3. Limpiar localStorage y volver a hacer login

### Problema: "No se muestra el nombre de usuario en Topbar"

**Solución:**
1. Verificar que el login despache correctamente el username
2. Revisar que Topbar esté usando `useSelector` correctamente
3. Inspeccionar Redux DevTools para ver el estado

---

## 📞 Contacto y Soporte

Para reportar bugs o solicitar nuevas funcionalidades, contactar al equipo de desarrollo.

---

## 📄 Licencia

Sistema Centinela - CECOM San Juan de Lurigancho
© 2025 Municipalidad de San Juan de Lurigancho

---

**Última actualización:** 21 de Octubre, 2025
**Versión del documento:** 1.0.0
