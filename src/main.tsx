import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'
import App from './App'
import './index.css'
import { Buffer } from 'buffer'

declare global {
  interface Window {
    Buffer: typeof Buffer
  }
}

// Polyfill para @react-pdf/renderer
window.Buffer = Buffer

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-page text-sm text-muted">
    Cargando…
  </div>
)

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={<LoadingScreen />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
)