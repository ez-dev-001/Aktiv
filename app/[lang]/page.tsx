import { CaseLine, ScrollProgress } from '@/components/site/CaseLine'
import { FloatingActions } from '@/components/site/FloatingActions'
import { Header } from '@/components/site/Header'
import { toMenu } from '@/lib/menu'
import {
  CasePath,
  Credo,
  Figures,
  Footer,
  Hero,
  Journal,
  Manifesto,
  Practices,
  Promise as PromiseBand,
  Team,
} from '@/components/home/Sections'
import { LeadSection } from '@/components/home/LeadSection'
import {
  getCategories,
  getContacts,
  getFigures,
  getHomeContent,
  getPosts,
  getTeam,
} from '@/lib/sanity/content'
import { TrustedBy } from '@/components/home/TrustedBy'

/**
 * Станции линии дела. id должен совпадать с id секции в разметке —
 * из них CaseLine собирает геометрию пути.
 */
const STATIONS = [
  { id: 'hero', label: 'Кредо' },
  { id: 'credo', label: "П'ять правил" },
  { id: 'path', label: 'Шлях справи' },
  { id: 'practices', label: 'Практики' },
  { id: 'team', label: 'Команда' },
  { id: 'trust', label: 'Довіра' },
  { id: 'journal', label: 'Блог' },
  { id: 'contact', label: 'Консультація' },
]

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если настроен и заполнен; иначе статика из lib/content.ts.
     Компонентам всё равно — форма данных одна. */
  const [cats, posts, crew, nums, contacts, home] = await Promise.all([
    getCategories(lang),
    getPosts(lang, 3),
    getTeam(lang),
    getFigures(lang),
    getContacts(lang),
    getHomeContent(lang),
  ])

  return (
    <>
      <ScrollProgress />
      {/* overDark: первый экран тёмный, шапка стартует прозрачной */}
      <Header lang={lang} overDark contacts={contacts.data} categories={toMenu(cats.data)} />

      <main id="top" className="relative">
        {/* линия дела: геометрия строится из offsetTop секций ниже */}
        <CaseLine stations={STATIONS} />

        <Hero home={home.data} />
        <Figures figures={nums.data} />
        <PromiseBand items={home.data.promises} />
        <Credo home={home.data} />
        <CasePath home={home.data} />
        <Manifesto home={home.data} />
        <Practices categories={cats.data} />

        <Team members={crew.data} />
        <TrustedBy lang={lang} />
        <Journal lang={lang} posts={posts.data} clickable={posts.source === 'sanity'} />
        <LeadSection contacts={contacts.data} categories={cats.data} />
      </main>

      <Footer contacts={contacts.data} />
      <FloatingActions contacts={contacts.data} />
    </>
  )
}
