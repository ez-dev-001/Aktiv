import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n'
import { getCookieTexts } from '@/lib/sanity/content'
import { CookieConsent } from '@/components/site/CookieConsent'
import { Attribution } from '@/components/site/Attribution'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  /* Canonical і hreflang — НЕ тут, а в кожній сторінці (lib/seo.ts →
     pageMeta). Тут вони успадковувались усіма сторінками мови, і
     canonical кожної вказував на головну. */
  return {
    /* Повний openGraph: дочірній openGraph замінює кореневий цілком, тож
       type і siteName повторюємо тут. Локаль у форматі Open Graph (uk_UA). */
    openGraph: { type: 'website', siteName: 'ЮК «АКТИВ»', locale: isLocale(lang) && lang !== 'ua' ? 'en_US' : 'uk_UA' },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  /* ── Чужой код языка — 404 ──
     Без этой проверки запрос на /de, миновав proxy, отрисовался бы на
     лету с lang='de': украинский текст под чужим кодом языка, для
     поисковика — дубль главной.

     Именно проверка, а не `dynamicParams = false` в этом файле.
     Настройка сегмента в layout наследуется дочерними маршрутами, и
     блог перестал бы отрисовывать статьи, опубликованные после сборки,
     — они отдавали бы 404 до следующего деплоя. */
  if (!isLocale(lang)) notFound()

  const cookieTexts = await getCookieTexts(lang)

  /* Баннер cookie — ПЕРВЫМ в разметке, до содержимого страницы. На
     экране он внизу (position: fixed), но в порядке фокуса первый:
     посетитель с клавиатуры попадает на него первым же Tab, а не после
     всей страницы. Здесь, в layout языка, а не в корневом: тексты
     приходят из Sanity на языке страницы. */
  return (
    <>
      <CookieConsent texts={cookieTexts} />
      <Attribution />
      {children}
    </>
  )
}
