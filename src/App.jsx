import React, { useState } from 'react'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import IncidenciasPage from './components/IncidenciasPage'
import Login from './components/Login'

export default function App(){
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="app-root">
      <Topbar onLogout={handleLogout} />
      <div className="app-content">
        <Sidebar />
        <main className="main-area">
          <IncidenciasPage />
        </main>
      </div>
    </div>
  )
}