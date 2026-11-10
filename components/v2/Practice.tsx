import type { ReactNode } from 'react'
import { Icon } from '@/components/site/Icon'
import { ButtonLink } from '@/components/ui/Button'
import { portraitUrl } from '@/components/practice/Parts'
import type { PracticePerson } from '@/components/practice/data'
import { V2_PRACTICES } from '@/lib/v2/practices'
import { v2text } from '@/lib/v2/content'
import { bg, DARK_ART } from './ui'

/* ═══════════════════════════════════════════════════════════════════
   СТОРІНКИ НАПРЯМУ Й ПОСЛУГИ — нова редакція (Figma «A+ · Напрям
   практики», «A+ · Послуга»).

   Дрібні блоки, з яких складені обидві сторінки: список послуг
   напряму, «Як ми працюємо», юрист напряму, плашка юриста в першому
   екрані, картка консультації збоку, інші послуги й інші напрями.
   Малиновий — лише на кнопках дії; решта — чорнило, папір, білий.
   ═══════════════════════════════════════════════════════════════════ */

/** Картинка напряму (public/v2/img) за slug категорії Sanity або послуги. */
export function practiceImage(catSlug?: string, serviceSlug?: string): string {
  if (serviceSlug) {
    const hit = V2_PRACTICES.find((g) => g.items.some((it) => it.href?.endsWith(`/${serviceSlug}`)))
    if (hit) return hit.img
  }
  const byCat = V2_PRACTICES.find((g) => g.href === `/practices/${catSlug}`)
  return byCat?.img ?? 'hero-home'
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

/** Кругле фото або монограма. */
function Avatar({ m, className = 'size-11' }: { m: PracticePerson; className?: string }) {
  return m.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`${m.photoUrl}?w=120&h=120&fit=crop&crop=top&auto=format`} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${className} grid shrink-0 place-items-center rounded-full bg-accent/25 font-display text-[15px] font-extrabold text-white`}>
      {initials(m.name)}
    </span>
  )
}

/** Плашка «Напрям веде …» у першому екрані. */
export function LawyerPill({ m, label, href }: { m: PracticePerson; label: string; href: string }) {
  return (
    <a
      href={href}
      className="mt-6 inline-flex max-w-full items-center gap-3.5 rounded-full bg-white/[0.08] py-2.5 pl-2.5 pr-5 no-underline shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] transition-colors hover:bg-white/[0.12]"
    >
      <Avatar m={m} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold text-white">
          {label} {m.name}
        </span>
        {m.role && <span className="block truncate text-[13px] text-white/65">{m.role}</span>}
      </span>
    </a>
  )
}

/** «Послуги напряму» — один білий список: назва, опис, кругла кнопка. */
export function ServiceRows({ items }: { items: { title: string; text?: string; href: string }[] }) {
  return (
    <ul className="m-0 list-none overflow-hidden rounded-[22px] bg-white p-0 shadow-[0_18px_36px_-24px_rgb(77_13_38/0.25),inset_0_0_0_1px_rgb(250_33_99/0.15)]">
      {items.map((it) => (
        <li key={it.href} className="border-b border-[#e7dfdc] last:border-b-0">
          <a
            href={it.href}
            className="group grid items-center gap-x-10 gap-y-2 px-[clamp(20px,2.6vw,36px)] py-[clamp(20px,2.2vw,30px)] no-underline transition-colors hover:bg-[#fbf6f5] min-[860px]:grid-cols-[minmax(0,460px)_minmax(0,1fr)_auto]"
          >
            <span className="font-serif text-[clamp(21px,1.9vw,24px)] leading-[1.25] text-ink">{it.title}</span>
            {it.text ? <span className="text-[15.5px] leading-[1.6] text-slate">{it.text}</span> : <span />}
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full text-ink shadow-[inset_0_0_0_1px_rgb(23_18_28/0.25)] transition-colors duration-200 group-hover:bg-ink group-hover:text-white group-hover:shadow-none max-[859px]:hidden"
            >
              <Icon name="arrow" className="size-[18px]" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** «Як ми працюємо» — чотири кроки на темному. Номери тут доречні: це послідовність. */
export function ProcessSteps({ lang = 'ua' }: { lang?: string }) {
  const t = v2text(lang).pp
  return (
    <section className="on-dark relative isolate overflow-clip bg-ink py-[clamp(64px,8vw,112px)] text-on-dark">
      <div aria-hidden="true" className="absolute inset-0 -z-[2] opacity-30" style={bg('hero-home', DARK_ART, 'right center')} />
      <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,#0b0710_0%,rgb(11_7_16/0.9)_55%,rgb(11_7_16/0.6))]" />
      <div className="shell inner">
        <h2 className="m-0 font-serif text-[clamp(36px,4.4vw,56px)] font-normal leading-[1.08] tracking-[-0.02em] text-white">{t.processTitle}</h2>
        <p className="m-0 mt-4 text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-white/70">{t.processLede}</p>
        <ol className="m-0 mt-[clamp(32px,4vw,56px)] grid list-none gap-4 p-0 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4 min-[1100px]:gap-6">
          {t.steps.map((s, i) => (
            <li key={s.title} className="rounded-[22px] bg-white/[0.04] p-[clamp(24px,2.4vw,32px)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]">
              <span className="block font-display text-[40px] font-extrabold leading-none text-accent">{i + 1}</span>
              <h3 className="m-0 mt-4 font-serif text-[clamp(22px,1.9vw,26px)] font-normal leading-[1.2] text-white">{s.title}</h3>
              <p className="m-0 mt-3 text-[15.5px] leading-[1.6] text-white/72">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Юрист напряму: портрет (або монограма) + імʼя, роль, кнопки. */
export function LeadLawyer({
  m,
  label,
  text,
  chips,
  consult,
  phone,
  lang = 'ua',
}: {
  m: PracticePerson
  label: string
  text?: string
  chips?: string[]
  consult: string
  phone: { label: string; href: string }
  lang?: string
}) {
  const t = v2text(lang).pp
  return (
    <section id="lawyer" className="scroll-mt-[var(--hdr)] py-[clamp(56px,8vw,112px)]">
      <div className="shell inner grid items-center gap-[clamp(28px,5vw,80px)] min-[900px]:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <div className="relative isolate aspect-[8/9] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#2a1630,#0b0710)]">
          {m.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl(m.photoUrl)} alt={m.name} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
          ) : (
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center font-display text-[clamp(120px,14vw,180px)] font-extrabold tracking-[-0.04em] text-white/[0.07]">
              {initials(m.name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-medium text-slate">{label}</p>
          <h2 className="m-0 mt-3 font-serif text-[clamp(36px,4vw,52px)] font-normal leading-[1.1] tracking-[-0.02em] text-ink">{m.name}</h2>
          {m.role && <p className="m-0 mt-3 text-[17px] font-medium text-accent-ink">{m.role}</p>}
          {text && <p className="m-0 mt-5 max-w-[56ch] text-[clamp(16px,1.3vw,18px)] leading-[1.65] text-[#3b3440]">{text}</p>}
          {chips && chips.length > 0 && (
            <ul className="m-0 mt-6 flex list-none flex-wrap gap-2 p-0">
              {chips.map((c) => (
                <li key={c} className="rounded-full bg-accent-wash px-3 py-1.5 text-[13px] font-medium text-accent-ink">
                  {c}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={consult}>{t.bookLawyer}</ButtonLink>
            <ButtonLink href={phone.href} variant="ghost">
              {phone.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}

/** «Інші напрями» — рядок плашок-посилань. */
export function OtherAreas({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  if (!items.length) return null
  return (
    <section aria-label={title} className="border-t border-ink/[0.08] py-[clamp(48px,6vw,80px)]">
      <div className="shell inner">
        <h2 className="m-0 font-serif text-[clamp(26px,2.4vw,32px)] font-normal text-ink">{title}</h2>
        <ul className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
          {items.map((it) => (
            <li key={it.href}>
              <a
                href={it.href}
                className="inline-flex min-h-12 items-center rounded-full bg-white px-[22px] text-[15px] font-medium text-ink no-underline shadow-[inset_0_0_0_1px_rgb(23_18_28/0.12)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgb(23_18_28/0.5)]"
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

/** Тёмна картка збоку на сторінці послуги: хто веде, кнопки, графік. */
export function ConsultCard({
  m,
  consult,
  phone,
  hours,
  lang = 'ua',
}: {
  m?: PracticePerson
  consult: string
  phone: { label: string; href: string }
  hours?: string
  lang?: string
}) {
  const t = v2text(lang).pp
  return (
    <div className="on-dark grid gap-5 rounded-[22px] bg-ink p-[clamp(24px,2.4vw,32px)] text-on-dark">
      <p className="m-0 font-serif text-[clamp(24px,2vw,28px)] leading-[1.2] text-white">{t.consultTitle}</p>
      {m && (
        <div className="flex items-center gap-3.5">
          <Avatar m={m} className="size-12" />
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-white">{m.name}</span>
            {m.role && <span className="block text-[13.5px] text-white/65">{m.role}</span>}
          </span>
        </div>
      )}
      <p className="m-0 text-[15.5px] leading-[1.6] text-white/75">{t.consultText}</p>
      <div className="grid gap-2.5">
        <ButtonLink href={consult} className="w-full">
          {v2text(lang).about.cta}
        </ButtonLink>
        <ButtonLink href={phone.href} variant="ghostDark" className="w-full">
          {phone.label}
        </ButtonLink>
      </div>
      {hours && (
        <p className="m-0 flex items-center gap-2.5 text-[14px] text-white/65">
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {hours}
        </p>
      )}
    </div>
  )
}

/** Біла картка «Інші послуги напряму» під картою консультації. */
export function OtherServicesCard({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  if (!items.length) return null
  return (
    <nav aria-label={title} className="rounded-[22px] bg-white px-[clamp(22px,2.2vw,28px)] pb-3 pt-[clamp(22px,2.2vw,28px)] shadow-[inset_0_0_0_1px_rgb(250_33_99/0.15)]">
      <p className="m-0 font-serif text-[22px] text-ink">{title}</p>
      <ul className="m-0 mt-3 list-none p-0">
        {items.map((it) => (
          <li key={it.href} className="border-t border-[#e7dfdc] first:border-t-0">
            <a href={it.href} className="group flex min-h-[48px] items-center justify-between gap-3 py-3 text-[15px] leading-[1.45] text-[#3b3440] no-underline hover:text-ink">
              {it.label}
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-2 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** «Що входить у послугу» — біла картка з галочками в колі. */
export function IncludesCard({ title, items }: { title: string; items: ReactNode[] }) {
  if (!items.length) return null
  return (
    <div className="my-[clamp(28px,3.4vw,40px)] rounded-[22px] bg-white px-[clamp(22px,2.6vw,36px)] pb-4 pt-[clamp(24px,2.6vw,36px)] shadow-[0_18px_36px_-24px_rgb(77_13_38/0.25),inset_0_0_0_1px_rgb(250_33_99/0.15)]">
      <h2 className="m-0 font-serif text-[clamp(24px,2.2vw,30px)] font-normal leading-[1.2] text-ink">{title}</h2>
      <ul className="m-0 mt-3 list-none p-0">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-4 border-t border-[#e7dfdc] py-4 first:border-t-0">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-wash text-accent-ink">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </span>
            <span className="pt-1 text-[16.5px] leading-[1.5] text-[#3b3440]">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Блок FAQ у два стовпці: заголовок і кнопка ліворуч, питання праворуч. */
export function FaqSplit({ children, consult, lang = 'ua', id = 'faq' }: { children: ReactNode; consult: string; lang?: string; id?: string }) {
  const t = v2text(lang).pp
  return (
    <section id={id} className="scroll-mt-[var(--hdr)] py-[clamp(56px,8vw,112px)]">
      <div className="shell inner grid gap-[clamp(24px,5vw,80px)] min-[900px]:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div>
          <h2 className="m-0 font-serif text-[clamp(36px,4.4vw,56px)] font-normal leading-[1.08] tracking-[-0.02em] text-ink">{t.faqTitle}</h2>
          <p className="m-0 mt-5 max-w-[38ch] text-[clamp(15.5px,1.2vw,17px)] leading-[1.6] text-slate">{t.faqText}</p>
          <ButtonLink href={consult} variant="ghost" className="mt-6">
            {t.ask}
          </ButtonLink>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  )
}

/** Тёмна смуга-заклик із фото колон (як «Не знайшли свою ситуацію?»). */
export function CtaBand({ title, text, action }: { title: ReactNode; text?: ReactNode; action: ReactNode }) {
  return (
    <section className="on-dark relative isolate overflow-clip bg-ink py-[clamp(56px,7vw,96px)] text-on-dark">
      <div aria-hidden="true" className="absolute inset-0 -z-[2] opacity-70" style={bg('hero-home', DARK_ART, 'right center')} />
      <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,#0b0710_0%,rgb(11_7_16/0.88)_50%,rgb(11_7_16/0.35))]" />
      <div className="shell inner grid items-center gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h2 className="m-0 max-w-[24ch] font-serif text-[clamp(30px,3.4vw,44px)] font-normal leading-[1.12] text-white [text-wrap:balance]">{title}</h2>
          {text && <p className="m-0 mt-4 max-w-[52ch] text-[16px] leading-[1.6] text-white/72">{text}</p>}
        </div>
        <div>{action}</div>
      </div>
    </section>
  )
}
