'use client'

import { useMemo, useState } from 'react'
import {
  categories as staticCategories,
  contacts as staticContacts,
  formatPrice,
  type Category,
} from '@/lib/content'
import type { Contacts } from '@/lib/sanity/content'
import { track, trackMessenger, trackPhone, newEventId } from '@/lib/analytics'
import { Button, Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { PracticeSelect, buildOptions } from '@/components/ui/PracticeSelect'

/**
 * Форма заявки.
 *
 * На старом сайте обе формы Contact Form 7 собирали только имя и телефон —
 * ни email, ни практики, ни сути дела. Для воронки этапа 4 этого мало:
 * без практики лида некому назначить, без email не отправить письменную вилку.
 *
 * Антиспам: honeypot (поле company_url вне видимой области) плюс
 * rate limit в server action по IP — этап 4.
 *
 * Пока запись идёт в консоль: server action появится вместе с Firestore.
 */

const FIELD =
  'w-full rounded-[10px] border-0 bg-white/[0.055] px-4 py-3.5 font-sans text-[15.5px] font-light text-white ' +
  'shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] transition-shadow duration-200 ' +
  'placeholder:text-on-dark-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none'

const LABEL = 'font-mono text-[9.5px] uppercase tracking-[0.13em] text-on-dark-2'

export function LeadSection({
  contacts = staticContacts,
  categories = staticCategories,
}: {
  contacts?: Contacts
  /** из Sanity, если практики там заведены; иначе статика */
  categories?: Category[]
}) {
  const [sent, setSent] = useState(false)
  const [touched, setTouched] = useState(false)
  const [practice, setPractice] = useState('unknown')

  /* Плоский указатель slug → направление и его категория.
     Нужен дважды: подписать выбор под полем и положить в лид
     человекочитаемое название вместо slug'а. */
  const index = useMemo(() => {
    const m = new Map<string, { title: string; category: Category; practice?: Category['practices'][number] }>()
    for (const c of categories) {
      m.set(`cat:${c.slug}`, { title: `${c.title} — напрям уточнимо`, category: c })
      for (const p of c.practices) m.set(p.slug, { title: p.title, category: c, practice: p })
    }
    return m
  }, [categories])

  /* Плоский список строк панели. Строится из того же дерева, что и
     index, — один источник, поэтому подпись под полем и строка в
     панели не могут разойтись. */
  const options = useMemo(() => buildOptions(categories), [categories])

  const chosen = index.get(practice)
  const chosenPrice = formatPrice(chosen?.practice?.price)

  function onFirstInput() {
    if (touched) return
    setTouched(true)
    track('form_start', { form_location: 'contact_section' })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (fd.get('company_url')) return /* honeypot: бот заполнил скрытое поле */

    const eventId = newEventId('f')
    /* В dataLayer и в лид уходит человекочитаемое название, а не slug:
       отчёт по практикам должен читаться без словаря. */
    const picked = index.get(String(fd.get('practice') ?? ''))
    const practiceName = picked?.title ?? 'Ще не знаю'
    track('form_submit', {
      form_location: 'contact_section',
      practice: practiceName,
      event_id: eventId,
      /* value подставится из квиза, когда он пройден — этап 5 */
      currency: 'UAH',
    })
    track('consultation_request', { practice: practiceName, event_id: eventId })

    // TODO(этап 4): server action → Admin SDK → Firestore + Telegram + Meta CAPI
    // eslint-disable-next-line no-console
    console.info('[lead]', Object.fromEntries(fd.entries()), { eventId })
    setSent(true)
  }

  return (
    <section id="contact" className="on-dark bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
      <div className="shell inner">
        <div className="grid items-start gap-[clamp(32px,4.5vw,64px)] min-[920px]:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Консультація</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1] !text-white">Розкажіть про справу</Reveal>
            <p className="lede mt-6 text-on-dark">
              Передзвонюємо в робочі години. На консультації одразу скажемо, чи бачимо шлях — це перше
              правило кредо.
            </p>

            <dl className="mt-[38px] grid gap-[22px]">
              <div className="grid gap-1">
                <dt className={LABEL}>Телефон</dt>
                <dd className="m-0 font-serif text-[19px] font-semibold leading-snug text-white">
                  <a href={contacts.phoneHref} onClick={() => trackPhone('contact_section')}>
                    {contacts.phone}
                  </a>
                  <span className="mt-1 block font-sans text-[13.5px] font-light text-on-dark">{contacts.hours}</span>
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className={LABEL}>Пошта</dt>
                <dd className="m-0 font-serif text-[19px] font-semibold text-white">
                  <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className={LABEL}>Офіс</dt>
                <dd className="m-0 font-serif text-[19px] font-semibold text-white">{contacts.address}</dd>
              </div>
              <div className="grid gap-1">
                <dt className={LABEL}>Месенджери</dt>
                <dd className="m-0 mt-1.5 flex flex-wrap gap-2">
                  {contacts.messengers.map((m) => (
                    <a
                      key={m.label}
                      href={m.href}
                      onClick={() => trackMessenger(m.label.toLowerCase() as 'viber' | 'telegram' | 'whatsapp', 'contact_section')}
                      className="rounded-full px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.09em] text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] transition-[color,box-shadow] hover:text-accent-soft hover:shadow-[inset_0_0_0_1px_var(--color-accent)]"
                    >
                      {m.label}
                    </a>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <form onSubmit={onSubmit} onInput={onFirstInput} noValidate className="grid gap-3.5">
            <div className="grid gap-3.5 min-[560px]:grid-cols-2">
              <div className="grid gap-[7px]">
                <label htmlFor="lead-name" className={LABEL}>
                  Ім&apos;я
                </label>
                <input id="lead-name" name="name" type="text" autoComplete="name" placeholder="Як до вас звертатися" className={FIELD} />
              </div>
              <div className="grid gap-[7px]">
                <label htmlFor="lead-phone" className={LABEL}>
                  Телефон
                </label>
                <input id="lead-phone" name="phone" type="tel" autoComplete="tel" placeholder="+38 (0__) ___-__-__" className={FIELD} required />
              </div>
            </div>
            <div className="grid gap-3.5 min-[560px]:grid-cols-2">
              <div className="grid gap-[7px]">
                <label htmlFor="lead-email" className={LABEL}>
                  Пошта
                </label>
                <input id="lead-email" name="email" type="email" autoComplete="email" placeholder="для письмової вилки вартості" className={FIELD} />
              </div>
              {/* ── выбор направления ──
                  Раньше здесь были только четыре категории, и человек,
                  который пришёл за «банкрутством фізичних осіб», не мог
                  назвать свою услугу — лид приходил с размытой темой.
                  Теперь доступны все направления, сгруппированные по
                  блокам, с поиском и с вилкой стоимости в самой строке.

                  Нативный select это не умел: системная панель не
                  стилизуется, цену в строку положить нельзя, поиска нет.
                  Почему собран свой listbox — подробно в PracticeSelect.

                  В каждой группе первой стоит строка «напрям уточнимо» —
                  для тех, кто знает блок, но не знает точной услуги. */}
              <div className="grid gap-[7px]">
                <span id="lead-practice-label" className={LABEL}>
                  Практика
                </span>
                <PracticeSelect
                  options={options}
                  value={practice}
                  onChange={setPractice}
                  labelledBy="lead-practice-label"
                />
              </div>
            </div>
            {/* Цена выбранного направления прямо под полем: человек
                видит порядок суммы до отправки, а не после звонка.
                Это третье правило кредо, применённое к форме. */}
            {chosen && (
              <p className="m-0 -mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] leading-snug text-on-dark">
                <span className="text-white">{chosen.title}</span>
                {chosenPrice ? (
                  <span className="font-mono text-accent-soft">{chosenPrice}</span>
                ) : (
                  <span className="text-on-dark-2">вартість — за результатами консультації</span>
                )}
                {chosen.practice && (
                  <a
                    href={`/practices/${chosen.category.slug}/${chosen.practice.slug}`}
                    className="text-accent-soft underline decoration-accent-soft/40 underline-offset-2 hover:decoration-accent-soft"
                  >
                    про послугу
                  </a>
                )}
              </p>
            )}

            <div className="grid gap-[7px]">
              <label htmlFor="lead-message" className={LABEL}>
                Суть справи
              </label>
              <textarea
                id="lead-message"
                name="message"
                rows={4}
                placeholder="Коротко: що сталося, на якій стадії, чого хочете досягти"
                className={`${FIELD} min-h-[92px] resize-y`}
              />
            </div>

            {/* honeypot */}
            <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
              <label htmlFor="lead-hp">Не заповнювати</label>
              <input id="lead-hp" name="company_url" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <Button type="submit" arrow className="mt-1.5 justify-self-start" disabled={sent}>
              {sent ? 'Заявку прийнято' : 'Надіслати'}
            </Button>

            <p className={`m-0 mt-1 max-w-[44ch] text-[12.5px] leading-relaxed ${sent ? 'text-accent-soft' : 'text-on-dark-2'}`}>
              {sent
                ? 'Прототип: заявка вывелась в консоль. Server action со записью в Firestore, уведомлением в Telegram и Meta CAPI — этап 4.'
                : 'Надсилаючи форму, ви погоджуєтесь на обробку даних для звʼязку у вашій справі.'}
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
