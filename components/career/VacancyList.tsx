'use client'

import { useMemo, useState } from 'react'
import type { Vacancy, VacancyDepartment } from '@/lib/content'
import { useUi } from '@/components/site/LangProvider'
import { Icon } from '@/components/site/Icon'
import { APPLY_EVENT } from './events'

/**
 * Список вакансий — старий формат (картки, що розгортаються), стиль головної.
 *
 * Свёрнутая вакансия — строка: посада и три метки (досвід, формат,
 * зайнятість). Этого хватает, чтобы за пять секунд понять «моё или
 * нет». Развёрнутая — «Кого шукаємо / Обовʼязки / Що пропонуємо»
 * тремя колонками и кнопка «Відгукнутися».
 *
 * Раскрытие — родной <details>: работает без JS, с клавиатуры и в
 * читалке экрана. Фильтр по направлению появляется, только когда
 * направлений больше одного.
 *
 * «Відгукнутися» не уводит на другую страницу: форма резюме ниже на
 * этой же, кнопка подставляет в неё посаду и прокручивает к ней.
 */
export function VacancyList({ vacancies }: { vacancies: Vacancy[] }) {
  const T = useUi()
  const t = T.career
  const [dept, setDept] = useState<VacancyDepartment | 'all'>('all')

  const depts = useMemo(() => {
    const m = new Map<VacancyDepartment, number>()
    for (const v of vacancies) m.set(v.department, (m.get(v.department) ?? 0) + 1)
    return [...m.entries()]
  }, [vacancies])

  const shown = dept === 'all' ? vacancies : vacancies.filter((v) => v.department === dept)

  function apply(title: string) {
    window.dispatchEvent(new CustomEvent(APPLY_EVENT, { detail: title }))
    document.getElementById('cv')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (vacancies.length === 0) {
    return (
      <div className="rounded-[20px] bg-white p-[clamp(22px,3vw,34px)] shadow-[inset_0_0_0_1px_var(--color-hair)]">
        <p className="m-0 font-serif text-[clamp(21px,2.6vw,26px)] font-normal leading-snug text-ink">
          {t.noneNowTitle}
        </p>
        <p className="m-0 mt-2 max-w-[56ch] text-[15px] leading-relaxed text-slate">
          {t.noneNowText}
        </p>
        <button
          type="button"
          onClick={() => apply(T.cv.other)}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border-0 bg-ink px-5 text-[14.5px] text-white"
        >
          {T.common.sendCv} <Icon name="arrow" className="size-[15px]" />
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {depts.length > 1 && (
        <div role="group" aria-label={t.deptAria} className="flex flex-wrap gap-2">
          {[['all', vacancies.length] as const, ...depts].map(([d, n]) => {
            const on = dept === d
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => setDept(d)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border-0 px-4 text-[13.5px] transition-colors ${
                  on ? 'bg-ink text-white' : 'bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-paper-2'
                }`}
              >
                {d === 'all' ? T.common.all : t.departments[d]}
                <span className={`font-mono text-[11px] tabular-nums ${on ? 'text-white/60' : 'text-slate-2'}`}>{n}</span>
              </button>
            )
          })}
        </div>
      )}

      <ul className="m-0 grid list-none gap-3 p-0">
        {shown.map((v) => {
          const meta = [v.experience, v.format && t.formats[v.format], v.employment && t.employment[v.employment]].filter(Boolean)
          const cols = [
            { t: t.weSeek, items: v.weSeek },
            { t: t.duties, items: v.duties },
            { t: t.weOffer, items: v.weOffer },
          ].filter((c) => c.items.length)
          return (
            <li key={v.slug}>
              <details className="vacancy group rounded-[20px] bg-white shadow-[inset_0_0_0_1px_var(--color-hair)] transition-shadow open:shadow-[0_1px_2px_rgb(20_11_51/0.05),0_18px_40px_-26px_rgb(20_11_51/0.3)]">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-[clamp(18px,2.4vw,26px)] [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="m-0 font-serif text-[clamp(20px,2.4vw,26px)] font-normal leading-[1.15] text-ink">{v.title}</h3>
                      {v.example && (
                        <span className="rounded-full bg-[#fbf3e3] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a5a0b]">
                          {t.example}
                        </span>
                      )}
                    </div>
                    {meta.length > 0 && (
                      <p className="m-0 mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-slate">
                        {meta.map((m, i) => (
                          <span key={m} className="flex items-center gap-2">
                            {i > 0 && <span aria-hidden="true" className="size-[3px] rounded-full bg-slate-2" />}
                            {m}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1px_var(--color-hair)] transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-accent-btn group-open:text-white group-open:shadow-none"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>

                <div className="vacancy-body border-t border-hair-soft px-[clamp(18px,2.4vw,26px)] pb-[clamp(20px,2.6vw,28px)] pt-5">
                  {v.summary && <p className="m-0 max-w-[68ch] text-[15.5px] leading-relaxed text-ink">{v.summary}</p>}
                  {cols.length > 0 && (
                    <div className={`mt-6 grid gap-6 ${cols.length === 3 ? 'min-[860px]:grid-cols-3' : cols.length === 2 ? 'min-[700px]:grid-cols-2' : ''}`}>
                      {cols.map((c) => (
                        <div key={c.t}>
                          <p className="m-0 mb-3 font-mono text-[10px] uppercase tracking-[0.13em] text-accent-ink">{c.t}</p>
                          <ul className="m-0 grid list-none gap-2.5 p-0">
                            {c.items.map((it) => (
                              <li key={it} className="grid grid-cols-[14px_1fr] gap-2 text-[14.5px] leading-snug text-slate">
                                <span aria-hidden="true" className="mt-[7px] size-[5px] rotate-45 bg-accent" />
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => apply(v.title)}
                    className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border-0 bg-accent-btn px-5 text-[14.5px] font-medium text-white transition-colors hover:bg-accent-btn-hover"
                  >
                    {t.apply}
                    <Icon name="arrow" className="size-[15px]" />
                  </button>
                </div>
              </details>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
