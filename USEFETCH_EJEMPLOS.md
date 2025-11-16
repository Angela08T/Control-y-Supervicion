# 🎣 Guía de Uso: useFetch Hook

Hook robusto para llamadas HTTP con manejo automático de autenticación, loading global y errores.

## 📋 Características

- ✅ **Autenticación automática**: Obtiene el token de Redux automáticamente
- ✅ **Loading global**: Muestra/oculta loader con Redux (`auth.loading`)
- ✅ **Manejo de errores 401**: Cierra sesión automáticamente si el token expira
- ✅ **Alertas automáticas**: Muestra SweetAlert cuando la sesión expira
- ✅ **Lazy loading**: Opción para no mostrar loader global
- ✅ **API Key support**: Soporte para usar API key en vez de token
- ✅ **5 métodos HTTP**: GET, POST, PATCH, PUT, DELETE

---

## 🚀 Uso Básico

### Importar el hook

```javascript
import useFetch from '@/Components/hooks/useFetch';
import { API_URL } from '@/helpers/Constants';
```

### Inicializar en tu componente

```javascript
function MiComponente() {
  const { getData, postData, patchData, putData, deleteData } = useFetch();

  // ...usar las funciones
}
```

---

## 📖 Ejemplos de Uso

### 1️⃣ **GET Request** (Obtener datos)

```javascript
import useFetch from '@/Components/hooks/useFetch';
import { API_URL } from '@/helpers/Constants';
import { showError } from '@/helpers/swalConfig';

function UsuariosPage() {
  const { getData } = useFetch();
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const response = await getData(`${API_URL}/users`);

    if (response.status) {
      // ✅ Éxito
      setUsuarios(response.data.data || response.data);
    } else {
      // ❌ Error
      showError('Error', response.message || 'No se pudieron cargar los usuarios');
    }
  };

  return (
    <div>
      {usuarios.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

---

### 2️⃣ **POST Request** (Crear datos)

```javascript
import useFetch from '@/Components/hooks/useFetch';
import { showSuccess, showError } from '@/helpers/swalConfig';

