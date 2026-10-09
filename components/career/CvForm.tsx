'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { submitCv } from '@/app/actions/lead'
import { track } from '@/lib/analytics'
import { captureAttribution, readAttribution } from '@/lib/leads/client'
import type { FieldErrors } from '@/lib/leads/types'
import { validateLead } from '@/lib/leads/validate'
import { Icon } from '@/components/site/Icon'
import { PracticeSelect } from '@/components/ui/PracticeSelect'
import { APPLY_EVENT } from './events'

/**
 * Форма резюме на странице «Карʼєра».
 *
 * Резюме — файлом (PDF или Word до 4 МБ) или ссылкой: LinkedIn,
 * Google Диск, work.ua. Одно из двух обязательно — без резюме
 * отклик превращается в «перезвоните мне», и отбору не с чем работать.
 *
 * Уходит в CRM (раздел «Резюме») и в Telegram файлом. После отправки
 * форма не уводит на другую страницу, а сменяется подтверждением:
 * страница «Дякуємо» считается конверсией для рекламы клиентов, и
 * кандидаты там только испортили бы счёт.
 */

const FIELD =
  'w-full rounded-[10px] border-0 bg-white/[0.055] px-4 py-3.5 font-sans text-[15.5px] font-light text-white ' +
  'shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] transition-shadow duration-200 ' +
  'placeholder:text-on-dark-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none ' +
  'aria-[invalid=true]:shadow-[inset_0_0_0_1.5px_var(--color-accent-soft)]'
const LABEL = 'font-mono text-[9.5px] uppercase tracking-[0.13em] text-on-dark-2'
const OTHER = 'Інша позиція'
const MAX = 4 * 1024 * 1024

