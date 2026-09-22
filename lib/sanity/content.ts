import {
  categories as staticCategories,
  figures as staticFigures,
  journal as staticJournal,
  priceList as staticPriceList,
  contacts as staticContacts,
  staticAbout,
  staticHome,
  staticTeamPage,
  team as staticTeam,
  trustFacts as staticTrustFacts,
  type AboutBlock,
  type AboutContent,
  type Category,
  type HomeContent,
  type TeamPageContent,
  type Tenet,
  type PracticePackage,
  type PriceSpec,
} from '@/lib/content'
import { sanityFetch } from './client'
import type { SanityImage } from './image'
import { staticCookieTexts, type CookieTexts } from '@/lib/consent'
import { staticQuizSets, toQuizSet, type QuizSet, type RawQuiz } from '@/lib/quizzes'
import {
  ABOUT_QUERY,
  BLOG_QUERY,
  CATEGORIES_QUERY,
  COOKIE_QUERY,
  CONTACTS_QUERY,
  FIGURES_QUERY,
  HOME_QUERY,
  QUIZZES_QUERY,
  TEAM_PAGE_QUERY,
  TEAM_QUERY,
  POSTS_QUERY,
  POST_QUERY,
  POST_SLUGS_QUERY,
  PRACTICE_QUERY,
  PRICE_LIST_QUERY,
  SITEMAP_QUERY,
  TRUST_QUERY,
} from './queries'

/**
 * Единственная точка, через которую страницы получают контент.
 *
 * Пробуем Sanity — если он не настроен, упал или вернул пусто,
 * отдаём статику из lib/content.ts. Компонентам всё равно, откуда
 * пришли данные: форма объектов одна и та же.
 *
 * Флаг source нужен только странице диагностики /sanity-check,
 * чтобы было видно, что именно сейчас показывает сайт.
 */

export type Source = 'sanity' | 'static'

export interface Sourced<T> {
  data: T
  source: Source
}

/**
 * Страховка на границе с Sanity.
 *
 * Типы TypeScript описывают то, что мы ОЖИДАЕМ получить, а не то, что
 * реально придёт: ответ GROQ приходит как `any`, и забытый coalesce
 * у локализованного поля отдаёт объект { _type: 'localeString', ua: '…' }
 * там, где компонент ждёт строку. React на таком падает целиком —
 * «Objects are not valid as a React child».
 *
 * Здесь любой объект с ключом ua схлопывается в строку. Правильное
 * место для локализации — GROQ (см. queries.ts), но один забытый
 * coalesce не должен стоить всей страницы.
 */
function flattenLocale(value: unknown, lang: string): unknown {
  if (Array.isArray(value)) return value.map((v) => flattenLocale(v, lang))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (typeof obj.ua === 'string' || typeof obj[lang] === 'string') {
      const picked = obj[lang] ?? obj.ua
      if (typeof picked === 'string') return picked
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = flattenLocale(v, lang)
    return out
  }
  return value
}

const safe = <T,>(rows: T, lang: string): T => flattenLocale(rows, lang) as T

/**
 * Подпись с ценой на карточке категории («від 10 000 ₴ · альтернативна ліквідація»).
 *
 * Выводится из самой дешёвой практики категории, а не хранится отдельным
 * полем. Причина простая: отдельное поле — это второе место, где живёт цена,
 * и оно протухнет в первый же раз, когда менеджер поднимет прайс у практики
 * и забудет поправить категорию.
 */
function derivePriceHint(practices: Category['practices']): string | undefined {
  const priced = practices
    .filter((p) => p.price?.mode === 'fixed' && typeof p.price.amount === 'number')
    .sort((a, b) => (a.price!.amount ?? 0) - (b.price!.amount ?? 0))

  const cheapest = priced[0]
  if (!cheapest?.price?.amount) return undefined

  const unit = cheapest.price.unit
  const suffix = unit === 'month' ? '/міс' : unit === 'instance' ? ' / інстанція' : ''
  const sum = new Intl.NumberFormat('uk-UA').format(cheapest.price.amount)
  /* Название практики режем: в подпись влезает короткое, а не «Альтернативна
     ліквідація — зміна директора і власників». */
  const name = cheapest.title.split(/\s+[—–]\s+/)[0]?.toLowerCase() ?? ''
  return `від ${sum} ₴${suffix} · ${name}`
}

