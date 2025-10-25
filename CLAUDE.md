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

- **Frontend Framework**: React 18.2 with JSX
- **Build Tool**: Vite 5.0
- **Map Integration**: Leaflet + React-Leaflet
- **PDF Generation**: jsPDF
- **Icons**: react-icons
- **State Management**: React hooks (useState, useEffect)
- **Data Persistence**: localStorage

## Architecture

### Application Flow

1. **Authentication**: Login screen (src/pages/Login.jsx) validates users and displays CAPTCHA after failed attempts. Currently in development mode without real backend validation.
2. **Main App**: After login, users see Topbar (navigation), Sidebar (menu), and the main content area showing IncidenciasPage.
3. **Core Functionality**: The system manages three types of incidents:
   - "Falta disciplinaria" (Disciplinary fault)
   - "Abandono de servicio" (Service abandonment)
   - "Inasistencia" (Absence)

### Directory Structure

```
src/
├── pages/              # Page-level components
│   ├── Login.jsx       # Authentication page
│   └── Incidencias/
│       └── IncidenciasPage.jsx  # Main incidents management page
├── components/         # Reusable components
│   ├── UI/             # UI components (Topbar, Sidebar)
│   ├── IncidenciasTable.jsx    # Incidents table display
│   ├── ModalIncidencia.jsx     # Create/edit incident modal
│   ├── ModalPDFInforme.jsx     # PDF report generator modal
│   └── MapSelector.jsx         # Map-based location picker
├── utils/
│   └── storage.js      # localStorage management functions
├── App.jsx             # Root component with auth state
└── main.jsx            # Application entry point
```

### Data Model

Incidents (incidencias) are stored in localStorage with the following structure:

```javascript
{
  id: string,              // Timestamp-based unique ID
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
  dirigidoA: string,       // Report recipient type: "Jefe de operaciones" | "Coordinadores" | "Subgerente"
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

#### ModalIncidencia.jsx
- Manages incident creation and editing
- Dynamic form fields based on incident type:
  - **Inasistencia**: Shows absence-specific fields (tipoInasistencia, fechaFalta), hides bodycam fields
  - **Other incidents**: Requires bodycam information
- Cascading dropdowns for recipient selection
- DNI validation (exactly 8 digits)
- Automatic date/time population for new incidents

#### MapSelector.jsx
- Interactive Leaflet map for location selection
- Uses OpenStreetMap tiles
- Reverse geocoding via Nominatim API to display addresses
- Centered on Lima, Peru coordinates (-12.0464, -77.0428)

#### storage.js
- Handles localStorage read/write operations
- Key: `centinela_incidencias_v2`
- Includes migration logic for backward compatibility
- Provides default values for missing fields

#### IncidenciasPage.jsx
- Main control hub for incidents
- Filtering capabilities: asunto, turno, tipoInasistencia, search
- Displays IncidenciasTable with filtered data
- Opens ModalPDFInforme when editing (viewing) an incident
- Groups absences by DNI for historical context in reports

### Theme System

The app supports light/dark mode:
- Theme state persisted in localStorage key: `centinela-theme`
- Attribute set on `document.documentElement`: `data-theme="dark"` or `data-theme="light"`
- Toggle button in Topbar.jsx

## Important Implementation Notes

1. **No Backend**: Currently in development mode without real authentication or backend persistence. All data stored in localStorage.

2. **Map Configuration**: Leaflet requires explicit icon configuration. Icons are loaded from unpkg CDN URLs in MapSelector.jsx.

3. **Incident Type Logic**: Bodycam fields are only required for "Falta disciplinaria" and "Abandono de servicio". For "Inasistencia", the medio field defaults to "reporte".

4. **Recipient Mapping**: The destinatario dropdown options depend on the dirigidoA selection. This mapping is hardcoded in ModalIncidencia.jsx.

5. **PDF Generation**: ModalPDFInforme.jsx uses jsPDF to generate incident reports. For "Inasistencia" incidents, it includes historical absence data for the same DNI.

6. **Form Validation**: DNI must be exactly 8 digits. Most fields are required except ubicacion (map selection).

## Styling

- Global styles in src/styles.css
- CSS custom properties for theming (defined with [data-theme] attribute)
- No CSS framework - custom styles throughout

## Development Notes

- The project uses Vite's default React plugin configuration
- ESLint is configured but rules are minimal (see eslint.config.js)
- React is rendered without StrictMode in main.jsx
- Assets referenced with absolute paths from `/src/assets/`
