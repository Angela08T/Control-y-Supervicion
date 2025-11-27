import React from 'react'
import Router from './routes/Router'
import { NotificationProvider } from './context/NotificationContext'

export default function App(){
  return (
    <NotificationProvider>
      <Router />
    </NotificationProvider>
  )
}