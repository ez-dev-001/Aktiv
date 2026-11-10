import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { hasImage, imageUrl } from '@/lib/sanity/image'
import { HTML_LANG, LOCALES, asLocale, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { notFound } from 'next/navigation'
import { blogCategoryId, getBlog, getPost, getPostSlugs, getTeam, teamPhoto, type Post } from '@/lib/sanity/content'
import { SITE_URL } from '@/lib/site'
import { PageShell } from '@/components/site/PageShell'
import { PageHero } from '@/components/site/PageHero'
import { RingAvatar, SEC } from '@/components/site/Blocks'
import { needsMedia } from '@/components/site/PostCard'
import { ButtonLink } from '@/components/ui/Button'
import { CtaBand } from '@/components/v2/Practice'
import { v2text } from '@/lib/v2/content'
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

/* Фото першого екрана, коли в статті немає обкладинки (public/v2/img). */
const NEWS_IMG = ['n-court', 'n-gavel', 'n-code', 'n-papers', 'n-tower', 'n-pen']

const SIDE_LABEL = 'm-0 mb-2.5 text-[13px] font-medium text-slate'

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
  const v = v2text(lang).pp

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
          small
          serif
          crumbs={[
            { label: T.common.home, href: localeHref(lang, '/') },
            { label: T.common.blog, href: `${prefix}/blog` },
            { label: post.category || T.common.article, href: catId ? `${prefix}/blog?cat=${catId}` : undefined },
          ]}
          lang={lang}
          photoUrl={hasImage(post.cover) ? imageUrl(post.cover, 1800, 1000) : undefined}
          img={hasImage(post.cover) ? undefined : NEWS_IMG[[...post.slug].reduce((h, c) => h + c.charCodeAt(0), 0) % NEWS_IMG.length]}
          title={post.title}
          lede={post.excerpt && post.excerpt.trim() !== post.title.trim() ? post.excerpt : undefined}
        >
          <p className="m-0 mt-[22px] flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-white/70">
            {post.category && (
              <span className="rounded-full bg-accent/20 px-3 py-1.5 text-[13px] font-medium text-accent-soft">{post.category}</span>
            )}
            {date && <time dateTime={post.publishedAt}>{date}</time>}
            {!!minutes && (
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {T.common.minRead(minutes)}
              </span>
            )}
          </p>
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
                  <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-medium text-ink [&::-webkit-details-marker]:hidden">
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

              <p className="m-0 mt-10 text-[14px] leading-[1.6] text-slate-2">{v.disclaimer}</p>

              {/* ── Автор ── */}
              {author && (
                <div className="mt-6 flex items-center gap-4 border-t border-ink/10 pt-6">
                  <RingAvatar src={author.photo} name={author.name} className="size-[56px]" />
                  <div>
                    <p className="m-0 text-[16px] font-semibold text-ink">{author.name}</p>
                    <p className="m-0 mt-0.5 text-[14px] text-slate">{author.role || v.author}</p>
                  </div>
                </div>
              )}

              {/* телефон: «Поділитися» — після тексту, коли вже прочитали */}
              <div className="mt-9 min-[960px]:hidden">{share}</div>
            </div>
          </div>
        </section>
      </article>

      <CtaBand title={v.ctaTitle} text={v.ctaText} action={<ButtonLink href={consult}>{T.common.getConsultation}</ButtonLink>} />

      {/* ── Читайте також ── */}
      {related.length > 0 && (
        <section aria-labelledby="more" className={`bg-paper-2 ${SEC}`}>
          <div className="shell inner">
            <div className="mb-[30px] flex flex-wrap items-end justify-between gap-4">
              <h2 id="more" className="m-0 font-serif text-[clamp(30px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
                {t.readAlso}
              </h2>
              <ButtonLink href={`${prefix}/blog`} variant="ghost">
                {T.common.allArticles}
              </ButtonLink>
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
