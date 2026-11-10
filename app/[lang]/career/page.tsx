import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { CvForm } from '@/components/career/CvForm'
import { VacancyList } from '@/components/career/VacancyList'
import { Faq, Kicker, SEC, SecHead } from '@/components/site/Blocks'
import { Icon } from '@/components/site/Icon'
import { PageHero } from '@/components/site/PageHero'
import { PageShell } from '@/components/site/PageShell'
import { Bold } from '@/components/ui/Bold'
import { ButtonLink } from '@/components/ui/Button'
import { getCareer, getContacts, getVacancies } from '@/lib/sanity/content'
import { localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { ArrowUR, DARK_ART, H2, Kick, V2Icon, bg } from '@/components/v2/ui'
import { v2text } from '@/lib/v2/content'

/**
 * «Карʼєра» — старий порядок і склад блоків, стиль головної (armada.law).
 *
 * Порядок блоков — порядок вопросов кандидата:
 *   1. Что за фирма и каких людей ищет (первый экран).
 *   2. Есть ли место для меня (вакансии — раскрываются по клику).
 *   3. Что я получу (переваги).
 *   4. Как проходит отбор и сколько ждать (етапи).
 *   5. Оставшиеся сомнения (питання).
 *   6. Отправить резюме (форма; сюда же ведёт «Відгукнутися»).
 *
 * Слово партнёра из макета не выводим: в Sanity его пока нет, а
 * придумывать цитату от имени партнёра нельзя.
 *
 * Формы консультации внизу нет (form={false}) — её место занимает
 * форма резюме.
 *
 * Текст — Sanity «Сторінка «Карʼєра»», вакансии — «Вакансії».
 */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).meta
  return {
    ...pageMeta(lang, '/career'),
    title: t.careerTitle,
    description: t.careerDescription,
  }
}

