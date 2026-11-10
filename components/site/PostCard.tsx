import type { Post } from '@/lib/sanity/content'
import { hasImage } from '@/lib/sanity/image'
import { Cover } from './Cover'
import { Icon } from './Icon'
import { formatDate, ui } from '@/lib/ui'

/**
 * Карточка статьи — одна на блог и на главную.
 *
 * Раньше это были две разные вёрстки, и обложки не было ни в одной.
 * Когда её добавили бы только в одну, вторая осталась бы без картинки,
 * и никто бы не заметил до жалобы. Общий компонент исключает это.
 *
 * ── Отдельные карточки, а не сетка на сером фоне ──
 * Прежняя сетка была «таблицей»: белые ячейки на серой подложке с
 * зазором в пиксель. При одной статье в ряду на три колонки две трети
 * ряда оставались пустой серой подложкой — выглядело как недогрузившийся
 * блок. Тот же дефект уже чинили у сетки команды. Отдельные карточки на
 * бумаге его не имеют при любом числе статей.
 *
 * ── Место под обложку ──
 * withMedia решает список целиком: если хоть у одной статьи в ряду есть
 * обложка, место под картинку есть у всех. Иначе карточка с фото и
 * карточка без стояли бы рядом со сдвинутыми на высоту картинки
 * заголовками. Статья без обложки получает спокойную подложку с
 * рубрикой — ровно того же размера.
 */

export const needsMedia = (posts: Post[]) => posts.some((p) => hasImage(p.cover))


const RATIO = 3 / 2

export function PostCard({
  post,
  href,
  withMedia,
  headingLevel = 'h3',
  hideExcerpt = false,
  lang = 'ua',
}: {
  /** мова сторінки — дата й «Читати» */
  lang?: string
  post: Post
  /** Нет адреса — карточка не ссылка (статика без полного текста). */
  href?: string
  withMedia: boolean
  headingLevel?: 'h2' | 'h3' | 'h4'
  /** на головній картка лише з назвою: мінімалізм, анонс читають у блозі */
  hideExcerpt?: boolean
}) {
  const H = headingLevel
  const date = formatDate(lang, post.publishedAt)

  const body = (
    <>
      {withMedia &&
        (hasImage(post.cover) ? (
          <Cover
            image={post.cover}
            alt={post.title}
            ratio={RATIO}
            widths={[360, 540, 720, 960]}
            sizes="(min-width: 1060px) 33vw, (min-width: 700px) 50vw, 100vw"
            className="[&>img]:transition-transform [&>img]:duration-[600ms] [&>img]:ease-[cubic-bezier(.22,1,.36,1)] group-hover:[&>img]:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid place-items-center bg-paper-2 text-[13px] text-slate-2"
            style={{ aspectRatio: String(RATIO) }}
          >
            {post.category}
          </div>
        ))}

      <div className="flex flex-1 flex-col gap-3 p-[clamp(20px,2.4vw,26px)]">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-slate-2">
          {post.category && <span className="text-accent-ink">{post.category}</span>}
          {post.category && date && <span aria-hidden="true">·</span>}
          {date && <span>{date}</span>}
        </span>
        <H className="m-0 font-serif text-[18px] font-semibold leading-snug text-ink">{post.title}</H>
        {post.excerpt && !hideExcerpt && <p className="m-0 text-[14px] leading-relaxed text-slate">{post.excerpt}</p>}
        {post.author && (
          <span className="pt-1 text-[13px] text-slate-2">{post.author}</span>
        )}
        {href && (
          <span className="mt-auto inline-flex items-center gap-2 pt-1 text-[14px] font-medium text-accent-ink">
            {ui(lang).common.read}{' '}
            <Icon name="arrow" className="size-[14px] transition-transform duration-[240ms] group-hover:translate-x-1" />
          </span>
        )}
      </div>
    </>
  )

  const shell =
    'group flex h-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[inset_0_0_0_1px_var(--color-hair)]'

  return href ? (
    <a
      href={href}
      className={`${shell} transition-shadow duration-[240ms] hover:shadow-[inset_0_0_0_1px_var(--color-slate-2),0_14px_34px_-22px_rgb(11_7_16/0.35)]`}
    >
      {body}
    </a>
  ) : (
    <div className={shell}>{body}</div>
  )
}

/** Сетка карточек: отдельные карточки, без серой подложки. */
export const POST_GRID = 'grid list-none gap-[clamp(10px,1.4vw,18px)] p-0 min-[700px]:grid-cols-2 min-[1060px]:grid-cols-3'
