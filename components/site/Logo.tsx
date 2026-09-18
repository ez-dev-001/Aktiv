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
 * Знак плюс словесная часть — шапка и футер.
 *
 * `light` — режим поверх фотографии: знак целиком белый. Малиновый
 * на снимке теряется, потому что тон кадра под ним непредсказуем,
 * а белое читается на любом.
 */
export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 leading-none ${className}`}>
      <LogoMark
        className={`h-[22px] w-[29px] shrink-0 transition-colors duration-[420ms] ${light ? 'text-white' : 'text-accent'}`}
      />
      <span className="flex flex-col">
        <span
          className={`font-serif text-[21px] font-bold leading-none tracking-[0.05em] transition-colors duration-[420ms] ${
            light ? 'text-white' : 'text-accent'
          }`}
        >
          AKTIV
        </span>
        <span
          className={`mt-[3px] font-mono text-[7.5px] leading-none tracking-[0.3em] transition-colors duration-[420ms] ${
            light ? 'text-white/55' : 'text-slate-2'
          }`}
        >
          LAW FIRM
        </span>
      </span>
    </span>
  )
}
