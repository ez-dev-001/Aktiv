import type { ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Спільні блоки внутрішніх сторінок у форматі головної (armada.law):
 * заголовок розділу, нумеровані рядки, FAQ, аватар у кільці, банер.
 * Один ритм на всіх сторінках — щоб сайт не розпадався на різні стилі.
 */

/** Вертикальний ритм розділу — той самий, що на головній. */
export const SEC = 'py-[clamp(56px,8vw,112px)]'

/**
 * Заголовок розділу: дрібний mono-рядок з лінією, великий сериф з
 * курсивним акцентом і абзац. `row` — абзац праворуч від заголовка
 * на широкому екрані.
 */
export function SecHead({
  eyebrow,
  title,
  accent,
  lede,
  row = false,
  dark = false,
  as: Tag = 'h2',
  className = '',
}: {
  eyebrow?: ReactNode
  title: ReactNode
  accent?: ReactNode
  lede?: ReactNode
  row?: boolean
  dark?: boolean
  as?: 'h2' | 'h1' | 'h3'
  className?: string
}) {
  return (
    <div
      className={`mb-[clamp(28px,4vw,48px)] grid gap-3.5 ${row && lede ? 'min-[900px]:grid-cols-2 min-[900px]:items-end' : ''} ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && <Kicker dark={dark}>{eyebrow}</Kicker>}
        <Tag
          className={`m-0 mt-3.5 font-serif text-[clamp(30px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] [text-wrap:balance] ${
            dark ? 'text-white' : 'text-ink'
          }`}
        >
          {title}
          {accent && (
            <>
              {' '}
              <em className={dark ? 'text-accent-soft' : 'text-accent-ink'}>{accent}</em>
            </>
          )}
        </Tag>
      </div>
      {lede && (
        <p
          className={`m-0 max-w-[56ch] text-[15.5px] leading-[1.65] ${row ? 'min-[900px]:justify-self-end' : ''} ${
            dark ? 'text-on-dark' : 'text-slate'
          }`}
        >
          {lede}
        </p>
      )}
    </div>
  )
}

/** Дрібний рядок над заголовком: mono, рожевий, з тонкою лінією. */
export function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`m-0 flex items-center gap-3 font-mono text-[10.5px] uppercase leading-none tracking-[0.16em] after:h-px after:w-[60px] after:content-[''] ${
        dark ? 'text-accent-soft after:bg-on-dark-hair' : 'text-accent-ink after:bg-hair'
      }`}
    >
      {children}
    </p>
  )
}

/**
 * Нумеровані рядки 01, 02… — принципи, послуги напряму. З `href` рядок
 * стає посиланням зі стрілкою в кружку.
 */
export function NumRows({
  items,
  dark = false,
}: {
  items: { title: ReactNode; text?: ReactNode; href?: string }[]
  dark?: boolean
}) {
  const line = dark ? 'border-on-dark-hair' : 'border-hair'
  return (
    <ol className={`m-0 list-none border-t p-0 ${line}`}>
      {items.map((it, i) => {
        const body = (
          <>
            <span className={`font-mono text-[12px] leading-[1.9] ${dark ? 'text-accent-soft' : 'text-accent-ink'}`}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={`font-serif text-[clamp(21px,2.3vw,27px)] leading-[1.2] transition-colors ${dark ? 'text-white' : 'text-ink'} ${
                it.href ? 'group-hover:text-accent-ink' : ''
              }`}
            >
              {it.title}
            </span>
            {it.text && (
              <span
                className={`col-start-2 text-[15px] leading-[1.6] min-[900px]:col-start-3 min-[900px]:row-start-1 ${
                  dark ? 'text-on-dark' : 'text-slate'
                }`}
              >
                {it.text}
              </span>
            )}
            {it.href && (
              <span
                aria-hidden="true"
                className={`col-start-3 row-start-1 grid size-11 place-items-center rounded-full transition-colors group-hover:bg-accent-btn group-hover:text-white group-hover:shadow-none min-[900px]:col-start-4 ${
                  dark ? 'text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]' : 'text-ink shadow-[inset_0_0_0_1px_var(--color-hair)]'
                }`}
              >
                <Icon name="arrow" className="size-4" />
              </span>
            )}
          </>
        )
        const grid = `grid items-start gap-x-[18px] gap-y-1.5 py-6 min-[900px]:items-center min-[900px]:py-[30px] ${
          it.href
            ? 'grid-cols-[44px_minmax(0,1fr)_auto] min-[900px]:grid-cols-[72px_minmax(0,0.9fr)_minmax(0,1.1fr)_48px]'
            : 'grid-cols-[44px_minmax(0,1fr)] min-[900px]:grid-cols-[72px_minmax(0,0.9fr)_minmax(0,1.1fr)]'
        }`
        return (
          <li key={i} className={`border-b ${line}`}>
            {it.href ? (
              <a href={it.href} className={`group ${grid} no-underline`}>
                {body}
              </a>
            ) : (
              <div className={grid}>{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Питання-відповідь: нативний <details>, «+» обертається в «×». */
export function Faq({ items, firstOpen = true }: { items: { q: ReactNode; a: ReactNode }[]; firstOpen?: boolean }) {
  return (
    <div className="border-t border-hair">
      {items.map((it, i) => (
        <details key={i} open={firstOpen && i === 0} className="group border-b border-hair">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-[18px] py-[22px] text-[clamp(16px,1.6vw,18.5px)] font-medium leading-[1.4] text-ink [&::-webkit-details-marker]:hidden">
            {it.q}
            <span
              aria-hidden="true"
              className="relative size-9 shrink-0 rounded-full shadow-[inset_0_0_0_1px_var(--color-hair)] transition-[transform,background-color] duration-200 before:absolute before:left-1/2 before:top-1/2 before:h-[1.6px] before:w-3 before:-translate-x-1/2 before:-translate-y-1/2 before:bg-current before:content-[''] after:absolute after:left-1/2 after:top-1/2 after:h-3 after:w-[1.6px] after:-translate-x-1/2 after:-translate-y-1/2 after:bg-current after:content-[''] group-open:rotate-45 group-open:bg-accent-btn group-open:text-white group-open:shadow-none"
            />
          </summary>
          <div className="-mt-1.5 mb-6 max-w-[66ch] text-[15.5px] leading-[1.7] text-slate">{it.a}</div>
        </details>
      ))}
    </div>
  )
}

/** Відкрите кільце знака «АКТИВ» навколо круглого фото або монограми. */
export function RingAvatar({
  src,
  name,
  className = 'size-[72px]',
}: {
  src?: string
  name: string
  className?: string
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <path d="M94.2 66.1 A 47 47 0 1 1 94.2 33.9" fill="none" stroke="var(--color-accent)" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          className="absolute inset-[9%] size-[82%] rounded-full bg-paper-2 object-cover object-top"
        />
      ) : (
        <span
          aria-label={name}
          className="absolute inset-[9%] grid size-[82%] place-items-center rounded-full bg-paper-2 font-serif text-[clamp(14px,30cqw,40px)] font-semibold text-ink [container-type:inline-size]"
        >
          {initials}
        </span>
      )}
    </span>
  )
}

/** Банер-заклик: світлий або темний, текст ліворуч, дії праворуч. */
export function Band({
  title,
  accent,
  text,
  kicker,
  actions,
  dark = false,
}: {
  title: ReactNode
  accent?: ReactNode
  text?: ReactNode
  kicker?: ReactNode
  actions?: ReactNode
  dark?: boolean
}) {
  return (
    <div
      className={`grid items-center gap-[22px] rounded-[26px] p-[clamp(28px,4vw,48px)] min-[860px]:grid-cols-[minmax(0,1fr)_auto] ${
        dark ? 'on-dark bg-ink text-white' : 'bg-white shadow-[inset_0_0_0_1px_var(--color-hair)]'
      }`}
    >
      <div className="min-w-0">
        {kicker && <Kicker dark={dark}>{kicker}</Kicker>}
        <p className={`m-0 font-serif text-[clamp(26px,3vw,36px)] leading-[1.12] ${kicker ? 'mt-3' : ''} ${dark ? 'text-white' : 'text-ink'}`}>
          {title}
          {accent && (
            <>
              {' '}
              <em className={dark ? 'text-accent-soft' : 'text-accent-ink'}>{accent}</em>
            </>
          )}
        </p>
        {text && <p className={`m-0 mt-2.5 max-w-[56ch] text-[15.5px] leading-[1.65] ${dark ? 'text-on-dark' : 'text-slate'}`}>{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  )
}

/** Плашка-мітка: mono, у капсулі. */
export function Chip({ children, dot = false, dark = false }: { children: ReactNode; dot?: boolean; dark?: boolean }) {
  return (
    <span
      className={`inline-flex min-h-[34px] items-center gap-2 rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.09em] ${
        dark ? 'text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)]' : 'text-ink shadow-[inset_0_0_0_1px_var(--color-hair)]'
      }`}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
      {children}
    </span>
  )
}
