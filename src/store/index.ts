import { configureStore, type Reducer, type UnknownAction } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import type { AuthState } from '@/types';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';


const parseStateIfString = (reducer: Reducer<AuthState>) => (state: AuthState | string | undefined, action: UnknownAction): AuthState => {
  if (typeof state === 'string') {
    try {
      const parsed = JSON.parse(state) as AuthState;
      return reducer(parsed, action);
    } catch {
      return reducer(undefined, action);
    }
  }
  return reducer(state, action);
};


const rootReducer = combineReducers({
  auth: parseStateIfString(authReducer),
});

const persistedReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: ['auth'],
    
    transforms: [
      {
        in: (inboundState: AuthState) => ({
          token: inboundState.token,
          username: inboundState.username,
          id : inboundState.id,
          role: inboundState.role,
          roleKey: inboundState.roleKey,
          roleName: inboundState.roleName,
          permissions: inboundState.permissions,
          nombre: inboundState.nombre,
          apellido: inboundState.apellido,
          authorized: inboundState.authorized,
        }),
        // Las sesiones guardadas antes de los roles editables no traen permisos: se completan al recargar (GET /auth/me)
        out: (outboundState: AuthState) => ({ ...outboundState, permissions: outboundState.permissions ?? {} }),
      },
    ],
  },
  rootReducer
);


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
        ],
      },
    }),
});


export const persistor = persistStore(store);

/** Estado global de Redux (inferido del store). */
export type RootState = ReturnType<typeof store.getState>;
/** Tipo del dispatch del store. */
export type AppDispatch = typeof store.dispatch;