export async function getCategories(lang = 'ua'): Promise<Sourced<Category[]>> {
  const rows = await sanityFetch<Category[]>(CATEGORIES_QUERY, { lang }, ['practiceCategory', 'practice'])
  /* Пустой массив — это тоже «нет данных»: датасет создан, но не заполнен.
     Показывать пустой сайт хуже, чем показывать статику. */
  if (rows && rows.length > 0) {
    const clean = safe(rows, lang)
    return {
      data: clean.map((c) => ({ ...c, priceHint: c.priceHint ?? derivePriceHint(c.practices ?? []) })),
      source: 'sanity',
    }
  }
  return { data: staticCategories, source: 'static' }
}

export async function getPriceList(
  lang = 'ua',
): Promise<Sourced<{ service: string; price: PriceSpec }[]>> {
  const rows = await sanityFetch<{ service: string; price: PriceSpec }[]>(
    PRICE_LIST_QUERY,
    { lang },
    ['practice'],
  )
  if (rows && rows.length > 0) return { data: safe(rows, lang), source: 'sanity' }
  return { data: staticPriceList, source: 'static' }
}

export interface Post {
  slug: string
  title: string
  excerpt: string
  category?: string
  publishedAt?: string
  author?: string
  /** Обложка из Sanity. У статики её нет — там только анонсы. */
  cover?: SanityImage | null
}

const CATEGORY_LABEL: Record<string, string> = {
  news: 'Новини законодавства',
  court: 'Позиції судів',
  case: 'Кейс-рев\u2019ю',
  guide: 'Розбір для бізнесу',
}

export async function getPosts(lang = 'ua', limit = 3): Promise<Sourced<Post[]>> {
  const rows = await sanityFetch<Post[]>(POSTS_QUERY, { lang, limit }, ['post'])
  if (rows && rows.length > 0) {
    return {
      data: safe(rows, lang).map((p) => ({ ...p, category: CATEGORY_LABEL[p.category ?? ''] ?? p.category })),
      source: 'sanity',
    }
  }
  /* Статика повторяет форму: те же поля, чтобы компонент не знал разницы. */
  return {
    data: staticJournal.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.tag })),
    source: 'static',
  }
}

export interface ClientLogo {
  name: string
  /** Логотипа может не быть: тогда в ленте встаёт название. */
  logoUrl?: string
  url?: string
  note?: string
}

/**
 * Блок «Нам довіряють» целиком.
 *
 * Один загрузчик на текст, цифры и ленту — потому что это один блок и
 * один документ. Раньше отсюда уезжали только клиенты, а заголовок,
 * вступный абзац и шесть цифр брались из кода; поля trustHeading и
 * trustIntro при этом лежали в схеме и выглядели рабочими. Редактор
 * их правил, сайт не менялся.
 *
 * Фолбэк, как везде, ПОЛЕ ЗА ПОЛЕМ: заполненный заголовок при пустых
 * цифрах — рабочее состояние. Пустой вступный абзац — тоже: это
 * единственное поле, где пусто означает «абзаца не будет», а не
 * «подставь статику». Иначе убрать текст, который редактор убрать
 * решил, было бы невозможно — он возвращался бы из кода.
 */
export interface TrustFact {
  value: string
  label: string
  note?: string
}

export interface TrustBlock {
  eyebrow: string
  heading: string
  /** Пусто — абзаца не будет. См. getTrustBlock, как это отличается
   *  от незаполненного поля. */
  intro: string
  facts: TrustFact[]
  clients: ClientLogo[]
}

interface RawTrust {
  eyebrow?: string
  heading?: string
  intro?: string
  introDefined?: boolean
  facts?: { value?: string; label?: string; note?: string }[]
  clients?: ClientLogo[]
}

export const staticTrust: TrustBlock = {
  eyebrow: 'Нам довіряють',
  heading: 'Вісімнадцять років практики, які можна перевірити',
  intro:
    'Ми не показуємо клієнтів без їхньої згоди: у справах про ліквідацію, ВЛК і сімейні спори анонімність — **частина послуги**. Наводимо те, що кожен може звірити з реєстрами.',
  facts: staticTrustFacts,
  clients: [],
}

