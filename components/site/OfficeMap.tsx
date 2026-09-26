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
 * ── Тёмная карта без вспышек ──
 * У встроенной карты Google нет тёмной темы — её даёт фильтр: инверсия
 * и поворот оттенка на 180° делают карту тёмной, а красная метка после
 * двойного поворота остаётся красной.
 *
 * Первая версия вешала фильтр прямо на iframe, подкрашивала карту
 * слоем со смешиванием (mix-blend) и клала сверху табличку с размытием
 * фона. При прокрутке карта вспыхивала светлым: iframe с другого
 * домена браузер рисует отдельным слоем, и эти эффекты при скролле
 * пересчитывались с опозданием. Теперь:
 *   • фильтр висит на обёртке, а не на iframe, и обёртка — свой слой
 *     композитора (translateZ + will-change): она переезжает при
 *     прокрутке целиком, уже отфильтрованной, без перерисовки;
 *   • подкраска — обычный полупрозрачный слой, без смешивания;
 *   • поверх карты нет размытия фона.
 *
 * ── Без карточки Google ──
 * В режиме поиска Google кладёт в левый верхний угол белую карточку
 * адреса. Адрес у нас и так написан рядом крупно, а белый прямоугольник
 * на тёмной карте бьёт в глаза. Поэтому iframe выше блока на 110 px и
 * сдвинут вверх ровно на них: карточка уходит за край. Низ карты —
 * логотип Google и условия использования — остаётся на месте: их
 * прятать нельзя.
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
      <>
        <div className="absolute inset-0 overflow-hidden [transform:translateZ(0)] [will-change:transform] [filter:invert(0.91)_hue-rotate(180deg)_saturate(0.6)_brightness(0.95)_contrast(0.94)]">
          <iframe
            title={title}
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-x-0 top-[-110px] h-[calc(100%+110px)] w-full border-0"
          />
        </div>
        {/* Подкраска в фиолетовый сайта — обычная прозрачность, без mix-blend. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#1c1242]/25" />
      </>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-2">
      {/* Схема вместо карты: кварталы, пара проспектов, метка. Это не
          картинка местности — только знак «здесь будет карта». Тёмная,
          как и сама карта после загрузки. */}
      <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <pattern id="office-grid-dark" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
            <rect width="30" height="30" fill="#1c1242" />
            <rect x="3" y="3" width="24" height="24" rx="3" fill="#241a4d" />
          </pattern>
          <radialGradient id="office-glow" cx="50%" cy="45%" r="42%">
            <stop offset="0" stopColor="#fa2163" stopOpacity="0.2" />
            <stop offset="1" stopColor="#fa2163" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill="url(#office-grid-dark)" />
        <path d="M-20 190 C 90 160, 180 170, 420 90" stroke="#33285f" strokeWidth="12" fill="none" />
        <path d="M130 -20 L 185 320" stroke="#33285f" strokeWidth="9" fill="none" />
        <path d="M-20 70 L 420 128" stroke="#2c2256" strokeWidth="6" fill="none" />
        <rect width="400" height="300" fill="url(#office-glow)" />
      </svg>

      <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="grid size-10 place-items-center rounded-full bg-accent text-white shadow-[0_0_0_6px_rgb(250_33_99/0.18),0_10px_24px_-6px_rgb(250_33_99/0.7)]">
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
        className="absolute bottom-3 left-1/2 inline-flex min-h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border-0 bg-white px-4 text-[13px] font-medium text-ink shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] transition-colors hover:bg-paper-2"
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
