import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CONSENT_BOOTSTRAP } from '@/lib/consent'
import { SITE_URL, isIndexable } from '@/lib/site'

/**
 * Корневой лейаут. Локаль подставляет app/[lang]/layout.tsx,
 * здесь только шрифты и то, что общее для всех языков.
 *
 * Шрифты: Playfair Display (заголовки, контрастная антиква) + Manrope
 * (текст, интерфейс) + IBM Plex Mono (цифры и метки). Выбраны клиентом
 * из семи пар (было Source Serif 4 + Onest). Все три с полной кириллицей —
 * критично для украинского: половина «красивых» серифов на Google Fonts
 * не имеет ні «і», ні «ї», ні «є».
 *
 * preconnect к fonts.gstatic.com — иначе первый шрифт ждёт лишний
 * round-trip и роняет LCP.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Юридична компанія «АКТИВ» — ліквідація, банкрутство, судова практика в Києві',
    template: '%s — ЮК «АКТИВ»',
  },
  description:
    'Ліквідація та банкрутство, судовий захист бізнесу, нерухомість і військове право. Київ, з 2007 року. Перша консультація без оплати, робота без передоплати.',
  openGraph: { type: 'website', locale: 'uk_UA', siteName: 'ЮК «АКТИВ»' },
  /* Тестові адреси (*.netlify.app, предпросмотри) — noindex і в мета-тезі,
     не лише в robots.txt: так копія сайту не потрапить у видачу, навіть
     якщо на неї хтось пошле посилання. Боєвий домен — index. */
  robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#140b33',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        {/* Consent Mode v2 — ПЕРВЫМ в <head>, до любых скриптов. Ставит
            аналитику и рекламу в denied по умолчанию и сразу применяет
            выбор, если посетитель уже его делал. Обычный <script>, а не
            next/script: next/script откладывает выполнение, а сигнал
            согласия обязан прийти раньше GTM. Подробно — lib/consent.ts. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
