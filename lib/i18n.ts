/**
 * Языки сайта — единственный источник.
 *
 * ── Зачем отдельный файл ──
 * Список локалей был продублирован в пяти местах: proxy, корневой
 * layout, две страницы практик, страница статьи и переключатель в
 * шапке. Когда убирали русскую версию, пропустить одно из пяти было бы
 * почти неизбежно, и результат выглядел бы безобидно: сайт работает,
 * а в одном углу живёт ссылка на /ru, которая ведёт в никуда. Теперь
 * язык добавляется или убирается здесь, и больше нигде.
 *
 * Файл без зависимостей и без алиасов `@/` — его импортирует proxy.ts,
 * который Next собирает отдельно от приложения.
 */

/** Живые языки. Первый — основной, он идёт без префикса в адресе. */
export const LOCALES = ['ua', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ua'

/** Значение атрибута lang у <html> и у Open Graph. */
export const HTML_LANG: Record<Locale, string> = { ua: 'uk', en: 'en' }

/** Коды для hreflang: язык плюс регион. */
export const HREFLANG: Record<Locale, string> = { ua: 'uk-UA', en: 'en-US' }

/** Подпись в переключателе языка. */
export const LOCALE_LABEL: Record<Locale, string> = { ua: 'UA', en: 'EN' }

/**
 * Языки, которых больше нет, но адреса которых могли остаться в поиске
 * и во внешних ссылках.
 *
 * ── Почему редирект, а не 404 ──
 * Русская версия была на сайте, и её страницы могли попасть в индекс.
 * Просто убрать префикс из списка значило бы превратить каждую такую
 * ссылку в 404 — Google снял бы страницы с выдачи, а накопленный вес
 * ссылок пропал бы. 301 на украинский двойник той же страницы передаёт
 * вес и приводит человека туда, где он хоть что-то прочтёт.
 *
 * Если украинского двойника у пути нет, человек попадёт на обычную
 * 404 уже на украинском адресе — это честнее, чем держать мёртвый
 * русский.
 */
export const RETIRED_LOCALES = ['ru'] as const

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

/** Адрес главной для языка: основной — без префикса. */
export const localeHome = (lang: string): string =>
  lang === DEFAULT_LOCALE || !isLocale(lang) ? '/' : `/${lang}`

/** Локаль для Intl (дати, числа): українська та британська англійська. */
export const INTL_LOCALE: Record<Locale, string> = { ua: 'uk-UA', en: 'en-GB' }

/** Будь-який рядок → відома мова (чуже — основна). */
export const asLocale = (lang: string): Locale => (isLocale(lang) ? lang : DEFAULT_LOCALE)

/**
 * Внутрішнє посилання для мови: '/about' → '/en/about', '/' → '/en',
 * '/#contact' → '/en#contact', '/?x=1' → '/en?x=1'. Для основної мови,
 * зовнішніх адрес, якорів ('#contact'), відносних ('?practice=…') і вже
 * префіксованих шляхів — без змін. Та сама логіка, що
 * `lang === 'ua' ? '' : '/' + lang`, лише в одному місці.
 */
export function localeHref(lang: string, href: string): string {
  if (lang === DEFAULT_LOCALE || !isLocale(lang)) return href
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const first = href.slice(1).split(/[/?#]/)[0] ?? ''
  if (isLocale(first)) return href
  if (href === '/') return `/${lang}`
  if (href.startsWith('/#') || href.startsWith('/?')) return `/${lang}${href.slice(1)}`
  return `/${lang}${href}`
}

/**
 * Та сама сторінка іншою мовою: '/en/team' → '/team', '/team' → '/en/team'.
 * Для перемикача мови в шапці. Пошук і якір не переносимо: ?cat= блогу
 * чи ?practice= форми — стан сторінки, а не її адреса.
 */
export function swapLocale(pathname: string, target: string): string {
  const parts = pathname.split('/')
  const rest = isLocale(parts[1] ?? '') ? `/${parts.slice(2).join('/')}` : pathname
  const path = rest === '/' || rest === '' ? '/' : rest.replace(/\/+$/, '')
  return localeHref(target, path)
}

/**
 * Скрипт для <head> кореневого layout: ставить правильний <html lang>
 * ще до першого кадру.
 *
 * Чому не атрибут із сервера: <html> рендерить кореневий app/layout.tsx,
 * а він не знає параметра [lang] — це сегмент нижче за нього. Перенести
 * <html> у app/[lang]/layout означало б кілька кореневих layout (сайт,
 * /admin, /sanity-check) і експериментальний global-not-found — заради
 * одного атрибута ризик забагато. headers() у кореневому layout зробив
 * би динамічними всі сторінки. Тому: сервер віддає lang="uk" (основна
 * мова), цей рядок до гідратації виправляє його для /en, а весь вміст
 * сторінки /en ще й загорнутий у <div lang="en"> (app/[lang]/layout.tsx)
 * — для тих, хто читає сирий HTML без JS.
 */
export const HTML_LANG_BOOTSTRAP = `(function(){try{var m=${JSON.stringify(
  Object.fromEntries(LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((l) => [l, HTML_LANG[l]])),
)},s=location.pathname.split('/')[1];if(m[s])document.documentElement.lang=m[s]}catch(e){}})()`
