import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { PageShell } from '@/components/site/PageShell'
import { DownLink, HeroActions, PageHero } from '@/components/site/PageHero'
import { ButtonLink } from '@/components/ui/Button'
import { TrustedBy } from '@/components/home/TrustedBy'
import { V2Values } from '@/components/v2/Home'
import { H2, Kick, LIGHT_ART, V2Icon, bg } from '@/components/v2/ui'
import { v2text } from '@/lib/v2/content'
import { ui } from '@/lib/ui'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).meta
  return {
    ...pageMeta(lang, '/about'),
    title: { absolute: t.aboutTitle },
    description: t.aboutDescription,
  }
}

/*
 * «Про компанію» — нова редакція (макет клієнта): темна шапка з фото →
 * «Наша місія» з чотирма опорами → «Цінність AKTIV» (світла) →
 * «Нам довіряють» → форма й адреса (у PageShell).
 *
 * Тексти — з документа клієнта (lib/v2/content.ts). Поля сторінки в
 * Sanity (місія/візія, принципи) лишаються, сторінка їх поки не читає.
 */
export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const home = lang === 'ua' ? '/' : `/${lang}`
  const teamHref = lang === 'ua' ? '/team' : `/${lang}/team`
  const t = ui(lang)
  const a = v2text(lang).about

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        img="about-hero"
        crumbs={[{ label: t.common.home, href: home }, { label: t.common.about }]}
        lang={lang}
        title={a.title}
        accent={a.accent}
        lede={a.lede}
      >
        <HeroActions>
          <ButtonLink
            href="#contact"
            arrow
            className="min-h-[54px] max-[640px]:w-full"
          >
            {a.cta}
          </ButtonLink>
          <DownLink href={teamHref}>{t.common.team}</DownLink>
        </HeroActions>
      </PageHero>

      {/* ── МІСІЯ ── світла, з кристалом праворуч і чотирма опорами */}
      <section id="mission" className="relative isolate overflow-clip bg-paper py-[clamp(64px,9vw,128px)]">
        <div
          aria-hidden="true"
          data-par=""
          className="absolute right-0 top-0 -z-[2] h-[min(560px,48vw)] w-[min(980px,64%)] [mask-image:linear-gradient(180deg,#000_55%,transparent)] max-[799px]:hidden"
          style={bg('light-crystal', LIGHT_ART, 'right center')}
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-[1] h-[min(560px,48vw)] bg-[linear-gradient(90deg,var(--color-paper)_0%,var(--color-paper)_38%,rgb(247_243_241/0.4)_70%,transparent)]" />
        <div className="shell inner">
          <div className="v2-rise max-w-[640px]">
            <H2 a={<>{a.missionTitle}<br /></>} b={a.missionAccent} className="mt-5 !text-[clamp(34px,4.4vw,62px)]" />
            <p className="m-0 mt-6 max-w-[54ch] text-[clamp(16px,1.3vw,18px)] leading-[1.65] text-[#4a4350]">{a.missionText}</p>
          </div>
          <ul className="m-0 mt-[clamp(40px,6vw,80px)] grid list-none gap-[clamp(14px,1.6vw,24px)] p-0 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4">
            {a.pillars.map((p) => (
              <li
                key={p.title}
                className="v2-rise group rounded-[22px] bg-white p-[clamp(24px,2.4vw,32px)] shadow-[0_24px_48px_-32px_rgb(80_10_40/0.35),inset_0_0_0_1px_rgb(250_33_99/0.14)] transition-shadow duration-300 hover:shadow-[0_30px_60px_-30px_rgb(80_10_40/0.45),inset_0_0_0_1.5px_rgb(250_33_99/0.45)]"
              >
                <span className="grid size-[58px] place-items-center rounded-[16px] bg-accent-wash text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  <V2Icon name={p.icon} className="size-7" />
                </span>
                <h3 className="m-0 mt-6 font-display text-[19px] font-bold text-ink">{p.title}</h3>
                <p className="m-0 mt-3 text-[15px] leading-[1.6] text-[#4a4350]">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <V2Values lang={lang} light />

      <div className="[&>section]:bg-paper">
        <TrustedBy lang={lang} />
      </div>
    </PageShell>
  )
}
