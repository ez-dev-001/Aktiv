import { preload } from 'react-dom'
import type { CSSProperties, ReactNode } from 'react'
import { v2img } from '@/lib/v2/practices'
import { DARK_ART, LIGHT_ART, bg } from '@/components/v2/ui'
import { absUrl } from '@/lib/seo'
import { ui } from '@/lib/ui'

/**
 * Перший екран внутрішньої сторінки — нова редакція (макет клієнта).
 *
 * Темний (або світлий — `light`) екран із фото праворуч (`img`, за
 * замовчуванням — колони з головної), ліворуч крихти, жирний гротеск
 * із малиновим другим рядком (без курсиву), абзац і кнопки; праворуч
 * може стояти картка сторінки (`aside`: «квиток» послуги, вакансії…).
 *
 * Нижча за героя головної: це не перший екран сайту.
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
  lang = 'ua',
  img,
  photoUrl,
  serif = false,
  light = false,
}: {
  /** мова сторінки — для підпису крихт */
  lang?: string
  crumbs?: Crumb[]
  /** основна частина заголовка */
  title: ReactNode
  /** малиновий хвіст заголовка (з нового рядка, без курсиву) */
  accent?: ReactNode
  lede?: ReactNode
  /** рядок під абзацом: кнопки, плашки, автор */
  children?: ReactNode
  /** права колонка (картка сторінки) */
  aside?: ReactNode
  /** застаріле: знак праворуч замінено фото (img); лишено для сумісності */
  mark?: boolean
  /** нижча шапка: блог, політика, статті */
  compact?: boolean
  /** менший кегль заголовка — для довгих назв послуг і статей */
  small?: boolean
  /** над заголовком після крихт (напр. галочка на «Дякуємо») */
  above?: ReactNode
  /** фото нової редакції (public/v2/img/<img>.jpg) праворуч на всю висоту */
  img?: string
  /** світла шапка (папір + світле фото), як «Практики» в макеті клієнта */
  light?: boolean
  /** фото за повною адресою (обкладинка статті з Sanity) — має пріоритет над img */
  photoUrl?: string
  /** заголовок антиквою (стаття): довгі назви читаються легше, ніж жирним гротеском */
  serif?: boolean
}) {
  void mark
  /* Фото за замовчуванням — колони з головної: внутрішні сторінки
     виглядають частиною того самого сайту. Компактні шапки без фото. */
  const photo = photoUrl ? 'url' : img ?? (compact ? undefined : light ? 'light-hall' : 'hero-home')
  if (photoUrl) preload(photoUrl, { as: 'image', fetchPriority: 'high' })
  else if (photo) preload(v2img(photo), { as: 'image', fetchPriority: 'high' })

  return (
    <section
      id="hero"
      className={`relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-hidden ${
        light ? 'bg-paper text-slate' : 'on-dark bg-ink text-on-dark'
      }`}
    >
      {photo && (
        <>
          <div aria-hidden="true" className="v2-hero-bg absolute inset-0 -z-[2]" style={
              photoUrl
                ? { backgroundImage: `url(${photoUrl}), ${DARK_ART}`, backgroundSize: 'cover, cover', backgroundPosition: '70% center, center', backgroundRepeat: 'no-repeat' }
                : bg(photo, light ? LIGHT_ART : DARK_ART, '75% center')
            } />
          <div
            aria-hidden="true"
            className={`absolute inset-0 -z-[1] ${
              light
                ? 'bg-[linear-gradient(90deg,#f7f3f1_0%,rgb(247_243_241/0.92)_38%,rgb(247_243_241/0.2)_70%,transparent_100%),linear-gradient(180deg,rgb(247_243_241/0.5)_0%,transparent_25%,transparent_75%,#f7f3f1_100%)] max-[899px]:bg-[linear-gradient(180deg,rgb(247_243_241/0.7)_0%,rgb(247_243_241/0.88)_45%,#f7f3f1_100%)]'
                : 'bg-[linear-gradient(90deg,#0b0710_0%,rgb(11_7_16/0.88)_36%,rgb(11_7_16/0.2)_66%,transparent_100%),linear-gradient(180deg,rgb(11_7_16/0.55)_0%,transparent_24%,transparent_72%,#0b0710_100%)] max-[899px]:bg-[linear-gradient(180deg,rgb(11_7_16/0.65)_0%,rgb(11_7_16/0.82)_45%,#0b0710_100%)]'
            }`}
          />
        </>
      )}
      {!photo && (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-[1] bg-[radial-gradient(55%_80%_at_4%_0%,rgb(70_20_45/0.4),transparent_70%),radial-gradient(40%_70%_at_82%_60%,rgb(250_33_99/0.14),transparent_70%)]"
        />
      )}

      <div
        className={`v2-hero-copy shell inner relative z-[2] grid items-center gap-8 pt-[calc(var(--hdr)+clamp(32px,5vw,64px))] ${
          compact ? 'pb-[clamp(40px,5vw,64px)]' : 'min-h-[clamp(520px,46vw,700px)] pb-[clamp(48px,6vw,88px)]'
        } ${aside ? 'min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]' : ''}`}
      >
        <div className="min-w-0 max-w-[760px]">
          {crumbs && crumbs.length > 0 && <Crumbs items={crumbs} lang={lang} light={light} />}
          {above}
          <h1
            className={`v2-in m-0 [text-wrap:balance] ${
              serif ? 'font-serif font-normal leading-[1.1] tracking-[-0.02em]' : 'font-display font-extrabold leading-[1.02] tracking-[-0.04em]'
            } ${light ? 'text-ink' : 'text-white'} ${
              serif ? 'text-[clamp(32px,4.2vw,60px)]' : small ? 'text-[clamp(30px,3.9vw,52px)]' : 'text-[clamp(38px,5.6vw,80px)]'
            }`}
          >
            {title}
            {accent && (
              <>
                {small ? ' ' : <br />}
                <span className="text-accent">{accent}</span>
              </>
            )}
          </h1>
          {lede && (
            <p
              style={{ '--d': '160ms' } as CSSProperties}
              className={`v2-in m-0 mt-[clamp(18px,2.4vw,28px)] max-w-[56ch] text-[clamp(15.5px,1.35vw,19px)] leading-[1.6] ${
                light
                  ? 'text-[#4a4350] [&_b]:font-semibold [&_b]:text-ink [&_strong]:font-semibold [&_strong]:text-ink'
                  : 'text-white/[0.78] [&_b]:font-medium [&_b]:text-white [&_strong]:font-medium [&_strong]:text-white'
              }`}
            >
              {lede}
            </p>
          )}
          {/* На телефоні й планшеті головна кнопка до форми живе в липкій
              панелі MobileDock — тут її ховаємо, як на головній. */}
          {children && (
            <div style={{ '--d': '300ms' } as CSSProperties} className="v2-in max-[999px]:[&_a[href*='#contact']]:hidden">
              {children}
            </div>
          )}
        </div>

        {aside && (
          <div style={{ '--d': '420ms' } as CSSProperties} className="v2-in min-w-0 min-[900px]:self-end">
            {aside}
          </div>
        )}
      </div>
    </section>
  )
}

