import { createClient, type SanityClient } from 'next-sanity'

/**
 * Клиент Sanity.
 *
 * Ключевое решение: пока projectId не задан, клиент равен null,
 * и весь сайт работает на статическом lib/content.ts. Поэтому
 * подключение Sanity — это добавление четырёх строк в .env.local,
 * а не рефакторинг: ничего не падает ни до, ни во время.
 */

export const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '').trim()
export const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production').trim()
export const apiVersion = (process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-01-01').trim()

/** Sanity выдаёт id из 8 строчных букв и цифр. Проверяем формат, чтобы
 *  отличить «не заполнено» от «заполнено с опечаткой». */
export const projectIdLooksValid = /^[a-z0-9]{8,}$/.test(projectId)
export const isSanityConfigured = projectId.length > 0 && projectIdLooksValid

/**
 * Кеширование включается ТОЛЬКО в продакшене.
 *
 * Раньше CDN и revalidate стояли всегда, включая `npm run dev`. Из-за
 * этого правка в студии доезжала до страницы через шесть минут в худшем
 * случае: до минуты держал CDN Sanity и до пяти — кеш fetch у Next.
 * Снаружи это выглядит как «Sanity не подтягивается», хотя связь есть
 * и контент уже другой.
 *
 * Правка контента — это цикл «поменял → посмотрел». Он обязан быть
 * мгновенным, и лишние сто миллисекунд на запрос в деве того стоят.
 */
const isProd = process.env.NODE_ENV === 'production'

let cached: SanityClient | null = null

export function sanityClient(): SanityClient | null {
  if (!isSanityConfigured) return null
  cached ??= createClient({
    projectId,
    dataset,
    apiVersion,
    /* В проде CDN экономит и деньги, и задержку; свежесть обеспечивает
       вебхук из Sanity в /api/revalidate, а не опрос. В деве CDN только
       мешает: он отдаёт снимок минутной давности. */
    useCdn: isProd,
    perspective: 'published',
    token: process.env.SANITY_API_READ_TOKEN || undefined,
  })
  return cached
}

/**
 * Клиент в обход CDN. Нужен там, где важно увидеть датасет ровно
 * таким, какой он сейчас: диагностика и проверка отставания кеша.
 */
export function sanityLiveClient(): SanityClient | null {
  if (!isSanityConfigured) return null
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    perspective: 'published',
    token: process.env.SANITY_API_READ_TOKEN || undefined,
  })
}

/**
 * Диагностический клиент. Существует ТОЛЬКО для /sanity-check.
 *
 * Берёт write-токен и смотрит датасет насквозь (perspective: 'raw'),
 * то есть вместе с черновиками. Нужен, чтобы отличить друг от друга
 * три состояния, которые с сервера выглядят одинаково — «проєкту немає»,
 * «датасет приватний» и «документи є, але не опубліковані».
 *
 * Сам сайт этим клиентом не пользуется никогда: показывать посетителю
 * неопубликованные черновики нельзя, а write-токен не должен участвовать
 * в обычном рендере.
 */
export function sanityProbeClient(): SanityClient | null {
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim()
  if (!isSanityConfigured || !token) return null
  try {
    return createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: 'raw', token })
  } catch {
    return null
  }
}

/** Читающий запрос с тегом для точечной ревалидации. Возвращает null,
 *  если Sanity не настроен или запрос упал — вызывающий код подставит fallback. */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = [],
): Promise<T | null> {
  const client = sanityClient()
  if (!client) return null
  try {
    return await client.fetch<T>(query, params, {
      /* В деве — никакого кеша: правка в студии видна на F5.
         В проде — теги плюс страховочный revalidate: теги гасит вебхук
         из Sanity (app/api/revalidate), а 300 секунд остаются на случай,
         если вебхук не настроен или не дошёл. */
      ...(isProd ? { next: { tags, revalidate: 300 } } : { cache: 'no-store' as const }),
    })
  } catch (err) {
    /* Падение Sanity не должно ронять страницу: логируем и отдаём null,
       вызывающий код подставит статику. Но молчаливый фолбэк — худший
       вид поломки: сайт выглядит рабочим, просто без контента. Поэтому
       на 401/403 в консоль уходит не голый стектрейс, а причина. */
    const msg = err instanceof Error ? err.message : String(err)
    if (/\b401\b|\b403\b|Unauthorized/i.test(msg)) {
      console.error(
        `[sanity] ${projectId}/${dataset} ответил «нет доступа». Сайт показывает статику из lib/content.ts.\n` +
          '         Чаще всего это значит, что датасет приватный, а SANITY_API_READ_TOKEN пуст.\n' +
          '         Диагностика с точным ответом: /sanity-check',
      )
    } else {
      console.error('[sanity] запрос не выполнен:', msg)
    }
    return null
  }
}