export async function getTrustBlock(lang = 'ua'): Promise<Sourced<TrustBlock>> {
  const row = await sanityFetch<RawTrust>(TRUST_QUERY, { lang }, ['siteSettings'])
  if (!row) return { data: staticTrust, source: 'static' }

  const r = safe(row, lang)
  const nonEmpty = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '')

  /* Цифра без подписи — брак заполнения, а не запись: в сетке она
     встала бы пустой плиткой. Такие отсеиваются здесь, а не прячутся
     условием в разметке. */
  const facts = (r.facts ?? [])
    .map((f) => ({
      value: nonEmpty(f?.value),
      label: nonEmpty(f?.label),
      note: nonEmpty(f?.note) || undefined,
    }))
    .filter((f) => f.value && f.label)

  const clients = (r.clients ?? []).filter(
    (c) => typeof c?.name === 'string' && c.name.length > 0,
  )

  const heading = nonEmpty(r.heading)
  const eyebrow = nonEmpty(r.eyebrow)

  /* ── Вступный абзац: почему у него правило своё ──
     Абзац объясняет, почему клиентов не показывают. Когда логотипов
     наберётся десяток, он станет неуместен, и его надо будет убрать
     из студии — значит пустое поле обязано означать «абзаца нет».
     Но ровно так же выглядит поле, которое просто ещё не заводили, и
     на таком датасете абзац пропал бы с живого сайта молча. Ровно это
     и случилось при первом же запуске: в Sanity был один клиент,
     trustIntro не заполнен — и текст со страницы исчез.
     Признак defined(trustIntro) из GROQ разводит эти два случая:
     поля нет — берём статику; поле есть и пустое — редактор его
     очистил, и абзаца действительно не будет. */
  const intro = r.introDefined ? nonEmpty(r.intro) : staticTrust.intro

  const known = Boolean(
    heading || eyebrow || facts.length || clients.length || r.introDefined,
  )

  return {
    data: {
      eyebrow: eyebrow || staticTrust.eyebrow,
      heading: heading || staticTrust.heading,
      intro,
      /* ── Цифры: подстановки нет ──
         Заголовок и надзаголовок падают на статику, потому что блок
         без заголовка — это сломанная страница. Сетка цифр — другое
         дело: её отсутствие выглядит нормально, а вот шесть цифр,
         которых нет в студии, выглядят как ложь. Редактор открывал
         «Налаштування сайту», видел поле пустым, а на сайте — «2007»,
         «300+», «150 млн ₴», и не мог понять, откуда они берутся и
         как их поправить.

         Поэтому здесь работает то, что пришло из Sanity, и ничего
         больше. Пусто — сетки не будет. Статика остаётся только для
         случая, когда документа настроек нет вовсе (см. выше, ранний
         возврат): на чистом проекте блок должен выглядеть целым. */
      facts,
      clients,
    },
    source: known ? 'sanity' : 'static',
  }
}

/* ═══════════════ КОМАНДА ═══════════════
   Блок существовал со схемой teamMember, но без запроса: правка
   специалиста в студии не меняла на сайте ничего, потому что сайт
   читал захардкоженный массив из lib/content.ts. Это и был ответ
   на «меняю в Sanity, а на сайте старое». */

export interface TeamMember {
  name: string
  role: string
  slug?: string
  kind?: string
  /** тёмная карточка — только приватному исполнителю */
  highlight?: boolean
  photoUrl?: string
  bio?: string
  phone?: string
  email?: string
}

/**
 * Кадрирование фото из Sanity.
 *
 * Квадрат с фокусом по центру: карточки команды квадратные, а
 * портрет в оригинале почти всегда вертикальный. auto=format отдаёт
 * AVIF/WebP там, где браузер их понимает.
 */
export function teamPhoto(url: string | undefined, size = 480): string | undefined {
  if (!url) return undefined
  return `${url}?w=${size}&h=${size}&fit=crop&crop=center&auto=format&q=75`
}

export async function getTeam(lang = 'ua'): Promise<Sourced<TeamMember[]>> {
  const rows = await sanityFetch<TeamMember[]>(TEAM_QUERY, { lang }, ['teamMember'])
  if (rows && rows.length > 0) {
    return { data: safe(rows, lang).filter((m) => m?.name), source: 'sanity' }
  }
  /* Статика: та же форма, только без фото и без прямых контактов. */
  return {
    data: staticTeam.map((m) => ({ name: m.name, role: m.role, highlight: m.key })),
    source: 'static',
  }
}

/* ═══════════════ ЦИФРЫ ═══════════════ */

export interface Figure {
  value: number
  suffix?: string
  unit?: string
  label: string
}

export async function getFigures(lang = 'ua'): Promise<Sourced<Figure[]>> {
  const rows = await sanityFetch<Figure[]>(FIGURES_QUERY, { lang }, ['siteSettings'])
  if (rows && rows.length > 0) {
    const clean = safe(rows, lang).filter((f) => typeof f?.value === 'number' && f?.label)
    if (clean.length > 0) return { data: clean, source: 'sanity' }
  }
  return { data: staticFigures, source: 'static' }
}