export default async function CareerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const T = ui(lang)
  const t = T.career
  const [career, vac, contacts] = await Promise.all([getCareer(lang), getVacancies(lang), getContacts(lang)])
  const c = career.data
  const vacancies = vac.data
  const n = vacancies.length
  const k = contacts.data
  const v = v2text(lang).career

  return (
    <PageShell lang={lang} overDark form={false}>
      {/* Шапка нової редакції: праворуч — «скляна» картка «Зараз відкрито N вакансії →». */}
      <PageHero
        img="career-hero"
        crumbs={[{ label: T.common.home, href: localeHref(lang, '/') }, { label: T.common.career }]}
        lang={lang}
        title={v.title}
        accent={v.accent}
        lede={v.lede}
        aside={
          <a
            href={n > 0 ? '#vacancies' : '#cv'}
            className="group flex items-center gap-5 rounded-[24px] bg-white/[0.07] p-[clamp(20px,2.2vw,26px)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] backdrop-blur-xl transition-colors hover:bg-white/[0.11]"
          >
            <span className="grid size-[58px] shrink-0 place-items-center rounded-[16px] bg-accent/[0.16] text-accent">
              <V2Icon name="brief" className="size-7" />
            </span>
            <span className="grid flex-1 gap-1">
              <span className=" text-[13px] text-on-dark">{v.openNow}</span>
              <span className="font-display text-[clamp(22px,2.2vw,28px)] font-extrabold leading-[1.1] text-white">
                {n > 0 ? t.vacancies(n) : t.acceptingCv}
              </span>
            </span>
            <Icon name="arrow" className="size-6 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        }
      >
        <ul className="m-0 mt-7 flex list-none flex-wrap gap-x-7 gap-y-3 p-0">
          {v.perks.map((p, i) => (
            <li key={p} className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white">
              <V2Icon name={['target', 'up', 'team'][i] ?? 'target'} className="size-[22px] text-accent" />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {n > 0 && (
            <ButtonLink href="#vacancies" arrow className="min-h-[54px]">
              {v.toVacancies}
            </ButtonLink>
          )}
          <ButtonLink href="#cv" variant="ghostDark" className="min-h-[54px] !shadow-[inset_0_0_0_1.5px_var(--color-accent)]">
            {v.sendCv}
          </ButtonLink>
        </div>
      </PageHero>

      {/* ── ВАКАНСІЇ ── */}
      <section id="vacancies" className={`scroll-mt-[var(--hdr)] bg-paper ${SEC}`}>
        <div className="shell inner">
          <div className="v2-rise mb-[clamp(30px,4vw,52px)] flex flex-wrap items-end justify-between gap-6">
            <div>
              <H2 a={n > 0 ? v.vacTitle : t.noneTitle + ' '} b={n > 0 ? v.vacAccent : t.noneAccent} className="mt-5" />
            </div>
            <p className="m-0 max-w-[40ch] text-[16px] leading-[1.6] text-slate">{v.vacLede}</p>
          </div>
          <VacancyList vacancies={vacancies} />
        </div>
      </section>

      {/* ── ЧОМУ AKTIV ── тексти з макета клієнта (lib/v2/content.ts) */}
      <section id="benefits" className="relative isolate overflow-clip bg-white py-[clamp(64px,9vw,120px)]">
        <div className="shell inner">
          <div className="v2-rise max-w-[720px]">
            <H2 a={<>{v.whyTitle.trim()}<br /></>} b={v.whyAccent} className="mt-5 !text-[clamp(32px,4vw,56px)]" />
            <p className="m-0 mt-5 max-w-[52ch] text-[17px] leading-[1.6] text-slate">{v.whyLede}</p>
          </div>
          <ul className="m-0 mt-[clamp(36px,5vw,64px)] grid list-none gap-[clamp(14px,1.6vw,24px)] p-0 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4">
            {v.why.map((b) => (
              <li key={b.title} className="v2-rise group rounded-[22px] bg-paper p-[clamp(24px,2.4vw,30px)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_1.5px_rgb(250_33_99/0.45)]">
                <span className="grid size-[54px] place-items-center rounded-[16px] bg-white text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  <V2Icon name={b.icon} className="size-[26px]" />
                </span>
                <h3 className="m-0 mt-6 font-display text-[19px] font-bold text-ink">{b.title}</h3>
                <p className="m-0 mt-2.5 text-[15px] leading-[1.6] text-[#4a4350]">{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── ВІДБІР ── світлий, як було, картки з великим номером */}
      {c.steps.length > 0 && (
        <section id="process" className={`bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <SecHead eyebrow={t.processEyebrow} title={t.processTitle} accent={t.processAccent} />
            <ol className="m-0 grid list-none gap-3 p-0 min-[700px]:grid-cols-2 min-[1060px]:grid-cols-4">
              {c.steps.map((s, i) => (
                <li
                  key={s.title}
                  className="flex flex-col items-start rounded-[20px] bg-white px-[22px] pb-[26px] pt-6 shadow-[inset_0_0_0_1px_var(--color-hair)]"
                >
                  <span aria-hidden="true" className="font-serif text-[44px] leading-none text-accent-ink">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="m-0 mt-4 font-serif text-[19px] font-semibold leading-[1.25] text-ink">{s.title}</h3>
                  {s.text && <p className="m-0 mt-2 text-[14.5px] leading-[1.6] text-slate">{s.text}</p>}
                  {s.duration && (
                    <span className="mt-auto pt-3.5 text-[13px] text-accent-ink">{s.duration}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── ПИТАННЯ ── */}
      {c.faq.length > 0 && (
        <section id="faq" className={SEC}>
          <div className="shell inner grid gap-[clamp(24px,4vw,64px)] min-[900px]:grid-cols-[0.75fr_1.25fr]">
            <div>
              <SecHead eyebrow={T.common.questions} title={t.faqTitle} accent={t.faqAccent} className="!mb-0" />
              <p className="m-0 mt-5 max-w-[40ch] text-[15px] leading-relaxed text-slate">
                {t.faqNoAnswer}{' '}
                <a href={`mailto:${k.email}`} className="whitespace-nowrap text-accent-ink underline underline-offset-2">
                  {k.email}
                </a>
                .
              </p>
            </div>
            <Faq items={c.faq.map((f) => ({ q: f.q, a: f.a }))} />
          </div>
        </section>
      )}

      {/* ── РЕЗЮМЕ ── той самий вигляд, що форма консультації на головній */}
      <section id="cv" className="on-dark relative isolate scroll-mt-[var(--hdr)] overflow-clip bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
        <div aria-hidden="true" data-par="" className="absolute -inset-y-[60px] inset-x-0 -z-[2] opacity-45" style={bg('hero-home', DARK_ART, 'left center')} />
        <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[linear-gradient(90deg,rgb(11_7_16/0.7),rgb(11_7_16/0.92)_55%,#0b0710)]" />
        <div className="shell inner grid grid-cols-1 items-start gap-[clamp(32px,4.5vw,64px)] min-[920px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <h2 className="m-0 mt-5 font-display text-[clamp(34px,4.6vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em] text-white">
              {v.sendCv.split(' ')[0]}
              <br />
              <span>{v.sendCv.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="m-0 mt-4 max-w-[40ch] text-[15.5px] leading-[1.65] text-on-dark">{c.cvText}</p>

            <ul className="m-0 mt-8 grid list-none gap-4 p-0">
              {v.cvPoints.map((x, i) => (
                <li key={x} className="flex items-center gap-3.5 text-[16px] font-semibold text-white">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-accent/[0.14] text-accent">
                    <V2Icon name={['lock', 'chat', 'clock'][i] ?? 'lock'} className="size-[20px]" />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
            <p className="m-0 mt-8 text-[14px] text-on-dark-2">
              {t.orEmail}{' '}
              <a href={`mailto:${k.email}?subject=${encodeURIComponent(t.emailSubject)}`} className="text-white underline underline-offset-2">
                {k.email}
              </a>
            </p>
          </div>
          <CvForm positions={vacancies.map((v) => v.title)} />
        </div>
      </section>
    </PageShell>
  )
}
