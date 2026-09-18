import type { Metadata, Viewport } from 'next'
import './globals.css'

/**
 * Корневой лейаут. Локаль подставляет app/[lang]/layout.tsx,
 * здесь только шрифты и то, что общее для всех языков.
 *
 * Шрифты: Source Serif 4 (серифный акцидентный) + Onest (гротеск) +
 * IBM Plex Mono (цифры и метки). Все три с полной кириллицей —
 * критично для украинского: половина «красивых» серифов на Google Fonts
 * не имеет ні «і», ні «ї», ні «є».
 *
 * preconnect к fonts.gstatic.com — иначе первый шрифт ждёт лишний
 * round-trip и роняет LCP.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://aktiv-alb.com'),
  title: {
    default: 'Юридична компанія «АКТИВ» — ліквідація, банкрутство, судова практика в Києві',
    template: '%s — ЮК «АКТИВ»',
  },
  description:
    'Ліквідація та банкрутство, судовий захист бізнесу, нерухомість і військове право. Київ, з 2007 року. Перша консультація без оплати, робота без передоплати.',
  openGraph: { type: 'website', locale: 'uk_UA', siteName: 'ЮК «АКТИВ»' },
  robots: { index: true, follow: true },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Onest:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
