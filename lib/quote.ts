/**
 * quote.ts — движок расчёта вилки стоимости.
 *
 * Один модуль на две среды:
 *   • квиз на клиенте — показать вилку пользователю;
 *   • server action при записи лида — посчитать expectedValue заново.
 *
 * Клиенту нельзя верить: вилку, пришедшую из браузера, server action
 * не принимает, а пересчитывает из ответов той же функцией. Иначе
 * ожидаемая сумма сделки в CRM и value в Meta CAPI правятся из девтулзов.
 *
 * Коэффициенты НЕ живут в этом файле. Они приходят из Sanity (документ quiz),
 * поэтому менеджер меняет цены и веса без деплоя. Здесь только арифметика.
 */

export type PriceMode = 'fixed' | 'percent' | 'onRequest'

/** Один вариант ответа и его влияние на расчёт. */
export interface QuizOption {
  id: string
  /** Заменяет базу расчёта. Используется в первом вопросе. */
  base?: number
  /** Умножает накопленную базу. */
  factor?: number
  /** Прибавляется после умножения. */
  add?: number
  /** Переводит результат в процентную ветку — вилки не будет. */
  switchToPercent?: { percent: number; basisId: string }
  /** Чтобы результат не был голым числом: почему сумма такая. */
  reason?: string
}

export interface QuizStep {
  id: string
  options: QuizOption[]
}

export interface QuizConfig {
  id: string
  /** Практика, в которую пойдёт лид. */
  practice: string
  steps: QuizStep[]
  /** Нижняя и верхняя границы вилки от расчётной суммы. 0.85 / 1.3 по умолчанию. */
  spread: { low: number; high: number }
  /** Округление вилки вверх/вниз до кратного, ₴. */
  roundTo: number
  /** Ниже этой суммы не опускаемся, даже если коэффициенты дали меньше. */
  floor: number
}

export type Answers = Record<string, string>

export interface QuoteFixed {
  mode: 'fixed'
  low: number
  high: number
  /** Середина вилки. Именно она идёт в CRM и в value аналитики. */
  expected: number
  currency: 'UAH'
  reasons: string[]
  complete: boolean
}

export interface QuotePercent {
  mode: 'percent'
  percent: number
  basisId: string
  currency: 'UAH'
  reasons: string[]
  complete: boolean
  /** Процент от неизвестной суммы посчитать нельзя — сумму уточняет юрист. */
  expected: null
}

export type Quote = QuoteFixed | QuotePercent

const clampRound = (n: number, to: number, dir: 'down' | 'up') => {
  if (to <= 1) return Math.round(n)
  return dir === 'down' ? Math.floor(n / to) * to : Math.ceil(n / to) * to
}

/**
 * Считает вилку по ответам. Работает и на неполных ответах —
 * это нужно, чтобы показывать промежуточную оценку по ходу квиза.
 */
export function computeQuote(config: QuizConfig, answers: Answers): Quote {
  const reasons: string[] = []
  let base = 0
  let percentBranch: { percent: number; basisId: string } | null = null
  let answered = 0

  for (const step of config.steps) {
    const chosenId = answers[step.id]
    if (!chosenId) continue
    const opt = step.options.find((o) => o.id === chosenId)
    if (!opt) continue
    answered++

    if (typeof opt.base === 'number') base = opt.base
    if (typeof opt.factor === 'number') base *= opt.factor
    if (typeof opt.add === 'number') base += opt.add
    if (opt.switchToPercent) percentBranch = opt.switchToPercent
    if (opt.reason) reasons.push(opt.reason)
  }

  const complete = answered === config.steps.length

  if (percentBranch) {
    return {
      mode: 'percent',
      percent: percentBranch.percent,
      basisId: percentBranch.basisId,
      currency: 'UAH',
      reasons,
      complete,
      expected: null,
    }
  }

  const raw = Math.max(base, config.floor)
  const low = clampRound(raw * config.spread.low, config.roundTo, 'down')
  const high = clampRound(raw * config.spread.high, config.roundTo, 'up')

  return {
    mode: 'fixed',
    low: Math.max(low, config.floor),
    high: Math.max(high, low + config.roundTo),
    expected: Math.round((Math.max(low, config.floor) + high) / 2),
    currency: 'UAH',
    reasons,
    complete,
  }
}

/** Форматирование для UI. Локаль uk-UA, узкий пробел как разделитель разрядов. */
export const uah = (n: number) => new Intl.NumberFormat('uk-UA').format(n) + ' ₴'

export function formatQuote(q: Quote): string {
  if (q.mode === 'percent') return `${q.percent} % від суми стягнення`
  return q.low === q.high ? uah(q.low) : `${new Intl.NumberFormat('uk-UA').format(q.low)} – ${uah(q.high)}`
}

/**
 * Что уходит в лид. Вызывается ТОЛЬКО на сервере, после пересчёта.
 * Процентная ветка даёт expectedValue = null: в воронке такой лид
 * попадает в стадию с суммой «уточнюється», а не с нулём — иначе
 * средний чек в дашборде поедет вниз на каждом гонораре успеха.
 */
export function quoteToLead(config: QuizConfig, answers: Answers) {
  const q = computeQuote(config, answers)
  return {
    quizId: config.id,
    practice: config.practice,
    quizAnswers: answers,
    quizComplete: q.complete,
    priceMode: q.mode,
    expectedValue: q.mode === 'fixed' ? q.expected : null,
    expectedRange: q.mode === 'fixed' ? { low: q.low, high: q.high } : null,
    successFeePercent: q.mode === 'percent' ? q.percent : null,
    currency: 'UAH' as const,
  }
}
