'use client'

import { useEffect, useState } from 'react'
import type { Heading } from './text'
import { useUi } from '@/components/site/LangProvider'

/**
 * Ліва колонка статті: зміст і «Поділитися».
 *
 * Зміст — звичайні якорі (працюють і без JS); на клієнті лише
 * підсвічується розділ, який зараз читають.
 */

const H4 = 'm-0 mb-2.5 text-[13px] font-medium text-slate'

export function Toc({ items }: { items: Heading[] }) {
  const t = useUi().post
  const [on, setOn] = useState(items[0]?.id)

  useEffect(() => {
    const els = items.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e)
    /* активний — останній заголовок, що вже піднявся до верхньої третини
       екрана. Слухаємо прокрутку, а не IntersectionObserver: при стрибку
       одразу на початок чи кінець сторінки той може не спрацювати. */
    let raf = 0
    const check = () => {
      raf = 0
      const line = window.innerHeight * 0.33
      let cur = items[0]?.id
      for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id
      setOn(cur)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [items])

  return (
    <nav aria-label={t.tocAria}>
      <p className={H4}>{t.tocTitle}</p>
      <ol className="m-0 grid list-none gap-0.5 p-0">
        {items.map((h, i) => {
          const active = h.id === on
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={active ? 'location' : undefined}
                className={`flex gap-2.5 py-2 text-[14.5px] leading-[1.4] transition-colors hover:text-ink ${
                  active ? 'font-semibold text-ink' : 'text-slate'
                }`}
              >
                <span className={`shrink-0 text-[13px] font-medium leading-[1.9] ${active ? 'text-accent-ink' : 'text-slate-2'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {h.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

const ROUND =
  'grid size-10 place-items-center rounded-full text-[13px] font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] transition-[background-color,color,box-shadow] hover:bg-ink hover:text-white hover:shadow-none'

export function Share({ url, title }: { url: string; title: string }) {
  const T = useUi()
  const t = T.post
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const links = [
    { k: 'TG', label: t.shareTelegram, href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(title)}` },
    { k: 'FB', label: t.shareFacebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { k: 'IN', label: t.shareLinkedIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* старий Safari або заборона доступу: виділяємо через textarea */
      const t = document.createElement('textarea')
      t.value = url
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p className={H4}>{t.share}</p>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((l) => (
          <a key={l.k} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className={ROUND}>
            {l.k}
          </a>
        ))}
        <button type="button" onClick={copy} aria-label={t.copyLink} className={`${ROUND} cursor-pointer`}>
          {copied ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
              <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
            </svg>
          )}
        </button>
        <span aria-live="polite" className={`text-[12.5px] text-accent-ink ${copied ? '' : 'sr-only'}`}>
          {copied ? T.common.copied : ''}
        </span>
      </div>
    </div>
  )
}