export function Crumbs({ items, lang = 'ua', light = false }: { items: Crumb[]; lang?: string; light?: boolean }) {
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
    <nav aria-label={ui(lang).hero.crumbs} className="mb-[22px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <ol className={`m-0 flex list-none flex-wrap gap-x-2.5 gap-y-1.5 p-0 text-[13px] leading-[1.4] ${light ? 'text-slate' : 'text-on-dark-2'}`}>
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2.5">
              {last || !c.href ? (
                <span className={last ? (light ? 'text-accent-ink' : 'text-accent-soft') : ''} aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              ) : (
                <a href={c.href} className={`transition-colors ${light ? 'text-slate hover:text-ink' : 'text-on-dark-2 hover:text-white'}`}>
                  {c.label}
                </a>
              )}
              {!last && <span aria-hidden="true" className={light ? 'text-hair' : 'text-on-dark-hair'}>/</span>}
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
export function DownLink({ href, children, light }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <a href={href} className={`group inline-flex min-h-12 items-center gap-2.5 text-[16px] font-medium ${light ? 'text-ink' : 'text-white'}`}>
      {children}
      <span className={`grid size-[34px] place-items-center rounded-full transition-transform duration-200 group-hover:translate-y-[3px] ${light ? 'shadow-[inset_0_0_0_1px_rgb(250_33_99/0.45)]' : 'shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]'}`}>
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
          className="inline-flex min-h-[34px] items-center gap-2 rounded-full px-3.5 text-[13px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)]"
        >
          {i === 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
          {x}
        </li>
      ))}
    </ul>
  )
}
