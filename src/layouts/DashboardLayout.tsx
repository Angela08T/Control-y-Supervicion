import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/UI/Sidebar'
import Topbar from '../components/UI/Topbar'
import { cn } from '../utils/classes'
import ContourMap from '../components/UI/ContourMap'

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
      <Topbar onMenuClick={() => setMobileOpen(true)} collapsed={collapsed} />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {/* Fondo: lineas de nivel muy tenues que se mueven despacio detras del contenido */}
      <div
        aria-hidden
        className={cn(
          'absolute top-14 right-0 bottom-0 overflow-hidden bg-page transition-[left] duration-200 max-md:left-0',
          collapsed ? 'md:left-16' : 'md:left-[232px]'
        )}
      >
        <ContourMap tone="light" />
      </div>
      <main
        className={cn(
          // Absoluto entre la barra superior y el borde inferior (no 'fixed': fixed crea un contexto de
          // apilamiento y los modales quedarian por debajo de la barra). Es el UNICO elemento que desplaza,
          // sin depender de calc(100vh) (que con el escalado de Windows suma una fraccion de pixel
          // y hacia aparecer un segundo scroll en toda la pagina).
          'absolute top-14 right-0 bottom-0 box-border overflow-x-hidden overflow-y-auto p-6 transition-[left] duration-200 max-md:left-0 max-md:p-4',
          collapsed ? 'md:left-16' : 'md:left-[232px]'
        )}
      >
        {/* Cada pantalla entra con un fundido corto: responde al clic en el menu */}
        {/* h-full: las pantallas que lo piden (ej. tablas con paginacion fija) pueden ocupar justo el alto disponible */}
        <div key={pathname} className="h-full animate-[pageIn_220ms_ease-out]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
