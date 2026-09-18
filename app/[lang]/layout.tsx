import type { Metadata } from 'next'

const LOCALES = ['ua', 'en', 'ru'] as const
const HTML_LANG: Record<string, string> = { ua: 'uk', en: 'en', ru: 'ru' }

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  // hreflang: украинский канонический и без префикса
  return {
    alternates: {
      canonical: lang === 'ua' ? '/' : `/${lang}`,
      languages: { 'uk-UA': '/', 'en-US': '/en', 'ru-RU': '/ru' },
    },
    openGraph: { locale: HTML_LANG[lang] ?? 'uk_UA' },
  }
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
  return children
}
