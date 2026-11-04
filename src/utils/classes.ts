/**
 * Clases de Tailwind compartidas entre varios componentes.
 * Estilo: superficies planas, bordes finos, una sola sombra suave y movimiento minimo.
 * Para botones, modales, campos, paginacion, etc. prefiere los componentes de `components/UI/`.
 */

/** Une clases condicionales ignorando valores falsos */
export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ')

// ==================== Scrollbar ====================

/** Scrollbar fino usado en los contenedores de tabla */
const scrollbarBox =
  '[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-line-strong [&::-webkit-scrollbar-thumb:hover]:bg-muted'

// ==================== Botones ====================

const btnBase =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'

export const btnPrimary = `${btnBase} border-transparent bg-primary text-btn hover:bg-primary-hover`

export const btnSecondary = `${btnBase} border-line-strong bg-surface text-content-2 hover:bg-subtle hover:text-content`

// ==================== Modales ====================

export const modalBackdrop =
  'fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 animate-[fadeInSoft_0.15s_ease-out]'

export const modalCard =
  'm-auto w-[480px] max-w-full overflow-hidden rounded-xl border border-line bg-surface shadow-[0_16px_48px_rgba(15,23,42,0.18)] animate-[popIn_0.18s_ease-out] max-[900px]:my-2.5 max-[900px]:max-h-[90vh] max-[900px]:w-[95%] max-[900px]:overflow-y-auto'

export const modalHeader = 'flex items-center justify-between border-b border-line px-6 py-4'

/** <h3> del encabezado del modal */
export const modalTitle = 'm-0 text-base font-semibold text-content'

/** Boton de cerrar del encabezado del modal */
export const modalClose =
  'flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-xl text-muted transition-colors duration-150 hover:bg-subtle hover:text-content'

export const modalActions = 'mt-2 flex justify-end gap-3 border-t border-line pt-4'

export const modalBody =
  'flex max-h-[calc(100vh-200px)] flex-col gap-4 overflow-y-auto bg-surface p-6 max-[900px]:max-h-[calc(90vh-120px)]'

/** <label> dentro del cuerpo del modal */
export const modalLabel = 'text-[13px] font-medium text-content-2'

/** <input>, <select> y <textarea> dentro del cuerpo del modal (textarea agrega modalTextarea) */
export const modalInput =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-content outline-none transition-colors duration-150 placeholder:text-muted hover:border-[#9fb0c8] focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted'

export const modalTextarea = 'min-h-20 resize-y'

/** Extra para input type="date" / type="time" dentro del modal */
export const modalInputDateTime =
  'relative [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100'

// ==================== Encabezado de pagina ====================

export const pageHeader =
  'mb-5 box-border flex w-full items-center justify-between gap-4 max-[900px]:flex-col max-[900px]:items-start'

/** Variante del encabezado de las paginas de listado */
export const pageHeaderIncidencias = 'mb-5 box-border flex w-full flex-col gap-4'

/** <h2> del encabezado de pagina */
export const pageTitle = 'm-0 text-[22px] font-semibold tracking-[-0.01em] text-content'

// ==================== Controles (buscador / filtros) ====================

export const controlsBar = 'flex flex-wrap items-center gap-2'

const controlsField =
  'h-9 rounded-lg border border-line-strong bg-surface px-3 text-sm text-content outline-none transition-colors duration-150 placeholder:text-muted hover:border-[#9fb0c8] focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)] max-[900px]:min-w-0 max-[900px]:flex-[1_1_100%]'

export const controlsSelect = `${controlsField} max-w-[220px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap`

export const controlsInput = `${controlsField} min-w-[220px] max-[600px]:min-w-full`

// ==================== Formularios ====================

export const formGroup = 'flex flex-col gap-1.5'

export const formLabel = 'flex items-center gap-2 text-[13px] font-medium text-content-2'

// ==================== Tablas ====================

/** Tarjeta que contiene una tabla: borde fino, fondo blanco, esquinas recortadas */
export const cardClass =
  'flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_var(--shadow)]'

/** Contenedor principal de la tabla (scroll vertical) */
export const tableWrapper = `flex w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${scrollbarBox}`

/** Contenedor con scroll interno horizontal y vertical */
export const tableScroll = `w-full flex-1 overflow-x-auto overflow-y-auto ${scrollbarBox}`

/** Tarjeta de tabla (alias historico de cardClass) */
export const tableCard = cardClass

export const incTable = 'w-full border-collapse text-sm'

/** <th> de la tabla (cabecera pegajosa) */
export const incTableTh =
  'sticky top-0 z-10 border-x-0 border-t-0 border-b border-line bg-subtle px-4 py-3 text-left text-xs font-semibold text-muted'

/** <tr> del cuerpo de la tabla */
export const incTableTr =
  'border-x-0 border-t-0 border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-subtle'

/** <td> del cuerpo de la tabla */
export const incTableTd = 'px-4 py-3 align-middle text-content-2'

/** Contenedor de botones de accion de una fila */
export const actions = 'flex items-center justify-end gap-1'

/** Boton de accion de una fila (ver, editar...). Siempre con title y aria-label */
export const actionBtn =
  'inline-flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-base text-muted transition-colors duration-150 hover:bg-[rgba(30,58,138,0.08)] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40'

/** Boton de accion destructiva (eliminar, deshabilitar) */
export const actionBtnDanger =
  'inline-flex size-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-base text-muted transition-colors duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-danger disabled:cursor-not-allowed disabled:opacity-40'

// ==================== Layout ====================

export const appRoot = 'flex min-h-screen flex-col'

export const appContent = 'mt-14 flex flex-1'

/** Relleno de una pagina cuando se usa fuera del layout (placeholders) */
export const mainArea = 'box-border w-full p-6'

export const incidenciasPage = 'flex w-full flex-col'

// ==================== Autocompletado (bodycam, DNI) ====================

export const autocompleteContainer = 'relative w-full [&_input]:w-full'

/** Avisos de carga/error/sin resultados: van en el flujo para no tapar lo que hay debajo */
const autocompleteBox = 'mt-1 rounded-lg border px-3 py-2 text-[13px]'

export const autocompleteLoading = `${autocompleteBox} border-line bg-surface text-content-2`

export const autocompleteError = `${autocompleteBox} border-danger bg-[rgba(239,68,68,0.06)] text-danger`

export const autocompleteNoResults = `${autocompleteBox} border-line bg-surface text-muted`

export const autocompleteSuggestions =
  'absolute inset-x-0 top-full z-[1000] mt-1 max-h-[250px] overflow-y-auto rounded-lg border border-line bg-surface shadow-[0_4px_12px_var(--shadow-hover)]'

export const autocompleteItem =
  'cursor-pointer border-b border-line px-4 py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-subtle'

export const autocompleteItemCode = 'mb-0.5 text-sm font-medium text-primary'

export const autocompleteItemDetails = 'text-xs text-muted'
