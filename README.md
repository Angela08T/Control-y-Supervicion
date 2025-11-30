#  SISTEMA DE CONTROL Y SUPERVICION - CENTINELA

Sistema de Control y Supervisión para la Municipalidad de San Juan de Lurigancho

## Descripción del Proyecto

**Sistema Centinela** es una aplicación web desarrollada para el Centro de Control Municipal (CECOM) de San Juan de Lurigancho que permite la gestión integral de incidencias laborales, ausencias y faltas disciplinarias del personal municipal. El sistema facilita la documentación, seguimiento y generación de reportes de incidentes con geolocalización y evidencia mediante bodycams.

## Características Principales

### **Geolocalización**: 
Selección de ubicación mediante mapas interactivos con Leaflet

### **Generación de Reportes PDF**: 
Creación automática de informes con jsPDF

### **Sistema de Bodycams**: 
Vinculación de evidencia con dispositivos bodycam

### **Control de Turnos**: 
Gestión por turnos (Mañana, Tarde, Noche)

### **Multi-rol**: 
Soporte para Admin, Supervisor, Centinela y Validador

### **Historial de Ausencias**: 
Seguimiento de inasistencias por DNI

### **Auditoría**: 
Registro de todas las acciones en el sistema

### **Sistema de Autenticación**
- Interfaz de login visual con logo municipal
- Validación frontend con CAPTCHA después de múltiples intentos
- Fondo personalizado con imagen institucional
- Modo desarrollo sin validación de backend

### **Gestión de Incidencias**
- Registro completo de incidencias del personal
- Tipos de asuntos: Falta disciplinaria, Abandono de servicio, Inasistencia
- Campos específicos por tipo de incidencia
- Generación de informes en PDF profesionales

### **Integración con Mapas**
- Selector de ubicación con Leaflet
- Geocoding inverso para obtener direcciones
- Marcadores interactivos en el mapa
- Coordenadas GPS precisas

### **Interfaz Moderna**
- Diseño responsive para todos los dispositivos
- Modo oscuro/claro con persistencia
- Animaciones y transiciones suaves
- Iconografía consistente con React Icons

## Tecnologías Utilizadas

### **Frontend**
- **React 18** - Biblioteca principal
- **Vite** - Build tool y dev server
- **React Leaflet** - Mapas interactivos
- **jsPDF** - Generación de PDFs
- **React Icons** - Iconografía

### **Estilos**
- **CSS3** con variables personalizadas
- **Grid & Flexbox** para layouts
- **Animaciones CSS** nativas
- **Diseño responsive** mobile-first

### **Herramientas**
- **Git** - Control de versiones
- **ESLint** - Linting de código
- **Local Storage** - Persistencia temporal

## Tecnologías Utilizadas

### Frontend
- **React 18.2** - Framework principal
- **Vite 5.0** - Build tool y dev server
- **React Router DOM 7.9** - Navegación y rutas

### Estado y Persistencia
- **Redux Toolkit 2.9** - Gestión de estado global
- **Redux Persist 6.0** - Persistencia del estado
- **localStorage** - Almacenamiento de datos local

### Mapas y Geolocalización
- **Leaflet 1.9.4** - Biblioteca de mapas
- **React-Leaflet 4.2** - Integración de Leaflet con React
- **Turf.js 7.3** - Análisis geoespacial

### Generación de Documentos
- **jsPDF 3.0** - Generación de PDFs
- **jsPDF-autotable 5.0** - Tablas para PDFs
- **@react-pdf/renderer 4.3** - Renderizado de PDFs en React

### Comunicación
- **Axios 1.12** - Cliente HTTP
- **Socket.io-client 4.8** - Comunicación en tiempo real

### UI e Iconos
- **React Icons 4.12** - Biblioteca de iconos


## Estructura del Proyecto

