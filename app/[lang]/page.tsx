import { ScrollProgress } from '@/components/site/CaseLine'
import { FloatingActions } from '@/components/site/FloatingActions'
import { Header } from '@/components/site/Header'
import { toMenu } from '@/lib/menu'
import type { Metadata } from 'next'
import { Credo, Footer, Hero, Journal, Practices, TeamIntro } from '@/components/home/Sections'
import { SITE_URL } from '@/lib/site'
import { LeadSection } from '@/components/home/LeadSection'
import {
  getAboutContent,
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
export const metadata: Metadata = {
  title: { absolute: 'Юридична компанія в Києві — ліквідація, банкрутство, суди' },
  description:
    'Ліквідація та банкрутство, судові спори, нерухомість і військове право. Київ, з 2007 року. Безкоштовна перша консультація, без передоплати.',
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если настроен и заполнен; иначе статика из lib/content.ts.
     Компонентам всё равно — форма данных одна. */
  const [cats, posts, crew, contacts, home, about] = await Promise.all([
    getCategories(lang),
    getPosts(lang, 3),
    getTeam(lang),
    getContacts(lang),
    getHomeContent(lang),
    getAboutContent(lang),
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

  return (
    <>
      <script
        type="application/ld+json"
        /* < екранується, щоб текст із Sanity не міг закрити тег script. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ScrollProgress />
      {/* overDark: первый экран тёмный, шапка стартует прозрачной */}
      <Header lang={lang} overDark contacts={contacts.data} categories={toMenu(cats.data)} />

      <main id="top" className="relative">
        {/* ── Порядок блоків ──
            Від того, з чим людина прийшла, до того, як звернутися:
            1. перший екран — хто ми, де, телефон і кнопка;
            2. практики — одразу другим блоком: відвідувач шукає свою
               проблему, а не історію фірми;
            3. команда — хто саме веде справу (живе фото партнера);
            4. цифри — докази;
            5. місія й п'ять правил — як працюємо;
            6. блог — свіжі розбори (від двох статей);
            7. форма.
            Фото-банер із цитатою прибрано: він нічого не додавав. */}
        <Hero
          home={home.data}
          directions={cats.data.map((x) => ({ slug: x.slug, title: x.title, icon: x.icon }))}
          phone={{ label: c.phone, href: c.phoneHref }}
        />
        <Practices categories={cats.data} />
        <TeamIntro lang={lang} home={home.data} members={crew.data} author={quoteAuthor} />
        <TrustedBy lang={lang} />
        <Credo home={home.data} mission={about.data.mission} />
        {/* Блог — лише коли є з чого обирати. Одна картка під великим
            заголовком «Розбираємо рішення судів…» виглядає як порожня
            полиця. Блок повернеться сам із другою статтею; блог і так
            є в меню. */}
        {posts.data.length >= 2 && <Journal lang={lang} posts={posts.data} clickable={posts.source === 'sanity'} />}
        <LeadSection contacts={contacts.data} categories={cats.data} />
      </main>

      <Footer contacts={contacts.data} />
      <FloatingActions contacts={contacts.data} />
    </>
  )
}
