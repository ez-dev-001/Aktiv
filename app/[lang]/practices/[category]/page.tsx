import type { Metadata } from 'next'
import { pageMeta, withCity } from '@/lib/seo'
import { LOCALES, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { notFound } from 'next/navigation'
import { categories as staticCategories } from '@/lib/content'
import { getCategories, getContacts } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { DownLink, HeroActions, PageHero } from '@/components/site/PageHero'
import { Band, NumRows, SEC, SecHead } from '@/components/site/Blocks'
import { POST_GRID, PostCard, needsMedia } from '@/components/site/PostCard'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { TrustedBy } from '@/components/home/TrustedBy'
import { getCategoryPeople, getCategoryPosts } from '@/components/practice/data'
import { LeadTeam, splitConj, splitDash } from '@/components/practice/Parts'

/**
 * Сторінка напряму практики — у форматі головної (armada.law).
 *
 * Перший екран → «хто веде напрям» (лише коли в студії хтось
 * привʼязаний до його практик) → пронумеровані послуги з посиланнями →
 * «Нам довіряють» → статті за темою (якщо є привʼязані) → Telegram →
 * форма (PageShell). Кейсів немає: даних під них поки нема, а
 * вигадані історії на сайті юрфірми неприпустимі.
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
  const t = T.category
  const [title, accent] = splitConj(cat.title, lang)
  const n = cat.practices.length
  const telegram = contacts.messengers.find((m) => /telegram/i.test(m.label) || /t\.me\//i.test(m.href))
  const withMedia = needsMedia(posts)

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        crumbs={[
          { label: T.common.home, href: localeHref(lang, '/') },
          { label: T.common.practices, href: localeHref(lang, '/practices') },
          { label: cat.title },
        ]}
        lang={lang}
        title={title}
        accent={accent}
        lede={cat.excerpt}
      >
        <HeroActions>
          <ButtonLink href={consult} arrow>
            {T.common.getConsultation}
          </ButtonLink>
          {n > 0 && (
            <DownLink href="#services">
              {T.common.services(n)}
            </DownLink>
          )}
        </HeroActions>
      </PageHero>

      {/* ── ХТО ВЕДЕ НАПРЯМ ── лише якщо хтось привʼязаний у студії */}
      {people.length > 0 && <LeadTeam people={people} contactHref={consult} lang={lang} />}

      {/* ── ПОСЛУГИ НАПРЯМУ ── */}
      {n > 0 && (
        <section id="services" className={`scroll-mt-[var(--hdr)] bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <SecHead
              eyebrow={t.services}
              title={t.whatWeDo}
              lede={t.servicesLede}
              row
            />
            <NumRows
              items={cat.practices.map((p) => ({
                title: splitDash(p.title)[0],
                text: p.excerpt,
                href: `${prefix}/practices/${cat.slug}/${p.slug}`,
              }))}
            />
          </div>
        </section>
      )}

      <TrustedBy lang={lang} />

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
              <ArrowLink href={`${prefix}/blog`} className="text-[15px] font-semibold">
                {T.common.allArticles}
              </ArrowLink>
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

      {/* ── TELEGRAM ── лише якщо канал є в контактах */}
      {telegram && (
        /* Без статей перед банером — «Нам довіряють» на тому ж тлі: його
            нижній відступ уже є, повний верхній зробив би діру. Невеликий
            лишається на випадок, коли блоку довіри немає (у проді без логотипів). */
        <section aria-label={t.telegramAria} className={posts.length > 0 ? SEC : 'pb-[clamp(56px,8vw,112px)] pt-[clamp(12px,2vw,24px)]'}>
          <div className="shell inner">
            <Band
              dark
              title={t.telegramTitle(cat.title)}
              accent={t.telegramAccent}
              text={contacts.hours ? t.telegramHours(contacts.hours) : undefined}
              actions={
                <ButtonLink href={telegram.href} target="_blank" rel="noopener noreferrer" arrow>
                  {t.telegramButton}
                </ButtonLink>
              }
            />
          </div>
        </section>
      )}
    </PageShell>
  )
}
