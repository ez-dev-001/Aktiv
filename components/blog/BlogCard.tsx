import type { Post } from '@/lib/sanity/content'
import { hasImage } from '@/lib/sanity/image'
import { Cover } from '@/components/site/Cover'
import { Icon } from '@/components/site/Icon'
import { RingAvatar } from '@/components/site/Blocks'
import { formatDate, ui } from '@/lib/ui'

/**
 * Картка статті у форматі макета (armada.law): обкладинка, дата • час
 * читання, заголовок, анонс, автор у кільці, кнопка «Читати».
 *
 * Окремо від components/site/PostCard: та картка живе ще й на головній
 * (Journal) у своєму, вже затвердженому вигляді.
 *
 * Уся картка клікабельна через «розтягнуте» посилання на заголовку:
 * у читача екрана посилання звучить як назва статті, а не як увесь
 * текст картки разом з анонсом і автором.
 */

export interface CardAuthor {
  name: string
  role?: string
  photo?: string
}

export const fmtDate = (iso?: string, lang = 'ua') => formatDate(lang, iso)

/* Фото-заглушки нової редакції для статей без обкладинки (public/v2/img).
   Вибір — за назвою статті, тож у картки завжди той самий кадр. */
const FALLBACK_COVERS = ['n-court', 'n-gavel', 'n-code', 'n-papers', 'n-tower', 'n-pen']
const coverFor = (title: string) => {
  let h = 0
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return FALLBACK_COVERS[h % FALLBACK_COVERS.length]!
}

/**
 * Обкладинка для статті без фото: тематичний кадр нової редакції
 * (суд, молоток, кодекс…) під темним градієнтом, у куті — рубрика.
 * aria-hidden: рубрика вже є в тексті картки.
 */
export function DarkCover({
  category,
  title,
  big = false,
  className = '',
}: {
  category?: string
  title: string
  big?: boolean
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-ink bg-cover bg-center text-white ${
        big ? 'p-[clamp(22px,2.6vw,30px)]' : 'p-[18px]'
      } ${className}`}
      style={{ backgroundImage: `linear-gradient(180deg, rgb(11 7 16 / 0.15), rgb(11 7 16 / 0.55)), url(/v2/img/${coverFor(title)}.jpg), linear-gradient(160deg,#161019,#0b0710)` }}
    >
      {category && (
        <small className="relative inline-block rounded-full bg-ink/70 px-3 py-1.5 text-[13px] text-accent-soft backdrop-blur">
          {category}
        </small>
      )}
    </div>
  )
}

function Meta({ date, minutes, category, lang }: { date: string | null; minutes?: number | null; category?: string; lang: string }) {
  const parts = [
    category && <span className="text-accent-ink">{category}</span>,
    date && <span>{date}</span>,
    minutes ? <span>{ui(lang).common.minRead(minutes)}</span> : null,
  ].filter(Boolean)
  if (!parts.length) return null
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-slate-2">
      {parts.map((p, i) => (
        <span key={i} className="contents">
          {i > 0 && <i aria-hidden="true" className="size-[3px] rounded-full bg-current" />}
          {p}
        </span>
      ))}
    </p>
  )
}

