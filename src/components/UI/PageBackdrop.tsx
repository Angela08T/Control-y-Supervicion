import React from 'react'

export interface PageBackdropProps {
  /** Color propio de la seccion (una de las tintas del logo); tiñe las luces del fondo */
  accent: string
}

/**
 * Fondo de las secciones de trabajo: degradado azul muy claro, una reticula de puntos que se
 * desvanece hacia abajo y dos luces difusas (azul institucional + el color de la seccion).
 * Va detras del contenido y no recibe clics.
 */
export default function PageBackdrop({ accent }: PageBackdropProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#e8eef9_0%,#eef3fa_360px,#f2f5fa_100%)] dark:bg-[linear-gradient(180deg,#0e1830_0%,#0b1426_360px,#0a1120_100%)]">
      {/* Reticula de puntos: da textura sin competir con las tarjetas */}
      <div
        className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle,rgba(30,58,138,0.14)_1px,transparent_1.3px)] bg-size-[22px_22px] [mask-image:linear-gradient(180deg,#000_0%,rgba(0,0,0,0.55)_45%,transparent_100%)] dark:bg-[radial-gradient(circle,rgba(147,197,253,0.11)_1px,transparent_1.3px)]"
      />

      {/* Luces difusas: azul arriba a la derecha y el color de la seccion arriba a la izquierda */}
      <div className="absolute -top-40 -right-24 size-[520px] rounded-full bg-[#3b82f6] opacity-[0.13] blur-[90px] motion-safe:animate-[contourBreathe_16s_ease-in-out_infinite_alternate] dark:opacity-[0.16]" />
      <div
        className="absolute -top-48 left-[12%] size-[460px] rounded-full opacity-[0.10] blur-[100px] motion-safe:animate-[contourBreathe_20s_ease-in-out_infinite_alternate-reverse] dark:opacity-[0.12]"
        style={{ background: accent }}
      />

      {/* Linea fina con los colores del logo bajo la barra superior */}
      <div className="absolute inset-x-0 top-16 h-[3px] bg-[linear-gradient(90deg,#c71522_0%,#d20b80_22%,#f2a50f_45%,#8ebc22_70%,#31a3b5_100%)] opacity-70" />

      {/* Curva amplia que cierra la zona superior y separa el encabezado del resto */}
      <svg className="absolute inset-x-0 top-[300px] h-[160px] w-full" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
        <path
          d="M0 90 C 360 10 720 150 1080 70 S 1380 40 1440 60"
          fill="none"
          strokeWidth="1.5"
          className="stroke-[#c9d8f0] opacity-70 dark:stroke-[#1b2d58]"
        />
      </svg>
    </div>
  )
}
