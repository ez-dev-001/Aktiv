import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALES, RETIRED_LOCALES } from './lib/i18n'

/**
 * Языки сайта: украинский и английский. Список — в lib/i18n.ts.
 *
 * Украинский идёт БЕЗ префикса, как на старом сайте, чтобы не терять
 * накопленные позиции по 37 практикам и 71 статье. Внутри приложения
 * маршрут всегда /[lang]/..., поэтому непрефиксные пути переписываются
 * на /ua/... — пользователь этого не видит.
 *
 * В Next 16 это соглашение называется proxy.ts (middleware.ts помечен
 * deprecated).
 *
 * runtime здесь НЕ указываем. Бриф требовал edge — это было верно для
 * Next 14/15, где Node.js в middleware на Netlify не поддерживался.
 * В Next 16 middleware выполняется как Proxy, а 'experimental-edge'
 * помечен deprecated и печатает предупреждение на каждой сборке.
 * Адаптер Netlify разворачивает его в edge-функцию сам.
 */
export const config = {
  matcher: ['/((?!_next|api|admin|favicon|robots|sitemap|studio|sanity-check|.*\\..*).*)'],
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const first = pathname.split('/')[1] ?? ''

  /* ── Убранные языки: 301 на украинский двойник ──
     /ru/about → /about, /ru → /. Почему редирект, а не 404, — в
     lib/i18n.ts у RETIRED_LOCALES. Именно 301, а не 308: для поисковиков
     301 — привычный сигнал «переехало навсегда, перенеси вес», а метод
     запроса тут всегда GET, и разницы 308 не даёт. Без этой ветки
     /ru/about ушёл бы в перезапись ниже и стал /ua/ru/about — то есть
     404 уже на нашей стороне. */
  if ((RETIRED_LOCALES as readonly string[]).includes(first)) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.slice(first.length + 1) || '/'
    return NextResponse.redirect(url, 301)
  }

  /* /ua/... — редирект на канонический путь без префикса */
  if (first === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.slice(first.length + 1) || '/'
    return NextResponse.redirect(url, 308)
  }

  /* Остальные живые языки идут как есть */
  if ((LOCALES as readonly string[]).includes(first)) return NextResponse.next()

  /* Всё остальное — украинский без префикса, переписываем внутрь /ua */
  const url = req.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}
