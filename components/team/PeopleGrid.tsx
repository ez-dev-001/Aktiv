'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useUi } from '@/components/site/LangProvider'

/**
 * Сітка фахівців з фільтром за роллю + панель з практиками.
 *
 * Фільтр будується з даних: група — з поля kind у Sanity (або, для
 * статики без kind, з тексту ролі). Показуються лише групи, де є люди;
 * група одна — фільтра немає. Без JS видно всіх.
 *
 * Картка: уся плитка — одна кнопка (фото, імʼя, посада), тож мертвих
 * зон немає. На ПК при наведенні — малиновий контур і знак «АКТИВ» на
 * фото; з клавіатури — той самий контур на фокусі. Натиск відкриває
 * панель: на ПК справа, на телефоні знизу (тягнути за смужку вниз —
 * закрити). У панелі — практики людини з посиланнями, «Обговорити
 * справу», перехід до попереднього / наступного. Esc, фон, хрестик і
 * «Назад» у браузері закривають панель (крок в історії — свій).
 *
 * Підказка на телефоні (немає наведення): коли сітка вперше в кадрі,
 * знаки пульсують, над першою карткою — бульбашка. Один раз на браузер.
 */

export interface Person {
  name: string
  role: string
  group: Group
  /** вже з кропом 4:5 */
  photo?: string
  /** більший кадр для панелі */
  photoWide?: string
  /** рядок напрямів («Військове право · ВЛК») */
  practice?: string
  practices?: { title: string; href: string }[]
}

export type Group = 'partner' | 'adv' | 'mil' | 'exec'

/* Підписи груп — lib/ui.ts → team.groups */
const ORDER: Group[] = ['partner', 'adv', 'mil', 'exec']
const HINT_KEY = 'aktiv_team_hint'

/** Знак «АКТИВ»: розімкнене кільце зі стрілкою. */
function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-26.5 -19.5 300 220" aria-hidden="true" className={className}>
      <path d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
      <path className="pg-arrow" d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z" fill="currentColor" />
    </svg>
  )
}

const Arrow = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function Photo({ src, name, className }: { src?: string; name: string; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async" className={`${className} object-cover object-top`} />
  ) : (
    <div className={`${className} grid place-items-center bg-paper-2 font-serif text-[clamp(28px,4vw,44px)] font-semibold tracking-[0.02em] text-ink`}>
      {initials(name)}
    </div>
  )
}

