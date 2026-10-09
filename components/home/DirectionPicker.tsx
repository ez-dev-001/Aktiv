'use client'

import { Icon } from '@/components/site/Icon'

/**
 * «Обрати напрям» на першому екрані.
 *
 * ── Що робить ──
 * Капсула з чотирма напрямами практики. Натиск на напрям плавно везе
 * сторінку вниз до блоку «З чим ми допомагаємо» і там одразу відкриває
 * саме цей напрям (подія CHOOSE_DIRECTION_EVENT, її слухає
 * PracticeExplorer). Людина не шукає свою тему вдруге — вона вже
 * відкрита, і підсвічується, щоб око зачепилось.
 *
 * Без JS це звичайні посилання на #practices: сторінка так само
 * перейде до блоку практик. Плавність дає `scroll-behavior: smooth`
 * (при «зменшеному русі» — миттєвий перехід, див. globals.css).
 *
 * У адресі після вибору зʼявляється #napryam-<slug>: таким посиланням
 * можна поділитися, і сторінка відкриється одразу на потрібному напрямі.
 */

export const CHOOSE_DIRECTION_EVENT = 'aktiv:choose-direction'

/** «Обрати напрям у формі заявки» — кнопка «Консультація з цього
 *  напряму» в блоці практик. Слухає LeadSection. */
export const CHOOSE_PRACTICE_EVENT = 'aktiv:choose-practice'

export interface Direction {
  slug: string
  title: string
  icon: string
}

export function DirectionPicker({ label, items }: { label: string; items: Direction[] }) {
  function choose(e: React.MouseEvent, slug: string) {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent(CHOOSE_DIRECTION_EVENT, { detail: slug }))
    const target = document.getElementById('practices')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
    history.replaceState(null, '', `#napryam-${slug}`)
  }

  return (
    <nav
      aria-label={label}
      className="dir-picker rounded-[22px] bg-white/[0.05] p-1.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] backdrop-blur-sm"
    >
      <p className="m-0 flex items-center gap-2 px-3 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
        {label}
        <svg viewBox="0 0 12 12" className="dir-picker-cue size-3 text-accent-soft" aria-hidden="true">
          <path d="M6 1.5v8M2.5 6.5 6 10l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </p>
      <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 min-[480px]:grid-cols-2">
        {items.map((d) => (
          <li key={d.slug} className="min-w-0">
            <a
              href="#practices"
              onClick={(e) => choose(e, d.slug)}
              className="group flex min-h-12 items-center gap-3 rounded-[16px] px-3 py-2 text-white/85 transition-[background-color,color] duration-200 hover:bg-white/[0.08] hover:text-white focus-visible:bg-white/[0.08]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-accent-soft transition-colors duration-200 group-hover:bg-accent-btn group-hover:text-white">
                <Icon name={d.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug">{d.title}</span>
              <Icon
                name="arrow"
                className="size-[14px] shrink-0 rotate-90 text-white/30 transition-[transform,color] duration-200 group-hover:translate-y-0.5 group-hover:text-accent-soft"
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
