import type { Metadata } from 'next'
import { absUrl, localePath, pageMeta, withCity } from '@/lib/seo'
import { LOCALES, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { notFound } from 'next/navigation'
import { categories as staticCategories } from '@/lib/content'
import { getCategories, getPractice } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { HeroChips, PageHero } from '@/components/site/PageHero'
import { Faq, Kicker, NumRows, SEC, SecHead } from '@/components/site/Blocks'
import { Prose } from '@/components/site/Prose'
import { ArticleIntro, ArticleSectionView, readMinutes, splitArticle } from '@/components/practice/Article'
import { Toc } from '@/components/practice/Toc'
import { FaceStack, LawyerCards } from '@/components/practice/Lawyers'
import { StagesLine } from '@/components/practice/Stages'
import { POST_GRID, PostCard } from '@/components/site/PostCard'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { getPracticePeople, postLabel, type PracticePerson } from '@/components/practice/data'
import { CheckList, MarkGlyph, MiniLabel, OtherServices, splitDash } from '@/components/practice/Parts'

/**
 * Сторінка послуги — у форматі головної (armada.law).
 *
 * Перший екран з «квитком» (факти лише з полів послуги) → текст і липка
 * картка «хто веде справу» → варіанти послуги → що входить / етапи (якщо
 * заповнені) → FAQ → статті за темою → інші послуги напряму → форма.
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

  const [{ data: cats }, linked] = await Promise.all([getCategories(lang), getPracticePeople(p.slug, lang)])

  const prefix = lang === 'ua' ? '' : `/${lang}`
  const T = ui(lang)
  const t = T.service
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
  const toc = (article?.sections ?? []).map((x) => ({ id: x.id, title: x.title }))
  const minutes = p.body ? readMinutes(p.body) : 0

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
    includes: tint(includes.length > 0),
    stages: tint(stages.length > 0, people.length > 0 ? false : undefined),
    faq: tint(faq.length > 0),
    posts: tint(related.length > 0),
  }

  /* «Квиток» — тільки факти з полів. Строку окремим полем немає, тому
     його тут і немає. Перша консультація безкоштовна — публічна умова
     фірми (так написано у формі заявки). */
  const facts: { k: string; v: string }[] = [
    ...(n > 0 ? [{ k: n === 1 ? t.factOption : t.factOptions, v: packages.map((pk) => pk.name).join(' · ') }] : []),
    /* Без тексту послуги немає картки «хто веде» — імʼя переїжджає сюди. */
    { k: t.factFirst, v: t.factFree },
  ]

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
        /* тире тримається за попереднє слово, а не відкриває рядок акценту */
        title={accent ? `${title}\u00a0—` : title}
        accent={accent}
        lede={p.excerpt}
        aside={
          <div className="grid overflow-hidden rounded-[22px] bg-white/[0.05] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] min-[900px]:ml-auto min-[900px]:max-w-[420px]">
            {people.length > 0 && (
              <a href="#lawyers" className="group flex items-center gap-4 border-b border-on-dark-hair px-[22px] py-[18px] no-underline">
                <FaceStack people={people} />
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.13em] text-on-dark-2">{t.leads(people.length)}</span>
                  <span className="mt-1 block font-serif text-[16.5px] font-semibold leading-[1.3] text-white transition-colors group-hover:text-accent-soft">
                    {people.map((m) => m.name).join(', ')}
                  </span>
                </span>
              </a>
            )}
            <dl className="m-0">
              {facts.map((f) => (
                <div key={f.k} className="flex justify-between gap-4 border-b border-on-dark-hair px-[22px] py-[17px]">
                  <dt className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-on-dark-2">{f.k}</dt>
                  <dd className="m-0 text-right font-serif text-[17px] font-semibold leading-[1.3] text-white">{f.v}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={consult} arrow className="mx-[22px] mb-[22px] mt-[22px]">
              {T.common.getConsultation}
            </ButtonLink>
          </div>
        }
      >
        {(n > 1 || minutes > 1) && (
          <HeroChips items={[...(n > 1 ? [t.options(n)] : []), ...(minutes > 1 ? [t.readMin(minutes)] : [])]} />
        )}
      </PageHero>

      {/* ── ТЕКСТ ЯК СТАТТЯ ──
          Зміст збоку (липкий) + вступ і пронумеровані розділи. */}
      {hasBody && (
        <section className={SEC}>
          <div
            className="shell inner grid items-start gap-[clamp(30px,5vw,88px)] min-[1000px]:grid-cols-[268px_minmax(0,1fr)]"
          >
            {/* зміст — від двох розділів; картка з кнопкою — завжди */}
            <aside className="hidden min-[1000px]:sticky min-[1000px]:top-[calc(var(--hdr)+28px)] min-[1000px]:block">
                <Toc items={toc} label={t.contents} />
                <div className={`${toc.length > 1 ? 'mt-8' : ''} rounded-[20px] bg-paper-2 p-5`}>
                  <p className="m-0 font-serif text-[18px] leading-[1.3] text-ink">{t.describe}</p>
                  <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-slate">{T.common.firstConsultFree}</p>
                  <ButtonLink href={consult} arrow className="mt-4 w-full">
                    {T.common.askQuestion}
                  </ButtonLink>
                </div>
            </aside>
            <article className="min-w-0 max-w-[760px]">
              {article ? (
                <>
                  <ArticleIntro blocks={article.intro as never} />
                  {article.sections.map((x, i) => (
                    <ArticleSectionView key={x.id} s={x} n={i + 1} />
                  ))}
                </>
              ) : (
                p.bodyText!.map((t) => (
                  <p key={t.slice(0, 40)} className="mb-5 max-w-[68ch] text-[16.5px] leading-[1.68] text-slate">
                    {t}
                  </p>
                ))
              )}
            </article>
          </div>
        </section>
      )}

      {/* ── ХТО ВЕДЕ СПРАВУ ── портрети, як на старому сайті */}
      {people.length > 0 && (
        <section id="lawyers" aria-labelledby="lawyers-h" className={`scroll-mt-[var(--hdr)] bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <SecHead
              eyebrow={t.lawyersEyebrow}
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

      {/* ── ЩО ВХОДИТЬ ── (коли пакета немає, а склад робіт заповнений) */}
      {includes.length > 0 && (
        <section id="includes" className={`scroll-mt-[var(--hdr)] ${bg.includes} ${SEC}`}>
          <div className="shell inner">
            <SecHead eyebrow={t.included} title={t.scopeTitle} accent={t.scopeAccent} />
            <div className="rounded-[26px] bg-white p-[clamp(26px,3.4vw,40px)] shadow-[inset_0_0_0_1px_var(--color-hair)] [&_ul]:min-[760px]:grid-cols-2 [&_ul]:min-[760px]:gap-x-10">
              <CheckList items={includes} />
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
        <section id="faq" className={`scroll-mt-[var(--hdr)] ${bg.faq} ${SEC}`}>
          <div className="shell inner grid gap-[clamp(24px,4vw,64px)] min-[900px]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div>
              <Kicker>{T.common.questions}</Kicker>
              <h2 className="m-0 mt-3.5 font-serif text-[clamp(30px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
                {t.faqTitle} <em className="text-accent-ink">{t.faqAccent}</em>
              </h2>
              <p className="m-0 mt-[18px] max-w-[40ch] text-[15.5px] leading-[1.65] text-slate">
                {t.faqText}
              </p>
              <ArrowLink href={consult} className="mt-[22px] text-[15px] font-semibold">
                {T.common.askQuestion}
              </ArrowLink>
            </div>
            <Faq items={faq.map((f) => ({ q: f.q, a: f.a }))} />
          </div>
        </section>
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

      {/* ── ІНШІ ПОСЛУГИ НАПРЯМУ ── */}
      {others.length > 0 && (
        <OtherServices
          title={catTitle}
          count={cat?.practices.length ?? others.length + 1}
          href={catHref}
          items={others.map((x) => ({ href: `${catHref}/${x.slug}`, label: splitDash(x.title)[0] }))}
          afterHero={!hasBody && !n && !includes.length && !stages.length && !faq.length && !related.length}
          lang={lang}
        />
      )}
    </PageShell>
  )
}
