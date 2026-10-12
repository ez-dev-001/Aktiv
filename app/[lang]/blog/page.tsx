import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { needsMedia } from '@/components/site/PostCard'
import { blogCategoryId, getBlog, getTeam, teamPhoto, type Post } from '@/lib/sanity/content'
import { localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { PageShell } from '@/components/site/PageShell'
import { PageHero } from '@/components/site/PageHero'
import { BlogCard, FeaturedCard, type CardAuthor } from '@/components/blog/BlogCard'
import { BlogFeed, BlogFilterProvider, BlogSearch, type FeedItem } from '@/components/blog/BlogFeed'

/**
 * Лента блога.
 *
 * Блог — единственное, что на старом сайте работало исправно: 71 статья
 * и регулярные публикации. Но лента там не фильтровалась ничем: все
 * материалы лежали в одной рубрике «Новини», 19 страниц пагинации подряд.
 *
 * Рубрики — плашки из тех, что реально есть у статей, и ?cat= в адресе:
 * ссылка на рубрику делится и открывается уже отфильтрованной (?cat=
 * читает клиент — так страница остаётся статической и отдаётся с CDN
 * мгновенно, а не рендерится на каждый запрос). Фильтр,
 * поиск и страницы — на клиенте по загруженному списку (BlogFeed):
 * запрос лёгкий, без текста статей, а переключение мгновенное.
 */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).meta
  return {
    ...pageMeta(lang, '/blog'),
    title: t.blogTitle,
    description: t.blogDescription,
  }
}

/* Скільки статей тягнемо в стрічку. Раніше було 40 без пагінації —
   решта архіву (а на старому сайті їх 71) просто не відкривалась. */
const LIMIT = 150
/* Пошук має сенс, коли статей більше, ніж видно на одному екрані. */
const SEARCH_FROM = 7

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const T = ui(lang)
  const [{ data: posts, source }, { data: team }] = await Promise.all([getBlog(lang, '', LIMIT), getTeam(lang)])

  /* Без Sanity статьи открывать нечего: в статике есть только анонсы.
     Поэтому карточки в этом режиме не кликабельны — лучше, чем 404. */
  const clickable = source === 'sanity'
  const href = (p: Post) => (clickable ? `${prefix}/blog/${p.slug}` : undefined)
  /* Место под обложку — если она есть хоть у одной статьи в списке.
     Почему решение принимается для всего списка сразу — в PostCard. */
  const withMedia = needsMedia(posts)

  /* Автор у статті — лише імʼя; фото й роль беремо з команди. */
  const author = (p: Post): CardAuthor | undefined => {
    if (!p.author) return undefined
    const m = team.find((t) => t.name === p.author)
    return { name: p.author, role: m?.role, photo: teamPhoto(m?.photoUrl, 120) }
  }

  /* Рубрика → ключ для ?cat=: id з BLOG_CATEGORIES, якщо назва відома,
     інакше сама назва (рубрику могли додати в студії пізніше). */
  const catKey = (label?: string) => blogCategoryId(label, lang) || label || ''
  const cats = [...new Set(posts.map((p) => p.category).filter((c): c is string => !!c))].map((label) => ({
    id: catKey(label),
    label,
  }))

  const [first] = posts
  const items: FeedItem[] = posts.map((p) => ({
    slug: p.slug,
    cat: catKey(p.category),
    hay: `${p.title} ${p.excerpt ?? ''}`,
    node: <BlogCard post={p} href={href(p)} withMedia={withMedia} author={author(p)} headingLevel="h2" lang={lang} />,
  }))

  return (
    <PageShell lang={lang} overDark>
      <BlogFilterProvider>
        <PageHero
          compact
          crumbs={[{ label: T.common.home, href: localeHref(lang, '/') }, { label: T.common.blog }]}
          lang={lang}
          title={T.blog.heroTitle}
          accent={T.blog.heroAccent}
          lede={T.blog.heroLede}
        >
          {posts.length >= SEARCH_FROM && <BlogSearch />}
        </PageHero>

        <section id="feed" aria-label={T.blog.feedAria} className="pb-[clamp(56px,8vw,112px)] pt-[clamp(32px,4vw,56px)]">
          <div className="shell inner">
            {posts.length === 0 ? (
              <div className="rounded-[26px] bg-white px-[clamp(24px,4vw,48px)] py-[clamp(36px,5vw,56px)] shadow-[inset_0_0_0_1px_var(--color-hair)]">
                <p className="m-0 font-serif text-[clamp(24px,2.6vw,32px)] leading-[1.18] text-ink">{T.blog.emptyTitle}</p>
                <p className="m-0 mt-2.5 max-w-[56ch] text-[15.5px] leading-[1.65] text-slate">
                  {T.blog.emptyText}
                </p>
              </div>
            ) : (
              <BlogFeed
                items={items}
                featured={
                  first && {
                    slug: first.slug,
                    node: <FeaturedCard post={first} href={href(first)} author={author(first)} lang={lang} />,
                  }
                }
                cats={cats}
                stubNote={!clickable}
              />
            )}
          </div>
        </section>
      </BlogFilterProvider>
    </PageShell>
  )
}
