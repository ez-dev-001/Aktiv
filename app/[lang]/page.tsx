import { ScrollProgress } from '@/components/site/CaseLine'
import { FloatingActions } from '@/components/site/FloatingActions'
import { MobileDock } from '@/components/site/MobileDock'
import { Header } from '@/components/site/Header'
import { toMenu } from '@/lib/menu'
import type { Metadata } from 'next'
import { localePath, openingHours, pageMeta } from '@/lib/seo'
import { HREFLANG, asLocale } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { Footer } from '@/components/home/Sections'
import { V2Hero, V2News, V2Practices, V2Trusted, V2Values } from '@/components/v2/Home'
import { Stack } from '@/components/v2/Stack'
import { SITE_URL } from '@/lib/site'
import { LeadSection } from '@/components/home/LeadSection'
import {
  getCategories,
  getContacts,
  getHomeContent,
  getPosts,
  getTrustBlock,
} from '@/lib/sanity/content'

/* ── Title і description головної ──
   Title до ~60 знаків: послуга + місто попереду, назва фірми — в кінці
   (її і так покаже Google). Description ~150 знаків: що робимо, де і
   чому варто звернутися. «absolute» — щоб шаблон «%s — ЮК «АКТИВ»» з
   кореневого layout не дописав назву вдруге. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).meta
  return {
    ...pageMeta(lang, ''),
    title: { absolute: t.homeTitle },
    description: t.homeDescription,
  }
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = ui(lang)
  /* Sanity, если настроен и заполнен; иначе статика из lib/content.ts.
     Компонентам всё равно — форма данных одна. */
  const [cats, posts, contacts, home, trust] = await Promise.all([
    getCategories(lang),
    getPosts(lang, 3),
    getContacts(lang),
    getHomeContent(lang),
    getTrustBlock(lang),
  ])

  /* ── Структуровані дані (schema.org) ──
     LegalService — тип, який Google розуміє для юрфірм: назва, адреса,
     телефон, рік заснування і напрями практики з посиланнями. Дає
     картку з контактами у видачі та підтримує локальний пошук «юрист
     Київ». Дані — ті самі, що на сторінці (Sanity), щоб не розійшлися. */
  const showTrust = trust.data.clients.length > 0 || process.env.NODE_ENV !== 'production'
  const c = contacts.data
  const hours = openingHours(c.hours)
  /* sameAs — лише публічні профілі (канал у Telegram), не посилання на чат. */
  const sameAs = c.messengers.map((m) => m.href).filter((h) => /^https:\/\/t\.me\//.test(h))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${SITE_URL}/#firm`,
    name: t.common.firmFull,
    alternateName: t.common.firmAlt,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    telephone: c.phone,
    email: c.email,
    foundingDate: '2007',
    address: {
      '@type': 'PostalAddress',
      streetAddress: [c.office.street, c.office.unit].filter(Boolean).join(', '),
      addressLocality: c.office.city || t.common.city,
      addressCountry: 'UA',
    },
    image: `${SITE_URL}/icon.svg`,
    ...(hours ? { openingHoursSpecification: [hours] } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    areaServed: { '@type': 'Country', name: t.common.country },
    knowsAbout: cats.data.map((x) => x.title),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: t.home.practiceAreas,
      itemListElement: cats.data.map((x) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: x.title, url: `${SITE_URL}${localePath(lang, `/practices/${x.slug}`)}` },
      })),
    },
  }

  /* WebSite — «що це за сайт і чий він»: назва для видачі й звʼязок із
     фірмою. SearchAction не додаємо: пошуку по сайту немає. */
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: t.common.firmShort,
    alternateName: lang === 'ua' ? t.common.firmFull : t.common.firmAlt,
    url: SITE_URL,
    inLanguage: HREFLANG[asLocale(lang)],
    publisher: { '@id': `${SITE_URL}/#firm` },
  }

  return (
    <>
      <script
        type="application/ld+json"
        /* < екранується, щоб текст із Sanity не міг закрити тег script. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, website]).replace(/</g, '\\u003c') }}
      />
      <ScrollProgress />
      {/* overDark: первый экран тёмный, шапка стартует прозрачной */}
      <Header lang={lang} overDark contacts={contacts.data} categories={toMenu(cats.data)} />

      <main id="top" className="relative">
        {/* ── Нова редакція (макет клієнта) ──
            перший екран → 8 напрямів → цінності → нам довіряють →
            новини → форма з адресою. «Команди» на головній немає.
            Stack: перший екран лишається на місці, практики наїжджають
            на нього (components/v2/Stack); далі сторінка йде звичайно. */}
        <Stack>
          <V2Hero lang={lang} />
          <V2Practices lang={lang} />
        </Stack>
        <V2Values lang={lang} />
        {showTrust && <V2Trusted lang={lang} clients={trust.data.clients} />}
        {posts.data.length >= 2 && <V2News lang={lang} posts={posts.data} clickable={posts.source === 'sanity'} />}
        <LeadSection contacts={contacts.data} categories={cats.data} />
      </main>

      <Footer lang={lang} contacts={contacts.data} categories={cats.data} />
      {/* Телефон і планшет: липка панель «консультація + дзвінок» замість кружка. */}
      <FloatingActions contacts={contacts.data} desktopOnly />
      <MobileDock contacts={contacts.data} label={home.data.heroCtaPrimary} />
    </>
  )
}
