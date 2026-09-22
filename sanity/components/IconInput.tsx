import { useMemo, useState } from 'react'
import { set, unset, type StringInputProps } from 'sanity'
import { ICONS, PICKABLE_ICONS, isIconName, type IconName } from '../../lib/icons'

/**
 * Выбор иконки в студии: сетка самих знаков, а не выпадающий список
 * из слов «court», «deed», «ip». По слову не угадать, как знак
 * выглядит, и редактор выбирал наугад, а потом шёл смотреть на сайт.
 *
 * Сверху поиск по подписи («суд», «спадщ», «IT»). Щелчок по выбранной
 * иконке снимает выбор. Значение в документе — прежняя строка-ключ,
 * так что старые документы открываются без миграции.
 *
 * Стили — переменные темы студии (--card-*), поэтому сетка одинаково
 * читается в светлой и тёмной теме.
 */

function Glyph({ name, size = 26 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name].d.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

export function IconInput(props: StringInputProps) {
  const { value, onChange, readOnly, elementProps } = props
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PICKABLE_ICONS
    return PICKABLE_ICONS.filter((k) => ICONS[k].label.toLowerCase().includes(q) || k.includes(q))
  }, [query])

  const current = isIconName(value) ? value : null

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 36 }}>
        {current ? (
          <>
            <span style={{ color: 'var(--card-fg-color)' }}>
              <Glyph name={current} size={32} />
            </span>
            <span style={{ fontSize: 14, color: 'var(--card-fg-color)' }}>{ICONS[current].label}</span>
          </>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--card-muted-fg-color)' }}>
            {value ? `Іконки «${value}» немає в наборі — оберіть іншу` : 'Іконку не обрано'}
          </span>
        )}
        <input
          {...elementProps}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Пошук: суд, договір, спадщина…"
          style={{
            marginLeft: 'auto',
            width: 240,
            maxWidth: '50%',
            padding: '7px 10px',
            fontSize: 13,
            borderRadius: 4,
            border: '1px solid var(--card-border-color)',
            background: 'var(--card-bg-color)',
            color: 'var(--card-fg-color)',
          }}
        />
      </div>

      <div
        role="listbox"
        aria-label="Іконки"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 6 }}
      >
        {list.map((k) => {
          const selected = k === current
          return (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={selected}
              title={ICONS[k].label}
              disabled={readOnly}
              onClick={() => onChange(selected ? unset() : set(k))}
              style={{
                display: 'grid',
                justifyItems: 'center',
                gap: 6,
                padding: '10px 4px 8px',
                borderRadius: 6,
                cursor: readOnly ? 'default' : 'pointer',
                border: selected ? '2px solid var(--card-focus-ring-color, #2276fc)' : '1px solid var(--card-border-color)',
                background: selected ? 'var(--card-code-bg-color, transparent)' : 'transparent',
                color: 'var(--card-fg-color)',
              }}
            >
              <Glyph name={k} />
              <span
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.25,
                  textAlign: 'center',
                  color: 'var(--card-muted-fg-color)',
                }}
              >
                {ICONS[k].label}
              </span>
            </button>
          )
        })}
        {list.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--card-muted-fg-color)' }}>Нічого не знайдено</span>
        )}
      </div>
    </div>
  )
}
