/**
 * Clases de Tailwind compartidas entre varios componentes.
 * Reemplazan a las clases globales de la hoja de estilos anterior (btn-primary, modal-card, inc-table...)
 */

/** Une clases condicionales ignorando valores falsos */
export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ')

// ==================== Scrollbar ====================

/** Scrollbar de 10px usado en los contenedores de tabla */
const scrollbarBox =
  '[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:rounded-[5px] [&::-webkit-scrollbar-track]:[background:var(--bg)] [&::-webkit-scrollbar-thumb]:rounded-[5px] [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb:hover]:bg-secondary'

// ==================== Botones ====================

export const btnPrimary =
  'relative cursor-pointer overflow-hidden rounded-[10px] border-none bg-[linear-gradient(135deg,var(--primary)_0%,var(--secondary)_100%)] px-6 py-[11px] text-[14px] font-semibold text-btn! shadow-[0_4px_15px_var(--shadow)] transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:-translate-y-[3px] hover:scale-105 hover:text-white! hover:shadow-[0_8px_25px_var(--shadow-hover)] active:-translate-y-px active:scale-[1.02]'

export const btnSecondary =
  'cursor-pointer rounded-[10px] border-2 border-solid border-[#6b7280] bg-[#f3f4f6] px-6 py-[11px] text-[14px] font-semibold text-[#374151] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e3a8a] hover:bg-[#e5e7eb] hover:text-[#1e3a8a]'

// ==================== Modales ====================

export const modalBackdrop =
  'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-10 [backdrop-filter:blur(8px)] animate-[fadeIn_0.3s_ease-out]'

export const modalCard =
  'm-auto w-[450px] overflow-hidden rounded-[20px] border border-solid border-line bg-surface shadow-[0_20px_60px_var(--shadow-hover)] [backdrop-filter:blur(20px)] animate-[modalSlideIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)]'

export const modalHeader =
  'flex items-center justify-between border-b border-solid border-line bg-[linear-gradient(135deg,rgba(30,58,138,0.1)_0%,rgba(59,130,246,0.1)_100%)] px-6 pb-0 pt-5'

/** <h3> del encabezado del modal */
export const modalTitle = 'm-[18px] text-[20px] font-bold text-content! dark:text-[#f8fafc]!'

/** Boton de cerrar del encabezado del modal */
export const modalClose =
  'flex size-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-[28px] text-muted transition-all duration-300 hover:rotate-90 hover:bg-[rgba(239,68,68,0.1)] hover:text-danger'

export const modalActions = 'mt-3 flex justify-end gap-3 border-t border-solid border-line pt-5'

export const modalBody =
  'flex max-h-[calc(100vh-200px)] flex-col gap-3 overflow-y-auto p-6 [background:var(--bg)]'

/** <label> dentro del cuerpo del modal */
export const modalLabel =
  'mt-1.5 text-[13px] font-semibold uppercase tracking-[0.5px] text-content! dark:text-[#f8fafc]!'

/** <input>, <select> y <textarea> dentro del cuerpo del modal (textarea agrega modalTextarea) */
export const modalInput =
  'w-full rounded-[10px] border border-solid border-line bg-surface px-3.5 py-3 text-[14px] text-content! outline-none transition-all duration-300 [backdrop-filter:blur(5px)] placeholder:text-muted! focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] dark:text-[#f8fafc]! dark:placeholder:text-[#94a3b8]!'

export const modalTextarea = 'min-h-20 resize-y'

/** Extra para input type="date" / type="time" dentro del modal */
export const modalInputDateTime =
  'relative [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 dark:[&::-webkit-calendar-picker-indicator]:bg-transparent dark:[&::-webkit-calendar-picker-indicator]:opacity-100! dark:[&::-webkit-calendar-picker-indicator]:[filter:invert(1)_brightness(2)_saturate(0)] dark:[&::-webkit-calendar-picker-indicator:hover]:scale-110 dark:[&::-webkit-calendar-picker-indicator:hover]:[filter:invert(1)_brightness(2.5)_saturate(0)]'

// ==================== Encabezado de pagina ====================

export const pageHeader =
  'mb-[25px] box-border flex w-full items-center justify-between border-b border-solid border-line pb-[15px]'

/** Variante del encabezado dentro de .incidencias-page */
export const pageHeaderIncidencias =
  'mb-[25px] box-border flex w-full flex-col items-stretch justify-between gap-5 border-b-2 border-solid border-line pb-5'

/** <h2> del encabezado de pagina */
export const pageTitle =
  'm-0 text-[28px] font-bold text-content! [text-shadow:0_2px_4px_rgba(0,0,0,0.1)] animate-[slideInLeft_0.5s_ease-out] dark:text-[#f8fafc]! dark:[text-shadow:0_2px_8px_rgba(255,255,255,0.2)]'

// ==================== Controles (buscador / filtros) ====================

export const controlsBar =
  'flex items-center gap-3 animate-[slideInRight_0.5s_ease-out] max-[600px]:w-full'

