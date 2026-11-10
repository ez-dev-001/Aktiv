'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Category } from '@/lib/content'
import { Icon } from '@/components/site/Icon'
import { useUi } from '@/components/site/LangProvider'
import { ui } from '@/lib/ui'

/**
 * Выбор практики в форме заявки.
 *
 * ── Зачем свой список вместо <select> ──
 * Нативный select здесь проиграл по двум пунктам сразу.
 *
 * Первое — вид. Форма стоит на тёмной секции, а выпадающий список
 * рисует операционная система: на Windows это белая панель с синей
 * подсветкой строки, которая не имеет отношения ни к одному цвету
 * сайта. Стилизовать её нельзя — это часть системы, а не страницы.
 *
 * Второе — длина. Направлений больше трёх десятков. Пролистать их
 * в системном пикере можно только глазами; поиска там нет.
 *
 * ── Что здесь вместо него ──
 * Паттерн combobox из WAI-ARIA: кнопка-триггер с aria-expanded,
 * панель role="listbox", строки role="option" с aria-selected, поле
 * фильтра сверху. Клавиатура полная — стрелки, Home/End, Enter,
 * Escape. Значение уезжает в форму скрытым input, поэтому FormData
 * и серверный обработчик не знают, что select заменили.
 *
 * Мобильный не исключение: панель раскрывается на всю ширину поля,
 * высота ограничена, внутри — обычная прокрутка. Системный пикер на
 * телефоне удобнее для списка из пяти пунктов, но не из сорока.
 *
 * ── Не только практики ──
 * Тот же список стоит в форме резюме («Позиція»): две формы на сайте
 * с разными выпадашками выглядели бы как два разных сайта. Для
 * короткого списка поиск не нужен — он появляется сам, когда строк
 * больше восьми. Пустое значение показывает placeholder, как
 * «Оберіть позицію» у нативного select.
 */

export type PracticeOption = {
  /** значение, которое уедет в форму */
  value: string
  /** подпись в строке */
  label: string
  /** заголовок блока, к которому строка относится */
  group: string
  /** «напрям уточнимо» и «ще не знаю» — служебные строки, набраны иначе */
  soft: boolean
}

/** Разворачивает дерево направлений в плоский список строк панели. */
export function buildOptions(categories: Category[], lang = 'ua'): PracticeOption[] {
  const t = ui(lang).select
  const out: PracticeOption[] = [
    { value: 'unknown', label: t.notSure, group: '', soft: true },
  ]
  for (const c of categories) {
    out.push({
      value: `cat:${c.slug}`,
      label: t.tbd,
      group: c.title,
      soft: true,
    })
    for (const p of c.practices) {
      out.push({
        value: p.slug,
        label: p.title,
        group: c.title,
        soft: false,
      })
    }
  }
  return out
}

