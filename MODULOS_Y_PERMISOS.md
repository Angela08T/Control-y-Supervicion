# Documentación de Módulos y Permisos - Sistema Centinela

**Sistema de Control y Supervisión - CECOM San Juan de Lurigancho**

---

## Índice

1. [Roles del Sistema](#roles-del-sistema)
2. [Matriz de Permisos por Módulo](#matriz-de-permisos-por-módulo)
3. [Descripción de Módulos](#descripción-de-módulos)
4. [Casos de Uso por Rol](#casos-de-uso-por-rol)

---

## Roles del Sistema

El sistema cuenta con 4 roles principales:

### 1. **ADMIN (Administrador)**
- **Acceso**: Total
- **Descripción**: Tiene control completo sobre todos los módulos del sistema
- **Responsabilidades**:
  - Gestión completa de usuarios
  - Configuración de catálogos (Jobs, Personal, Asuntos, Faltas)
  - Acceso a auditoría
  - Gestión de infractores
  - Aprobación/rechazo de incidencias

### 2. **SUPERVISOR**
- **Acceso**: Medio-Alto
- **Descripción**: Gestiona operaciones diarias y personal de campo
- **Responsabilidades**:
  - Gestión de incidencias
  - Creación de usuarios centinela
  - Consulta de catálogos (Asuntos, Faltas, Infractores)
  - Gestión de bodycams
  - Gestión de personal y cargos

### 3. **CENTINELA (Sentinel)**
- **Acceso**: Básico
- **Descripción**: Personal de campo que reporta incidencias
- **Responsabilidades**:
  - Crear incidencias
  - Consultar bodycams
  - Enviar incidencias para validación

### 4. **VALIDATOR (Validador)**
- **Acceso**: Específico
- **Descripción**: Revisa y valida incidencias enviadas
- **Responsabilidades**:
  - Ver incidencias pendientes
  - Aprobar o rechazar incidencias
  - Consultar dashboard

---

## Matriz de Permisos por Módulo

| Módulo | Admin | Supervisor | Centinela | Validator |
|--------|-------|------------|-----------|-----------|
| **Dashboard** | ✅ Ver | ✅ Ver | ✅ Ver | ✅ Ver |
| **Incidencias** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar<br>✅ Enviar<br>✅ Validar | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar<br>✅ Enviar<br>❌ Validar | ✅ Ver<br>✅ Crear<br>❌ Editar<br>❌ Eliminar<br>✅ Enviar<br>❌ Validar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar<br>❌ Enviar<br>❌ Validar |
| **Bodycam** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ❌ Ver |
| **Usuarios** | ✅ Ver<br>✅ Crear todos<br>✅ Editar todos<br>✅ Eliminar todos | ✅ Ver<br>✅ Crear centinelas<br>✅ Editar centinelas<br>✅ Eliminar centinelas | ❌ Ver | ❌ Ver |
| **Cargos (Jobs)** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ❌ Ver | ❌ Ver |
| **Personal (Leads)** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ❌ Ver | ❌ Ver |
| **Asuntos (Subjects)** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ❌ Ver | ❌ Ver |
| **Faltas (Lacks)** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ❌ Ver | ❌ Ver |
| **Infractores (Offenders)** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ✅ Ver<br>❌ Crear<br>❌ Editar<br>❌ Eliminar | ❌ Ver | ❌ Ver |
| **Auditoría** | ✅ Ver<br>✅ Crear<br>✅ Editar<br>✅ Eliminar | ❌ Ver | ❌ Ver | ❌ Ver |

---

## Descripción de Módulos

### 1. 📊 Dashboard
**Ruta**: `/dashboard/{role}`
**Roles con acceso**: Todos

**Funcionalidades**:
- Vista general de estadísticas del sistema
- Serenos activos y en campo
- Gráficos de tendencias de incidencias
- Tabla de personal con incidencias
- Filtros por rango de fechas
- Indicadores de supervisión de campo

**Componentes principales**:
- `StatCard`: Tarjetas de estadísticas
- `LineChart`: Gráfico de líneas de tendencias
- `BarChart`: Gráfico de barras por asunto
- `PersonalTable`: Tabla de personal con incidencias
- `SupervisionCard`: Tarjeta de supervisión

---

### 2. 📝 Incidencias
**Ruta**: `/dashboard/{role}/incidencias`
**Roles con acceso**: Admin, Supervisor, Centinela, Validator

**Funcionalidades**:
- Crear nuevas incidencias
- Editar incidencias (Admin/Supervisor)
- Eliminar incidencias (Admin/Supervisor)
- Enviar incidencias a validador (Admin/Supervisor/Centinela)
- Validar incidencias: Aprobar/Rechazar (Admin/Validator)
- Generar PDF de informes
- Filtros por asunto, turno, tipo de inasistencia
- Búsqueda por DNI
- Gestión de evidencias (imágenes)

**Tipos de incidencias**:
1. **Falta disciplinaria**: Requiere bodycam, ubicación, falta específica
2. **Abandono de servicio**: Requiere bodycam, ubicación
3. **Inasistencia**: No requiere bodycam, incluye tipo (justificada/injustificada)

**Componentes principales**:
- `IncidenciasTable`: Tabla con todas las incidencias
- `ModalIncidencia`: Modal para crear/editar
- `ModalPDFInforme`: Modal para generar PDF
- `MapSelector`: Selector de ubicación con mapa
- `EvidenceGallery`: Galería de evidencias fotográficas

**Estados de incidencia**:
- `pendiente`: Creada, sin enviar
- `enviado`: Enviada al validador
- `aprobado`: Aprobada por validador
- `rechazado`: Rechazada por validador

---

### 3. 📹 Bodycam
**Ruta**: `/dashboard/{role}/bodycam`
**Roles con acceso**: Admin (CRUD), Supervisor (solo lectura), Centinela (solo lectura)

**Funcionalidades**:
- Ver lista de bodycams
- Crear bodycam (Admin)
- Editar bodycam (Admin)
- Eliminar bodycam (Admin)
- Búsqueda por código o nombre de asignado
- Paginación
- Toggle habilitado/deshabilitado

**Campos**:
- `codigo`: Código único de bodycam
- `asignado_a`: Persona a quien está asignada
- `encargado`: Responsable de la bodycam
- `status`: Activo/Inactivo

**Componentes**:
- `BodycamTable`: Tabla de bodycams
- `ModalBodycam`: Modal de creación/edición

---

### 4. 👥 Usuarios
**Ruta**: `/dashboard/{role}/usuarios`
**Roles con acceso**: Admin (todos), Supervisor (solo centinelas)

**Funcionalidades**:
- Ver lista de usuarios
- Crear usuarios:
  - Admin: Puede crear cualquier rol
  - Supervisor: Solo puede crear centinelas
- Editar usuarios:
  - Admin: Puede editar cualquier usuario
  - Supervisor: Solo puede editar centinelas
- Eliminar usuarios (soft delete)
- Toggle habilitado/deshabilitado
- Búsqueda por username o email
- Paginación

**Campos**:
- `username`: Nombre de usuario único
- `email`: Correo electrónico
- `password`: Contraseña (solo creación)
- `role`: ADMINISTRATOR, SUPERVISOR, SENTINEL, VALIDATOR
- `status`: Activo/Inactivo

**Validaciones**:
- Username único
- Email único
- Password mínimo 6 caracteres

**Componentes**:
- `UserTable`: Tabla de usuarios
- `ModalUser`: Modal de creación/edición

---

### 5. 💼 Cargos (Jobs)
**Ruta**: `/dashboard/{role}/cargos`
**Roles con acceso**: Admin (CRUD), Supervisor (solo lectura)

**Funcionalidades**:
- Ver lista de cargos
- Crear cargo (Admin)
- Editar cargo (Admin)
- Eliminar cargo (Admin)
- Toggle habilitado/deshabilitado
- Búsqueda por nombre
- Paginación

**Campos**:
- `name`: Nombre del cargo
- `description`: Descripción (opcional)

**Componentes**:
- `JobTable`: Tabla de cargos
- `ModalJob`: Modal de creación/edición

---

### 6. 👨‍💼 Personal (Leads)
**Ruta**: `/dashboard/{role}/personal`
**Roles con acceso**: Admin (CRUD), Supervisor (solo lectura)

**Funcionalidades**:
- Ver lista de personal
- Crear personal (Admin)
- Editar personal (Admin)
- Eliminar personal (Admin)
- Toggle habilitado/deshabilitado
- Búsqueda por nombre o DNI
- Paginación

**Campos**:
- `name`: Nombre completo
- `dni`: DNI (8 dígitos)
- `cargo`: Cargo (relación con Jobs)
- `email`: Correo electrónico (opcional)

**Componentes**:
- `LeadTable`: Tabla de personal
- `ModalLead`: Modal de creación/edición

---

### 7. 📋 Asuntos (Subjects)
**Ruta**: `/dashboard/{role}/asuntos`
**Roles con acceso**: Admin (CRUD), Supervisor (solo lectura)

**Funcionalidades**:
- Ver lista de asuntos
- Crear asunto (Admin)
- Editar asunto (Admin)
- Eliminar asunto (Admin)
- Toggle habilitado/deshabilitado
- Búsqueda por nombre
- Paginación

**Campos**:
- `name`: Nombre del asunto
- `description`: Descripción (opcional)

**Tipos de asuntos**:
- Falta disciplinaria
- Abandono de servicio
- Inasistencia

**Componentes**:
- `SubjectTable`: Tabla de asuntos
- `ModalSubject`: Modal de creación/edición

---

### 8. ⚠️ Faltas (Lacks)
**Ruta**: `/dashboard/{role}/faltas`
**Roles con acceso**: Admin (CRUD), Supervisor (solo lectura)

**Funcionalidades**:
- Ver lista de faltas
- Crear falta (Admin)
- Editar falta (Admin)
- Eliminar falta (Admin)
- Toggle habilitado/deshabilitado
- Búsqueda por nombre (usando endpoint backend)
- Paginación

**Campos**:
- `name`: Nombre de la falta
- `description`: Descripción (opcional)
- `article`: Artículo normativo

**Ejemplos de faltas**:
- Dormir en horario laboral (Art. 68.12)
- Comer en horario laboral (Art. 68.15)
- Abandono injustificado del puesto (Art. 70.05)

**Componentes**:
- `LackTable`: Tabla de faltas
- `ModalLack`: Modal de creación/edición

---

### 9. 🚫 Infractores (Offenders)
**Ruta**: `/dashboard/{role}/infractores`
**Roles con acceso**: Admin (CRUD), Supervisor (solo lectura)

**Funcionalidades**:
- Ver lista de infractores
- Crear infractor (Admin)
- Editar infractor (Admin)
- Eliminar infractor (Admin)
- Toggle habilitado/deshabilitado
- Búsqueda por DNI (8 dígitos exactos)
- Paginación

**Campos**:
- `name`: Nombre
- `lastname`: Apellidos
- `dni`: DNI (8 dígitos, validado)
- `job`: Cargo
- `regime`: Régimen laboral
- `shift`: Turno (Mañana/Tarde/Noche)
- `subgerencia`: Subgerencia

**Badges visuales**:
- DNI: Morado (monospace)
- Turno Mañana: Azul
- Turno Tarde: Naranja
- Turno Noche: Púrpura

**Componentes**:
- `OffenderTable`: Tabla de infractores
- `ModalOffender`: Modal de creación/edición

---

### 10. 🔍 Auditoría
**Ruta**: `/dashboard/admin/auditoria`
**Roles con acceso**: Solo Admin

**Funcionalidades**:
- Ver logs de auditoría del sistema
- Filtros por fecha, usuario, acción
- Registro de todas las operaciones CRUD
- Exportación de logs

**Datos registrados**:
- Usuario que realizó la acción
- Tipo de acción (CREATE, UPDATE, DELETE)
- Módulo afectado
- Fecha y hora
- Detalles del cambio

---

## Casos de Uso por Rol

### 👨‍💼 ADMIN - Casos de Uso

#### Día típico de un Admin:

1. **Gestión de Catálogos**
   ```
   1. Accede a "Cargos" → Crea nuevo cargo "Coordinador de Zona Norte"
   2. Accede a "Faltas" → Actualiza artículo de falta existente
   3. Accede a "Asuntos" → Habilita asunto previamente deshabilitado
   ```

2. **Gestión de Usuarios**
   ```
   1. Accede a "Usuarios" → Crea nuevo supervisor
   2. Deshabilita cuenta de centinela que renunció
   3. Edita rol de usuario existente
   ```

3. **Configuración de Infractores**
   ```
   1. Accede a "Infractores" → Registra nuevo infractor con DNI 12345678
   2. Actualiza turno de infractor existente
   ```

4. **Validación de Incidencias**
   ```
   1. Accede a "Incidencias" → Filtra por estado "enviado"
   2. Revisa incidencia → Aprueba o rechaza con comentario
   ```

5. **Auditoría**
   ```
   1. Accede a "Auditoría" → Revisa logs del día
   2. Identifica actividad sospechosa
   3. Exporta logs del mes
   ```

---

### 👨‍💼 SUPERVISOR - Casos de Uso

#### Día típico de un Supervisor:

1. **Gestión de Incidencias**
   ```
   1. Accede a "Incidencias" → Crea nueva incidencia "Abandono de servicio"
   2. Selecciona bodycam asignada
   3. Marca ubicación en mapa
   4. Envía a validador
   ```

2. **Gestión de Personal Centinela**
   ```
   1. Accede a "Usuarios" → Crea nuevo usuario centinela
   2. Asigna credenciales
   3. Informa al nuevo centinela
   ```

3. **Consulta de Catálogos**
   ```
   1. Accede a "Asuntos" → Consulta tipos de asuntos disponibles
   2. Accede a "Faltas" → Busca artículo para incluir en informe
   3. Accede a "Infractores" → Busca por DNI para verificar datos
   ```

4. **Gestión de Bodycams**
   ```
   1. Accede a "Bodycam" → Consulta disponibilidad
   2. Identifica bodycam asignada a centinela específico
   ```

5. **Consulta de Dashboard**
   ```
   1. Revisa estadísticas del día
   2. Identifica zonas con más incidencias
   3. Analiza tendencias semanales
   ```

---

### 👮 CENTINELA - Casos de Uso

#### Día típico de un Centinela:

1. **Reporte de Incidencia en Campo**
   ```
   1. Detecta falta disciplinaria en ronda
   2. Accede a "Incidencias" → Nueva incidencia
   3. Selecciona asunto "Falta disciplinaria"
   4. Elige falta "Dormir en horario laboral"
   5. Ingresa DNI del infractor
   6. Selecciona bodycam asignada
   7. Marca ubicación en mapa
   8. Sube fotos como evidencia
   9. Envía incidencia al supervisor
   ```

2. **Reporte de Inasistencia**
   ```
   1. Nota ausencia de personal
   2. Accede a "Incidencias" → Nueva incidencia
   3. Selecciona "Inasistencia"
   4. Marca como "Injustificada"
   5. Ingresa DNI del ausente
   6. NO requiere bodycam ni mapa
   7. Envía reporte
   ```

3. **Consulta de Bodycams**
   ```
   1. Accede a "Bodycam" → Consulta su bodycam asignada
   2. Verifica código y responsable
   ```

---

### ✅ VALIDATOR - Casos de Uso

#### Día típico de un Validator:

1. **Revisión de Incidencias Pendientes**
   ```
   1. Accede a "Incidencias" → Filtra por estado "enviado"
   2. Revisa primera incidencia:
      - Verifica evidencias fotográficas
      - Revisa ubicación en mapa
      - Comprueba datos del infractor
      - Lee descripción detallada
   3. APRUEBA si todo es correcto
   4. RECHAZA si falta información (agrega comentario)
   ```

2. **Seguimiento de Validaciones**
   ```
   1. Filtra incidencias "aprobado" del día
   2. Revisa estadísticas de aprobación/rechazo
   3. Identifica patrones de incidencias recurrentes
   ```

3. **Consulta de Dashboard**
   ```
   1. Revisa tendencias de incidencias
   2. Identifica zonas críticas
   ```

---

## Flujos de Trabajo Completos

### Flujo 1: Creación de Incidencia Completa

```
CENTINELA:
1. Detecta falta en campo (ej: sereno durmiendo)
2. Login → Dashboard → Incidencias → Nueva Incidencia
3. Completa formulario:
   - Asunto: "Falta disciplinaria"
   - Falta: "Dormir en horario laboral"
   - DNI: "12345678"
   - Turno: "Noche"
   - Bodycam: "BC-001"
   - Ubicación: Hace clic en mapa
   - Evidencias: Sube 2 fotos
4. Click "Enviar a Validador"
5. Estado: "enviado"

VALIDATOR:
6. Login → Dashboard → Incidencias
7. Filtra: Estado = "enviado"
8. Abre incidencia enviada
9. Revisa:
   - Fotos son claras ✓
   - Ubicación correcta ✓
   - Datos completos ✓
10. Click "Aprobar"
11. Estado: "aprobado"

SUPERVISOR/ADMIN:
12. Accede a incidencia aprobada
13. Click "Descargar PDF"
14. PDF se genera con:
    - Logo de la municipalidad
    - Datos del informe
    - Evidencias fotográficas
    - Ubicación en mapa
    - Firmas digitales
15. Envía PDF a área correspondiente
```

### Flujo 2: Gestión de Usuario Nuevo

```
SUPERVISOR:
1. Login → Dashboard → Usuarios → Nuevo Usuario
2. Completa formulario:
   - Username: "centinela.norte"
   - Email: "norte@cecom.gob.pe"
   - Password: "temporal123"
   - Role: "SENTINEL"
3. Click "Crear"
4. Sistema crea usuario habilitado

ADMIN (si necesita crear otro supervisor):
1. Login → Dashboard → Usuarios → Nuevo Usuario
2. Completa formulario:
   - Username: "supervisor.zona2"
   - Email: "supervisor2@cecom.gob.pe"
   - Password: "super123"
   - Role: "SUPERVISOR"
3. Click "Crear"
```

### Flujo 3: Configuración de Catálogos

```
ADMIN:
1. Configurar nuevo cargo:
   Dashboard → Cargos → Nuevo → "Inspector de Turno" → Crear

2. Configurar nueva falta:
   Dashboard → Faltas → Nuevo
   - Nombre: "Uso de celular en servicio"
   - Artículo: "68.20"
   - Crear

3. Registrar infractor:
   Dashboard → Infractores → Nuevo
   - Nombre: "Juan"
   - Apellido: "Pérez López"
   - DNI: "87654321"
   - Cargo: "Sereno"
   - Turno: "Noche"
   - Crear

4. Ahora estos datos están disponibles para:
   - SUPERVISOR: Consultar y usar en incidencias
   - CENTINELA: Usar en creación de incidencias
```

---

## Resumen de Accesos

### Acceso Total (CRUD completo):
- **Admin**: Todos los módulos

### Acceso de Lectura y Escritura:
- **Supervisor**: Incidencias, Usuarios (solo centinelas)
- **Centinela**: Incidencias

### Acceso de Solo Lectura:
- **Supervisor**: Bodycam, Cargos, Personal, Asuntos, Faltas, Infractores
- **Centinela**: Bodycam
- **Validator**: Incidencias

### Acceso Especial:
- **Validator**: Aprobar/Rechazar incidencias
- **Admin**: Auditoría (exclusivo)

---

## Notas de Seguridad

1. **Soft Delete**: Todos los módulos usan eliminación lógica (campo `deleted_at`)
2. **Validación de Roles**: El middleware de backend valida permisos en cada petición
3. **Protección de Rutas**: React Router protege rutas según rol con `PrivateRoute`
4. **Persistencia de Sesión**: Redux Persist mantiene sesión activa
5. **Auditoría**: Todas las acciones de Admin son registradas

---

## Endpoints Base

- **Desarrollo**: `http://192.168.137.217:3021/api`
- **Producción**: `http://tuservidor.com/api`

---

**Última actualización**: 2025-01-13