/* ═══════════════ КАЛЬКУЛЯТОРЫ ═══════════════
   Веса и тексты в Sanity лежат вместе, а движку расчёта нужен
   QuizConfig без текстов — их он не понимает. Здесь плоский ответ
   GROQ разбирается на две половины: конфиг для computeQuote и copy
   для UI. Форма результата совпадает со статикой один в один. */

export async function getQuizzes(lang = 'ua'): Promise<Sourced<QuizSet[]>> {
  const rows = await sanityFetch<RawQuiz[]>(QUIZZES_QUERY, { lang }, ['quiz'])
  if (rows && rows.length > 0) {
    const sets = safe(rows, lang).map(toQuizSet).filter((x): x is QuizSet => x !== null)
    if (sets.length > 0) return { data: sets, source: 'sanity' }
  }
  return { data: staticQuizSets, source: 'static' }
}

/* ═══════════════ КОНТАКТЫ ═══════════════ */

export interface Contacts {
  phone: string
  phoneHref: string
  email: string
  address: string
  hours: string
  messengers: { label: string; href: string }[]
}

/** tel: строится из телефона, а не хранится вторым полем — иначе они разойдутся. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

const CHANNEL_LABEL: Record<string, string> = {
  telegram: 'Telegram',
  viber: 'Viber',
  whatsapp: 'WhatsApp',
}

/** Форма ответа GROQ: мессенджеры приходят каналом, а не подписью. */
interface RawContacts {
  phone?: string
  email?: string
  address?: string
  hours?: string
  messengers?: { channel?: string; href?: string }[]
}

export async function getContacts(lang = 'ua'): Promise<Sourced<Contacts>> {
  const row = await sanityFetch<RawContacts>(CONTACTS_QUERY, { lang }, ['siteSettings'])
  const clean = row ? safe(row, lang) : null

  if (clean?.phone) {
    return {
      data: {
        phone: clean.phone,
        phoneHref: telHref(clean.phone),
        email: clean.email ?? staticContacts.email,
        address: clean.address ?? staticContacts.address,
        hours: clean.hours ?? staticContacts.hours,
        messengers:
          clean.messengers
            ?.filter((m) => m?.href)
            .map((m) => ({ label: CHANNEL_LABEL[m.channel ?? ''] ?? m.channel ?? '', href: m.href! })) ?? [],
      },
      source: 'sanity',
    }
  }
  return { data: staticContacts, source: 'static' }
}

/* ═══════════════ ОТДЕЛЬНАЯ ПРАКТИКА ═══════════════ */

export interface PracticeStage { title: string; text?: string; duration?: string }
export interface PracticeFaq { q: string; a: string }
export interface PracticeLawyer { name: string; role: string; kind?: string }

export interface PracticeDetail {
  slug: string
  title: string
  excerpt?: string
  icon?: string
  body?: unknown
  /** Абзацы из статики: простой текст, а не PortableText.
      Показываются только когда из Sanity не пришёл body. */
  bodyText?: string[]
  packages?: PracticePackage[]
  /** slug калькулятора, выбранного у самой практики. */
  quiz?: string
  price?: PriceSpec
  includes?: string[]
  stages?: PracticeStage[]
  faq?: PracticeFaq[]
  lawyers?: PracticeLawyer[]
  category?: { slug: string; title: string }
  related?: Post[]
}

/**
 * Одна практика. Из Sanity приходит полная структура услуги
 * (что входит, этапы, FAQ, кто ведёт), из статики — только название
 * и цена: на старом сайте больше ничего и не было.
 *
 * Страница показывает блок только если для него есть данные, поэтому
 * до наполнения Sanity она выглядит скромно, но не сломанно.
 */
export async function getPractice(slug: string, lang = 'ua'): Promise<PracticeDetail | null> {
  const row = await sanityFetch<PracticeDetail>(PRACTICE_QUERY, { slug, lang }, ['practice'])
  if (row?.slug) return safe(row, lang)

  /* Статика: то, что перенесено со старого сайта дословно.
     Раньше отсюда уезжали только название и цена, и страница услуги
     выходила пустой — ровно то, что видно, пока Sanity не заполнен. */
  for (const cat of staticCategories) {
    const p = cat.practices.find((x) => x.slug === slug)
    if (p) {
      return {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        price: p.price,
        bodyText: p.bodyText,
        packages: p.packages,
        includes: p.includes,
        faq: p.faq,
        category: { slug: cat.slug, title: cat.title },
      }
    }
  }
  return null
}

/* ═══════════════ БЛОГ ═══════════════ */

export const BLOG_CATEGORIES = [
  { id: '', label: 'Усі' },
  { id: 'news', label: 'Новини законодавства' },
  { id: 'court', label: 'Позиції судів' },
  { id: 'case', label: 'Кейс-рев’ю' },
  { id: 'guide', label: 'Розбір для бізнесу' },
] as const

