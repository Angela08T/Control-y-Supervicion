import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/UI/Sidebar'
import Topbar from '../components/UI/Topbar'
import { cn } from '../utils/classes'
import ContourMap from '../components/UI/ContourMap'
import PageBackdrop from '../components/UI/PageBackdrop'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSession } from '../store/slices/authSlice'
import { getMe } from '../api/role'
import { normalizeRole } from '../utils/permissions'
import { LoadingState } from '../components/UI/EmptyState'

const STORAGE_KEY = 'centinela-sidebar-collapsed'

/** Secciones con el fondo nuevo (reticula + luces) y el color propio de cada una */
const FONDO_SECCION: Record<string, string> = {
  inicio: '#f2a50f',
  incidencias: '#c71522',
  inasistencias: '#d20b80',
  bodycam: '#31a3b5',
  estadisticas: '#8ebc22',
  personal: '#6250d6',
  cargos: '#1e3a8a',
  infractores: '#e11d48',
  asuntos: '#0d9488',
  faltas: '#b45309',
  usuarios: '#2563eb',
  roles: '#6f9a14',
  auditoria: '#475569',
}
const ZOOM_KEY = 'centinela-zoom'
/** Pasos del zoom del contenido (botones - y + de la barra superior) */
const ZOOM_MIN = 0.8
const ZOOM_MAX = 1.3
const ZOOM_STEP = 0.1

function readZoom(): number {
  try {
    const saved = Number(localStorage.getItem(ZOOM_KEY))
    if (saved >= ZOOM_MIN && saved <= ZOOM_MAX) return saved
  } catch {
    // sin persistencia
  }
  return 1
}

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
  const [zoom, setZoomState] = useState<number>(readZoom)
  const { pathname } = useLocation()
  // Inicio (/dashboard/<rol>) e Incidencias, Inasistencias, Dispositivos y Estadisticas usan el fondo de
  // reticula con su color; las demas paginas conservan las lineas de nivel
  const enInicio = /^\/dashboard\/[^/]+\/?$/.test(pathname)
  const acentoSeccion = FONDO_SECCION[enInicio ? 'inicio' : (pathname.split('/')[3] ?? '')]

  const dispatch = useAppDispatch()
  const hasPermissions = useAppSelector((state) => Object.keys(state.auth.permissions).length > 0)
  // Una sesión guardada antes de los roles editables no tiene permisos: se espera a /auth/me para no mostrar "sin acceso"
  const [ready, setReady] = useState<boolean>(hasPermissions)

  // Al abrir la aplicación se recargan el rol y los permisos vigentes (el administrador pudo cambiarlos)
  useEffect(() => {
    getMe()
      .then((me) =>
        dispatch(
          setSession({
            role: normalizeRole(me.rol),
            roleKey: me.rol,
            roleName: me.role_name,
            permissions: me.permissions,
            nombre: me.nombre ?? null,
            apellido: me.apellido ?? null,
          })
        )
      )
      .catch(() => {
        // Sin conexión o sesión vencida: se conserva lo que ya hay y la sesión se maneja en el interceptor
      })
      .finally(() => setReady(true))
  }, [dispatch])

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

  const setZoom = (value: number) => {
    // Redondeo a un decimal para que los pasos no acumulen error (0.1 + 0.2...)
    const next = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)) * 10) / 10
    setZoomState(next)
    try {
      localStorage.setItem(ZOOM_KEY, String(next))
    } catch {
      // sin persistencia
    }
  }

  return (
    <div>
      <Topbar
        onMenuClick={() => setMobileOpen(true)}
        collapsed={collapsed}
        zoom={zoom}
        onZoomOut={zoom > ZOOM_MIN ? () => setZoom(zoom - ZOOM_STEP) : undefined}
        onZoomIn={zoom < ZOOM_MAX ? () => setZoom(zoom + ZOOM_STEP) : undefined}
        onZoomReset={() => setZoom(1)}
      />
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
          'absolute top-0 right-0 bottom-0 overflow-hidden bg-page transition-[left] duration-200 max-md:left-0',
          collapsed ? 'md:left-16' : 'md:left-[232px]'
        )}
      >
        {acentoSeccion ? <PageBackdrop accent={acentoSeccion} /> : <ContourMap tone="light" />}
      </div>
      <main
        className={cn(
          // Absoluto entre la barra superior y el borde inferior (no 'fixed': fixed crea un contexto de
          // apilamiento y los modales quedarian por debajo de la barra). Es el UNICO elemento que desplaza,
          // sin depender de calc(100vh) (que con el escalado de Windows suma una fraccion de pixel
          // y hacia aparecer un segundo scroll en toda la pagina).
          'absolute top-16 right-0 bottom-0 box-border overflow-x-hidden overflow-y-auto p-6 transition-[left] duration-200 max-md:left-0 max-md:p-4',
          collapsed ? 'md:left-16' : 'md:left-[232px]'
        )}
      >
        {/* Cada pantalla entra con un fundido corto: responde al clic en el menu */}
        {/* h-full: las pantallas que lo piden (ej. tablas con paginacion fija) pueden ocupar justo el alto disponible */}
        {/* zoom: tamano del contenido elegido con los botones - y + de la barra superior */}
        <div key={pathname} className="h-full animate-[pageIn_220ms_ease-out]" style={zoom !== 1 ? { zoom } : undefined}>
          {ready ? <Outlet /> : <LoadingState label="Cargando tu sesión…" />}
        </div>
      </main>
    </div>
  )
}
