import type { Metadata } from 'next'
import { PageShell } from '@/components/site/PageShell'
import { ThanksCard, ThanksSteps, ThanksTitle } from '@/components/site/ThanksReceipt'
import { ArrowLink, ButtonLink, Eyebrow } from '@/components/ui/Button'
import { getContacts } from '@/lib/sanity/content'

/**
 * «Дякуємо» — страница после отправки заявки.
 *
 * ── Зачем отдельный адрес ──
 * Его и считают конверсией: в GTM, Google Ads и Meta цель «визит на
 * /dyakuyemo» настраивается одним правилом и не зависит от того, как
 * устроена форма. Счёт по «кнопка нажата» врёт — нажатие с ошибкой в
 * телефоне заявкой не является. Сюда форма переводит только после
 * того, как сервер заявку принял.
 *
 * ── Что на ней ──
 * Не «спасибо, ждите», а ответ на вопрос «что теперь»: когда позвонят,
 * с какого номера, что приготовить к разговору. И выход для тех, кто
 * не хочет ждать, — телефон и мессенджеры.
 *
 * Из поиска страница закрыта: в выдаче ей делать нечего, а случайный
 * визит из поиска испортил бы счёт конверсий.
 */

export const metadata: Metadata = {
  title: 'Дякуємо',
  robots: { index: false, follow: false },
}

const STATIONS = [
  { id: 'head', label: 'Звернення' },
  { id: 'next', label: 'Що далі' },
]

export default async function ThanksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const { data: contacts } = await getContacts(lang)

  return (
    <PageShell lang={lang} stations={STATIONS}>
      <section id="head" className="py-[clamp(44px,7vw,104px)]">
        <div className="shell inner grid items-start gap-[clamp(32px,5vw,72px)] min-[900px]:grid-cols-[1.2fr_0.8fr]">
          <div>
            {/* Галочка рисуется штрихом: круг, затем знак. Один раз,
                без повторов — это подтверждение, а не анимация ради анимации. */}
            <svg viewBox="0 0 56 56" className="thanks-check mb-7 size-14 text-accent" aria-hidden="true">
              <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength={1} className="thanks-check-ring" />
              <path d="M17 29l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="thanks-check-mark" />
            </svg>
            <Eyebrow>Звернення прийнято</Eyebrow>
            <h1 className="thanks-rise max-w-[16ch] text-[clamp(32px,6vw,60px)] leading-[1.04]">
              <ThanksTitle />
            </h1>
            <p className="lede thanks-rise mt-6 max-w-[48ch] text-slate [animation-delay:120ms]">
              Юрист передзвонить із номера <span className="whitespace-nowrap text-ink">{contacts.phone}</span> — збережіть його, щоб не
              пропустити дзвінок.
            </p>
          </div>
          <ThanksCard />
        </div>
      </section>

      <section id="next" className="bg-paper-2 py-[clamp(48px,7vw,96px)]">
        <div className="shell inner">
          <Eyebrow>Що далі</Eyebrow>
          <ThanksSteps />

          <div className="mt-[clamp(32px,4.5vw,56px)] flex flex-wrap items-center justify-between gap-6 border-t-2 border-ink pt-7">
            <div>
              <p className="m-0 font-serif text-[clamp(19px,2.6vw,24px)] font-semibold leading-snug text-ink">Не хочете чекати?</p>
              <p className="m-0 mt-1.5 text-[14.5px] text-slate">{contacts.hours}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <ButtonLink href={contacts.phoneHref} arrow>
                {contacts.phone}
              </ButtonLink>
              {contacts.messengers.map((m) => (
                <ButtonLink key={m.label} href={m.href} variant="ghost" size="sm">
                  {m.label}
                </ButtonLink>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href={prefix || '/'}>На головну</ArrowLink>
            <ArrowLink href={`${prefix}/blog`}>Поки чекаєте — блог</ArrowLink>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