```
Control-y-Supervicion-diego/
├── src/
│   ├── api/                    # Servicios de API
│   │   ├── auth.jsx           # Autenticación
│   │   ├── audit.jsx          # Auditoría
│   │   ├── bodycam.jsx        # Bodycams
│   │   ├── config.jsx         # Configuración HTTP
│   │   ├── job.jsx            # Cargos
│   │   ├── jurisdiction.jsx   # Jurisdicciones
│   │   ├── lack.jsx           # Faltas
│   │   ├── lead.jsx           # Encargados
│   │   ├── offender.jsx       # Infractores
│   │   ├── report.jsx         # Reportes
│   │   ├── statistics.jsx     # Estadísticas
│   │   ├── subject.jsx        # Asuntos
│   │   └── user.jsx           # Usuarios
│   ├── components/            # Componentes reutilizables
│   │   ├── UI/                # Componentes de interfaz
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   ├── Login/
│   │   │   └── LoginForm.jsx
│   │   ├── AlertModal.jsx
│   │   ├── AuditoriaTable.jsx
│   │   ├── BodycamTable.jsx
│   │   ├── CalendarioInasistencias.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── ErrorModal.jsx
│   │   ├── IncidenciasTable.jsx
│   │   ├── JobTable.jsx
│   │   ├── LackTable.jsx
│   │   ├── LeadTable.jsx
│   │   ├── MapSelector.jsx
│   │   ├── ModalBodycam.jsx
│   │   ├── ModalInasistencia.jsx
│   │   ├── ModalIncidencia.jsx
│   │   ├── ModalJob.jsx
│   │   ├── ModalLack.jsx
│   │   ├── ModalLead.jsx
│   │   ├── ModalOffender.jsx
│   │   ├── ModalPDFInasistencias.jsx
│   │   ├── ModalPDFInforme.jsx
│   │   ├── ModalSubject.jsx
│   │   ├── ModalUser.jsx
│   │   ├── ModalViewContent.jsx
│   │   ├── OffenderTable.jsx
│   │   ├── PDFDocument.jsx
│   │   ├── SessionExpiredModal.jsx
│   │   ├── SubjectTable.jsx
│   │   ├── SuccessModal.jsx
│   │   ├── Toast.jsx
│   │   ├── ToastContainer.jsx
│   │   └── UserTable.jsx
│   ├── context/
│   │   └── NotificationContext.jsx
│   ├── layouts/               # Layouts por rol
│   │   ├── DashboardLayoutAdmin.jsx
│   │   ├── DashboardLayoutCentinela.jsx
│   │   ├── DashboardLayoutSupervisor.jsx
│   │   └── DashboardLayoutValidator.jsx
│   ├── pages/                 # Páginas principales
│   │   ├── Dashboard/
│   │   │   ├── components/
│   │   │   │   ├── BarChart.jsx
│   │   │   │   ├── CalendarModal.jsx
│   │   │   │   ├── CircularProgress.jsx
│   │   │   │   ├── DateCard.jsx
│   │   │   │   ├── DateRangeModal.jsx
│   │   │   │   ├── LineChart.jsx
│   │   │   │   ├── PersonalTable.jsx
│   │   │   │   ├── RadarChart.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   ├── SupervisionCard.jsx
│   │   │   │   ├── TurnoList.jsx
│   │   │   │   └── WelcomeCard.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── Auditoria/
│   │   │   └── AuditoriaPage.jsx
│   │   ├── Bodycam/
│   │   │   └── BodycamPage.jsx
│   │   ├── Inasistencias/
│   │   │   └── InasistenciasPage.jsx
│   │   ├── Incidencias/
│   │   │   └── IncidenciasPage.jsx
│   │   ├── Jobs/
│   │   │   └── JobsPage.jsx
│   │   ├── Lack/
│   │   │   └── LackPage.jsx
│   │   ├── Leads/
│   │   │   └── LeadsPage.jsx
│   │   ├── Offender/
│   │   │   └── OffenderPage.jsx
│   │   ├── Subject/
│   │   │   └── SubjectPage.jsx
│   │   ├── Usuarios/
│   │   │   └── UsuariosPage.jsx
│   │   ├── Login.jsx
│   │   ├── LoginPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   └── UnauthorizedPage.jsx
│   ├── routes/                # Sistema de rutas
│   │   ├── PrivateRoute.jsx
│   │   ├── PublicRoute.jsx
│   │   └── Router.jsx
│   ├── App.jsx               # Componente raíz
│   ├── main.jsx              # Punto de entrada
│   └── styles.css            # Estilos globales
├── public/                   # Recursos públicos
├── CLAUDE.md                 # Guía para Claude Code
├── package.json
├── vite.config.js
└── README.md
```

## Documentación Detallada de Componentes

