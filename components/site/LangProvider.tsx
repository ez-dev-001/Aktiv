'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { DEFAULT_LOCALE, HTML_LANG, asLocale, type Locale } from '@/lib/i18n'
import { ui, type Dict } from '@/lib/ui'

/**
 * Мова сторінки для клієнтських компонентів.
 *
 * Серверні компоненти отримують `lang` пропом зі сторінки й беруть
 * словник через `ui(lang)`. Клієнтським тягнути проп крізь усі шари
 * незручно (форма, банер cookie, шапка) — вони читають мову звідси.
 * Провайдер стоїть в app/[lang]/layout.tsx.
 *
 * Поза провайдером (корнева 404, /admin) — українська за замовчуванням.
 */

const LangCtx = createContext<Locale | null>(null)

export function LangProvider({ lang, children }: { lang: string; children: ReactNode }) {
  const l = asLocale(lang)
  /* <html lang> ставить скрипт у кореневому layout ще до першого кадру;
     тут — страховка для переходів без перезавантаження сторінки. */
  useEffect(() => {
    if (document.documentElement.lang !== HTML_LANG[l]) document.documentElement.lang = HTML_LANG[l]
  }, [l])
  return <LangCtx.Provider value={l}>{children}</LangCtx.Provider>
}

/** Мова поточної сторінки; null — компонент поза app/[lang]. */
export const useLangOptional = () => useContext(LangCtx)

/** Мова поточної сторінки ('ua' поза app/[lang]). */
export const useLang = (): Locale => useContext(LangCtx) ?? DEFAULT_LOCALE

/** Словник інтерфейсу для поточної мови. */
export const useUi = (): Dict => ui(useLang())
