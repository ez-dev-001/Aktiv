'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/site/Icon'

/**
 * Пошук послуги на першому екрані.
 *
 * ── Ідея ──
 * Людина приходить на сайт юрфірми з конкретною бідою: «ТЦК», «борг»,
 * «закрити ТОВ». Список із чотирьох напрямів змушує її спершу
 * перекласти свою біду на мову юристів. Тут навпаки: пише своїми
 * словами, і одразу бачить послугу, яка про це. Без пошуку це просто
 * кілька популярних послуг одним кліком.
 *
 * Шукає і в назві послуги, і в назві напряму, і в коротких підказках
 * (HINTS) — народних словах, яких у назвах немає: «мобілізація» знайде
 * відстрочку, «борг» — стягнення.
 *
 * Клавіатура: стрілки ходять по результатах, Enter відкриває.
 */

export interface SearchItem {
  href: string
  title: string
  group: string
  featured?: boolean
}

/** Слова людей → слова з назв послуг. Тільки корені, без закінчень. */
const HINTS: Record<string, string> = {
  тцк: 'мобіліз військ',
  мобіліз: 'тцк військ',
  повістк: 'тцк мобіліз',
  армі: 'військ',
  борг: 'стягн заборгован виконав',
  кредит: 'банкрут відстроч борг',
  закри: 'ліквідац',
  тов: 'ліквідац реєстрац',
  фоп: 'реєстрац',
  земл: 'земел',
  квартир: 'нерухом',
  будин: 'нерухом будівн',
  розлуч: 'сімей',
  аліме: 'сімей',
  звільн: 'трудов',
  податк: 'податков',
  кримінал: 'кримінальн захист',
}

const norm = (s: string) => s.toLowerCase().replace(/['’ʼ]/g, '').trim()

export function HeroSearch({ items, popular }: { items: SearchItem[]; popular: SearchItem[] }) {
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter((w) => w.length >= 2)
    if (!words.length) return []
    const expand = words.flatMap((w) => [w, ...Object.entries(HINTS).filter(([k]) => w.startsWith(k) || k.startsWith(w)).flatMap(([, v]) => v.split(' '))])
    return items
      .map((it) => {
        const hay = norm(`${it.title} ${it.group}`)
        const direct = words.every((w) => hay.includes(w))
        const hinted = expand.some((w) => hay.includes(w))
        return { it, score: direct ? 2 : hinted ? 1 : 0 }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.it)
  }, [q, items])

  const shown = q.trim() ? results : []

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!shown.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(shown.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const it = shown[cursor]
      if (it) window.location.href = it.href
    }
  }

  return (
    <div className="w-full rounded-[18px] bg-[#140b33]/75 p-[clamp(18px,2.2vw,24px)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_40px_80px_-40px_rgb(0_0_0/0.7)]">
      <label htmlFor={`${listId}-q`} className="block font-serif text-[clamp(19px,2vw,22px)] font-semibold leading-snug text-white">
        Що у вас сталося?
      </label>
      <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-white/55">Напишіть своїми словами — покажемо, хто з нас цим займається.</p>

      <div className="relative mt-4">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-white/45" />
        <input
          ref={inputRef}
          id={`${listId}-q`}
          type="text"
          inputMode="search"
          enterKeyHint="go"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setCursor(0)
          }}
          onKeyDown={onKey}
          placeholder="Напр.: ТЦК, борг, закрити ТОВ"
          autoComplete="off"
          role="combobox"
          aria-expanded={shown.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full rounded-[12px] border-0 bg-white/[0.07] py-3.5 pl-11 pr-4 font-sans text-[15.5px] font-light text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] placeholder:text-white/40 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none"
        />
      </div>

      {q.trim() ? (
        <ul id={listId} role="listbox" aria-label="Знайдені послуги" className="m-0 mt-3 list-none p-0">
          {shown.length === 0 && (
            <li className="rounded-[10px] px-3 py-3 text-[14px] leading-snug text-white/60">
              Такої послуги в списку немає, але це не означає «ні».{' '}
              <a href="#contact" className="text-accent-soft underline underline-offset-2">
                Опишіть ситуацію
              </a>{' '}
              — підкажемо.
            </li>
          )}
          {shown.map((it, i) => (
            <li key={it.href} role="option" aria-selected={i === cursor}>
              <a
                href={it.href}
                onMouseEnter={() => setCursor(i)}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors ${i === cursor ? 'bg-white/[0.08]' : ''}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] leading-snug text-white">{it.title}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">{it.group}</span>
                </span>
                <Icon name="arrow" className={`size-[14px] shrink-0 ${i === cursor ? 'text-accent' : 'text-white/30'}`} />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Найчастіше звертаються</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {popular.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="inline-block h-9 max-w-full truncate rounded-full bg-white/[0.06] px-3.5 text-[13.5px] leading-9 text-white/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                {it.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
