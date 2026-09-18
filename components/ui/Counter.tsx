'use client'

import { useEffect, useRef } from 'react'

const nf = new Intl.NumberFormat('uk-UA')

/**
 * Счётчик, который считает.
 *
 * На старом сайте здесь стоял odometer: в разметке data-count="400",
 * на экране «89+», а на длинных числах «81,808080» — служебный
 * <span class="odometer-digit-spacer">8</span> оставался видимым,
 * потому что тема грузила odometer-theme-default.css, а класс на
 * элементах был odometer-auto-theme.
 *
 * Здесь в DOM пишется одно число, а не столбик разрядов, поэтому тот
 * баг невоспроизводим в принципе. Запуск один раз при входе в вьюпорт.
 * Если значение уже видно при загрузке — показывается финальное.
 */
export function Counter({ to, duration = 1500 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.textContent = '0'
    let raf = 0
    let t0 = 0

    const step = (ts: number) => {
      if (!t0) t0 = ts
      const p = Math.min(1, (ts - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3) /* power3.out */
      el.textContent = nf.format(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else el.textContent = nf.format(to)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            raf = requestAnimationFrame(step)
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [to, duration])

  /* серверный рендер сразу даёт финальное значение: без JS цифра на месте */
  return <span ref={ref}>{nf.format(to)}</span>
}
