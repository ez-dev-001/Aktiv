import type { Metadata } from 'next'
import { absUrl, pageMeta, withCity } from '@/lib/seo'
import { LOCALES } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { categories as staticCategories } from '@/lib/content'
import { getCategories, getPractice } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { HeroChips, PageHero } from '@/components/site/PageHero'
import { Faq, Kicker, NumRows, SEC, SecHead } from '@/components/site/Blocks'
import { Prose } from '@/components/site/Prose'
import { POST_GRID, PostCard } from '@/components/site/PostCard'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { getPracticePeople, postLabel, type PracticePerson } from '@/components/practice/data'
import { CheckList, MarkGlyph, MiniLabel, OtherServices, PersonLine, plural, splitDash } from '@/components/practice/Parts'

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
  if (!p) return { title: 'Практика' }
  /* SEO-поля зі студії мають пріоритет; порожні — назва й короткий опис. */
  return {
    ...pageMeta(lang, `/practices/${p.category?.slug ?? category}/${p.slug}`),
    title: p.seoTitle || withCity(p.title),
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
        ? { title: 'Що входить', accent: 'у послугу', lede: undefined }
        : { title: 'Варіант', accent: 'послуги', lede: undefined }
      : {
          title: n === 2 ? 'Два варіанти' : `${n} ${plural(n, ['варіант', 'варіанти', 'варіантів'])}`,
          accent: '— оберіть свій',
          lede:
            n === 2 && catSlug === 'likvidatsiya-bankrutstvo'
              ? 'Вибір залежить не від бюджету, а від історії підприємства: чим складніша, тим далі має відійти власник.'
              : 'Оберіть варіант, що відповідає вашій ситуації, — або опишіть її, і ми підкажемо.',
        }

  const [title, accent] = splitDash(p.title)
  const faq = (p.faq ?? []).filter((f) => f?.q && f?.a)
  const includes = (p.includes ?? []).filter(Boolean)
  const stages = (p.stages ?? []).filter((s) => s?.title)
  const related = (p.related ?? []).filter((a) => a?.slug && a?.title)
  const hasBody = !!p.body || (p.bodyText?.length ?? 0) > 0
  const others = (cat?.practices ?? []).filter((x) => x.slug !== p.slug)

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
    stages: tint(stages.length > 0),
    faq: tint(faq.length > 0),
    posts: tint(related.length > 0),
  }

  /* «Квиток» — тільки факти з полів. Строку окремим полем немає, тому
     його тут і немає. Перша консультація безкоштовна — публічна умова
     фірми (так написано у формі заявки). */
  const facts: { k: string; v: string }[] = [
    ...(n > 0 ? [{ k: n === 1 ? 'Варіант' : 'Варіанти', v: packages.map((pk) => pk.name).join(' · ') }] : []),
    /* Без тексту послуги немає картки «хто веде» — імʼя переїжджає сюди. */
    ...(!hasBody && people.length > 0 ? [{ k: 'Веде справу', v: people.map((m) => m.name).join(', ') }] : []),
    { k: 'Перша консультація', v: 'Безкоштовно' },
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
      url: absUrl(`/practices/${catSlug}/${p.slug}`),
      areaServed: { '@type': 'Country', name: 'Україна' },
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
          { label: 'Головна', href: prefix || '/' },
          { label: 'Практики', href: `${prefix}/#practices` },
          { label: catTitle, href: catHref },
          { label: title },
        ]}
        /* тире тримається за попереднє слово, а не відкриває рядок акценту */
        title={accent ? `${title}\u00a0—` : title}
        accent={accent}
        lede={p.excerpt}
        aside={
          <div className="grid overflow-hidden rounded-[22px] bg-white/[0.05] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] min-[900px]:ml-auto min-[900px]:max-w-[420px]">
            <dl className="m-0">
              {facts.map((f) => (
                <div key={f.k} className="flex justify-between gap-4 border-b border-on-dark-hair px-[22px] py-[17px]">
                  <dt className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-on-dark-2">{f.k}</dt>
                  <dd className="m-0 text-right font-serif text-[17px] font-semibold leading-[1.3] text-white">{f.v}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={consult} arrow className="mx-[22px] mb-[22px] mt-[22px]">
              Отримати консультацію
            </ButtonLink>
          </div>
        }
      >
        {n > 1 && <HeroChips items={[`${n} ${plural(n, ['варіант', 'варіанти', 'варіантів'])}`]} />}
      </PageHero>

      {/* ── ТЕКСТ + «ХТО ВЕДЕ» ──
          Из Sanity приходит PortableText, из статики — обычные абзацы,
          перенесённые со старого сайта дословно. */}
      {hasBody && (
        <section className={SEC}>
          <div className="shell inner grid items-start gap-[clamp(30px,4vw,64px)] min-[900px]:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 [&>p:first-child]:text-[clamp(17.5px,1.6vw,19.5px)] [&>p:first-child]:leading-[1.6] [&>p:first-child]:text-ink">
              {p.body ? (
                <Prose value={p.body} />
              ) : (
                p.bodyText!.map((t) => (
                  <p key={t.slice(0, 40)} className="mb-5 max-w-[68ch] text-[16.5px] leading-[1.68] text-slate">
                    {t}
                  </p>
                ))
              )}
            </div>

            <aside className="min-[900px]:sticky min-[900px]:top-[calc(var(--hdr)+20px)]">
              <div className="rounded-[22px] bg-white p-6 shadow-[inset_0_0_0_1px_var(--color-hair)]">
                {people.length > 0 ? (
                  <>
                    <h2 className="m-0 mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate">
                      Хто веде справу
                    </h2>
                    <ul className="m-0 grid list-none gap-4 p-0">
                      {people.map((m) => (
                        <li key={m.slug ?? m.name}>
                          <PersonLine m={m} />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <h2 className="m-0 mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate">
                      Поставити питання
                    </h2>
                    <p className="m-0 font-serif text-[20px] leading-[1.3] text-ink">
                      Опишіть ситуацію — юрист оцінить перспективу.
                    </p>
                    <p className="m-0 mt-3 text-[14.5px] leading-[1.6] text-slate">Перша консультація — безкоштовно.</p>
                  </>
                )}
                <ButtonLink href={consult} arrow className="mt-[18px] w-full">
                  Поставити питання
                </ButtonLink>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ── ВАРІАНТИ ПОСЛУГИ ── перша картка біла, остання темна */}
      {n > 0 && (
        <section id="packages" className={`scroll-mt-[var(--hdr)] ${bg.packages} ${SEC}`}>
          <div className="shell inner">
            <SecHead eyebrow="Варіанти" title={packagesHead.title} accent={packagesHead.accent} lede={packagesHead.lede} row />
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
                        <MiniLabel dark={dark}>Кому підходить</MiniLabel>
                        <CheckList items={pk.audience} dark={dark} />
                      </div>
                    )}
                    {pk.includes.length > 0 && (
                      <div>
                        <MiniLabel dark={dark}>Що входить</MiniLabel>
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
                      Обрати «{pk.name}»
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
            <SecHead eyebrow="Що входить" title="Склад" accent="роботи" />
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
              eyebrow="Етапи роботи"
              title="Що відбувається"
              accent="і в якому порядку"
              lede={
                stages.some((s) => s.duration)
                  ? 'Строки орієнтовні: вони залежать від завантаженості реєстраторів і суду.'
                  : undefined
              }
              row
            />
            <NumRows
              items={stages.map((s) => ({
                title: s.title,
                text:
                  s.duration || s.text ? (
                    <>
                      {s.duration && (
                        <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-accent-ink">
                          {s.duration}
                        </span>
                      )}
                      {s.text}
                    </>
                  ) : undefined,
              }))}
            />
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {faq.length > 0 && (
        <section id="faq" className={`scroll-mt-[var(--hdr)] ${bg.faq} ${SEC}`}>
          <div className="shell inner grid gap-[clamp(24px,4vw,64px)] min-[900px]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div>
              <Kicker>Питання</Kicker>
              <h2 className="m-0 mt-3.5 font-serif text-[clamp(30px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
                Часті <em className="text-accent-ink">питання</em>
              </h2>
              <p className="m-0 mt-[18px] max-w-[40ch] text-[15.5px] leading-[1.65] text-slate">
                Не знайшли відповіді — запитайте юриста на безкоштовній консультації.
              </p>
              <ArrowLink href={consult} className="mt-[22px] text-[15px] font-semibold">
                Поставити питання
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
                Статті за темою
              </h2>
              <ArrowLink href={`${prefix}/blog`} className="text-[15px] font-semibold">
                Усі статті
              </ArrowLink>
            </div>
            <ul className={POST_GRID}>
              {related.map((a) => (
                <li key={a.slug}>
                  <PostCard
                    post={{ ...a, excerpt: '', category: postLabel(a.category) }}
                    href={`${prefix}/blog/${a.slug}`}
                    withMedia={false}
                    hideExcerpt
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
        />
      )}
    </PageShell>
  )
}