export async function getBlog(lang = 'ua', cat = '', limit = 30): Promise<Sourced<Post[]>> {
  const rows = await sanityFetch<Post[]>(BLOG_QUERY, { lang, cat, limit }, ['post'])
  if (rows && rows.length > 0) {
    return {
      data: safe(rows, lang).map((p) => ({ ...p, category: CATEGORY_LABEL[p.category ?? ''] ?? p.category })),
      source: 'sanity',
    }
  }
  if (cat) return { data: [], source: 'static' }
  return {
    data: staticJournal.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.tag })),
    source: 'static',
  }
}

export interface PostDetail extends Post {
  body?: unknown
  authorRole?: string
  practices?: { slug: string; title: string; category: string }[]
}

export async function getPost(slug: string, lang = 'ua'): Promise<PostDetail | null> {
  const row = await sanityFetch<PostDetail & { author?: { name: string; role: string } | string }>(
    POST_QUERY,
    { slug, lang },
    ['post'],
  )
  if (!row?.slug) return null
  const clean = safe(row, lang)
  const author = clean.author as unknown as { name?: string; role?: string } | string | undefined
  return {
    ...clean,
    category: CATEGORY_LABEL[clean.category ?? ''] ?? clean.category,
    author: typeof author === 'string' ? author : author?.name,
    authorRole: typeof author === 'string' ? undefined : author?.role,
  }
}

export async function getPostSlugs(): Promise<string[]> {
  const rows = await sanityFetch<string[]>(POST_SLUGS_QUERY, {}, ['post'])
  return rows ?? []
}

/* ═══════════════ ТЕКСТ ГЛАВНОЙ ═══════════════ */

/* Типы и статика главной живут в lib/content.ts — рядом с остальным
   статическим контентом и, главное, без алиасов `@/`. Это не вкусовщина:
   scripts/seed.mjs импортирует их напрямую через node
   --experimental-strip-types, а Node не знает про tsconfig paths и
   падает на первом же `@/…` в цепочке импортов. */
export type { HomePromise, HomeRule, HomeContent } from '@/lib/content'
export { staticHome } from '@/lib/content'


/** Непустая строка или подстановка из статики. */
const str = (v: unknown, fb: string): string =>
  typeof v === 'string' && v.trim() ? v : fb

/** Непустой список или подстановка. Пустой массив из Sanity — это
 *  «блок ещё не заполнили», а не «блок должен исчезнуть». */
function list<T>(v: unknown, fb: T[], pick: (row: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(v) || v.length === 0) return fb
  const out = v
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .map(pick)
    .filter((r) => Object.values(r as Record<string, unknown>).some((x) => typeof x === 'string' && x.trim()))
  return out.length > 0 ? out : fb
}

/**
 * Текст главной страницы.
 *
 * Фолбэк работает ПОЛЕ ЗА ПОЛЕМ, а не блоком целиком. Это главное
 * решение здесь. Документ homePage создаётся пустым, и заполняют его
 * постепенно: сегодня герой, через неделю кредо. Если бы фолбэк
 * срабатывал на весь документ, то первая же сохранённая правка героя
 * обнулила бы все остальные блоки — страница развалилась бы ровно в
 * момент, когда её начали редактировать.
 *
 * source здесь означает «хоть одно поле пришло из Sanity». Точнее не
 * получится: документ смешанный по определению, и страница
 * диагностики честнее покажет «частично», чем выберет одну из сторон.
 */
