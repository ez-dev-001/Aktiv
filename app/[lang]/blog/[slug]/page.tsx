import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getPostSlugs } from '@/lib/sanity/content'
import { Icon } from '@/components/site/Icon'
import { PageShell } from '@/components/site/PageShell'
import { Prose } from '@/components/site/Prose'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

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
  return ['ua', 'en', 'ru'].flatMap((lang) => slugs.map((slug) => ({ lang, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const p = await getPost(slug, lang)
  if (!p) return { title: 'Стаття' }
  return {
    title: p.title,
    description: p.excerpt?.slice(0, 180),
    openGraph: { type: 'article', publishedTime: p.publishedAt },
  }
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : null

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const post = await getPost(slug, lang)
  if (!post) notFound()

  const prefix = lang === 'ua' ? '' : `/${lang}`
  const stations = [
    { id: 'head', label: 'Стаття' },
    { id: 'body', label: 'Текст' },
    { id: 'contact', label: 'Питання' },
  ]

  return (
    <PageShell lang={lang} stations={stations}>
      <article>
        {/* ── ШАПКА ── */}
        <section id="head" className="py-[clamp(40px,6vw,80px)]">
          <div className="shell inner">
            <nav aria-label="Хлібні крихти" className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-2">
              <a href={`${prefix}/blog`} className="hover:text-accent-ink">
                Блог
              </a>
              {post.category && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="text-accent-ink">{post.category}</span>
                </>
              )}
            </nav>

            <Reveal as="h1" className="max-w-[24ch] text-[clamp(26px,4.6vw,46px)] leading-[1.09]">
              {post.title}
            </Reveal>

            {post.excerpt && <p className="lede mt-5 max-w-[56ch] text-slate">{post.excerpt}</p>}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hair pt-5 font-mono text-[11px] uppercase tracking-[0.09em] text-slate-2">
              {fmtDate(post.publishedAt) && <span>{fmtDate(post.publishedAt)}</span>}
              {post.author && (
                <span className="text-ink">
                  {post.author}
                  {post.authorRole && <span className="ml-2 normal-case tracking-normal text-slate-2">{post.authorRole}</span>}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── ТЕКСТ ── */}
        <section id="body" className="pb-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            {post.body ? (
              <Prose value={post.body} />
            ) : (
              <p className="max-w-[60ch] text-[16px] leading-relaxed text-slate-2">
                Текст статті ще не заповнено в Sanity.
              </p>
            )}
          </div>
        </section>

        {/* ── СВЯЗАННЫЕ ПРАКТИКИ ── */}
        {post.practices && post.practices.length > 0 && (
          <section className="bg-paper-2 py-[clamp(40px,6vw,80px)]">
            <div className="shell inner">
              <p className="eyebrow">Стосується практик</p>
              <ul className="grid list-none gap-px border border-hair bg-hair p-0 min-[700px]:grid-cols-2">
                {post.practices.map((pr) => (
                  <li key={pr.slug} className="bg-white">
                    <a
                      href={`${prefix}/practices/${pr.category}/${pr.slug}`}
                      className="group flex items-center justify-between gap-4 p-[clamp(16px,2.2vw,24px)] transition-colors hover:bg-paper"
                    >
                      <span className="font-serif text-[16.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
                        {pr.title}
                      </span>
                      <Icon
                        name="arrow"
                        className="size-4 shrink-0 text-slate-2 transition-[transform,color] duration-[240ms] group-hover:translate-x-1 group-hover:text-accent"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section id="contact" className="py-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            <div className="flex flex-wrap items-end justify-between gap-8 border-t-2 border-ink pt-8">
              <div>
                <h2 className="max-w-[24ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14]">
                  Стаття — це загальний розбір. Ваша справа — ні.
                </h2>
                <p className="mt-4 max-w-[46ch] text-[15px] text-slate">
                  Опишіть ситуацію, і ми скажемо, чи застосовна ця позиція саме у вас. Перша
                  консультація без оплати.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <ButtonLink href={`${prefix}/#contact`} arrow>
                  Поставити питання
                </ButtonLink>
                <ArrowLink href={`${prefix}/blog`}>Усі матеріали</ArrowLink>
              </div>
            </div>
          </div>
        </section>
      </article>
    </PageShell>
  )
}
