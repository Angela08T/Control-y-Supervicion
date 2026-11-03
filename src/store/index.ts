import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
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


const parseStateIfString = (reducer) => (state, action) => {
  if (typeof state === 'string') {
    try {
      const parsed = JSON.parse(state);
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
        in: (inboundState) => ({
          token: inboundState.token,
          username: inboundState.username,
          id : inboundState.id,
          role: inboundState.role,
          authorized: inboundState.authorized,
        }),
        out: (outboundState) => outboundState,
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

