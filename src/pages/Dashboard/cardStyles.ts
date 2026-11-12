/** Sombra en dos capas: un borde de contacto y una sombra azulada muy suave que separa la tarjeta del fondo */
export const cardShadow =
  'shadow-[0_1px_2px_rgba(12,26,75,0.05),0_14px_32px_-18px_rgba(12,26,75,0.25)]'

/** Tarjeta de Inicio: blanca, esquinas amplias, borde casi invisible */
export const cardBase = `rounded-[20px] border border-[#e3e9f4] bg-surface ${cardShadow} dark:border-line dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_36px_-20px_rgba(0,0,0,0.8)]`

/** Leve elevacion al pasar el mouse */
export const cardHover =
  'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(12,26,75,0.06),0_20px_38px_-18px_rgba(12,26,75,0.35)]'
