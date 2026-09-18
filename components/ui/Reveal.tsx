'use client'

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

/**
 * Раскрытие заголовка clip-path маской.
 *
 * Текст открывает движущийся край, а не проявляющаяся прозрачность —
 * читается как печать, а не как «AI-презентация». Opacity не участвует.
 *
 * Важно: «заряжается» только то, что вне первого экрана. Что видно при
 * загрузке — остаётся видимым. Первый кадр страницы всегда читаемый,
 * и ничего не висит на opacity:0 в ожидании обсервера.
 */
export function Reveal({
  as: Tag = 'h2',
  className = '',
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return
    /* уже в первом экране — не трогаем */
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return

    el.dataset.armed = 'true'
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.in = 'true'
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`mask ${className}`}>
      {children}
    </Tag>
  )
}
