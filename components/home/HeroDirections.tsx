'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/site/Icon'

/**
 * Напрями на першому екрані — замість портрета.
 *
 * ── Ідея ──
 * Першому екрану юрфірми не потрібна ще одна фотографія: людина
 * приходить з конкретною бідою і шукає, чи беруться за таке. Тому праворуч
 * стоять самі напрями, і вони «дихають»: підсвітка по черзі проходить
 * рядками, а тонка смуга в активному рядку показує, скільки лишилось до
 * наступного. Око ловить рух і читає напрями один за одним, навіть не
 * прокручуючи сторінку. Клік веде одразу на сторінку напряму.
 *
 * Наведення мишею або фокус з клавіатури зупиняють прокрутку на тому
 * рядку, де людина є: підсвітка не має тікати з-під курсора.
 * При «зменшеному русі» в системі все стоїть, підсвічується лише рядок
 * під курсором.
 */

export interface HeroDirection {
  slug: string
  title: string
  icon: string
  count: number
}

const STEP = 2800

export function HeroDirections({ items }: { items: HeroDirection[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setStill(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (paused || still || items.length < 2) return
    const t = window.setTimeout(() => setActive((i) => (i + 1) % items.length), STEP)
    return () => window.clearTimeout(t)
  }, [active, paused, still, items.length])

  return (
    <nav
      aria-label="Напрями практики"
      className="w-full rounded-[18px] bg-[#140b33]/70 p-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_40px_80px_-40px_rgb(0_0_0/0.7)]"
      onMouseLeave={() => setPaused(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <p className="m-0 px-4 pb-2 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
        Чим ми займаємось
      </p>
      <ul className="m-0 list-none p-0">
        {items.map((d, i) => {
          const on = i === active
          return (
            <li key={d.slug}>
              <a
                href={`/practices/${d.slug}`}
                onMouseEnter={() => {
                  setActive(i)
                  setPaused(true)
                }}
                onFocus={() => {
                  setActive(i)
                  setPaused(true)
                }}
                aria-current={on ? 'true' : undefined}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-[12px] px-4 py-[clamp(13px,1.6vw,18px)] transition-colors duration-500 ${
                  on ? 'bg-white/[0.07]' : 'bg-transparent'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-3 left-0 w-[3px] origin-center rounded-full bg-accent transition-transform duration-500 ${
                    on ? 'scale-y-100' : 'scale-y-0'
                  }`}
                />
                <Icon
                  name={d.icon}
                  className={`size-6 shrink-0 transition-colors duration-500 ${on ? 'text-accent' : 'text-white/35'}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block font-serif text-[clamp(18px,1.9vw,22px)] font-semibold leading-tight transition-colors duration-500 ${
                      on ? 'text-white' : 'text-white/60'
                    }`}
                  >
                    {d.title}
                  </span>
                  <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/40">
                    {d.count} {d.count % 10 === 1 && d.count % 100 !== 11 ? 'послуга' : [2, 3, 4].includes(d.count % 10) && ![12, 13, 14].includes(d.count % 100) ? 'послуги' : 'послуг'}
                  </span>
                </span>
                <Icon
                  name="arrow"
                  className={`size-4 shrink-0 transition-[transform,color] duration-500 ${
                    on ? 'translate-x-0 text-accent' : '-translate-x-1 text-white/25'
                  }`}
                />
                {/* Скільки лишилось до наступного рядка. key перезапускає
                    анімацію щоразу, коли рядок стає активним. */}
                {on && !paused && !still && items.length > 1 && (
                  <span
                    key={`p${active}`}
                    aria-hidden="true"
                    className="hero-dir-progress absolute inset-x-4 bottom-0 h-px origin-left bg-accent/70"
                    style={{ animationDuration: `${STEP}ms` }}
                  />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
