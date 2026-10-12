'use client'

import { CHOOSE_PRACTICE_EVENT } from './DirectionPicker'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  categories as staticCategories,
  contacts as staticContacts,
  type Category,
} from '@/lib/content'
import type { Contacts } from '@/lib/sanity/content'
import { track, trackMessenger, trackPhone, newEventId } from '@/lib/analytics'
import { Button, Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/site/Icon'
import { OfficeMapCard } from '@/components/site/OfficeMapCard'
import { PracticeSelect, buildOptions } from '@/components/ui/PracticeSelect'
import { submitLead } from '@/app/actions/lead'
import { captureAttribution, readAttribution, saveReceipt } from '@/lib/leads/client'
import type { FieldErrors } from '@/lib/leads/types'
import { validateLead } from '@/lib/leads/validate'
import { localeHref } from '@/lib/i18n'
import { useLang } from '@/components/site/LangProvider'
import { ui } from '@/lib/ui'

/**
 * Форма заявки.
 *
 * На старом сайте обе формы Contact Form 7 собирали только имя и телефон —
 * ни email, ни практики, ни сути дела. Для воронки этапа 4 этого мало:
 * без практики лида некому назначить, без email не отправить письменную вилку.
 *
 * Антиспам: honeypot (поле company_url вне видимой области) плюс
 * ограничение частоты по IP в server action.
 *
 * ── Путь заявки ──
 * submitLead (app/actions/lead.ts) проверяет поля и пишет заявку в CRM
 * (lib/leads/store.ts — пока демо в памяти) и в Telegram. При успехе —
 * переход на страницу
 * «Дякуємо»: у неё свой адрес, и именно его GTM и реклама считают
 * конверсией. Счёт по «кнопка нажата» врёт: нажатие с ошибкой в
 * телефоне конверсией не является.
 *
 * ── Что форма знает сама ──
 *  • направление и вариант услуги — из ?practice= и ?package= в адресе:
 *    так ведут кнопки «Отримати консультацію» и «Обрати цей варіант»
 *    со страниц практик;
 *  • источник визита — UTM и страница входа (lib/leads/client.ts).
 */

const FIELD =
  'w-full rounded-[10px] border-0 bg-white/[0.055] px-4 py-3.5 font-sans text-[15.5px] font-light text-white ' +
  'shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] transition-shadow duration-200 ' +
  'placeholder:text-on-dark-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none ' +
  'aria-[invalid=true]:shadow-[inset_0_0_0_1.5px_var(--color-accent-soft)]'

const LABEL = 'font-mono text-[9.5px] uppercase tracking-[0.13em] text-on-dark-2'

export function LeadSection({
  contacts = staticContacts,
  categories = staticCategories,
}: {
  contacts?: Contacts
  /** из Sanity, если практики там заведены; иначе статика */
  categories?: Category[]
}) {
  const [touched, setTouched] = useState(false)
  const [practice, setPractice] = useState('unknown')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [pkg, setPkg] = useState<string | null>(null)
  const fieldA11y = fieldA11yFor(errors)
  const lang = useLang()
  const t = ui(lang)

  /* Плоский указатель slug → направление и его категория.
     Нужен дважды: подписать выбор под полем и положить в лид
     человекочитаемое название вместо slug'а. */
  const index = useMemo(() => {
    const m = new Map<string, { title: string; category: Category; practice?: Category['practices'][number] }>()
    for (const c of categories) {
      m.set(`cat:${c.slug}`, { title: t.lead.tbdTitle(c.title), category: c })
      for (const p of c.practices) m.set(p.slug, { title: p.title, category: c, practice: p })
    }
    return m
  }, [categories, t])

  /* Плоский список строк панели. Строится из того же дерева, что и
     index, — один источник, поэтому подпись под полем и строка в
     панели не могут разойтись. */
  const options = useMemo(() => buildOptions(categories, lang), [categories, lang])

  const chosen = index.get(practice)

  /* Направление и вариант услуги из адреса: так ведут кнопки
     «Отримати консультацію» и «Обрати цей варіант» со страниц практик.
     Читаются после монтирования: на сервере адресной строки нет. */
  useEffect(() => {
    captureAttribution()
    const qs = new URLSearchParams(window.location.search)
    const fromUrl = qs.get('practice')
    const pkgFromUrl = qs.get('package')?.slice(0, 80) || null
    if (pkgFromUrl) setPkg(pkgFromUrl)
    if (fromUrl && index.has(fromUrl)) setPractice(fromUrl)
  }, [index])

  /* «Консультація з цього напряму» в блоці практик: напрям приходить
     подією, без перезавантаження сторінки. */
  useEffect(() => {
    const onChoose = (e: Event) => {
      const v = String((e as CustomEvent).detail ?? '')
      if (index.has(v)) setPractice(v)
    }
    window.addEventListener(CHOOSE_PRACTICE_EVENT, onChoose)
    return () => window.removeEventListener(CHOOSE_PRACTICE_EVENT, onChoose)
  }, [index])

  function onFirstInput() {
    if (touched) return
    setTouched(true)
    track('form_start', { form_location: 'contact_section' })
  }

  /* Ошибка поля гаснет, как только его начали править: висящее красное
     под полем, которое уже исправлено, раздражает сильнее самой ошибки. */
  function clearError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending || done) return
    const form = e.currentTarget
    const fd = new FormData(form)

    /* Та же проверка, что на сервере, — чтобы не гонять запрос ради
       пустого телефона. Решение всё равно принимает сервер. */
    const { errors: local } = validateLead(
      {
        name: String(fd.get('name') ?? ''),
        phone: String(fd.get('phone') ?? ''),
        email: String(fd.get('email') ?? ''),
        message: String(fd.get('message') ?? ''),
      },
      lang,
    )
    if (Object.keys(local).length) {
      setErrors(local)
      const first = Object.keys(local)[0]
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    const eventId = newEventId('f')
    fd.set('event_id', eventId)
    if (pkg) fd.set('package', pkg)
    fd.set('page', window.location.pathname)
    fd.set('attribution', JSON.stringify(readAttribution()))
    /* мова — для текстів помилок із сервера і назви напряму в квитанції */
    fd.set('lang', lang)

    setFormError(null)
    start(async () => {
      let res
      try {
        res = await submitLead(fd)
      } catch {
        res = { ok: false as const, message: t.lead.offline }
      }
      if (!res.ok) {
        setErrors(res.errors ?? {})
        setFormError(res.message ?? null)
        return
      }

      /* В dataLayer — человекочитаемое название, а не slug: отчёт по
         практикам должен читаться без словаря. Событие — после ответа
         сервера: заявка, которую он отклонил, конверсией не считается. */
      const picked = index.get(String(fd.get('practice') ?? ''))
      const practiceName = picked?.title ?? 'Ще не знаю'
      track('form_submit', { form_location: 'contact_section', practice: practiceName, event_id: eventId })
      track('consultation_request', { practice: practiceName, event_id: eventId })

      saveReceipt(res.receipt)
      setDone(true)
      window.location.assign(localeHref(lang, '/dyakuyemo'))
    })
  }

  return (
    <section id="contact" className="on-dark bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
      <div className="shell inner">
        {/* grid-cols-1 = minmax(0,1fr), а не auto: иначе длинное название
            направления в поле (обрезанное многоточием) растягивает колонку
            до своей полной ширины, и на телефоне вся секция уезжает вбок. */}
        <div className="grid grid-cols-1 items-start gap-[clamp(32px,4.5vw,64px)] min-[920px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <Eyebrow>{t.lead.eyebrow}</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1] !text-white">{t.lead.title}</Reveal>
            {/* Один рядок замість абзацу: що буде після заявки. */}
            <p className="m-0 mt-4 max-w-[40ch] text-[15.5px] leading-relaxed text-on-dark">
              {t.lead.lede}
            </p>

            <dl className="mt-[38px] grid gap-x-6 gap-y-[22px] min-[480px]:grid-cols-2">
              <div className="grid gap-1">
                <dt className={LABEL}>{t.common.phone}</dt>
                <dd className="m-0 font-serif text-[19px] font-semibold leading-snug text-white">
                  <a href={contacts.phoneHref} onClick={() => trackPhone('contact_section')}>
                    {contacts.phone}
                  </a>
                  <span className="mt-1 block font-sans text-[13.5px] font-light text-on-dark">{contacts.hours}</span>
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className={LABEL}>{t.common.email}</dt>
                <dd className="m-0 font-serif text-[19px] font-semibold text-white">
                  <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
                </dd>
              </div>
              <div className="grid gap-1 min-[480px]:col-span-2">
                <dt className={LABEL}>{t.common.messengers}</dt>
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

          <form id="lead-form" onSubmit={onSubmit} onInput={onFirstInput} noValidate className="grid min-w-0 grid-cols-1 gap-3.5" aria-busy={pending}>
            <div className="grid grid-cols-1 gap-3.5 min-[560px]:grid-cols-2">
              <div className="grid gap-[7px]">
                <label htmlFor="lead-name" className={LABEL}>
                  {t.lead.name}
                </label>
                <input id="lead-name" name="name" type="text" autoComplete="name" placeholder={t.lead.namePh} className={FIELD} {...fieldA11y('name')} onChange={() => clearError('name')} />
                <FieldError id="name" text={errors.name} />
              </div>
              <div className="grid gap-[7px]">
                <label htmlFor="lead-phone" className={LABEL}>
                  {t.common.phone}
                </label>
                <input id="lead-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="067 123 45 67" className={FIELD} required {...fieldA11y('phone')} onChange={() => clearError('phone')} />
                <FieldError id="phone" text={errors.phone} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 min-[560px]:grid-cols-2">
              <div className="grid gap-[7px]">
                <label htmlFor="lead-email" className={LABEL}>
                  {t.common.email}
                </label>
                <input id="lead-email" name="email" type="email" autoComplete="email" placeholder={t.common.optional} className={FIELD} {...fieldA11y('email')} onChange={() => clearError('email')} />
                <FieldError id="email" text={errors.email} />
              </div>
              {/* ── выбор направления ──
                  Раньше здесь были только четыре категории, и человек,
                  который пришёл за «банкрутством фізичних осіб», не мог
                  назвать свою услугу — лид приходил с размытой темой.
                  Теперь доступны все направления, сгруппированные по
                  блокам, с поиском.

                  Нативный select это не умел: системная панель не
                  стилизуется, поиска нет.
                  Почему собран свой listbox — подробно в PracticeSelect.

                  В каждой группе первой стоит строка «напрям уточнимо» —
                  для тех, кто знает блок, но не знает точной услуги. */}
              <div className="grid gap-[7px]">
                <span id="lead-practice-label" className={LABEL}>
                  {t.lead.practice}
                </span>
                <PracticeSelect
                  options={options}
                  value={practice}
                  onChange={setPractice}
                  labelledBy="lead-practice-label"
                />
              </div>
            </div>
            {/* Под полем — выбранное направление целиком и ссылка на
                страницу услуги: в поле длинное название обрезается. */}
            {chosen?.practice && (
              <p className="m-0 -mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] leading-snug text-on-dark">
                <span className="text-white">{chosen.title}</span>
                <a
                  href={localeHref(lang, `/practices/${chosen.category.slug}/${chosen.practice.slug}`)}
                  className="text-accent-soft underline decoration-accent-soft/40 underline-offset-2 hover:decoration-accent-soft"
                >
                  {t.lead.aboutService}
                </a>
              </p>
            )}

            <div className="grid gap-[7px]">
              <label htmlFor="lead-message" className={LABEL}>
                {t.lead.message}
              </label>
              <textarea
                id="lead-message"
                name="message"
                rows={4}
                placeholder={t.lead.messagePh}
                className={`${FIELD} min-h-[92px] resize-y`}
                {...fieldA11y('message')}
                onChange={() => clearError('message')}
              />
              <FieldError id="message" text={errors.message} />
            </div>

            {/* honeypot */}
            <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
              <label htmlFor="lead-hp">{t.common.honeypot}</label>
              <input id="lead-hp" name="company_url" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {/* Вариант услуги, выбранный кнопкой «Обрати цей варіант». */}
            {pkg && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[10px] bg-white/[0.055] px-4 py-3 shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]">
                <span className={LABEL}>{t.lead.option}</span>
                <span className="text-[13.5px] text-white">{pkg}</span>
                <button
                  type="button"
                  onClick={() => setPkg(null)}
                  className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-full border-0 bg-transparent px-2 text-[12px] text-on-dark-2 transition-colors hover:text-white"
                  aria-label={t.lead.removeOption}
                >
                  <Icon name="close" className="size-3" /> {t.common.remove}
                </button>
              </div>
            )}

            {formError && (
              <p role="alert" className="m-0 rounded-[10px] bg-accent/10 px-4 py-3 text-[13.5px] leading-snug text-white shadow-[inset_0_0_0_1px_rgb(250_33_99/0.45)]">
                {formError}{' '}
                <a href={contacts.phoneHref} className="whitespace-nowrap font-medium text-accent-soft underline underline-offset-2">
                  {contacts.phone}
                </a>
              </p>
            )}

            <Button type="submit" arrow={!pending && !done} className="mt-1.5 justify-self-start" disabled={pending || done}>
              {pending || done ? (
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden="true" className="size-[15px] animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  {t.common.sending}
                </span>
              ) : (
                t.lead.submit
              )}
            </Button>

            <p className="m-0 mt-1 max-w-[44ch] text-[12.5px] leading-relaxed text-on-dark-2">
              {t.lead.consent}{' '}
              <a href={localeHref(lang, '/privacy')} className="underline decoration-white/30 underline-offset-2 hover:text-white">
                {t.common.privacyLower}
              </a>
              .
            </p>
          </form>
        </div>

        {/* Офис на карте — во всю ширину под формой. Адрес живёт здесь,
            на самой карте, а не отдельной строкой в списке контактов. */}
        <div className="mt-[clamp(40px,6vw,72px)]">
          <OfficeMapCard contacts={contacts} />
        </div>
      </div>
    </section>
  )
}

/** aria для поля с ошибкой: читалка экрана озвучит текст под ним. */
function fieldA11yFor(errors: FieldErrors) {
  return (name: keyof FieldErrors) =>
    errors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `lead-${name}-error` } : {}
}

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null
  return (
    <span id={`lead-${id}-error`} className="flex items-center gap-1.5 text-[12.5px] leading-snug text-accent-soft">
      <span aria-hidden="true" className="size-[5px] shrink-0 rounded-full bg-accent-soft" />
      {text}
    </span>
  )
}
