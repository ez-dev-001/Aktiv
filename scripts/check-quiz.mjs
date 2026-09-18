/* Проверка круга: статический конфиг → документ Sanity → проекция GROQ
   → обратная сборка → расчёт. Вилка обязана совпасть до гривны. */
import { quizzes, quizCopy, toQuizSet } from '../lib/quizzes.ts'
import { computeQuote } from '../lib/quote.ts'

const L = (ua) => (ua == null ? undefined : { ua })
const T = L

/* 1. как seed кладёт в Sanity */
const toDoc = (cfg) => {
  const copy = quizCopy[cfg.id]
  return {
    slug: { current: cfg.id },
    heading: L(copy?.heading), resultNote: T(copy?.disclaimer),
    spreadLow: cfg.spread.low, spreadHigh: cfg.spread.high,
    roundTo: cfg.roundTo, floor: cfg.floor,
    steps: cfg.steps.map((st) => ({
      id: { current: st.id },
      question: L(copy?.steps?.[st.id]?.q), hint: L(copy?.steps?.[st.id]?.hint),
      options: st.options.map((o) => ({
        id: { current: o.id }, label: L(copy?.steps?.[st.id]?.options?.[o.id]),
        base: o.base, factor: o.factor, add: o.add,
        successFeePercent: o.switchToPercent?.percent, reason: L(o.reason),
      })),
    })),
  }
}

/* 2. как GROQ это проецирует (QUIZZES_QUERY, coalesce -> .ua) */
const project = (d, practice) => ({
  id: d.slug.current, practice,
  heading: d.heading?.ua, disclaimer: d.resultNote?.ua,
  spreadLow: d.spreadLow, spreadHigh: d.spreadHigh, roundTo: d.roundTo, floor: d.floor,
  steps: d.steps.map((st) => ({
    id: st.id.current, q: st.question?.ua, hint: st.hint?.ua,
    options: st.options.map((o) => ({
      id: o.id.current, label: o.label?.ua,
      base: o.base, factor: o.factor, add: o.add,
      successFeePercent: o.successFeePercent, reason: o.reason?.ua,
    })),
  })),
})

/* 3. обратная сборка — НАСТОЯЩАЯ функция из lib/quizzes.ts, не копия:
      иначе проверка однажды начнёт проверять саму себя. */
const rebuild = (raw) => {
  const set = toQuizSet(raw)
  if (!set) throw new Error(`toQuizSet вернул null для ${raw.id}`)
  return set.config
}

let checked = 0, bad = 0
for (const cfg of Object.values(quizzes)) {
  const back = rebuild(project(toDoc(cfg), cfg.practice))

  /* все комбинации ответов */
  const combos = cfg.steps.reduce((acc, st) =>
    acc.flatMap((a) => st.options.map((o) => ({ ...a, [st.id]: o.id }))), [{}])

  for (const answers of combos) {
    const a = computeQuote(cfg, answers)
    const b = computeQuote(back, answers)
    checked++
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      bad++
      if (bad <= 3) {
        console.log('  РАСХОЖДЕНИЕ', cfg.id, JSON.stringify(answers))
        console.log('    статика:', JSON.stringify(a))
        console.log('    санити :', JSON.stringify(b))
      }
    }
  }
}
console.log(`\n  Круг «статика → Sanity → расчёт»: проверено ${checked} комбинаций ответов, расхождений ${bad}\n`)
process.exit(bad ? 1 : 0)