export async function getHomeContent(lang = 'ua'): Promise<Sourced<HomeContent>> {
  const row = await sanityFetch<Record<string, unknown>>(HOME_QUERY, { lang }, ['homePage'])
  if (!row) return { data: staticHome, source: 'static' }

  const r = safe(row, lang)
  const f = staticHome

  const data: HomeContent = {
    heroEyebrow: str(r.heroEyebrow, f.heroEyebrow),
    heroTitle: str(r.heroTitle, f.heroTitle),
    heroTitleAccent: str(r.heroTitleAccent, f.heroTitleAccent),
    heroLede: str(r.heroLede, f.heroLede),
    heroCtaPrimary: str(r.heroCtaPrimary, f.heroCtaPrimary),
    heroCtaSecondary: str(r.heroCtaSecondary, f.heroCtaSecondary),
    promises: list(r.promises, f.promises, (p) => ({
      kicker: str(p.kicker, ''),
      answer: str(p.answer, ''),
      note: str(p.note, ''),
    })),
    credoEyebrow: str(r.credoEyebrow, f.credoEyebrow),
    credoTitle: str(r.credoTitle, f.credoTitle),
    credoLede: str(r.credoLede, f.credoLede),
    credo: list(r.credo, f.credo, (x) => ({ title: str(x.title, ''), text: str(x.text, '') })),
    pathEyebrow: str(r.pathEyebrow, f.pathEyebrow),
    pathTitle: str(r.pathTitle, f.pathTitle),
    path: list(r.path, f.path, (x) => ({ title: str(x.title, ''), text: str(x.text, '') })),
    manifestoKicker: str(r.manifestoKicker, f.manifestoKicker),
    manifestoQuote: str(r.manifestoQuote, f.manifestoQuote),
    manifestoNote: str(r.manifestoNote, f.manifestoNote),
  }

  /* «Из Sanity» — если документ вообще отдал хоть одно своё значение.
     Сравнение со статикой, а не проверка на непустоту: поле,
     совпадающее со статикой буква в букву, для диагностики
     неотличимо от незаполненного, и это честнее, чем врать. */
  const touched = Object.keys(data).some((k) => {
    const a = data[k as keyof HomeContent]
    const b = f[k as keyof HomeContent]
    return typeof a === 'string' ? a !== b : JSON.stringify(a) !== JSON.stringify(b)
  })

  return { data, source: touched ? 'sanity' : 'static' }
}

/* ═══════════════ СТРАНИЦА «ПРО КОМПАНІЮ» ═══════════════ */

export type { AboutFact, AboutBlock, AboutContent } from '@/lib/content'
export { staticAbout } from '@/lib/content'

/**
 * Текст страницы «Про компанію».
 *
 * Фолбэк поле за полем, как у главной. Документ создаётся пустым и
 * заполняется постепенно: сегодня місія, через неделю принципи. Если
 * бы фолбэк работал на весь документ, первая же сохранённая правка
 * обнулила бы остальные блоки — страница развалилась бы ровно в момент,
 * когда её начали редактировать.
 *
 * Пункты цінностей и принципів фильтруются по заголовку: запись без
 * него в сетке встала бы пустой плиткой, а в принципах — номером без
 * текста. Такие отсеиваются здесь, а не прячутся условием в разметке.
 */
export async function getAboutContent(lang = 'ua'): Promise<Sourced<AboutContent>> {
  const row = await sanityFetch<Record<string, unknown>>(ABOUT_QUERY, { lang }, ['aboutPage'])
  if (!row) return { data: staticAbout, source: 'static' }

  const r = safe(row, lang)
  const f = staticAbout

  /** Непустая строка или подстановка. */
  const S = (v: unknown, fb: string): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fb

  /** Блок місії/візії: три поля, каждое со своей подстановкой. */
  const block = (v: unknown, fb: AboutBlock): AboutBlock => {
    const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
    return {
      eyebrow: S(o.eyebrow, fb.eyebrow),
      statement: S(o.statement, fb.statement),
      text: S(o.text, fb.text),
    }
  }

  /** Список пунктов: пустой или весь из брака — подстановка. */
  const tenets = (v: unknown, fb: Tenet[]): Tenet[] => {
    if (!Array.isArray(v)) return fb
    const out = v
      .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
      .map((x) => ({
        title: S(x.title, ''),
        text: S(x.text, ''),
        icon: typeof x.icon === 'string' ? (x.icon as Tenet['icon']) : undefined,
      }))
      .filter((x) => x.title)
    return out.length ? out : fb
  }

  const facts = Array.isArray(r.headFacts)
    ? r.headFacts
        .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
        .map((x) => ({ kicker: S(x.kicker, ''), value: S(x.value, ''), note: S(x.note, '') }))
        .filter((x) => x.value)
    : []

  const data: AboutContent = {
    headEyebrow: S(r.headEyebrow, f.headEyebrow),
    headTitle: S(r.headTitle, f.headTitle),
    headTitleAccent: S(r.headTitleAccent, f.headTitleAccent),
    headLede: S(r.headLede, f.headLede),
    headFacts: facts.length ? facts : f.headFacts,
    mission: block(r.mission, f.mission),
    vision: block(r.vision, f.vision),
    valuesEyebrow: S(r.valuesEyebrow, f.valuesEyebrow),
    valuesTitle: S(r.valuesTitle, f.valuesTitle),
    valuesLede: S(r.valuesLede, f.valuesLede),
    values: tenets(r.values, f.values),
    principlesEyebrow: S(r.principlesEyebrow, f.principlesEyebrow),
    principlesTitle: S(r.principlesTitle, f.principlesTitle),
    principlesLede: S(r.principlesLede, f.principlesLede),
    principles: tenets(r.principles, f.principles),
    bridgeKicker: S(r.bridgeKicker, f.bridgeKicker),
    bridgeText: S(r.bridgeText, f.bridgeText),
    bridgeLink: S(r.bridgeLink, f.bridgeLink),
    ctaTitle: S(r.ctaTitle, f.ctaTitle),
    ctaText: S(r.ctaText, f.ctaText),
    ctaPrimary: S(r.ctaPrimary, f.ctaPrimary),
    ctaSecondary: S(r.ctaSecondary, f.ctaSecondary),
  }

  /* «Из Sanity» — если документ отдал хоть одно своё значение.
     Сравнение со статикой, а не проверка на непустоту: поле,
     совпадающее со статикой буква в букву, для диагностики
     неотличимо от незаполненного, и это честнее, чем врать. */
  const touched = Object.keys(data).some((k) => {
    const a = data[k as keyof AboutContent]
    const b = f[k as keyof AboutContent]
    return typeof a === 'string' ? a !== b : JSON.stringify(a) !== JSON.stringify(b)
  })

  return { data, source: touched ? 'sanity' : 'static' }
}

