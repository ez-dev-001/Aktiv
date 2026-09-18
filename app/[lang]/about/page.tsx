import type { Metadata } from 'next'
import { Icon } from '@/components/site/Icon'
import { PageHead, PageShell, SectionHead } from '@/components/site/PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { Bold } from '@/components/ui/Bold'
import { Figures, TrustBridge } from '@/components/home/Sections'
import { getAboutContent, getFigures } from '@/lib/sanity/content'
import { TrustedBy } from '@/components/home/TrustedBy'

export const metadata: Metadata = {
  title: 'Про компанію',
  description:
    'Юридична компанія «АКТИВ»: місія, візія, цінності та принципи роботи. Київ, з 2007 року. 10 адвокатів і приватний виконавець у команді.',
}

const STATIONS = [
  { id: 'head', label: 'Про нас' },
  { id: 'mission', label: 'Місія' },
  { id: 'values', label: 'Цінності' },
  { id: 'principles', label: 'Принципи' },
  { id: 'trust', label: 'Довіра' },
  { id: 'contact', label: 'Консультація' },
]

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если документ заведён; иначе статика — поле за полем,
     см. getAboutContent. Цифры и блок довіри общие, из настроек. */
  const [nums, about] = await Promise.all([getFigures(lang), getAboutContent(lang)])
  const a = about.data

  return (
    <PageShell lang={lang} stations={STATIONS} overDark>
      <PageHead
        photo="boardroom"
        eyebrow={a.headEyebrow}
        title={
          <>
            {a.headTitle}{' '}
            <span className="font-normal italic text-accent-soft">{a.headTitleAccent}</span>
          </>
        }
        lede={<Bold text={a.headLede} onDark />}
        aside={
          <dl className="grid gap-[18px] border-t-2 border-white/70 pt-[22px]">
            {a.headFacts.map((x) => (
              <div key={x.kicker} className="grid gap-[3px]">
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/55">{x.kicker}</dt>
                <dd className="m-0 font-serif text-[19px] font-semibold leading-tight text-white">
                  {x.value}
                  {x.note && (
                    <span className="mt-1 block font-sans text-[13px] font-light tracking-normal text-white/70">
                      {x.note}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        }
      />

      <Figures figures={nums.data} />

      {/* ── МІСІЯ І ВІЗІЯ ── */}
      <section id="mission" className="py-[clamp(56px,8vw,112px)]">
        <div className="shell inner">
          <div className="grid gap-[clamp(40px,6vw,88px)] min-[900px]:grid-cols-2">
            {[a.mission, a.vision].map((block) => (
              <div key={block.eyebrow}>
                <p className="eyebrow">{block.eyebrow}</p>
                <p className="m-0 font-serif text-[clamp(21px,2.9vw,30px)] font-normal leading-[1.22] tracking-[-0.02em] text-ink">
                  {block.statement}
                </p>
                <p className="mt-5 max-w-[46ch] text-[15.5px] leading-relaxed text-slate">{block.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ЦІННОСТІ ── */}
      <section id="values" className="bg-paper-2 py-[clamp(56px,8vw,112px)]">
        <div className="shell inner">
          <SectionHead eyebrow={a.valuesEyebrow} title={a.valuesTitle} lede={a.valuesLede} />
          <div className="grid gap-px border border-hair bg-hair min-[680px]:grid-cols-2">
            {a.values.map((v) => (
              <div key={v.title} className="flex flex-col gap-3.5 bg-white p-[clamp(22px,3vw,34px)]">
                {v.icon && <Icon name={v.icon} className="size-8 text-accent" />}
                <h3 className="text-[clamp(18px,2.3vw,23px)] leading-snug">{v.title}</h3>
                <p className="m-0 max-w-[44ch] text-[15px] leading-relaxed text-slate">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПРИНЦИПИ ── */}
      <section id="principles" className="on-dark bg-ink py-[clamp(56px,8vw,112px)] text-on-dark">
        <div className="shell inner">
          <SectionHead dark eyebrow={a.principlesEyebrow} title={a.principlesTitle} lede={a.principlesLede} />
          <div className="grid">
            {a.principles.map((p, i) => (
              <div
                key={p.title}
                className={`grid items-start gap-x-3 gap-y-2.5 border-t border-on-dark-hair py-[clamp(24px,3.4vw,38px)] grid-cols-[38px_minmax(0,1fr)] sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-x-[clamp(14px,2.5vw,34px)] min-[860px]:grid-cols-[52px_minmax(0,1fr)_minmax(0,1.15fr)] min-[860px]:gap-y-0 ${
                  i === a.principles.length - 1 ? 'border-b' : ''
                }`}
              >
                <span className="pt-[0.5em] font-mono text-[11px] tracking-[0.1em] text-accent-soft">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="col-start-2 max-w-[22ch] text-[clamp(19px,2.6vw,27px)] leading-[1.18] !text-white">
                  {p.title}
                </h3>
                <p className="col-start-2 m-0 max-w-[48ch] text-[15px] leading-relaxed text-on-dark min-[860px]:col-start-3 min-[860px]:row-start-1">
                  {p.text}
                </p>
              </div>
            ))}
          </div>

          <TrustBridge kicker={a.bridgeKicker} text={a.bridgeText} link={a.bridgeLink} />
        </div>
      </section>

      <TrustedBy lang={lang} />

      {/* ── CTA ── */}
      <section id="contact" className="py-[clamp(56px,8vw,104px)]">
        <div className="shell inner">
          <div className="flex flex-wrap items-end justify-between gap-8 border-t-2 border-ink pt-8">
            <div>
              <h2 className="max-w-[20ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14]">
                {a.ctaTitle}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[15px] text-slate">{a.ctaText}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href={lang === 'ua' ? '/#contact' : `/${lang}/#contact`} arrow>
                {a.ctaPrimary}
              </ButtonLink>
              <ButtonLink href={lang === 'ua' ? '/team' : `/${lang}/team`} variant="ghost">
                {a.ctaSecondary}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
