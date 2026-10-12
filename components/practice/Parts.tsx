import type { ReactNode } from 'react'
import { teamPhoto } from '@/lib/sanity/content'
import { Kicker, RingAvatar, SEC } from '@/components/site/Blocks'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import type { PracticePerson } from './data'
import { ui } from '@/lib/ui'

/**
 * Блоки страниц направления и услуги (формат armada.law, как главная).
 * Только то, чего нет в components/site/Blocks.tsx.
 */

/* ── текст ── */

/** «Ліквідація та банкрутство» → ['Ліквідація', 'та банкрутство']: акцент — от союза.
    Англійською — від «&» / «and»: «Liquidation & Bankruptcy». */
export function splitConj(title: string, lang = 'ua'): [string, string | undefined] {
  const m = title.match(ui(lang).category.conj)
  return m?.[1] && m[2] ? [m[1], m[2]] : [title, undefined]
}

/** «Альтернативна ліквідація — зміна директора…» → ['Альтернативна ліквідація', 'зміна директора…']. */
export function splitDash(title: string): [string, string | undefined] {
  const i = title.indexOf(' — ')
  return i > 0 ? [title.slice(0, i), title.slice(i + 3).trim() || undefined] : [title, undefined]
}

/** 1 послуга, 2 послуги, 5 послуг. */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return one
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few
  return many
}

const portraitUrl = (u: string) => `${u}?w=760&h=950&fit=crop&crop=top&auto=format&q=80`
const avatarUrl = (u: string) => `${u}?w=320&h=320&fit=crop&crop=top&auto=format&q=80`

/** Імʼя + роль поруч з аватаром у кільці. */
export function PersonLine({ m, size = 'size-[60px]', dark = false }: { m: PracticePerson; size?: string; dark?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      <RingAvatar src={teamPhoto(m.photoUrl, 160)} name={m.name} className={size} />
      <span className="min-w-0">
        <span className={`block font-serif text-[18px] font-semibold leading-[1.25] ${dark ? 'text-white' : 'text-ink'}`}>{m.name}</span>
        {m.role && <span className={`mt-0.5 block text-[13.5px] leading-snug ${dark ? 'text-accent-soft' : 'text-accent-ink'}`}>{m.role}</span>}
      </span>
    </div>
  )
}

/* ── «Хто веде напрям» ──
   Та сама композиція, що TeamIntro на головній: великий портрет 4:5 з
   малиновим кутом на десктопі, кружок з кільцем на телефоні. Портрет —
   у першого привʼязаного (порядок з «Команди»), решта — рядом аватарів. */
export function LeadTeam({ people, contactHref, lang = 'ua' }: { people: PracticePerson[]; contactHref: string; lang?: string }) {
  const T = ui(lang)
  const t = T.category
  const lead = people.find((m) => m.photoUrl)
  const rest = lead ? people.filter((m) => m !== lead) : people
  /* «адвокат» — лише якщо це правда для всіх: приватний виконавець адвокатом не є. */
  const allAdvocates = people.every((m) => t.attorneyRole.test(m.role))

  return (
    <section aria-labelledby="lead-team-h" className={`bg-paper ${SEC}`}>
      <div
        className={`shell inner grid items-center gap-[clamp(28px,5vw,80px)] ${
          lead ? 'min-[860px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' : ''
        }`}
      >
        {lead?.photoUrl && (
          <figure className="relative isolate m-0 hidden w-full max-w-[420px] min-[860px]:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-paper-2 shadow-[0_40px_80px_-48px_rgb(20_11_51/0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portraitUrl(lead.photoUrl)} alt={lead.name} loading="lazy" decoding="async" className="size-full object-cover object-top" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent,rgb(20_11_51/0.82))]" />
              <figcaption className="absolute inset-x-0 bottom-0 p-[clamp(18px,2.4vw,26px)]">
                <span className="block font-serif text-[clamp(20px,2.3vw,24px)] font-semibold leading-tight text-white">{lead.name}</span>
                {lead.role && <span className="mt-1 block text-[13.5px] text-accent-soft">{lead.role}</span>}
              </figcaption>
            </div>
            <span aria-hidden="true" className="absolute -bottom-3 -left-3 -z-[1] h-2/5 w-2/5 rounded-bl-[26px] border-b-[3px] border-l-[3px] border-accent" />
          </figure>
        )}

        <div className="min-w-0">
          {lead?.photoUrl && (
            <div className="mb-[clamp(22px,4vw,32px)] flex items-center gap-[clamp(16px,3.4vw,24px)] min-[860px]:hidden">
              <div className="relative size-[104px] shrink-0 min-[600px]:size-[128px]">
                <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                  <path d="M94.2 66.1 A 47 47 0 1 1 94.2 33.9" fill="none" stroke="var(--color-accent)" strokeWidth="3.2" strokeLinecap="round" />
                </svg>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl(lead.photoUrl)}
                  alt={lead.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-[9%] size-[82%] rounded-full bg-paper-2 object-cover object-top shadow-[0_16px_32px_-18px_rgb(20_11_51/0.55)]"
                />
              </div>
              <div className="min-w-0">
                <span className="block font-serif text-[clamp(20px,4.6vw,24px)] font-semibold leading-tight text-ink">{lead.name}</span>
                {lead.role && <span className="mt-1 block text-[14px] leading-snug text-accent-ink">{lead.role}</span>}
              </div>
            </div>
          )}

          <Kicker>{t.leadKicker}</Kicker>
          <h2
            id="lead-team-h"
            className="m-0 mt-3.5 font-serif text-[clamp(30px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink [text-wrap:balance]"
          >
            {t.leadTitle} <em className="text-accent-ink">{allAdvocates ? t.leadAttorney : t.leadExpert}</em>
          </h2>
          <p className="m-0 mt-[18px] max-w-[56ch] text-[15.5px] leading-[1.65] text-slate">
            {t.leadText}
          </p>

          {rest.length > 0 && (
            <ul className="m-0 mt-[26px] flex list-none flex-wrap gap-x-7 gap-y-[18px] p-0">
              {rest.map((m) => (
                <li key={m.slug ?? m.name}>
                  <PersonLine m={m} />
                </li>
              ))}
            </ul>
          )}

          <ButtonLink href={contactHref} arrow className="mt-[clamp(26px,3vw,34px)]">
            {T.common.discussCase}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

/* ── список з рожевими галочками (пакети, «що входить») ── */
export function CheckList({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {items.map((a, i) => (
        <li
          key={`${i}-${a}`}
          className={`relative pl-[26px] text-[15px] leading-[1.55] before:absolute before:left-0 before:top-[7px] before:h-2 before:w-3.5 before:-rotate-45 before:border-b-[1.8px] before:border-l-[1.8px] before:border-accent before:content-[''] ${
            dark ? 'text-on-dark' : 'text-[#3b3450]'
          }`}
        >
          {a}
        </li>
      ))}
    </ul>
  )
}

/** Дрібний mono-підпис над списком. */
export function MiniLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`m-0 mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] ${dark ? 'text-on-dark-2' : 'text-slate'}`}>
      {children}
    </p>
  )
}

