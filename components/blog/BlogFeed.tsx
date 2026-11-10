'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/site/Icon'
import { useUi } from '@/components/site/LangProvider'

/**
 * Стрічка блогу на клієнті: пошук, рубрики й пагінація.
 *
 * Картки рендерить сервер (обкладинки, srcset, аватари) і передає сюди
 * готовими вузлами — клієнт лише вирішує, які з них показати. Так у
 * браузер не їде клієнт Sanity, а перший кадр однаковий і з JS, і без.
 *
 * Рубрика синхронізується з ?cat= — посилання на рубрику, як і раніше,
 * можна надіслати, а сервер віддасть сторінку вже відфільтрованою.
 * Пошук живе в шапці (темний перший екран), стрічка — нижче, тому
 * стан спільний через контекст.
 */

interface Ctx {
  q: string
  setQ: (v: string) => void
}
const FeedCtx = createContext<Ctx>({ q: '', setQ: () => {} })

export function BlogFilterProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState('')
  return <FeedCtx.Provider value={{ q, setQ }}>{children}</FeedCtx.Provider>
}

/** Поле пошуку на темному: фільтр за назвою й анонсом завантажених статей. */
export function BlogSearch() {
  const { q, setQ } = useContext(FeedCtx)
  const t = useUi().blog
  return (
    <form role="search" className="mt-7 max-w-[440px]" onSubmit={(e) => {
      e.preventDefault()
      document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }}>
      <label className="flex min-h-[52px] items-center gap-2.5 rounded-full bg-white/[0.07] px-[18px] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.45)]">
        <Icon name="search" className="size-[18px] shrink-0 text-accent-soft" />
        <span className="sr-only">{t.search}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          aria-controls="feed-list"
          className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-white placeholder:text-on-dark-2 focus:outline-none [&::-webkit-search-cancel-button]:invert"
        />
      </label>
    </form>
  )
}

export interface FeedItem {
  slug: string
  /** ключ рубрики для ?cat= (id з BLOG_CATEGORIES або сама назва) */
  cat: string
  /** назва + анонс — для пошуку */
  hay: string
  node: ReactNode
}