/** Псевдо-кнопка «Читати»: сама картка вже посилання. */
function ReadPill({ big = false, lang }: { big?: boolean; lang: string }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-auto inline-flex items-center gap-[7px] self-start rounded-full bg-ink font-sans font-medium text-white transition-colors group-hover:bg-accent-btn ${
        big ? 'min-h-11 px-5 text-[14px]' : 'min-h-[38px] px-4 text-[13.5px]'
      }`}
    >
      {ui(lang).common.read}
    </span>
  )
}

const SHELL =
  'group relative flex h-full flex-col overflow-hidden bg-white shadow-[inset_0_0_0_1px_var(--color-hair)] transition-shadow duration-[240ms] has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent'
const HOVER = 'hover:shadow-[inset_0_0_0_1px_var(--color-slate-2),0_14px_34px_-22px_rgb(11_7_16/0.35)]'
/* розтягнуте посилання: ::after покриває всю картку */
const STRETCH = "after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none"

export function BlogCard({
  post,
  href,
  withMedia,
  author,
  minutes,
  headingLevel = 'h3',
  lang = 'ua',
}: {
  lang?: string
  post: Post
  /** Немає адреси — картка не посилання (статика без повного тексту). */
  href?: string
  /** Місце під обкладинку — рішення для всього списку (див. PostCard). */
  withMedia: boolean
  author?: CardAuthor
  minutes?: number | null
  headingLevel?: 'h2' | 'h3'
}) {
  const H = headingLevel
  const date = fmtDate(post.publishedAt, lang)
  const img = hasImage(post.cover)
  /* Рубрику видно на темній обкладинці; на фото чи без обкладинки —
     у рядку дати, щоб вона не зникала з картки. */
  const catInMeta = !withMedia || img

  return (
    <article className={`${SHELL} rounded-[20px] ${href ? HOVER : ''}`}>
      {withMedia &&
        (img ? (
          <Cover
            image={post.cover}
            alt={post.title}
            ratio={16 / 10}
            widths={[360, 540, 720, 960]}
            sizes="(min-width: 1000px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="[&>img]:transition-transform [&>img]:duration-[600ms] [&>img]:ease-[cubic-bezier(.22,1,.36,1)] group-hover:[&>img]:scale-[1.03]"
          />
        ) : (
          <DarkCover category={post.category} title={post.title} className="aspect-[16/10]" />
        ))}
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <Meta date={date} minutes={minutes} category={catInMeta ? post.category : undefined} lang={lang} />
        <H className="m-0 font-serif text-[18px] font-semibold leading-[1.3] text-ink">
          {href ? (
            <a href={href} className={STRETCH}>
              {post.title}
            </a>
          ) : (
            post.title
          )}
        </H>
        {post.excerpt && post.excerpt.trim() !== post.title.trim() && (
          <p className="m-0 text-[14.5px] leading-[1.6] text-slate">{post.excerpt}</p>
        )}
        {author && (
          <p className="m-0 flex items-center gap-2.5 text-[13px] text-ink">
            <RingAvatar src={author.photo} name={author.name} className="size-[34px]" />
            {author.name}
          </p>
        )}
        {href && <ReadPill lang={lang} />}
      </div>
    </article>
  )
}

/** Головна (найновіша) стаття: обкладинка ліворуч, текст праворуч. */
export function FeaturedCard({
  post,
  href,
  author,
  minutes,
  lang = 'ua',
}: {
  post: Post
  href?: string
  author?: CardAuthor
  minutes?: number | null
  lang?: string
}) {
  const date = fmtDate(post.publishedAt, lang)
  const img = hasImage(post.cover)
  return (
    <article className={`${SHELL} rounded-[26px] min-[900px]:grid min-[900px]:grid-cols-[1.1fr_0.9fr] ${href ? HOVER : ''}`}>
      {img ? (
        <Cover
          image={post.cover}
          alt={post.title}
          ratio={16 / 10}
          widths={[540, 720, 960, 1280]}
          sizes="(min-width: 900px) 55vw, 100vw"
          priority
          className="min-[900px]:h-full min-[900px]:min-h-[320px] min-[900px]:aspect-auto! [&>img]:transition-transform [&>img]:duration-[600ms] [&>img]:ease-[cubic-bezier(.22,1,.36,1)] group-hover:[&>img]:scale-[1.02]"
        />
      ) : (
        <DarkCover big category={post.category} title={post.title} className="aspect-[16/10] min-[900px]:aspect-auto min-[900px]:min-h-[320px]" />
      )}
      <div className="flex flex-col gap-3.5 p-[clamp(24px,3vw,40px)]">
        <Meta date={date} minutes={minutes} category={img ? post.category : undefined} lang={lang} />
        <h2 className="m-0 font-serif text-[clamp(24px,2.6vw,32px)] font-normal leading-[1.18] text-ink">
          {href ? (
            <a href={href} className={STRETCH}>
              {post.title}
            </a>
          ) : (
            post.title
          )}
        </h2>
        {post.excerpt && post.excerpt.trim() !== post.title.trim() && (
          <p className="m-0 text-[15.5px] leading-[1.65] text-slate">{post.excerpt}</p>
        )}
        {author && (
          <p className="m-0 flex items-center gap-2.5 text-[13.5px] text-ink">
            <RingAvatar src={author.photo} name={author.name} className="size-11" />
            <span>
              {author.name}
              {author.role && <span className="text-slate">, {author.role.charAt(0).toLowerCase() + author.role.slice(1)}</span>}
            </span>
          </p>
        )}
        {href && <ReadPill big lang={lang} />}
      </div>
    </article>
  )
}