/** Знак «АКТИВ» (кільце зі стрілою) — декор у куті темної картки. */
export function MarkGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-26.5 -19.5 300 220" aria-hidden="true" className={className}>
      <path d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9" fill="none" stroke="#fa2163" strokeWidth="13" />
      <path d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z" fill="#fa2163" />
    </svg>
  )
}

/* ── «Інші послуги напряму» ──
   Спліт як «Наша практика» на головній: темна половина з текстом,
   світла — з білими плашками. Половини від краю до краю, текст по сітці. */
export function OtherServices({
  title,
  count,
  href,
  items,
  afterHero = false,
  lang = 'ua',
}: {
  lang?: string
  title: string
  count: number
  href: string
  items: { href: string; label: string }[]
  /** одразу під темним першим екраном — тонка лінія, щоб темне не злилося */
  afterHero?: boolean
}) {
  const T = ui(lang)
  const t = T.category
  return (
    <section
      aria-label={t.otherAria}
      className={`grid [container-type:inline-size] min-[900px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] ${
        afterHero ? 'border-t border-on-dark-hair' : ''
      }`}
    >
      <div className="on-dark bg-ink px-[var(--gut)] py-[clamp(48px,7vw,96px)] text-on-dark min-[900px]:pl-[max(var(--gut),calc((100cqw-var(--shell))/2+var(--gut)))]">
        <div className="max-w-[440px]">
          <Reveal className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] !text-white">
            {t.otherTitle[0]} <em className="text-accent-soft">{t.otherTitle[1]}</em>
          </Reveal>
          <p className="m-0 mt-[18px] text-[15.5px] leading-[1.65] text-on-dark">
            {title} — {T.common.services(count)}.
          </p>
          <ArrowLink href={href} className="mt-[22px] text-[15px] font-semibold !text-accent-soft">
            {t.allInArea}
          </ArrowLink>
        </div>
      </div>
      <div className="bg-paper-2 px-[var(--gut)] py-[clamp(36px,6vw,96px)] min-[900px]:pr-[max(var(--gut),calc((100cqw-var(--shell))/2+var(--gut)))]">
        <ul className="m-0 grid list-none gap-2 p-0 @min-[560px]:grid-cols-2 @min-[1100px]:grid-cols-3">
          {items.map((it) => (
            <li key={it.href} className="flex">
              <a
                href={it.href}
                className="flex min-h-16 w-full items-center justify-center rounded-[14px] bg-white px-4 py-3 text-center text-[14.5px] font-medium leading-[1.35] text-ink no-underline shadow-[0_1px_2px_rgb(20_11_51/0.05)] transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[inset_0_0_0_1.5px_var(--color-accent),0_12px_24px_-16px_rgb(20_11_51/0.35)]"
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
