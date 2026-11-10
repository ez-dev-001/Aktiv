import type { CSSProperties, ReactNode } from 'react'
import { preload } from 'react-dom'
import { Icon } from '@/components/site/Icon'
import { localeHref } from '@/lib/i18n'
import { blogCategoryLabel, type ClientLogo, type Post } from '@/lib/sanity/content'
import { hasImage, imageUrl } from '@/lib/sanity/image'
import { V2_PRACTICES, V2_VALUES, v2img } from '@/lib/v2/practices'
import { DARK_ART, H2, LIGHT_ART, bg } from './ui'

/* ═══════════════════════════════════════════════════════════════════
   ГОЛОВНА — НОВА РЕДАКЦІЯ (макет клієнта, Figma «АКТИВ — сайт у стилі
   клієнта», сторінка 01 Головна).

   Порядок: перший екран → «Наша практика» (8 карток) → «Цінність
   AKTIV» → «Нам довіряють» → «Актуальні новини» → форма й адреса
   (LeadSection, як і було) → футер. Блоку «Команда» на головній
   немає — прибрано на прохання клієнта.

   Картинки — public/v2/img/*.jpg (експорт зі сторінки Assets у
   Figma). Під кожною лежить градієнт-заглушка: поки файлу немає,
   секція все одно виглядає завершеною, а не дірявою.
   ═══════════════════════════════════════════════════════════════════ */

const TXT = {
  ua: {
    h1a: 'Ваш бізнес.',
    h1b: 'Наш захист.',
    lede: 'Комплексний юридичний супровід, судові спори та захист ваших прав. Практичні рішення для складних ситуацій.',
    cta: 'Записатися на консультацію',
    practicesA: 'Наша ',
    practicesB: 'практика',
    more: 'Детальніше',
    valuesA: 'Цінність AKTIV —',
    valuesB: 'у вашому результаті.',
    trustA: 'Нам ',
    trustB: 'довіряють',
    trustSub: 'Довіра, яку ми будуємо справами.',
    logo: 'Логотип клієнта',
    newsA: 'Актуальні ',
    newsB: 'новини',
    allNews: 'Усі новини',
    read: 'Читати далі',
  },
  en: {
    h1a: 'Your business.',
    h1b: 'Our protection.',
    lede: 'Full-scope legal support, litigation and protection of your rights. Practical solutions for difficult situations.',
    cta: 'Book a consultation',
    practicesA: 'Our ',
    practicesB: 'practice',
    more: 'Learn more',
    valuesA: 'AKTIV’s value —',
    valuesB: 'is your result.',
    trustA: 'Trusted ',
    trustB: 'by',
    trustSub: 'Trust we build with results.',
    logo: 'Client logo',
    newsA: 'Latest ',
    newsB: 'news',
    allNews: 'All news',
    read: 'Read more',
  },
}
const tx = (lang: string) => (lang === 'en' ? TXT.en : TXT.ua)

/* ═══════════════════════ ПЕРШИЙ ЕКРАН ═══════════════════════ */
export function V2Hero({ lang = 'ua' }: { lang?: string }) {
  const t = tx(lang)
  preload(v2img('hero-home'), { as: 'image', fetchPriority: 'high' })
  return (
    <section
      id="hero"
      className="on-dark relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-clip bg-ink text-on-dark"
    >
      {/* Кадр із колонами праворуч; на телефоні — зсунутий, щоб колони були видно над текстом. */}
      <div aria-hidden="true" className="v2-hero-bg absolute inset-0 -z-[2]" style={bg('hero-home', DARK_ART, '72% center')} />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,#0b0710_0%,rgb(11_7_16/0.86)_34%,rgb(11_7_16/0.15)_62%,transparent_100%),linear-gradient(180deg,rgb(11_7_16/0.55)_0%,transparent_22%,transparent_70%,#0b0710_100%)] max-[899px]:bg-[linear-gradient(180deg,rgb(11_7_16/0.6)_0%,rgb(11_7_16/0.35)_30%,rgb(11_7_16/0.92)_62%,#0b0710_100%)]"
      />
      <div className="v2-hero-copy shell inner flex min-h-[clamp(620px,100svh,920px)] flex-col justify-end pb-[132px] pt-[calc(var(--hdr)+40px)] min-[900px]:justify-center min-[1000px]:pb-[clamp(56px,9vw,120px)]">
        <h1 className="m-0 font-display text-[clamp(46px,7.4vw,112px)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white">
          <span className="v2-in block" style={{ '--d': '80ms' } as CSSProperties}>{t.h1a}</span>
          <span className="v2-in block text-accent" style={{ '--d': '220ms' } as CSSProperties}>{t.h1b}</span>
        </h1>
        <p style={{ '--d': '380ms' } as CSSProperties} className="v2-in m-0 mt-[clamp(18px,2.4vw,30px)] max-w-[34ch] text-[clamp(16px,1.45vw,21px)] font-normal leading-[1.55] text-white/[0.82]">
          {t.lede}
        </p>
        <a
          href="#contact"
          style={{ '--d': '520ms' } as CSSProperties}
          className="v2-in mt-[clamp(26px,3.4vw,42px)] inline-flex min-h-[58px] items-center gap-4 self-start rounded-full bg-accent-btn px-8 text-[16px] font-semibold text-white transition-colors hover:bg-accent-btn-hover max-[999px]:hidden"
        >
          {t.cta}
        </a>
      </div>
    </section>
  )
}