const controlsField =
  'rounded-[10px] border border-solid border-line bg-surface px-3.5 py-2.5 text-[14px] text-content! outline-none transition-all duration-300 [backdrop-filter:blur(5px)] hover:border-primary hover:shadow-[0_0_0_3px_rgba(30,58,138,0.1)] focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_4px_rgba(30,58,138,0.15)] dark:text-[#f8fafc]!'

export const controlsSelect = `${controlsField} max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`

export const controlsInput = `${controlsField} min-w-[220px] max-[600px]:min-w-full`

// ==================== Formularios ====================

export const formGroup = 'flex flex-col gap-2'

export const formLabel =
  'flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.5px] text-content! dark:text-[#f8fafc]!'

// ==================== Tablas ====================

/** Contenedor principal de la tabla (scroll vertical) */
export const tableWrapper = `flex w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${scrollbarBox}`

/** Contenedor con scroll interno horizontal y vertical */
export const tableScroll = `max-h-full w-full flex-1 overflow-x-auto overflow-y-auto rounded-lg ${scrollbarBox}`

export const tableCard =
  'relative z-[1] flex h-full max-h-[600px] w-full flex-col rounded-2xl border border-solid border-line bg-transparent! p-5 shadow-[0_8px_32px_var(--shadow)] [backdrop-filter:blur(10px)] animate-[scaleIn_0.5s_ease-out]'

export const incTable = 'w-full min-w-[1200px] border-collapse whitespace-nowrap text-[13px]'

/** <th> de la tabla de incidencias (header pegajoso) */
export const incTableTh =
  'sticky top-0 z-10 whitespace-nowrap border-b-2 border-solid border-primary bg-[#e0f2fe] px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-[1px] text-content! shadow-[0_2px_4px_rgba(0,0,0,0.1)] dark:border-[#3b82f6] dark:bg-[#1e3a8a] dark:text-[#f8fafc]! dark:shadow-[0_2px_4px_rgba(0,0,0,0.3)]'

/** <tr> del cuerpo de la tabla de incidencias */
export const incTableTr =
  'border-b border-solid border-line transition-all duration-300 hover:relative hover:bg-card-hover hover:shadow-[0_2px_8px_var(--shadow)]'

/** <td> del cuerpo de la tabla de incidencias */
export const incTableTd =
  'whitespace-nowrap px-3 py-3.5 text-content-2 animate-[fadeIn_0.5s_ease-out]'

/** Contenedor de botones de accion de una fila */
export const actions = 'flex gap-2'

/** Boton de accion de una fila (editar, ver, eliminar...) */
export const actionBtn =
  'cursor-pointer rounded-lg border border-solid border-transparent bg-transparent px-3 py-2 text-[16px] text-content! transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] hover:-translate-y-[3px] hover:rotate-[5deg] hover:border-primary hover:bg-[rgba(30,58,138,0.1)] hover:text-primary! hover:shadow-[0_4px_15px_var(--shadow)] dark:text-[#e2e8f0]! dark:hover:text-[#60a5fa]!'

// ==================== Layout ====================

export const appRoot = 'flex min-h-screen flex-col'

export const appContent = 'mt-[65px] flex flex-1'

export const mainArea =
  'ml-20 box-border h-[calc(100vh-65px)] w-[calc(100vw-80px)] flex-1 overflow-x-hidden overflow-y-auto p-[30px] [background:var(--bg)]! [background-attachment:fixed]! animate-[fadeInUp_0.6s_ease-out] max-[600px]:ml-[60px] max-[600px]:w-[calc(100%-60px)] max-[600px]:p-2.5'

export const incidenciasPage = 'flex h-full w-full flex-col overflow-y-auto'

// ==================== Autocompletado (bodycam, DNI) ====================

export const autocompleteContainer = 'relative w-full [&_input]:w-full'

const autocompleteBox =
  'absolute inset-x-0 top-full z-[1000] mt-1 rounded-lg border border-solid px-3 py-2 text-[13px] shadow-[0_4px_12px_var(--shadow)]'

export const autocompleteLoading = `${autocompleteBox} border-line bg-card italic text-content-2`

export const autocompleteError = `${autocompleteBox} border-danger bg-[rgba(239,68,68,0.1)] text-danger`

export const autocompleteNoResults = `${autocompleteBox} border-line bg-card text-muted`

export const autocompleteSuggestions =
  'absolute inset-x-0 top-full z-[1000] mt-1 max-h-[250px] overflow-y-auto rounded-lg border border-solid border-line bg-card shadow-[0_4px_12px_var(--shadow)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-track]:bg-surface [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-line [&::-webkit-scrollbar-thumb:hover]:bg-primary'

export const autocompleteItem =
  'cursor-pointer border-b border-solid border-line px-4 py-3 transition-[background-color] duration-200 ease-[ease] last:border-b-0 hover:bg-card-hover'

export const autocompleteItemCode = 'mb-1 text-[14px] font-semibold text-primary'

export const autocompleteItemDetails = 'text-[12px] text-content-2'
