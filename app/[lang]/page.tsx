import { CaseLine, ScrollProgress } from '@/components/site/CaseLine'
import { FloatingActions } from '@/components/site/FloatingActions'
import { Header } from '@/components/site/Header'
import {
  CasePath,
  Credo,
  Figures,
  Footer,
  Hero,
  Journal,
  Manifesto,
  Practices,
  PriceTable,
  Promise as PromiseBand,
  Team,
} from '@/components/home/Sections'
import { LeadSection } from '@/components/home/LeadSection'
import { Quiz } from '@/components/quiz/Quiz'
import {
  getCategories,
  getContacts,
  getFigures,
  getHomeContent,
  getPosts,
  getPriceList,
  getQuizzes,
  getTeam,
} from '@/lib/sanity/content'
import { TrustedBy } from '@/components/home/TrustedBy'
import { Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Станции линии дела. id должен совпадать с id секции в разметке —
 * из них CaseLine собирает геометрию пути.
 */
const STATIONS = [
  { id: 'hero', label: 'Кредо' },
  { id: 'credo', label: "П'ять правил" },
  { id: 'path', label: 'Шлях справи' },
  { id: 'practices', label: 'Практики' },
  { id: 'prices', label: 'Вартість' },
  { id: 'team', label: 'Команда' },
  { id: 'trust', label: 'Довіра' },
  { id: 'journal', label: 'Блог' },
  { id: 'contact', label: 'Консультація' },
]

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если настроен и заполнен; иначе статика из lib/content.ts.
     Компонентам всё равно — форма данных одна. */
  const [cats, prices, posts, crew, nums, quizzes, contacts, home] = await Promise.all([
    getCategories(lang),
    getPriceList(lang),
    getPosts(lang, 3),
    getTeam(lang),
    getFigures(lang),
    getQuizzes(lang),
    getContacts(lang),
    getHomeContent(lang),
  ])

  return (
    <>
      <ScrollProgress />
      {/* overDark: первый экран тёмный, шапка стартует прозрачной */}
      <Header lang={lang} overDark contacts={contacts.data} />

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

        {/* ── ВАРТІСТЬ + КАЛЬКУЛЯТОР ── */}
        <section id="prices" className="py-[clamp(64px,9vw,128px)]">
          <div className="shell inner">
            <div className="mb-[clamp(34px,5vw,56px)] max-w-[58ch]">
              <Eyebrow>Вартість</Eyebrow>
              <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">
                Ціни відкриті. Це третє правило кредо, а не маркетинг.
              </Reveal>
            </div>
            <div className="grid items-start gap-[clamp(30px,4vw,56px)] min-[920px]:grid-cols-[1.1fr_0.9fr]">
              <PriceTable rows={prices.data} />
              <Quiz sets={quizzes.data} />
            </div>
          </div>
        </section>

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
