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
  return (
    <>
      {r?.firstName ? `Дякуємо, ${r.firstName}.` : 'Дякуємо.'}
      <br />
      <em className="text-accent-ink">Заявку прийнято.</em>
    </>
  )
}

export function ThanksCard() {
  const r = useReceipt()
  if (!r || !r.firstName) return null
  const rows: [string, string][] = [
    ...(r.practiceTitle && r.practiceTitle !== 'Ще не знаю' ? ([['Напрям', r.practiceTitle]] as [string, string][]) : []),
    ['Надіслано', new Date(r.at).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })],
  ]
  return (
    <div className="thanks-rise rounded-[14px] bg-white p-[clamp(20px,2.6vw,28px)] shadow-[0_1px_2px_rgb(20_11_51/0.045),0_14px_34px_-20px_rgb(20_11_51/0.13)] [animation-delay:240ms]">
      <p className="m-0 mb-4 font-mono text-[10px] uppercase tracking-[0.13em] text-slate-2">Ваше звернення</p>
      <dl className="m-0 grid gap-3.5">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-0.5">
            <dt className="text-[12.5px] text-slate-2">{k}</dt>
            <dd className="m-0 text-[15px] leading-snug text-ink">
              {v}
            </dd>
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
    <ol className="m-0 mt-2 grid list-none gap-[clamp(12px,1.6vw,18px)] p-0 min-[860px]:grid-cols-3">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="thanks-rise flex flex-col gap-3 rounded-[14px] bg-white p-[clamp(20px,2.6vw,28px)] shadow-[inset_0_0_0_1px_var(--color-hair)]"
          style={{ animationDelay: `${320 + i * 90}ms` }}
        >
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent-ink">
            {String(i + 1).padStart(2, '0')} · {s.when}
          </span>
          <h2 className="m-0 text-[clamp(19px,2.4vw,23px)] leading-tight">{s.title}</h2>
          <p className="m-0 text-[14.5px] leading-relaxed text-slate">{s.text}</p>
        </li>
      ))}
    </ol>
  )
}
