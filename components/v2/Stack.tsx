'use client'

import { Children, useEffect, useRef, type ReactNode } from 'react'

/**
 * Блоки головної «стопкою»: кожен наступний наїжджає на попередній.
 *
 * Блок прокручується як звичайно, доки його низ не дійде до низу
 * екрана, — тоді він прилипає (sticky з top = висота екрана − висота
 * блоку), і наступний виїжджає поверх нього. Так високі блоки
 * (практики, форма) показуються повністю, нічого не ріжеться.
 *
 * Поки наступний блок накриває поточний, поточний трохи зменшується й
 * темніє: --p від 0 до 1 рахується тут, сам вигляд — у globals.css
 * (.v2-stack).
 * Без JS (до гідратації) блоки просто йдуть один за одним.
 */
export function Stack({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const items = Array.from(root.current?.children ?? []) as HTMLElement[]
    let raf = 0

    const layout = () => {
      const vh = window.innerHeight
      items.forEach((el, i) => {
        // останній блок нікого не чекає — йому прилипати не треба
        el.style.top = i < items.length - 1 ? `${Math.min(0, vh - el.offsetHeight)}px` : ''
      })
      paint()
    }
    const paint = () => {
      raf = 0
      const vh = window.innerHeight
      items.forEach((el, i) => {
        const next = items[i + 1]
        const p = next ? Math.min(1, Math.max(0, (vh - next.getBoundingClientRect().top) / vh)) : 0
        el.style.setProperty('--p', p.toFixed(3))
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }

    const ro = new ResizeObserver(layout)
    items.forEach((el) => ro.observe(el))
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', layout)
    layout()
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', layout)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    /* темне тло під стопкою: коли блок відступає (меншає), по краях видно його, а не папір */
    <div ref={root} className="bg-ink">
      {Children.toArray(children)
        .filter(Boolean)
        .map((child, i) => (
          <div key={i} className="v2-stack" style={{ zIndex: i + 1 }}>
            {child}
            <span aria-hidden="true" className="v2-stack-shade" />
          </div>
        ))}
    </div>
  )
}
