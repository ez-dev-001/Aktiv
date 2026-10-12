import { ScrollProgress } from '@/components/site/CaseLine'
import { FloatingActions } from '@/components/site/FloatingActions'
import { MobileDock } from '@/components/site/MobileDock'
import { Header } from '@/components/site/Header'
import { toMenu } from '@/lib/menu'
import type { Metadata } from 'next'
import { localePath, openingHours, pageMeta } from '@/lib/seo'
import { HREFLANG, asLocale } from '@/lib/i18n'
import { ui } from '@/lib/ui'
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
  const [cats, posts, crew, contacts, home] = await Promise.all([
    getCategories(lang),
    getPosts(lang, 3),
    getTeam(lang),
    getContacts(lang),
    getHomeContent(lang),
  ])

  /* Керуючий партнер — автор цитаты в блоке «Команда», если автора
     не выбрали в студии отдельно. Его портрет и есть акцент блока. */
  const partner = crew.data.find((m) => t.home.managingRole.test(m.role))
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
        {/* ── Порядок блоків — як в armada.law (затверджено за макетом) ──
            1. перший екран — H1, абзац, кнопка до форми, знак;
            2. команда — хто веде справи;
            3. практика — напрями й послуги плашками;
            4. головна фраза з водяним знаком;
            5. нам довіряють — логотипи клієнтів;
            6. блог (від двох статей);
            7. форма — без змін. */}
        <Hero lang={lang} home={home.data} />
        <TeamIntro lang={lang} home={home.data} members={crew.data} author={quoteAuthor} />
        <Practices categories={cats.data} lang={lang} text={home.data.practicesText} />
        <Claim lang={lang} home={home.data} />
        <TrustedBy lang={lang} />
        {/* Блог — лише коли є з чого обирати: одна картка під великим
            заголовком виглядає як порожня полиця. */}
        {posts.data.length >= 2 && <Journal lang={lang} posts={posts.data} clickable={posts.source === 'sanity'} />}
        <LeadSection contacts={contacts.data} categories={cats.data} />
      </main>

      <Footer lang={lang} contacts={contacts.data} categories={cats.data} />
      {/* Телефон і планшет: липка панель «консультація + дзвінок» замість кружка. */}
      <FloatingActions contacts={contacts.data} desktopOnly />
      <MobileDock contacts={contacts.data} label={home.data.heroCtaPrimary} />
    </>
  )
}
