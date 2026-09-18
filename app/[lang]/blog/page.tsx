import type { Metadata } from 'next'
import { BLOG_CATEGORIES, getBlog } from '@/lib/sanity/content'
import { Icon } from '@/components/site/Icon'
import { PageHead, PageShell } from '@/components/site/PageShell'
import { ButtonLink } from '@/components/ui/Button'

/**
 * Лента блога.
 *
 * Блог — единственное, что на старом сайте работало исправно: 71 статья
 * и регулярные публикации. Но лента там не фильтровалась ничем: все
 * материалы лежали в одной рубрике «Новини», 19 страниц пагинации подряд.
 *
 * Здесь фильтр по рубрикам через ?cat= — обычными ссылками, без JS.
 * Работает при выключенном JS, индексируется и делится ссылкой.
 */

export const metadata: Metadata = {
  title: 'Блог',
  description:
    'Розбори рішень судів, зміни законодавства та кейси ЮК «АКТИВ». Пишемо про те, що впливає на бізнес і власність клієнтів.',
}

const STATIONS = [
  { id: 'head', label: 'Блог' },
  { id: 'feed', label: 'Матеріали' },
  { id: 'contact', label: 'Консультація' },
]

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : null

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ cat?: string }>
}) {
  const { lang } = await params
  const { cat = '' } = await searchParams
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const { data: posts, source } = await getBlog(lang, cat, 40)

  /* Без Sanity статьи открывать нечего: в статике есть только анонсы.
     Поэтому карточки в этом режиме не кликабельны — лучше, чем 404. */
  const clickable = source === 'sanity'

  return (
    <PageShell lang={lang} stations={STATIONS}>
      <PageHead
        eyebrow="Блог"
        title={
          <>
            Розбираємо рішення судів, поки вони ще{' '}
            <span className="font-normal italic text-accent-ink">мають значення.</span>
          </>
        }
        lede="Зміни законодавства, позиції Верховного Суду та кейси з нашої практики — без переказу новин, з висновком для бізнесу."
      />

      <section id="feed" className="pb-[clamp(52px,8vw,104px)]">
        <div className="shell inner">
          {/* ── фильтр ── */}
          <nav aria-label="Рубрики" className="mb-8 flex flex-wrap gap-2 border-y border-hair py-4">
            {BLOG_CATEGORIES.map((c) => {
              const active = cat === c.id
              const href = c.id ? `${prefix}/blog?cat=${c.id}` : `${prefix}/blog`
              return (
                <a
                  key={c.id || 'all'}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 font-mono text-[11px] uppercase tracking-[0.08em] transition-[background-color,color,box-shadow] ${
                    active
                      ? 'bg-ink text-white'
                      : 'text-slate shadow-[inset_0_0_0_1px_var(--color-hair)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--color-slate-2)]'
                  }`}
                >
                  {c.label}
                </a>
              )
            })}
          </nav>

          {posts.length === 0 ? (
            <p className="py-10 text-[15px] text-slate">
              У цій рубриці поки немає матеріалів.{' '}
              <a href={`${prefix}/blog`} className="text-accent-ink underline underline-offset-2">
                Показати всі
              </a>
              .
            </p>
          ) : (
            <ul className="grid list-none gap-px border border-hair bg-hair p-0 min-[700px]:grid-cols-2 min-[1060px]:grid-cols-3">
              {posts.map((a) => {
                const inner = (
                  <>
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.11em] text-slate-2">
                      <span className="text-accent-ink">{a.category}</span>
                      {fmtDate(a.publishedAt) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{fmtDate(a.publishedAt)}</span>
                        </>
                      )}
                    </span>
                    <span className="font-serif text-[18px] font-semibold leading-snug text-ink">{a.title}</span>
                    <span className="text-[14px] leading-relaxed text-slate">{a.excerpt}</span>
                    {a.author && (
                      <span className="mt-auto pt-1 font-mono text-[10.5px] uppercase tracking-[0.09em] text-slate-2">
                        {a.author}
                      </span>
                    )}
                  </>
                )
                return (
                  <li key={a.slug} className="bg-white">
                    {clickable ? (
                      <a
                        href={`${prefix}/blog/${a.slug}`}
                        className="group flex h-full flex-col gap-3 p-[clamp(20px,2.6vw,28px)] transition-colors hover:bg-paper"
                      >
                        {inner}
                        <span className="inline-flex items-center gap-2 text-[14px] font-medium text-accent-ink">
                          Читати{' '}
                          <Icon
                            name="arrow"
                            className="size-[14px] transition-transform duration-[240ms] group-hover:translate-x-1"
                          />
                        </span>
                      </a>
                    ) : (
                      <div className="flex h-full flex-col gap-3 p-[clamp(20px,2.6vw,28px)]">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {!clickable && posts.length > 0 && (
            <p className="mt-5 text-[13px] leading-relaxed text-slate-2">
              Це анонси-заглушки. Повні тексти зʼявляться, щойно статті буде додано в Sanity —
              див. <code className="font-mono text-ink">/sanity-check</code>.
            </p>
          )}
        </div>
      </section>

      <section id="contact" className="bg-paper-2 py-[clamp(44px,6vw,88px)]">
        <div className="shell inner">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <h2 className="max-w-[22ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14]">
                Питання стосується вашої ситуації?
              </h2>
              <p className="mt-4 max-w-[46ch] text-[15px] text-slate">
                Загальний розбір у статті й відповідь по конкретній справі — різні речі. Перша
                консультація без оплати.
              </p>
            </div>
            <ButtonLink href={`${prefix}/#contact`} arrow>
              Поставити питання
            </ButtonLink>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