/* ═══════════════ СТРАНИЦА «КОМАНДА» ═══════════════ */

export type { TeamPageContent } from '@/lib/content'
export { staticTeamPage } from '@/lib/content'

/**
 * Раскрытие подстановок {n}, {name}, {role}.
 *
 * ── Почему подстановки, а не просто текст ──
 * Три величины на этой странице обязаны совпадать с живыми данными:
 * число специалистов и имя с должностью приватного исполнителя.
 * Отдать их на ручной ввод нельзя — они протухают молча. «Команда ·
 * 10 фахівців» останется на экране и после того, как в Sanity заведут
 * одиннадцатого, и заметит это только тот, кто пересчитает карточки.
 *
 * ── Почему нераскрытая скобка остаётся видимой ──
 * Если значения нет (исполнитель не выделен, опечатка в имени
 * переменной), скобка печатается как есть. Стереть её молча значило бы
 * выпустить фразу с дырой посередине — «Команда ·  фахівців», — и
 * такое живёт на сайте месяцами. Видимая «{role}» безобразна ровно
 * настолько, чтобы её исправили в тот же день.
 */
function fill(text: string, vars: Record<string, string | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole)
}

/**
 * Текст страницы «Команда».
 *
 * Самих людей здесь нет: они приходят из getTeam. Этот загрузчик даёт
 * обрамление и раскрывает подстановки по уже загруженной команде —
 * поэтому принимает её вторым аргументом, а не ходит за ней сам.
 * Иначе получилось бы два одинаковых запроса на одну страницу.
 *
 * Фолбэк поле за полем. Единственное исключение — примечание об
 * отсутствующих фото: у него та же логика, что у вступного абзаца в
 * блоке довіри. Пустое поле, которого никогда не заводили, даёт
 * статику; поле, которое заполнили и очистили, означает «примечания
 * быть не должно». Без этого различия текст молча исчез бы с сайта у
 * всех, кто ещё не открывал документ.
 */
export async function getTeamPage(
  lang = 'ua',
  team: { name: string; role: string; highlight?: boolean }[] = [],
): Promise<Sourced<TeamPageContent>> {
  const executor = team.find((m) => m.highlight)
  const vars = {
    n: String(team.length),
    name: executor?.name,
    role: executor?.role.toLowerCase(),
  }

  const row = await sanityFetch<Record<string, unknown>>(TEAM_PAGE_QUERY, { lang }, ['teamPage'])
  const f = staticTeamPage

  const expand = (c: TeamPageContent): TeamPageContent => ({
    ...c,
    headEyebrow: fill(c.headEyebrow, vars),
    executorTitle: fill(c.executorTitle, vars),
  })

  if (!row) return { data: expand(f), source: 'static' }

  const r = safe(row, lang)
  const S = (v: unknown, fb: string): string => (typeof v === 'string' && v.trim() ? v.trim() : fb)

  const noteDefined = Boolean(r.noPhotoNoteDefined)

  const data: TeamPageContent = {
    headEyebrow: S(r.headEyebrow, f.headEyebrow),
    headTitle: S(r.headTitle, f.headTitle),
    headTitleAccent: S(r.headTitleAccent, f.headTitleAccent),
    headLede: S(r.headLede, f.headLede),
    executorKicker: S(r.executorKicker, f.executorKicker),
    executorTitle: S(r.executorTitle, f.executorTitle),
    executorText: S(r.executorText, f.executorText),
    peopleEyebrow: S(r.peopleEyebrow, f.peopleEyebrow),
    peopleTitle: S(r.peopleTitle, f.peopleTitle),
    peopleLede: S(r.peopleLede, f.peopleLede),
    noPhotoNote: noteDefined ? S(r.noPhotoNote, '') : f.noPhotoNote,
    ctaTitle: S(r.ctaTitle, f.ctaTitle),
    ctaText: S(r.ctaText, f.ctaText),
    ctaPrimary: S(r.ctaPrimary, f.ctaPrimary),
    ctaSecondary: S(r.ctaSecondary, f.ctaSecondary),
  }

  const touched = Object.keys(data).some(
    (k) => data[k as keyof TeamPageContent] !== f[k as keyof TeamPageContent],
  )

  return { data: expand(data), source: touched ? 'sanity' : 'static' }
}

