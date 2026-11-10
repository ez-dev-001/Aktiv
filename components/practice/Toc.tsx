'use client'

import { useEffect, useState } from 'react'

/**
 * Зміст статті збоку: підсвічує розділ, який зараз читають, і показує
 * прогрес читання тонкою лінією. Без JS — звичайний список якорів.
 */
export function Toc({ items, label }: { items: { id: string; title: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    if (!els.length) return
    const onScroll = () => {
      /* активний — останній розділ, чий верх уже вище третини екрана */
      const line = window.innerHeight * 0.33
      let cur = els[0]!.id
      for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id
      setActive(cur)
      const first = els[0]!.getBoundingClientRect().top + window.scrollY
      const lastEl = els[els.length - 1]!
      const end = lastEl.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.6
      const p = (window.scrollY - first + line) / Math.max(1, end - first + line)
      setProgress(Math.min(1, Math.max(0, p)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  if (items.length < 2) return null

  return (
    <nav aria-label={label}>
      <p className="m-0 mb-3 text-[13px] text-slate">{label}</p>
      <div className="relative">
        {/* рейка прогресу */}
        <span aria-hidden="true" className="absolute bottom-1 left-0 top-1 w-px bg-hair" />
        <span
          aria-hidden="true"
          className="absolute left-0 top-1 w-px origin-top bg-accent transition-transform duration-200"
          style={{ height: 'calc(100% - 8px)', transform: `scaleY(${progress})` }}
        />
        <ol className="m-0 grid list-none gap-0.5 p-0">
          {items.map((it, i) => {
            const on = it.id === active
            return (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  aria-current={on ? 'location' : undefined}
                  className={`grid grid-cols-[26px_1fr] gap-1 py-[7px] pl-4 text-[14px] leading-[1.35] no-underline transition-colors ${
                    on ? 'text-ink' : 'text-slate-2 hover:text-ink'
                  }`}
                >
                  <span className={` text-[13px] leading-[1.9] ${on ? 'text-accent-ink' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={on ? 'font-medium' : ''}>{it.title}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
