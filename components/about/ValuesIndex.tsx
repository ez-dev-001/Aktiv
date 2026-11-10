'use client'

import { useId, useState } from 'react'
import { ValueIcon } from './ValueIcon'
import { useUi } from '@/components/site/LangProvider'

export interface ValueItem {
  title: string
  text: string
  icon?: string
}

/**
 * «Наші цінності» — варіант D з макетів (затверджено).
 *
 * Компʼютер (від 900px): ліворуч «покажчик» — назви великим серифом з
 * номерами, як зміст книжки; праворуч темна панель з текстом обраної
 * цінності. Наведення, фокус або клік перемикає панель, і велика іконка
 * в ній малюється заново (перемонтування через key → ValueIcon play).
 * Семантика — вкладки: tablist / tab / tabpanel.
 *
 * Телефон і планшет: акордеон без номерів і без іконок. Іконка
 * зʼявляється лише в розкритому пункті: колонка розсувається, знак
 * «вкручується», кільце й лінії прорисовуються; текст плавно
 * розкривається (висота через grid-rows 0fr → 1fr, прозорість, зсув).
 * Відкритий завжди один пункт. Стилі переходів — globals.css, блок
 * ValuesIndex.
 */
export function ValuesIndex({ values }: { values: ValueItem[] }) {
  const t = useUi()
  const [active, setActive] = useState(0)
  /* лічильник для повторного малювання іконки в панелі */
  const [round, setRound] = useState(0)
  const [open, setOpen] = useState<number | null>(0)
  const id = useId()

  const pick = (i: number) => {
    if (i === active) return
    setActive(i)
    setRound((r) => r + 1)
  }
  const cur = values[active] ?? values[0]
  if (!cur) return null

  return (
    <>
      {/* ── компʼютер ── */}
      <div className="hidden gap-[clamp(32px,5vw,80px)] min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div role="tablist" aria-label={t.about.valuesAria} aria-orientation="vertical" className="grid content-start border-t border-hair">
          {values.map((v, i) => {
            const on = i === active
            return (
              <button
                key={v.title}
                id={`${id}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${id}-panel`}
                tabIndex={on ? 0 : -1}
                onMouseEnter={() => pick(i)}
                onFocus={() => pick(i)}
                onClick={() => pick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + values.length) % values.length
                    document.getElementById(`${id}-tab-${n}`)?.focus()
                  }
                }}
                className={`grid cursor-pointer grid-cols-[48px_minmax(0,1fr)_40px] items-center gap-3 border-0 border-b border-solid border-hair bg-transparent py-[22px] text-left transition-colors duration-300 ${
                  on ? 'text-ink' : 'text-slate-2 hover:text-ink'
                }`}
              >
                <span className={` text-[13px] ${on ? 'text-accent-ink' : ''}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`font-serif text-[clamp(28px,3.2vw,44px)] leading-[1.1] tracking-[-0.015em] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                    on ? 'translate-x-2.5' : ''
                  }`}
                >
                  {v.title}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-[24px] text-accent transition-[opacity,transform] duration-300 ${on ? 'opacity-100' : '-translate-x-2.5 opacity-0'}`}
                >
                  →
                </span>
              </button>
            )
          })}
        </div>

        <div
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${active}`}
          className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-[28px] bg-ink p-[clamp(28px,3.4vw,44px)] text-white"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-[1] bg-[radial-gradient(60%_60%_at_80%_20%,rgb(250_33_99/0.22),transparent_70%)]"
          />
          {/* key = нова цінність → панель і іконка перемонтовуються й анімуються заново */}
          <div key={`${active}-${round}`} className="vx-panel flex flex-1 flex-col">
            {cur.icon && <ValueIcon name={cur.icon} dark play className="size-[132px]" />}
            <p className="m-0 mt-auto pt-8 font-serif text-[clamp(19px,1.8vw,22px)] leading-[1.5] text-white">{cur.text}</p>
            <span className="mt-[22px] text-[13px] text-accent-soft">
              {String(active + 1).padStart(2, '0')} / {String(values.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* ── телефон і планшет ── */}
      <div className="border-t border-hair min-[900px]:hidden">
        {values.map((v, i) => {
          const isOpen = open === i
          return (
            <div key={v.title} className={`vx-acc border-b border-hair ${isOpen ? 'is-open' : ''}`}>
              <h3 className="m-0">
                <button
                  type="button"
                  id={`${id}-acc-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-accp-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="vx-head w-full cursor-pointer border-0 bg-transparent py-4 text-left text-ink"
                >
                  <span className="vx-ic" aria-hidden="true">
                    {/* іконка є лише в розкритому пункті: монтується при відкритті й одразу малюється */}
                    {isOpen && v.icon && <ValueIcon name={v.icon} play className="size-[46px]" />}
                  </span>
                  <span className="vx-t font-serif text-[24px] font-normal leading-[1.15] tracking-[-0.01em]">{v.title}</span>
                  <span className="vx-pm" aria-hidden="true" />
                </button>
              </h3>
              <div id={`${id}-accp-${i}`} role="region" aria-labelledby={`${id}-acc-${i}`} aria-hidden={!isOpen} className="vx-body">
                <div className="overflow-hidden">
                  <p className="vx-text m-0 text-[15px] leading-[1.7] text-slate">{v.text}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
