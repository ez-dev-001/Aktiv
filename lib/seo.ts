import type { Metadata } from 'next'
import { DEFAULT_LOCALE, HREFLANG, isLocale, type Locale } from './i18n'
import { SITE_URL } from './site'
import { ui } from './ui'

/**
 * Canonical, hreflang і robots для кожної сторінки — з одного місця.
 *
 * ── Чому окремий файл (SEO-аудит, жовтень 2026) ──
 * Раніше canonical ставив layout мови, і він вказував на ГОЛОВНУ для
 * всіх сторінок: /about, /team, усі 36 практик і статті казали Google
 * «я копія головної». Такі сторінки пошуковик склеює з головною й не
 * показує у видачі. Тепер кожна сторінка передає свій шлях.
 *
 * ── Англійська версія ──
 * Мова, якої немає в INDEXED_LOCALES, отримує noindex, follow і
 * canonical на український двійник і не потрапляє в hreflang і карту
 * сайту. Англійська увімкнена (жовтень 2026): інтерфейс перекладено в
 * коді (lib/ui.ts), тексти — у Sanity. Тепер /en/... має власний
 * canonical, hreflang uk-UA / en-US / x-default і є в sitemap.xml.
 */
export const INDEXED_LOCALES: readonly Locale[] = ['ua', 'en']

/** Шлях для мови: основна — без префікса. `path` — '' або '/about'. */
export const localePath = (lang: string, path: string) =>
  lang === DEFAULT_LOCALE || !isLocale(lang) ? path || '/' : `/${lang}${path}`

export const isIndexedLocale = (lang: string) => (INDEXED_LOCALES as readonly string[]).includes(lang)

/**
 * alternates + robots для сторінки. Повертає частину Metadata, яку
 * сторінка розгортає у своїй generateMetadata:
 *   return { title, description, ...pageMeta(lang, '/about') }
 */
/** Картинка для соцмереж і месенджерів (1200×630, public/og.jpg). */
export const OG_IMAGE = { url: '/og.jpg', width: 1200, height: 630, alt: 'Юридична компанія «АКТИВ», Київ' }

/**
 * Open Graph і Twitter для сторінки. Дочірній openGraph у Next замінює
 * батьківський ЦІЛКОМ, тому тут повний набір: тип, назва сайту, мова,
 * адреса сторінки й картинка. twitter:site/creator не ставимо — акаунта
 * фірми в X/Twitter немає.
 */
export function socialMeta(lang: string, url: string): Pick<Metadata, 'openGraph' | 'twitter'> {
  const t = ui(lang)
  return {
    openGraph: {
      type: 'website',
      siteName: t.common.firmShort,
      locale: lang !== DEFAULT_LOCALE && isLocale(lang) ? 'en_US' : 'uk_UA',
      url,
      images: [{ ...OG_IMAGE, alt: t.meta.ogAlt }],
    },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
  }
}

export function pageMeta(lang: string, path: string): Pick<Metadata, 'alternates' | 'robots' | 'openGraph' | 'twitter'> {
  const indexed = isIndexedLocale(lang)
  const canonical = localePath(indexed ? lang : DEFAULT_LOCALE, path)
  const languages =
    INDEXED_LOCALES.length > 1
      ? {
          ...Object.fromEntries(INDEXED_LOCALES.map((l) => [HREFLANG[l], localePath(l, path)])),
          'x-default': localePath(DEFAULT_LOCALE, path),
        }
      : undefined
  return {
    alternates: { canonical, ...(languages ? { languages } : {}) },
    ...(indexed ? {} : { robots: { index: false, follow: true } }),
    ...socialMeta(lang, canonical),
  }
}

/** Абсолютна адреса — для JSON-LD (там відносні адреси не працюють). */
export const absUrl = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`)

const DAYS: Record<string, string> = { пн: 'Monday', вт: 'Tuesday', ср: 'Wednesday', чт: 'Thursday', пт: 'Friday', сб: 'Saturday', нд: 'Sunday' }
const ORDER = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд']

/**
 * «Пн — Пт, 9:00 – 18:00» → OpeningHoursSpecification для schema.org.
 * Розбирає лише такий простий формат; інакше — undefined (краще без
 * годин у розмітці, ніж неправильні).
 */
export function openingHours(hours: string) {
  const t = hours.toLowerCase().match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/)
  const d = hours.toLowerCase().match(/(пн|вт|ср|чт|пт|сб|нд)\s*[–—-]\s*(пн|вт|ср|чт|пт|сб|нд)/)
  if (!t || !d) return undefined
  const [, h1 = '', m1 = '', h2 = '', m2 = ''] = t
  const from = ORDER.indexOf(d[1] ?? ''), to = ORDER.indexOf(d[2] ?? '')
  if (from < 0 || to < from) return undefined
  const pad = (h: string, m: string) => `${h.padStart(2, '0')}:${m}`
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ORDER.slice(from, to + 1).map((k) => DAYS[k]),
    opens: pad(h1, m1),
    closes: pad(h2, m2),
  }
}

/**
 * Заголовок сторінки практики без SEO-поля зі студії: коротку назву
 * доповнюємо містом — запити здебільшого локальні («банкрутство фізичних
 * осіб Київ»). Довгі назви не чіпаємо, щоб title не обрізався у видачі.
 */
export const withCity = (title: string, lang = 'ua') => {
  const t = ui(lang).meta
  return title.length <= 40 && !t.cityTest.test(title) ? t.inCity(title) : title
}