/** Нормализация для поиска: регистр и ' проще убрать, чем объяснять. */
const norm = (s: string) => s.toLowerCase().replace(/['’ʼ]/g, '')

export function PracticeSelect({
  options,
  value,
  onChange,
  name = 'practice',
  labelledBy,
  id,
  placeholder,
  searchable = options.length > 8,
  listLabel,
  invalid = false,
  describedBy,
}: {
  options: PracticeOption[]
  value: string
  onChange: (v: string) => void
  name?: string
  labelledBy?: string
  /** id кнопки — чтобы <label htmlFor> фокусировал поле */
  id?: string
  /** текст при пустом значении */
  placeholder?: string
  /** поле поиска в панели; по умолчанию — если строк больше восьми */
  searchable?: boolean
  /** подпись списка для читалки экрана */
  listLabel?: string
  invalid?: boolean
  describedBy?: string
}) {
  const t = useUi().select
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const queryRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const current = options.find((o) => o.value === value) ?? (placeholder ? undefined : options[0])

  /* Фильтр ищет и по названию строки, и по названию блока: «банкрут»
     находит и практику, и всё содержимое блока «Ліквідація та
     банкрутство». Служебные строки без блока (Ще не знаю) при
     непустом запросе прячутся — искать их незачем. */
  const shown = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return options
    return options.filter((o) => norm(o.label).includes(q) || norm(o.group).includes(q))
  }, [options, query])

  /* Курсор всегда внутри выдачи: после фильтрации список короче,
     и старый индекс мог указывать в пустоту. */
  useEffect(() => {
    setCursor((c) => (c < shown.length ? c : 0))
  }, [shown.length])

  /* При открытии курсор встаёт на выбранное, фокус — в поле поиска. */
  useEffect(() => {
    if (!open) return
    const i = shown.findIndex((o) => o.value === value)
    setCursor(i >= 0 ? i : 0)
    /* Без поиска фокус остаётся на кнопке: стрелки и Enter ловит её onKeyDown. */
    if (searchable) queryRef.current?.focus()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Строка под курсором подкручивается в видимую часть панели —
     иначе стрелками можно уехать за пределы прокрутки вслепую. */
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${cursor}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor, open])

  /* Закрытие по клику мимо и по уходу фокуса из блока. Второе важнее
     первого: Tab из поля поиска не порождает клика, а панель, повисшая
     открытой за спиной, ломает порядок обхода формы. */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Node | null
      /* body и html как цель фокуса — это НЕ уход в другое поле.
         Так браузер сообщает «окно снова активно, а фокуса ни на чём
         нет»: после переключения на другую программу и обратно, после
         клика по полосе прокрутки, после снятия скриншота. Раньше
         панель на этом закрывалась — человек возвращался к вкладке и
         обнаруживал, что список свернулся сам. Закрываем только когда
         фокус реально уехал на другой элемент вне блока. */
      if (!t || t === document.body || t === document.documentElement) return
      if (!rootRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('focusin', onFocus)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('focusin', onFocus)
    }
  }, [open])

  function pick(o: PracticeOption | undefined) {
    if (!o) return
    onChange(o.value)
    setOpen(false)
    setQuery('')
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(shown.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCursor(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCursor(shown.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(shown[cursor])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  /* Заголовок блока печатается перед первой строкой этого блока.
     Считается на лету по выдаче, а не по исходному списку: после
     фильтрации блок, из которого ничего не осталось, не должен
     оставить на экране осиротевший заголовок. */
  let lastGroup = ''

  return (
    <div ref={rootRef} className="relative min-w-0">
      {/* Значение для FormData: разметка формы не знает, что select заменён */}
      <input type="hidden" name={name} value={value} />

      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={
          'flex w-full items-center gap-3 rounded-[10px] border-0 bg-white/[0.055] px-4 py-3.5 text-left ' +
          'font-sans text-[15.5px] font-light text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] ' +
          'transition-shadow duration-200 focus:outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--color-accent)] ' +
          (open
            ? 'shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
            : invalid
              ? 'shadow-[inset_0_0_0_1.5px_var(--color-accent-soft)]'
              : '')
        }
      >
        <span className={`min-w-0 flex-1 truncate ${!current ? 'text-on-dark-2' : current.soft ? 'text-on-dark' : ''}`}>
          {current?.label ?? placeholder}
        </span>
        <Icon
          name="caret"
          aria-hidden="true"
          className={`size-3 shrink-0 text-accent-soft transition-transform duration-[260ms] ease-[cubic-bezier(.22,1,.36,1)] ${open ? '-rotate-180' : ''}`}
        />
      </button>

      {open && (
        /* Панель ШИРЕ поля, а не по его ширине.
           Поле стоит во второй колонке формы, это ~270px. Названия
           практик там рвались на четыре строки — «Альтернативна
           ліквідація — зміна директора і власників» становилось
           столбиком, и вилка цены уезжала к первой строке этого
           столбика. Панель — всплывающий слой, ей незачем подчиняться
           сетке формы: она растёт влево от правого края поля до 400px,
           и название укладывается в одну-две строки. На узком экране
           остаётся по ширине поля — там растить некуда. */
        <div
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] bg-ink-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.65),inset_0_0_0_1px_var(--color-on-dark-hair)] min-[560px]:left-auto min-[560px]:right-0 min-[560px]:w-[min(400px,calc(100vw-2.5rem))]"
        >
          {searchable && (
          <div className="border-b border-on-dark-hair p-2">
            <input
              ref={queryRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder={t.searchPh}
              aria-label={t.searchAria}
              autoComplete="off"
              className="w-full rounded-[7px] border-0 bg-white/[0.05] px-3 py-2.5 font-sans text-[14.5px] font-light text-white placeholder:text-on-dark-2 focus:outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
            />
          </div>
          )}

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={listLabel ?? t.listLabel}
            className={`m-0 max-h-[min(58vh,340px)] list-none overflow-y-auto overscroll-contain p-0 ${searchable ? '' : 'py-1.5'}`}
          >
            {shown.length === 0 && (
              <li className="px-4 py-5 text-[14px] text-on-dark-2">
                {t.empty}
              </li>
            )}
            {shown.map((o, i) => {
              const head = o.group && o.group !== lastGroup ? o.group : null
              lastGroup = o.group
              const active = i === cursor
              const picked = o.value === value
              return (
                <li key={o.value}>
                  {head && (
                    <p className="m-0 px-4 pb-1.5 pt-3.5 text-[9.5px] text-accent-soft">
                      {head}
                    </p>
                  )}
                  <button
                    type="button"
                    data-i={i}
                    role="option"
                    aria-selected={picked}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => pick(o)}
                    className={
                      'flex w-full items-baseline gap-3 border-0 px-4 py-2.5 text-left font-sans text-[14.5px] font-light transition-colors duration-150 ' +
                      (active ? 'bg-white/[0.07] text-white ' : 'bg-transparent ') +
                      (o.soft && !active ? 'text-on-dark-2 ' : active ? '' : 'text-on-dark ')
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[7px] size-[4px] shrink-0 rotate-45 transition-colors duration-150 ${picked ? 'bg-accent' : 'bg-transparent'}`}
                    />
                    <span className="min-w-0 flex-1">{o.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
