import { preload } from 'react-dom'
import type { ReactNode } from 'react'
import { HeroMark } from '@/components/home/HeroMark'
import { PHOTOS, photoUrl } from '@/lib/photos'
import { absUrl } from '@/lib/seo'

/**
 * Перший екран внутрішньої сторінки — у форматі головної (armada.law).
 *
 * Темна стрічка з тим самим світлом, що на головній; ліворуч крихти,
 * великий сериф із курсивним акцентом, абзац і кнопки; праворуч —
 * знак «АКТИВ» (той самий HeroMark) або власна картка сторінки
 * (`aside`: «квиток» послуги, «Ваше звернення» тощо).
 *
 * Нижча за героя головної: це не перший екран сайту. На телефоні знак
 * не показується — замість нього в куті тонке розімкнене кільце, щоб
 * екран не був порожнім і не відсував текст.
 *
 * id="hero" — щоб кругла кнопка звʼязку (FloatingActions) ховалася над
 * першим екраном так само, як на головній.
 */

export interface Crumb {
  label: string
  href?: string
}

export function PageHero({
  crumbs,
  title,
  accent,
  lede,
  children,
  aside,
  mark,
  compact = false,
  small = false,
  above,
}: {
  crumbs?: Crumb[]
  /** основна частина заголовка */
  title: ReactNode
  /** курсивний рожевий хвіст заголовка */
  accent?: ReactNode
  lede?: ReactNode
  /** рядок під абзацом: кнопки, плашки, автор */
  children?: ReactNode
  /** права колонка замість знака */
  aside?: ReactNode
  /** показати знак праворуч (за замовчуванням — якщо немає aside і сторінка не compact) */
  mark?: boolean
  /** нижча шапка без знака: блог, політика, статті */
  compact?: boolean
  /** менший кегль заголовка — для довгих назв послуг і статей */
  small?: boolean
  /** над заголовком після крихт (напр. галочка на «Дякуємо») */
  above?: ReactNode
}) {
  const showMark = mark ?? (!aside && !compact)
  if (showMark) preload(photoUrl(PHOTOS.tower, 900), { as: 'image', fetchPriority: 'high' })
  const two = showMark || !!aside

  return (
    <section
      id="hero"
      className="on-dark relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-hidden bg-ink text-on-dark"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-[1] bg-[radial-gradient(55%_80%_at_4%_0%,rgb(60_34_120/0.45),transparent_70%),radial-gradient(40%_70%_at_82%_60%,rgb(250_33_99/0.14),transparent_70%)]"
      />
      {/* телефон: тонке кільце в куті замість знака */}
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="pointer-events-none absolute -right-[90px] top-[70px] -z-[1] w-[260px] opacity-50 min-[900px]:hidden"
      >
        <path d="M168 126 A 72 72 0 1 1 168 74" fill="none" stroke="#fa2163" strokeOpacity=".35" strokeWidth="1.2" />
        <path d="M168 126 A 58 58 0 1 1 168 74" fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="1" />
      </svg>

      <div
        className={`shell inner relative z-[2] grid items-center gap-7 pt-[calc(var(--hdr)+clamp(28px,4.4vw,52px))] ${
          compact ? 'pb-[clamp(40px,5vw,64px)]' : 'min-h-[clamp(430px,40vw,560px)] pb-[clamp(44px,6vw,80px)]'
        } ${two ? 'min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]' : ''}`}
      >
        <div className="min-w-0 max-w-[680px]">
          {crumbs && crumbs.length > 0 && <Crumbs items={crumbs} />}
          {above}
          <h1
            className={`m-0 font-serif font-normal leading-[1.04] tracking-[-0.022em] text-white [text-wrap:balance] ${
              small ? 'text-[clamp(32px,4.4vw,54px)]' : 'text-[clamp(36px,5.3vw,68px)]'
            }`}
          >
            {title}
            {accent && (
              <>
                {' '}
                <em className="text-accent-soft">{accent}</em>
              </>
            )}
          </h1>
          {lede && (
            <p className="m-0 mt-[clamp(18px,2.4vw,28px)] max-w-[58ch] text-[clamp(15px,1.3vw,17.5px)] leading-[1.62] text-white/[0.72] [&_b]:font-medium [&_b]:text-white [&_strong]:font-medium [&_strong]:text-white">
              {lede}
            </p>
          )}
          {/* На телефоні й планшеті головна кнопка до форми живе в липкій
              панелі MobileDock — тут її ховаємо, як на головній. */}
          {children && <div className="max-[999px]:[&_a[href*='#contact']]:hidden">{children}</div>}
        </div>

        {showMark ? (
          <div className="-my-8 -mr-[16%] w-[min(520px,118%)] justify-self-end max-[899px]:hidden">
            <HeroMark still />
          </div>
        ) : (
          aside && <div className="min-w-0">{aside}</div>
        )}
      </div>
    </section>
  )
}

export function Crumbs({ items }: { items: Crumb[] }) {
  /* BreadcrumbList для Google: у видачі замість адреси показується
     «АКТИВ › Практики › Ліквідація…». Останній пункт — поточна сторінка,
     для неї адреса не обовʼязкова. */
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href && !c.href.includes('#') && i < items.length - 1 ? { item: absUrl(c.href) } : {}),
    })),
  }
  return (
    <nav aria-label="Ви тут" className="mb-[22px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <ol className="m-0 flex list-none flex-wrap gap-x-2.5 gap-y-1.5 p-0 font-mono text-[10.5px] uppercase leading-[1.4] tracking-[0.13em] text-on-dark-2">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2.5">
              {last || !c.href ? (
                <span className={last ? 'text-accent-soft' : ''} aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              ) : (
                <a href={c.href} className="text-on-dark-2 transition-colors hover:text-white">
                  {c.label}
                </a>
              )}
              {!last && <span aria-hidden="true" className="text-on-dark-hair">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Рядок кнопок першого екрана: головна дія + «стрілка вниз» до розділу. */
export function HeroActions({ children }: { children: ReactNode }) {
  return <div className="mt-[clamp(28px,3.4vw,40px)] flex flex-wrap items-center gap-x-[30px] gap-y-3">{children}</div>
}

/** «Ознайомитись ↓» — посилання до розділу нижче, як на головній. */
export function DownLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="group inline-flex min-h-12 items-center gap-2.5 text-[16px] font-medium text-white">
      {children}
      <span className="grid size-[34px] place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] transition-transform duration-200 group-hover:translate-y-[3px]">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v15m-6-6 6 6 6-6" />
        </svg>
      </span>
    </a>
  )
}

/** Плашки під заголовком (строк, рубрика, дата). */
export function HeroChips({ items }: { items: ReactNode[] }) {
  return (
    <ul className="m-0 mt-[22px] flex list-none flex-wrap gap-2 p-0">
      {items.map((x, i) => (
        <li
          key={i}
          className="inline-flex min-h-[34px] items-center gap-2 rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.09em] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)]"
        >
          {i === 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
          {x}
        </li>
      ))}
    </ul>
  )
}
