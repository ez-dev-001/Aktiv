import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { Cover } from '@/components/site/Cover'
import { hasImage, imageUrl } from '@/lib/sanity/image'
import { HTML_LANG, LOCALES, asLocale, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { notFound } from 'next/navigation'
import { blogCategoryId, getBlog, getPost, getPostSlugs, getTeam, teamPhoto, type Post } from '@/lib/sanity/content'
import { SITE_URL } from '@/lib/site'
import { PageShell } from '@/components/site/PageShell'
import { HeroChips, PageHero } from '@/components/site/PageHero'
import { RingAvatar, SEC } from '@/components/site/Blocks'
import { needsMedia } from '@/components/site/PostCard'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { ArticleBody } from '@/components/blog/ArticleBody'
import { Share, Toc } from '@/components/blog/ArticleAside'
import { BlogCard, fmtDate, type CardAuthor } from '@/components/blog/BlogCard'
import { readingMinutes, splitByH2 } from '@/components/blog/text'

/**
 * Страница статьи.
 *
 * Существует только для того, что реально лежит в Sanity: статику
 * открывать нечего, там одни анонсы. Отсюда generateStaticParams,
 * который спрашивает у Sanity список slug'ов — до наполнения он вернёт
 * пустой массив, и маршрут просто не будет сгенерирован.
 *
 * dynamicParams оставлен включённым: статья, добавленная после сборки,
 * отрендерится по запросу, а не потребует передеплоя.
 */

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return LOCALES.flatMap((lang) => slugs.map((slug) => ({ lang, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const p = await getPost(slug, lang)
  if (!p) return { title: ui(lang).common.article }
  /* Превью для соцсетей и мессенджеров — из той же обложки, кадром
     1200×630: этот размер Facebook, Telegram, Viber и LinkedIn
     показывают без обрезки. Обрезает CDN по точке фокуса из студии,
     поэтому главное на фото не уедет за край и здесь. Без обложки
     превью будет с общей картинкой сайта (public/og.jpg). Формат — jpg:
     auto=format отдал бы AVIF, а Facebook и Viber его не показывают. */
  const og = hasImage(p.cover)
    ? [{ url: imageUrl(p.cover, 1200, 630).replace('auto=format', 'fm=jpg'), width: 1200, height: 630, alt: p.cover.alt?.trim() || p.title }]
    : undefined
  const base = pageMeta(lang, `/blog/${p.slug}`)
  return {
    ...base,
    title: p.seoTitle || p.title,
    description: (p.seoDescription || p.excerpt)?.slice(0, 180),
    /* Обкладинка статті — якщо є; інакше загальна картинка сайту з base. */
    openGraph: { ...base.openGraph, type: 'article', publishedTime: p.publishedAt, ...(og ? { images: og } : {}) },
    twitter: og ? { card: 'summary_large_image', images: og.map((i) => i.url) } : base.twitter,
  }
}

const SIDE_LABEL = 'm-0 mb-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate'

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const post = await getPost(slug, lang)
  if (!post) notFound()

  const prefix = lang === 'ua' ? '' : `/${lang}`
  const url = `${SITE_URL}${prefix}/blog/${post.slug}`
  const T = ui(lang)
  const t = T.post

  /* «Читайте також»: свіжі статті, спершу тієї ж рубрики. Окремого
     поля «повʼязані» в схемі немає — беремо стрічку. */
  const [{ data: feed, source }, { data: team }] = await Promise.all([getBlog(lang, '', 12), getTeam(lang)])
  const related =
    source === 'sanity'
      ? feed
          .filter((p) => p.slug !== post.slug)
          .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
          .slice(0, 3)
      : []

  /* Автор у статті — імʼя й роль; фото — з картки в команді. */
  const member = (name?: string) => (name ? team.find((t) => t.name === name) : undefined)
  const cardAuthor = (p: Post): CardAuthor | undefined =>
    p.author ? { name: p.author, photo: teamPhoto(member(p.author)?.photoUrl, 120) } : undefined
  const m = member(post.author)
  const author = post.author
    ? { name: post.author, role: post.authorRole || m?.role, photo: teamPhoto(m?.photoUrl, 200) }
    : undefined

  const minutes = readingMinutes(post.body)
  const date = fmtDate(post.publishedAt, lang)
  const toc = splitByH2(post.body).flatMap((s) => (s.heading ? [s.heading] : []))
  const catId = blogCategoryId(post.category, lang)
  /* Одна повʼязана практика — форма одразу обере її напрям. Кілька —
     вгадувати не беремося. */
  const consult = post.practices?.length === 1 ? `?practice=${post.practices[0]?.slug}#contact` : '#contact'

  /* ── Структуровані дані (schema.org Article) ──
     Ті самі дані, що на сторінці; видавець — фірма з головної (#firm). */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title.slice(0, 110),
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(hasImage(post.cover) ? { image: imageUrl(post.cover, 1200, 630) } : {}),
    ...(author ? { author: { '@type': 'Person', name: author.name, ...(author.role ? { jobTitle: author.role } : {}) } } : {}),
    publisher: { '@type': 'LegalService', '@id': `${SITE_URL}/#firm`, name: T.common.firmFull },
    mainEntityOfPage: url,
    inLanguage: HTML_LANG[asLocale(lang)],
  }

  const callout = (
    <aside
      aria-label={t.calloutAria}
      className="my-[34px] grid max-w-[68ch] gap-4 rounded-[22px] bg-accent-wash p-[26px] shadow-[inset_0_0_0_1px_#f6d4de] min-[700px]:grid-cols-[minmax(0,1fr)_auto] min-[700px]:items-center"
    >
      <div>
        <p className="m-0 font-serif text-[21px] font-semibold leading-[1.25] text-ink">{t.calloutTitle}</p>
        <p className="m-0 mt-1 text-[14.5px] leading-[1.55] text-slate">
          {t.calloutText}
        </p>
      </div>
      <ButtonLink href={consult} size="sm" arrow className="justify-self-start">
        {T.common.getConsultation}
      </ButtonLink>
    </aside>
  )

  const share = <Share url={url} title={post.title} />

  return (
    <PageShell lang={lang} overDark>
      <script
        type="application/ld+json"
        /* < екранується, щоб текст із Sanity не міг закрити тег script. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <article>
        <PageHero
          compact
          small
          crumbs={[
            { label: T.common.home, href: localeHref(lang, '/') },
            { label: T.common.blog, href: `${prefix}/blog` },
            { label: post.category || T.common.article, href: catId ? `${prefix}/blog?cat=${catId}` : undefined },
          ]}
          lang={lang}
          title={post.title}
          lede={post.excerpt && post.excerpt.trim() !== post.title.trim() ? post.excerpt : undefined}
        >
          <HeroChips
            items={[post.category, date, minutes ? T.common.minRead(minutes) : null].filter(
              (x): x is string => !!x,
            )}
          />
          {author && (
            <div className="mt-[26px] flex items-center gap-3.5">
              <RingAvatar src={author.photo} name={author.name} className="size-[64px]" />
              <span>
                <b className="block font-serif text-[18px] font-semibold leading-[1.25] text-white">{author.name}</b>
                {author.role && <small className="mt-0.5 block text-[13.5px] text-accent-soft">{author.role}</small>}
              </span>
            </div>
          )}
        </PageHero>

        <section id="body" className="py-[clamp(40px,6vw,88px)]">
          <div className="shell inner grid items-start gap-[clamp(28px,4vw,64px)] min-[960px]:grid-cols-[240px_minmax(0,1fr)]">
            {/* компʼютер: липка колонка зліва */}
            <aside className="sticky top-[calc(var(--hdr)+24px)] grid gap-[26px] max-[959px]:hidden">
              {toc.length > 0 && <Toc items={toc} />}
              {share}
            </aside>

            <div className="min-w-0">
              {/* телефон: зміст згорнутий над текстом */}
              {toc.length > 0 && (
                <details className="group mb-7 rounded-[18px] bg-white px-5 shadow-[inset_0_0_0_1px_var(--color-hair)] min-[960px]:hidden">
                  <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink [&::-webkit-details-marker]:hidden">
                    {t.toc(toc.length)}
                    <span aria-hidden="true" className="text-[18px] leading-none text-accent-ink transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="pb-3">
                    <Toc items={toc} />
                  </div>
                </details>
              )}

              {/* Обкладинка — лише справжня; без неї текст починається одразу. */}
              <Cover
                image={post.cover}
                alt={post.title}
                ratio={16 / 9}
                widths={[640, 960, 1280, 1600]}
                sizes="(min-width: 1260px) 820px, (min-width: 960px) 62vw, 92vw"
                priority
                className="mb-[clamp(28px,4vw,44px)] rounded-[24px]"
              />

              {post.body ? (
                <ArticleBody body={post.body} middle={callout} />
              ) : (
                <>
                  <p className="m-0 max-w-[60ch] text-[16px] leading-relaxed text-slate-2">{t.noBody}</p>
                  {callout}
                </>
              )}

              {/* ── Стосується практик ── */}
              {post.practices && post.practices.length > 0 && (
                <div className="mt-10">
                  <p className={SIDE_LABEL}>{t.relatedPractices}</p>
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {post.practices.map((pr) => (
                      <li key={pr.slug}>
                        <a
                          href={`${prefix}/practices/${pr.category}/${pr.slug}`}
                          className="inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] transition-[color,box-shadow] hover:text-accent-ink hover:shadow-[inset_0_0_0_1px_var(--color-slate-2)]"
                        >
                          {pr.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Автор ── */}
              {author && (
                <div className="mt-10 grid gap-[18px] rounded-[22px] bg-paper-2 p-[26px] min-[700px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[700px]:items-center">
                  <RingAvatar src={author.photo} name={author.name} className="size-[72px]" />
                  <div>
                    <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-2">{t.author}</p>
                    <p className="m-0 mt-1 font-serif text-[18px] font-semibold leading-[1.25] text-ink">{author.name}</p>
                    {author.role && <p className="m-0 mt-0.5 text-[13.5px] text-accent-ink">{author.role}</p>}
                  </div>
                  <ButtonLink href={consult} size="sm" arrow className="justify-self-start">
                    {T.common.bookConsultation}
                  </ButtonLink>
                </div>
              )}

              {/* телефон: «Поділитися» — після тексту, коли вже прочитали */}
              <div className="mt-9 min-[960px]:hidden">{share}</div>
            </div>
          </div>
        </section>
      </article>

      {/* ── Читайте також ── */}
      {related.length > 0 && (
        <section aria-labelledby="more" className={`bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <div className="mb-[30px] flex flex-wrap items-end justify-between gap-4">
              <h2 id="more" className="m-0 font-serif text-[clamp(30px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
                {t.readAlso}
              </h2>
              <ArrowLink href={`${prefix}/blog`} className="text-[15px] font-semibold">
                {T.common.allArticles}
              </ArrowLink>
            </div>
            <ul className="m-0 grid list-none gap-[18px] p-0 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <BlogCard
                    post={p}
                    href={`${prefix}/blog/${p.slug}`}
                    withMedia={needsMedia(related)}
                    author={cardAuthor(p)}
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
