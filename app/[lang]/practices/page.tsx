import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { LOCALES, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { PageShell } from '@/components/site/PageShell'
import { HeroActions, PageHero } from '@/components/site/PageHero'
import { ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/site/Icon'
import { ArrowUR, DARK_ART, bg } from '@/components/v2/ui'
import { V2_PRACTICES } from '@/lib/v2/practices'
import { v2text } from '@/lib/v2/content'

/**
 * Усі послуги — індекс напрямів у новій редакції (макет клієнта):
 * світла шапка з колонами, вісім напрямів чотирма колонками —
 * малиновий квадрат біля назви, послуги рядками зі стрілкою →, далі
 * темна смуга «Не знайшли свою ситуацію?» і форма (у PageShell).
 */

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).practicesIndex
  return { ...pageMeta(lang, '/practices'), title: t.metaTitle, description: t.metaDescription }
}

export default async function PracticesIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const T = ui(lang)
  const t = v2text(lang).practices
  const to = (h: string) => localeHref(lang, h)

  return (
    <PageShell lang={lang}>
      <PageHero
        light
        crumbs={[{ label: T.common.home, href: to('/') }, { label: T.common.practices }]}
        lang={lang}
        title={t.title}
        accent={t.accent}
        lede={t.lede}
      >
        <HeroActions>
          <ButtonLink href="#contact" arrow className="min-h-[54px]">
            {T.common.bookConsultation}
          </ButtonLink>
        </HeroActions>
      </PageHero>

      <section id="list" className="bg-paper pb-[clamp(64px,9vw,120px)] pt-[clamp(24px,3vw,40px)]">
        <div className="shell inner">
          <ol className="v2-cols m-0 grid list-none border-t border-ink/[0.14] p-0 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
            {V2_PRACTICES.map((p, i) => (
              <li
                key={p.title}
                className="v2-rise border-b border-ink/[0.14] py-[clamp(28px,3vw,40px)]"
              >
                <h2 className="m-0 flex items-start gap-3 font-serif text-[clamp(21px,1.8vw,24px)] font-normal leading-[1.25] text-ink">
                  <span aria-hidden="true" className="mt-[9px] size-[9px] shrink-0 bg-accent" />
                  <a href={to(p.href)} className="transition-colors hover:text-accent-ink">
                    {p.title}
                  </a>
                </h2>
                <ul className="m-0 mt-4 list-none p-0">
                  {p.items.map((it) => {
                    const row = (
                      <>
                        <span>{it.title}</span>
                        <Icon name="arrow" className="mt-[3px] size-[14px] shrink-0 text-slate-2 transition-transform duration-200 group-hover/it:translate-x-1" />
                      </>
                    )
                    const cls =
                      'group/it flex items-start justify-between gap-3 border-b border-ink/[0.08] py-[11px] text-[15px] leading-[1.4] text-[#3b3440]'
                    return (
                      <li key={it.title}>
                        {it.href ? (
                          <a href={to(it.href)} className={`${cls} transition-colors hover:text-accent-ink`}>
                            {row}
                          </a>
                        ) : (
                          <a href={to(p.href)} className={`${cls} transition-colors hover:text-accent-ink`}>
                            {row}
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <a href={to(p.href)} className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-accent-ink">
                  {t.all}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── «Не знайшли свою ситуацію?» ── темна смуга перед формою */}
      <section className="on-dark relative isolate overflow-clip bg-ink py-[clamp(56px,7vw,96px)] text-on-dark">
        <div aria-hidden="true" data-par="" className="absolute -inset-y-[60px] inset-x-0 -z-[2] opacity-60" style={bg('hero-home', DARK_ART, 'right center')} />
        <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,#0b0710,rgb(11_7_16/0.75)_55%,rgb(11_7_16/0.3))]" />
        <div className="shell inner flex flex-wrap items-center justify-between gap-8">
          <div className="v2-rise max-w-[780px]">
            <h2 className="m-0 font-display text-[clamp(28px,3.2vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
              {t.ctaTitle}
              <br />
              <span>{t.ctaAccent}</span>
            </h2>
            <p className="m-0 mt-4 max-w-[48ch] text-[16px] leading-[1.6] text-on-dark">{t.ctaText}</p>
          </div>
          <ButtonLink href="#contact" arrow className="min-h-[56px]">
            {T.common.bookConsultation}
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  )
}
