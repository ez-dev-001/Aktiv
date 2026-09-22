import { formatQuote, quoteToLead } from '@/lib/quote'
import type { QuizSet } from '@/lib/quizzes'
import type { LeadQuote } from './types'

/**
 * Расчёт для заявки — только на сервере и только из ответов.
 *
 * Браузер присылает ответы калькулятора, но не сумму. Сумму сервер
 * считает заново той же функцией, что и калькулятор. Иначе ожидаемая
 * сумма сделки в CRM и value в Meta CAPI правились бы из девтулзов.
 *
 * Ответ, которого нет в калькуляторе, отбрасывается. Калькулятор,
 * которого нет, — расчёта в заявке не будет вовсе, заявка при этом
 * всё равно принимается: человек оставил телефон, это главное.
 */
export function buildLeadQuote(sets: QuizSet[], quizId: string, rawAnswers: unknown): LeadQuote | undefined {
  const set = sets.find((s) => s.config.id === quizId)
  if (!set || !rawAnswers || typeof rawAnswers !== 'object') return undefined

  const answers: Record<string, string> = {}
  for (const step of set.config.steps) {
    const v = (rawAnswers as Record<string, unknown>)[step.id]
    if (typeof v === 'string' && step.options.some((o) => o.id === v)) answers[step.id] = v
  }
  if (Object.keys(answers).length === 0) return undefined

  const lead = quoteToLead(set.config, answers)
  const breakdown = set.config.steps
    .filter((s) => answers[s.id])
    .map((s) => ({
      q: set.copy.steps[s.id]?.q ?? s.id,
      a: set.copy.steps[s.id]?.options[answers[s.id]!] ?? answers[s.id]!,
    }))

  const label =
    lead.priceMode === 'percent'
      ? `${lead.successFeePercent} % від суми стягнення`
      : formatQuote({ mode: 'fixed', low: lead.expectedRange!.low, high: lead.expectedRange!.high, expected: lead.expectedValue!, currency: 'UAH', reasons: [], complete: lead.quizComplete })

  return {
    quizId: set.config.id,
    practice: set.config.practice,
    answers,
    complete: lead.quizComplete,
    priceMode: lead.priceMode,
    expectedValue: lead.expectedValue,
    range: lead.expectedRange,
    successFeePercent: lead.successFeePercent,
    label,
    breakdown,
  }
}
