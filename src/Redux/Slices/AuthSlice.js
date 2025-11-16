import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  username: null,
  role: null,
  authorized: false,
  id: null,
  loading: false, // Loading global para operaciones de API
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action) {
      const { token, id, username, role  } = action.payload;
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
    moduleLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { login, logout, moduleLoading } = authSlice.actions;
export default authSlice.reducer;
