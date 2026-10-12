import type { Metadata } from 'next'
import { Icon } from '@/components/site/Icon'
import { PageShell } from '@/components/site/PageShell'
import { DownLink, HeroActions, PageHero } from '@/components/site/PageHero'
import { Kicker, NumRows, SEC, SecHead } from '@/components/site/Blocks'
import { ButtonLink } from '@/components/ui/Button'
import { Bold } from '@/components/ui/Bold'
import { getAboutContent } from '@/lib/sanity/content'
import { TrustedBy } from '@/components/home/TrustedBy'

export const metadata: Metadata = {
  title: 'Про компанію',
  description:
    'Юридична компанія «АКТИВ»: місія, візія, цінності та принципи роботи. Київ, з 2007 року. 10 адвокатів і приватний виконавець у команді.',
}

/*
 * «Про компанію» у форматі головної (затверджений макет):
 * шапка зі знаком → місія/візія двома половинами → цінності →
 * принципи на темному → «Нам довіряють» → форма (у PageShell).
 *
 * Факти в шапці, смуга цифр, «Як це перевірити» і власний CTA-банер
 * прибрані на прохання клієнта: цифри дублюють головну, а банер —
 * форму нижче. Поля в Sanity лишаються (headFacts, bridge*, cta*) —
 * сторінка їх просто не читає.
 */
export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если документ заведён; иначе статика — поле за полем,
     см. getAboutContent. */
  const { data: a } = await getAboutContent(lang)
  const home = lang === 'ua' ? '/' : `/${lang}`
  const teamHref = lang === 'ua' ? '/team' : `/${lang}/team`

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        crumbs={[{ label: 'Головна', href: home }, { label: 'Про компанію' }]}
        title={a.headTitle}
        accent={a.headTitleAccent}
        lede={<Bold text={a.headLede} onDark />}
      >
        <HeroActions>
          <ButtonLink
            href="#contact"
            arrow
            className="min-h-[54px] shadow-[0_14px_34px_-14px_rgb(224_16_85/0.7)] max-[640px]:w-full"
          >
            Отримати консультацію
          </ButtonLink>
          <DownLink href={teamHref}>Команда</DownLink>
        </HeroActions>
      </PageHero>

      {/* ── МІСІЯ І ВІЗІЯ ──
          Дві половини на всю ширину: місія світла, візія темна. Темна
          місія одразу під темною шапкою зливалася з нею в одну пляму. */}
      <section id="mission" aria-label="Місія і візія" className="grid min-[900px]:grid-cols-2">
        {[
          { block: a.mission, dark: false },
          { block: a.vision, dark: true },
        ].map(({ block, dark }) => (
          <div
            key={block.eyebrow}
            className={`px-[var(--gut)] py-[clamp(48px,7vw,104px)] ${dark ? 'on-dark bg-ink text-on-dark' : 'bg-paper-2'}`}
          >
            {/* ліва половина притиснута до правого краю — текст стоїть
                на тій самій вертикалі, що й контент сторінки */}
            <div className={`max-w-[520px] ${dark ? '' : 'min-[900px]:ml-auto'}`}>
              <Kicker dark={dark}>{block.eyebrow}</Kicker>
              <p
                className={`m-0 mt-[18px] font-serif text-[clamp(26px,3.2vw,38px)] font-normal leading-[1.18] tracking-[-0.01em] ${
                  dark ? 'text-white' : 'text-ink'
                }`}
              >
                {block.statement}
              </p>
              <p className={`m-0 mt-[18px] max-w-[48ch] text-[15.5px] leading-[1.65] ${dark ? 'text-on-dark' : 'text-slate'}`}>
                {block.text}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── ЦІННОСТІ ── */}
      <section id="values" className={SEC}>
        <div className="shell inner">
          <SecHead eyebrow={a.valuesEyebrow} title={a.valuesTitle} lede={a.valuesLede} row />
          <div className="grid gap-3 min-[680px]:grid-cols-2">
            {a.values.map((v) => (
              <div
                key={v.title}
                className="flex flex-col gap-3.5 rounded-[20px] bg-white p-[clamp(24px,3vw,36px)] shadow-[inset_0_0_0_1px_var(--color-hair)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
              >
                {v.icon && <Icon name={v.icon} className="mb-1 size-[34px] text-accent" />}
                <h3 className="m-0 font-serif text-[clamp(22px,2.3vw,26px)] font-normal leading-[1.2] text-ink">{v.title}</h3>
                <p className="m-0 text-[14.5px] leading-[1.6] text-slate">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПРИНЦИПИ ── */}
      <section id="principles" className={`on-dark bg-ink text-on-dark ${SEC}`}>
        <div className="shell inner">
          <SecHead dark row eyebrow={a.principlesEyebrow} title={a.principlesTitle} lede={a.principlesLede} />
          <NumRows dark items={a.principles.map((p) => ({ title: p.title, text: p.text }))} />
        </div>
      </section>

      {/* «Нам довіряють» — на paper-2, як у макеті. Сам блок має bg-paper
          (так на головній), тож фон перекриваємо обгорткою, не чіпаючи
          спільний компонент. */}
      <div className="[&>section]:bg-paper-2">
        <TrustedBy lang={lang} />
      </div>
    </PageShell>
  )
}