### Componentes de Mapas
**MapSelector.jsx**: Selector de ubicación geográfica con:
- Mapa interactivo Leaflet centrado en Lima (-12.0464, -77.0428)
- Tiles de OpenStreetMap
- Geocodificación inversa con API Nominatim
- Selección de coordenadas por clic

### Modales de Gestión
**ModalIncidencia.jsx**: Formulario dinámico para crear/editar incidencias con:
- Validación de DNI (8 dígitos)
- Campos condicionales según tipo de incidencia
- Selector de bodycam (excepto para inasistencias)
- Integración con MapSelector
- Dropdown en cascada para destinatarios

**ModalPDFInforme.jsx**: Generador de reportes PDF con:
- Visualización de datos de incidencia
- Tabla de historial de inasistencias por DNI
- Generación automática con jsPDF
- Formato de informe oficial

**ModalInasistencia.jsx**: Formulario específico para inasistencias:
- Clasificación: Justificada/Injustificada
- Sin requerimiento de bodycam
- Selección de fecha de falta

### Tablas de Datos
Todas las tablas incluyen funcionalidades de:
- Ordenamiento por columnas
- Búsqueda y filtrado
- Acciones de edición y eliminación
- Paginación (cuando aplica)

### UI Principal
**Topbar.jsx**: Barra superior con:
- Toggle de tema claro/oscuro
- Información de usuario
- Notificaciones en tiempo real
- Botón de logout

