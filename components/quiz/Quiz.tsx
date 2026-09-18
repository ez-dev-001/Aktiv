'use client'

import { useMemo, useRef, useState } from 'react'
import { computeQuote, formatQuote, type Answers, type QuizConfig } from '@/lib/quote'
import { staticQuizSets, type QuizSet } from '@/lib/quizzes'
import { newEventId, track } from '@/lib/analytics'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Button'

/**
 * Квиз-калькулятор.
 *
 * Считает тем же computeQuote, что и server action при записи лида.
 * Вилку из браузера сервер не принимает — пересчитывает из ответов,
 * иначе ожидаемая сумма сделки в CRM правится из девтулзов.
 *
 * Каждый шаг — событие в dataLayer. Повторный клик по тому же варианту
 * события не дублирует: проверка на изменение значения стоит до push.
 *
 * Конфиги приходят снаружи: из Sanity, если калькуляторы там заведены,
 * иначе из lib/quizzes.ts. Форма одна и та же, поэтому компонент
 * не знает про источник, а менеджер правит веса и цены без деплоя.
 */

const nf = new Intl.NumberFormat('uk-UA')

export function Quiz({ sets }: { sets?: QuizSet[] }) {
  /* Список нормализуем ДО хуков: пустой массив из Sanity не должен
     ни ронять компонент, ни приводить к раннему return — он бы
     оказался перед useMemo и сделал вызов хука условным. */
  const list = sets && sets.length > 0 ? sets : staticQuizSets
  const first = list[0]!

  const [key, setKey] = useState<string>(first.key)
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const started = useRef(false)
  const eventId = useRef<string | null>(null)

  /* Набор мог исчезнуть из Sanity, пока форма открыта, — тогда
     откатываемся на первый, а не падаем на undefined. */
  const set = list.find((s) => s.key === key) ?? first

  const cfg: QuizConfig = set.config
  const copy = set.copy
  const quote = useMemo(() => computeQuote(cfg, answers), [cfg, answers])
  const current = cfg.steps[step]!
  const stepCopy = copy.steps[current.id]!
  const chosen = answers[current.id]

  function switchQuiz(next: string) {
    if (next === key) return
    setKey(next)
    setAnswers({})
    setStep(0)
    setDone(false)
    started.current = false
    eventId.current = null
  }

  function choose(optId: string) {
    if (!started.current) {
      started.current = true
      eventId.current = newEventId('q')
      track('quiz_start', { quiz_id: cfg.id, practice: cfg.practice, event_id: eventId.current })
    }
    const changed = answers[current.id] !== optId
    setAnswers((a) => ({ ...a, [current.id]: optId }))
    if (changed) {
      track('quiz_step', {
        quiz_id: cfg.id,
        quiz_step_index: step + 1,
        quiz_step_id: current.id,
        quiz_answer_id: optId,
        quiz_answer_label: stepCopy.options[optId],
        event_id: eventId.current,
      })
    }
  }

  function next() {
    if (step === cfg.steps.length - 1) {
      const q = computeQuote(cfg, answers)
      track('quiz_complete', {
        quiz_id: cfg.id,
        practice: cfg.practice,
        price_mode: q.mode,
        currency: 'UAH',
        event_id: eventId.current,
        ...(q.mode === 'fixed'
          ? { value: q.expected, value_low: q.low, value_high: q.high }
          : { success_fee_percent: q.percent }),
      })
      setDone(true)
      return
    }
    setStep((s) => s + 1)
  }

  const progress = done ? 100 : (step / cfg.steps.length) * 100

  return (
    <div>
      {/* Вкладки строятся из самих наборов. Одного калькулятора
          достаточно — тогда переключать нечего и полосы вкладок нет. */}
      {list.length > 1 && (
        <div
          role="group"
          aria-label="Оберіть калькулятор"
          className="mb-[22px] grid gap-2.5 min-[560px]:grid-cols-2"
        >
          {list.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={key === s.key}
              onClick={() => switchQuiz(s.key)}
              className={`grid gap-1.5 rounded-[14px] border-0 p-5 text-left transition-[background-color,box-shadow] duration-200 ${
                key === s.key
                  ? 'bg-ink shadow-[inset_0_0_0_1px_var(--color-ink)]'
                  : 'bg-paper shadow-[inset_0_0_0_1px_var(--color-hair)] hover:shadow-[inset_0_0_0_1px_var(--color-slate-2)]'
              }`}
            >
              <span
                className={`font-serif text-[17.5px] font-semibold leading-tight ${key === s.key ? 'text-white' : 'text-ink'}`}
              >
                {s.tab.title}
              </span>
              <span
                className={`font-mono text-[10.5px] uppercase tracking-[0.09em] ${key === s.key ? 'text-accent-soft' : 'text-slate-2'}`}
              >
                {s.tab.note}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-[20px] bg-white p-[clamp(22px,3vw,34px)] shadow-[inset_0_0_0_1px_var(--color-hair-soft)]">
        {!done && (
          <>
            <div className="mb-[26px] flex items-center gap-3.5">
              <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-hair">
                <span
                  className="block h-full bg-accent transition-[width] duration-[420ms] ease-[cubic-bezier(.5,0,.2,1)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="whitespace-nowrap font-mono text-[10.5px] tracking-[0.1em] text-slate-2">
                Питання {step + 1} / {cfg.steps.length}
              </span>
            </div>

            <h3 className="text-[clamp(18px,2.2vw,22px)] leading-snug">{stepCopy.q}</h3>
            {stepCopy.hint && <p className="mt-2 text-sm text-slate-2">{stepCopy.hint}</p>}

            <div className="mt-[22px] grid gap-2.5">
              {current.options.map((o) => {
                const on = chosen === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => choose(o.id)}
                    className={`flex items-center gap-3.5 rounded-xl border-0 bg-paper p-[15px_18px] text-left font-sans text-[15.5px] font-normal leading-snug text-ink transition-shadow duration-200 ${
                      on
                        ? 'shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
                        : 'shadow-[inset_0_0_0_1px_var(--color-hair)] hover:shadow-[inset_0_0_0_1px_var(--color-slate-2)]'
                    }`}
                  >
                    <span
                      className={`size-[15px] shrink-0 rounded-full transition-[background-color,box-shadow] duration-200 ${
                        on
                          ? 'bg-accent shadow-[inset_0_0_0_1px_var(--color-accent),inset_0_0_0_4px_var(--color-paper)]'
                          : 'shadow-[inset_0_0_0_1px_var(--color-hair)]'
                      }`}
                    />
                    {stepCopy.options[o.id]}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  Назад
                </Button>
              )}
              <Button onClick={next} disabled={!chosen}>
                {step === cfg.steps.length - 1 ? 'Показати вилку' : 'Далі'}
              </Button>
            </div>
          </>
        )}

        {done && (
          <div>
            <Eyebrow plain>Оцінка вартості</Eyebrow>
            <h3 className="text-[clamp(18px,2.2vw,22px)] leading-snug">
              {quote.mode === 'percent' ? 'Ваш випадок — гонорар успіху' : 'Вилка по вашій ситуації'}
            </h3>

            {quote.mode === 'percent' ? (
              <>
                <p className="mt-1.5 font-serif text-[clamp(26px,4.4vw,38px)] font-semibold leading-none tracking-[-0.03em] text-accent-ink">
                  {quote.percent}&#8239;%
                  <span className="mt-2.5 block text-[0.44em] font-normal text-slate">від суми стягнення</span>
                </p>
                <p className="mt-3 font-mono text-xs tracking-[0.03em] text-slate-2">
                  Працює приватний виконавець · у лід іде <b className="font-medium text-ink">expectedValue: null</b>,
                  суму уточнює юрист
                </p>
              </>
            ) : (
              <>
                <p className="mt-1.5 font-serif text-[clamp(30px,5.6vw,50px)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-accent-ink">
                  {nf.format(quote.low)}&#8202;–&#8202;{nf.format(quote.high)}
                  <span className="ml-[0.22em] text-[0.5em] font-normal text-ink">₴</span>
                </p>
                <p className="mt-3 font-mono text-xs tracking-[0.03em] text-slate-2">
                  В лід як очікувана сума угоди піде середина вилки —{' '}
                  <b className="font-medium text-ink">{nf.format(quote.expected)} ₴</b>
                </p>
              </>
            )}

            <ul className="mt-[26px] grid list-none border-t border-hair p-0">
              {quote.reasons.map((r) => (
                <li key={r} className="grid grid-cols-[16px_1fr] gap-3 border-b border-hair-soft py-[11px] text-[14.5px] text-slate">
                  <span className="mt-[0.62em] size-[5px] rounded-full bg-accent" />
                  {r}
                </li>
              ))}
            </ul>

            <p className="mt-5 max-w-[52ch] text-[13.5px] leading-relaxed text-slate-2">{copy.disclaimer}</p>

            <div className="mt-[26px] grid gap-3.5 border-t-2 border-ink pt-[22px]">
              <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-slate-2">
                Далі — заявка з уже підставленою сумою
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  arrow
                  onClick={() => {
                    track('form_start', { form_location: 'quiz_result', practice: cfg.practice, event_id: eventId.current })
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  Отримати письмовий розрахунок
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAnswers({})
                    setStep(0)
                    setDone(false)
                    started.current = false
                    eventId.current = null
                  }}
                >
                  Пройти заново
                </Button>
              </div>
              <p className="m-0 font-mono text-[10.5px] tracking-[0.04em] text-slate-2">
                {formatQuote(quote)} · event_id {eventId.current}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
