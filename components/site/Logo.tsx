/**
 * Знак «АКТИВ» — кольцо с горизонтальной перекладиной, переходящей
 * в стрелку. Отрисован в SVG по растровому логотипу клиента
 * (wp-content/uploads/2025/04/logotip_3.png, единственный цвет #FA2163).
 *
 * Зачем векторно, а не картинкой: знак нужен в шапке, в футере,
 * на кнопке «наверх» повёрнутым на 90°, и в favicon. Растр 1051×391
 * не тянется ни в одно из этих мест без потерь.
 *
 * currentColor, никаких заливок в атрибутах: знак работает
 * и малиновым на бумаге, и белым на тёмном.
 */
export function LogoMark({ className = 'size-6', ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 250 183" fill="currentColor" className={className} aria-hidden="true" {...rest}>
      {/* Кольцо разомкнуто справа: стрелка проходит сквозь него с зазором,
          а не поверх. Дуга идёт от +20° через юг и запад к −20°,
          сектор ±20° выпущен. Внешний Ø 167, штрих 23 — снято с растра. */}
      <path
        d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="23"
      />
      {/* Перекладина и остриё одним контуром. У хвоста стрелки вырез —
          он и делает знак узнаваемым: простой треугольник читается как чужой. */}
      <path d="M15 78 H187 L176 47 L237 88.5 L176 130 L187 99 H15 Z" />
    </svg>
  )
}

/**
 * Логотип нової редакції (макет клієнта, 2026):
 *
 *   AKTIV ⊖→        — «AKTIV» жирним гротеском (Montserrat ExtraBold),
 *   L A W  F I R M   малиновий; знак — маленький, вгорі праворуч;
 *                    «LAW FIRM» — розрідженими капітелями під словом.
 *
 * Знак і «AKTIV» завжди малинові. «LAW FIRM» — чорний на світлому,
 * білий на темному (onDark).
 */
export function Logo({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span className={`relative inline-flex flex-col leading-none ${className}`}>
      <span className="flex items-start">
        <span className="font-display text-[29px] font-extrabold leading-[0.86] tracking-[-0.075em] text-accent min-[980px]:text-[34px]">
          AKTIV
        </span>
        <LogoMark className="-mt-[3px] ml-[3px] h-[15px] w-[21px] shrink-0 text-accent min-[980px]:h-[17px] min-[980px]:w-[24px]" />
      </span>
      <span
        className={`mt-[5px] font-display text-[8.5px] font-bold leading-none tracking-[0.62em] transition-colors duration-[420ms] min-[980px]:text-[9.5px] ${
          onDark ? 'text-white' : 'text-ink'
        }`}
      >
        LAW FIRM
      </span>
    </span>
  )
}