**Sidebar.jsx**: Menú lateral con:
- Navegación por módulos
- Iconos react-icons
- Rutas dinámicas por rol
- Estado activo visual

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-4.4.5-purple)
![License](https://img.shields.io/badge/License-MIT-green)
## Documentación de Datos

### Modelo de Incidencia
```javascript
{
  id: string,              // ID único basado en timestamp
  dni: string,             // DNI de 8 dígitos (requerido)
  asunto: string,          // "Falta disciplinaria" | "Abandono de servicio" | "Inasistencia"
  falta: string,           // Subtipo específico de falta
  turno: string,           // "Mañana" | "Tarde" | "Noche"
  medio: string,           // "bodycam" | "reporte"
  fechaIncidente: string,  // Fecha ISO
  horaIncidente: string,   // Formato HH:mm
  bodycamNumber: string,   // ID de bodycam (requerido excepto inasistencias)
  bodycamAsignadaA: string,
  encargadoBodycam: string,
  ubicacion: {
    coordinates: [lat, lng],
    address: string
  },
  jurisdiccion: string,
  dirigidoA: string,       // "Jefe de operaciones" | "Coordinadores" | "Subgerente"
  destinatario: string,
  cargo: string,
  regLab: string,
  tipoInasistencia: string,// "Justificada" | "Injustificada" (solo para inasistencias)
  fechaFalta: string,      // Para inasistencias
  conCopia: boolean,
  cc: string[],
  createdAt: string,
  updatedAt: string
}
```

### Modelo de Usuario
```javascript
{
  id: number,
  username: string,
  role: "Admin" | "Supervisor" | "Centinela" | "Validador",
  active: boolean
}
```

### Modelo de Auditoría
```javascript
{
  id: number,
  action: string,
  entity: string,
  userId: number,
  timestamp: string,
  details: object
}
```

## Recursos Gráficos

### Assets Disponibles
- **logo-sjl.png**: Logo de la Municipalidad de San Juan de Lurigancho
- **muni-background.png**: Fondo institucional
- **wolf.png / lobo.png**: Logo Centinela
- **user-avatar.png**: Avatar por defecto

### Iconografía
El sistema utiliza **react-icons** con las siguientes familias:
- **FiX**: Feather Icons
- **MdX**: Material Design
- **FaX**: Font Awesome
- **IoX**: Ionicons

## Instalación y Configuración

### Requisitos Previos
- Node.js 16.0 o superior
- npm o yarn

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>

# Navegar al directorio
cd Control-y-Supervicion-diego

# Instalar dependencias
npm install
```

### Variables de Entorno
Configurar las variables necesarias para la API backend:
```bash
VITE_API_URL=http://localhost:3000/api
```

## Scripts Disponibles

```bash
# Desarrollo - Inicia servidor en http://localhost:5173
npm run dev

# Producción - Genera build optimizado en /dist
npm run build

# Preview - Previsualiza build de producción
npm run preview
```

## Funcionalidades Principales

### 1. Gestión de Incidencias
- **Crear**: Formulario completo con validaciones
- **Editar**: Modificación de registros existentes
- **Eliminar**: Eliminación con confirmación
- **Filtrar**: Por asunto, turno, tipo de inasistencia
- **Buscar**: Por DNI, nombre, o palabra clave
- **Exportar**: Generación de PDF individual

### 2. Control de Bodycams
- Registro de dispositivos bodycam
- Asignación a personal
- Historial de uso
- Vinculación con incidencias

### 3. Sistema de Reportes
- Informes individuales en PDF
- Historial de inasistencias por DNI
- Reportes estadísticos del dashboard
- Exportación de datos

### 4. Dashboard y Estadísticas
- Visualización de métricas clave
- Gráficos de barras, líneas y radar
- Filtrado por rango de fechas
- Estadísticas por turno y tipo

### 5. Gestión de Usuarios
- CRUD de usuarios
- Asignación de roles
- Control de acceso por permisos
- Activación/desactivación de cuentas

### 6. Auditoría
- Registro automático de acciones
- Trazabilidad completa
- Filtros por usuario, acción y fecha
- Exportación de logs

## Arquitectura de Componentes

### Flujo de Autenticación
```
LoginPage → API Auth → Redux Store → Router → DashboardLayout[Role]
```

### Flujo de Datos
```
Component → Action → API Service → Backend
                ↓
          Redux Store → Component Update
```

### Sistema de Rutas
- **PublicRoute**: Solo accesible sin autenticación
- **PrivateRoute**: Requiere autenticación
- **RoleBasedLayout**: Layout según rol de usuario

## Formatos de Datos Soportados

### Entrada
- **Fechas**: ISO 8601 (YYYY-MM-DD)
- **Horas**: HH:mm formato 24h
- **DNI**: 8 dígitos numéricos
- **Coordenadas**: [latitude, longitude]

### Salida
- **PDF**: Informes y reportes
- **JSON**: Datos de API
- **CSV**: Exportación de tablas (futuro)

## Configuración Avanzada

### Temas
El sistema soporta tema claro/oscuro mediante atributos CSS:
```css
[data-theme="dark"] { /* Variables oscuras */ }
[data-theme="light"] { /* Variables claras */ }
```

Persistencia en localStorage con key: `centinela-theme`

### Persistencia de Datos
**Redux Persist** configurado para mantener:
- Estado de autenticación
- Preferencias de usuario
- Datos de sesión

**localStorage** utilizado para:
- Tema de interfaz
- Datos temporales de formularios

### API Configuration
Configuración centralizada en [src/api/config.jsx](src/api/config.jsx):
- Base URL del backend
- Interceptores de request/response
- Manejo de tokens JWT
- Timeout de peticiones

## Despliegue

### Build de Producción
```bash
# Generar build
npm run build

# El output estará en /dist
```

### Optimizaciones Incluidas
- Code splitting automático
- Minificación de JS/CSS
- Tree shaking
- Asset optimization

### Servidor Web
La aplicación build puede servirse con:
- **Nginx**: Recomendado para producción
- **Apache**: Con mod_rewrite habilitado
- **Vercel/Netlify**: Deploy automático

### Ejemplo Nginx
```nginx
server {
  listen 80;
  server_name centinela.example.com;
  root /var/www/centinela/dist;

  location / {
    try_files $uri /index.html;
  }
}
```

## Contribución

### Estructura de Commits
```
tipo(alcance): descripción

- feat: Nueva funcionalidad
- fix: Corrección de bugs
- docs: Documentación
- style: Formato de código
- refactor: Refactorización
- test: Tests
- chore: Tareas de mantenimiento
```

### Proceso de Desarrollo
1. Crear rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Desarrollar y realizar commits descriptivos
3. Crear Pull Request con descripción detallada
4. Code review por al menos un revisor
5. Merge a `main` después de aprobación

### Estándares de Código
- **Componentes**: PascalCase
- **Funciones**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Archivos**: Mismo nombre que componente principal

---

**Desarrollado para**: CECOM - Municipalidad de San Juan de Lurigancho
**Versión**: 1.0.0
**Licencia**: Privado