export function PeopleGrid({ people }: { people: Person[] }) {
  const T = useUi()
  const t = T.team
  const LABELS: Record<Group, string> = t.groups
  const [f, setF] = useState<Group | 'all'>('all')
  const groups = ORDER.filter((g) => people.some((p) => p.group === g))
  const showFilter = groups.length > 1
  const visible = people.filter((m) => f === 'all' || m.group === f)

  /* ── панель ── */
  const [open, setOpen] = useState<number | null>(null) // індекс у visible
  const [shown, setShown] = useState(false) // для анімації входу/виходу
  const [dy, setDy] = useState(0) // свайп униз на телефоні
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const closeBtn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const lastName = useRef<string | null>(null)
  const pushed = useRef(false)

  const finishClose = useCallback(() => {
    setShown(false)
    setDy(0)
    window.setTimeout(() => {
      setOpen(null)
      const n = lastName.current
      if (n) cardRefs.current.get(n)?.focus({ preventScroll: true })
    }, 420)
  }, [])

  const close = useCallback(() => {
    /* свій крок в історії знімаємо «Назад» — popstate закриє панель */
    if (pushed.current) history.back()
    else finishClose()
  }, [finishClose])

  const openAt = (i: number) => {
    const m = visible[i]
    if (!m) return
    lastName.current = m.name
    setOpen(i)
    history.pushState({ teamPanel: true }, '')
    pushed.current = true
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
  }

  const step = useCallback(
    (d: number) => {
      setOpen((i) => {
        if (i === null) return i
        const n = (i + d + visible.length) % visible.length
        lastName.current = visible[n]?.name ?? null
        return n
      })
      scroller.current?.scrollTo({ top: 0 })
    },
    [visible],
  )

  useEffect(() => {
    if (open === null) return
    const onPop = () => {
      pushed.current = false
      finishClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>('a[href],button')].filter((x) => x.offsetParent)
        const a = f[0]
        const z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z?.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a?.focus()
        }
      }
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    closeBtn.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
    }
  }, [open === null, close, step, finishClose]) // eslint-disable-line react-hooks/exhaustive-deps

  /* свайп униз за смужку */
  const y0 = useRef<number | null>(null)
  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      y0.current = e.clientY
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (y0.current !== null) setDy(Math.max(0, e.clientY - y0.current))
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (y0.current === null) return
      const d = e.clientY - y0.current
      y0.current = null
      if (d > 90) close()
      else setDy(0)
    },
  }

  /* ── підказка для телефона ── */
  const gridRef = useRef<HTMLUListElement>(null)
  const [hint, setHint] = useState(false)
  useEffect(() => {
    const el = gridRef.current
    if (!el || !window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    try {
      if (localStorage.getItem(HINT_KEY)) return
    } catch {
      /* без сховища — просто показуємо */
    }
    let timer = 0
    const off = () => {
      setHint(false)
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', off, true)
    }
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((x) => x.isIntersecting)) return
        io.disconnect()
        setHint(true)
        try {
          localStorage.setItem(HINT_KEY, '1')
        } catch {
          /* ignore */
        }
        timer = window.setTimeout(off, 6000)
        window.addEventListener('pointerdown', off, true)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      off()
    }
  }, [])

  const cur = open !== null ? visible[open] : undefined
  const prevP = open !== null ? visible[(open - 1 + visible.length) % visible.length] : undefined
  const nextP = open !== null ? visible[(open + 1) % visible.length] : undefined

  return (
    <>
      {showFilter && (
        <div role="group" aria-label={t.filterAria} className="mb-[22px] flex flex-wrap gap-1.5">
          {(['all', ...groups] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={f === g}
              onClick={() => setF(g)}
              className="min-h-[38px] cursor-pointer rounded-full px-[15px] font-sans text-[13.5px] font-medium text-ink shadow-[inset_0_0_0_1px_#d9d1d6] transition-colors hover:shadow-[inset_0_0_0_1px_var(--color-ink)] aria-pressed:bg-ink aria-pressed:text-white aria-pressed:shadow-none"
            >
              {g === 'all' ? T.common.all : LABELS[g]}
            </button>
          ))}
        </div>
      )}

      <ul
        ref={gridRef}
        className={`m-0 grid list-none grid-cols-2 gap-[clamp(12px,1.8vw,22px)] p-0 min-[700px]:grid-cols-3 min-[1060px]:grid-cols-4 ${hint ? 'pg-hint' : ''}`}
      >
        {people.map((m) => {
          const i = visible.indexOf(m)
          const clickable = (m.practices?.length ?? 0) > 0
          return (
            <li key={m.name} hidden={i < 0} className="relative flex min-w-0">
              {hint && visible[0] === m && (
                <div role="status" className="pg-tip">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] shrink-0 text-accent-soft">
                    <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-1a5 5 0 0 1-3.9-1.9L5 15.4a1.5 1.5 0 0 1 2.3-1.9L9 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{t.hint}</span>
                </div>
              )}
              <article className={`pg-tile group relative isolate flex w-full flex-col rounded-[22px] bg-white p-2 pb-3.5 shadow-[inset_0_0_0_1px_var(--color-hair)] ${clickable ? 'is-click' : ''}`}>
                <div className="relative overflow-hidden rounded-[16px]">
                  <Photo src={m.photo} name={m.name} className="pg-photo aspect-[4/5] w-full" />
                  {clickable && (
                    <span aria-hidden="true" className="pg-badge absolute bottom-2.5 right-2.5 grid size-[38px] place-items-center rounded-full bg-white text-accent-btn">
                      <Mark className="w-7 overflow-visible" />
                    </span>
                  )}
                </div>
                <div className="px-1.5">
                  <h3 className="m-0 mt-3.5 font-serif text-[15.5px] font-semibold leading-[1.25] text-ink min-[520px]:text-[clamp(16.5px,1.6vw,19px)]">{m.name}</h3>
                  <p className="m-0 mt-1 text-[12.5px] leading-snug text-accent-ink min-[520px]:text-[13.5px]">{m.role}</p>
                </div>
                {clickable && (
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) cardRefs.current.set(m.name, el)
                    }}
                    aria-haspopup="dialog"
                    aria-label={t.openCard(m.name)}
                    onClick={() => openAt(i)}
                    className="absolute inset-0 z-[1] cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 outline-none"
                  />
                )}
              </article>
            </li>
          )
        })}
      </ul>

      {/* ── панель ── */}
      {cur && (
        <div className="fixed inset-0 z-[95]">
          <div
            aria-hidden="true"
            onClick={close}
            className={`absolute inset-0 bg-[rgb(20_11_51/0.45)] backdrop-blur-[3px] transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
          />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pg-name"
            data-shown={shown}
            style={{ ['--dy' as string]: `${dy}px` }}
            className={`pg-panel absolute flex flex-col bg-paper shadow-[-30px_0_60px_-40px_rgb(20_11_51/0.6)] ${y0.current !== null ? 'is-drag' : ''}`}
          >
            <div aria-hidden="true" {...grab} className="pg-grab absolute inset-x-0 top-0 z-[4] h-7 touch-none min-[640px]:hidden" />
            <button
              ref={closeBtn}
              type="button"
              onClick={close}
              aria-label={t.close}
              className="absolute right-3.5 top-3.5 z-[3] grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-white/90 text-[24px] leading-none text-ink shadow-[0_6px_16px_-8px_rgb(20_11_51/0.4)] transition-colors hover:bg-accent-btn hover:text-white focus-visible:bg-accent-btn focus-visible:text-white focus-visible:outline-none"
            >
              ×
            </button>
            <div ref={scroller} key={cur.name} className="pg-swap min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <Photo src={cur.photoWide ?? cur.photo} name={cur.name} className="aspect-[16/13] w-full" />
              <div className="px-[26px] pb-7 pt-6">
                <h3 id="pg-name" className="m-0 font-serif text-[clamp(26px,3vw,30px)] font-normal leading-[1.1] text-ink">{cur.name}</h3>
                <p className="m-0 mt-2 text-[14px] text-accent-ink">{cur.role}</p>
                {cur.practice && (
                  <p className="m-0 mt-3.5 flex items-start gap-2 border-t border-hair pt-3 text-[13px] leading-snug text-ink">
                    <span aria-hidden="true" className="mt-[5px] size-[5px] shrink-0 rotate-45 bg-accent" />
                    {cur.practice}
                  </p>
                )}
                <p className="m-0 mb-1 mt-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate">
                  {t.handles} · {cur.practices?.length ?? 0}
                </p>
                <ul className="m-0 grid list-none p-0">
                  {cur.practices?.map((p) => (
                    <li key={p.href} className="border-b border-hair last:border-0">
                      <a
                        href={p.href}
                        className="group/l flex min-h-[50px] items-center justify-between gap-3 py-2.5 text-[15px] leading-[1.35] text-ink no-underline transition-colors hover:text-accent-ink focus-visible:text-accent-ink focus-visible:outline-none"
                      >
                        {p.title}
                        <Arrow className="size-[15px] shrink-0 text-accent transition-transform group-hover/l:translate-x-[3px]" />
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  onClick={close}
                  className="mt-6 inline-flex min-h-[50px] items-center gap-2.5 whitespace-nowrap rounded-full bg-accent-btn px-6 text-[14.5px] font-semibold text-white no-underline shadow-[0_14px_30px_-14px_rgb(224_16_85/0.7)]"
                >
                  {T.common.discussCase}
                  <Arrow className="size-4" />
                </a>
              </div>
            </div>
            {visible.length > 1 && prevP && nextP && (
              <div className="flex border-t border-hair bg-white">
                {[
                  { d: -1, label: `← ${t.prev}`, p: prevP },
                  { d: 1, label: `${t.next} →`, p: nextP },
                ].map(({ d, label, p }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => step(d)}
                    className={`flex min-h-16 flex-1 cursor-pointer flex-col gap-[3px] border-0 bg-transparent px-5 py-3 transition-colors hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none ${
                      d > 0 ? 'items-end border-l border-solid border-hair text-right' : 'items-start text-left'
                    }`}
                  >
                    <small className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate">{label}</small>
                    <span className="font-serif text-[14px] font-semibold leading-tight text-ink">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
