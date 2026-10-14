'use client'

import { useState } from 'react'
import { useLang, useUi } from '@/components/site/LangProvider'
import { PracticeNote } from '@/components/site/PracticeNote'

/**
 * Сітка фахівців з фільтром за роллю.
 *
 * Фільтр будується з даних: група — з поля kind у Sanity (або, для
 * статики без kind, з тексту ролі). Показуються лише групи, де є люди,
 * а якщо група одна — фільтра немає зовсім: одна кнопка нічого не
 * фільтрує. Без JS видно всіх (стан за замовчуванням — «Усі»).
 *
 * Посилання «Профіль» з макета немає: сторінок профілю в проєкті нема.
 */

export interface Person {
  name: string
  /** підпис «які практики веде» (getTeam → practice) */
  practice?: string
  role: string
  group: Group
  /** вже з кропом 4:5 */
  photo?: string
}

export type Group = 'partner' | 'adv' | 'mil' | 'exec'

/* Підписи груп — lib/ui.ts → team.groups */
const ORDER: Group[] = ['partner', 'adv', 'mil', 'exec']

export function PeopleGrid({ people }: { people: Person[] }) {
  const T = useUi()
  const lang = useLang()
  const LABELS: Record<Group, string> = T.team.groups
  const [f, setF] = useState<Group | 'all'>('all')
  const groups = ORDER.filter((g) => people.some((p) => p.group === g))
  const showFilter = groups.length > 1

  return (
    <>
      {showFilter && (
        <div role="group" aria-label={T.team.filterAria} className="mb-[22px] flex flex-wrap gap-1.5">
          {(['all', ...groups] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={f === g}
              onClick={() => setF(g)}
              className="min-h-[38px] cursor-pointer rounded-full px-[15px] font-sans text-[13.5px] font-medium text-ink shadow-[inset_0_0_0_1px_#d9d1d6] transition-colors hover:shadow-[inset_0_0_0_1px_var(--color-ink)] aria-pressed:bg-ink aria-pressed:text-white aria-pressed:shadow-none"
            >
              {g === 'all' ? T.common.all : LABELS[g]}
            </button>
          ))}
        </div>
      )}

      <ul className="m-0 grid list-none grid-cols-2 gap-[clamp(12px,1.8vw,22px)] p-0 min-[700px]:grid-cols-3 min-[1060px]:grid-cols-4">
        {people.map((m) => (
          <li key={m.name} hidden={f !== 'all' && m.group !== f} className="flex min-w-0 flex-col">
            <div className="overflow-hidden rounded-[20px] bg-paper-2">
              {m.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.photo}
                  alt={m.name}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center font-serif text-[clamp(28px,4vw,44px)] font-semibold tracking-[0.02em] text-ink">
                  {initials(m.name)}
                </div>
              )}
            </div>
            <h3 className="m-0 mt-3.5 font-serif text-[15.5px] font-semibold leading-[1.25] text-ink min-[520px]:text-[clamp(16.5px,1.6vw,19px)]">
              {m.name}
            </h3>
            <p className="m-0 mt-1 text-[12.5px] leading-snug text-accent-ink min-[520px]:text-[13.5px]">{m.role}</p>
            {m.practice && (
              <div className="mt-3 flex flex-1 flex-col">
                <PracticeNote text={m.practice} lang={lang} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
