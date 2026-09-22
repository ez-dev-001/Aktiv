'use client'

import { useEffect, useId, useState } from 'react'
import { Bold } from '@/components/ui/Bold'
import {
  OPEN_CONSENT_EVENT,
  readConsent,
  saveConsent,
  staticCookieTexts,
  type Consent,
  type CookieTexts,
} from '@/lib/consent'

/**
 * Баннер согласия на cookie.
 *
 * ── Три правила, по которым он собран ──
 *
 * 1. Отказаться так же просто, как согласиться. «Лише необхідні» стоит
 *    рядом с «Прийняти всі», того же размера и на том же уровне, а не
 *    спрятан в настройки. Это прямое требование европейских регуляторов:
 *    баннер, где отказ требует лишнего клика, считается навязыванием
 *    согласия, и такое согласие недействительно.
 *
 * 2. Не мешать читать и не портить скорость. Баннер — карточка у края
 *    экрана, а не затемнение на весь экран: Google понижает страницы с
 *    навязчивыми перекрытиями контента на мобильных. Он в position:fixed
 *    и не сдвигает вёрстку, поэтому не даёт CLS. И он отрисовывается
 *    только на клиенте после проверки cookie — в серверном HTML его нет,
 *    так что он не становится самым крупным элементом первого экрана и
 *    не ухудшает LCP.
 *
 * 3. Изменить решение можно в любой момент — ссылка «Налаштування
 *    cookie» в футере открывает баннер снова, сразу на настройках.
 *    Отозвать согласие должно быть так же легко, как его дать.
 *
 * В DOM баннер стоит ПЕРВЫМ на странице (см. [lang]/layout.tsx): фокус
 * он не перехватывает, но посетитель с клавиатуры попадает на него
 * первым же нажатием Tab, а не после всей страницы.
 */

type View = 'hidden' | 'banner' | 'settings'

export function CookieConsent({ texts = staticCookieTexts }: { texts?: CookieTexts }) {
  const [view, setView] = useState<View>('hidden')
  const [choice, setChoice] = useState<Consent>({ analytics: false, marketing: false })
  const titleId = useId()

  /* Решение показывать баннер — только на клиенте. На сервере cookie
     посетителя неизвестна, и отрисовать баннер там значило бы показать
     его и тем, кто уже выбирал, — а потом убрать после гидратации. */
  useEffect(() => {
    const saved = readConsent()
    if (saved) setChoice({ analytics: saved.analytics, marketing: saved.marketing })
    else setView('banner')

    const reopen = () => {
      const s = readConsent()
      if (s) setChoice({ analytics: s.analytics, marketing: s.marketing })
      setView('settings')
    }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
  }, [])

  function decide(c: Consent) {
    saveConsent(c)
    setChoice(c)
    setView('hidden')
  }

  if (view === 'hidden') return null

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="consent-card fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[90] mx-auto max-w-[460px] rounded-[14px] bg-white p-[clamp(18px,2.4vw,24px)] text-ink shadow-[0_24px_70px_-24px_rgb(20_11_51/0.45),inset_0_0_0_1px_var(--color-hair)] min-[640px]:inset-x-auto min-[640px]:left-[max(20px,env(safe-area-inset-left))] min-[640px]:mx-0"
    >
      <h2 id={titleId} className="m-0 font-serif text-[18px] font-semibold leading-snug tracking-[-0.01em]">
        {texts.title}
      </h2>

      {view === 'banner' ? (
        <>
          <p className="m-0 mt-2.5 text-[13.5px] leading-relaxed text-slate">
            <Bold text={texts.text} />
          </p>
          {texts.privacyUrl && (
            <a
              href={texts.privacyUrl}
              className="mt-2 inline-block text-[13px] text-accent-ink underline decoration-accent-ink/35 underline-offset-2 hover:decoration-accent-ink"
            >
              Політика конфіденційності
            </a>
          )}

          {/* Две главные кнопки — одного размера. Отказ не прячется. */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => decide({ analytics: false, marketing: false })}
              className="min-h-11 rounded-[10px] border-0 bg-paper-2 px-3 text-[13.5px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] transition-colors hover:bg-hair-soft"
            >
              Лише необхідні
            </button>
            <button
              type="button"
              onClick={() => decide({ analytics: true, marketing: true })}
              className="min-h-11 rounded-[10px] border-0 bg-accent px-3 text-[13.5px] font-medium text-white transition-[filter] hover:brightness-95"
            >
              Прийняти всі
            </button>
          </div>
          <button
            type="button"
            onClick={() => setView('settings')}
            className="mt-2.5 w-full border-0 bg-transparent p-1 text-[13px] text-slate-2 underline decoration-slate-2/40 underline-offset-2 hover:text-ink"
          >
            Налаштувати
          </button>
        </>
      ) : (
        <Settings choice={choice} onChange={setChoice} onSave={() => decide(choice)} privacyUrl={texts.privacyUrl} />
      )}
    </section>
  )
}

function Settings({
  choice,
  onChange,
  onSave,
  privacyUrl,
}: {
  choice: Consent
  onChange: (c: Consent) => void
  onSave: () => void
  privacyUrl: string
}) {
  const rows: { key: keyof Consent | 'necessary'; title: string; note: string }[] = [
    {
      key: 'necessary',
      title: 'Необхідні',
      note: 'Щоб сайт працював і памʼятав ваш вибір щодо cookie. Вимкнути не можна.',
    },
    {
      key: 'analytics',
      title: 'Статистика',
      note: 'Знеособлено рахуємо відвідування й переходи, щоб розуміти, які сторінки корисні.',
    },
    {
      key: 'marketing',
      title: 'Реклама',
      note: 'Показуємо оголошення тим, хто вже був на сайті, і рахуємо, які з них приводять заявки.',
    },
  ]

  return (
    <>
      <ul className="m-0 mt-3 grid list-none gap-0 p-0">
        {rows.map((r) => {
          const locked = r.key === 'necessary'
          const on = locked ? true : choice[r.key as keyof Consent]
          return (
            <li key={r.key} className="flex items-start gap-3 border-t border-hair-soft py-3 first:border-t-0">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[14px] font-medium text-ink">{r.title}</p>
                <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-slate">{r.note}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={r.title}
                disabled={locked}
                onClick={() => !locked && onChange({ ...choice, [r.key]: !on })}
                className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full border-0 p-0 transition-colors duration-200 disabled:cursor-not-allowed ${
                  on ? (locked ? 'bg-accent/45' : 'bg-accent') : 'bg-hair'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
                    on ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ul>
      {privacyUrl && (
        <a
          href={privacyUrl}
          className="mt-1 inline-block text-[13px] text-accent-ink underline decoration-accent-ink/35 underline-offset-2 hover:decoration-accent-ink"
        >
          Політика конфіденційності
        </a>
      )}
      <button
        type="button"
        onClick={onSave}
        className="mt-3 min-h-11 w-full rounded-[10px] border-0 bg-ink px-3 text-[13.5px] font-medium text-white transition-[filter] hover:brightness-110"
      >
        Зберегти вибір
      </button>
    </>
  )
}

/**
 * Ссылка «Налаштування cookie» для футера. Отдельный клиентский
 * компонент, чтобы футер оставался серверным: вся интерактивность —
 * одна кнопка, и ради неё не стоит тащить в браузер весь футер.
 */
export function CookieSettingsLink({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={`border-0 bg-transparent p-0 text-left ${className}`}
    >
      Налаштування cookie
    </button>
  )
}
