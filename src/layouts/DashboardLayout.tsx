import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/UI/Sidebar'
import Topbar from '../components/UI/Topbar'
import { cn } from '../utils/classes'

const STORAGE_KEY = 'centinela-sidebar-collapsed'

/** Recuerda si el menu estaba contraido; sin dato previo, contrae en pantallas medianas. */
function readCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) return saved === '1'
  } catch {
    // localStorage no disponible: usar el valor por defecto
  }
  return window.innerWidth < 1100
}

/** Layout unico para todos los roles; el menu se arma segun el rol en `Sidebar`. */
export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // Al navegar, el panel movil se cierra
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // sin persistencia
      }
      return next
    })
  }

  return (
    <div>
      <Topbar onMenuClick={() => setMobileOpen(true)} />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main
        className={cn(
          // Fijo entre la barra superior y el borde inferior: es el UNICO elemento que desplaza,
          // sin depender de calc(100vh) (que con el escalado de Windows suma una fraccion de pixel
          // y hacia aparecer un segundo scroll en toda la pagina).
          'fixed top-14 right-0 bottom-0 box-border overflow-x-hidden overflow-y-auto bg-page p-6 transition-[left] duration-200 max-md:left-0 max-md:p-4',
          collapsed ? 'md:left-16' : 'md:left-[232px]'
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
