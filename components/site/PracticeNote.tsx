/**
 * Подпись под карточкой специалиста: какую практику он ведёт.
 *
 * Прижата к низу карточки (mt-auto), поэтому в ряду подписи стоят на
 * одной линии, даже если у соседа имя в две строки. Нет подписи — нет
 * и пустой линии: карточка просто заканчивается должностью.
 */
export function PracticeNote({ text, dark = false }: { text?: string; dark?: boolean }) {
  if (!text) return null
  return (
    <p
      className={`m-0 mt-auto flex items-start gap-2 border-t pt-3 text-[12px] leading-snug ${
        dark ? 'border-on-dark-hair text-on-dark' : 'border-hair-soft text-ink'
      }`}
    >
      <span aria-hidden="true" className="mt-[5px] size-[5px] shrink-0 rotate-45 bg-accent" />
      <span>
        <span className="sr-only">Практика: </span>
        {text}
      </span>
    </p>
  )
}
