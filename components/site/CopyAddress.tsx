'use client'

import { useState } from 'react'
import { useUi } from '@/components/site/LangProvider'

/**
 * «Скопіювати адресу» — для таксі, навігатора, листа колезі.
 * Копирует полную строку с городом и офисом; две секунды показывает
 * «Скопійовано», потом возвращается. Нет доступа к буферу (старый
 * браузер, http) — кнопка просто не показывается.
 */
export function CopyAddress({ text, dark = false }: { text: string; dark?: boolean }) {
  const T = useUi()
  const t = T.map
  const [done, setDone] = useState(false)
  const [broken, setBroken] = useState(false)
  if (broken) return null
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          window.setTimeout(() => setDone(false), 2000)
        } catch {
          setBroken(true)
        }
      }}
      className={
        dark
          ? `inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent text-[13px] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] transition-[color,box-shadow] hover:text-white hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.4)] ${
              done ? 'px-3.5 text-accent-soft' : 'w-10 text-on-dark'
            }`
          : 'inline-flex min-h-9 items-center gap-1.5 rounded-full border-0 bg-transparent px-0 text-[13px] text-slate transition-colors hover:text-accent-ink'
      }
      aria-live="polite"
      title={dark ? t.copy : undefined}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {done ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
            <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
          </>
        )}
      </svg>
      {done ? T.common.copied : dark ? <span className="sr-only">{t.copy}</span> : t.copy}
    </button>
  )
}