/* ═══════════════════════ НАША ПРАКТИКА ═══════════════════════ */
export function V2Practices({ lang = 'ua' }: { lang?: string }) {
  const t = tx(lang)
  const to = (h: string) => localeHref(lang, h)
  return (
    <section id="practices" className="relative isolate overflow-clip bg-paper py-[clamp(64px,9vw,128px)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-[1] h-[min(820px,70vw)] opacity-90 [mask-image:linear-gradient(180deg,transparent_0,#000_clamp(170px,19vw,300px),#000_50%,transparent)]"
        style={bg('light-hall', LIGHT_ART, 'right top')}
        data-par=""
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-[1] h-[min(820px,70vw)] bg-[linear-gradient(90deg,var(--color-paper)_0%,rgb(247_243_241/0.8)_40%,transparent_75%)]" />
      <div className="shell inner">
        <H2 a={t.practicesA} b={t.practicesB} />
        <ul className="m-0 mt-[clamp(34px,5vw,64px)] grid list-none gap-[clamp(14px,1.8vw,24px)] p-0 min-[900px]:grid-cols-2">
          {V2_PRACTICES.map((p, i) => (
            <li key={p.title} className="v2-rise group relative isolate flex min-h-[340px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_48px_-30px_rgb(80_10_40/0.28)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-28px_rgb(80_10_40/0.36)]">
              {/* Контур — окремим шаром поверх фото, інакше фото його перекриває. */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] rounded-[22px] shadow-[inset_0_0_0_1px_rgb(250_33_99/0.16)] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1.5px_rgb(250_33_99/0.5)]" />
              {/* Фото праворуч, розчиняється в біле ліворуч. На вузькому — смуга згори.
                  Наближення при наведенні — всередині рамки з overflow-hidden:
                  інакше збільшене фото вилазило лівим краєм з-під білого
                  градієнта, і було видно смугу-шов. */}
              <div
                aria-hidden="true"
                className="absolute -z-[1] overflow-hidden max-[559px]:inset-x-0 max-[559px]:top-0 max-[559px]:h-[150px] min-[560px]:inset-y-0 min-[560px]:right-0 min-[560px]:w-[62%]"
              >
                <div
                  className="size-full transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
                  style={bg(p.img, 'linear-gradient(135deg,#f6e3ea,#fbf4f6)')}
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute -z-[1] max-[559px]:inset-x-0 max-[559px]:top-0 max-[559px]:h-[156px] max-[559px]:bg-[linear-gradient(180deg,transparent_30%,#fff_96%)] min-[560px]:inset-y-0 min-[560px]:right-0 min-[560px]:w-[calc(62%+3px)] min-[560px]:bg-[linear-gradient(90deg,#fff_0%,rgb(255_255_255/0.55)_45%,transparent_100%)]"
              />
              <div className="flex w-full flex-col p-[clamp(22px,2.4vw,32px)] max-[559px]:pt-[132px] min-[560px]:w-[64%]">
                <h3 className="m-0 font-serif text-[clamp(25px,2.2vw,31px)] font-normal leading-[1.12] text-ink">
                  <a href={to(p.href)} className="after:absolute after:inset-0 after:z-[1] after:content-['']">
                    {p.title}
                  </a>
                </h3>
                <ul className="m-0 mt-4 grid list-none gap-[5px] p-0">
                  {p.items.map((it) => (
                    <li key={it.title} className="relative pl-[15px] text-[14.5px] font-normal leading-[1.42] text-[#4a4350] before:absolute before:left-0 before:top-[0.56em] before:size-[5px] before:rounded-full before:bg-[#8c858f]">
                      {it.href ? (
                        <a href={to(it.href)} className="relative z-[2] transition-colors hover:text-accent-ink">
                          {it.title}
                        </a>
                      ) : (
                        it.title
                      )}
                    </li>
                  ))}
                </ul>
                <span aria-hidden="true" className="mt-auto block min-h-[56px]" />
              </div>
              <span
                aria-hidden="true"
                className="absolute bottom-[22px] right-[22px] grid size-[50px] place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1.2px_rgb(250_33_99/0.4),0_10px_24px_-12px_rgb(80_10_40/0.4)] transition-[background-color,color] duration-300 group-hover:bg-accent-btn group-hover:text-white"
              >
                <Icon name="arrow" className="size-[18px]" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ═══════════════════════ ЦІННІСТЬ AKTIV ═══════════════════════ */
export function V2Values({ lang = 'ua', light = false }: { lang?: string; light?: boolean }) {
  const t = tx(lang)
  return (
    <section
      id="values"
      className={`relative isolate overflow-clip py-[clamp(64px,9vw,128px)] ${light ? 'bg-white' : 'on-dark bg-ink text-on-dark'}`}
    >
      {!light && (
        <>
          <div aria-hidden="true" data-par="" className="absolute -inset-y-[60px] inset-x-0 -z-[2] opacity-50" style={bg('about-hero', DARK_ART, 'right center')} />
          <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,rgb(11_7_16/0.96),rgb(11_7_16/0.75)_60%,rgb(11_7_16/0.35))]" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-[1] h-[200px] bg-[linear-gradient(180deg,transparent,#0b0710)]" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-[1] h-[clamp(140px,16vw,240px)] bg-[linear-gradient(180deg,#0b0710,transparent)]" />
        </>
      )}
      <div className="shell inner">
        <H2
          dark={!light}
          a={
            <>
              {t.valuesA}
              <br />
            </>
          }
          b={t.valuesB}
          className="!text-[clamp(36px,4.8vw,68px)]"
        />
        <ol className="m-0 mt-[clamp(40px,6vw,80px)] grid list-none gap-y-10 p-0 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-4">
          {V2_VALUES.map((v, i) => (
            <li
              key={v.title}
              className={`v2-rise relative px-0 min-[1000px]:px-[clamp(16px,2vw,28px)] min-[1000px]:first:pl-0 ${
                i ? `min-[1000px]:border-l ${light ? 'min-[1000px]:border-hair' : 'min-[1000px]:border-white/[0.14]'}` : ''
              }`}
            >
              <div className="flex items-start">
                                <div
                  aria-hidden="true"
                  className={`size-[clamp(120px,11vw,156px)] shrink-0 [mask-image:radial-gradient(closest-side,#000_62%,transparent_100%)] ${light ? 'mix-blend-multiply' : 'mix-blend-screen [filter:contrast(1.3)_brightness(1.08)]'}`}
                  style={{
                    ...bg(v.img, 'radial-gradient(closest-side, rgb(250 33 99 / 0.35), transparent)'),
                    ...(light ? { filter: 'invert(1) hue-rotate(180deg)' } : {}),
                  }}
                />
              </div>
              <h3 className={`m-0 mt-5 font-serif text-[clamp(24px,2vw,29px)] font-normal ${light ? 'text-ink' : 'text-white'}`}>{v.title}</h3>
              <p className={`m-0 mt-3 max-w-[30ch] text-[15px] font-normal leading-[1.6] ${light ? 'text-slate' : 'text-white/[0.72]'}`}>
                {v.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ═══════════════════════ НАМ ДОВІРЯЮТЬ ═══════════════════════
   Логотипи — лише з Sanity і лише ті, де стоїть галочка дозволу
   (фільтр у GROQ). Без жодного логотипа в продакшені блоку немає:
   чужа торгова марка без згоди — претензія, а не доказ. Локально
   показуються підписані заглушки, щоб було видно розкладку. */
export function V2Trusted({ lang = 'ua', clients }: { lang?: string; clients: ClientLogo[] }) {
  const t = tx(lang)
  const preview = !clients.length && process.env.NODE_ENV !== 'production'
  if (!clients.length && !preview) return null
  const row: (ClientLogo | null)[] = clients.length ? clients.slice(0, 12) : Array.from({ length: 6 }, () => null)
  return (
    <section id="trusted" className="relative isolate overflow-clip bg-paper py-[clamp(64px,9vw,120px)]">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-[2] w-[min(900px,70%)] [mask-image:linear-gradient(180deg,transparent,#000_26%,#000_70%,transparent)] max-[799px]:hidden" data-par="" style={bg('light-crystal', LIGHT_ART, 'right center')} />
      <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,var(--color-paper)_0%,var(--color-paper)_35%,rgb(247_243_241/0.6)_60%,transparent_85%)]" />
      <div className="shell inner">
        <H2 a={t.trustA} b={t.trustB} />
        <p className="m-0 mt-5 max-w-[460px] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-slate">{t.trustSub}</p>
        <div className="v2-rise mt-[clamp(40px,6vw,88px)] overflow-hidden rounded-[18px] bg-white/80 shadow-[0_20px_44px_-30px_rgb(80_10_40/0.35),inset_0_0_0_1px_rgb(250_33_99/0.14)] backdrop-blur-md">
        <ul className="-ml-px m-0 grid list-none grid-cols-2 p-0 min-[700px]:grid-cols-3 min-[1100px]:grid-cols-6">
          {row.map((c, i) => (
            <li
              key={c?.name ?? i}
              className="grid min-h-[96px] place-items-center border-l border-[#d9cfd3] px-5 py-4 text-center"
            >
              {c ? (
                c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt={c.name} className="max-h-[44px] w-auto max-w-[150px] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" />
                ) : (
                  <span className="font-display text-[17px] font-bold text-ink/70">{c.name}</span>
                )
              ) : (
                <span className=" text-[13px] text-slate-2">{t.logo}</span>
              )}
            </li>
          ))}
        </ul>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ АКТУАЛЬНІ НОВИНИ ═══════════════════════ */
const NEWS_FALLBACK = ['n-pen', 'n-tower', 'n-papers', 'n-court', 'n-gavel', 'n-code']

function fmtDate(iso: string | undefined, lang: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(d)
    .replace(/\s*р\.$/, '')
}

export function V2News({ lang = 'ua', posts, clickable }: { lang?: string; posts: Post[]; clickable: boolean }) {
  const t = tx(lang)
  const prefix = lang === 'ua' ? '' : `/${lang}`
  return (
    <section id="journal" className="on-dark relative isolate overflow-clip bg-ink py-[clamp(64px,9vw,120px)] text-on-dark">
      <div aria-hidden="true" data-par="" className="absolute -inset-y-[60px] inset-x-0 -z-[2] opacity-40" style={bg('news-hero', DARK_ART, 'right top')} />
      <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(180deg,#0b0710_0%,rgb(11_7_16/0.72)_18%,rgb(11_7_16/0.9)_70%,#0b0710_100%)]" />
      <div className="shell inner">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H2 dark a={t.newsA} b={t.newsB} />
          <a
            href={`${prefix}/blog`}
            className="inline-flex min-h-[52px] items-center gap-3 rounded-full px-7 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1.5px_var(--color-accent)] transition-colors hover:bg-white/[0.06]"
          >
            {t.allNews}
          </a>
        </div>
        <ul className="m-0 mt-[clamp(32px,4.4vw,56px)] grid list-none gap-[clamp(16px,1.8vw,24px)] p-0 max-[899px]:-mx-[var(--gut)] max-[899px]:auto-cols-[min(86%,380px)] max-[899px]:grid-flow-col max-[899px]:overflow-x-auto max-[899px]:px-[var(--gut)] max-[899px]:[scroll-snap-type:x_mandatory] max-[899px]:[scrollbar-width:none] min-[900px]:grid-cols-3">
          {posts.slice(0, 3).map((p, i) => {
            const href = clickable ? `${prefix}/blog/${p.slug}` : `${prefix}/blog`
            const cover = hasImage(p.cover) ? `url(${imageUrl(p.cover, 820, 480)})` : null
            const date = fmtDate(p.publishedAt, lang)
            const cat = blogCategoryLabel(p.category, lang)
            return (
              <li key={p.slug} className="v2-rise [scroll-snap-align:start]">
                <article className="group relative isolate flex h-full flex-col overflow-hidden rounded-[20px] bg-[#130d17]">
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] rounded-[20px] shadow-[inset_0_0_0_1px_rgb(250_33_99/0.3)] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1.5px_rgb(250_33_99/0.8)]" />
                  <div
                    aria-hidden="true"
                    className="aspect-[41/22] w-full bg-cover bg-center transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                    style={
                      cover
                        ? { backgroundImage: cover }
                        : bg(NEWS_FALLBACK[i % NEWS_FALLBACK.length]!, 'linear-gradient(135deg,#2a1420,#0b0710)')
                    }
                  />
                  <div className="relative flex flex-1 flex-col bg-[#130d17] p-[clamp(20px,2vw,28px)]">
                    <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-on-dark-2">
                      {cat && <span className="text-accent-soft">{cat}</span>}
                      {date && <time dateTime={p.publishedAt}>{date}</time>}
                    </p>
                    <h3 className="m-0 mt-3 font-serif text-[clamp(20px,1.7vw,24px)] font-normal leading-[1.2] text-white">
                      <a href={href} className="after:absolute after:inset-0 after:content-['']">
                        {p.title}
                      </a>
                    </h3>
                    {p.excerpt && <p className="m-0 mt-3 line-clamp-3 text-[14.5px] leading-[1.55] text-on-dark">{p.excerpt}</p>}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
