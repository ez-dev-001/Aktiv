import type { LeadReceipt, LeadSource } from './types'

/**
 * Всё, что заявка хранит в браузере между страницами. Только
 * sessionStorage: вкладку закрыли — забыли. В localStorage ничего не
 * кладём: это не настройки посетителя, а след одного визита.
 *
 * Любое обращение к хранилищу обёрнуто в try/catch: в приватном режиме
 * Safari и при запрещённых cookie оно бросает исключение, и форма от
 * этого ломаться не должна.
 */

const ATTR = 'aktiv:attr'
const QUIZ = 'aktiv:quiz'
const RECEIPT = 'aktiv:receipt'
export const QUIZ_HANDOFF_EVENT = 'aktiv:quiz-handoff'

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* хранилище недоступно — просто без этого */
  }
}
function drop(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {}
}

/* ═══════════ ИСТОЧНИК ═══════════
   Первое касание за визит: откуда пришёл и куда попал. Запоминается на
   первой странице, а не на той, где форма, — иначе каждая заявка была
   бы «с главной», а метки рекламы терялись бы при первом же переходе. */

type Attribution = Omit<LeadSource, 'formLocation' | 'page'>
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const

export function captureAttribution() {
  if (typeof window === 'undefined' || read<Attribution>(ATTR)) return
  const url = new URL(window.location.href)
  const utm: Attribution['utm'] = {}
  for (const k of UTM_KEYS) {
    const v = url.searchParams.get(`utm_${k}`)
    if (v) utm[k] = v.slice(0, 120)
  }
  /* Реферер — только внешний: переход со своей же страницы ничего не говорит. */
  let referrer: string | undefined
  try {
    const r = document.referrer ? new URL(document.referrer) : null
    if (r && r.host !== window.location.host) referrer = r.host
  } catch {}
  write(ATTR, {
    landing: url.pathname,
    ...(referrer ? { referrer } : {}),
    ...(Object.keys(utm).length ? { utm } : {}),
  } satisfies Attribution)
}

export const readAttribution = () => read<Attribution>(ATTR) ?? {}

/* ═══════════ КАЛЬКУЛЯТОР → ФОРМА ═══════════
   Калькулятор стоит на страницах практик, форма — на главной. Ответы
   переезжают через sessionStorage; сумму форма НЕ передаёт — только
   ответы, а сервер пересчитывает сам (см. lib/quote.ts). */

export interface QuizHandoff {
  quizId: string
  practice: string
  /** slug категории — чтобы форма сама подставила направление */
  category?: string
  answers: Record<string, string>
  eventId: string | null
  /** только для показа в форме; в заявку не идёт */
  label: string
}

export function saveQuizHandoff(h: QuizHandoff) {
  write(QUIZ, h)
  window.dispatchEvent(new CustomEvent(QUIZ_HANDOFF_EVENT))
}
export const readQuizHandoff = () => read<QuizHandoff>(QUIZ)
export const clearQuizHandoff = () => drop(QUIZ)

/* ═══════════ СТРАНИЦА «ДЯКУЄМО» ═══════════
   Короткая квитанция: имя, направление, сумма. Без телефона и почты —
   их незачем показывать повторно и незачем хранить дольше отправки. */

export const saveReceipt = (r: LeadReceipt) => write(RECEIPT, r)
export const readReceipt = () => read<LeadReceipt>(RECEIPT)
