import { ICONS, isIconName, type IconName } from '@/lib/icons'

/**
 * Иконка. Пути и подписи живут в lib/icons.ts: 17 своих знаков под
 * практики фирмы плюс запас из Lucide под новые направления.
 *
 * Сетка 24×24, штрих 1.25, currentColor, без заливок — поэтому набор
 * одинаково читается на белом и на тёмном, на 22 и на 48 пикселях.
 * Рендерится на сервере инлайном: ни одного запроса.
 */

const WEIGHT: Partial<Record<IconName, number>> = { arrow: 1.6, caret: 1.8, close: 1.7, phone: 1.4, message: 1.4 }

export function Icon({
  name,
  className = 'size-6',
  ...rest
}: { name: IconName | string; className?: string } & React.SVGProps<SVGSVGElement>) {
  /* Значение приходит из Sanity строкой. Иконку могли удалить из набора
     или вписать руками — тогда её просто нет, а не падает страница. */
  if (!isIconName(name)) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={WEIGHT[name] ?? 1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {ICONS[name].d.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
