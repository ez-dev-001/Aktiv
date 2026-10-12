'use client'

import { useEffect, useState } from 'react'
import { readReceipt } from '@/lib/leads/client'
import type { LeadReceipt } from '@/lib/leads/types'

/**
 * Персональная часть страницы «Дякуємо»: имя и что именно человек
 * отправил. Берётся из sessionStorage, куда её положила форма, — не из
 * адреса и не с сервера. Так в адресе нет ни имени, ни номера заявки,
 * и чужой человек по ссылке ничего не увидит.
 *
 * Зашли на /dyakuyemo напрямую — квитанции нет, и страница остаётся
 * общей: «Заявку прийнято», без имени. Не ошибкой.
 */

function useReceipt() {
  const [r, setR] = useState<LeadReceipt | null>(null)
  useEffect(() => setR(readReceipt()), [])
  return r
}

export function ThanksTitle() {
  const r = useReceipt()
  /* Імʼя — курсивом рожевим, як акцент заголовка на інших сторінках.
     Без квитанції — нейтральне «Дякуємо за звернення». */
  return r?.firstName ? (
    <>
      Дякуємо, <em className="text-accent-soft">{r.firstName}.</em>
    </>
  ) : (
    <>
      Дякуємо <em className="text-accent-soft">за звернення.</em>
    </>
  )
}

/**
 * «Ваше звернення» — напівпрозора картка на темному першому екрані.
 * З квитанцією: напрям і час надсилання. Без неї (зайшли напряму) —
 * лише те, що правда для будь-кого: коли чекати дзвінка і графік.
 */
export function ThanksCard({ hours }: { hours: string }) {
  const r = useReceipt()
  const rows: [string, string][] = []
  if (r?.firstName) {
    if (r.practiceTitle && r.practiceTitle !== 'Ще не знаю') rows.push(['Напрям', r.practiceTitle])
    rows.push(['Надіслано', new Date(r.at).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })])
  }
  rows.push(['Коли передзвонимо', STEPS[0]!.when])
  if (!r?.firstName) rows.push(['Графік', hours])
  return (
    <div className="thanks-rise rounded-[22px] bg-white/[0.05] p-[26px] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] [animation-delay:240ms]">
      <p className="m-0 mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-on-dark-2">Ваше звернення</p>
      <dl className="m-0 grid gap-3.5">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-on-dark-2">{k}</dt>
            <dd className="m-0 mt-[3px] font-serif text-[17px] font-semibold leading-[1.35] text-white">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ── Что дальше ── */

const STEPS = [
  {
    when: 'У робочий час — до 30 хвилин',
    title: 'Передзвонимо',
    text: 'Юрист уточнить обставини й домовиться про консультацію. Якщо заявка прийшла ввечері чи у вихідні — зранку наступного робочого дня.',
  },
  {
    when: 'Зручний для вас день',
    title: 'Консультація',
    text: 'Перша — без оплати, в офісі або онлайн. Візьміть документи, які є: договори, листування, рішення, витяги. Скани теж підійдуть.',
  },
  {
    when: 'Якщо шлях є',
    title: 'План дій і договір',
    text: 'Скажемо, що можна зробити, і домовимося про умови до підписання договору. Якщо перспективи немає — скажемо одразу.',
  },
]

export function ThanksSteps() {
  const steps = STEPS
  return (
    <ol className="m-0 mt-[22px] grid list-none gap-3 p-0 min-[860px]:grid-cols-3">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="thanks-rise flex flex-col items-start rounded-[20px] bg-white px-[22px] pb-[26px] pt-6 shadow-[inset_0_0_0_1px_var(--color-hair)]"
          style={{ animationDelay: `${320 + i * 90}ms` }}
        >
          <span aria-hidden="true" className="font-serif text-[44px] leading-none text-accent-ink">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h2 className="m-0 mt-4 font-serif text-[19px] font-semibold leading-[1.25] text-ink">{s.title}</h2>
          <p className="m-0 mt-2 text-[14.5px] leading-[1.6] text-slate">{s.text}</p>
          <span className="mt-auto pt-3.5">
            <span className="inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate shadow-[inset_0_0_0_1px_var(--color-hair)]">
              {s.when}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
