import { NextResponse, type NextRequest } from 'next/server'

/**
 * Локали: ua / en / ru. Украинский — БЕЗ префикса, как на старом сайте,
 * чтобы не терять накопленные позиции по 37 практикам и 71 статье.
 *
 * Внутри приложения маршрут всегда /[lang]/..., поэтому непрефиксные
 * пути переписываются на /ua/... Пользователь URL не видит.
 *
  * В Next 16 это соглашение называется proxy.ts (middleware.ts помечен deprecated).
 */
/**
 * runtime здесь НЕ указываем.
 * Бриф требовал edge — это было верно для Next 14/15, где Node.js
 * в middleware на Netlify не поддерживался. В Next 16 middleware
 * выполняется как Proxy, а 'experimental-edge' помечен deprecated
 * и печатает предупреждение на каждой сборке. Адаптер Netlify
 * разворачивает его в edge-функцию сам.
 */
export const config = {
  matcher: ['/((?!_next|api|favicon|robots|sitemap|studio|sanity-check|.*\\..*).*)'],
}

const LOCALES = ['ua', 'en', 'ru'] as const

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const first = pathname.split('/')[1]

  // /en/... и /ru/... идут как есть
  if (first === 'en' || first === 'ru') return NextResponse.next()

  // /ua/... — редирект на канонический путь без префикса
  if (first === 'ua') {
    const url = req.nextUrl.clone()
    url.pathname = pathname.replace(/^\/ua/, '') || '/'
    return NextResponse.redirect(url, 308)
  }

  // всё остальное переписываем внутрь /ua
  const url = req.nextUrl.clone()
  url.pathname = `/ua${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export type Locale = (typeof LOCALES)[number]
