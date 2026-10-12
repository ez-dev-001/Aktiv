import type { Metadata } from 'next'
import { CvForm } from '@/components/career/CvForm'
import { VacancyList } from '@/components/career/VacancyList'
import { Faq, Kicker, SEC, SecHead } from '@/components/site/Blocks'
import { Icon } from '@/components/site/Icon'
import { PageHero } from '@/components/site/PageHero'
import { PageShell } from '@/components/site/PageShell'
import { Bold } from '@/components/ui/Bold'
import { ButtonLink } from '@/components/ui/Button'
import { getCareer, getContacts, getVacancies } from '@/lib/sanity/content'

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

export const metadata: Metadata = {
  title: 'Карʼєра',
  description:
    'Вакансії юридичної компанії «АКТИВ» у Києві: адвокати, юристи, помічники. Наставник, реальні справи, прозоре зростання доходу. Надішліть резюме.',
}

const plural = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? 'вакансія' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'вакансії' : 'вакансій'

export default async function CareerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const [career, vac, contacts] = await Promise.all([getCareer(lang), getVacancies(lang), getContacts(lang)])
  const c = career.data
  const vacancies = vac.data
  const n = vacancies.length
  const k = contacts.data

  return (
    <PageShell lang={lang} overDark form={false}>
      {/* Старий формат шапки (праворуч — скільки відкрито і дві кнопки),
          у стилі головної: картка на напівпрозорому тлі замість знака. */}
      <PageHero
        crumbs={[{ label: 'Головна', href: prefix || '/' }, { label: 'Карʼєра' }]}
        title={c.headTitle}
        accent={c.headTitleAccent}
        lede={<Bold text={c.headLede} onDark />}
        aside={
          <div className="grid gap-5 rounded-[22px] bg-white/[0.05] p-[clamp(22px,2.6vw,30px)] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]">
            <div className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-soft">Зараз відкрито</span>
              <span className="font-serif text-[clamp(26px,3vw,34px)] leading-[1.1] text-white">
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
      <section id="vacancies" className={`scroll-mt-[var(--hdr)] bg-paper-2 ${SEC}`}>
        <div className="shell inner">
          <SecHead
            eyebrow="Вакансії"
            title={n > 0 ? 'Кого шукаємо' : 'Відкритих вакансій'}
            accent={n > 0 ? 'зараз' : 'зараз немає'}
            lede={n > 0 ? 'Натисніть на вакансію — побачите вимоги, обовʼязки й умови.' : undefined}
            row
          />
          <VacancyList vacancies={vacancies} />
        </div>
      </section>

      {/* ── ПЕРЕВАГИ ── лише з даних */}
      {c.benefits.length > 0 && (
        <section id="benefits" className={SEC}>
          <div className="shell inner">
            <SecHead eyebrow="Переваги" title={c.benefitsTitle} />
            <ul className="m-0 grid list-none gap-3 p-0 min-[620px]:grid-cols-2 min-[1000px]:grid-cols-3">
              {c.benefits.map((b) => (
                <li key={b.title} className="rounded-[20px] bg-white px-6 py-[26px] shadow-[inset_0_0_0_1px_var(--color-hair)]">
                  {b.icon && (
                    <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-accent-wash text-accent-ink">
                      <Icon name={b.icon} className="size-[22px]" />
                    </span>
                  )}
                  <h3 className={`m-0 font-serif text-[22px] font-normal leading-[1.2] text-ink ${b.icon ? 'mt-[18px]' : ''}`}>{b.title}</h3>
                  {b.text && <p className="m-0 mt-2 text-[14.5px] leading-[1.6] text-slate">{b.text}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── ВІДБІР ── світлий, як було, картки з великим номером */}
      {c.steps.length > 0 && (
        <section id="process" className={`bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <SecHead eyebrow="Як проходить відбір" title="Від резюме" accent="до першого робочого дня" />
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
                    <span className="mt-auto pt-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-accent-ink">{s.duration}</span>
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
              <SecHead eyebrow="Питання" title="Що питають" accent="кандидати" className="!mb-0" />
              <p className="m-0 mt-5 max-w-[40ch] text-[15px] leading-relaxed text-slate">
                Не знайшли відповіді — напишіть на{' '}
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
      <section id="cv" className="on-dark scroll-mt-[var(--hdr)] bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
        <div className="shell inner grid grid-cols-1 items-start gap-[clamp(32px,4.5vw,64px)] min-[920px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <Kicker dark>Резюме</Kicker>
            <h2 className="m-0 mt-3.5 font-serif text-[clamp(26px,4.6vw,44px)] font-semibold leading-[1.1] text-white">{c.cvTitle}</h2>
            <p className="m-0 mt-4 max-w-[40ch] text-[15.5px] leading-[1.65] text-on-dark">{c.cvText}</p>

            <p className="m-0 mt-6 text-[14px] text-on-dark-2">
              Або на пошту:{' '}
              <a href={`mailto:${k.email}?subject=${encodeURIComponent('Резюме')}`} className="text-white underline underline-offset-2">
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
