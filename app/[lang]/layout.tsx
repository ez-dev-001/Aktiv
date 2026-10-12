import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, isLocale } from '@/lib/i18n'
import { localePath, socialMeta } from '@/lib/seo'
import { ui } from '@/lib/ui'
import { LangProvider } from '@/components/site/LangProvider'
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
  /* Не основна мова: свій шаблон title і опис за замовчуванням, інакше
     англійські сторінки успадкували б українські з кореневого layout
     («… — ЮК «АКТИВ»»). Для української нічого не змінюємо. */
  const t = ui(lang)
  return {
    ...(lang !== DEFAULT_LOCALE && isLocale(lang)
      ? { title: { default: t.meta.defaultTitle, template: t.meta.titleTemplate }, description: t.meta.defaultDescription }
      : {}),
    /* Повний openGraph: дочірній openGraph замінює кореневий цілком, тож
       type і siteName повторюємо тут. Локаль у форматі Open Graph (uk_UA). */
    ...socialMeta(lang, localePath(lang, '')),
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
  const body = (
    <LangProvider lang={lang}>
      <CookieConsent texts={cookieTexts} />
      <Attribution />
      {children}
    </LangProvider>
  )

  /* ── lang для не основної мови ──
     <html lang> рендерить кореневий layout, який не знає [lang] (чому
     так — lib/i18n.ts, HTML_LANG_BOOTSTRAP). Скрипт виправляє атрибут
     до першого кадру, а ця обгортка дає правильну мову всьому вмісту
     навіть у сирому HTML. display: contents — обгортка не створює
     власного блоку й не впливає на розкладку (sticky-шапка, fixed-банер). */
  if (lang === DEFAULT_LOCALE) return body
  return (
    <div lang={HTML_LANG[lang]} style={{ display: 'contents' }}>
      {body}
    </div>
  )
}
