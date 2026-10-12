'use client'

import { useSyncExternalStore } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { useLangOptional } from '@/components/site/LangProvider'
import { DEFAULT_LOCALE, isLocale, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'

/**
 * 404 для всього сайту — обома мовами.
 *
 * Ця сторінка рендериться в кореневому layout, вище app/[lang], тож
 * параметра мови в неї немає. Мову беремо з адреси: /en/… — англійська,
 * решта — українська. На сервері адреси не видно, тому перший кадр
 * український, а після гідратації /en/… перемикається на англійську
 * (useSyncExternalStore робить це без помилки гідратації).
 */

const subscribe = () => () => {}
const langFromPath = () => {
  const first = window.location.pathname.split('/')[1] ?? ''
  return isLocale(first) ? first : DEFAULT_LOCALE
}

export default function NotFound() {
  const ctx = useLangOptional()
  const fromPath = useSyncExternalStore(subscribe, langFromPath, () => DEFAULT_LOCALE)
  const lang = ctx ?? fromPath
  const t = ui(lang).notFound

  return (
    <main className="grid min-h-[70vh] place-items-center px-[var(--gut)] py-24">
      <div className="max-w-[46ch]">
        <p className="eyebrow">404</p>
        <h1 className="text-[clamp(28px,5vw,44px)] leading-[1.08]">{t.title}</h1>
        <p className="lede mt-5 text-slate">{t.text}</p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <ButtonLink href={localeHref(lang, '/')} arrow>
            {t.home}
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/#practices')} variant="ghost">
            {t.practices}
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
