'use client'

import { useEffect, useRef, useState } from 'react'
import { contacts as staticContacts } from '@/lib/content'
import type { Contacts } from '@/lib/sanity/content'
import { trackMessenger, trackPhone } from '@/lib/analytics'
import { Icon } from './Icon'
import { LogoMark } from './Logo'
import { useUi } from '@/components/site/LangProvider'

/**
 * Плавающий блок действий: связь + «наверх».
 *
 * На старом сайте здесь висел один красный кружок с телефоном,
 * прибитый к правому нижнему углу и перекрывавший контент на телефоне.
 * Здесь то же место, но:
 *
 *  • блок прячется, когда форма заявки в кадре — незачем дублировать CTA,
 *    который уже перед глазами; на главной — и пока виден первый экран;
 *  • «наверх» появляется только после полутора экранов прокрутки;
 *  • все отступы считаются от env(safe-area-inset-bottom), иначе на
 *    айфонах с жестовой панелью кнопка уезжает под неё;
 *  • цель нажатия у каждого элемента ≥ 48 px даже там, где сама
 *    кнопка выглядит меньше.
 *
 * Кнопка «наверх» — знак «АКТИВ», повёрнутый стрелкой вверх.
 * Тот же контур, что в шапке: у логотипа уже есть стрелка,
 * рисовать вторую было бы странно.
 */

type Channel = 'viber' | 'telegram' | 'whatsapp'

export function FloatingActions({
  contacts = staticContacts,
  desktopOnly = false,
}: {
  contacts?: Contacts
  /** на телефоні й планшеті замість кружка — липка панель MobileDock */
  desktopOnly?: boolean
}) {
  const t = useUi().floating
  const [open, setOpen] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [inHero, setInHero] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  /* «наверх» после 1.5 экранов */
  useEffect(() => {
    let raf = 0
    /* На головній перший екран уже має обидві дії — «Розповісти про
       справу» і телефон. Кружок поверх нього лише дублював їх і на
       телефоні перекривав «Обрати напрям». Тому він зʼявляється, коли
       перший екран майже прокручено. На інших сторінках #hero немає. */
    const hero = document.getElementById('hero')
    const paint = () => {
      raf = 0
      setShowTop(window.scrollY > window.innerHeight * 1.5)
      setInHero(!!hero && hero.getBoundingClientRect().bottom > window.innerHeight * 0.35)
    }
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', tick, { passive: true })
    return () => {
      window.removeEventListener('scroll', tick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  /* прячемся, когда форма заявки в кадре */
  useEffect(() => {
    const target = document.getElementById('contact')
    if (!target || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return
        setHidden(e.isIntersecting)
        if (e.isIntersecting) setOpen(false)
      },
      { rootMargin: '-25% 0px -10% 0px' },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [])

  /* Escape и клик мимо */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const items: { label: string; href: string; icon: 'phone' | 'message'; on: () => void }[] = [
    { label: t.call, href: contacts.phoneHref, icon: 'phone', on: () => trackPhone('floating') },
    ...contacts.messengers.map((m) => ({
      label: m.label,
      href: m.href,
      icon: 'message' as const,
      on: () => trackMessenger(m.label.toLowerCase() as Channel, 'floating'),
    })),
  ]

  return (
    <div
      ref={box}
      data-hidden={hidden || inHero}
      /* собственное имя перехода: блок связи живёт поверх страниц
         и не должен уезжать вместе с содержимым при переходе */
      style={{ viewTransitionName: 'site-actions' }}
      className={`${desktopOnly ? 'max-[999px]:hidden ' : ''}pointer-events-none fixed right-[max(16px,env(safe-area-inset-right,0px))] bottom-[max(16px,env(safe-area-inset-bottom,0px))] z-[70] flex flex-col items-end gap-2.5 transition-[opacity,transform] duration-300 data-[hidden=true]:pointer-events-none data-[hidden=true]:translate-y-3 data-[hidden=true]:opacity-0 sm:right-[max(24px,env(safe-area-inset-right,0px))] sm:bottom-[max(24px,env(safe-area-inset-bottom,0px))]`}
    >
      {/* ── наверх ── */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t.toTop}
        data-show={showTop && !open}
        className="pointer-events-auto grid size-12 place-items-center rounded-full border-0 bg-white/90 shadow-[0_2px_10px_-2px_rgb(11_7_16/0.14),inset_0_0_0_1px_var(--color-hair)] backdrop-blur-sm transition-[opacity,transform,box-shadow] duration-300 hover:shadow-[0_4px_16px_-2px_rgb(11_7_16/0.2),inset_0_0_0_1px_var(--color-accent)] data-[show=false]:pointer-events-none data-[show=false]:translate-y-2 data-[show=false]:scale-90 data-[show=false]:opacity-0"
      >
        <LogoMark className="h-[15px] w-[20px] -rotate-90 text-accent" />
      </button>

      {/* ── каналы связи ── */}
      <div
        id="floating-channels"
        role="group"
        aria-label={t.group}
        data-open={open}
        className="group pointer-events-none flex flex-col items-end gap-2"
      >
        {items.map((it, i) => (
          <a
            key={it.label}
            href={it.href}
            onClick={() => {
              it.on()
              setOpen(false)
            }}
            tabIndex={open ? 0 : -1}
            aria-hidden={!open}
            style={{ transitionDelay: open ? `${i * 35}ms` : '0ms' }}
            className="pointer-events-auto flex min-h-12 items-center gap-2.5 rounded-full bg-white py-2.5 pl-4 pr-3.5 shadow-[0_2px_12px_-2px_rgb(11_7_16/0.16),inset_0_0_0_1px_var(--color-hair)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(.22,1,.36,1)] hover:shadow-[0_2px_12px_-2px_rgb(11_7_16/0.2),inset_0_0_0_1px_var(--color-accent)] group-data-[open=false]:pointer-events-none group-data-[open=false]:translate-y-3 group-data-[open=false]:scale-95 group-data-[open=false]:opacity-0"
          >
            <span className="whitespace-nowrap font-sans text-[14px] font-medium text-ink">{it.label}</span>
            <Icon name={it.icon} className="size-[18px] shrink-0 text-accent" />
          </a>
        ))}
      </div>

      {/* ── переключатель ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="floating-channels"
        aria-label={open ? t.close : t.open}
        className="pointer-events-auto grid size-14 place-items-center rounded-full border-0 bg-accent text-white transition-[background-color,transform,box-shadow] duration-200 hover:bg-accent-ink active:scale-95"
      >
        <span className="relative grid size-6 place-items-center">
          <Icon
            name="message"
            className={`absolute size-6 transition-[opacity,transform] duration-[240ms] ${
              open ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'
            }`}
          />
          <Icon
            name="close"
            className={`absolute size-[22px] transition-[opacity,transform] duration-[240ms] ${
              open ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'
            }`}
          />
        </span>
      </button>
    </div>
  )
}
