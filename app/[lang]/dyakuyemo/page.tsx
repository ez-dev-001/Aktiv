import type { Metadata } from 'next'
import { Kicker, SEC } from '@/components/site/Blocks'
import { PageHero } from '@/components/site/PageHero'
import { PageShell } from '@/components/site/PageShell'
import { ThanksCard, ThanksSteps, ThanksTitle } from '@/components/site/ThanksReceipt'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
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

export default async function ThanksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const { data: contacts } = await getContacts(lang)

  return (
    <PageShell lang={lang} overDark form={false}>
      <PageHero
        mark={false}
        above={
          <div className="mb-3.5">
            {/* Галочка рисуется штрихом: круг, затем знак. Один раз,
                без повторов — это подтверждение, а не анимация ради анимации. */}
            <svg viewBox="0 0 56 56" className="thanks-check mb-[26px] block size-16 text-accent" aria-hidden="true">
              <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength={1} className="thanks-check-ring" />
              <path d="M17 29l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="thanks-check-mark" />
            </svg>
            <Kicker dark>Звернення прийнято</Kicker>
          </div>
        }
        title={<ThanksTitle />}
        lede={
          <>
            Юрист передзвонить із номера <b className="whitespace-nowrap">{contacts.phone}</b> — збережіть його, щоб не пропустити
            дзвінок.
          </>
        }
        aside={<ThanksCard hours={contacts.hours} />}
      />

      <section id="next" className={SEC}>
        <div className="shell inner">
          <Kicker>Що далі</Kicker>
          <ThanksSteps />

          <div className="mt-[clamp(28px,4vw,48px)] flex flex-wrap items-center justify-between gap-5 border-t-2 border-ink pt-[26px]">
            <div>
              <p className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-semibold leading-[1.3] text-ink">Не хочете чекати?</p>
              <p className="m-0 mt-1 text-[14.5px] text-slate">{contacts.hours}</p>
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

          <div className="mt-[22px] flex flex-wrap gap-x-8 gap-y-2">
            <ArrowLink href={prefix || '/'}>На головну</ArrowLink>
            <ArrowLink href={`${prefix}/blog`}>Поки чекаєте — блог</ArrowLink>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
