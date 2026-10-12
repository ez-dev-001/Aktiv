'use client'

import { useEffect, useId, useRef, useState } from 'react'

/**
 * «Наша практика» на головній — як «Наша експертиза» в armada.law.
 *
 * Ліворуч тёмна половина: заголовок, кілька рядків і «Усі послуги».
 * Праворуч — світла половина з плашками послуг. Послуг 36, тому над
 * плашками чотири вкладки-напрями з числом послуг: одна дія — і видно
 * все, що стосується людини, без решти.
 *
 * ── Доступність ──
 * Патерн вкладок WAI-ARIA: tablist / tab / tabpanel, стрілки й Home/End.
 * Плашки — звичайні посилання на сторінки послуг: пошуковик бачить
 * посилання першого напряму, решта є в меню шапки й на сторінках
 * напрямів.
 *
 * Посилання …/#napryam-<slug> відкриває одразу потрібний напрям.
 */

export interface PracticeGroup {
  slug: string
  title: string
  practices: { slug: string; title: string }[]
}

export function PracticeTabs({ groups }: { groups: PracticeGroup[] }) {
  const [active, setActive] = useState(0)
  const base = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const m = /^#napryam-(.+)$/.exec(window.location.hash)
    if (!m?.[1]) return
    const i = groups.findIndex((g) => g.slug === decodeURIComponent(m[1]!))
    if (i >= 0) setActive(i)
  }, [groups])

  const g = groups[active]
  if (!g) return null

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % groups.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + groups.length) % groups.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = groups.length - 1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="min-w-0">
      <div role="tablist" aria-label="Напрями практики" className="mb-4 flex flex-wrap gap-1.5">
        {groups.map((x, i) => {
          const on = i === active
          return (
            <button
              key={x.slug}
              ref={(el) => {
                tabs.current[i] = el
              }}
              id={`${base}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border-0 px-4 text-[14px] font-medium transition-[background-color,color,box-shadow] duration-200 ${
                on
                  ? 'bg-ink text-white'
                  : 'bg-transparent text-ink shadow-[inset_0_0_0_1px_#d9d1d6] hover:shadow-[inset_0_0_0_1px_var(--color-ink)]'
              }`}
            >
              {x.title}
              <span className="font-mono text-[11px] opacity-60">{x.practices.length}</span>
            </button>
          )
        })}
      </div>

      {/* Невидимий підзаголовок напряму — для читалок екрана і структури
          заголовків (H2 «Наша практика» → H3 напрям). */}
      <h3 className="sr-only">{g.title}</h3>
      <ul
        key={g.slug}
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${active}`}
        className="explorer-panel m-0 grid list-none grid-cols-1 gap-2 p-0 min-[560px]:grid-cols-2 min-[1100px]:grid-cols-3"
      >
        {g.practices.map((p) => (
          <li key={p.slug} className="min-w-0">
            <a
              href={`/practices/${g.slug}/${p.slug}`}
              className="flex min-h-16 items-center justify-center rounded-[14px] bg-white px-4 py-3 text-center text-[14.5px] font-medium leading-[1.35] text-ink shadow-[0_1px_2px_rgb(20_11_51/0.05)] transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[inset_0_0_0_1.5px_var(--color-accent),0_12px_24px_-16px_rgb(20_11_51/0.35)]"
            >
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
