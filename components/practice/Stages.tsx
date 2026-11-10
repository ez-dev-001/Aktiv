/**
 * Етапи роботи — шкала часу: на компʼютері горизонтальна лінія з
 * пронумерованими вузлами, на телефоні — вертикальна.
 */
export function StagesLine({ stages }: { stages: { title: string; text?: string; duration?: string }[] }) {
  const cols = Math.min(stages.length, 4)
  return (
    <ol
      className="relative m-0 grid list-none gap-0 p-0 min-[900px]:gap-x-[clamp(18px,2.4vw,32px)] min-[900px]:gap-y-12 min-[900px]:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      style={{ ['--cols' as string]: cols }}
    >
      {stages.map((s, i) => {
        const last = i === stages.length - 1
        return (
          <li key={`${i}-${s.title}`} className="relative grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 min-[900px]:block min-[900px]:pb-0">
            {/* лінія до наступного вузла */}
            {!last && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-[25.5px] top-[52px] w-px bg-accent/40 min-[900px]:bottom-auto min-[900px]:left-[60px] min-[900px]:right-[calc(-1*clamp(18px,2.4vw,32px))] min-[900px]:top-[25.5px] min-[900px]:h-px min-[900px]:w-auto "
              />
            )}
            <span className="relative z-[1] grid size-[52px] place-items-center rounded-full bg-ink text-[13px] text-white">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 pt-2.5 min-[900px]:pt-6">
              {s.duration && <p className="m-0 mb-1.5 text-[13px] text-accent-ink">{s.duration}</p>}
              <h3 className="m-0 font-serif text-[clamp(21px,2vw,25px)] font-normal leading-[1.18] text-ink">{s.title}</h3>
              {s.text && <p className="m-0 mt-2.5 max-w-[34ch] text-[14.5px] leading-[1.62] text-slate">{s.text}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
