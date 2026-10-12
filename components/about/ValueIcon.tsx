import { ICONS, isIconName } from '@/lib/icons'

/**
 * Знак цінності на сторінці «Про компанію».
 *
 * Іконка (з lib/icons.ts — обирається в Sanity) у рожевому колі,
 * обведеному розімкненим кільцем знака «АКТИВ».
 *
 * Анімація «малювання» (кільце, потім лінії іконки):
 *   • `play` — програється при монтуванні. Щоб повторити, компонент
 *     перемонтовують через key (так робить блок «Цінності»: нова
 *     цінність — іконка малюється заново);
 *   • без `play` — малюється, коли знак вʼїжджає в кадр (scroll-driven
 *     animation, без JS).
 * Базовий стан — готовий знак: без підтримки анімацій і при «зменшеному
 * русі» він просто стоїть (globals.css, блок ValueIcon).
 *
 * `dark` — для темного тла: світліше кільце, біла іконка.
 */
export function ValueIcon({
  name,
  className = 'size-16',
  dark = false,
  play = false,
}: {
  name: string
  className?: string
  dark?: boolean
  play?: boolean
}) {
  if (!isIconName(name)) return null
  return (
    <svg
      viewBox="0 0 64 64"
      className={`vi shrink-0 overflow-visible ${play ? 'vi-play' : ''} ${className}`}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="26" className={`vi-bg ${dark ? 'fill-accent/[0.14]' : 'fill-accent/[0.08]'}`} />
      {/* розімкнене кільце: R=30, розрив ±20° праворуч — як у логотипі */}
      <path
        className="vi-ring"
        d="M60.19 42.26 A 30 30 0 1 1 60.19 21.74"
        pathLength={1}
        fill="none"
        stroke={dark ? 'var(--color-accent-soft)' : 'var(--color-accent)'}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <g
        className="vi-ico"
        transform="translate(15.2 15.2) scale(1.4)"
        fill="none"
        stroke={dark ? '#fff' : 'var(--color-accent-ink)'}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[name].d.map((d) => (
          <path key={d} d={d} pathLength={1} />
        ))}
      </g>
    </svg>
  )
}
