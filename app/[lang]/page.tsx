import { ScrollProgress } from '@/components/site/CaseLine'
import { FloatingActions } from '@/components/site/FloatingActions'
import { MobileDock } from '@/components/site/MobileDock'
import { Header } from '@/components/site/Header'
import { toMenu } from '@/lib/menu'
import type { Metadata } from 'next'
import { openingHours, pageMeta } from '@/lib/seo'
import { Claim, Footer, Hero, Journal, Practices, TeamIntro } from '@/components/home/Sections'
import { SITE_URL } from '@/lib/site'
import { LeadSection } from '@/components/home/LeadSection'
import {
  getCategories,
  getContacts,
  getHomeContent,
  getPosts,
  getTeam,
} from '@/lib/sanity/content'
import { TrustedBy } from '@/components/home/TrustedBy'

/* ── Title і description головної ──
   Title до ~60 знаків: послуга + місто попереду, назва фірми — в кінці
   (її і так покаже Google). Description ~150 знаків: що робимо, де і
   чому варто звернутися. «absolute» — щоб шаблон «%s — ЮК «АКТИВ»» з
   кореневого layout не дописав назву вдруге. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return {
    ...pageMeta(lang, ''),
    title: { absolute: 'Юридична компанія в Києві — ліквідація, банкрутство, суди' },
    description:
      'Юридичні послуги в Києві з 2007 року: ліквідація та банкрутство, судові спори, нерухомість і військове право. Перша консультація безкоштовно.',
  }
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если настроен и заполнен; иначе статика из lib/content.ts.
     Компонентам всё равно — форма данных одна. */
  const [cats, posts, crew, contacts, home] = await Promise.all([
    getCategories(lang),
    getPosts(lang, 3),
    getTeam(lang),
    getContacts(lang),
    getHomeContent(lang),
  ])

  /* Керуючий партнер — автор цитаты в блоке «Команда», если автора
     не выбрали в студии отдельно. Его портрет и есть акцент блока. */
  const partner = crew.data.find((m) => /керуюч/i.test(m.role))
  const asPerson = (m?: { name: string; role: string; photoUrl?: string }) =>
    m ? { name: m.name, role: m.role, ...(m.photoUrl ? { photoUrl: m.photoUrl } : {}) } : undefined
  const quoteAuthor = home.data.teamQuoteAuthor ?? asPerson(partner)

  /* ── Структуровані дані (schema.org) ──
     LegalService — тип, який Google розуміє для юрфірм: назва, адреса,
     телефон, рік заснування і напрями практики з посиланнями. Дає
     картку з контактами у видачі та підтримує локальний пошук «юрист
     Київ». Дані — ті самі, що на сторінці (Sanity), щоб не розійшлися. */
  const c = contacts.data
  const hours = openingHours(c.hours)
  /* sameAs — лише публічні профілі (канал у Telegram), не посилання на чат. */
  const sameAs = c.messengers.map((m) => m.href).filter((h) => /^https:\/\/t\.me\//.test(h))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${SITE_URL}/#firm`,
    name: 'Юридична компанія «АКТИВ»',
    alternateName: 'AKTIV Law Firm',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    telephone: c.phone,
    email: c.email,
    foundingDate: '2007',
    address: {
      '@type': 'PostalAddress',
      streetAddress: [c.office.street, c.office.unit].filter(Boolean).join(', '),
      addressLocality: c.office.city || 'Київ',
      addressCountry: 'UA',
    },
    image: `${SITE_URL}/icon.svg`,
    ...(hours ? { openingHoursSpecification: [hours] } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    areaServed: { '@type': 'Country', name: 'Україна' },
    knowsAbout: cats.data.map((x) => x.title),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Напрями практики',
      itemListElement: cats.data.map((x) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: x.title, url: `${SITE_URL}/practices/${x.slug}` },
      })),
    },
  }

  /* WebSite — «що це за сайт і чий він»: назва для видачі й звʼязок із
     фірмою. SearchAction не додаємо: пошуку по сайту немає. */
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'ЮК «АКТИВ»',
    alternateName: 'Юридична компанія «АКТИВ»',
    url: SITE_URL,
    inLanguage: 'uk-UA',
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
        {/* ── Порядок блоків — як в armada.law (затверджено за макетом) ──
            1. перший екран — H1, абзац, кнопка до форми, знак;
            2. команда — хто веде справи;
            3. практика — напрями й послуги плашками;
            4. головна фраза з водяним знаком;
            5. нам довіряють — логотипи клієнтів;
            6. блог (від двох статей);
            7. форма — без змін. */}
        <Hero home={home.data} />
        <TeamIntro lang={lang} home={home.data} members={crew.data} author={quoteAuthor} />
        <Practices categories={cats.data} lang={lang} text={home.data.practicesText} />
        <Claim home={home.data} />
        <TrustedBy lang={lang} />
        {/* Блог — лише коли є з чого обирати: одна картка під великим
            заголовком виглядає як порожня полиця. */}
        {posts.data.length >= 2 && <Journal lang={lang} posts={posts.data} clickable={posts.source === 'sanity'} />}
        <LeadSection contacts={contacts.data} categories={cats.data} />
      </main>

      <Footer contacts={contacts.data} categories={cats.data} />
      {/* Телефон і планшет: липка панель «консультація + дзвінок» замість кружка. */}
      <FloatingActions contacts={contacts.data} desktopOnly />
      <MobileDock contacts={contacts.data} label={home.data.heroCtaPrimary} />
    </>
  )
}