function CrearUsuario() {
  const { postData } = useFetch();

  const handleSubmit = async (formData) => {
    const nuevoUsuario = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'SUPERVISOR'
    };

    const response = await postData(
      `${API_URL}/users`,
      nuevoUsuario
    );

    if (response.status) {
      // ✅ Éxito
      showSuccess('Usuario creado', 'El usuario se creó correctamente');
      // Recargar lista, cerrar modal, etc.
    } else {
      // ❌ Error
      showError('Error', response.message || 'No se pudo crear el usuario');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
}
```

---

### 3️⃣ **PATCH Request** (Actualizar datos)

```javascript
const { patchData } = useFetch();

const actualizarUsuario = async (userId, cambios) => {
  const response = await patchData(
    `${API_URL}/users/${userId}`,
    cambios
  );

  if (response.status) {
    showSuccess('Usuario actualizado');
  } else {
    showError('Error', response.message);
  }
};

// Uso
actualizarUsuario(123, {
  name: 'Nuevo Nombre',
  email: 'nuevo@email.com'
});
```

---

### 4️⃣ **PUT Request** (Reemplazar datos completos)

```javascript
const { putData } = useFetch();

const reemplazarUsuario = async (userId, datosCompletos) => {
  const response = await putData(
    `${API_URL}/users/${userId}`,
    datosCompletos
  );

  if (response.status) {
    showSuccess('Usuario reemplazado');
  } else {
    showError('Error', response.message);
  }
};
```

---

### 5️⃣ **DELETE Request** (Eliminar datos)

```javascript
import { showDeleteConfirm } from '@/helpers/swalConfig';

const { deleteData } = useFetch();

const eliminarUsuario = async (userId) => {
  // Confirmar antes de eliminar
  const confirmed = await showDeleteConfirm('este usuario');

  if (!confirmed) return;

  const response = await deleteData(`${API_URL}/users/${userId}`);

  if (response.status) {
    showSuccess('Usuario eliminado');
    // Recargar lista
  } else {
    showError('Error', response.message);
  }
};
```

---

## ⚙️ Parámetros Avanzados

### **Lazy Loading** (sin loader global)

Útil cuando no quieres mostrar el loader global (por ejemplo, en búsquedas en tiempo real):

```javascript
const { getData } = useFetch();

// Búsqueda sin loader global
const buscarUsuarios = async (searchTerm) => {
  const response = await getData(
    `${API_URL}/users/search?q=${searchTerm}`,
    true  // ← lazy = true (no muestra loader)
  );

  if (response.status) {
    setResultados(response.data);
  }
};
```

### **API Key** (en vez de token)

Para endpoints públicos o que usan API key:

```javascript
const { getData } = useFetch();

const obtenerDatosPublicos = async () => {
  const response = await getData(
    'https://api-publica.com/datos',
    false,  // lazy
    true    // ← apiKey = true
  );
};
```

### **Token Personalizado**

Si necesitas usar un token diferente al del Redux:

```javascript
const { getData } = useFetch();

const obtenerConTokenCustom = async (tokenEspecial) => {
  const response = await getData(
    `${API_URL}/endpoint-especial`,
    false,  // lazy
    false,  // apiKey
    tokenEspecial  // ← token personalizado
  );
};
```

---

## 🔄 Manejo de Respuestas

### Estructura de respuesta exitosa:

```javascript
{
  data: { ... },  // Los datos del backend
  status: true
}
```

### Estructura de respuesta con error:

```javascript
{
  error: Error,
  status: false,
  message: "Mensaje de error"
}
```

### Estructura de error de autenticación (401):

```javascript
{
  isAuthError: true,
  message: "Sesión expirada"
}
```

---

## 💡 Ejemplo Completo: CRUD de Usuarios

```javascript
import React, { useState, useEffect } from 'react';
import useFetch from '@/Components/hooks/useFetch';
import { API_URL } from '@/helpers/Constants';
import { showSuccess, showError, showDeleteConfirm } from '@/helpers/swalConfig';

function UsuariosCRUD() {
  const { getData, postData, patchData, deleteData } = useFetch();
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);

  // GET - Cargar usuarios
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const response = await getData(`${API_URL}/users`);
    if (response.status) {
      setUsuarios(response.data.data || response.data);
    }
  };

  // POST - Crear usuario
  const crearUsuario = async (nuevoUsuario) => {
    const response = await postData(`${API_URL}/users`, nuevoUsuario);

    if (response.status) {
      showSuccess('Usuario creado');
      cargarUsuarios(); // Recargar lista
    } else {
      showError('Error', response.message);
    }
  };

  // PATCH - Actualizar usuario
  const actualizarUsuario = async (userId, cambios) => {
    const response = await patchData(`${API_URL}/users/${userId}`, cambios);

    if (response.status) {
      showSuccess('Usuario actualizado');
      cargarUsuarios();
      setEditando(null);
    } else {
      showError('Error', response.message);
    }
  };

  // DELETE - Eliminar usuario
  const eliminarUsuario = async (userId) => {
    const confirmed = await showDeleteConfirm('este usuario');
    if (!confirmed) return;

    const response = await deleteData(`${API_URL}/users/${userId}`);

    if (response.status) {
      showSuccess('Usuario eliminado');
      cargarUsuarios();
    } else {
      showError('Error', response.message);
    }
  };

  return (
    <div>
      <h1>Gestión de Usuarios</h1>

      {/* Botón crear */}
      <button onClick={() => crearUsuario({ name: 'Nuevo', email: 'nuevo@test.com' })}>
        Crear Usuario
      </button>

      {/* Lista de usuarios */}
      <ul>
        {usuarios.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
            <button onClick={() => actualizarUsuario(user.id, { name: 'Editado' })}>
              Editar
            </button>
            <button onClick={() => eliminarUsuario(user.id)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsuariosCRUD;
```

---

## 🎯 Ventajas de este useFetch

| Característica | Beneficio |
|----------------|-----------|
| **Token automático** | No necesitas pasar el token en cada llamada |
| **Loading global** | El usuario ve un loader automáticamente |
| **Manejo de 401** | Cierra sesión automática si el token expira |
| **Alertas automáticas** | Notifica al usuario cuando la sesión expira |
| **Código limpio** | Menos código duplicado en tus componentes |
| **Lazy loading** | Control sobre cuándo mostrar el loader |
| **Fácil debugging** | Todas las respuestas tienen estructura consistente |

---

## 🚨 Errores Comunes

### ❌ **No validar response.status**

```javascript
// MAL
const response = await getData('/users');
setUsuarios(response.data); // ← Puede ser undefined si hay error
```

```javascript
// BIEN
const response = await getData('/users');
if (response.status) {
  setUsuarios(response.data);
} else {
  showError('Error', response.message);
}
```

### ❌ **No manejar errores**

```javascript
// MAL
await postData('/users', data); // ← Si falla, el usuario no sabe
```

```javascript
// BIEN
const response = await postData('/users', data);
if (response.status) {
  showSuccess('Usuario creado');
} else {
  showError('Error', response.message);
}
```

---

## 📚 Ver También

- `@/helpers/swalConfig.js` - Alertas y notificaciones
- `@/helpers/Constants.js` - Constantes como API_URL
- `@/Redux/Slices/AuthSlice.js` - Gestión de autenticación
