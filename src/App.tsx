import React from 'react'
import Router from './routes/Router'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './components/ToastContainer'

export default function App(){
  return (
    <NotificationProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </NotificationProvider>
  )
}