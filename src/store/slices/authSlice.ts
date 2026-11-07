import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthLoginPayload, AuthState } from '@/types';

const initialState: AuthState = {
  token: null,
  username: null,
  role: null,
  roleKey: null,
  roleName: null,
  permissions: {},
  authorized: false,
  id: null,
  nombre: null,
  apellido: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<AuthLoginPayload>) {
      const { token, id, username, role, roleKey, roleName, permissions, nombre, apellido } = action.payload;
      state.token = token;
      state.username = username;
      state.role = role;
      state.roleKey = roleKey;
      state.roleName = roleName;
      state.permissions = permissions;
      state.id = id;
      state.nombre = nombre;
      state.apellido = apellido;
      state.authorized = true;
    },
    logout(state) {
      state.id = null;
      state.token = null;
      state.username = null;
      state.role = null;
      state.roleKey = null;
      state.roleName = null;
      state.permissions = {};
      state.authorized = false;
    },
    /** Actualiza el rol, los permisos y el nombre con los datos vigentes del servidor (GET /auth/me). */
    setSession(state, action: PayloadAction<Pick<AuthLoginPayload, 'role' | 'roleKey' | 'roleName' | 'permissions' | 'nombre' | 'apellido'>>) {
      const { role, roleKey, roleName, permissions, nombre, apellido } = action.payload;
      state.role = role;
      state.roleKey = roleKey;
      state.roleName = roleName;
      state.permissions = permissions;
      state.nombre = nombre;
      state.apellido = apellido;
    },
  },
});

export const { login, logout, setSession } = authSlice.actions;
export default authSlice.reducer;
