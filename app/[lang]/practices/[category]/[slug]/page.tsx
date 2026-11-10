import type { Metadata } from 'next'
import { absUrl, localePath, pageMeta, withCity } from '@/lib/seo'
import { LOCALES, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { notFound } from 'next/navigation'
import { categories as staticCategories } from '@/lib/content'
import { getCategories, getContacts, getPractice } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { HeroActions, PageHero } from '@/components/site/PageHero'
import { Faq, SEC, SecHead } from '@/components/site/Blocks'
import { ArticleIntro, ArticleSectionView, splitArticle } from '@/components/practice/Article'
import { LawyerCards } from '@/components/practice/Lawyers'
import { StagesLine } from '@/components/practice/Stages'
import { POST_GRID, PostCard } from '@/components/site/PostCard'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { getPracticePeople, postLabel, type PracticePerson } from '@/components/practice/data'
import { CheckList, MarkGlyph, MiniLabel, splitDash } from '@/components/practice/Parts'
import { ConsultCard, FaqSplit, IncludesCard, LawyerPill, OtherServicesCard, practiceImage } from '@/components/v2/Practice'
import { v2text } from '@/lib/v2/content'

/**
 * Сторінка послуги — нова редакція (Figma «A+ · Послуга»).
 *
 * Перший екран із фото напряму, кнопками й плашкою «Справу веде» →
 * текст послуги з карткою «Що входить» і липкою темною карткою
 * консультації та іншими послугами праворуч → (кілька юристів) →
 * варіанти → етапи → FAQ у два стовпці → статті за темою → форма.
 *
 * Кожен блок рисується лише коли для нього є дані: поки Sanity не
 * наповнений, сторінка скромна, але не зламана. Цін на сайті немає —
 * вартість називають після консультації.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    staticCategories.flatMap((c) => c.practices.map((p) => ({ lang, category: c.slug, slug: p.slug }))),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; slug: string }>
}): Promise<Metadata> {
  const { lang, category, slug } = await params
  const p = await getPractice(slug, lang)
  if (!p) return { title: ui(lang).common.practice }
  /* SEO-поля зі студії мають пріоритет; порожні — назва й короткий опис. */
  return {
    ...pageMeta(lang, `/practices/${p.category?.slug ?? category}/${p.slug}`),
    title: p.seoTitle || withCity(p.title, lang),
    description: (p.seoDescription || p.excerpt)?.slice(0, 180),
  }
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ lang: string; category: string; slug: string }>
}) {
  const { lang, category, slug } = await params
  const p = await getPractice(slug, lang)
  if (!p) notFound()

  const [{ data: cats }, linked, { data: contacts }] = await Promise.all([
    getCategories(lang),
    getPracticePeople(p.slug, lang),
    getContacts(lang),
  ])

  const prefix = lang === 'ua' ? '' : `/${lang}`
  const T = ui(lang)
  const t = T.service
  const v = v2text(lang).pp
  const phone = { label: contacts.phone, href: contacts.phoneHref }
  const catSlug = p.category?.slug ?? category
  const cat = cats.find((c) => c.slug === catSlug)
  const catTitle = p.category?.title ?? cat?.title ?? category
  const catHref = `${prefix}/practices/${catSlug}`
  /* Відносне посилання: форма на цій же сторінці, напрям уже обраний. */
  const consult = `?practice=${encodeURIComponent(p.slug)}#contact`

  /* Хто веде: з фото — з «Команди» (привʼязка з обох боків); без Sanity —
     те, що прийшло в самій практиці (lawyers), якщо щось є. */
  const people: PracticePerson[] =
    linked.length > 0
      ? linked
      : (p.lawyers ?? [])
          .filter((l) => l?.name)
          .map((l) => ({ name: l.name, role: l.role ?? '', practices: [p.slug], cats: [catSlug] }))

  /* Вариант могли добавить, заполнив только название — списки
     «Кому підходить» и «Що входить» тогда приходят null. Раньше на
     этом падал рендер всей страницы. */
  const packages = (p.packages ?? [])
    .filter((pk) => pk && pk.name)
    .map((pk) => ({
      ...pk,
      audience: (pk.audience ?? []).filter(Boolean),
      includes: (pk.includes ?? []).filter(Boolean),
    }))
  const n = packages.length

  /* Заголовок блока раньше был зашит под ликвидацию и стоял на любой
     практике с любым числом пакетов. Тексты — без фактов о фирме. */
  const packagesHead =
    n === 1
      ? packages[0]!.audience.length + packages[0]!.includes.length > 0
        ? { title: t.includedTitle, accent: t.includedAccent, lede: undefined }
        : { title: t.optionTitle, accent: t.optionAccent, lede: undefined }
      : {
          title: n === 2 ? t.twoOptions : t.options(n),
          accent: t.chooseYours,
          lede: n === 2 && catSlug === 'likvidatsiya-bankrutstvo' ? t.liquidationLede : t.optionsLede,
        }

  const [title, accent] = splitDash(p.title)
  const faq = (p.faq ?? []).filter((f) => f?.q && f?.a)
  const includes = (p.includes ?? []).filter(Boolean)
  const stages = (p.stages ?? []).filter((s) => s?.title)
  const related = (p.related ?? []).filter((a) => a?.slug && a?.title)
  const hasBody = !!p.body || (p.bodyText?.length ?? 0) > 0
  const others = (cat?.practices ?? []).filter((x) => x.slug !== p.slug)

  /* Стаття: вступ + розділи за h2 (для змісту збоку). */
  const article = p.body ? splitArticle(p.body) : null

  /* «Також веде» — інші практики людини з тих, що є на сайті. */
  const practiceIndex = new Map<string, { title: string; href: string }>(
    cats.flatMap((c) => c.practices.map((x): [string, { title: string; href: string }] => [x.slug, { title: splitDash(x.title)[0], href: `${prefix}/practices/${c.slug}/${x.slug}` }])),
  )
  const alsoOf = (m: PracticePerson) =>
    [...new Set(m.practices)]
      .filter((sl) => sl !== p.slug)
      .map((sl) => practiceIndex.get(sl))
      .filter((x): x is { title: string; href: string } => !!x)
      .map((x) => ({ href: x.href, label: x.title }))

  /* Фон розділів чергується (білий / paper-2) за фактично показаними
     блоками: інакше два сусідні розділи одного кольору зливаються в
     одну смугу з подвійним відступом. Варіанти завжди на paper-2. */
  let prevTint = false
  const tint = (show: boolean, force?: boolean) => {
    if (!show) return ''
    prevTint = force ?? !prevTint
    return prevTint ? 'bg-paper-2' : ''
  }
  const bg = {
    packages: tint(n > 0, true),
    stages: tint(stages.length > 0, people.length > 0 ? false : undefined),
    faq: tint(faq.length > 0),
    posts: tint(related.length > 0),
  }

  /* Розмітка для пошуку: послуга (Service від фірми з головної) і,
     якщо є, питання-відповіді (FAQPage) — їх Google і AI-асистенти
     беруть як готові відповіді. */
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: p.title,
      ...(p.excerpt ? { description: p.excerpt } : {}),
      serviceType: catTitle,
      url: absUrl(localePath(lang, `/practices/${catSlug}/${p.slug}`)),
      areaServed: { '@type': 'Country', name: T.common.country },
      provider: { '@id': absUrl('/#firm') },
    },
    ...(faq.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          },
        ]
      : []),
  ]

  return (
    <PageShell lang={lang} overDark>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <PageHero
        small
        crumbs={[
          { label: T.common.home, href: localeHref(lang, '/') },
          { label: T.common.practices, href: localeHref(lang, '/practices') },
          { label: catTitle, href: catHref },
          { label: title },
        ]}
        lang={lang}
        img={practiceImage(catSlug, p.slug)}
        /* тире тримається за попереднє слово, а не відкриває рядок акценту */
        title={accent ? `${title}\u00a0—` : title}
        accent={accent}
        lede={p.excerpt}
      >
        <HeroActions>
          <ButtonLink href={consult}>{T.common.getConsultation}</ButtonLink>
          <ButtonLink href={phone.href} variant="ghostDark">
            {v.call}
          </ButtonLink>
        </HeroActions>
        {people[0] && <LawyerPill m={people[0]} label={v.leadsService} href={people.length > 1 ? '#lawyers' : '#body'} />}
      </PageHero>

      {/* ── ТЕКСТ ПОСЛУГИ + КАРТКА КОНСУЛЬТАЦІЇ ЗБОКУ ──
          Вступ → «Що входить» → розділи за h2. Праворуч липка темна картка
          (хто веде, кнопки, графік) та інші послуги напряму. */}
      {(hasBody || includes.length > 0 || others.length > 0) && (
        <section id="body" className={`scroll-mt-[var(--hdr)] ${SEC}`}>
          <div className="shell inner grid items-start gap-[clamp(32px,5vw,96px)] min-[1000px]:grid-cols-[minmax(0,740px)_minmax(0,400px)] min-[1000px]:justify-between">
            <article className="min-w-0">
              {article ? (
                <>
                  <ArticleIntro blocks={article.intro as never} />
                  <IncludesCard title={v.included} items={includes} />
                  {article.sections.map((x, i) => (
                    <ArticleSectionView key={x.id} s={x} n={i + 1} />
                  ))}
                </>
              ) : (
                <>
                  {(p.bodyText ?? []).map((t) => (
                    <p key={t.slice(0, 40)} className="mb-5 max-w-[68ch] text-[17px] leading-[1.7] text-[#3b3440]">
                      {t}
                    </p>
                  ))}
                  <IncludesCard title={v.included} items={includes} />
                </>
              )}
            </article>
            <aside className="grid gap-6 min-[1000px]:sticky min-[1000px]:top-[calc(var(--hdr)+28px)]">
              <ConsultCard m={people[0]} consult={consult} phone={phone} hours={contacts.hours} lang={lang} />
              <OtherServicesCard
                title={v.otherServices}
                items={others.map((x) => ({ href: `${catHref}/${x.slug}`, label: splitDash(x.title)[0] }))}
              />
            </aside>
          </div>
        </section>
      )}

      {/* ── ХТО ВЕДЕ СПРАВУ ── окремим блоком лише коли юристів кілька */}
      {people.length > 1 && (
        <section id="lawyers" aria-labelledby="lawyers-h" className={`scroll-mt-[var(--hdr)] bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <SecHead
              title={<span id="lawyers-h">{t.lawyersTitle}</span>}
              accent={t.lawyersAccent}
              lede={t.lawyersLede}
              row
            />
            <LawyerCards
              people={people}
              also={alsoOf}
              label={t.alsoHandles}
            />
          </div>
        </section>
      )}

      {/* ── ВАРІАНТИ ПОСЛУГИ ── перша картка біла, остання темна */}
      {n > 0 && (
        <section id="packages" className={`scroll-mt-[var(--hdr)] ${bg.packages} ${SEC}`}>
          <div className="shell inner">
            <SecHead eyebrow={t.optionsEyebrow} title={packagesHead.title} accent={packagesHead.accent} lede={packagesHead.lede} row />
            <div
              className={`grid gap-3.5 ${
                n === 1 ? 'max-w-[640px]' : n === 2 ? 'min-[860px]:grid-cols-2' : 'min-[860px]:grid-cols-2 min-[1100px]:grid-cols-3'
              }`}
            >
              {packages.map((pk, i) => {
                const dark = n > 1 && i === n - 1
                return (
                  <article
                    key={`${i}-${pk.name}`}
                    className={`relative isolate flex flex-col gap-5 overflow-hidden rounded-[26px] p-[clamp(26px,3.4vw,40px)] ${
                      dark ? 'on-dark bg-ink text-white' : 'bg-white shadow-[inset_0_0_0_1px_var(--color-hair)]'
                    }`}
                  >
                    {dark && (
                      <MarkGlyph className="pointer-events-none absolute -bottom-10 -right-[60px] -z-[1] w-[260px] opacity-[0.13]" />
                    )}
                    <h3
                      className={`m-0 font-serif text-[clamp(28px,3vw,36px)] font-normal leading-[1.1] ${dark ? 'text-white' : 'text-ink'}`}
                    >
                      {pk.name}
                    </h3>
                    {pk.audience.length > 0 && (
                      <div>
                        <MiniLabel dark={dark}>{t.suits}</MiniLabel>
                        <CheckList items={pk.audience} dark={dark} />
                      </div>
                    )}
                    {pk.includes.length > 0 && (
                      <div>
                        <MiniLabel dark={dark}>{t.included}</MiniLabel>
                        <CheckList items={pk.includes} dark={dark} />
                      </div>
                    )}
                    {pk.note && (
                      <p className={`m-0 text-[13.5px] leading-snug ${dark ? 'text-on-dark-2' : 'text-slate-2'}`}>{pk.note}</p>
                    )}
                    {/* Сразу заявкой на эту услугу и этот вариант: человек
                        уже выбрал, переспрашивать его в форме незачем. */}
                    <ButtonLink
                      href={`?practice=${encodeURIComponent(p.slug)}&package=${encodeURIComponent(pk.name)}#contact`}
                      arrow
                      className="mt-auto self-start"
                    >
                      {t.choose(pk.name)}
                    </ButtonLink>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── ЕТАПИ ── */}
      {stages.length > 0 && (
        <section id="stages" className={`scroll-mt-[var(--hdr)] ${bg.stages} ${SEC}`}>
          <div className="shell inner">
            <SecHead
              eyebrow={t.stagesEyebrow}
              title={t.stagesTitle}
              accent={t.stagesAccent}
              lede={stages.some((s) => s.duration) ? t.stagesLede : undefined}
              row
            />
            <StagesLine stages={stages} />
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {faq.length > 0 && (
        <div className={bg.faq}>
          <FaqSplit consult={consult} lang={lang}>
            <Faq items={faq.map((f) => ({ q: f.q, a: f.a }))} />
          </FaqSplit>
        </div>
      )}

      {/* ── СТАТТІ ЗА ТЕМОЮ ── пости, де ця практика в «Повʼязаних» */}
      {related.length > 0 && (
        <section aria-labelledby="posts-h" className={`${bg.posts} ${SEC}`}>
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
              {related.map((a) => (
                <li key={a.slug}>
                  <PostCard
                    post={{ ...a, excerpt: '', category: postLabel(a.category, lang) }}
                    href={`${prefix}/blog/${a.slug}`}
                    withMedia={false}
                    hideExcerpt
                    lang={lang}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

    </PageShell>
  )
}