/* ʼ ’ ' — три різні апострофи пишуть однаково часто; і е/є, і/ї не чіпаємо */
const norm = (s: string) => s.toLocaleLowerCase('uk').replace(/[ʼ’'`]/g, "'").replace(/\s+/g, ' ').trim()

const PER = 12

export function BlogFeed({
  items,
  featured,
  cats,
  stubNote,
}: {
  items: FeedItem[]
  /** найновіша стаття великою карткою — лише в «Усі» без пошуку */
  featured?: { slug: string; node: ReactNode }
  cats: { id: string; label: string }[]
  /** статика без Sanity: пояснення, чому картки не відкриваються */
  stubNote?: boolean
}) {
  const { q, setQ } = useContext(FeedCtx)
  const T = useUi()
  const t = T.blog
  const [cat, setCat] = useState('')
  /* ?cat= з адреси — після завантаження: сторінка статична, тож сервер
     параметра не бачить. Посилання на рубрику однаково відкривається
     відфільтрованим. */
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('cat')
    if (c && cats.some((x) => x.id === c)) setCat(c)
  }, [cats])
  /* сторінка привʼязана до фільтра: новий фільтр — знову з першої */
  const [pg, setPg] = useState({ key: '', n: 1 })
  const top = useRef<HTMLDivElement>(null)

  const query = norm(q)
  const plain = !cat && !query
  const key = `${cat}|${query}`
  const page = pg.key === key ? pg.n : 1

  const list = useMemo(() => {
    const base = items.filter((it) => (!cat || it.cat === cat) && (!query || norm(it.hay).includes(query)))
    /* головна стаття вже стоїть великою карткою — у сітці не дублюємо */
    return plain && featured ? base.filter((it) => it.slug !== featured.slug) : base
  }, [items, cat, query, plain, featured])

  const pages = Math.max(1, Math.ceil(list.length / PER))
  const cur = Math.min(page, pages)
  const shown = list.slice((cur - 1) * PER, cur * PER)

  const pick = (id: string) => {
    setCat(id)
    try {
      const u = new URL(window.location.href)
      if (id) u.searchParams.set('cat', id)
      else u.searchParams.delete('cat')
      window.history.replaceState(null, '', u.pathname + u.search + u.hash)
    } catch {}
  }

  const go = (n: number) => {
    setPg({ key, n })
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const empty = list.length === 0 && !(plain && featured)

  return (
    <div ref={top} className="scroll-mt-[calc(var(--hdr)+16px)]">
      {cats.length > 1 && (
        <div role="group" aria-label={t.categoriesAria} className="mb-[22px] flex flex-wrap gap-1.5">
          {[{ id: '', label: T.common.all }, ...cats].map((c) => {
            const on = cat === c.id
            return (
              <button
                key={c.id || 'all'}
                type="button"
                aria-pressed={on}
                aria-controls="feed-list"
                onClick={() => pick(c.id)}
                className={`min-h-[38px] cursor-pointer rounded-full px-[15px] font-sans text-[13.5px] font-medium transition-[background-color,color,box-shadow] ${
                  on
                    ? 'bg-ink text-white'
                    : 'bg-transparent text-ink shadow-[inset_0_0_0_1px_#d9d1d6] hover:shadow-[inset_0_0_0_1px_var(--color-slate-2)]'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      )}

      {/* зміна результату озвучується читачам екрана */}
      <p aria-live="polite" className="sr-only">
        {query || cat ? t.found(list.length) : ''}
      </p>

      {plain && featured && cur === 1 && <div className="mb-[18px]">{featured.node}</div>}

      <div id="feed-list">
        {empty ? (
          <div className="rounded-[20px] bg-white px-6 py-10 text-center shadow-[inset_0_0_0_1px_var(--color-hair)]">
            <p className="m-0 font-serif text-[21px] text-ink">
              {query ? t.noResults : t.noInCategory}
            </p>
            <button
              type="button"
              onClick={() => {
                setQ('')
                pick('')
              }}
              className="mt-3 cursor-pointer text-[15px] font-medium text-accent-ink underline underline-offset-[3px]"
            >
              {t.showAll}
            </button>
          </div>
        ) : (
          shown.length > 0 && (
            <ul className="m-0 grid list-none gap-[18px] p-0 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3">
              {shown.map((it) => (
                <li key={it.slug}>{it.node}</li>
              ))}
            </ul>
          )
        )}
      </div>

      {pages > 1 && (
        <nav aria-label={t.pagesAria} className="mt-[clamp(28px,4vw,48px)] flex flex-wrap justify-center gap-1.5">
          <PagerBtn label={t.prevPage} disabled={cur === 1} onClick={() => go(cur - 1)}>
            <Icon name="arrow" className="size-4 rotate-180" />
          </PagerBtn>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <PagerBtn key={n} label={t.page(n)} current={n === cur} onClick={() => go(n)}>
              {n}
            </PagerBtn>
          ))}
          <PagerBtn label={t.nextPage} disabled={cur === pages} onClick={() => go(cur + 1)}>
            <Icon name="arrow" className="size-4" />
          </PagerBtn>
        </nav>
      )}

      {stubNote && (
        <p className="mt-5 text-[13px] leading-relaxed text-slate-2">
          {t.stubNote}{' '}
          <code className=" text-ink">/sanity-check</code>.
        </p>
      )}
    </div>
  )
}

function PagerBtn({
  children,
  label,
  current,
  disabled,
  onClick,
}: {
  children: ReactNode
  label: string
  current?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-11 min-w-11 cursor-pointer place-items-center rounded-full px-1.5 text-[14px] font-medium transition-[background-color,box-shadow] disabled:cursor-default disabled:opacity-35 ${
        current ? 'bg-ink text-white' : 'bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:shadow-[inset_0_0_0_1px_var(--color-slate-2)]'
      }`}
    >
      {children}
    </button>
  )
}