/* ═══════════════ БАННЕР COOKIE ═══════════════ */

/**
 * Тексты баннера согласия. Фолбэк поле за полем: без документа
 * настроек баннер всё равно обязан появиться — это не украшение, а
 * юридическое требование, и пустой Sanity его не отменяет.
 */
export async function getCookieTexts(lang = 'ua'): Promise<CookieTexts> {
  const row = await sanityFetch<Partial<CookieTexts>>(COOKIE_QUERY, { lang }, ['siteSettings'])
  const r = row ? safe(row, lang) : {}
  const S = (v: unknown, fb: string) => (typeof v === 'string' && v.trim() ? v.trim() : fb)
  return {
    title: S(r.title, staticCookieTexts.title),
    text: S(r.text, staticCookieTexts.text),
    privacyUrl: S(r.privacyUrl, staticCookieTexts.privacyUrl),
  }
}

/* ═══════════════ КАРТА САЙТА ═══════════════ */

export interface SitemapData {
  categories: { slug: string; updatedAt?: string }[]
  practices: { slug: string; category: string; updatedAt?: string }[]
  posts: { slug: string; updatedAt?: string }[]
  home?: string
  about?: string
  team?: string
}

interface RawSitemap {
  categories?: { slug?: string; _updatedAt?: string }[]
  practices?: { slug?: string; category?: string; _updatedAt?: string }[]
  posts?: { slug?: string; _updatedAt?: string }[]
  home?: string
  about?: string
  team?: string
}

/**
 * Адреса для карты сайта.
 *
 * Практики и категории — из Sanity, если они там заведены; иначе из
 * статики, как и везде на сайте. Карта обязана перечислять ровно те
 * страницы, на которые ведёт меню, иначе Google найдёт одно, а
 * посетитель — другое.
 *
 * ── Почему у статики нет даты ──
 * Для страниц из кода дата правки неизвестна, и её не подставляют.
 * Соблазн поставить «сегодня» велик, но Google прямо пишет, что
 * игнорирует lastmod у сайтов, где он всегда свежий: сначала перестаёт
 * верить датам этого сайта, потом перестаёт на них смотреть. Честное
 * отсутствие даты лучше, чем дата, которой не верят.
 */
export async function getSitemapData(): Promise<SitemapData> {
  const r = await sanityFetch<RawSitemap>(SITEMAP_QUERY, {}, [
    'practice',
    'practiceCategory',
    'post',
    'homePage',
    'aboutPage',
    'teamPage',
  ])

  const ok = (v: unknown): v is string => typeof v === 'string' && v.length > 0

  const sanityCats = (r?.categories ?? []).filter((c) => ok(c.slug))
  const sanityPractices = (r?.practices ?? []).filter((p) => ok(p.slug) && ok(p.category))

  /* Статика — если в Sanity практик нет вовсе. Смешивать нельзя:
     половина из Sanity, половина из кода дала бы в карте адреса, часть
     которых меню не показывает. */
  const fromSanity = sanityPractices.length > 0

  return {
    categories: fromSanity
      ? sanityCats.map((c) => ({ slug: c.slug!, updatedAt: c._updatedAt }))
      : staticCategories.map((c) => ({ slug: c.slug })),
    practices: fromSanity
      ? sanityPractices.map((p) => ({ slug: p.slug!, category: p.category!, updatedAt: p._updatedAt }))
      : staticCategories.flatMap((c) => c.practices.map((p) => ({ slug: p.slug, category: c.slug }))),
    posts: (r?.posts ?? []).filter((p) => ok(p.slug)).map((p) => ({ slug: p.slug!, updatedAt: p._updatedAt })),
    home: r?.home,
    about: r?.about,
    team: r?.team,
  }
}
