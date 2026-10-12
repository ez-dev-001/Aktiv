/**
 * Согласие на cookie — общая часть для баннера и для <head>.
 *
 * ── Как это устроено ──
 * Сайт работает по Google Consent Mode v2. До выбора посетителя всё,
 * что связано с аналитикой и рекламой, стоит в «denied»: GTM, когда его
 * подключат (этап 5), загрузится, но GA4 не поставит cookie, а Meta
 * Pixel и Google Ads не получат персональных данных. После выбора
 * баннер отправляет `consent update`, и теги включаются ровно в том
 * объёме, на который согласились.
 *
 * Почему Consent Mode, а не «не грузить GTM до согласия». Второй способ
 * проще, но теряет всех, кто баннер просто закрыл или проигнорировал:
 * их визитов не будет даже в обезличенной статистике. С Consent Mode
 * Google достраивает такие визиты моделированием, и отчёты по трафику
 * остаются правдоподобными. С марта 2024 года без него Google Ads и
 * GA4 перестают принимать данные о посетителях из ЕС для ремаркетинга
 * и конверсий.
 *
 * ── Почему выбор хранится в cookie, а не в localStorage ──
 * Cookie увидит и сервер: когда появится server action для заявок
 * (этап 4), он сможет решить, отправлять ли событие в Meta CAPI, не
 * спрашивая браузер. localStorage сервер не видит никогда.
 */

export const CONSENT_COOKIE = 'aktiv_consent'

/**
 * Версия формулировки согласия. Если поменяется состав категорий или
 * смысл текста — поднять число, и баннер покажется заново всем, кто
 * соглашался на прежнюю версию. Согласие даётся на конкретный текст,
 * и на новый его нужно спросить заново.
 */
export const CONSENT_VERSION = 1

/**
 * Сколько помнить выбор. 180 дней — столько рекомендуют европейские
 * регуляторы (CNIL — до 13 месяцев, большинство сайтов выбирает
 * полгода): достаточно, чтобы не надоедать, и достаточно мало, чтобы
 * согласие не жило вечно.
 */
export const CONSENT_DAYS = 180

export interface Consent {
  /** Статистика посещений: GA4. */
  analytics: boolean
  /** Реклама и ремаркетинг: Google Ads, Meta Pixel. */
  marketing: boolean
}

export interface StoredConsent extends Consent {
  v: number
  /** Когда дано — для журнала, если спросят, на что именно соглашались. */
  at: string
}

/** Состояние сигналов Consent Mode v2 по выбору посетителя. */
export function consentSignals(c: Consent) {
  const g = (on: boolean) => (on ? 'granted' : 'denied')
  return {
    analytics_storage: g(c.analytics),
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing),
  }
}

/** Прочитать сохранённый выбор. null — выбора нет или он на старую версию. */
export function readConsent(): StoredConsent | null {
  if (typeof document === 'undefined') return null
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1)
  if (!raw) return null
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as StoredConsent
    return v.v === CONSENT_VERSION ? v : null
  } catch {
    return null
  }
}

/** Сохранить выбор и сразу сообщить его тегам. */
export function saveConsent(c: Consent): StoredConsent {
  const stored: StoredConsent = { ...c, v: CONSENT_VERSION, at: new Date().toISOString() }
  const maxAge = CONSENT_DAYS * 24 * 60 * 60
  /* SameSite=Lax и Secure на https: cookie первой стороны, чужим сайтам
     недоступна. HttpOnly поставить нельзя — баннер читает её сам. */
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(stored))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`

  const w = window as unknown as { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] }
  w.gtag?.('consent', 'update', consentSignals(c))
  /* Отдельное событие — чтобы в GTM можно было повесить на него
     триггер «дозагрузить теги сразу после согласия», не дожидаясь
     следующей страницы. */
  w.dataLayer?.push({ event: 'consent_update', consent_analytics: c.analytics, consent_marketing: c.marketing })
  /* Для компонентов сайта, которые ждут согласия (карта в карточке офиса). */
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT))
  return stored
}

/** Выбор в баннере сохранён — можно перепроверить readConsent(). */
export const CONSENT_CHANGED_EVENT = 'aktiv:consent-changed'

/** Событие, по которому баннер открывается снова — из ссылки в футере. */
export const OPEN_CONSENT_EVENT = 'aktiv:open-consent'

/**
 * Скрипт для <head>. Выполняется до всего остального на странице.
 *
 * Строится из тех же констант, что и баннер, поэтому имя cookie и
 * номер версии не могут разойтись между двумя местами.
 *
 * Делает две вещи:
 *  1. ставит всё в denied по умолчанию — это обязано случиться ДО
 *     загрузки GTM, иначе первый хит уйдёт без ограничений;
 *  2. если посетитель уже выбирал — сразу применяет его выбор. Без
 *     этого возвращающийся посетитель, давший согласие, первые полсекунды
 *     каждой страницы считался бы отказавшимся, и GA4 терял бы начало
 *     визита.
 *
 * wait_for_update: 500 — сколько GTM ждёт решения баннера для нового
 * посетителя, прежде чем отправить хит в режиме denied.
 */
export const CONSENT_BOOTSTRAP = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
try{var m=document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));if(c.v===${CONSENT_VERSION}){var a=c.analytics?'granted':'denied',k=c.marketing?'granted':'denied';gtag('consent','update',{analytics_storage:a,ad_storage:k,ad_user_data:k,ad_personalization:k})}}}catch(e){}
`.trim()

/* ── Тексты баннера по умолчанию ──
   Здесь, а не в компоненте баннера. Компонент помечен 'use client', и
   сервер, импортируя из него обычную константу, получает не объект, а
   клиентскую ссылку — .title у неё undefined. Загрузчик текстов из
   Sanity работает на сервере, поэтому запасной текст обязан жить в
   модуле без 'use client'. */

export interface CookieTexts {
  title: string
  text: string
  /** Пусто — ссылки на политику не будет. */
  privacyUrl: string
}

export const staticCookieTexts: CookieTexts = {
  title: 'Ми використовуємо cookie',
  text: 'Необхідні cookie потрібні, щоб сайт працював. Із вашого дозволу ми також рахуємо відвідування, щоб розуміти, які сторінки корисні, і показуємо рекламу тим, хто вже був на сайті. **Без вашої згоди ні того, ні іншого не буде.**',
  /* Сторінка політики є в коді (app/[lang]/privacy), тож посилання
     працює і тоді, коли поле в Sanity порожнє. */
  privacyUrl: '/privacy',
}

/* Англійський запасний текст — для /en, коли поле в Sanity порожнє.
   Тут, а не в lib/ui.ts: цей модуль без імпортів, його читає й
   scripts/seed.mjs. Посилання '/privacy' банер сам веде на /en/privacy. */
const staticCookieTextsEn: CookieTexts = {
  title: 'We use cookies',
  text: 'Necessary cookies keep the site working. With your permission, we also count visits to understand which pages are useful, and show ads to people who have already visited the site. **Without your consent, neither will happen.**',
  privacyUrl: '/privacy',
}

/** Запасні тексти банера для мови сторінки. */
export const cookieTextsFor = (lang: string): CookieTexts => (lang === 'en' ? staticCookieTextsEn : staticCookieTexts)
