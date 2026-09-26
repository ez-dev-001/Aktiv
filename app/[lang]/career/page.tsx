import type { Metadata } from 'next'
import { CvForm } from '@/components/career/CvForm'
import { VacancyList } from '@/components/career/VacancyList'
import { Icon } from '@/components/site/Icon'
import { PageHead, PageShell, SectionHead } from '@/components/site/PageShell'
import { Bold } from '@/components/ui/Bold'
import { ButtonLink, Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { teamPhoto } from '@/lib/sanity/content'
import { getCareer, getContacts, getVacancies } from '@/lib/sanity/content'

/**
 * «Карʼєра» — по мотивам armada.law/career, в нашей форме.
 *
 * Порядок блоков — порядок вопросов кандидата:
 *   1. Что за фирма и каких людей ищет (первый экран).
 *   2. Есть ли место для меня (вакансии — раскрываются по клику).
 *   3. Что я получу (переваги).
 *   4. Что сказал бы партнер (цитата — только если заполнена в Sanity).
 *   5. Как проходит отбор и сколько ждать (етапи).
 *   6. Оставшиеся сомнения (питання).
 *   7. Отправить резюме (форма; сюда же ведёт «Відгукнутися»).
 *
 * Текст — Sanity «Сторінка «Карʼєра»», вакансии — «Вакансії».
 */

export const metadata: Metadata = {
  title: 'Карʼєра',
  description:
    'Вакансії юридичної компанії «АКТИВ» у Києві: адвокати, юристи, помічники. Наставник, реальні справи, прозоре зростання доходу. Надішліть резюме.',
}

const STATIONS = [
  { id: 'head', label: 'Карʼєра' },
  { id: 'vacancies', label: 'Вакансії' },
  { id: 'benefits', label: 'Переваги' },
  { id: 'process', label: 'Відбір' },
  { id: 'faq', label: 'Питання' },
  { id: 'cv', label: 'Резюме' },
]

const plural = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? 'вакансія' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'вакансії' : 'вакансій'

export default async function CareerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const [career, vac, contacts] = await Promise.all([getCareer(lang), getVacancies(lang), getContacts(lang)])
  const c = career.data
  const vacancies = vac.data
  const n = vacancies.length

  return (
    <PageShell lang={lang} stations={STATIONS} overDark>
      <PageHead
        photo="meeting"
        eyebrow={c.headEyebrow}
        title={
          <>
            {c.headTitle} <span className="font-normal italic text-accent-soft">{c.headTitleAccent}</span>
          </>
        }
        lede={<Bold text={c.headLede} onDark />}
        aside={
          <div className="grid gap-4 border-t-2 border-white/70 pt-[22px]">
            <div className="grid gap-[3px]">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/55">Зараз відкрито</span>
              <span className="font-serif text-[clamp(22px,3vw,30px)] font-semibold leading-tight text-accent-soft">
                {n > 0 ? `${n} ${plural(n)}` : 'Приймаємо резюме'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href="#cv" arrow>
                Надіслати резюме
              </ButtonLink>
              {n > 0 && (
                <ButtonLink href="#vacancies" variant="ghostDark">
                  Вакансії
                </ButtonLink>
              )}
            </div>
          </div>
        }
      />

      {/* ── ВАКАНСІЇ ── */}
      <section id="vacancies" className="bg-paper-2 py-[clamp(52px,7vw,104px)]">
        <div className="shell inner">
          <SectionHead
            eyebrow="Вакансії"
            title={n > 0 ? 'Кого шукаємо зараз' : 'Відкритих вакансій зараз немає'}
            lede={n > 0 ? 'Натисніть на вакансію — побачите вимоги, обовʼязки й умови.' : undefined}
          />
          <VacancyList vacancies={vacancies} />
        </div>
      </section>

      {/* ── ПЕРЕВАГИ ── */}
      <section id="benefits" className="py-[clamp(52px,7vw,104px)]">
        <div className="shell inner">
          <SectionHead eyebrow="Переваги" title={c.benefitsTitle} />
          <ul className="m-0 grid list-none gap-[clamp(10px,1.4vw,16px)] p-0 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3">
            {c.benefits.map((b) => (
              <li key={b.title} className="flex flex-col gap-3 rounded-[16px] bg-white p-[clamp(20px,2.6vw,28px)] shadow-[inset_0_0_0_1px_var(--color-hair)]">
                {b.icon && <Icon name={b.icon} className="size-8 text-accent" />}
                <h3 className="m-0 text-[clamp(17px,2vw,20px)] leading-snug">{b.title}</h3>
                {b.text && <p className="m-0 text-[14.5px] leading-relaxed text-slate">{b.text}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── СЛОВО ПАРТНЕРА ── только из Sanity, см. getCareer */}
      {c.quote && (
        <section className="on-dark bg-ink py-[clamp(52px,7vw,96px)] text-on-dark">
          <div className="shell inner grid items-center gap-[clamp(24px,4vw,56px)] min-[800px]:grid-cols-[auto_1fr]">
            {teamPhoto(c.quote.photoUrl, 400) ? (
              <div className="size-[clamp(96px,13vw,140px)] overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamPhoto(c.quote.photoUrl, 400)} alt={c.quote.name} className="size-full object-cover" />
              </div>
            ) : (
              <div aria-hidden="true" className="font-serif text-[120px] leading-none text-accent">
                “
              </div>
            )}
            <figure className="m-0">
              <blockquote className="m-0 max-w-[40ch] font-serif text-[clamp(21px,3vw,30px)] leading-[1.3] text-white">
                {c.quote.text}
              </blockquote>
              <figcaption className="mt-5 text-[14px] text-on-dark">
                <span className="text-white">{c.quote.name}</span>
                {c.quote.role && <> · {c.quote.role}</>}
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      {/* ── ВІДБІР ── */}
      <section id="process" className="bg-paper-2 py-[clamp(52px,7vw,104px)]">
        <div className="shell inner">
          <SectionHead eyebrow="Як проходить відбір" title="Від резюме до першого робочого дня" />
          <ol className="m-0 grid list-none gap-[clamp(10px,1.4vw,16px)] p-0 min-[700px]:grid-cols-2 min-[1060px]:grid-cols-4">
            {c.steps.map((s, i) => (
              <li key={s.title} className="relative flex flex-col gap-2.5 rounded-[16px] bg-white p-[clamp(20px,2.6vw,26px)] shadow-[inset_0_0_0_1px_var(--color-hair)]">
                <span className="font-serif text-[34px] font-semibold leading-none text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="m-0 mt-1 text-[18px] leading-snug">{s.title}</h3>
                {s.text && <p className="m-0 text-[14.5px] leading-relaxed text-slate">{s.text}</p>}
                {s.duration && (
                  <p className="m-0 mt-auto pt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-accent-ink">{s.duration}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ПИТАННЯ ── */}
      <section id="faq" className="py-[clamp(52px,7vw,104px)]">
        <div className="shell inner grid gap-[clamp(24px,4vw,64px)] min-[960px]:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Питання</Eyebrow>
            <Reveal className="text-[clamp(24px,4.2vw,40px)] leading-[1.1]">Що питають кандидати</Reveal>
            <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-slate">
              Не знайшли відповіді — напишіть на{' '}
              <a href={`mailto:${contacts.data.email}`} className="text-accent-ink underline underline-offset-2">
                {contacts.data.email}
              </a>
              .
            </p>
          </div>
          <div className="border-t border-hair">
            {c.faq.map((f) => (
              <details key={f.q} className="group border-b border-hair">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16.5px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Icon name="caret" className="size-3 shrink-0 text-accent transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="m-0 max-w-[62ch] pb-5 text-[15px] leading-relaxed text-slate">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── РЕЗЮМЕ ── */}
      <section id="cv" className="on-dark bg-ink py-[clamp(64px,9vw,120px)] text-on-dark">
        <div className="shell inner grid items-start gap-[clamp(32px,4.5vw,64px)] min-[920px]:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Резюме</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1] !text-white">{c.cvTitle}</Reveal>
            <p className="lede mt-6 text-on-dark">{c.cvText}</p>
            <p className="mt-6 text-[14px] text-on-dark-2">
              Або на пошту:{' '}
              <a href={`mailto:${contacts.data.email}?subject=${encodeURIComponent('Резюме')}`} className="text-white underline underline-offset-2">
                {contacts.data.email}
              </a>
            </p>
          </div>
          <CvForm positions={vacancies.map((v) => v.title)} />
        </div>
      </section>
    </PageShell>
  )
}
