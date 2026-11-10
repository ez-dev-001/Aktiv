import type { Metadata } from 'next'
import { pageMeta, withCity } from '@/lib/seo'
import { LOCALES, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { notFound } from 'next/navigation'
import { categories as staticCategories } from '@/lib/content'
import { getCategories, getContacts } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { HeroActions, PageHero } from '@/components/site/PageHero'
import { SEC } from '@/components/site/Blocks'
import { POST_GRID, PostCard, needsMedia } from '@/components/site/PostCard'
import { ButtonLink } from '@/components/ui/Button'
import { getCategoryPeople, getCategoryPosts } from '@/components/practice/data'
import { splitDash } from '@/components/practice/Parts'
import { LawyerPill, LeadLawyer, OtherAreas, ProcessSteps, ServiceRows, practiceImage } from '@/components/v2/Practice'
import { v2text } from '@/lib/v2/content'

/**
 * Сторінка напряму практики — нова редакція (Figma «A+ · Напрям практики»).
 *
 * Перший екран із фото напряму, кнопками й плашкою «Напрям веде» →
 * список послуг одним білим блоком → «Як ми працюємо» (4 кроки) →
 * юрист напряму (лише коли в студії хтось привʼязаний) → статті за
 * темою (якщо є) → інші напрями → форма й адреса (PageShell).
 * Кейсів і відгуків немає: вигадані історії на сайті юрфірми неприпустимі.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => staticCategories.map((c) => ({ lang, category: c.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}): Promise<Metadata> {
  const { lang, category } = await params
  const { data } = await getCategories(lang)
  const cat = data.find((c) => c.slug === category)
  if (!cat) return { title: ui(lang).common.practice }
  return {
    ...pageMeta(lang, `/practices/${cat.slug}`),
    title: cat.seoTitle || withCity(cat.title, lang),
    description: (cat.seoDescription || cat.excerpt).slice(0, 180),
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}) {
  const { lang, category } = await params
  const { data } = await getCategories(lang)
  const cat = data.find((c) => c.slug === category)
  if (!cat) notFound()

  const [people, posts, { data: contacts }] = await Promise.all([
    getCategoryPeople(cat.slug, lang),
    getCategoryPosts(cat.slug, lang, 3),
    getContacts(lang),
  ])

  const prefix = lang === 'ua' ? '' : `/${lang}`
  /* Відносне посилання: форма на цій же сторінці й сама обере напрям. */
  const consult = `?practice=cat:${encodeURIComponent(cat.slug)}#contact`
  const T = ui(lang)
  const v = v2text(lang).pp
  const n = cat.practices.length
  const lead = people[0]
  const phone = { label: contacts.phone, href: contacts.phoneHref }
  const withMedia = needsMedia(posts)
  const others = data
    .filter((c) => c.slug !== cat.slug)
    .map((c) => ({ href: `${prefix}/practices/${c.slug}`, label: c.title }))

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        crumbs={[
          { label: T.common.home, href: localeHref(lang, '/') },
          { label: T.common.practices, href: localeHref(lang, '/practices') },
          { label: cat.title },
        ]}
        lang={lang}
        img={practiceImage(cat.slug)}
        title={cat.title}
        lede={cat.excerpt}
      >
        <HeroActions>
          <ButtonLink href={consult}>{T.common.getConsultation}</ButtonLink>
          <ButtonLink href={phone.href} variant="ghostDark">
            {v.call}
          </ButtonLink>
        </HeroActions>
        {lead && <LawyerPill m={lead} label={v.leads} href="#lawyer" />}
      </PageHero>

      {/* ── ПОСЛУГИ НАПРЯМУ ── */}
      {n > 0 && (
        <section id="services" className={`scroll-mt-[var(--hdr)] ${SEC}`}>
          <div className="shell inner">
            <div className="mb-[clamp(28px,4vw,48px)] grid items-end gap-5 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
              <h2 className="m-0 font-serif text-[clamp(38px,5vw,64px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">{v.servicesTitle}</h2>
              <p className="m-0 text-[clamp(15.5px,1.2vw,17px)] leading-[1.6] text-slate">{v.servicesLede}</p>
            </div>
            <ServiceRows
              items={cat.practices.map((p) => ({
                title: splitDash(p.title)[0],
                text: p.excerpt,
                href: `${prefix}/practices/${cat.slug}/${p.slug}`,
              }))}
            />
          </div>
        </section>
      )}

      <ProcessSteps lang={lang} />

      {/* ── ХТО ВЕДЕ НАПРЯМ ── лише якщо хтось привʼязаний у студії */}
      {lead && (
        <LeadLawyer
          m={lead}
          label={v.leads}
          consult={consult}
          phone={phone}
          lang={lang}
        />
      )}

      {/* ── СТАТТІ ЗА ТЕМОЮ ── лише привʼязані до практик напряму */}
      {posts.length > 0 && (
        <section aria-labelledby="posts-h" className={`bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <div className="mb-[clamp(28px,3vw,36px)] flex flex-wrap items-end justify-between gap-4">
              <h2
                id="posts-h"
                className="m-0 font-serif text-[clamp(30px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink"
              >
                {T.common.relatedArticles}
              </h2>
              <ButtonLink href={`${prefix}/blog`} variant="ghost">
                {T.common.allArticles}
              </ButtonLink>
            </div>
            <ul className={POST_GRID}>
              {posts.map((a) => (
                <li key={a.slug}>
                  <PostCard post={a} href={`${prefix}/blog/${a.slug}`} withMedia={withMedia} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <OtherAreas title={v.otherAreas} items={others} />
    </PageShell>
  )
}
