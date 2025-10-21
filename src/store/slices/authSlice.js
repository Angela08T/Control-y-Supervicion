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
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;