const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`)

export function CvForm({ positions }: { positions: string[] }) {
  const options = [...positions, OTHER]
  const [position, setPosition] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [useLink, setUseLink] = useState(false)
  const [drag, setDrag] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)

  /* «Відгукнутися» в вакансии подставляет посаду. */
  useEffect(() => {
    captureAttribution()
    const onApply = (e: Event) => {
      const title = (e as CustomEvent<string>).detail
      setPosition(options.includes(title) ? title : OTHER)
      setErrors((x) => ({ ...x, position: undefined }))
    }
    window.addEventListener(APPLY_EVENT, onApply)
    return () => window.removeEventListener(APPLY_EVENT, onApply)
    // options строится из props и не меняется за жизнь страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pick(f: File | null | undefined) {
    if (!f) return
    if (f.size > MAX) {
      setErrors((x) => ({ ...x, cv: 'Файл більший за 4 МБ — стисніть або додайте посилання' }))
      return
    }
    if (!/\.(pdf|docx?|rtf|odt)$/i.test(f.name)) {
      setErrors((x) => ({ ...x, cv: 'Потрібен PDF або Word' }))
      return
    }
    setFile(f)
    setErrors((x) => ({ ...x, cv: undefined }))
  }

  const a11y = (name: keyof FieldErrors) =>
    errors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `cv-${name}-error` } : {}
  const clear = (name: keyof FieldErrors) => errors[name] && setErrors((x) => ({ ...x, [name]: undefined }))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.delete('cv')
    if (file && !useLink) fd.set('cv', file)
    if (!useLink) fd.delete('cv_link')

    const { errors: local } = validateLead({
      name: String(fd.get('name') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      message: String(fd.get('message') ?? ''),
    })
    if (!position) local.position = 'Оберіть позицію — або «Інша»'
    if (!file && !(useLink && String(fd.get('cv_link') ?? '').trim())) local.cv = 'Додайте файл резюме або посилання на нього'
    if (Object.keys(local).length) {
      setErrors(local)
      return
    }

    fd.set('position', position)
    fd.set('page', window.location.pathname)
    fd.set('attribution', JSON.stringify(readAttribution()))
    setFormError(null)
    start(async () => {
      let res
      try {
        res = await submitCv(fd)
      } catch {
        res = { ok: false as const, message: 'Не вдалося надіслати. Спробуйте ще раз або напишіть нам на пошту.' }
      }
      if (!res.ok) {
        setErrors(res.errors ?? {})
        setFormError(res.message ?? null)
        return
      }
      track('cv_submit', { position })
      setSent(res.receipt.firstName || 'дякуємо')
    })
  }

  if (sent) {
    return (
      <div role="status" className="grid justify-items-start gap-4 rounded-[18px] bg-white/[0.05] p-[clamp(24px,3.4vw,40px)] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]">
        <svg viewBox="0 0 56 56" className="thanks-check size-12 text-accent" aria-hidden="true">
          <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength={1} className="thanks-check-ring" />
          <path d="M17 29l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="thanks-check-mark" />
        </svg>
        <p className="m-0 font-serif text-[clamp(22px,3vw,30px)] font-semibold leading-tight text-white">
          Дякуємо{sent !== 'дякуємо' ? `, ${sent}` : ''}! Резюме отримали.
        </p>
        <p className="m-0 max-w-[48ch] text-[15px] leading-relaxed text-on-dark">
          Відповімо до трьох робочих днів — телефоном або на пошту. Якщо зараз не підійде, збережемо резюме й напишемо, коли
          відкриється відповідна вакансія.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="grid min-w-0 grid-cols-1 gap-3.5">
      <div className="grid grid-cols-1 gap-3.5 min-[560px]:grid-cols-2">
        <Field label="Імʼя" htmlFor="cv-name" error={errors.name} id="name">
          <input id="cv-name" name="name" autoComplete="name" placeholder="Імʼя та прізвище" className={FIELD} {...a11y('name')} onChange={() => clear('name')} />
        </Field>
        <Field label="Телефон" htmlFor="cv-phone" error={errors.phone} id="phone">
          <input id="cv-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="067 123 45 67" className={FIELD} {...a11y('phone')} onChange={() => clear('phone')} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3.5 min-[560px]:grid-cols-2">
        <Field label="Пошта" htmlFor="cv-email" error={errors.email} id="email">
          <input id="cv-email" name="email" type="email" autoComplete="email" placeholder="необовʼязково" className={FIELD} {...a11y('email')} onChange={() => clear('email')} />
        </Field>
        <Field label="Позиція" htmlFor="cv-position" error={errors.position} id="position">
          <PracticeSelect
            id="cv-position"
            name="position"
            options={options.map((o) => ({ value: o, label: o, group: '', soft: o === OTHER }))}
            value={position}
            onChange={(v) => {
              setPosition(v)
              clear('position')
            }}
            placeholder="Оберіть позицію"
            listLabel="Позиція"
            invalid={Boolean(errors.position)}
            describedBy={errors.position ? 'cv-position-error' : undefined}
          />
        </Field>
      </div>

      {/* ── резюме: файл или ссылка ── */}
      <div className="grid gap-[7px]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className={LABEL}>Резюме</span>
          <button
            type="button"
            onClick={() => {
              setUseLink((v) => !v)
              clear('cv')
            }}
            className="border-0 bg-transparent p-0 text-[12.5px] text-accent-soft underline decoration-accent-soft/40 underline-offset-2 hover:decoration-accent-soft"
          >
            {useLink ? 'Завантажити файл' : 'Немає файлу? Додати посилання'}
          </button>
        </div>

        {useLink ? (
          <input
            name="cv_link"
            type="url"
            inputMode="url"
            placeholder="https://linkedin.com/in/… або Google Диск, work.ua"
            className={FIELD}
            {...a11y('cv')}
            onChange={() => clear('cv')}
          />
        ) : file ? (
          <div className="flex items-center gap-3 rounded-[10px] bg-white/[0.055] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-accent/15 font-mono text-[10px] uppercase text-accent-soft">
              {file.name.split('.').pop()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] text-white">{file.name}</span>
              <span className="font-mono text-[11.5px] text-on-dark-2">{size(file.size)}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                if (fileInput.current) fileInput.current.value = ''
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-0 bg-transparent px-2 text-[12px] text-on-dark-2 hover:text-white"
              aria-label="Прибрати файл"
            >
              <Icon name="close" className="size-3" /> прибрати
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              pick(e.dataTransfer.files?.[0])
            }}
            {...(errors.cv ? { 'aria-invalid': true } : {})}
            className={`grid cursor-pointer justify-items-center gap-1.5 rounded-[12px] border border-dashed px-4 py-7 text-center transition-colors ${
              drag ? 'border-accent bg-accent/10' : errors.cv ? 'border-accent-soft' : 'border-on-dark-hair hover:border-on-dark-2'
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 text-accent-soft" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M12 17v-6M9.5 13.5 12 11l2.5 2.5" />
            </svg>
            <span className="text-[14.5px] text-white">
              Перетягніть файл сюди або <span className="text-accent-soft underline underline-offset-2">оберіть</span>
            </span>
            <span className="text-[12px] text-on-dark-2">PDF або Word, до 4 МБ</span>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.doc,.docx,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
        )}
        <FieldErrorLine id="cv" text={errors.cv} />
      </div>

      <Field label="Коротко про себе" htmlFor="cv-message" error={errors.message} id="message">
        <textarea
          id="cv-message"
          name="message"
          rows={3}
          placeholder="Необовʼязково: досвід, практики, коли готові почати"
          className={`${FIELD} min-h-[84px] resize-y`}
          {...a11y('message')}
          onChange={() => clear('message')}
        />
      </Field>

      {/* honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="cv-hp">Не заповнювати</label>
        <input id="cv-hp" name="company_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {formError && (
        <p role="alert" className="m-0 rounded-[10px] bg-accent/10 px-4 py-3 text-[13.5px] leading-snug text-white shadow-[inset_0_0_0_1px_rgb(250_33_99/0.45)]">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1.5 inline-flex min-h-12 items-center gap-2.5 justify-self-start rounded-full border-0 bg-accent-btn px-6 text-[15px] font-medium text-white transition-colors hover:bg-accent-btn-hover disabled:opacity-80"
      >
        {pending ? (
          <>
            <span aria-hidden="true" className="size-[15px] animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Надсилаємо…
          </>
        ) : (
          <>
            Надіслати резюме <Icon name="arrow" className="size-[16px]" />
          </>
        )}
      </button>
      <p className="m-0 mt-1 max-w-[46ch] text-[12.5px] leading-relaxed text-on-dark-2">
        Надсилаючи форму, ви погоджуєтесь на обробку персональних даних для відбору. Резюме видалимо за вашим запитом.{' '}
        <a href="/privacy" className="underline decoration-white/30 underline-offset-2 hover:text-white">
          Політика конфіденційності
        </a>
      </p>
    </form>
  )
}

function Field({ label, htmlFor, error, id, children }: { label: string; htmlFor: string; error?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-[7px]">
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
      </label>
      {children}
      <FieldErrorLine id={id} text={error} />
    </div>
  )
}

function FieldErrorLine({ id, text }: { id: string; text?: string }) {
  if (!text) return null
  return (
    <span id={`cv-${id}-error`} className="flex items-center gap-1.5 text-[12.5px] leading-snug text-accent-soft">
      <span aria-hidden="true" className="size-[5px] shrink-0 rounded-full bg-accent-soft" />
      {text}
    </span>
  )
}
