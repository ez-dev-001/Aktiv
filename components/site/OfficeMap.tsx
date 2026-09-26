'use client'

import { useEffect, useState } from 'react'
import { CONSENT_CHANGED_EVENT, readConsent } from '@/lib/consent'

/**
 * Карта Google для блока контактов.
 *
 * ── Почему не сразу iframe ──
 * Встроенная карта Google ставит свои cookie и шлёт Google адрес
 * посетителя — ещё до того, как он её увидел. На сайте есть баннер
 * согласия, и грузить карту в обход него значило бы сделать баннер
 * декорацией. Поэтому:
 *
 *  • посетитель уже согласился на статистику или рекламу — карта
 *    грузится сама, лениво, когда блок доезжает до экрана;
 *  • не соглашался — на месте карты схема кварталов с меткой
 *    и кнопка «Показати карту». Нажатие — согласие именно на карту:
 *    грузим только её, остальной выбор не трогаем.
 *
 * ── Без фильтров поверх карты ──
 * Первая версия делала карту тёмной CSS-фильтром (инверсия + поворот
 * оттенка), подкрашивала слоем со смешиванием и клала сверху
 * табличку с размытием фона. При прокрутке браузер перерисовывал чужой
 * iframe под этими эффектами, и карта вспыхивала светлым. Поэтому
 * теперь над iframe нет ни фильтров, ни смешивания, ни размытия: карта
 * в родных цветах Google, в «окне» со скруглением, а в палитру сайта
 * её вписывает тёмная рамка вокруг (см. OfficeMapCard).
 */
export function OfficeMap({ query, title }: { query: string; title: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => {
      const c = readConsent()
      if (c && (c.analytics || c.marketing)) setShow(true)
    }
    check()
    /* Выбор в баннере мог случиться уже на этой странице. */
    window.addEventListener(CONSENT_CHANGED_EVENT, check)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check)
  }, [])

  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&hl=uk&output=embed`

  if (show) {
    return (
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
      />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eceaf1]">
      {/* Схема вместо карты: кварталы, пара проспектов, метка. Это не
          картинка местности — только знак «здесь будет карта». Светлая,
          как сама карта Google: после нажатия ничего не «перекрашивается». */}
      <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <pattern id="office-grid" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
            <rect width="30" height="30" fill="#eceaf1" />
            <rect x="3" y="3" width="24" height="24" rx="3" fill="#e0dde8" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#office-grid)" />
        <path d="M-20 190 C 90 160, 180 170, 420 90" stroke="#fbf9f8" strokeWidth="13" fill="none" />
        <path d="M130 -20 L 185 320" stroke="#fbf9f8" strokeWidth="9" fill="none" />
        <path d="M-20 70 L 420 128" stroke="#f5f1ef" strokeWidth="6" fill="none" />
      </svg>

      <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="grid size-10 place-items-center rounded-full bg-accent text-white shadow-[0_0_0_6px_rgb(250_33_99/0.15),0_10px_24px_-6px_rgb(250_33_99/0.6)]">
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
            <circle cx="12" cy="10" r="2.3" />
          </svg>
        </span>
        <span className="-mt-1 size-2 rotate-45 bg-accent" />
      </span>

      <button
        type="button"
        onClick={() => setShow(true)}
        title="Карту показує Google — він може встановити свої cookie"
        className="absolute bottom-3 left-1/2 inline-flex min-h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border-0 bg-ink px-4 text-[13px] text-white shadow-[0_8px_20px_-8px_rgb(20_11_51/0.5)] transition-colors hover:bg-ink-2"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
        Показати карту
      </button>
    </div>
  )
}
