import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Вебхук из Sanity: «документ изменился — сбрось кеш».
 *
 * Зачем он вообще нужен. Главная и страницы практик собираются
 * заранее (SSG), а запросы к Sanity помечены тегами. Без этого
 * маршрута теги никто не гасит: правка в студии доезжала до
 * продакшена только через revalidate: 300 (до пяти минут) или
 * не доезжала вовсе — до следующей сборки. Комментарий в клиенте
 * обещал вебхук, а вебхука не было.
 *
 * Как устроена защита. Ни на какой подписи и ни на какой библиотеке:
 * общий секрет в заголовке, который знают только Sanity и сервер.
 * Этого достаточно, потому что худшее, что может сделать чужой,
 * угадав секрет, — заставить сайт перечитать собственный контент.
 * Записи тут нет, данные наружу не уходят.
 *
 * Тег совпадает с _type документа — те же строки передаются
 * в sanityFetch. Поэтому правка одной статьи гасит кеш блога
 * и не трогает практики.
 *
 * ── Как включить ──
 * 1. В .env.local задать SANITY_REVALIDATE_SECRET (любая длинная строка).
 * 2. sanity.io/manage → проект → API → Webhooks → Create webhook:
 *      URL      https://ВАШ-ДОМЕН/api/revalidate
 *      Dataset  production
 *      Trigger  Create, Update, Delete
 *      Filter   _type in ["practice","practiceCategory","post","teamMember","siteSettings","quiz","homePage","aboutPage","teamPage"]
 *      HTTP method POST
 *      HTTP Headers  x-revalidate-secret: <тот же секрет>
 * 3. Проверить: открыть URL в браузере — маршрут отвечает на GET
 *    короткой справкой о своём состоянии, без секрета и без данных.
 */

/** Типы, правка которых что-то меняет на сайте. */
const KNOWN = ['practice', 'practiceCategory', 'post', 'teamMember', 'siteSettings', 'quiz', 'homePage', 'aboutPage', 'teamPage'] as const

/**
 * Маршруты, собранные заранее.
 *
 * Указаны шаблонами, а не готовыми адресами, и это принципиально:
 * все страницы сайта лежат под /[lang], потому что proxy.ts переписывает
 * «/» в «/ua». Сбрасывать «/» бессмысленно — в кеше такого ключа нет.
 * Шаблон гасит сразу все локали и все значения сегмента.
 */
const ROUTES: readonly [string, 'page'][] = [
  ['/[lang]', 'page'],
  ['/[lang]/about', 'page'],
  ['/[lang]/team', 'page'],
  ['/[lang]/blog', 'page'],
  ['/[lang]/blog/[slug]', 'page'],
  ['/[lang]/practices/[category]', 'page'],
  ['/[lang]/practices/[category]/[slug]', 'page'],
]

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim()

  if (!secret) {
    /* Без секрета маршрут открыт настежь — значит он выключен. */
    return NextResponse.json(
      { revalidated: false, reason: 'SANITY_REVALIDATE_SECRET не заданий — вебхук вимкнено' },
      { status: 501 },
    )
  }

  const given =
    req.headers.get('x-revalidate-secret') ?? req.nextUrl.searchParams.get('secret') ?? ''

  if (given !== secret) {
    return NextResponse.json({ revalidated: false, reason: 'невірний секрет' }, { status: 401 })
  }

  let type: string | undefined
  try {
    const body = (await req.json()) as { _type?: string }
    type = typeof body?._type === 'string' ? body._type : undefined
  } catch {
    /* Тело может быть пустым — это не повод отказывать: сбросим всё. */
  }

  /* Неизвестный или отсутствующий тип — гасим все теги. Перестраховка
     дешевле, чем страница, застрявшая со старым текстом. */
  const tags = type && (KNOWN as readonly string[]).includes(type) ? [type] : [...KNOWN]

  /* expire: 0 — «просрочить сейчас». В Next 16 у revalidateTag второй
     аргумент обязателен: это профиль времени жизни. Без нуля тег
     пометился бы на истечение по расписанию, а нам нужно немедленно —
     вебхук приходит ровно в момент публикации. */
  for (const t of tags) revalidateTag(t, { expire: 0 })
  for (const [route, kind] of ROUTES) revalidatePath(route, kind)

  return NextResponse.json({ revalidated: true, type: type ?? 'усі', tags, at: Date.now() })
}

/**
 * GET — только чтобы человек мог открыть адрес и убедиться, что
 * маршрут жив и секрет задан. Ни секрета, ни контента не отдаёт
 * и ничего не сбрасывает.
 */
export function GET() {
  const configured = Boolean(process.env.SANITY_REVALIDATE_SECRET?.trim())
  return NextResponse.json({
    route: 'sanity revalidate webhook',
    configured,
    hint: configured
      ? 'Маршрут готовий. Додайте вебхук у sanity.io/manage з заголовком x-revalidate-secret.'
      : 'Задайте SANITY_REVALIDATE_SECRET у .env.local і перезапустіть сервер.',
  })
}
